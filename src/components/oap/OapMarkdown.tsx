import ReactMarkdown from "react-markdown";

interface Props {
  source: string;
  className?: string;
}

/**
 * OAP-flavored markdown renderer. Embedded references like
 *   :tool[caliper-6in]
 *   :op[face-milling]
 *   :media[bucket/path.mp4]
 * could be expanded later via custom remark plugins; for now we render
 * GitHub-flavored markdown with sane defaults that match our design system.
 */
export function OapMarkdown({ source, className = "" }: Props) {
  return (
    <div
      className={
        "prose prose-sm dark:prose-invert max-w-none " +
        "prose-headings:font-semibold prose-headings:text-foreground " +
        "prose-p:text-foreground/90 prose-li:text-foreground/90 " +
        "prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:rounded " +
        "prose-a:text-primary " +
        className
      }
    >
      <ReactMarkdown>{source}</ReactMarkdown>
    </div>
  );
}
