import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  user: null as null | { id: string },
  credentials: [] as Array<{
    id: string;
    issuing_organization_name: string;
    cert_id: string | null;
    role_program_name: string | null;
    machine_tags: string[];
    approved_operations: string[];
    issued_at: string;
    expires_at: string | null;
    status: "active" | "expired" | "revoked" | "superseded";
    is_portable: boolean;
  }>,
  tokens: [] as Array<{
    id: string;
    token: string;
    expires_at: string;
    redeemed_at: string | null;
  }>,
  toggleMutate: vi.fn(),
  createTokenMutate: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: state.user,
  }),
}));

vi.mock("@/hooks/useOapRecert", () => ({
  useMyCredentials: () => ({ data: state.credentials }),
  useMyTransferTokens: () => ({ data: state.tokens }),
  useToggleCredentialPortability: () => ({ mutate: state.toggleMutate }),
  useCreateTransferToken: () => ({ mutate: state.createTokenMutate, isPending: false }),
}));

vi.mock("@/components/Header", () => ({
  Header: () => <div>Header</div>,
}));

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: state.toastSuccess,
  },
}));

import OapMyTranscript from "./OapMyTranscript";

describe("OapMyTranscript", () => {
  beforeEach(() => {
    state.user = null;
    state.credentials = [];
    state.tokens = [];
    state.toggleMutate.mockReset();
    state.createTokenMutate.mockReset();
    state.toastSuccess.mockReset();
  });

  it("prompts unauthenticated users to sign in", () => {
    render(<OapMyTranscript />);

    expect(screen.getByText(/Sign in to view your transcript/i)).toBeInTheDocument();
    expect(screen.queryByText(/Earned credentials/i)).not.toBeInTheDocument();
  });

  it("renders portable credentials and recent transfer codes for signed-in users", async () => {
    state.user = { id: "user-1" };
    state.credentials = [
      {
        id: "cred-1",
        issuing_organization_name: "ACME Manufacturing",
        cert_id: "OAP-ABC123-2026",
        role_program_name: "CNC Lathe Operator",
        machine_tags: ["Haas ST-20"],
        approved_operations: ["turning", "inspection"],
        issued_at: "2026-04-01T00:00:00.000Z",
        expires_at: null,
        status: "active",
        is_portable: true,
      },
    ];
    state.tokens = [
      {
        id: "token-1",
        token: "TRANSFER-CODE-123",
        expires_at: "2099-04-01T00:00:00.000Z",
        redeemed_at: null,
      },
    ];

    const user = userEvent.setup();
    render(<OapMyTranscript />);

    expect(screen.getByRole("heading", { name: /My OAP Transcript/i })).toBeInTheDocument();
    expect(screen.getByText(/ACME Manufacturing/i)).toBeInTheDocument();
    expect(screen.getByText(/CNC Lathe Operator/i)).toBeInTheDocument();
    expect(screen.getByText(/OAP-ABC123-2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Haas ST-20/i)).toBeInTheDocument();
    expect(screen.getByText(/turning/i)).toBeInTheDocument();
    expect(screen.getByText(/inspection/i)).toBeInTheDocument();
    expect(screen.getByText(/Shareable/i)).toBeInTheDocument();
    expect(screen.getByText(/TRANSFER-CODE-123/i)).toBeInTheDocument();
    expect(screen.getByText(/only exposes employer name, machine tags, operation tags, cert IDs, and dates/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Generate transfer code/i }));
    expect(state.createTokenMutate).toHaveBeenCalledWith("user-1");
  });

  it("toggles portability for rendered credentials", async () => {
    state.user = { id: "user-1" };
    state.credentials = [
      {
        id: "cred-2",
        issuing_organization_name: "Beta Precision",
        cert_id: "OAP-XYZ789-2026",
        role_program_name: null,
        machine_tags: [],
        approved_operations: [],
        issued_at: "2026-04-01T00:00:00.000Z",
        expires_at: null,
        status: "active",
        is_portable: false,
      },
    ];

    const user = userEvent.setup();
    render(<OapMyTranscript />);

    await user.click(screen.getByRole("switch"));

    expect(state.toggleMutate).toHaveBeenCalledWith({
      id: "cred-2",
      isPortable: true,
    });
  });
});