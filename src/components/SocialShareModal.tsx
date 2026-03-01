import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, Facebook, Linkedin, Mail, MessageCircle, Twitter } from "lucide-react";

interface SocialShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title?: string;
  description?: string;
}

const platforms = [
  {
    name: "X (Twitter)",
    icon: Twitter,
    getUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    getUrl: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: "Facebook",
    icon: Facebook,
    getUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "WhatsApp",
    icon: MessageCircle,
    getUrl: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    name: "Email",
    icon: Mail,
    getUrl: (url: string, title: string, desc: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${desc}\n\n${url}`)}`,
  },
];

export function SocialShareModal({ open, onOpenChange, url, title = "Check out JobLine.ai", description = "Digital expediting & smart shift handoffs for manufacturing teams." }: SocialShareModalProps) {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Share JobLine.ai</DialogTitle>
          <DialogDescription>Choose a platform to share this page.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 py-2">
          {platforms.map((p) => (
            <a
              key={p.name}
              href={p.getUrl(url, title, description)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <p.icon className="w-5 h-5 text-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{p.name}</span>
            </a>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <Input value={url} readOnly className="text-xs h-9" />
          <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={copyLink}>
            <Copy className="w-4 h-4 mr-1.5" /> Copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
