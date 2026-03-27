import {
  Rocket, Code2, Puzzle, Plug, Package, Webhook, FileText,
} from "lucide-react";

export interface DevSection {
  heading: string;
  body: string;
}

export interface DevCodeExample {
  language: string;
  label: string;
  code: string;
}

export interface DevDoc {
  category: string;
  categoryLabel: string;
  slug: string;
  title: string;
  description: string;
  sections: DevSection[];
  tags: string[];
  codeExamples?: DevCodeExample[];
}

export interface DevCategory {
  key: string;
  label: string;
  description: string;
  icon: typeof Rocket;
}

export const devCategories: DevCategory[] = [
  { key: "getting-started", label: "Getting Started", description: "Authentication, API keys, SDK installation, and quickstart guides", icon: Rocket },
  { key: "api", label: "API Reference", description: "REST endpoints, RPC functions, request/response formats, and pagination", icon: Code2 },
  { key: "extensions", label: "VS Code Extensions", description: "G-Code Intelligence, Machine Connect Relay — installation, config, and usage", icon: Puzzle },
  { key: "integrations", label: "Integrations", description: "ERP connectors, MCP server, WebSocket relay, and DNC protocol guides", icon: Plug },
  { key: "sdk", label: "SDK & Libraries", description: "JavaScript SDK, Electron desktop app, and helper utilities", icon: Package },
  { key: "webhooks", label: "Webhooks", description: "Event payloads, retry logic, signature verification, and delivery logs", icon: Webhook },
  { key: "changelog", label: "Changelog", description: "Developer-facing release notes, breaking changes, and migration guides", icon: FileText },
];

