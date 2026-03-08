import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsFooter } from "../SettingsFooter";

describe("SettingsFooter", () => {
  it("shows 'Saved' when not dirty", () => {
    render(<SettingsFooter isDirty={false} isSaving={false} onSave={vi.fn()} />);
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("shows save label and unsaved badge when dirty", () => {
    render(<SettingsFooter isDirty={true} isSaving={false} onSave={vi.fn()} label="Save General" />);
    expect(screen.getByText("Save General")).toBeInTheDocument();
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  it("disables save button when saving", () => {
    render(<SettingsFooter isDirty={true} isSaving={true} onSave={vi.fn()} />);
    const button = screen.getByRole("button", { name: /saving/i });
    expect(button).toBeDisabled();
  });

  it("disables save button when not dirty", () => {
    render(<SettingsFooter isDirty={false} isSaving={false} onSave={vi.fn()} />);
    const button = screen.getByRole("button", { name: /saved/i });
    expect(button).toBeDisabled();
  });

  it("calls onSave when save button is clicked", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<SettingsFooter isDirty={true} isSaving={false} onSave={onSave} />);
    await user.click(screen.getByText("Save Settings"));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("renders discard button when onDiscard is provided and dirty", async () => {
    const user = userEvent.setup();
    const onDiscard = vi.fn();
    render(<SettingsFooter isDirty={true} isSaving={false} onSave={vi.fn()} onDiscard={onDiscard} />);
    await user.click(screen.getByText("Discard"));
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it("does not render discard button when not dirty", () => {
    render(<SettingsFooter isDirty={false} isSaving={false} onSave={vi.fn()} onDiscard={vi.fn()} />);
    expect(screen.queryByText("Discard")).not.toBeInTheDocument();
  });
});
