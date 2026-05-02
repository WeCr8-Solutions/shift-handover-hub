import { useState, useMemo } from "react";
import { useGcaBanks, useGcaQuestions, useGcaAdminMutations, type GcaBank } from "@/hooks/useGcaAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuestionEditor, type EditableQuestion } from "./shared/QuestionEditor";
import { MediaOverlayEditor } from "@/components/training/MediaOverlayEditor";
import { PublishReleaseDialog } from "./PublishReleaseDialog";
import { AttemptsReviewPanel } from "./AttemptsReviewPanel";
import { HandbookLinkInlineEditor } from "@/components/handbook/HandbookLinkInlineEditor";
import { Plus, Search, Save, Upload, AlertCircle, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface Props { isPlatformAdmin: boolean }

const EMPTY_BANK: Partial<GcaBank> = {
  slug: "",
  title: "",
  topic: "",
  difficulty: "beginner",
  passing_score_pct: 80,
  is_pro_only: false,
  is_published: false,
  sort_order: 0,
};

export function GcaProgramEditor({ isPlatformAdmin }: Props) {
  const { data: banks = [], isLoading } = useGcaBanks();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draftBank, setDraftBank] = useState<Partial<GcaBank> | null>(null);
  const m = useGcaAdminMutations();

  const filtered = useMemo(
    () => banks.filter((b) => !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.topic.toLowerCase().includes(search.toLowerCase())),
    [banks, search]
  );

  const selected = banks.find((b) => b.id === selectedId) ?? null;
  const editing = draftBank ?? selected ?? null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Left: bank list */}
      <Card className="md:col-span-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Question Banks ({banks.length})</CardTitle>
            {isPlatformAdmin && (
              <Button size="sm" variant="outline" onClick={() => { setDraftBank({ ...EMPTY_BANK }); setSelectedId(null); }} className="h-7 gap-1">
                <Plus className="w-3 h-3" /> New
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search banks..." className="h-8 pl-7 text-sm" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {isLoading && <div className="p-3 text-xs text-muted-foreground">Loading...</div>}
            {filtered.map((b) => (
              <button
                key={b.id}
                onClick={() => { setSelectedId(b.id); setDraftBank(null); }}
                className={`w-full text-left px-3 py-2 border-b hover:bg-muted/50 transition ${selectedId === b.id ? "bg-muted" : ""}`}
              >
                <div className="text-sm font-medium truncate">{b.title}</div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px] h-4">{b.topic}</Badge>
                  <Badge variant="secondary" className="text-[10px] h-4">{b.difficulty}</Badge>
                  {!b.is_published && <Badge variant="destructive" className="text-[10px] h-4">draft</Badge>}
                </div>
              </button>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right: detail */}
      <div className="md:col-span-2">
        {!editing ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Select a bank to edit</CardContent></Card>
        ) : (
          <BankDetail
            bank={editing}
            isNew={!selected}
            isPlatformAdmin={isPlatformAdmin}
            onChange={setDraftBank}
            onSaved={(saved) => { setSelectedId(saved.id); setDraftBank(null); }}
            mutations={m}
          />
        )}
      </div>
    </div>
  );
}

