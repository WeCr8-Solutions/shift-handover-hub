import { describe, it, expect } from "vitest";
import {
  getPriorityBadgeColor,
  getPriorityDotColor,
  getPriorityConfig,
  getPriorityLightColor,
  getQueueStatusBadgeColor,
  getQueueStatusBorderColor,
  getQueueStatusColumnColor,
  getSeverityBadgeColor,
  getSeverityLightColor,
  getSystemStatusColor,
  getNotificationStatusColor,
  getDevPriorityColor,
  getDevStatusColor,
  getIssueStatusColor,
  getReviewStatusColor,
  getRoleBadgeColor,
  getRoleTextColor,
  UPDATE_CATEGORY_COLORS,
  UPDATE_IMPACT_COLORS,
  UPDATE_STATUS_COLORS,
  OPERATION_TYPE_COLORS,
  WORK_CENTER_COLORS,
} from "./status-colors";

describe("status-colors", () => {
  describe("getPriorityBadgeColor", () => {
    it("returns semantic tokens for all priority levels", () => {
      expect(getPriorityBadgeColor("critical")).toContain("bg-priority-critical");
      expect(getPriorityBadgeColor("urgent")).toContain("bg-priority-urgent");
      expect(getPriorityBadgeColor("high")).toContain("bg-priority-high");
      expect(getPriorityBadgeColor("normal")).toContain("bg-status-waiting");
      expect(getPriorityBadgeColor("low")).toContain("bg-muted");
    });

    it("returns fallback for unknown priority", () => {
      expect(getPriorityBadgeColor("unknown")).toContain("bg-muted");
    });

    it("never contains hardcoded color classes", () => {
      const priorities = ["critical", "urgent", "high", "normal", "low", "unknown"];
      priorities.forEach((p) => {
        const result = getPriorityBadgeColor(p);
        expect(result).not.toMatch(/bg-(red|orange|yellow|blue|gray|green)-/);
        expect(result).not.toContain("text-white");
      });
    });
  });

  describe("getPriorityDotColor", () => {
    it("returns dot-only classes without text", () => {
      expect(getPriorityDotColor("critical")).toBe("bg-priority-critical");
      expect(getPriorityDotColor("low")).toBe("bg-muted-foreground/40");
    });
  });

  describe("getPriorityConfig", () => {
    it("returns bg, text, and border for each level", () => {
      const cfg = getPriorityConfig("critical");
      expect(cfg).toHaveProperty("bg");
      expect(cfg).toHaveProperty("text");
      expect(cfg).toHaveProperty("border");
      expect(cfg.bg).toContain("bg-priority-critical");
    });
  });

  describe("getQueueStatusBadgeColor", () => {
    it("returns semantic tokens for all statuses", () => {
      expect(getQueueStatusBadgeColor("pending")).toContain("bg-muted");
      expect(getQueueStatusBadgeColor("in_progress")).toContain("bg-status-ok");
      expect(getQueueStatusBadgeColor("cancelled")).toContain("bg-status-critical");
    });

    it("never contains hardcoded colors", () => {
      const statuses = ["pending", "queued", "in_progress", "on_hold", "completed", "cancelled"];
      statuses.forEach((s) => {
        const result = getQueueStatusBadgeColor(s);
        expect(result).not.toMatch(/bg-(red|green|blue|yellow|purple|gray)-\d/);
      });
    });
  });

  describe("getQueueStatusBorderColor", () => {
    it("returns border-l- prefixed classes", () => {
      expect(getQueueStatusBorderColor("in_progress")).toContain("border-l-");
      expect(getQueueStatusBorderColor("completed")).toContain("border-l-status-ok");
    });
  });

  describe("getSeverityBadgeColor", () => {
    it("maps severity to semantic tokens", () => {
      expect(getSeverityBadgeColor("critical")).toContain("bg-destructive");
      expect(getSeverityBadgeColor("high")).toContain("bg-priority-urgent");
      expect(getSeverityBadgeColor("medium")).toContain("bg-warning");
      expect(getSeverityBadgeColor("low")).toContain("bg-status-ok");
    });
  });

  describe("getSystemStatusColor", () => {
    it("returns dotClass and badgeClass", () => {
      const result = getSystemStatusColor("operational");
      expect(result.dotClass).toContain("bg-status-ok");
      expect(result.badgeClass).toContain("text-status-ok");
    });

    it("adds animate-pulse for degraded/outage", () => {
      expect(getSystemStatusColor("degraded").dotClass).toContain("animate-pulse");
      expect(getSystemStatusColor("outage").dotClass).toContain("animate-pulse");
      expect(getSystemStatusColor("operational").dotClass).not.toContain("animate-pulse");
    });
  });

  describe("getRoleBadgeColor", () => {
    it("maps roles to role-* tokens", () => {
      expect(getRoleBadgeColor("admin")).toContain("text-role-admin");
      expect(getRoleBadgeColor("supervisor")).toContain("text-role-supervisor");
      expect(getRoleBadgeColor("operator")).toContain("text-role-operator");
    });
  });

  describe("getRoleTextColor", () => {
    it("returns text-role-* for known roles", () => {
      expect(getRoleTextColor("admin")).toBe("text-role-admin");
      expect(getRoleTextColor("viewer")).toBe("text-muted-foreground");
    });
  });

  describe("static color maps", () => {
    it("UPDATE_CATEGORY_COLORS has all categories", () => {
      expect(UPDATE_CATEGORY_COLORS).toHaveProperty("feature");
      expect(UPDATE_CATEGORY_COLORS).toHaveProperty("bug_fix");
      expect(UPDATE_CATEGORY_COLORS).toHaveProperty("maintenance");
      expect(UPDATE_CATEGORY_COLORS.feature).not.toMatch(/bg-(blue|red|green)-\d/);
    });

    it("UPDATE_IMPACT_COLORS has all levels", () => {
      expect(UPDATE_IMPACT_COLORS).toHaveProperty("low");
      expect(UPDATE_IMPACT_COLORS).toHaveProperty("critical");
    });

    it("OPERATION_TYPE_COLORS has all types with color and ring", () => {
      expect(OPERATION_TYPE_COLORS.internal).toHaveProperty("color");
      expect(OPERATION_TYPE_COLORS.internal).toHaveProperty("ring");
      expect(OPERATION_TYPE_COLORS.outside_processing.ring).toContain("ring-warning");
    });

    it("WORK_CENTER_COLORS uses semantic tokens", () => {
      expect(WORK_CENTER_COLORS["CNC Mill"]).toBe("text-info");
      expect(WORK_CENTER_COLORS["TIG Welding"]).toBe("text-status-critical");
      Object.values(WORK_CENTER_COLORS).forEach((color) => {
        expect(color).not.toMatch(/text-(cyan|red|blue|green|purple|amber|yellow|emerald|teal|indigo|violet|pink|lime|slate|orange)-\d/);
      });
    });
  });
});
