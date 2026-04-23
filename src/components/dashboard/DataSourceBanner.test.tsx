import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@/test/test-utils";

const modeState = vi.hoisted(() => ({
  loading: false,
  mode: "jobboss_read_through" as string,
  vendor: "jobboss" as string | null,
  isReadThrough: true,
  isItar: true,
}));

vi.mock("@/hooks/useDataSourceMode", () => ({
  useDataSourceMode: () => modeState,
}));

vi.mock("@/contexts/OrgContext", () => ({
  OrgProvider: ({ children }: { children: ReactNode }) => children,
}));

import { DataSourceBanner } from "./DataSourceBanner";

describe("DataSourceBanner", () => {
  beforeEach(() => {
    modeState.loading = false;
    modeState.mode = "jobboss_read_through";
    modeState.vendor = "jobboss";
    modeState.isReadThrough = true;
    modeState.isItar = true;
  });

  it("renders read-through ITAR messaging for JobBOSS orgs", () => {
    render(<DataSourceBanner />);

    expect(screen.getByText(/JobBOSS is your system of record/i)).toBeInTheDocument();
    expect(screen.getByText(/Read-through/i)).toBeInTheDocument();
    expect(screen.getByText(/ITAR/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Nothing is persisted to Lovable Cloud — your data stays in your ERP/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Manage/i })).toHaveAttribute(
      "href",
      "/settings/integrations/jobboss",
    );
  });

  it("renders write-through messaging for SAP orgs", () => {
    modeState.mode = "sap_write_through";
    modeState.vendor = "sap";
    modeState.isReadThrough = false;
    modeState.isItar = false;

    render(<DataSourceBanner />);

    expect(screen.getByText(/SAP S\/4HANA is your system of record/i)).toBeInTheDocument();
    expect(screen.getByText(/Write-through/i)).toBeInTheDocument();
    expect(
      screen.getByText(/synced from SAP S\/4HANA into Lovable Cloud for offline access and analytics/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/ITAR/i)).not.toBeInTheDocument();
  });

  it("renders nothing for native mode", () => {
    modeState.mode = "native";
    modeState.vendor = null;
    modeState.isReadThrough = false;
    modeState.isItar = false;

    const { container } = render(<DataSourceBanner />);

    expect(container).toBeEmptyDOMElement();
  });
});