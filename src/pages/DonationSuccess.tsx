import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";

export default function DonationSuccess() {
  useEffect(() => {
    trackEvent("donation_success_page_viewed");
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Thank You!</h1>
            <p className="text-muted-foreground">
              Your donation has been received. Your support helps us continue building tools that empower manufacturing teams everywhere.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-primary">
            <Heart className="w-5 h-5 fill-current" />
            <span className="font-medium">You're a JobLine Champion!</span>
          </div>

          <Button asChild className="w-full">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
