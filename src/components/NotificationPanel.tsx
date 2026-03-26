import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, AlertCircle, Info, Gift, Megaphone, Bell, Check, ExternalLink, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSmartAlerts, type SmartAlert, type SmartAlertSeverity } from "@/hooks/useSmartAlerts";
import { useGlobalUpdates, type GlobalUpdate } from "@/hooks/useGlobalUpdates";
import { useOrgContext } from "@/contexts/OrgContext";
import { differenceInDays } from "date-fns";

const DISMISS_KEY_PREFIX = "complimentary_award_dismissed_";

const severityIcon: Record<SmartAlertSeverity, React.ElementType> = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

const severityColor: Record<SmartAlertSeverity, string> = {
  critical: "text-destructive",
  warning: "text-yellow-500",
  info: "text-blue-500",
};

function SmartAlertItem({ alert, onNavigate }: { alert: SmartAlert; onNavigate: () => void }) {
  const navigate = useNavigate();
  const Icon = severityIcon[alert.severity];

  const handleClick = () => {
    if (alert.targetType === "work_order") {
      navigate(`/queue?item=${alert.targetId}`);
    }
    onNavigate();
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-start gap-2.5 p-2.5 rounded-md hover:bg-secondary/60 transition-colors text-left"
    >
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${severityColor[alert.severity]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-tight truncate">{alert.title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{alert.detail}</p>
        {alert.metricLabel && (
          <span className="text-[10px] text-muted-foreground mt-1 inline-block">
            {alert.metricLabel}: {alert.metric}
          </span>
        )}
      </div>
      <Badge
        variant={alert.severity === "critical" ? "destructive" : "secondary"}
        className="text-[9px] shrink-0 mt-0.5"
      >
        {alert.severity}
      </Badge>
    </button>
  );
}

function UpdateItem({
  update,
  acknowledged,
  onAcknowledge,
  onNavigate,
}: {
  update: GlobalUpdate;
  acknowledged: boolean;
  onAcknowledge: (id: string) => void;
  onNavigate: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-md hover:bg-secondary/60 transition-colors">
      <Megaphone className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-tight truncate">{update.title}</p>
        {update.summary && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{update.summary}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {!acknowledged && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-[10px] px-1.5"
              onClick={() => onAcknowledge(update.id)}
            >
              <Check className="w-3 h-3 mr-1" />
              Acknowledge
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-[10px] px-1.5"
            onClick={() => {
              navigate("/updates");
              onNavigate();
            }}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View
          </Button>
        </div>
      </div>
      {update.version_number && (
        <Badge variant="outline" className="text-[9px] shrink-0 mt-0.5">
          {update.version_number}
        </Badge>
      )}
    </div>
  );
}

function ComplimentaryNotice({ onDismiss }: { onDismiss: () => void }) {
  const { organization } = useOrgContext();

  const daysRemaining = useMemo(() => {
    if (!organization) return 0;
    const trialEndsAt = (organization as any).trial_ends_at;
    if (!trialEndsAt) return 0;
    return Math.max(0, differenceInDays(new Date(trialEndsAt), new Date()));
  }, [organization]);

  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-md bg-primary/5 border border-primary/20">
      <Gift className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-tight">🎉 Complimentary Team Access Active</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Your organization has complimentary Team-tier access
          {daysRemaining > 0 && (
            <>
              {" "}for <strong>{daysRemaining} day{daysRemaining !== 1 ? "s" : ""}</strong>
            </>
          )}
          .
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 text-[10px] px-1.5 mt-1 text-muted-foreground"
          onClick={onDismiss}
        >
          Don't show again
        </Button>
      </div>
    </div>
  );
}

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { organization } = useOrgContext();
  const { alerts } = useSmartAlerts();
  const { updates, unreadCount, acknowledgedIds, acknowledgeUpdate } = useGlobalUpdates();
  const [complimentaryDismissed, setComplimentaryDismissed] = useState(false);

  const isComplimentary = organization?.subscription_status === "complimentary";

  useEffect(() => {
    if (!organization) return;
    const key = DISMISS_KEY_PREFIX + organization.id;
    if (localStorage.getItem(key) === "true") {
      setComplimentaryDismissed(true);
    }
  }, [organization]);

  const handleDismissComplimentary = () => {
    if (!organization) return;
    localStorage.setItem(DISMISS_KEY_PREFIX + organization.id, "true");
    setComplimentaryDismissed(true);
  };

  const visibleUpdates = updates.filter((u) => u.is_visible_to_users && u.status === "live");
  const showComplimentary = isComplimentary && !complimentaryDismissed;

  const announcementCount = (showComplimentary ? 1 : 0);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Notifications</h3>
        </div>
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="w-full h-8 mx-3" style={{ width: "calc(100% - 1.5rem)" }}>
          <TabsTrigger value="alerts" className="text-[11px] flex-1 h-6">
            Alerts {alerts.length > 0 && `(${alerts.length})`}
          </TabsTrigger>
          <TabsTrigger value="updates" className="text-[11px] flex-1 h-6">
            Updates {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          {announcementCount > 0 && (
            <TabsTrigger value="announcements" className="text-[11px] flex-1 h-6">
              Awards
            </TabsTrigger>
          )}
        </TabsList>

        <ScrollArea className="h-[320px]">
          <TabsContent value="alerts" className="px-3 pb-3 mt-0">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Info className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">No active alerts</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 mt-2">
                {alerts.map((alert) => (
                  <SmartAlertItem key={alert.id} alert={alert} onNavigate={onClose} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="updates" className="px-3 pb-3 mt-0">
            {visibleUpdates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Megaphone className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">No system updates</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 mt-2">
                {visibleUpdates.map((update) => (
                  <UpdateItem
                    key={update.id}
                    update={update}
                    acknowledged={acknowledgedIds.has(update.id)}
                    onAcknowledge={acknowledgeUpdate}
                    onNavigate={onClose}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {announcementCount > 0 && (
            <TabsContent value="announcements" className="px-3 pb-3 mt-0">
              <div className="flex flex-col gap-2 mt-2">
                {showComplimentary && (
                  <ComplimentaryNotice onDismiss={handleDismissComplimentary} />
                )}
              </div>
            </TabsContent>
          )}
        </ScrollArea>
      </Tabs>
    </div>
  );
}

export function useNotificationBadgeCount() {
  const { organization } = useOrgContext();
  const { alerts } = useSmartAlerts();
  const { unreadCount } = useGlobalUpdates();

  const isComplimentary = organization?.subscription_status === "complimentary";

  const [complimentaryDismissed, setComplimentaryDismissed] = useState(false);

  useEffect(() => {
    if (!organization) return;
    const key = DISMISS_KEY_PREFIX + organization.id;
    if (localStorage.getItem(key) === "true") setComplimentaryDismissed(true);
  }, [organization]);

  return alerts.length + unreadCount + (isComplimentary && !complimentaryDismissed ? 1 : 0);
}
