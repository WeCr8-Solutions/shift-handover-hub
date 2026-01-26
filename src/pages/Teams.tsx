import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { TeamManagement } from "@/components/TeamManagement";
import { TourTriggerButton } from "@/components/onboarding";
import { Loader2 } from "lucide-react";

export default function Teams() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Teams</h1>
          <TourTriggerButton />
        </div>
        <div data-tour="team-list">
          <TeamManagement />
        </div>
      </main>
    </div>
  );
}
