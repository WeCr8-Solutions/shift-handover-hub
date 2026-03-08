import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MachineSpecGrid } from "../MachineSpecGrid";

describe("MachineSpecGrid", () => {
  it("renders travel specs when provided", () => {
    render(
      <MachineSpecGrid
        specs={{
          max_x_travel: 762,
          max_y_travel: 508,
          max_z_travel: 508,
          max_part_weight: 1360,
        }}
      />
    );
    expect(screen.getByText("762")).toBeInTheDocument();
    expect(screen.getByText("508")).toBeInTheDocument();
    expect(screen.getByText("1360")).toBeInTheDocument();
    expect(screen.getByText(/Travel & Envelope/i)).toBeInTheDocument();
  });

  it("renders nothing when all specs are null", () => {
    const { container } = render(
      <MachineSpecGrid specs={{ max_x_travel: null, max_y_travel: null }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders spindle section when spindle specs provided", () => {
    render(
      <MachineSpecGrid
        specs={{
          max_spindle_rpm: 12000,
          spindle_taper: "CAT40",
          tool_magazine_capacity: 40,
        }}
      />
    );
    expect(screen.getByText("12000")).toBeInTheDocument();
    expect(screen.getByText("CAT40")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText(/Spindle & Tooling/i)).toBeInTheDocument();
  });

  it("renders turning section when turning specs provided", () => {
    render(
      <MachineSpecGrid
        specs={{
          max_turning_diameter: 200,
          bar_capacity_mm: 65,
        }}
      />
    );
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("65")).toBeInTheDocument();
  });

  it("hides sections with no data", () => {
    render(
      <MachineSpecGrid
        specs={{
          max_x_travel: 500,
          max_spindle_rpm: null,
          max_turning_diameter: null,
        }}
      />
    );
    expect(screen.getByText(/Travel & Envelope/i)).toBeInTheDocument();
    expect(screen.queryByText(/Spindle & Tooling/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Turning/i)).not.toBeInTheDocument();
  });
});
