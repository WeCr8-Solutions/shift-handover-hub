import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { usePlanningAssistant, ChatMessage } from "@/hooks/usePlanningAssistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Send,
  Loader2,
  Trash2,
  AlertTriangle,
  CalendarCheck,
  ArrowUpDown,
  X,
} from "lucide-react";

interface PlanningAssistantModalProps {
  organizationId: string | null;
}

const quickPrompts = [
  {
    label: "Machine Down",
    icon: AlertTriangle,
    prompt: "A machine is down. What work orders are affected and where can I reroute them?",
  },
  {
    label: "Due Date Check",
    icon: CalendarCheck,
    prompt: "Show me all overdue or at-risk items and suggest how to get back on track.",
  },
  {
    label: "Reprioritize",
    icon: ArrowUpDown,
    prompt: "Help me reprioritize the queue based on due dates and current station availability.",
  },
];

export function PlanningAssistantModal({ organizationId }: PlanningAssistantModalProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage, clearChat } = usePlanningAssistant(organizationId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    sendMessage(prompt);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow p-0"
      >
        <Sparkles className="w-6 h-6" />
      </Button>

      {/* Chat Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="p-4 pb-2 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-primary" />
                Planning Assistant
              </SheetTitle>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button variant="ghost" size="icon" onClick={clearChat} title="Clear chat">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              AI-powered production planning with live queue & station data
            </p>
          </SheetHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4" ref={scrollRef as any}>
            <div className="py-4 space-y-4">
              {messages.length === 0 && !isLoading && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center mt-8">
                    Ask about scheduling, rerouting, or due-date feasibility.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {quickPrompts.map((qp) => (
                      <Button
                        key={qp.label}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => handleQuickPrompt(qp.prompt)}
                      >
                        <qp.icon className="w-3.5 h-3.5" />
                        {qp.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}

              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing your production data...
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about scheduling, routing, priorities..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
