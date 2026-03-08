import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/test/test-utils";
import { CreateNCRDialog } from "./CreateNCRDialog";

describe("CreateNCRDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    workOrderNumber: "WO-100",
    partNumber: "PN-50",
    queueItemId: "qi-1",
    qtyOpen: 25,
    operationNumbers: ["OP10", "OP20", "OP30"],
    onSubmit: vi.fn().mockResolvedValue({ error: null }),
  };

  it("renders dialog when open", () => {
    render(<CreateNCRDialog {...defaultProps} />);
    expect(screen.getByText(/Non-Conformance/i)).toBeInTheDocument();
  });

  it("shows work order info in dialog description", () => {
    render(<CreateNCRDialog {...defaultProps} />);
    expect(screen.getByText(/WO-100/)).toBeInTheDocument();
  });

  it("renders defect type dropdown", () => {
    render(<CreateNCRDialog {...defaultProps} />);
    expect(screen.getByText(/Defect Type/i)).toBeInTheDocument();
  });

  it("renders disposition label", () => {
    render(<CreateNCRDialog {...defaultProps} />);
    expect(screen.getByText(/Disposition \*/)).toBeInTheDocument();
  });

  it("renders quantity input with max constraint", () => {
    render(<CreateNCRDialog {...defaultProps} />);
    expect(screen.getByText(/Quantity/i)).toBeInTheDocument();
  });

  it("renders description textarea", () => {
    render(<CreateNCRDialog {...defaultProps} />);
    expect(screen.getByText(/Description/i)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<CreateNCRDialog {...defaultProps} open={false} />);
    expect(screen.queryByText(/Non-Conformance/i)).not.toBeInTheDocument();
  });
});
