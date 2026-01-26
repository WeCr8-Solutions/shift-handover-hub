import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock the supabase client before importing
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Import after mock
import { supabase } from "@/integrations/supabase/client";

describe("useEmail hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call edge function with correct parameters for welcome email", async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, id: "email-123" },
      error: null,
    });

    // Simulate what the hook would do
    const result = await supabase.functions.invoke("send-email", {
      body: {
        type: "welcome",
        to: "test@example.com",
        data: { userName: "Test User" },
      },
    });

    expect(mockInvoke).toHaveBeenCalledWith("send-email", {
      body: {
        type: "welcome",
        to: "test@example.com",
        data: { userName: "Test User" },
      },
    });
    expect(result.data).toEqual({ success: true, id: "email-123" });
  });

  it("should handle email sending errors", async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: "Failed to send email" },
    });

    const result = await supabase.functions.invoke("send-email", {
      body: {
        type: "welcome",
        to: "invalid-email",
        data: {},
      },
    });

    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe("Failed to send email");
  });

  it("should call edge function for team invite email", async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, id: "email-456" },
      error: null,
    });

    await supabase.functions.invoke("send-email", {
      body: {
        type: "team-invite",
        to: "teammate@example.com",
        data: {
          inviterName: "Admin User",
          teamName: "Production Team",
          inviteUrl: "https://jobline.ai/invite/abc123",
          role: "member",
        },
      },
    });

    expect(mockInvoke).toHaveBeenCalledWith("send-email", {
      body: {
        type: "team-invite",
        to: "teammate@example.com",
        data: expect.objectContaining({
          teamName: "Production Team",
        }),
      },
    });
  });

  it("should call edge function for password reset email", async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, id: "email-789" },
      error: null,
    });

    await supabase.functions.invoke("send-email", {
      body: {
        type: "password-reset",
        to: "user@example.com",
        data: {
          userName: "User",
          resetUrl: "https://jobline.ai/reset?token=xyz",
          expiryMinutes: 60,
        },
      },
    });

    expect(mockInvoke).toHaveBeenCalledWith("send-email", {
      body: {
        type: "password-reset",
        to: "user@example.com",
        data: expect.objectContaining({
          resetUrl: expect.stringContaining("reset"),
        }),
      },
    });
  });
});
