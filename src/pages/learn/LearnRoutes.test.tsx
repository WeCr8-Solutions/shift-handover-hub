import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("@/components/SEOHead", () => ({
  SEOHead: () => null,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

import LearnIndex from "./LearnIndex";
import LearnGlossary from "./LearnGlossary";
import LearnTermDetail from "./LearnTermDetail";
import LearnFundamentals from "./fundamentals/LearnFundamentals";
import LearnProfessions from "./professions/LearnProfessions";
import LearnProfessionDetail from "./professions/LearnProfessionDetail";
import LearnTutorials from "./tutorials/LearnTutorials";
import OpenClawInstallGuide from "./tutorials/openclaw/OpenClawInstallGuide";
import HermesInstallGuide from "./tutorials/hermes/HermesInstallGuide";
import NemoClawInstallGuide from "./tutorials/nemoclaw/NemoClawInstallGuide";

beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    root = null;
    rootMargin = "0px";
    thresholds = [];

    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
});

function renderPage(ui: React.ReactNode, path: string, routePath = "*") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={routePath} element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("learning routes", () => {
  it("renders the learning center page without crashing", () => {
    renderPage(<LearnIndex />, "/learn");

    expect(
      screen.getByRole("heading", {
        name: /learn manufacturing ai in practical terms, by topic, by role, and by tutorial track/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start with fundamentals/i })).toHaveAttribute("href", "/learn/fundamentals");
    expect(screen.getByRole("link", { name: /see role guides/i })).toHaveAttribute("href", "/learn/professions");
    expect(screen.getByRole("heading", { name: /ai glossary for manufacturing/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /choose a learning path tier/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^automation$/i })).toBeInTheDocument();
  });

  it("renders the glossary route with term content and bridge links", () => {
    renderPage(<LearnGlossary />, "/learn/glossary");

    expect(
      screen.getByRole("heading", {
        name: /plain-language ai concepts for manufacturing teams that want practical understanding first/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/a token is one small piece of text the model reads before it can answer/i)[0]).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to learning center/i })).toHaveAttribute("href", "/learn");
    expect(screen.getByText(/integration bridges/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /my reflections/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /featured term explainers/i })).toBeInTheDocument();
  });

  it("renders the fundamentals landing route", () => {
    renderPage(<LearnFundamentals />, "/learn/fundamentals");

    expect(
      screen.getByRole("heading", {
        name: /manufacturing ai fundamentals, explained for practical shop use/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/why vision systems help inspection/i)).toBeInTheDocument();
    expect(screen.getByText(/human in the loop vs human on the loop/i)).toBeInTheDocument();
    expect(screen.getByText(/how phone-based agents work in slack, telegram, and teams/i)).toBeInTheDocument();
  });

  it("renders the professions landing route", () => {
    renderPage(<LearnProfessions />, "/learn/professions");

    expect(
      screen.getByRole("heading", {
        name: /learn ai in the context of the job you actually do/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/start with the ideas almost everyone should learn first/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /context window/i })).toBeInTheDocument();
    expect(screen.getByText(/quality and inspection staff/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /open role guide/i })[0]).toHaveAttribute("href", "/learn/professions/cnc-operators");
  });

  it("renders a dedicated glossary term page", () => {
    renderPage(<LearnTermDetail />, "/learn/glossary/chat-agent", "/learn/glossary/:termId");

    expect(screen.getByRole("heading", { name: /^chat agent$/i })).toBeInTheDocument();
    expect(screen.getByText(/a chat agent is an ai workflow reached through messaging surfaces/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to glossary/i })).toHaveAttribute("href", "/learn/glossary");
  });

  it("renders a dedicated profession guide page", () => {
    renderPage(<LearnProfessionDetail />, "/learn/professions/quality-inspection", "/learn/professions/:roleSlug");

    expect(screen.getByRole("heading", { name: /ai for quality inspectors/i })).toBeInTheDocument();
    expect(screen.getByText(/traceability, evidence, vision-system support, and human review boundaries/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to role guides/i })).toHaveAttribute("href", "/learn/professions");
  });

  it("renders the tutorials landing route", () => {
    renderPage(<LearnTutorials />, "/learn/tutorials");

    expect(
      screen.getByRole("heading", {
        name: /named tutorial ecosystems built for high-intent searches/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/openclaw tutorials/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /choose your first tutorial in 30 seconds/i })).toBeInTheDocument();
    expect(screen.getByText(/if you are under pressure and need the fastest first win/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /open install guide/i })).toHaveLength(3);
  });

  it("renders the OpenClaw install guide", () => {
    renderPage(<OpenClawInstallGuide />, "/learn/tutorials/openclaw-install");

    expect(screen.getByRole("heading", { name: /openclaw install guide/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /step 0: choose the right path/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /step 1: start here like you're new/i })).toBeInTheDocument();
    expect(screen.getByText(/giving an ai worker a desk, a phone, and a rulebook/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /step 5: your first agentic workflow/i })).toBeInTheDocument();
    expect(screen.getByText(/make a simple shift-handoff helper/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /option 1: recommended path: hosted installer/i })).toBeInTheDocument();
    expect(screen.getAllByText(/openclaw doctor/i).length).toBeGreaterThan(0);
  });

  it("renders the Hermes install guide", () => {
    renderPage(<HermesInstallGuide />, "/learn/tutorials/hermes-install");

    expect(screen.getByRole("heading", { name: /hermes install guide/i })).toBeInTheDocument();
    expect(screen.getByText(/inside a protected workshop/i)).toBeInTheDocument();
    expect(screen.getByText(/guarded research-and-response helper/i)).toBeInTheDocument();
    expect(screen.getByText(/nemohermes onboard/i)).toBeInTheDocument();
    expect(screen.getAllByText(/port 8642/i).length).toBeGreaterThan(0);
  });

  it("renders the NemoClaw install guide", () => {
    renderPage(<NemoClawInstallGuide />, "/learn/tutorials/nemoclaw-install");

    expect(screen.getByRole("heading", { name: /nemoclaw install guide/i })).toBeInTheDocument();
    expect(screen.getByText(/safe fenced yard for your ai worker/i)).toBeInTheDocument();
    expect(screen.getByText(/build a sandboxed daily-ops assistant/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /option 1: recommended path: installer plus guided onboarding/i })).toBeInTheDocument();
    expect(screen.getAllByText(/gateway token/i).length).toBeGreaterThan(0);
  });
});