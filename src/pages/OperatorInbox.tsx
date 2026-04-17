import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, MessageSquare } from "lucide-react";
import { useContactRequests } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function OperatorInbox() {
  const navigate = useNavigate();
  const { user, isReady } = useAuth();
  const { inbound, loading, respond } = useContactRequests();
  const { toast } = useToast();
  const [responding, setResponding] = useState<{ id: string; mode: "accepted" | "declined" } | null>(null);
  const [reply, setReply] = useState("");

  useEffect(() => {
    if (isReady && !user) navigate("/auth");
  }, [isReady, user, navigate]);

  const handleRespond = async () => {
    if (!responding) return;
    try {
      await respond(responding.id, responding.mode, reply.trim() || undefined);
      toast({ title: "Response sent" });
      setResponding(null);
      setReply("");
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 max-w-3xl space-y-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Inbox className="w-7 h-7" /> Recruiter inbox</h1>
          <p className="text-muted-foreground">Messages from employers who found your profile in the talent database.</p>
        </div>

        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : inbound.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-2" />
              No messages yet. Make sure your profile is set to discoverable.
            </CardContent>
          </Card>
        ) : (
          inbound.map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{m.subject}</CardTitle>
                    <CardDescription>From {m.sender_display_name ?? "Recruiter"} · {m.organization_name ?? "An organization"}</CardDescription>
                  </div>
                  <Badge variant={m.candidate_response === "accepted" ? "default" : m.candidate_response === "declined" ? "destructive" : "secondary"}>
                    {m.candidate_response}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                {m.candidate_response === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setResponding({ id: m.id, mode: "accepted" })}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => setResponding({ id: m.id, mode: "declined" })}>Decline</Button>
                  </div>
                )}
                {m.candidate_response_message && (
                  <p className="text-sm border-l-2 border-primary pl-2 italic">Your reply: {m.candidate_response_message}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </main>

      <Dialog open={!!responding} onOpenChange={(o) => !o && setResponding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{responding?.mode === "accepted" ? "Accept message" : "Decline message"}</DialogTitle>
          </DialogHeader>
          <Textarea placeholder="Optional reply…" value={reply} onChange={(e) => setReply(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResponding(null)}>Cancel</Button>
            <Button onClick={handleRespond}>Send response</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
