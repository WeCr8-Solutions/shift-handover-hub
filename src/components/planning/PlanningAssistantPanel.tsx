import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { usePlanningAssistant, ChatMessage } from "@/hooks/usePlanningAssistant";
import { useAiChatUsage } from "@/hooks/useAiChatUsage";
import { useAdminAccess } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { extractRoutingProposal } from "@/lib/routing-proposal";
import { RoutingProposalCard } from "@/components/planning/RoutingProposalCard";
import {
  Sparkles,
  Send,
  Loader2,
  Trash2,
  AlertTriangle,
  CalendarCheck,
  ArrowUpDown,
  Zap,
  Gauge,
  ClipboardList,
  Cpu,
  Move3d,
} from "lucide-react";

interface Props {
  organizationId: string;
}

const quickPrompts = [
  {
    label: "Capacity Snapshot",
    icon: Gauge,
    prompt:
      "Give me a capacity snapshot: scheduled hours per station vs. available hours for the next 7 days. Flag any overloaded stations.",
  },
  {
    label: "Resequence Queue",
    icon: ArrowUpDown,
    prompt:
      "Reprioritize the queue based on due dates and current station availability. Suggest 5 concrete moves.",
  },
  {
    label: "Due Date Risk",
    icon: CalendarCheck,
    prompt: "Show overdue and at-risk items and the fastest path to recovery.",
  },
  {
    label: "Machine Down",
    icon: AlertTriangle,
    prompt: "A machine is down. What work orders are affected and where can I reroute them?",
  },
  {
    label: "SOP Gap",
    icon: ClipboardList,
    prompt:
      "Which active jobs lack documented setup sheets or routing steps? Suggest SOPs that should be standardized.",
  },
  {
    label: "Move Program",
    icon: Move3d,
    prompt:
      "I need to free up my busiest CNC. For the top in-progress jobs, which other stations could run them with minimal re-post? List by controller family and capability match, with effort tier.",
  },
  {
    label: "Control Compatibility",
    icon: Cpu,
    prompt:
      "Show me a controller-family compatibility map of all my CNC stations. For each family, list the machines, envelope sizes, and capabilities so I know where programs port natively.",
  },
];

export function PlanningAssistantPanel({ organizationId }: Props) {
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage, clearChat } = usePlanningAssistant(organizationId);
  const { data: usage } = useAiChatUsage(organizationId);
  const { hasOrgSupervisorAccess, hasOrgAdminAccess, hasAdminAccess } = useAdminAccess();
  const canApproveRouting = hasOrgSupervisorAccess || hasOrgAdminAccess || hasAdminAccess;
  const scrollRef = useRef<HTMLDivElement>(null);

  const limitReached = usage?.limitReached ?? false;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading || limitReached) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <Card className="flex flex-col h-[70vh] min-h-[480px]">
      <div className="p-4 border-b flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Planning Assistant</span>
        </div>
        <div className="flex items-center gap-1.5">
          {usage && usage.dailyLimit > 0 && (
            <Badge variant={limitReached ? "destructive" : "secondary"} className="text-xs font-normal">
              {usage.remaining}/{usage.dailyLimit} left
            </Badge>
          )}
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearChat} title="Clear chat">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-4" ref={scrollRef as any}>
        <div className="py-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center mt-4">
                Ask anything about capacity, planning, processing, or SOPs.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickPrompts.map((qp) => (
                  <Button
                    key={qp.label}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => sendMessage(qp.prompt)}
                    disabled={limitReached || isLoading}
                  >
                    <qp.icon className="w-3.5 h-3.5" />
                    {qp.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <Bubble
              key={i}
              message={msg}
              organizationId={organizationId}
              canApproveRouting={canApproveRouting}
            />
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing your production data...
            </div>
          )}
        </div>
      </ScrollArea>

      {limitReached ? (
        <div className="p-4 border-t">
          <CardContent className="p-4 space-y-2 bg-primary/5 rounded-md">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="w-4 h-4 text-primary" />
              Daily limit reached
            </div>
            <p className="text-xs text-muted-foreground">
              You've used all {usage?.dailyLimit} AI messages for today. Upgrade your plan for more.
            </p>
          </CardContent>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about capacity, scheduling, routing, SOPs..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      )}
    </Card>
  );
}

function Bubble({
  message,
  organizationId,
  canApproveRouting,
}: {
  message: ChatMessage;
  organizationId: string;
  canApproveRouting: boolean;
}) {
  const isUser = message.role === "user";
  const { cleanedContent, proposal } = !isUser
    ? extractRoutingProposal(message.content)
    : { cleanedContent: message.content, proposal: null };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{cleanedContent}</ReactMarkdown>
            </div>
            {proposal && (
              <RoutingProposalCard
                organizationId={organizationId}
                proposal={proposal}
                canApprove={canApproveRouting}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
}
