import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsSwitchRow } from "../SettingsSwitchRow";

describe("SettingsSwitchRow", () => {
  it("renders label and description", () => {
    render(
      <SettingsSwitchRow
        label="Dark Mode"
        description="Enable dark theme"
        checked={false}
        onCheckedChange={vi.fn()}
      />
    );
    expect(screen.getByText("Dark Mode")).toBeInTheDocument();
    expect(screen.getByText("Enable dark theme")).toBeInTheDocument();
  });

  it("renders without description", () => {
    render(
      <SettingsSwitchRow label="Toggle" checked={true} onCheckedChange={vi.fn()} />
    );
    expect(screen.getByText("Toggle")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("applies bordered class when bordered prop is true", () => {
    const { container } = render(
      <SettingsSwitchRow label="Test" checked={false} onCheckedChange={vi.fn()} bordered />
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("border");
  });

  it("calls onCheckedChange when toggled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SettingsSwitchRow label="Test" checked={false} onCheckedChange={onChange} />
    );
    await user.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
