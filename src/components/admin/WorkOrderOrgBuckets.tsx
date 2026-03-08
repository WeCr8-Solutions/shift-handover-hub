import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Building2, Crown, Mail, Package } from "lucide-react";
import { WorkOrderTable } from "./WorkOrderTable";
import { Database } from "@/integrations/supabase/types";

type QueueStatus = Database["public"]["Enums"]["queue_status"];

interface QueueItem {
  id: string;
  title: string;
  work_order: string | null;
  part_number: string | null;
  operation_number: string | null;
  status: QueueStatus;
  priority: string;
  quantity: number | null;
  due_date: string | null;
  created_at: string;
  station_id: string | null;
  organization_id: string | null;
  station?: { name: string; station_id: string } | null;
  team?: { name: string } | null;
  organization?: { name: string } | null;
}

export interface OrganizationBucket {
  id: string;
  name: string;
  workOrders: QueueItem[];
  stats: {
    total: number;
    inProgress: number;
    onHold: number;
    overdue: number;
  };
  ownerName?: string | null;
  ownerEmail?: string | null;
  subscriptionTier?: string | null;
  subscriptionStatus?: string | null;
}

interface WorkOrderOrgBucketsProps {
  buckets: OrganizationBucket[];
  isAdmin: boolean;
  onStatusChange: (wo: QueueItem, status: QueueStatus) => void;
  onDelete: (wo: QueueItem) => void;
  onEditRouting: (wo: QueueItem) => void;
}

export function WorkOrderOrgBuckets({
  buckets,
  isAdmin,
  onStatusChange,
  onDelete,
  onEditRouting,
}: WorkOrderOrgBucketsProps) {
  if (buckets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No work orders found</p>
      </div>
    );
  }

  return (
    <Accordion type="multiple" defaultValue={buckets.map(b => b.id)} className="space-y-3">
      {buckets.map((orgBucket) => (
        <AccordionItem key={orgBucket.id} value={orgBucket.id} className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">{orgBucket.name}</p>
                <p className="text-sm text-muted-foreground">
                  {orgBucket.stats.total} work order(s) • {orgBucket.stats.inProgress} in progress
                  {orgBucket.stats.overdue > 0 && (
                    <span className="text-destructive ml-1">• {orgBucket.stats.overdue} overdue</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mr-4">
              <Badge variant="secondary">
                <Package className="w-3 h-3 mr-1" />
                {orgBucket.stats.total}
              </Badge>
              {orgBucket.stats.onHold > 0 && (
                <Badge variant="destructive">
                  {orgBucket.stats.onHold} on hold
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {/* Organization Owner Card */}
            {orgBucket.id !== "unassigned" && orgBucket.ownerName && (
              <div className="mb-4 p-3 rounded-lg border-2 border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{orgBucket.ownerName}</span>
                        <Badge variant="default" className="gap-1 text-xs">
                          <Crown className="w-3 h-3" />
                          Owner
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {orgBucket.ownerEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {orgBucket.subscriptionTier && (
                      <Badge variant="secondary" className="text-xs">{orgBucket.subscriptionTier}</Badge>
                    )}
                    {orgBucket.subscriptionStatus && (
                      <Badge
                        variant={orgBucket.subscriptionStatus === "active" ? "outline" : "destructive"}
                        className="text-xs"
                      >
                        {orgBucket.subscriptionStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="border rounded-lg overflow-x-auto">
              <WorkOrderTable
                workOrders={orgBucket.workOrders}
                isAdmin={isAdmin}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
                onEditRouting={onEditRouting}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
