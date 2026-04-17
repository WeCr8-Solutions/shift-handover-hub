import { useState, useMemo } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useOapEnrollments, type OapRoleProgram } from "@/hooks/useOapProgram";

interface CsvRow {
  email?: string;
  user_id?: string;
  expected_days?: string;
}

interface ParsedRow {
  email?: string;
  user_id?: string;
  expected_days: number;
  resolved_user_id?: string;
  status: "ok" | "missing" | "invalid";
  message?: string;
}

interface Props {
  programs: OapRoleProgram[];
  members: any[];
}

/**
 * Pro-tier bulk enroller. Accepts CSV with columns: email, user_id (optional), expected_days (optional).
 * Resolves emails to org members, then enrolls in batch.
 */
export function OapBulkEnrollDialog({ programs, members }: Props) {
  const { enroll } = useOapEnrollments();
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [programId, setProgramId] = useState("");
  const [defaultDays, setDefaultDays] = useState("30");
  const [busy, setBusy] = useState(false);

  const parsed = useMemo<ParsedRow[]>(() => {
    if (!csvText.trim()) return [];
    const result = Papa.parse<CsvRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });
    const memberByEmail = new Map<string, any>();
    const memberById = new Map<string, any>();
    for (const m of members ?? []) {
      if (m?.profile?.email) memberByEmail.set(m.profile.email.toLowerCase(), m);
      if (m?.user_id) memberById.set(m.user_id, m);
    }
    return (result.data ?? []).map((row): ParsedRow => {
      const email = row.email?.trim();
      const user_id = row.user_id?.trim();
      const days = Number(row.expected_days || defaultDays) || 30;

      if (!email && !user_id) {
        return {
          email,
          user_id,
          expected_days: days,
          status: "invalid",
          message: "Missing email and user_id",
        };
      }
      const matched =
        (user_id && memberById.get(user_id)) ||
        (email && memberByEmail.get(email.toLowerCase()));
      if (!matched) {
        return {
          email,
          user_id,
          expected_days: days,
          status: "missing",
          message: "Not in organization",
        };
      }
      return {
        email,
        user_id,
        expected_days: days,
        resolved_user_id: matched.user_id,
        status: "ok",
      };
    });
  }, [csvText, members, defaultDays]);

  const okCount = parsed.filter((r) => r.status === "ok").length;

  const runImport = async () => {
    if (!programId) {
      toast.error("Pick a role program");
      return;
    }
    if (!okCount) {
      toast.error("No valid rows to enroll");
      return;
    }
    setBusy(true);
    let successes = 0;
    let failures = 0;
    for (const row of parsed) {
      if (row.status !== "ok" || !row.resolved_user_id) continue;
      try {
        await new Promise<void>((resolve, reject) =>
          enroll.mutate(
            {
              user_id: row.resolved_user_id!,
              role_program_id: programId,
              expected_days: row.expected_days,
            },
            { onSuccess: () => resolve(), onError: (e) => reject(e) },
          ),
        );
        successes += 1;
      } catch {
        failures += 1;
      }
    }
    setBusy(false);
    toast.success(`Enrolled ${successes} operator${successes === 1 ? "" : "s"}${failures ? ` · ${failures} failed` : ""}`);
    if (failures === 0) {
      setOpen(false);
      setCsvText("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="w-4 h-4 mr-1" /> Bulk import (CSV)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Bulk enroll operators
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Paste CSV with columns: <code>email</code>,{" "}
            <code>expected_days</code> (optional). Operators must already be
            members of this organization.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Role program</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Default due (days)</Label>
              <Input
                type="number"
                min="1"
                value={defaultDays}
                onChange={(e) => setDefaultDays(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">CSV</Label>
            <Textarea
              rows={8}
              placeholder={"email,expected_days\noperator1@example.com,30\noperator2@example.com,45"}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          {parsed.length > 0 && (
            <div className="border rounded-md max-h-64 overflow-auto divide-y">
              <div className="px-3 py-2 text-xs flex items-center justify-between bg-muted/40">
                <span>{parsed.length} rows parsed</span>
                <span className="flex items-center gap-2">
                  <Badge variant="default">{okCount} ready</Badge>
                  {parsed.length - okCount > 0 && (
                    <Badge variant="destructive">
                      {parsed.length - okCount} skipped
                    </Badge>
                  )}
                </span>
              </div>
              {parsed.map((r, i) => (
                <div key={i} className="px-3 py-1.5 text-xs flex items-center justify-between gap-2">
                  <span className="truncate">
                    {r.email || r.user_id} · {r.expected_days}d
                  </span>
                  {r.status === "ok" ? (
                    <span className="text-success flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {r.message}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={runImport} disabled={busy || !okCount || !programId}>
              {busy ? "Enrolling…" : `Enroll ${okCount} operator${okCount === 1 ? "" : "s"}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
