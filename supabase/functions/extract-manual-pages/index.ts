import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { manual_id } = await req.json();
    if (!manual_id || typeof manual_id !== "string") {
      return new Response(JSON.stringify({ error: "manual_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: manual, error: mErr } = await supabase
      .from("machine_manuals")
      .select("id, storage_path, page_count")
      .eq("id", manual_id)
      .single();
    if (mErr || !manual) throw new Error(mErr?.message || "Manual not found");

    const { data: file, error: dlErr } = await supabase.storage
      .from("machine-manuals")
      .download(manual.storage_path);
    if (dlErr || !file) throw new Error(dlErr?.message || "Download failed");

    // Lightweight text extraction using pdf-parse style approach (Deno-compatible).
    // We import pdfjs to read page text without rendering.
    const buf = new Uint8Array(await file.arrayBuffer());
    const pdfjs = await import("https://esm.sh/pdfjs-dist@4.0.379/legacy/build/pdf.mjs");
    // Disable worker (Deno has no Workers in functions)
    (pdfjs as any).GlobalWorkerOptions.workerSrc = "";

    const loadingTask = (pdfjs as any).getDocument({ data: buf, disableWorker: true });
    const pdf = await loadingTask.promise;
    const pageCount: number = pdf.numPages;

    const rows: { manual_id: string; page_number: number; text_content: string }[] = [];
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((it: any) => it.str).join(" ");
      rows.push({ manual_id, page_number: i, text_content: text });
    }

    // Insert in chunks of 100
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase
        .from("machine_manual_pages")
        .upsert(chunk, { onConflict: "manual_id,page_number" });
      if (error) throw new Error(error.message);
    }

    await supabase
      .from("machine_manuals")
      .update({ page_count: pageCount })
      .eq("id", manual_id);

    return new Response(
      JSON.stringify({ pages_extracted: pageCount, ocr_pages: 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("extract-manual-pages error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
