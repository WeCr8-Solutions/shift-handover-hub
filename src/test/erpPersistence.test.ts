import { describe, expect, it } from "vitest";

import {
  getErpReadThroughSkipMessage,
  getSapWriteThroughBlockedMessage,
  resolveErpSyncPersistenceDecision,
} from "../../supabase/functions/_shared/erpPersistence";

describe("ERP persistence gates", () => {
  it("blocks queue persistence for read_through orgs unless the request is explicitly read-only", () => {
    expect(resolveErpSyncPersistenceDecision("read_through", false)).toEqual({
      allowWriteThrough: false,
      allowReadOnlyFetch: false,
      shouldSkipPersistence: true,
    });

    expect(resolveErpSyncPersistenceDecision("read_through", true)).toEqual({
      allowWriteThrough: false,
      allowReadOnlyFetch: true,
      shouldSkipPersistence: false,
    });
  });

  it("allows persistence only for write_through orgs", () => {
    expect(resolveErpSyncPersistenceDecision("write_through", false)).toEqual({
      allowWriteThrough: true,
      allowReadOnlyFetch: false,
      shouldSkipPersistence: false,
    });
  });

  it("uses explicit compliance messaging for blocked persistence paths", () => {
    expect(getErpReadThroughSkipMessage()).toContain("read_through mode");
    expect(getErpReadThroughSkipMessage()).toContain("ITAR/FedRAMP");
    expect(getSapWriteThroughBlockedMessage()).toContain("read_through mode");
    expect(getSapWriteThroughBlockedMessage()).toContain("Data not persisted");
  });
});