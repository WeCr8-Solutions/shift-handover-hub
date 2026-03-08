import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock useToast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock useGeneralSettings
const mockGetSetting = vi.fn();
const mockUpdateSetting = vi.fn();
vi.mock("@/hooks/useGeneralSettings", () => ({
  useGeneralSettings: () => ({
    getSetting: mockGetSetting,
    updateSetting: mockUpdateSetting,
    loading: false,
    settings: [],
    refresh: vi.fn(),
  }),
}));

// Import after mocks
import { useSettingsForm } from "../useSettingsForm";

const DEFAULTS = {
  timezone: "America/New_York",
  darkMode: false,
  refreshInterval: 30,
};

describe("useSettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSetting.mockReturnValue(null);
    mockUpdateSetting.mockResolvedValue({ error: null });
  });

  it("initializes with default values when no saved setting exists", () => {
    const { result } = renderHook(() =>
      useSettingsForm({ settingKey: "test_prefs", defaults: DEFAULTS })
    );

    expect(result.current.form).toEqual(DEFAULTS);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("merges saved values with defaults", () => {
    mockGetSetting.mockReturnValue({ timezone: "UTC", extraField: "ignored" });

    const { result } = renderHook(() =>
      useSettingsForm({ settingKey: "test_prefs", defaults: DEFAULTS })
    );

    expect(result.current.form.timezone).toBe("UTC");
    expect(result.current.form.darkMode).toBe(false); // default preserved
    expect(result.current.isDirty).toBe(false);
  });

  it("tracks dirty state correctly", () => {
    const { result } = renderHook(() =>
      useSettingsForm({ settingKey: "test_prefs", defaults: DEFAULTS })
    );

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.update("timezone", "UTC");
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.form.timezone).toBe("UTC");
  });

  it("discard reverts to initial state", () => {
    const { result } = renderHook(() =>
      useSettingsForm({ settingKey: "test_prefs", defaults: DEFAULTS })
    );

    act(() => {
      result.current.update("timezone", "UTC");
      result.current.update("darkMode", true);
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.discard();
    });

    expect(result.current.form).toEqual(DEFAULTS);
    expect(result.current.isDirty).toBe(false);
  });

  it("save calls updateSetting and shows success toast", async () => {
    const { result } = renderHook(() =>
      useSettingsForm({
        settingKey: "test_prefs",
        defaults: DEFAULTS,
        successMessage: "Saved!",
      })
    );

    act(() => {
      result.current.update("timezone", "UTC");
    });

    await act(async () => {
      await result.current.save();
    });

    expect(mockUpdateSetting).toHaveBeenCalledWith(
      "test_prefs",
      expect.objectContaining({ timezone: "UTC" }),
      "general"
    );
    expect(mockToast).toHaveBeenCalledWith({ title: "Saved!" });
    expect(result.current.isDirty).toBe(false);
  });

  it("save shows error toast on failure", async () => {
    mockUpdateSetting.mockResolvedValue({ error: "RLS policy violation" });

    const { result } = renderHook(() =>
      useSettingsForm({ settingKey: "test_prefs", defaults: DEFAULTS })
    );

    act(() => {
      result.current.update("timezone", "UTC");
    });

    await act(async () => {
      await result.current.save();
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Failed to save settings",
        variant: "destructive",
      })
    );
    // Form should still be dirty since save failed
    expect(result.current.isDirty).toBe(true);
  });

  it("uses custom settingType when provided", async () => {
    const { result } = renderHook(() =>
      useSettingsForm({
        settingKey: "mfg_prefs",
        defaults: DEFAULTS,
        settingType: "manufacturing",
      })
    );

    act(() => {
      result.current.update("darkMode", true);
    });

    await act(async () => {
      await result.current.save();
    });

    expect(mockUpdateSetting).toHaveBeenCalledWith(
      "mfg_prefs",
      expect.any(Object),
      "manufacturing"
    );
  });
});
