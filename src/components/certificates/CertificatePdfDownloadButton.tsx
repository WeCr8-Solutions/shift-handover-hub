import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ConversionEvents } from "@/lib/analytics";

interface Props {
  /** ID of a DOM element that contains the rendered <CertificateTemplate />. */
  targetElementId: string;
  fileName: string;
  variantLabel?: string;
}

/**
 * Client-side PDF download for the certificate verification page.
 * Renders the visible certificate node to a high-DPI canvas, then drops it
 * into a Letter-size PDF at native resolution. Uses dynamic imports so the
 * 200KB+ html2canvas bundle is only loaded when the user clicks download.
 */
export function CertificatePdfDownloadButton({ targetElementId, fileName, variantLabel }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    const el = document.getElementById(targetElementId);
    if (!el) {
      toast.error("Certificate not ready yet — please retry in a moment.");
      return;
    }
    setBusy(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // US Letter landscape (11 x 8.5 in @ 72 DPI = 792 x 612 pt)
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Fit canvas inside page, preserving aspect.
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
      const drawW = canvas.width * ratio;
      const drawH = canvas.height * ratio;
      const offsetX = (pageW - drawW) / 2;
      const offsetY = (pageH - drawH) / 2;

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", offsetX, offsetY, drawW, drawH);
      pdf.save(fileName);
      ConversionEvents.pdfDownload(fileName, window.location.pathname, "certificate_verify");
      toast.success("Certificate PDF downloaded");

    } catch (e) {
      console.error("[CertificatePdfDownloadButton] failed:", e);
      toast.error("Could not generate PDF — try the Print option instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleDownload} disabled={busy}>
      {busy ? (
        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5 mr-1.5" />
      )}
      Download PDF{variantLabel ? ` (${variantLabel})` : ""}
    </Button>
  );
}
