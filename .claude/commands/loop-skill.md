# loop-skill

Continuously monitor a machine or work-order for changes and surface AI insights to the activity log.

## Usage

```
/loop-skill [entity_type] [entity_id] [interval_seconds]
```

- `entity_type` — one of: `machine`, `station`, `work_order`, `operator`
- `entity_id` — UUID to watch. Omit to watch all.
- `interval_seconds` — poll interval (default: 60)

## What it does

1. Calls `wecr8mcp_observe` to read current state.
2. Compares against the previous snapshot to detect changes.
3. If a meaningful change is detected (status change, new alarm, quality flag), calls `wecr8mcp_enrich` to log an AI insight.
4. Reschedules itself at the requested interval.

## Example

```
/loop-skill machine abc123 30
```

Watches machine `abc123` every 30 seconds and logs anomaly/insight notes when status changes.
