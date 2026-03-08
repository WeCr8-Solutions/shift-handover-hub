import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalUpdates } from "@/hooks/useGlobalUpdates";
import { Header } from "@/components/Header";
import { UpdateCard } from "@/components/updates/UpdateCard";
import { UpdateFilters } from "@/components/updates/UpdateFilters";
import { SystemStatusIndicator } from "@/components/updates/SystemStatusIndicator";
import { Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEOHead";

export default function Updates() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { updates, loading, acknowledgedIds, acknowledgeUpdate, systemStatus } = useGlobalUpdates();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  // Only show visible, live/resolved updates to regular users
  const visibleUpdates = updates.filter((u) => u.is_visible_to_users && ["live", "resolved"].includes(u.status));

  const filtered = visibleUpdates.filter((u) => {
    const matchesCategory = category === "all" || u.category === category;
    const matchesSearch =
      !search ||
      u.title.toLowerCase().includes(search.toLowerCase()) ||
      (u.version_number && u.version_number.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6 max-w-3xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="System Updates | JobLine" description="View the latest platform updates, fixes, and system notices." />
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">System Updates</h1>
              <p className="text-sm text-muted-foreground">What's new, fixed, and improved</p>
            </div>
          </div>
          <SystemStatusIndicator status={systemStatus} />
        </div>

        <UpdateFilters search={search} onSearchChange={setSearch} category={category} onCategoryChange={setCategory} />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Megaphone className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No updates found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => (
              <UpdateCard
                key={u.id}
                update={u}
                isAcknowledged={acknowledgedIds.has(u.id)}
                onAcknowledge={acknowledgeUpdate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
