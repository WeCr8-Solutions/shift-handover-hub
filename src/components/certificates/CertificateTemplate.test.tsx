import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { CertificateTemplate } from "./CertificateTemplate";
import type { CertificateRecord } from "@/lib/certificates";

const { mockToDataURL } = vi.hoisted(() => ({
  mockToDataURL: vi.fn().mockResolvedValue("data:image/png;base64,qr"),
}));

vi.mock("qrcode", () => ({
  default: {
    toDataURL: mockToDataURL,
  },
}));

const baseCert: CertificateRecord = {
  certId: "OAP-ABC123-2026",
  qrToken: "qr-token",
  program: "OAP",
  programName: "Operator Acceptance Program",
  recipientName: "Taylor Operator",
  recipientUsername: "taylor-operator",
  recipientEmail: null,
  organizationName: "ACME Manufacturing",
  status: "active",
  validFrom: "2026-01-01",
  validUntil: null,
  issuedAt: "2026-04-01T00:00:00.000Z",
  pdfUrl: null,
  items: [
    {
      type: "machine",
      label: "Haas VF-2",
    },
  ],
};

describe("CertificateTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToDataURL.mockResolvedValue("data:image/png;base64,qr");
  });

  it("generates QR codes for the operator public profile when a username exists", async () => {
    render(<CertificateTemplate cert={baseCert} variant="digital" />);

    await waitFor(() => {
      expect(mockToDataURL).toHaveBeenCalledWith(
        "https://jobline.ai/talent/taylor-operator",
        expect.objectContaining({ width: 320 }),
      );
    });

    expect(screen.getByText("jobline.ai/talent/taylor-operator")).toBeInTheDocument();
    expect(screen.getByText("@taylor-operator")).toBeInTheDocument();
  });

  it("falls back to the public verify URL when no public username is present", async () => {
    render(
      <CertificateTemplate
        cert={{
          ...baseCert,
          recipientUsername: null,
        }}
        variant="digital"
      />,
    );

    await waitFor(() => {
      expect(mockToDataURL).toHaveBeenCalledWith(
        "https://jobline.ai/verify/OAP-ABC123-2026",
        expect.objectContaining({ width: 320 }),
      );
    });

    expect(screen.getByText("jobline.ai/verify")).toBeInTheDocument();
  });
});