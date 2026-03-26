import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { erpGuideParts, LOCAL_KEY } from "./erpGuideData";

export default function ERPSelectionGuide() {
  const navigate = useNavigate();
  const [read] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"));
    } catch {
      return new Set<string>();
    }
  });

  const progress = Math.round((read.size / erpGuideParts.length) * 100);

  return (
    <>
      <SEOHead
        title="ERP Selection Guide for Manufacturers — 7-Part Series"
        description="A practical 7-part guide to selecting, budgeting, planning, and implementing a manufacturing system — written for job shops, machine shops, and discrete manufacturers."
        canonical="/resources/erp-guide"
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-4xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">7-Part Series</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Manufacturing System Selection Guide
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From avoiding common mistakes to owning your implementation success — everything a job shop needs to evaluate, budget, and deploy the right production system.
            </p>
          </div>

          {/* Progress */}
          <Card className="mb-8">
            <CardContent className="py-4 flex items-center gap-4">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{read.size} of {erpGuideParts.length} parts completed</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <AdPlacement format="horizontal" className="mb-8" />

          {/* Part cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {erpGuideParts.map((part) => {
              const Icon = part.icon;
              const isRead = read.has(part.id);
              return (
                <Card
                  key={part.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${isRead ? "border-primary/30" : ""}`}
                  onClick={() => navigate(`/resources/erp-guide/${part.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <Badge variant="outline" className="text-xs">Part {part.part}</Badge>
                      {isRead && <Badge className="text-xs bg-primary/20 text-primary border-0">Read ✓</Badge>}
                    </div>
                    <CardTitle className="text-base">{part.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{part.subtitle}</p>
                    <Button variant="ghost" size="sm" className="gap-1 -ml-2 text-primary">
                      Read Part {part.part} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <AdPlacement format="rectangle" className="mt-12" />
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
