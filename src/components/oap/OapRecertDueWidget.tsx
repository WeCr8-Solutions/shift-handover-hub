import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, ShieldCheck, Bell, Pause } from "lucide-react";
import { useOapEnrollments } from "@/hooks/useOapProgram";
import { useRecordRecertEvent } from "@/hooks/useOapRecert";
import { useOrganization } from "@/hooks/useOrganization";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";

const DAYS_AHEAD = 30;

/**
 * Surfaces operators whose OAP recert is due within the next 30 days (or already
 * past due) so employer admins can act in one click — send a reminder, mark
 * recertified, or suspend until they re-test.
 */
export function OapRecertDueWidget() {
  const { organization } = useOrganization();
  const { members } = useOrganizationMembers(organization?.id ?? null);
  const { enrollments } = useOapEnrollments();
  const record = useRecordRecertEvent();
  const [busyId, setBusyId] = useState<string | null>(null);

  const dueSoon = useMemo(() => {
    const now = Date.now();
    const horizon = now + DAYS_AHEAD * 24 * 60 * 60 * 1000;
    return enrollments
      .filter((e: any) => {
        if (e.lifecycle_status && e.lifecycle_status !== "active") return false;
        if (!e.next_recert_due) return false;
        const due = new Date(e.next_recert_due).getTime();
        return due <= horizon;
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.next_recert_due!).getTime() - new Date(b.next_recert_due!).getTime(),
      );
  }, [enrollments]);

  if (dueSoon.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="w-4 h-4" /> Recerts due (next {DAYS_AHEAD} days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            No operators are due for recertification in the next {DAYS_AHEAD} days. Nice work.
          </p>
        </CardContent>
      </Card>
    );
  }

  async function act(
    enrollment: any,
    eventType: "reminder_sent" | "recertified" | "suspended",
    newLifecycleStatus?: "active" | "suspended",
  ) {
    setBusyId(enrollment.id + ":" + eventType);
    try {
      await record.mutateAsync({
        enrollmentId: enrollment.id,
        organizationId: enrollment.organization_id,
        operatorUserId: enrollment.user_id,
        eventType,
        previousDue: enrollment.next_recert_due ?? null,
        newDue: eventType === "recertified" ? null : enrollment.next_recert_due ?? null,
        newLifecycleStatus,
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="w-4 h-4" /> Recerts due (next {DAYS_AHEAD} days)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {dueSoon.length} operator{dueSoon.length === 1 ? "" : "s"} need your attention.
        </p>
      </CardHeader>
      <CardContent className="divide-y border-t">
        {dueSoon.map((e: any) => {
          const m = (members ?? []).find((x: any) => x.user_id === e.user_id);
          const due = new Date(e.next_recert_due!);
          const isPast = due.getTime() < Date.now();
          return (
            <div key={e.id} className="py-2.5 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {m?.profile?.display_name || m?.profile?.email || e.user_id.slice(0, 8)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Due {due.toLocaleDateString()}{" "}
                  <Badge variant={isPast ? "destructive" : "secondary"} className="ml-1 text-[10px]">
                    {isPast ? "OVERDUE" : "soon"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === e.id + ":reminder_sent"}
                  onClick={() => act(e, "reminder_sent")}
                >
                  <Bell className="w-3.5 h-3.5 mr-1" /> Remind
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === e.id + ":recertified"}
                  onClick={() => act(e, "recertified", "active")}
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Recertified
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === e.id + ":suspended"}
                  onClick={() => act(e, "suspended", "suspended")}
                >
                  <Pause className="w-3.5 h-3.5 mr-1" /> Suspend
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
