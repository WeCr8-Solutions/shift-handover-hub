import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  AlertTriangle,
  Clock3,
  ExternalLink,
  RefreshCw,
  Server,
  ShieldCheck,
  Siren,
  Waypoints,
} from "lucide-react";

import { releaseInfo } from "@/generated/release";

interface HealthComponent {
  name: string;
  status: string;
}

interface HealthResponse {
  status: string;
  service?: string;
  checkedAt?: string;
  components?: HealthComponent[];
}

const incidentCommitments = [
  {
    title: "Initial update within 15 minutes",
    body: "Confirmed critical or widespread disruption should be acknowledged on this status surface promptly after validation.",
  },
  {
    title: "Federal customer notifications follow the ISCP",
    body: "P1 and P2 disruptions escalate under the documented contingency and incident response procedures.",
  },
  {
    title: "Recovery confirmation after restoration",
    body: "After restoration, this page should reflect normal operations and summarize the recovery state.",
  },
];

const fallbackComponents: HealthComponent[] = [
  { name: "Web Application", status: "operational" },
  { name: "API & Database", status: "operational" },
  { name: "Edge Functions", status: "operational" },
];

const componentDescriptions: Record<string, string> = {
  "Web Application": "Primary public and authenticated web surface served to operators, planners, and administrators.",
  "API & Database": "Supabase-backed auth, data, and realtime services used by production workflows.",
  "Edge Functions": "Operational automation, planning, and integration endpoints used across the platform.",
};

const referenceLinks = [
  {
    href: "/api/health",
    label: "Health Probe Payload",
    body: "Read the first-party probe payload exposed for uptime checks and customer visibility.",
  },
  {
    href: "/release.json",
    label: "View Release Manifest",
    body: "Confirm deployed version, short SHA, build timestamp, and deployment target.",
  },
  {
    href: "https://jobline.ai/help",
    label: "Help Center",
    body: "Reach support guidance, product documentation, and customer-facing remediation paths.",
  },
];

