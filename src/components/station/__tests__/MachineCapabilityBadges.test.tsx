import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MachineCapabilityBadges } from "../MachineCapabilityBadges";

describe("MachineCapabilityBadges", () => {
  it("renders active capabilities only", () => {
    render(
      <MachineCapabilityBadges
        capabilities={{
          five_axis_simultaneous: true,
          live_tooling: true,
          probing: false,
          bar_feeder: false,
        }}
      />
    );
    expect(screen.getByText("5-Axis Simultaneous")).toBeInTheDocument();
    expect(screen.getByText("Live Tooling")).toBeInTheDocument();
    expect(screen.queryByText("Probing")).not.toBeInTheDocument();
    expect(screen.queryByText("Bar Feeder")).not.toBeInTheDocument();
  });

  it("renders nothing when no capabilities or materials", () => {
    const { container } = render(
      <MachineCapabilityBadges capabilities={{}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders materials when provided", () => {
    render(
      <MachineCapabilityBadges
        capabilities={{}}
        materials={["Aluminum", "Titanium"]}
      />
    );
    expect(screen.getByText("Aluminum")).toBeInTheDocument();
    expect(screen.getByText("Titanium")).toBeInTheDocument();
    expect(screen.getByText(/Material Capability/i)).toBeInTheDocument();
  });

  it("renders both capabilities and materials", () => {
    render(
      <MachineCapabilityBadges
        capabilities={{ probing: true, pallet_pool: true }}
        materials={["Steel"]}
      />
    );
    expect(screen.getByText("Probing")).toBeInTheDocument();
    expect(screen.getByText("Pallet Pool")).toBeInTheDocument();
    expect(screen.getByText("Steel")).toBeInTheDocument();
  });
});
