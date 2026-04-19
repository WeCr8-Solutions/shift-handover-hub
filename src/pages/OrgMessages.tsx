import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessagesSquare, Search, Send, UserPlus, Check, X, ShieldOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgConnections, useOrgMessages, type OrgConnection } from "@/hooks/useOrgMessaging";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface MemberLite {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
}

export default function OrgMessages() {
  const navigate = useNavigate();
  const { user, isReady } = useAuth();
  const { organization } = useOrgContext();
  const { toast } = useToast();

  const { connections, requestConnection, respondConnection } = useOrgConnections();
  const { messages, sendMessage, markRead } = useOrgMessages();

  const [members, setMembers] = useState<MemberLite[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [search, setSearch] = useState("");
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [connectTarget, setConnectTarget] = useState<MemberLite | null>(null);
  const [connectMessage, setConnectMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isReady && !user) navigate("/auth");
  }, [isReady, user, navigate]);

  // Fetch org members (for the directory)
  useEffect(() => {
    if (!organization?.id) {
      setLoadingMembers(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingMembers(true);
      const { data: mems } = await supabase
        .from("organization_members")
        .select("user_id, role")
        .eq("organization_id", organization.id);
      const userIds = (mems ?? []).map((m) => m.user_id).filter((id) => id !== user?.id);
      if (userIds.length === 0) {
        if (!cancelled) {
          setMembers([]);
          setLoadingMembers(false);
        }
        return;
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);
      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      const merged: MemberLite[] = (mems ?? [])
        .filter((m) => m.user_id !== user?.id)
        .map((m) => ({
          user_id: m.user_id,
          role: m.role,
          display_name: profileMap.get(m.user_id)?.display_name ?? null,
          avatar_url: profileMap.get(m.user_id)?.avatar_url ?? null,
        }));
      if (!cancelled) {
        setMembers(merged);
        setLoadingMembers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organization?.id, user?.id]);

  // Build connection map by partner user id
  const connectionByPartner = useMemo(() => {
    const map = new Map<string, OrgConnection>();
    connections.forEach((c) => {
      const partner = c.requester_id === user?.id ? c.recipient_id : c.requester_id;
      const existing = map.get(partner);
      // Prefer accepted > pending > declined > blocked
      const order = { accepted: 4, pending: 3, declined: 2, blocked: 1 } as const;
      if (!existing || order[c.status] > order[existing.status]) map.set(partner, c);
    });
    return map;
  }, [connections, user?.id]);

  const acceptedPartners = useMemo(
    () => members.filter((m) => connectionByPartner.get(m.user_id)?.status === "accepted"),
    [members, connectionByPartner]
  );

  const incomingRequests = useMemo(
    () => connections.filter((c) => c.recipient_id === user?.id && c.status === "pending"),
    [connections, user?.id]
  );

  const filteredDirectory = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => (m.display_name ?? "").toLowerCase().includes(q));
  }, [members, search]);

  // Active conversation messages
  const activeMessages = useMemo(
    () => messages.filter((m) => m.sender_id === activePartnerId || m.recipient_id === activePartnerId),
    [messages, activePartnerId]
  );

  // Mark active conversation as read
  useEffect(() => {
    if (!activePartnerId || !user?.id) return;
    activeMessages
      .filter((m) => m.recipient_id === user.id && !m.read_at)
      .forEach((m) => markRead(m.id).catch(() => undefined));
  }, [activePartnerId, activeMessages, user?.id, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  const activePartner = members.find((m) => m.user_id === activePartnerId);
  const activeConnection = activePartnerId ? connectionByPartner.get(activePartnerId) : undefined;
  const canSend = activeConnection?.status === "accepted";

  const handleSend = async () => {
    if (!activePartnerId || !draft.trim()) return;
    try {
      await sendMessage(activePartnerId, draft);
      setDraft("");
    } catch (err) {
      toast({
        title: "Failed to send",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const handleRequestConnection = async () => {
    if (!connectTarget) return;
    try {
      await requestConnection(connectTarget.user_id, connectMessage);
      toast({ title: "Connection request sent" });
      setConnectTarget(null);
      setConnectMessage("");
    } catch (err) {
      toast({
        title: "Failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const initials = (name: string | null) => (name ?? "?").charAt(0).toUpperCase();

  if (!organization) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Messages — JobLine.ai</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <Header />
        <main className="container py-12 text-center max-w-2xl">
          <h1 className="text-2xl font-bold mb-2">Messages</h1>
          <p className="text-muted-foreground">Join an organization to start messaging your teammates.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Messages — JobLine.ai</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />
      <main className="container py-6 max-w-6xl">
        <div className="mb-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessagesSquare className="w-7 h-7" /> Messages
          </h1>
          <p className="text-muted-foreground text-sm">
            Direct messaging within {organization.name}. You can only message users you've connected with.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-4">
          {/* Left pane — connections + directory */}
          <Card>
            <CardHeader className="pb-2">
              <Tabs defaultValue="conversations">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="conversations">Chats</TabsTrigger>
                  <TabsTrigger value="requests">
                    Requests
                    {incomingRequests.length > 0 && (
                      <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                        {incomingRequests.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="directory">People</TabsTrigger>
                </TabsList>

                {/* Active conversations */}
                <TabsContent value="conversations" className="mt-3 space-y-1 max-h-[60vh] overflow-y-auto">
                  {acceptedPartners.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3">
                      No connections yet. Visit the People tab to send a request.
                    </p>
                  ) : (
                    acceptedPartners.map((m) => {
                      const lastMsg = [...messages]
                        .reverse()
                        .find((msg) => msg.sender_id === m.user_id || msg.recipient_id === m.user_id);
                      const unread = messages.filter(
                        (msg) => msg.sender_id === m.user_id && msg.recipient_id === user?.id && !msg.read_at
                      ).length;
                      return (
                        <button
                          key={m.user_id}
                          onClick={() => setActivePartnerId(m.user_id)}
                          className={`w-full text-left p-2 rounded-md flex items-center gap-2 transition-colors ${
                            activePartnerId === m.user_id ? "bg-secondary" : "hover:bg-secondary/50"
                          }`}
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {initials(m.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">
                                {m.display_name ?? "Unknown"}
                              </p>
                              {unread > 0 && (
                                <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                                  {unread}
                                </Badge>
                              )}
                            </div>
                            {lastMsg && (
                              <p className="text-xs text-muted-foreground truncate">{lastMsg.body}</p>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </TabsContent>

                {/* Incoming requests */}
                <TabsContent value="requests" className="mt-3 space-y-2 max-h-[60vh] overflow-y-auto">
                  {incomingRequests.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3">No pending connection requests.</p>
                  ) : (
                    incomingRequests.map((c) => {
                      const requester = members.find((m) => m.user_id === c.requester_id);
                      return (
                        <div key={c.id} className="border rounded-md p-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {initials(requester?.display_name ?? null)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-medium flex-1 truncate">
                              {requester?.display_name ?? "Unknown"}
                            </p>
                          </div>
                          {c.message && <p className="text-xs text-muted-foreground italic">"{c.message}"</p>}
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="flex-1 h-7 text-xs gap-1"
                              onClick={() => respondConnection(c.id, "accepted")}
                            >
                              <Check className="w-3 h-3" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-7 text-xs gap-1"
                              onClick={() => respondConnection(c.id, "declined")}
                            >
                              <X className="w-3 h-3" /> Decline
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() => respondConnection(c.id, "blocked")}
                              title="Block"
                            >
                              <ShieldOff className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </TabsContent>

                {/* Directory */}
                <TabsContent value="directory" className="mt-3 space-y-2 max-h-[60vh] overflow-y-auto">
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search teammates"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-8 pl-7 text-sm"
                    />
                  </div>
                  {loadingMembers ? (
                    <Skeleton className="h-20 w-full" />
                  ) : filteredDirectory.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3">No teammates found.</p>
                  ) : (
                    filteredDirectory.map((m) => {
                      const conn = connectionByPartner.get(m.user_id);
                      return (
                        <div key={m.user_id} className="border rounded-md p-2 flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {initials(m.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{m.display_name ?? "Unknown"}</p>
                            {m.role && (
                              <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
                            )}
                          </div>
                          {conn?.status === "accepted" ? (
                            <Badge variant="secondary" className="text-[10px]">Connected</Badge>
                          ) : conn?.status === "pending" ? (
                            <Badge variant="outline" className="text-[10px]">Pending</Badge>
                          ) : conn?.status === "blocked" ? (
                            <Badge variant="destructive" className="text-[10px]">Blocked</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => setConnectTarget(m)}
                            >
                              <UserPlus className="w-3 h-3" /> Connect
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>

          {/* Right pane — active conversation */}
          <Card className="flex flex-col min-h-[60vh]">
            {!activePartner ? (
              <CardContent className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <MessagesSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a connection to start chatting.</p>
                </div>
              </CardContent>
            ) : (
              <>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {initials(activePartner.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    {activePartner.display_name ?? "Unknown"}
                  </CardTitle>
                  <CardDescription className="text-xs capitalize">
                    {activePartner.role ?? "Member"} · {organization.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-3 gap-2">
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh]">
                    {activeMessages.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-4">
                        No messages yet — say hello.
                      </p>
                    ) : (
                      activeMessages.map((m) => {
                        const mine = m.sender_id === user?.id;
                        return (
                          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                                mine ? "bg-primary text-primary-foreground" : "bg-muted"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{m.body}</p>
                              <p className="text-[10px] opacity-70 mt-1">
                                {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {canSend ? (
                    <div className="flex gap-2 pt-2 border-t">
                      <Textarea
                        placeholder="Type a message…"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={2}
                        maxLength={4000}
                        className="resize-none"
                      />
                      <Button onClick={handleSend} disabled={!draft.trim()} size="sm" className="self-end gap-1">
                        <Send className="w-3 h-3" /> Send
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic border rounded p-2 bg-muted/30">
                      You need an accepted connection with this user before sending messages.
                    </p>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </main>

      <Dialog open={!!connectTarget} onOpenChange={(o) => !o && setConnectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect with {connectTarget?.display_name ?? "teammate"}</DialogTitle>
            <DialogDescription>
              They'll see your request and can accept or decline before you can exchange messages.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Optional intro message…"
            value={connectMessage}
            onChange={(e) => setConnectMessage(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConnectTarget(null)}>Cancel</Button>
            <Button onClick={handleRequestConnection}>Send request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
