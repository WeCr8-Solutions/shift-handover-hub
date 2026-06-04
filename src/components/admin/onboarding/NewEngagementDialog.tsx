import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateEngagement, useOrgsForOnboarding } from "@/hooks/useOnboardingEngagements";

export function NewEngagementDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (engagementId: string) => void;
}) {
  const { data: orgs, isLoading } = useOrgsForOnboarding();
  const create = useCreateEngagement();
  const [orgId, setOrgId] = useState<string>("");
  const [tier, setTier] = useState<string>("standard");
  const [notes, setNotes] = useState<string>("");

  const submit = async () => {
    if (!orgId) return;
    const id = await create.mutateAsync({ organization_id: orgId, plan_tier: tier, notes });
    onOpenChange(false);
    setOrgId(""); setTier("standard"); setNotes("");
    onCreated?.(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New onboarding engagement</DialogTitle>
          <DialogDescription>
            Start a concierge setup for an existing organization. Customer login will be gated until you mark them ready for production.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Organization</Label>
            <Select value={orgId} onValueChange={setOrgId} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
              <SelectContent>
                {orgs?.map((o: any) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}{o.requires_us_person_declaration ? "  · ITAR" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Plan tier</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard ($1,500)</SelectItem>
                <SelectItem value="enterprise">Enterprise ($4,500)</SelectItem>
                <SelectItem value="complimentary">Complimentary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Scope, contacts, go-live target..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!orgId || create.isPending}>
            {create.isPending ? "Creating..." : "Create engagement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
