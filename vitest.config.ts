import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const isCI = Boolean(process.env.CI);

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Keep CI stable on GitHub runners with many jsdom-heavy tests.
    maxWorkers: isCI ? 1 : undefined,
    minWorkers: 1,
    fileParallelism: !isCI,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
