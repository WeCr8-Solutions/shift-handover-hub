

## Plan: Finalize Routing Template Save Structure + Add Quote-to-WO Tour Steps

### Security Verification (No Changes Needed)
- **routing_templates**: RLS enforces `is_org_member` for SELECT, `is_org_admin OR is_supervisor_in_org` for ALL mutations — verified correct
- **routing_template_steps**: RLS joins through `routing_templates.organization_id` — verified correct
- **work_order_routing**: RLS joins through `queue_items.organization_id` — verified correct
- **Save Routing** (`handleSave`): Explicitly sets `organization_id: organization!.id` on every insert — verified
- **Save as Template** (`handleSaveAsTemplate`): Explicitly sets `organization_id` on both template and steps — verified
- **No cross-org leakage vectors found** — all queries filter by org membership at both RLS and application layers

### Changes

#### 1. Add `data-tour` Attributes to Queue & Routing Components
Add tour anchor attributes to key elements users need to discover:

**`src/pages/Queue.tsx`**:
- Add `data-tour="add-queue-item"` to the "Add Item" button
- Add `data-tour="quote-type-selector"` wrapper around the type selector area (already exists on tabs/filters/views)

**`src/components/queue/QueueKanbanBoard.tsx`**:
- Add `data-tour="kanban-quote-card"` to quote-type cards (first one)
- Add `data-tour="kanban-wo-card"` to work-order-type cards (first one)

**`src/components/routing/WorkOrderRoutingEditor.tsx`**:
- Add `data-tour="routing-template-selector"` to the org template dropdown
- Add `data-tour="routing-save-template"` to the "Save as Template" button
- Add `data-tour="routing-save"` to the "Save Routing" button

**`src/components/queue/QueueItemDetailDialog.tsx`**:
- Add `data-tour="quote-convert-bar"` to the quote-to-WO conversion action bar
- Add `data-tour="routing-tab"` to the Routing tab trigger

#### 2. Add New Tour Steps to GuidedTour
**`src/components/onboarding/GuidedTour.tsx`**:

Add new tour steps to the `/queue` route covering the quote-to-work-order and routing flows:

```
// After existing queue steps:
{
  target: '[data-tour="add-queue-item"]',
  content: 'Create quotes for estimation or work orders for production. Quotes flow through approval before converting to tracked work orders.',
  title: '📝 Quotes & Work Orders',
},
{
  target: '[data-tour="kanban-quote-card"]',
  content: 'Quotes appear with an amber border. Click to review, get estimates from engineering, then convert to a work order when approved.',
  title: '💡 Quote Cards',
},
{
  target: '[data-tour="kanban-wo-card"]',
  content: 'Work orders have a blue border and track through your full production routing — from first operation to final ship.',
  title: '🔧 Work Order Cards',
},
```

Add a new route entry for when the routing editor is open (triggered contextually, not route-based — these steps show when the detail dialog is open):

Since routing editor opens inside the queue page's detail dialog, append routing-related steps to the `/queue` tour that target `data-tour` attributes inside the dialog:

```
{
  target: '[data-tour="routing-tab"]',
  content: 'The Routing tab shows every production step — from quote review through shipping. Each step maps to a station in your shop.',
  title: '🗺️ Production Routing',
},
{
  target: '[data-tour="routing-template-selector"]',
  content: 'Load a saved routing template from your organization library. Templates save time by pre-filling steps for common part types.',
  title: '📋 Routing Templates',
},
{
  target: '[data-tour="routing-save-template"]',
  content: 'Customized a routing? Save it as a reusable template so your team can apply it to future work orders with one click.',
  title: '💾 Save as Template',
},
```

#### 3. Add New Onboarding Step Definition
**`src/hooks/useOnboarding.ts`**:

Add a new optional step `'quote-to-workorder'` to the `OnboardingStep` type and `ONBOARDING_STEPS` array:

```typescript
{ id: 'quote-to-workorder', title: 'Quotes & Routing', description: 'Learn how quotes convert to work orders with production routing templates' },
```

Insert it after `'station-cards'` (step 5) and before `'handoff-submission'` (step 6).

**`src/components/onboarding/GuidedTour.tsx`**:

Update `ROUTE_TO_STEP` to map `/queue` to include this new step when the quote/routing tour steps are shown.

#### 4. Update OnboardingSettings Route Map
**`src/components/settings/OnboardingSettings.tsx`**:

Add `'quote-to-workorder': '/queue'` to the `STEP_ROUTE_MAP`.

### Files Modified
1. `src/hooks/useOnboarding.ts` — Add `quote-to-workorder` step
2. `src/components/onboarding/GuidedTour.tsx` — Add quote/routing tour steps to `/queue`
3. `src/components/settings/OnboardingSettings.tsx` — Add route mapping
4. `src/pages/Queue.tsx` — Add `data-tour` attributes
5. `src/components/queue/QueueKanbanBoard.tsx` — Add `data-tour` attributes
6. `src/components/queue/QueueItemDetailDialog.tsx` — Add `data-tour` attributes
7. `src/components/routing/WorkOrderRoutingEditor.tsx` — Add `data-tour` attributes

