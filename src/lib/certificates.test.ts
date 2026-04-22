import { describe, expect, it, vi } from "vitest";

import {
  isCertIdValid,
  programFromCertId,
  qrPayload,
  verificationUrl,
  verticalFromCertId,
} from "./certificates";

describe("certificates", () => {
  it("builds a verify URL with an explicit origin", () => {
    expect(verificationUrl("OAP-ABC123-2026", "https://example.test")).toBe(
      "https://example.test/verify/OAP-ABC123-2026",
    );
  });

  it("includes the QR token in the verification payload", () => {
    expect(qrPayload("GCA-XYZ789-2026", "token-123", "https://jobline.ai")).toBe(
      "https://jobline.ai/verify/GCA-XYZ789-2026?t=token-123",
    );
  });

  it("accepts legacy and vertical-prefixed certificate IDs", () => {
    expect(isCertIdValid("OAP-ABC123-2026")).toBe(true);
    expect(isCertIdValid("OAP-WELD-ABC123-2026")).toBe(true);
    expect(isCertIdValid("GCA-ABC123-2026")).toBe(true);
    expect(isCertIdValid("BAD-123")).toBe(false);
  });

  it("detects program and vertical from certificate IDs", () => {
    expect(programFromCertId("OAP-WELD-ABC123-2026")).toBe("OAP");
    expect(programFromCertId("GCA-ABC123-2026")).toBe("GCA");
    expect(programFromCertId("UNKNOWN-ABC123-2026")).toBeNull();

    expect(verticalFromCertId("OAP-WELD-ABC123-2026")).toBe("welding");
    expect(verticalFromCertId("OAP-ABC123-2026")).toBe("machining");
    expect(verticalFromCertId("OAP-UNK-ABC123-2026")).toBe("general");
  });
});