function formatProbeTimestamp(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  if (value === "build-time") {
    return "Build-time artifact";
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

function formatLocalTimestamp(value: Date | null) {
  if (!value) {
    return "Waiting for first probe";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function prettyStatus(status: string) {
  return status === "operational" || status === "ok" ? "Operational" : "Degraded";
}

export default function Status() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [probeError, setProbeError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refreshHealth = async () => {
      setIsRefreshing(true);

      try {
        const response = await fetch("/_api_health.json", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Health probe returned ${response.status}`);
        }

        const data = (await response.json()) as HealthResponse;
        if (!cancelled) {
          setHealth(data);
          setProbeError(null);
          setLastCheckedAt(new Date());
        }
      } catch (error) {
        if (!cancelled) {
          setProbeError(error instanceof Error ? error.message : "Unknown health probe error");
          setLastCheckedAt(new Date());
        }
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    };

    void refreshHealth();
    const intervalId = window.setInterval(() => {
      void refreshHealth();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const components = health?.components?.length ? health.components : fallbackComponents;
  const isOperational = health?.status === "ok" && !probeError;
  const systemLabel = isOperational ? "All monitored first-party services operational" : "Health visibility degraded";
  const probeLabel = probeError
    ? `The first-party health artifact could not be read: ${probeError}`
    : "Health artifact responding normally from the deployed application bundle.";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f9f5ec_0%,#f4f1e8_100%)] text-slate-900">
      <Helmet>
        <title>JobLine AI System Status | JobLine.ai</title>
        <meta
          name="description"
          content="Monitor JobLine.ai web, API, and edge service status, incident response commitments, and deployed build provenance from the first-party status surface."
        />
        <meta property="og:title" content="JobLine AI System Status | JobLine.ai" />
        <meta
          property="og:description"
          content="First-party operational status for JobLine.ai web, API, and incident communications."
        />
        <meta property="og:url" content="https://jobline.ai/status" />
        <link rel="canonical" href="https://jobline.ai/status" />
      </Helmet>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-slate-900/10 bg-white/80 p-7 shadow-[0_24px_60px_rgba(29,42,34,0.12)] backdrop-blur">
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
            JobLine AI System Status
          </span>
          <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-none tracking-[-0.04em] sm:text-6xl">
            Operational visibility for web, API, and incident communications.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            This first-party status surface satisfies the documented CP-2 continuity need while the external provider rollout is completed. It exposes current service posture, a live first-party health artifact, and the response commitments documented in the contingency plan.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-900/10 bg-white/70 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Primary endpoint</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">/status and status.jobline.ai</div>
            </div>
            <div className="rounded-2xl border border-slate-900/10 bg-white/70 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Health probe</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">/api/health</div>
            </div>
            <div className="rounded-2xl border border-slate-900/10 bg-white/70 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Control coverage</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">FedRAMP CP-2, SA-17</div>
            </div>
            <div className="rounded-2xl border border-slate-900/10 bg-white/70 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Current build</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{releaseInfo.releaseStamp}</div>
              <div className="mt-1 text-xs text-slate-500">{releaseInfo.deployTarget} • {releaseInfo.shortSha}</div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <section className="rounded-[28px] border border-slate-900/10 bg-white/80 p-6 shadow-[0_24px_60px_rgba(29,42,34,0.12)] backdrop-blur">
            <h2 className="font-serif text-2xl tracking-[-0.03em]">Current Status</h2>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-900/10 bg-emerald-50/80 p-4">
              <div>
                <div className="text-base font-semibold text-slate-900">{systemLabel}</div>
                <div className="mt-1 text-sm text-slate-600">{probeLabel}</div>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${isOperational ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {isOperational ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {isOperational ? "Operational" : "Probe Error"}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-900/10 bg-white/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Clock3 className="h-4 w-4 text-emerald-700" />
                  Last checked
                </div>
                <div className="mt-2 text-sm text-slate-600">{formatLocalTimestamp(lastCheckedAt)}</div>
              </div>
              <div className="rounded-2xl border border-slate-900/10 bg-white/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Server className="h-4 w-4 text-emerald-700" />
                  Artifact source
                </div>
                <div className="mt-2 text-sm text-slate-600">{formatProbeTimestamp(health?.checkedAt)}</div>
              </div>
              <div className="rounded-2xl border border-slate-900/10 bg-white/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <RefreshCw className={`h-4 w-4 text-emerald-700 ${isRefreshing ? "animate-spin" : ""}`} />
                  Probe cadence
                </div>
                <div className="mt-2 text-sm text-slate-600">Refreshes every 60 seconds from <span className="font-medium text-slate-900">/_api_health.json</span></div>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {components.map((component) => {
                const componentOperational = component.status === "operational" || component.status === "ok";

                return (
                  <div key={component.name} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-900/10 bg-white/70 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{component.name}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {componentDescriptions[component.name] ?? "Live status reported from the first-party health endpoint."}
                      </p>
                    </div>
                    <div className={`inline-flex whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold ${componentOperational ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {prettyStatus(component.status)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <a className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white px-4 py-2 font-medium text-slate-900 hover:bg-slate-50" href="/api/health">
                View Health JSON
                <ExternalLink className="h-4 w-4" />
              </a>
              <a className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white px-4 py-2 font-medium text-slate-900 hover:bg-slate-50" href="/release.json">
                View Release Manifest
                <ExternalLink className="h-4 w-4" />
              </a>
              <a className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white px-4 py-2 font-medium text-slate-900 hover:bg-slate-50" href="https://jobline.ai/help">
                Help Center
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </section>

          <div className="grid gap-5">
            <section className="rounded-[28px] border border-slate-900/10 bg-white/80 p-6 shadow-[0_24px_60px_rgba(29,42,34,0.12)] backdrop-blur">
              <h2 className="font-serif text-2xl tracking-[-0.03em]">Incident Response Commitments</h2>
              <div className="mt-4 space-y-4">
                {incidentCommitments.map((item) => (
                  <div key={item.title} className="border-l-2 border-emerald-700/20 pl-4">
                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                Health artifact source: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-900">/_api_health.json</code>. External uptime provider onboarding and DNS delegation remain operational steps outside the repository.
              </p>
            </section>

            <section className="rounded-[28px] border border-slate-900/10 bg-white/80 p-6 shadow-[0_24px_60px_rgba(29,42,34,0.12)] backdrop-blur">
              <h2 className="font-serif text-2xl tracking-[-0.03em]">Operational References</h2>
              <div className="mt-4 grid gap-3">
                {referenceLinks.map((link) => (
                  <a
                    key={link.label}
                    className="rounded-2xl border border-slate-900/10 bg-white/70 p-4 transition hover:bg-white"
                    href={link.href}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{link.label}</div>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{link.body}</p>
                      </div>
                      <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-900/10 bg-slate-50/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Waypoints className="h-4 w-4 text-emerald-700" />
                    Service identifier
                  </div>
                  <div className="mt-2 text-sm text-slate-600">{health?.service ?? "jobline-ai"}</div>
                </div>
                <div className="rounded-2xl border border-slate-900/10 bg-slate-50/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Siren className="h-4 w-4 text-emerald-700" />
                    Notification path
                  </div>
                  <div className="mt-2 text-sm text-slate-600">Support, help center, and status updates are the current first-party customer channels.</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}