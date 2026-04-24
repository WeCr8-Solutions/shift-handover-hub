import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingSettings } from "../OnboardingSettings";

const navigateMock = vi.fn();
const startTourMock = vi.fn();
const resetOnboardingMock = vi.fn().mockResolvedValue(undefined);

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/components/onboarding/OnboardingProvider", () => ({
  CORE_STEPS: [
    { id: "welcome", title: "Welcome to JobLine.ai", description: "Start here" },
    { id: "organization-setup", title: "Create Your Organization", description: "Org setup" },
  ],
  PRO_STEPS: [],
  useOnboardingContext: () => ({
    isComplete: false,
    isLoading: false,
    getProgress: () => 25,
    isStepCompleted: (stepId: string) => stepId === "welcome",
    resetOnboarding: resetOnboardingMock,
    startTour: startTourMock,
    currentStep: "organization-setup",
  }),
}));

describe("OnboardingSettings", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    startTourMock.mockReset();
    resetOnboardingMock.mockClear();
  });

  it("reopens welcome flow from settings without auto-starting the guided tour", async () => {
    const user = userEvent.setup();

    render(<OnboardingSettings />);

    await user.click(screen.getByRole("button", { name: /show welcome again/i }));

    expect(resetOnboardingMock).toHaveBeenCalledOnce();
    expect(navigateMock).toHaveBeenCalledWith("/setup");
    expect(startTourMock).not.toHaveBeenCalled();
  });
});