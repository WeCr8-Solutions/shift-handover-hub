import { describe, it, expect, vi, beforeEach } from "vitest";

const successMock = vi.fn();
const errorMock = vi.fn();
const warningMock = vi.fn();
const baseMock = vi.fn();
const promiseMock = vi.fn();
const dismissMock = vi.fn();

vi.mock("sonner", () => {
  const toast: any = (...args: any[]) => baseMock(...args);
  toast.success = (...args: any[]) => successMock(...args);
  toast.error = (...args: any[]) => errorMock(...args);
  toast.warning = (...args: any[]) => warningMock(...args);
  toast.promise = (...args: any[]) => promiseMock(...args);
  toast.dismiss = (...args: any[]) => dismissMock(...args);
  return { toast };
});

import { woToast } from "./woToast";

describe("woToast", () => {
  beforeEach(() => {
    successMock.mockClear();
    errorMock.mockClear();
    warningMock.mockClear();
    baseMock.mockClear();
    promiseMock.mockClear();
    dismissMock.mockClear();
  });

  it("prefixes WO number into success title", () => {
    woToast.success("Work order completed", "WO-123");
    expect(successMock).toHaveBeenCalledWith(
      "Work order completed · WO-123",
      expect.objectContaining({ duration: 3000 }),
    );
  });

  it("omits prefix when WO number is empty/nullish", () => {
    woToast.success("Saved");
    expect(successMock).toHaveBeenCalledWith(
      "Saved",
      expect.objectContaining({ duration: 3000 }),
    );
    woToast.success("Saved", "  ");
    expect(successMock).toHaveBeenLastCalledWith(
      "Saved",
      expect.any(Object),
    );
  });

  it("routes error with longer duration and description", () => {
    woToast.error("Failed to advance", "RPC blew up", "WO-9");
    expect(errorMock).toHaveBeenCalledWith(
      "Failed to advance · WO-9",
      expect.objectContaining({ description: "RPC blew up", duration: 6000 }),
    );
  });

  it("routes blocked through warning with 5s duration", () => {
    woToast.blocked("Quality sign-off required", "QA must approve first");
    expect(warningMock).toHaveBeenCalledWith(
      "Quality sign-off required",
      expect.objectContaining({ description: "QA must approve first", duration: 5000 }),
    );
  });

  it("info uses base toast with 3s duration", () => {
    woToast.info("WO-1 copied");
    expect(baseMock).toHaveBeenCalledWith(
      "WO-1 copied",
      expect.objectContaining({ duration: 3000 }),
    );
  });

  it("promise forwards labels with WO prefix", () => {
    const p = Promise.resolve("ok");
    woToast.promise(p, {
      loading: "Saving",
      success: "Saved",
      error: "Failed",
      woNumber: "WO-7",
    });
    expect(promiseMock).toHaveBeenCalledTimes(1);
    const [promiseArg, opts] = promiseMock.mock.calls[0];
    expect(promiseArg).toBe(p);
    expect(opts.loading).toBe("Saving · WO-7");
    expect(opts.success("v")).toBe("Saved · WO-7");
    expect(opts.error(new Error("x"))).toBe("Failed · WO-7");
  });

  it("dismiss passes id through", () => {
    woToast.dismiss(42);
    expect(dismissMock).toHaveBeenCalledWith(42);
  });
});
