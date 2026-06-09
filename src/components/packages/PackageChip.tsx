import { Link } from "react-router-dom";
import { Package as PackageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  packageId: string;
  packageNumber?: string | null;
  sequence?: number | null;
  className?: string;
}

/**
 * Tiny chip surfaced on queue cards / list rows when a work order belongs to
 * a package. Click navigates to the package detail.
 */
export function PackageChip({ packageId, packageNumber, sequence, className }: Props) {
  return (
    <Link
      to={`/packages/${packageId}`}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors",
        className,
      )}
      title={packageNumber ? `Part of package ${packageNumber}` : "Part of a package"}
    >
      <PackageIcon className="w-2.5 h-2.5" />
      <span className="truncate max-w-[80px]">{packageNumber ?? "PKG"}</span>
      {sequence != null && <span className="opacity-70">·{sequence}</span>}
    </Link>
  );
}
