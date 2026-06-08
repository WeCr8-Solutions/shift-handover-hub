import type { AdminComponentAccess } from "@/types/admin";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { CustomerSuccessPanel } from "@/components/admin/customer-success/CustomerSuccessPanel";

export function OnboardingServicesPanel({ access }: { access: AdminComponentAccess }) {
  if (!access.isPlatformAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-2">
          <ShieldAlert className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Customer Success is a platform-admin tool.
          </p>
        </CardContent>
      </Card>
    );
  }
  return <CustomerSuccessPanel />;
}
