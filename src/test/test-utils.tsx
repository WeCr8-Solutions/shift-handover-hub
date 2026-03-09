import { render, RenderOptions } from "@testing-library/react";
import { screen, waitFor, fireEvent, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { ReactElement, ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OrgProvider } from "@/contexts/OrgContext";

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllProvidersProps {
  children: ReactNode;
}

export function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OrgProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </OrgProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Custom render function that includes all providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { customRender as render, userEvent };
export { screen, waitFor, fireEvent, within } from "@testing-library/dom";

// Mock Supabase client for tests
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
  functions: {
    invoke: vi.fn(),
  },
};

// Shared org fixture — use in vi.mock("@/hooks/useUserOrganization") for hook tests
export const mockOrg = {
  organization: {
    id: "test-org-id",
    name: "Test Org",
    slug: "test-org",
    description: null,
    logo_url: null,
    subscription_tier: "team",
    subscription_status: "active",
    trial_ends_at: null,
  },
  organizationRole: "supervisor" as const,
  teams: [],
  userRoles: [],
  primaryRole: "supervisor",
  primaryTeam: null,
  loading: false,
  refresh: async () => {},
};

// Mock user data
export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  user_metadata: {
    display_name: "Test User",
  },
};

export const mockProfile = {
  id: "test-profile-id",
  user_id: "test-user-id",
  email: "test@example.com",
  display_name: "Test User",
  avatar_url: null,
};

export const mockTeam = {
  id: "test-team-id",
  name: "Test Team",
  description: "A test team",
  created_at: new Date().toISOString(),
  created_by: "test-user-id",
};

export const mockStation = {
  id: "test-station-id",
  station_id: "STN-001",
  name: "Test Station",
  work_center: "CNC",
  work_center_type: "cnc_lathe",
  is_active: true,
  team_id: "test-team-id",
  created_at: new Date().toISOString(),
};

export const mockQueueItem = {
  id: "test-queue-item-id",
  team_id: "test-team-id",
  station_id: null,
  item_type: "team_task" as const,
  title: "Test Queue Item",
  description: "A test queue item",
  work_order: null,
  part_number: null,
  operation_number: null,
  quantity: null,
  status: "pending" as const,
  priority: "normal" as const,
  position: 1,
  assigned_to: null,
  assigned_by: null,
  due_date: null,
  scheduled_start: null,
  scheduled_end: null,
  estimated_duration: null,
  started_at: null,
  completed_at: null,
  tags: [],
  metadata: {},
  created_by: "test-user-id",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
