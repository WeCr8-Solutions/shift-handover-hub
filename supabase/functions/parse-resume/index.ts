// supabase/functions/parse-resume/index.ts
// Downloads a resume (PDF or DOCX) from a URL and extracts structured fields
// via Lovable AI Gateway (Gemini) using tool-calling.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string", description: "Short professional headline (e.g. 'CNC Machinist · 8 yrs Mazak')" },
    bio: { type: "string", description: "2-4 sentence professional summary" },
    years_experience: { type: "number" },
    location_city: { type: "string" },
    location_region: { type: "string" },
    location_country: { type: "string" },
    linkedin_url: { type: "string" },
    portfolio_url: { type: "string" },
    contact_email: { type: "string" },
    contact_phone: { type: "string" },
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: { type: "string" },
          proficiency: { type: "string", enum: ["beginner", "intermediate", "advanced", "expert"] },
          years_used: { type: "number" },
        },
        required: ["skill"],
      },
    },
    machines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          machine_category: { type: "string", description: "e.g. CNC Mill, CNC Lathe, Grinder" },
          machine_make: { type: "string" },
          machine_model: { type: "string" },
          control_type: { type: "string", description: "e.g. Fanuc, Haas, Mazak Matrix, Siemens" },
          proficiency: { type: "string", enum: ["beginner", "intermediate", "advanced", "expert"] },
          years_experience: { type: "number" },
        },
        required: ["machine_category"],
      },
    },
    work_history: {
      type: "array",
      items: {
        type: "object",
        properties: {
          employer_name: { type: "string" },
          job_title: { type: "string" },
          start_date: { type: "string", description: "YYYY-MM-DD or YYYY-MM-01" },
          end_date: { type: "string", description: "YYYY-MM-DD or null if current" },
          is_current: { type: "boolean" },
          location: { type: "string" },
          description: { type: "string" },
        },
        required: ["employer_name", "job_title"],
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          school_name: { type: "string" },
          degree: { type: "string" },
          field_of_study: { type: "string" },
          start_date: { type: "string" },
          end_date: { type: "string" },
        },
        required: ["school_name"],
      },
    },
  },
};

async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  // Minimal DOCX text extraction: unzip and pull <w:t> contents from word/document.xml.
  const fflate = await import("https://esm.sh/fflate@0.8.2");
  const data = new Uint8Array(buffer);
  const unzipped = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    fflate.unzip(data, (err, out) => (err ? reject(err) : resolve(out)));
  });
  const docXml = unzipped["word/document.xml"];
  if (!docXml) return "";
  const xml = new TextDecoder().decode(docXml);
  const matches = xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? [];
  return matches
    .map((m) => m.replace(/<[^>]+>/g, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import("https://esm.sh/pdfjs-dist@4.10.38/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    disableFontFace: true,
    isEvalSupported: false,
    useWorkerFetch: false,
  });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = (content.items as Array<{ str?: string }>)
      .map((item) => item.str ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) {
      pages.push(pageText);
    }
  }

  return pages.join("\n").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // ── Auth: require a valid Supabase JWT ────────────────────────────────
    // Prevents unauthenticated SSRF + AI quota abuse against this function.
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: u, error: uErr } = await userClient.auth.getUser();
      if (uErr || !u?.user?.id) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { resumeUrl } = await req.json();
    if (!resumeUrl || typeof resumeUrl !== "string") {
      return new Response(JSON.stringify({ error: "resumeUrl required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── SSRF guard: only allow our own Supabase Storage origin ────────────
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(resumeUrl);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid resumeUrl" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const projectHost = (() => {
      try { return new URL(SUPABASE_URL).host; } catch { return ""; }
    })();
    const isHttps = parsedUrl.protocol === "https:";
    const isProjectStorage =
      !!projectHost &&
      parsedUrl.host === projectHost &&
      parsedUrl.pathname.startsWith("/storage/v1/");
    if (!isHttps || !isProjectStorage) {
      return new Response(
        JSON.stringify({ error: "resumeUrl must point to this project's Supabase Storage" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fileResp = await fetch(resumeUrl);
    if (!fileResp.ok) throw new Error(`Failed to fetch resume (${fileResp.status})`);
    const contentType = fileResp.headers.get("content-type") ?? "";
    const buffer = await fileResp.arrayBuffer();
    const isPdf = contentType.includes("pdf") || resumeUrl.toLowerCase().endsWith(".pdf");
    const isDocx = contentType.includes("officedocument") || resumeUrl.toLowerCase().endsWith(".docx");

    // Hard cap at 8MB to avoid OOM in the edge runtime.
    if (buffer.byteLength > 8 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Resume is larger than 8MB. Please upload a smaller PDF or DOCX." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let userContent: any;
    if (isPdf) {
      const text = await extractPdfText(buffer);
      if (!text) throw new Error("Could not extract text from PDF");
      userContent = `Extract structured profile fields from this resume text:\n\n${text.slice(0, 30000)}`;
    } else if (isDocx) {
      const text = await extractDocxText(buffer);
      if (!text) throw new Error("Could not extract text from DOCX");
      userContent = `Extract structured profile fields from this resume text:\n\n${text.slice(0, 30000)}`;
    } else {
      const text = new TextDecoder().decode(buffer).slice(0, 30000);
      userContent = `Extract structured profile fields from this resume text:\n\n${text}`;
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You parse manufacturing/CNC operator resumes. Extract every field you can confidently identify. Skip fields you cannot determine. Dates must be ISO YYYY-MM-DD (use the 1st of the month if only month/year given). Skills should be discrete tags, not sentences.",
          },
          { role: "user", content: userContent },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_resume_data",
            description: "Persist the extracted resume fields.",
            parameters: SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "save_resume_data" } },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again in a minute." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway ${aiResp.status}`);
    }

    const json = await aiResp.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("AI returned no structured data");
    }
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ ok: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-resume error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
