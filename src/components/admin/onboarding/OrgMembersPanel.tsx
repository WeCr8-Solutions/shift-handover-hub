import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Crown, UserMinus, ArrowRightLeft, Loader2 } from "lucide-react";
import { useOrgMembers, type OrgMemberRole } from "@/hooks/useOrgMembers";

const ROLES: OrgMemberRole[] = ["owner", "admin", "member", "viewer"];

interface Props {
  organizationId: string | null;
}

export function OrgMembersPanel({ organizationId }: Props) {
  const { list, changeRole, remove, transferOwner } = useOrgMembers(organizationId);
  const rows = list.data ?? [];
  const ownerCount = rows.filter((r) => r.role === "owner").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4" /> Active organization members
              <Badge variant="secondary" className="text-[10px]">{rows.length}</Badge>
            </CardTitle>
            <CardDescription>
              Change roles, remove members, or transfer ownership. The only owner cannot be removed or demoted.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {list.isLoading && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading…
          </div>
        )}
        {!list.isLoading && rows.length === 0 && (
          <div className="border border-dashed rounded-md p-6 text-center text-xs text-muted-foreground">
            No members yet. Use the invites panel above to add the owner and team.
          </div>
        )}
        <div className="space-y-2">
          {rows.map((m) => {
            const name = m.profile?.display_name || m.profile?.email || m.user_id;
            const isOnlyOwner = m.role === "owner" && ownerCount <= 1;
            const initials = (m.profile?.display_name ?? m.profile?.email ?? "?")
              .split(/\s+|@/).filter(Boolean).slice(0,2).map((s) => s[0]?.toUpperCase()).join("") || "?";
            return (
              <div key={m.id} className="flex flex-wrap items-center gap-3 border rounded-md p-3">
                <Avatar className="h-8 w-8">
                  {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} alt="" />}
                  <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-[10rem]">
                  <div className="text-sm font-medium truncate flex items-center gap-1.5">
                    {name}
                    {m.role === "owner" && <Crown className="w-3 h-3 text-amber-500" aria-label="Owner" />}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {m.profile?.email ?? m.user_id} · joined {new Date(m.joined_at).toLocaleDateString()}
                  </div>
                </div>
                <Select
                  value={m.role}
                  onValueChange={(v) =>
                    changeRole.mutate({ userId: m.user_id, newRole: v as OrgMemberRole })
                  }
                  disabled={changeRole.isPending || (isOnlyOwner)}
                >
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {m.role !== "owner" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 text-[11px] gap-1" title="Transfer ownership to this user">
                        <ArrowRightLeft className="w-3 h-3" /> Make owner
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Transfer ownership to {name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          The current owner(s) will be demoted to admin. This user becomes the sole owner.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => transferOwner.mutate(m.user_id)}>
                          Transfer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm" variant="ghost"
                      className="h-8 text-[11px] text-destructive hover:text-destructive gap-1"
                      disabled={isOnlyOwner}
                    >
                      <UserMinus className="w-3 h-3" /> Remove
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove {name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This revokes their access to the organization immediately. Their user account is preserved.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => remove.mutate(m.user_id)}
                      >Remove</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
