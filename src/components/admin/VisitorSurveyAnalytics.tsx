import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, MessageSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface SurveyRow {
  id: string;
  heard_about_us: string;
  looking_for: string[];
  other_heard_about: string | null;
  other_looking_for: string | null;
  source_page: string | null;
  created_at: string;
}

const COLORS = [
  "hsl(185, 70%, 45%)",
  "hsl(220, 70%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(45, 85%, 55%)",
  "hsl(140, 55%, 45%)",
  "hsl(280, 55%, 55%)",
  "hsl(15, 75%, 55%)",
];

export function VisitorSurveyAnalytics() {
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("visitor_surveys")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error && data) setSurveys(data as unknown as SurveyRow[]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  // Aggregate referral sources
  const heardCounts: Record<string, number> = {};
  surveys.forEach((s) => {
    const key = s.heard_about_us || "Unknown";
    heardCounts[key] = (heardCounts[key] || 0) + 1;
  });
  const heardData = Object.entries(heardCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Aggregate needs
  const needsCounts: Record<string, number> = {};
  surveys.forEach((s) => {
    (s.looking_for || []).forEach((need) => {
      needsCounts[need] = (needsCounts[need] || 0) + 1;
    });
    if (s.other_looking_for) {
      needsCounts["Other"] = (needsCounts["Other"] || 0) + 1;
    }
  });
  const needsData = Object.entries(needsCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Visitor Survey Responses
          </h2>
          <p className="text-sm text-muted-foreground">
            Insights from landing page visitor surveys
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Users className="w-3 h-3" />
          {surveys.length} responses
        </Badge>
      </div>

      {surveys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No survey responses yet. The survey modal appears after 10 seconds on the landing page for anonymous visitors.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Referral Sources - Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                How They Heard About Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={heardData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {heardData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {heardData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span>{d.name}</span>
                    </div>
                    <span className="font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Needs - Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                What They're Looking to Track
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={needsData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(185, 70%, 45%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent responses table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Recent Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Heard About Us</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Looking For</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surveys.slice(0, 20).map((s) => (
                      <tr key={s.id} className="border-b border-border/50">
                        <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2 pr-4">
                          {s.heard_about_us}
                          {s.other_heard_about && (
                            <span className="text-muted-foreground"> — {s.other_heard_about}</span>
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {(s.looking_for || []).map((need) => (
                              <Badge key={need} variant="outline" className="text-xs">
                                {need}
                              </Badge>
                            ))}
                            {s.other_looking_for && (
                              <Badge variant="outline" className="text-xs">
                                Other: {s.other_looking_for}
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
