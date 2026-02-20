/**
 * AdPlacement component for marketing pages.
 * Renders a styled container for Google AdSense or other ad networks.
 * Designed to blend with the page without being intrusive.
 */

interface AdPlacementProps {
  slot?: string;
  format?: "horizontal" | "rectangle" | "fluid";
  className?: string;
  label?: string;
}

export function AdPlacement({ 
  slot, 
  format = "horizontal", 
  className = "",
  label = "Sponsored"
}: AdPlacementProps) {
  const formatClasses = {
    horizontal: "min-h-[90px] max-h-[120px]",
    rectangle: "min-h-[250px] max-h-[300px]",
    fluid: "min-h-[100px]",
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1 text-center">
          {label}
        </div>
        <div
          className={`w-full rounded-lg bg-muted/30 border border-border/50 flex items-center justify-center overflow-hidden ${formatClasses[format]}`}
        >
          {/* Google AdSense auto ad unit — replace data-ad-slot with your actual slot ID */}
          <ins
            className="adsbygoogle block w-full h-full"
            style={{ display: "block" }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot={slot || "auto"}
            data-ad-format={format === "horizontal" ? "horizontal" : format === "rectangle" ? "rectangle" : "fluid"}
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </div>
  );
}
