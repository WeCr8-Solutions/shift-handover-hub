import { vi } from "vitest";

// Create mock for Supabase client
export const createSupabaseMock = () => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockNeq = vi.fn().mockReturnThis();
  const mockGt = vi.fn().mockReturnThis();
  const mockGte = vi.fn().mockReturnThis();
  const mockLt = vi.fn().mockReturnThis();
  const mockLte = vi.fn().mockReturnThis();
  const mockIn = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    neq: mockNeq,
    gt: mockGt,
    gte: mockGte,
    lt: mockLt,
    lte: mockLte,
    in: mockIn,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  });

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    from: mockFrom,
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    }),
    // Expose individual mocks for assertions
    _mocks: {
      mockFrom,
      mockSelect,
      mockInsert,
      mockUpdate,
      mockDelete,
      mockEq,
      mockSingle,
      mockMaybeSingle,
    },
  };
};

// Setup module mock for Supabase
export const setupSupabaseMock = () => {
  const mock = createSupabaseMock();

  vi.mock("@/integrations/supabase/client", () => ({
    supabase: mock,
  }));

  return mock;
};
