import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applySubdomainRouting } from "./lib/subdomainRouting";

// Rewrite the URL before React/router boot so subdomains land on their
// intended section (dev.jobline.ai → /dev, docs.jobline.ai → /help, etc.)
applySubdomainRouting();

createRoot(document.getElementById("root")!).render(<App />);

const bootShell = document.getElementById("boot-shell");
if (bootShell) {
	window.requestAnimationFrame(() => {
		bootShell.remove();
	});
}
