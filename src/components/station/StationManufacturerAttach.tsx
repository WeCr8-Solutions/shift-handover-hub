import {
  useMachineLibrary,
  useStationMachineAssignment,
  MachineLibraryEntry,
} from "@/hooks/useStationMachineProfile";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { MachineProfileMarketplace } from "./MachineProfileMarketplace";

interface Props {
  stationId: string;
  stationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Thin wrapper around MachineProfileMarketplace for backward compatibility.
 * Station-context mode: passes stationId so purchases can auto-assign.
 */
export function StationManufacturerAttach({ stationId, stationName, open, onOpenChange }: Props) {
  return (
    <MachineProfileMarketplace
      stationId={stationId}
      stationName={stationName}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