function BankDetail({
  bank, isNew, isPlatformAdmin, onChange, onSaved, mutations,
}: {
  bank: Partial<GcaBank>;
  isNew: boolean;
  isPlatformAdmin: boolean;
  onChange: (b: Partial<GcaBank>) => void;
  onSaved: (b: GcaBank) => void;
  mutations: ReturnType<typeof useGcaAdminMutations>;
}) {
  const { data: questions = [] } = useGcaQuestions(bank.id ?? null);
  const readOnly = !isPlatformAdmin;

  const handleSave = async () => {
    if (!bank.title || !bank.slug || !bank.topic) {
      toast.error("Title, slug, and topic are required");
      return;
    }
    const saved = await mutations.upsertBank.mutateAsync(bank as any);
    onSaved(saved as GcaBank);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2 flex-wrap">
          <span className="flex items-center gap-2">
            {isNew ? "New Bank" : bank.title}
            {bank.content_year && <Badge variant="outline" className="text-[10px]">Updated · {bank.content_year}</Badge>}
          </span>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={mutations.upsertBank.isPending} className="gap-1">
                <Save className="w-3.5 h-3.5" /> Save Bank
              </Button>
              {!isNew && bank.id && (
                <PublishReleaseDialog
                  program="GCA"
                  entityType="bank"
                  entityId={bank.id}
                  entityLabel={bank.title ?? null}
                  contentTable="gca_question_banks"
                />
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="questions" disabled={isNew}>Questions ({questions.length})</TabsTrigger>
            <TabsTrigger value="attempts" disabled={isNew} className="gap-1">
              <BarChart3 className="w-3 h-3" /> Attempts
            </TabsTrigger>
            <TabsTrigger value="import" disabled={isNew || readOnly}>Bulk Import</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Title</Label>
                <Input value={bank.title ?? ""} onChange={(e) => onChange({ ...bank, title: e.target.value })} disabled={readOnly} className="h-8" />
              </div>
              <div>
                <Label className="text-xs">Slug</Label>
                <Input value={bank.slug ?? ""} onChange={(e) => onChange({ ...bank, slug: e.target.value })} disabled={readOnly} className="h-8" />
              </div>
              <div>
                <Label className="text-xs">Topic</Label>
                <Input value={bank.topic ?? ""} onChange={(e) => onChange({ ...bank, topic: e.target.value })} disabled={readOnly} className="h-8" />
              </div>
              <div>
                <Label className="text-xs">Difficulty</Label>
                <Select value={bank.difficulty ?? "beginner"} onValueChange={(v) => onChange({ ...bank, difficulty: v as any })} disabled={readOnly}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Passing Score %</Label>
                <Input type="number" min={0} max={100} value={bank.passing_score_pct ?? 80} onChange={(e) => onChange({ ...bank, passing_score_pct: Number(e.target.value) })} disabled={readOnly} className="h-8" />
              </div>
              <div>
                <Label className="text-xs">Sort Order</Label>
                <Input type="number" value={bank.sort_order ?? 0} onChange={(e) => onChange({ ...bank, sort_order: Number(e.target.value) })} disabled={readOnly} className="h-8" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={bank.description ?? ""} onChange={(e) => onChange({ ...bank, description: e.target.value })} disabled={readOnly} rows={2} />
            </div>

            {!isNew && bank.id && (
              <MediaOverlayEditor
                entityType="gca_question_bank"
                entityId={bank.id}
                readOnly={readOnly}
                isPlatformAdmin={isPlatformAdmin}
                value={{
                  cover_media_id: bank.cover_media_id ?? null,
                  cover_overlay_text: bank.cover_overlay_text ?? null,
                  cover_overlay_opacity: bank.cover_overlay_opacity ?? null,
                  cover_overlay_position: bank.cover_overlay_position ?? null,
                  cover_overlay_text_color: bank.cover_overlay_text_color ?? null,
                }}
                onChange={(v) => onChange({ ...bank, ...v })}
              />
            )}

            {!isNew && bank.id && (
              <HandbookLinkInlineEditor
                entityType="gca_question_bank"
                entityIdOrKey={bank.id}
                readOnly={readOnly}
                title="Bank-level handbook references"
              />
            )}

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={!!bank.is_published} onCheckedChange={(v) => onChange({ ...bank, is_published: v })} disabled={readOnly} /> Published
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={!!bank.is_pro_only} onCheckedChange={(v) => onChange({ ...bank, is_pro_only: v })} disabled={readOnly} /> Pro only
              </label>
            </div>
            {!isNew && isPlatformAdmin && (
              <div className="pt-3 border-t">
                <Button variant="destructive" size="sm" onClick={() => bank.id && mutations.deleteBank.mutate(bank.id)}>Delete Bank</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="questions" className="mt-3 space-y-3">
            {!readOnly && (
              <Button size="sm" variant="outline" onClick={() =>
                bank.id && mutations.upsertQuestion.mutate({
                  bank_id: bank.id, prompt: "New question", question_type: "single_choice",
                  choices: [], correct_answers: [], points: 1, sort_order: questions.length,
                })
              } className="gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Question
              </Button>
            )}
            {questions.map((q) => (
              <QuestionEditor
                key={q.id}
                initial={q as EditableQuestion}
                readOnly={readOnly}
                saving={mutations.upsertQuestion.isPending}
                handbookEntityType="gca_question"
                onSave={(updated) => mutations.upsertQuestion.mutate({ ...updated, id: q.id, bank_id: q.bank_id } as any)}
                onDelete={() => mutations.deleteQuestion.mutate({ id: q.id, bank_id: q.bank_id })}
              />
            ))}
            {questions.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No questions yet</p>}
          </TabsContent>

          <TabsContent value="attempts" className="mt-3">
            {bank.id && <AttemptsReviewPanel program="gca" parentId={bank.id} />}
          </TabsContent>

          <TabsContent value="import" className="mt-3 space-y-3">
            <BulkImport bankId={bank.id!} onImport={(qs) => mutations.bulkInsertQuestions.mutate({ bankId: bank.id!, questions: qs })} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function BulkImport({ bankId, onImport }: { bankId: string; onImport: (qs: any[]) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    setError(null);
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Expected JSON array");
      onImport(parsed);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Paste JSON array of questions</Label>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} className="font-mono text-xs"
        placeholder='[{"question_type":"multiple_choice","prompt":"What is G01?","choices":["Rapid","Linear feed","Arc CW","Dwell"],"correct_answers":[1],"points":1}]' />
      {error && <div className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="w-3 h-3" /> {error}</div>}
      <Button size="sm" onClick={handleParse} disabled={!text.trim()} className="gap-1">
        <Upload className="w-3.5 h-3.5" /> Import
      </Button>
    </div>
  );
}