export const devDocs: DevDoc[] = [
  // ── GETTING STARTED ──────────────────────────────────────────
  {
    category: "getting-started", categoryLabel: "Getting Started",
    slug: "quickstart", title: "Quickstart",
    description: "Get up and running with the JobLine API in under 5 minutes.",
    tags: ["quickstart", "api key", "first request"],
    sections: [
      { heading: "Prerequisites", body: "You need a JobLine.ai account with an active organization. Navigate to Settings → API Keys to generate your first key. Each key is scoped to your organization and carries the permissions of the user who created it." },
      { heading: "Install the SDK", body: "Install the official JavaScript/TypeScript SDK via npm or yarn. The SDK wraps all REST endpoints with typed helpers, handles authentication headers automatically, and provides real-time subscription support via WebSocket." },
      { heading: "Make your first request", body: "Initialize the client with your API key and organization ID. Call client.workOrders.list() to retrieve your first page of work orders. The response includes pagination metadata, total count, and typed work order objects." },
      { heading: "Error handling", body: "All SDK methods throw typed errors with a code, message, and optional details object. Common codes include AUTH_INVALID, RATE_LIMITED, NOT_FOUND, and VALIDATION_ERROR. Wrap calls in try/catch and inspect the error code for programmatic handling." },
    ],
    codeExamples: [
      { language: "bash", label: "Install", code: "npm install @jobline/sdk" },
      { language: "typescript", label: "TypeScript", code: `import { JobLineClient } from '@jobline/sdk';\n\nconst client = new JobLineClient({\n  apiKey: process.env.JOBLINE_API_KEY!,\n  orgId: process.env.JOBLINE_ORG_ID!,\n});\n\nconst workOrders = await client.workOrders.list({ limit: 10 });\nconsole.log(workOrders.data);` },
      { language: "bash", label: "cURL", code: `curl -X GET "https://api.jobline.ai/v1/work-orders?limit=10" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "X-Org-Id: YOUR_ORG_ID"` },
    ],
  },
  {
    category: "getting-started", categoryLabel: "Getting Started",
    slug: "authentication", title: "Authentication",
    description: "Learn how API keys and JWT tokens work in the JobLine platform.",
    tags: ["auth", "jwt", "api key", "bearer token"],
    sections: [
      { heading: "API Key authentication", body: "API keys are the simplest way to authenticate. Include your key in the Authorization header as a Bearer token. Keys are created in the Settings → API Keys page and can be revoked at any time. Each key inherits the role permissions of the user who created it." },
      { heading: "JWT-based authentication", body: "For browser-based integrations, use JWT tokens obtained through the standard login flow. Tokens expire after 1 hour and can be refreshed using the refresh token. The SDK handles token refresh automatically when configured with session credentials." },
      { heading: "Scopes and permissions", body: "API keys can be scoped to specific resources: work_orders:read, work_orders:write, handoffs:read, stations:read, and admin:full. When creating a key, select only the scopes your integration requires. Requests outside the key's scope return a 403 Forbidden response." },
      { heading: "Rate limiting", body: "The API enforces rate limits of 100 requests per minute per key. When exceeded, you receive a 429 status with a Retry-After header. The SDK automatically retries with exponential backoff. Burst limits allow up to 20 requests per second." },
    ],
    codeExamples: [
      { language: "typescript", label: "TypeScript", code: `// API Key auth\nconst client = new JobLineClient({\n  apiKey: 'jl_key_abc123...',\n  orgId: 'org_xyz...',\n});\n\n// JWT auth (browser)\nconst client = new JobLineClient({\n  session: supabaseSession,\n});` },
      { language: "bash", label: "cURL", code: `# API Key\ncurl -H "Authorization: Bearer jl_key_abc123..." \\\n     -H "X-Org-Id: org_xyz..." \\\n     https://api.jobline.ai/v1/work-orders\n\n# JWT\ncurl -H "Authorization: Bearer eyJhbG..." \\\n     https://api.jobline.ai/v1/work-orders` },
    ],
  },
  {
    category: "getting-started", categoryLabel: "Getting Started",
    slug: "environments", title: "Environments & Base URLs",
    description: "Production vs. sandbox environments and their base URLs.",
    tags: ["environment", "sandbox", "production", "base url"],
    sections: [
      { heading: "Production", body: "The production API is available at https://api.jobline.ai/v1. All data is live and operations affect real work orders, handoffs, and stations. Use production API keys only in deployed applications." },
      { heading: "Sandbox", body: "The sandbox environment at https://sandbox.api.jobline.ai/v1 mirrors production but uses isolated test data. Sandbox API keys are created separately and do not affect production data. Use sandbox for development, testing, and CI/CD pipelines." },
      { heading: "Versioning", body: "The API is versioned via the URL path (/v1). Breaking changes are introduced only in new major versions. The current version (v1) will be supported for at least 12 months after v2 is released. Non-breaking additions (new fields, endpoints) are added to the current version." },
    ],
  },

  // ── API REFERENCE ────────────────────────────────────────────
  {
    category: "api", categoryLabel: "API Reference",
    slug: "work-orders", title: "Work Orders API",
    description: "Create, read, update, and manage production work orders.",
    tags: ["work orders", "crud", "rest", "production"],
    sections: [
      { heading: "List work orders", body: "GET /v1/work-orders returns a paginated list of work orders for the authenticated organization. Supports filtering by status (queued, in_progress, complete, on_hold), station_id, priority, and date ranges. Default page size is 25, maximum 100." },
      { heading: "Get a work order", body: "GET /v1/work-orders/:id returns a single work order with full details including routing steps, assigned operators, dimension readings, and delivery requests. Includes computed fields like completion_percentage and estimated_completion." },
      { heading: "Create a work order", body: "POST /v1/work-orders creates a new work order. Required fields: work_order (string), part_number, quantity. Optional: customer_name, due_date, priority, notes, routing (array of step objects). Returns the created work order with generated ID." },
      { heading: "Update a work order", body: "PATCH /v1/work-orders/:id updates specific fields. Supports partial updates — only include fields you want to change. Status transitions are validated: e.g., you cannot move from 'complete' back to 'queued' without admin permissions." },
      { heading: "Pagination", body: "All list endpoints support cursor-based pagination with 'cursor' and 'limit' parameters. The response includes 'next_cursor' for the next page. Use cursor pagination for large datasets instead of offset-based pagination for consistent results." },
    ],
    codeExamples: [
      { language: "typescript", label: "TypeScript", code: `const orders = await client.workOrders.list({\n  status: 'in_progress',\n  limit: 25,\n});\n\nconst order = await client.workOrders.create({\n  work_order: 'WO-2024-001',\n  part_number: 'PN-1234',\n  quantity: 100,\n  priority: 'high',\n});` },
      { language: "bash", label: "cURL", code: `# List work orders\ncurl "https://api.jobline.ai/v1/work-orders?status=in_progress&limit=25" \\\n  -H "Authorization: Bearer YOUR_KEY"\n\n# Create work order\ncurl -X POST "https://api.jobline.ai/v1/work-orders" \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"work_order":"WO-2024-001","part_number":"PN-1234","quantity":100}'` },
    ],
  },
  {
    category: "api", categoryLabel: "API Reference",
    slug: "handoffs", title: "Handoffs API",
    description: "Record, retrieve, and analyze shift handoff records.",
    tags: ["handoffs", "shift", "handoff records"],
    sections: [
      { heading: "List handoffs", body: "GET /v1/handoffs returns handoff records filtered by station_id, date range, shift, and operator. Includes machine condition data, parts completed, quality notes, and tooling information. Supports the same cursor pagination as other list endpoints." },
      { heading: "Create a handoff", body: "POST /v1/handoffs records a new shift handoff. Required fields include station_id, outgoing_operator_name, incoming_operator_name, shift, work_order, part_number, and handoff_summary. The system automatically captures timestamps and links to the active work order." },
      { heading: "Handoff analytics", body: "GET /v1/handoffs/analytics returns aggregated metrics: average parts per shift, common delay codes, quality issue frequency, and handoff completion rates. Filter by date range, station, and team for targeted insights." },
    ],
    codeExamples: [
      { language: "typescript", label: "TypeScript", code: `const handoff = await client.handoffs.create({\n  station_id: 'station_abc',\n  outgoing_operator_name: 'John Smith',\n  incoming_operator_name: 'Jane Doe',\n  shift: 'day',\n  work_order: 'WO-2024-001',\n  part_number: 'PN-1234',\n  parts_completed_this_shift: 45,\n  handoff_summary: 'Running well, tool change needed at 500 parts',\n});` },
    ],
  },
  {
    category: "api", categoryLabel: "API Reference",
    slug: "stations", title: "Stations API",
    description: "Manage work centers, equipment, and station status.",
    tags: ["stations", "work centers", "equipment", "status"],
    sections: [
      { heading: "List stations", body: "GET /v1/stations returns all stations for the organization with current status, active operator, and equipment details. Filter by team_id, station_type, or status (active, idle, maintenance, offline)." },
      { heading: "Station status", body: "GET /v1/stations/:id/status returns real-time status including current job, operator, parts complete vs. required, machine condition, and last handoff timestamp. This endpoint is optimized for polling at 30-second intervals." },
      { heading: "Equipment", body: "GET /v1/stations/:id/equipment lists equipment assigned to a station including calibration dates, maintenance schedules, and asset tags. Use POST /v1/equipment to register new equipment and PATCH to update calibration records." },
    ],
  },

  // ── EXTENSIONS ───────────────────────────────────────────────
  {
    category: "extensions", categoryLabel: "VS Code Extensions",
    slug: "gcode-intelligence", title: "G-Code Intelligence",
    description: "Multi-dialect G-Code syntax highlighting, diagnostics, and snippets for VS Code.",
    tags: ["vscode", "gcode", "syntax", "fanuc", "haas", "mazak", "siemens"],
    sections: [
      { heading: "Installation", body: "Search for 'JobLine G-Code' in the VS Code marketplace or install directly: ext install WeCr8-Solutions.jobline-gcode. The extension activates automatically for .nc, .cnc, .gcode, .tap, and .ngc file types. No additional configuration is required for basic usage." },
      { heading: "Supported dialects", body: "The extension provides intelligent support for 6 major CNC dialects: Fanuc (including macro B), Haas, Mazak (Mazatrol conversational + EIA), Siemens 840D (ShopMill/ShopTurn), Heidenhain (TNC/iTNC), and Okuma (OSP). Dialect detection is automatic based on file content patterns, or can be set manually via the status bar selector." },
      { heading: "Features", body: "Core features include: syntax highlighting with semantic token coloring, real-time diagnostics (missing line numbers, undefined tool calls, unbalanced parentheses), hover documentation for G/M codes, go-to-definition for subroutine calls, and code folding for program sections. All features work offline — no API connection required." },
      { heading: "Snippets", body: "Over 200 built-in snippets for common machining operations: tool changes, canned drilling cycles, cutter compensation, work coordinate setup, and probing routines. Snippets are dialect-aware — typing 'drill' shows Fanuc G81 patterns when in Fanuc mode, and Siemens CYCLE81 patterns when in Siemens mode." },
      { heading: "Configuration", body: "Settings are available under File → Preferences → Settings → JobLine G-Code. Key options: jobline.gcode.defaultDialect (auto | fanuc | haas | mazak | siemens | heidenhain | okuma), jobline.gcode.diagnostics.enabled (true/false), jobline.gcode.theme (default | high-contrast | monokai). All settings sync across VS Code instances." },
      { heading: "Troubleshooting", body: "If syntax highlighting doesn't activate, check the file extension is associated with the 'G-Code' language mode (bottom-right status bar). For dialect detection issues, set the dialect manually via the status bar or add a comment header: (DIALECT: FANUC). Report issues on the GitHub repository or via the extension's feedback command." },
    ],
    codeExamples: [
      { language: "bash", label: "Install", code: `code --install-extension WeCr8-Solutions.jobline-gcode` },
      { language: "json", label: "Settings", code: `{\n  "jobline.gcode.defaultDialect": "fanuc",\n  "jobline.gcode.diagnostics.enabled": true,\n  "jobline.gcode.diagnostics.severity": "warning",\n  "jobline.gcode.theme": "default"\n}` },
    ],
  },
  {
    category: "extensions", categoryLabel: "VS Code Extensions",
    slug: "machine-connect", title: "Machine Connect Relay",
    description: "Connect CNC machines to JobLine via DNC, serial, and network protocols.",
    tags: ["machine connect", "dnc", "serial", "relay", "websocket", "coming soon"],
    sections: [
      { heading: "Overview", body: "Machine Connect is a companion VS Code extension and desktop relay service that bridges physical CNC machines to the JobLine platform. It supports DNC program transfer (RS-232 serial), network-connected machines (Ethernet/IP, Focas, MTConnect), and real-time status monitoring. Currently in private beta — join the waitlist for early access." },
      { heading: "Architecture", body: "The relay runs as a lightweight background service on a shop-floor PC connected to your machines. It communicates with JobLine via secure WebSocket (wss://relay.jobline.ai). Each machine is bound to a JobLine station, enabling automatic status updates, program transfer triggers, and cycle time logging." },
      { heading: "Supported protocols", body: "Serial DNC: RS-232 with configurable baud rate (1200–115200), parity, data bits, and flow control (XON/XOFF, RTS/CTS). Network: Fanuc Focas2, Mazak Smooth API, Haas Q-commands, Siemens OPC UA, MTConnect. Each protocol adapter handles connection lifecycle, error recovery, and data normalization." },
      { heading: "Station binding", body: "Each machine connection is mapped to a JobLine station via the relay configuration. When the relay detects a cycle start, it updates the station status in real-time. Cycle complete events automatically increment parts count. Program upload/download can be triggered from the JobLine dashboard or VS Code." },
      { heading: "Getting started (Beta)", body: "Request beta access at jobline.ai/features/machine-connect. Once approved, you'll receive a relay installer and API credentials. Install the relay on a Windows PC with access to your machines, configure connections in the relay.config.json, and pair with your JobLine organization using the provided pairing code." },
    ],
  },

  // ── INTEGRATIONS ─────────────────────────────────────────────
  {
    category: "integrations", categoryLabel: "Integrations",
    slug: "erp-connectors", title: "ERP Connectors",
    description: "Sync work orders, BOMs, and inventory with your ERP system.",
    tags: ["erp", "integration", "sync", "jobboss", "epicor", "sap"],
    sections: [
      { heading: "Supported systems", body: "JobLine integrates with major ERP systems used in precision manufacturing: JobBOSS², Epicor Kinetic, SAP Business One, E2 Shop System, and ProShop. Each connector handles bi-directional sync of work orders, routing steps, and completion status. Additional ERP support is added based on customer demand." },
      { heading: "Setup", body: "Navigate to Settings → Integrations → ERP in the JobLine dashboard. Select your ERP vendor, enter connection credentials (API endpoint, client ID, client secret), and configure sync frequency. The system performs a test connection and initial data pull to verify configuration. OAuth2 is used where supported; API key auth as fallback." },
      { heading: "Sync behavior", body: "Syncs run on a configurable interval (default: 15 minutes). New work orders in the ERP are pulled into JobLine with mapped statuses. Completion updates in JobLine are pushed back to the ERP. Conflict resolution follows a 'last-write-wins' strategy with full audit logging. Manual sync can be triggered from the dashboard." },
      { heading: "Field mapping", body: "Default field mappings cover work order number, part number, quantity, due date, status, and routing operations. Custom field mappings can be configured for vendor-specific fields. Status mappings (e.g., ERP 'Released' → JobLine 'queued') are configurable per organization." },
      { heading: "Error handling", body: "Sync errors are logged with full context: record ID, error type, retry count, and resolution status. Failed records are retried up to 3 times with exponential backoff. Persistent failures generate notifications and appear in the sync dashboard for manual review." },
    ],
  },
  {
    category: "integrations", categoryLabel: "Integrations",
    slug: "mcp-server", title: "MCP Server",
    description: "Model Context Protocol server for AI agents to query machine and production state.",
    tags: ["mcp", "ai", "model context protocol", "agents"],
    sections: [
      { heading: "What is MCP?", body: "The Model Context Protocol (MCP) is an open standard for AI agents to interact with external tools and data sources. JobLine's MCP server exposes production data — station status, work order progress, handoff history, and quality metrics — as structured tools that AI assistants can query using natural language." },
      { heading: "Available tools", body: "The MCP server provides tools for: get_station_status (real-time machine state), list_work_orders (filtered production queue), get_handoff_history (shift notes and trends), query_quality_metrics (NCR rates, dimension pass/fail), and get_production_summary (shift-level KPIs). Each tool returns typed JSON with clear field descriptions." },
      { heading: "Setup", body: "The MCP server runs as an edge function and is available at your organization's MCP endpoint. Configure your AI agent (Claude, GPT, or custom) to connect using the MCP protocol with your API key for authentication. The server handles tool discovery, parameter validation, and response formatting automatically." },
      { heading: "Example queries", body: "Natural language queries that the MCP server can handle: 'What's the current status of CNC Mill #3?', 'Show me all overdue work orders', 'What were the quality issues on night shift last week?', 'How many parts did Station A produce today?'. The AI agent translates these into appropriate tool calls." },
    ],
    codeExamples: [
      { language: "json", label: "MCP Config", code: `{\n  "mcpServers": {\n    "jobline": {\n      "url": "https://api.jobline.ai/v1/mcp",\n      "headers": {\n        "Authorization": "Bearer YOUR_API_KEY",\n        "X-Org-Id": "YOUR_ORG_ID"\n      }\n    }\n  }\n}` },
    ],
  },
  {
    category: "integrations", categoryLabel: "Integrations",
    slug: "websocket-relay", title: "WebSocket Relay",
    description: "Real-time data streaming for dashboards, displays, and custom integrations.",
    tags: ["websocket", "realtime", "streaming", "relay"],
    sections: [
      { heading: "Connection", body: "Connect to wss://relay.jobline.ai/v1/ws with your API key as a query parameter or in the Authorization header. The server sends a 'connected' event with your session ID upon successful authentication. Heartbeat pings are sent every 30 seconds; respond with pong to maintain the connection." },
      { heading: "Channels", body: "Subscribe to channels for targeted updates: 'stations:*' for all station changes, 'stations:{id}' for a specific station, 'work-orders:*' for work order updates, 'handoffs:new' for new handoff records. Wildcard subscriptions aggregate events from all matching resources." },
      { heading: "Event format", body: "Events are JSON objects with fields: type (string), channel (string), data (object), timestamp (ISO 8601), and event_id (UUID). Data payloads match the REST API response format for the corresponding resource, making it easy to keep local state in sync." },
      { heading: "Reconnection", body: "The relay supports automatic reconnection with last_event_id. On reconnect, include the last received event_id to receive any events missed during the disconnection. Events are buffered for up to 5 minutes, after which a full sync via the REST API is recommended." },
    ],
    codeExamples: [
      { language: "typescript", label: "TypeScript", code: `import { JobLineClient } from '@jobline/sdk';\n\nconst client = new JobLineClient({ apiKey: 'YOUR_KEY' });\n\nconst ws = client.realtime.connect();\n\nws.subscribe('stations:*', (event) => {\n  console.log('Station update:', event.data);\n});\n\nws.subscribe('work-orders:*', (event) => {\n  console.log('WO update:', event.data);\n});` },
    ],
  },

  // ── SDK ──────────────────────────────────────────────────────
  {
    category: "sdk", categoryLabel: "SDK & Libraries",
    slug: "javascript-sdk", title: "JavaScript / TypeScript SDK",
    description: "Official SDK for Node.js and browser environments.",
    tags: ["sdk", "javascript", "typescript", "npm"],
    sections: [
      { heading: "Installation", body: "Install via npm: npm install @jobline/sdk. The package includes full TypeScript definitions, tree-shakeable ESM exports, and a CommonJS fallback. Minimum Node.js version: 18. Browser support: all modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)." },
      { heading: "Initialization", body: "Create a client instance with your API key and organization ID. The client manages authentication, retries, rate limiting, and connection pooling automatically. For server-side usage, pass the API key directly. For browser usage, use session-based authentication." },
      { heading: "Resources", body: "The SDK exposes typed resource classes: client.workOrders, client.handoffs, client.stations, client.equipment, client.quality, and client.users. Each resource provides CRUD methods (list, get, create, update, delete) with typed parameters and responses." },
      { heading: "Real-time subscriptions", body: "The SDK includes a real-time client that wraps the WebSocket relay. Call client.realtime.connect() to establish a connection, then use subscribe() to listen for events on specific channels. The client handles reconnection, heartbeat, and event buffering automatically." },
      { heading: "Error handling", body: "All methods return typed responses or throw JobLineError instances with code, message, status, and details properties. Use the error code for programmatic handling: AUTH_INVALID, RATE_LIMITED, NOT_FOUND, VALIDATION_ERROR, CONFLICT, INTERNAL_ERROR." },
    ],
    codeExamples: [
      { language: "typescript", label: "TypeScript", code: `import { JobLineClient } from '@jobline/sdk';\n\nconst client = new JobLineClient({\n  apiKey: process.env.JOBLINE_API_KEY!,\n  orgId: process.env.JOBLINE_ORG_ID!,\n});\n\n// List work orders with filters\nconst { data, nextCursor } = await client.workOrders.list({\n  status: 'in_progress',\n  limit: 25,\n});\n\n// Create a handoff\nconst handoff = await client.handoffs.create({\n  station_id: 'station_abc',\n  shift: 'day',\n  // ... other fields\n});` },
    ],
  },
  {
    category: "sdk", categoryLabel: "SDK & Libraries",
    slug: "electron-app", title: "Electron Desktop App",
    description: "Desktop application for offline-capable shop floor access.",
    tags: ["electron", "desktop", "offline", "shop floor"],
    sections: [
      { heading: "Overview", body: "The JobLine desktop app is an Electron-based application that provides offline-capable access to the platform. It's designed for shop floor PCs that may have intermittent internet connectivity. The app syncs data locally and pushes changes when connectivity is restored." },
      { heading: "Installation", body: "Download the installer from your organization's Settings → Downloads page. Available for Windows 10+ (64-bit) and macOS 12+. The installer is signed and notarized. Auto-updates are delivered through the built-in update mechanism — no manual updates required." },
      { heading: "Offline mode", body: "When offline, the app continues to function with locally cached data. New handoffs, status updates, and quality readings are queued locally. When connectivity is restored, queued changes are synced in order with conflict detection. A status indicator shows online/offline state and pending sync count." },
      { heading: "Machine Connect integration", body: "The desktop app includes the Machine Connect relay as an optional component. When enabled, it provides the same DNC and machine monitoring capabilities as the VS Code extension, but runs as a background service without requiring VS Code." },
    ],
  },

  // ── WEBHOOKS ─────────────────────────────────────────────────
  {
    category: "webhooks", categoryLabel: "Webhooks",
    slug: "overview", title: "Webhooks Overview",
    description: "Receive real-time notifications when events occur in your organization.",
    tags: ["webhooks", "events", "notifications", "callbacks"],
    sections: [
      { heading: "How webhooks work", body: "Configure a webhook endpoint URL in Settings → API → Webhooks. When events occur (work order created, handoff submitted, station status changed), JobLine sends an HTTP POST request to your endpoint with the event payload. Your endpoint must respond with a 2xx status within 30 seconds." },
      { heading: "Event types", body: "Available events: work_order.created, work_order.updated, work_order.completed, handoff.created, station.status_changed, quality.ncr_created, equipment.calibration_due, delivery.requested, delivery.completed. Subscribe to specific events or use '*' for all events." },
      { heading: "Payload format", body: "Each webhook delivery includes headers: X-JobLine-Event (event type), X-JobLine-Delivery (unique delivery ID), X-JobLine-Signature (HMAC-SHA256 signature). The body is a JSON object with: event, data (the resource object), timestamp, and organization_id." },
      { heading: "Signature verification", body: "Verify webhook authenticity by computing HMAC-SHA256 of the raw request body using your webhook secret. Compare with the X-JobLine-Signature header. Always verify signatures in production to prevent spoofing. The SDK provides a helper: JobLineClient.webhooks.verify(payload, signature, secret)." },
      { heading: "Retry policy", body: "Failed deliveries (non-2xx response or timeout) are retried up to 5 times with exponential backoff: 1 min, 5 min, 30 min, 2 hours, 12 hours. After all retries are exhausted, the webhook is marked as failed in the delivery log. Consecutive failures (10+) trigger a warning notification and automatic disabling after 100 failures." },
    ],
    codeExamples: [
      { language: "typescript", label: "TypeScript", code: `import { JobLineClient } from '@jobline/sdk';\nimport express from 'express';\n\nconst app = express();\n\napp.post('/webhooks/jobline', express.raw({ type: 'application/json' }), (req, res) => {\n  const signature = req.headers['x-jobline-signature'] as string;\n  const isValid = JobLineClient.webhooks.verify(\n    req.body, signature, process.env.WEBHOOK_SECRET!\n  );\n\n  if (!isValid) return res.status(401).send('Invalid signature');\n\n  const event = JSON.parse(req.body);\n  console.log('Event:', event.event, event.data);\n\n  res.status(200).send('OK');\n});` },
    ],
  },

  // ── CHANGELOG ────────────────────────────────────────────────
  {
    category: "changelog", categoryLabel: "Changelog",
    slug: "2025-q1", title: "Q1 2025 Updates",
    description: "Major features and improvements shipped in Q1 2025.",
    tags: ["changelog", "release notes", "2025"],
    sections: [
      { heading: "Digital Expeditor launch", body: "The core expeditor workflow went live with drag-and-drop Kanban boards, automated priority scoring, and real-time station utilization tracking. Work orders flow through configurable routing steps with operator check-in/check-out and automatic progress calculation." },
      { heading: "Smart Shift Handoff v2", body: "Complete rewrite of the handoff form with work-center-specific fields (CNC machine condition, water jet parameters, welding settings), photo attachments, and supervisor sign-off workflows. Handoff data is now linked to station status for seamless continuity." },
      { heading: "VS Code G-Code Intelligence", body: "Released the G-Code Intelligence extension on the VS Code marketplace with support for 6 CNC dialects. Features include semantic highlighting, real-time diagnostics, hover documentation, and 200+ dialect-aware snippets." },
      { heading: "Organization & Team management", body: "Multi-organization support with team-scoped data isolation, invite system with QR codes, role-based access control (Owner, Admin, Supervisor, Operator, Viewer), and comprehensive audit logging for ITAR compliance." },
    ],
  },
  {
    category: "changelog", categoryLabel: "Changelog",
    slug: "2025-q2", title: "Q2 2025 Updates",
    description: "ERP integration, quality management, and Machine Connect beta.",
    tags: ["changelog", "release notes", "2025", "erp", "quality"],
    sections: [
      { heading: "ERP Integration framework", body: "Launched the ERP connector framework with initial support for JobBOSS² and Epicor Kinetic. Bi-directional sync of work orders, routing operations, and completion status with configurable field mappings and conflict resolution." },
      { heading: "Quality Management module", body: "Non-Conformance Report (NCR) creation and disposition workflow, dimension check requests with inspection readings, first-article inspection tracking, and quality analytics dashboard. Supports AS9100/ISO 9001 compliance requirements." },
      { heading: "Machine Connect private beta", body: "Started private beta of the Machine Connect relay service. Initial support for Fanuc Focas2, Haas Q-commands, and RS-232 serial DNC. Real-time cycle monitoring and automatic parts counting for connected machines." },
      { heading: "API v1 release", body: "Released the public REST API (v1) with full documentation, TypeScript SDK, and sandbox environment. API covers work orders, handoffs, stations, equipment, quality, and user management endpoints." },
    ],
  },
  {
    category: "changelog", categoryLabel: "Changelog",
    slug: "migration-guides", title: "Migration Guides",
    description: "Guides for migrating between versions and handling breaking changes.",
    tags: ["migration", "breaking changes", "upgrade"],
    sections: [
      { heading: "API versioning policy", body: "The JobLine API follows semantic versioning. Breaking changes are introduced only in major versions (v1 → v2). Minor additions (new fields, new endpoints) are added to the current version without breaking existing integrations. Deprecation notices are published at least 6 months before removal." },
      { heading: "SDK upgrade guide", body: "When upgrading the SDK, check the CHANGELOG.md in the package for breaking changes. The SDK major version matches the API version — SDK v1.x works with API v1, SDK v2.x works with API v2. Upgrade one major version at a time and run your test suite after each upgrade." },
      { heading: "Data migration", body: "For organizations migrating from other systems, JobLine provides CSV import tools for work orders, stations, and employee rosters. The import process validates data, maps fields, and reports errors before committing changes. Contact support for large-scale migrations exceeding 10,000 records." },
    ],
  },
];

export function getDevDocsByCategory(category: string): DevDoc[] {
  return devDocs.filter((d) => d.category === category);
}

export function getDevDoc(category: string, slug: string): DevDoc | undefined {
  return devDocs.find((d) => d.category === category && d.slug === slug);
}

export function searchDevDocs(query: string): (DevDoc & { categoryLabel: string })[] {
  const q = query.toLowerCase();
  return devDocs.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.tags.some((t) => t.toLowerCase().includes(q))
  );
}
