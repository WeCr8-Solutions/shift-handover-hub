import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";
import { MachineProfileMarketplace } from "@/components/station/MachineProfileMarketplace";

export default function MarketplacePanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Marketplace
          </CardTitle>
          <CardDescription>
            Browse and purchase verified machine profiles, tooling packages, and other add-ons for your stations.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Machine Profiles</CardTitle>
          <CardDescription>Verified manufacturer specifications for your CNC machines.</CardDescription>
        </CardHeader>
        <CardContent>
          <MachineProfileMarketplace stationId={null} stationName={null} />
        </CardContent>
      </Card>
    </div>
  );
}
