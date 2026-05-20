import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TermCard } from "./TermCard";
import { TERMS } from "@/lib/LearnGlossaryData";

beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as typeof IntersectionObserver;
});

describe("TermCard", () => {
  it("renders token with ELI5 visual support and clearer section labels", () => {
    const token = TERMS.find((term) => term.id === "token");

    if (!token) {
      throw new Error("Token term missing");
    }

    render(
      <MemoryRouter>
        <TermCard term={token} index={0} onSparkClick={vi.fn()} ideaCaptured={false} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText(/a token is one small piece of text the model reads before it can answer/i));

    expect(screen.getByText(/picture it like this/i)).toBeInTheDocument();
    expect(screen.getByText(/the model does not hold one giant thought bubble/i)).toBeInTheDocument();
    expect(screen.getByText(/summarize/i)).toBeInTheDocument();
    expect(screen.getByText(/inside the model/i)).toBeInTheDocument();
    expect(screen.getByText(/how to apply it/i)).toBeInTheDocument();
    expect(screen.getByText(/where you might notice this/i)).toBeInTheDocument();
    expect(screen.getByText(/^optional reflection$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save optional reflection/i })).toBeInTheDocument();
  });
});