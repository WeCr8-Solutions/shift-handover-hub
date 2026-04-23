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
      return json({ error: "Unauthorized" }, 401);
    }

    const { manual_id } = await req.json();
    if (!manual_id || typeof manual_id !== "string") {
      return json({ error: "manual_id required" }, 400);
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: manual, error: mErr } = await supabase
      .from("machine_manuals")
      .select("id, storage_path")
      .eq("id", manual_id)
      .single();
    if (mErr || !manual) throw new Error(mErr?.message || "Manual not found");

    const { data: file, error: dlErr } = await supabase.storage
      .from("machine-manuals")
      .download(manual.storage_path);
    if (dlErr || !file) throw new Error(dlErr?.message || "Download failed");

    const buf = new Uint8Array(await file.arrayBuffer());
    // Use unpdf which is a pure-JS, Deno-compatible pdfjs build (no canvas).
    const { extractText, getDocumentProxy } = await import(
      "https://esm.sh/unpdf@0.12.1"
    );
    const pdf = await getDocumentProxy(buf);
    const pageCount: number = pdf.numPages;

    const rows: { manual_id: string; page_number: number; text_content: string }[] = [];
    for (let i = 1; i <= pageCount; i++) {
      const { text } = await extractText(pdf, { mergePages: false, pages: [i] });
      const pageText = Array.isArray(text) ? (text[0] || "") : String(text || "");
      rows.push({ manual_id, page_number: i, text_content: pageText });
    }

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

    return json({ pages_extracted: pageCount, ocr_pages: 0 });
  } catch (e) {
    console.error("extract-manual-pages error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
