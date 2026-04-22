export type ErpPersistenceMode = "read_through" | "write_through" | string;

export interface ErpSyncPersistenceDecision {
  allowWriteThrough: boolean;
  allowReadOnlyFetch: boolean;
  shouldSkipPersistence: boolean;
}

const ERP_READ_THROUGH_MESSAGE =
  "Organization is in read_through mode (default for ITAR/FedRAMP). " +
  "JobBOSS work orders are not copied into Lovable Cloud — the dashboard reads them live. " +
  "Set erp_persistence_mode='write_through' on a non-ITAR org to enable sync.";

const SAP_READ_THROUGH_MESSAGE =
  "Organization is in read_through mode (default for ITAR/FedRAMP). Data not persisted to Lovable Cloud.";

export function resolveErpSyncPersistenceDecision(
  persistenceMode: ErpPersistenceMode,
  readOnly: boolean,
): ErpSyncPersistenceDecision {
  if (persistenceMode === "read_through") {
    return {
      allowWriteThrough: false,
      allowReadOnlyFetch: readOnly,
      shouldSkipPersistence: !readOnly,
    };
  }

  return {
    allowWriteThrough: true,
    allowReadOnlyFetch: false,
    shouldSkipPersistence: false,
  };
}

export function getErpReadThroughSkipMessage() {
  return ERP_READ_THROUGH_MESSAGE;
}

export function getSapWriteThroughBlockedMessage() {
  return SAP_READ_THROUGH_MESSAGE;
}
