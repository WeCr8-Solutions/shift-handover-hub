import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// Authenticated app surfaces — AdPlacement must never be imported here.
// AdSense policy + product decision: no ads inside the working app.
const NO_ADS_PATHS = [
  "src/components/dashboard/**",
  "src/components/handoff/**",
  "src/components/queue/**",
  "src/components/admin/**",
  "src/components/oap/**",
  "src/components/teams/**",
  "src/components/settings/**",
  "src/pages/Index.tsx",
  "src/pages/Dashboard*.{ts,tsx}",
  "src/pages/Queue*.{ts,tsx}",
  "src/pages/Teams*.{ts,tsx}",
  "src/pages/Admin*.{ts,tsx}",
  "src/pages/Settings*.{ts,tsx}",
  "src/pages/Profile*.{ts,tsx}",
  "src/pages/Setup*.{ts,tsx}",
  "src/pages/Testing*.{ts,tsx}",
  "src/pages/Updates*.{ts,tsx}",
  "src/pages/FieldView*.{ts,tsx}",
  "src/pages/Oap*.{ts,tsx}",
  "src/pages/Gca*.{ts,tsx}",
  "src/pages/CertSuccess*.{ts,tsx}",
  "src/pages/DonationSuccess*.{ts,tsx}",
  "src/pages/display/**",
  "src/pages/dev/**",
  "src/pages/handoff/**",
  "src/pages/work-orders/**",
];

const AD_IMPORT_BAN = {
  "no-restricted-imports": [
    "error",
    {
      paths: [
        {
          name: "@/components/marketing/AdPlacement",
          message:
            "AdPlacement may only be used on public marketing pages. The authenticated app must remain ad-free.",
        },
      ],
    },
  ],
};

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended],
    files: ["scripts/**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        fetch: "readonly",
      },
    },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Enforce: AdPlacement may not be imported from authenticated app surfaces.
  {
    files: NO_ADS_PATHS,
    rules: AD_IMPORT_BAN,
  },
);
