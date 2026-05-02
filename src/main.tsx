import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applySubdomainRouting } from "./lib/subdomainRouting";
import joblineLogoSm from "@/assets/jobline-logo-sm.png";
import joblineLogo from "@/assets/jobline-logo.png";

// Rewrite the URL before React/router boot so subdomains land on their
// intended section (dev.jobline.ai → /dev, docs.jobline.ai → /help, etc.)
applySubdomainRouting();

// Preload the LCP-adjacent hero logo on the marketing landing route only.
// Uses Vite's hashed asset URL so the preload always matches the <img> request.
// Image preloads support `imagesrcset` / `imagesizes` to mirror the responsive <img>.
if (typeof document !== "undefined" && window.location.pathname === "/") {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = joblineLogoSm;
  link.setAttribute("imagesrcset", `${joblineLogoSm} 200w, ${joblineLogo} 280w`);
  link.setAttribute(
    "imagesizes",
    "(min-width: 1024px) 176px, (min-width: 768px) 144px, (min-width: 640px) 112px, 80px",
  );
  link.fetchPriority = "high";
  document.head.appendChild(link);
}

createRoot(document.getElementById("root")!).render(<App />);

const bootShell = document.getElementById("boot-shell");
if (bootShell) {
	window.requestAnimationFrame(() => {
		bootShell.remove();
	});
}
