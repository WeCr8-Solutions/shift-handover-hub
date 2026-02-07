import { useState } from "react";
import { Heart, Coffee, Sparkles, Gift } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

// Stripe price IDs for donations
const DONATION_PRICES = {
  5: "price_1Sy48tCyekafHX78aiOC7f1f",
  10: "price_1Sy492CyekafHX78gFp4I56C",
  25: "price_1Sy49DCyekafHX78ntNW5kEW",
} as const;

type PresetAmount = keyof typeof DONATION_PRICES;

interface SupportJoblineModalProps {
  trigger?: React.ReactNode;
}

export function SupportJoblineModal({ trigger }: SupportJoblineModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<PresetAmount | "custom">(10);
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const presetAmounts: PresetAmount[] = [5, 10, 25];

  const handleDonate = async () => {
    const amount = selectedAmount === "custom" ? parseInt(customAmount) : selectedAmount;
    
    if (!amount || amount < 1) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    trackEvent("support_jobline_donate_clicked", { amount, type: selectedAmount === "custom" ? "custom" : "preset" });

    try {
      // For preset amounts, use the price ID
      // For custom amounts, we'll pass the amount in cents
      const payload = selectedAmount === "custom" 
        ? { amount_cents: amount * 100 }
        : { price_id: DONATION_PRICES[selectedAmount] };

      const { data, error } = await supabase.functions.invoke("create-donation", {
        body: payload,
      });

      if (error) throw error;

      if (data?.url) {
        trackEvent("support_jobline_checkout_redirected", { amount });
        window.open(data.url, "_blank");
        setOpen(false);
      }
    } catch (error: any) {
      console.error("Donation error:", error);
      toast.error(error.message || "Failed to process donation. Please try again.");
      trackEvent("support_jobline_donate_error", { amount, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (amount: PresetAmount) => {
    switch (amount) {
      case 5: return <Coffee className="w-5 h-5" />;
      case 10: return <Heart className="w-5 h-5" />;
      case 25: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getLabel = (amount: PresetAmount) => {
    switch (amount) {
      case 5: return "Buy us a coffee";
      case 10: return "Support the team";
      case 25: return "Champion supporter";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            Support JobLine
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Support JobLine
          </DialogTitle>
          <DialogDescription>
            Help keep JobLine running and improving. Your donation directly supports development and keeps our tools free for manufacturing teams.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preset amounts */}
          <div className="grid grid-cols-3 gap-3">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setSelectedAmount(amount)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                  selectedAmount === amount
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {getIcon(amount)}
                <span className="font-bold text-lg mt-1">${amount}</span>
                <span className="text-xs text-muted-foreground text-center">{getLabel(amount)}</span>
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="space-y-2">
            <button
              onClick={() => setSelectedAmount("custom")}
              className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                selectedAmount === "custom"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Gift className="w-5 h-5" />
              <span className="font-medium">Custom amount</span>
            </button>
            
            {selectedAmount === "custom" && (
              <div className="flex items-center gap-2 pl-2">
                <Label htmlFor="custom-amount" className="text-lg font-bold">$</Label>
                <Input
                  id="custom-amount"
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="text-lg"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Donate button */}
          <Button 
            onClick={handleDonate} 
            disabled={isLoading || (selectedAmount === "custom" && !customAmount)}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              "Processing..."
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Donate ${selectedAmount === "custom" ? customAmount || "0" : selectedAmount}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Stripe. One-time donation, no recurring charges.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
