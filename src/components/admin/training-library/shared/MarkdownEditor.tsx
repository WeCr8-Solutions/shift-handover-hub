import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function MarkdownEditor({ value, onChange, placeholder, rows = 12 }: Props) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
      <TabsList className="h-8">
        <TabsTrigger value="edit" className="text-xs h-6">Edit</TabsTrigger>
        <TabsTrigger value="preview" className="text-xs h-6">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="edit" className="mt-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="font-mono text-sm"
        />
      </TabsContent>
      <TabsContent value="preview" className="mt-2">
        <div className="prose prose-sm dark:prose-invert max-w-none border rounded-md p-3 bg-muted/30 min-h-[200px]">
          {value ? <ReactMarkdown>{value}</ReactMarkdown> : <p className="text-muted-foreground italic">Nothing to preview</p>}
        </div>
      </TabsContent>
    </Tabs>
  );
}
