import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SfmCalculator } from "../SfmCalculator";
import { ToleranceCalculator } from "../ToleranceCalculator";
import { UnitConverter } from "../UnitConverter";
import { TrigCalculator } from "../TrigCalculator";

describe("SfmCalculator", () => {
  it("renders correct default milling math", () => {
    render(<SfmCalculator />);

    expect(screen.getByText("2,292")).toBeInTheDocument();
    expect(screen.getByText("27.5")).toBeInTheDocument();
    expect(screen.getByText('0.0030"')).toBeInTheDocument();
  });

  it("renders correct turning MRR using the shared turning formula", async () => {
    render(<SfmCalculator />);

    fireEvent.click(screen.getByLabelText("Turning"));

    await waitFor(() => {
      expect(screen.getByText("1.44")).toBeInTheDocument();
    });
  });
});

describe("ToleranceCalculator", () => {
  it("computes default min/max/range correctly and flags pass/fail", async () => {
    render(<ToleranceCalculator />);

    expect(screen.getByText("1.0050")).toBeInTheDocument();
    expect(screen.getByText("0.9950")).toBeInTheDocument();
    expect(screen.getByText("0.0100")).toBeInTheDocument();

    const measured = screen.getByLabelText("Measured");
    fireEvent.change(measured, { target: { value: "1.0000" } });

    await waitFor(() => {
      expect(screen.getByText("✓ PASS")).toBeInTheDocument();
    });

    fireEvent.change(measured, { target: { value: "1.0100" } });

    await waitFor(() => {
      expect(screen.getByText("✕ FAIL")).toBeInTheDocument();
    });
  });
});

describe("UnitConverter", () => {
  it("converts inches to millimeters by default and swaps correctly", async () => {
    render(<UnitConverter />);

    expect(screen.getByText(/^25\.4$/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Swap units"));

    await waitFor(() => {
      expect(screen.getByDisplayValue("25.4")).toBeInTheDocument();
      expect(screen.getByText(/^1$/)).toBeInTheDocument();
    });
  });
});

describe("TrigCalculator", () => {
  it("solves a 3-4-5 right triangle correctly", async () => {
    render(<TrigCalculator />);

    fireEvent.change(screen.getByLabelText("Side A (opposite)"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Side B (adjacent)"), { target: { value: "4" } });

    await waitFor(() => {
      expect(screen.getByText("5.0000")).toBeInTheDocument();
      expect(screen.getByText("36.87°")).toBeInTheDocument();
      expect(screen.getByText("53.13°")).toBeInTheDocument();
      expect(screen.getByText("6.0000")).toBeInTheDocument();
    });
  });
});