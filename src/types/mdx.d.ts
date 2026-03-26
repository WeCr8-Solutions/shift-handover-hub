declare module '*.mdx' {
  import type { ComponentType } from 'react';
  export const frontmatter: Record<string, string>;
  const MDXComponent: ComponentType;
  export default MDXComponent;
}
