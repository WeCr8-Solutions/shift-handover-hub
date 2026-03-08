import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarketplaceCatalogCard } from "../MarketplaceCatalogCard";
import type { MachineLibraryEntry } from "@/hooks/useStationMachineProfile";

const baseMachine: MachineLibraryEntry = {
  id: "test-1",
  manufacturer: "HAAS",
  model: "VF-2",
  machine_type: "3-Axis Vertical Mill",
  platform_category: "HAAS Platform",
  max_x_travel: 762,
  max_y_travel: 406,
  max_z_travel: 508,
  max_part_weight: 1360,
  max_part_envelope_length: null,
  max_part_envelope_width: null,
  max_part_envelope_height: null,
  five_axis_simultaneous: false,
  fourth_axis: false,
  live_tooling: false,
  y_axis_turn: false,
  sub_spindle: false,
  probing: true,
  through_spindle_coolant: true,
  pallet_pool: false,
  bar_feeder: false,
  material_capability: ["Aluminum", "Steel"],
  typical_tolerance: 0.001,
  hard_constraints: [],
  is_verified: true,
  max_spindle_rpm: 8100,
  spindle_taper: "CAT40",
  spindle_power_hp: 30,
  tool_magazine_capacity: 24,
  max_tool_diameter: null,
  max_tool_length: null,
  control_type: "HAAS",
  control_model: "NGC",
  max_turning_diameter: null,
  max_turning_length: null,
  bar_capacity_mm: null,
  image_url: null,
  datasheet_url: null,
};

const noop = () => {};

describe("MarketplaceCatalogCard", () => {
  it("renders machine manufacturer and model", () => {
    render(
      <MarketplaceCatalogCard
        machine={baseMachine}
        owned={false}
        isAssigned={false}
        hasStation={false}
        verifying={false}
        assigning={false}
        onPurchase={noop}
        onVerify={noop}
        onAssign={noop}
        onViewDetails={noop}
      />
    );
    expect(screen.getByText("HAAS")).toBeInTheDocument();
    expect(screen.getByText("VF-2")).toBeInTheDocument();
  });

  it("shows purchase button when not owned", () => {
    render(
      <MarketplaceCatalogCard
        machine={baseMachine}
        owned={false}
        isAssigned={false}
        hasStation={false}
        verifying={false}
        assigning={false}
        onPurchase={noop}
        onVerify={noop}
        onAssign={noop}
        onViewDetails={noop}
      />
    );
    expect(screen.getByText("$0.99")).toBeInTheDocument();
    expect(screen.getByText("Verify")).toBeInTheDocument();
  });

  it("shows 'In Inventory' when owned with no station", () => {
    render(
      <MarketplaceCatalogCard
        machine={baseMachine}
        owned={true}
        isAssigned={false}
        hasStation={false}
        verifying={false}
        assigning={false}
        onPurchase={noop}
        onVerify={noop}
        onAssign={noop}
        onViewDetails={noop}
      />
    );
    expect(screen.getByText("In Inventory")).toBeInTheDocument();
  });

  it("shows 'Attach to Station' when owned with station context", () => {
    render(
      <MarketplaceCatalogCard
        machine={baseMachine}
        owned={true}
        isAssigned={false}
        hasStation={true}
        verifying={false}
        assigning={false}
        onPurchase={noop}
        onVerify={noop}
        onAssign={noop}
        onViewDetails={noop}
      />
    );
    expect(screen.getByText("Attach to Station")).toBeInTheDocument();
  });

  it("shows 'Attached' badge when assigned", () => {
    render(
      <MarketplaceCatalogCard
        machine={baseMachine}
        owned={true}
        isAssigned={true}
        hasStation={true}
        verifying={false}
        assigning={false}
        onPurchase={noop}
        onVerify={noop}
        onAssign={noop}
        onViewDetails={noop}
      />
    );
    expect(screen.getByText("Attached")).toBeInTheDocument();
  });

  it("shows Owned badge when owned", () => {
    render(
      <MarketplaceCatalogCard
        machine={baseMachine}
        owned={true}
        isAssigned={false}
        hasStation={false}
        verifying={false}
        assigning={false}
        onPurchase={noop}
        onVerify={noop}
        onAssign={noop}
        onViewDetails={noop}
      />
    );
    expect(screen.getByText("Owned")).toBeInTheDocument();
  });
});
