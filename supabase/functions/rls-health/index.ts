import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RLSTest {
  name: string;
  table: string;
  operation: "select" | "insert" | "update" | "delete";
  expected: "allow" | "deny";
  description: string;
  testFn: (client: ReturnType<typeof createClient>) => Promise<{ passed: boolean; error?: string }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    // Use SUPABASE_ANON_KEY or fallback to SUPABASE_PUBLISHABLE_KEY
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    // Create admin client for verification
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is admin/developer
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin, developer, or org admin/owner
    const { data: platformRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "developer"]);

    const { data: orgRoles } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"]);

    const hasPlatformAccess = platformRoles && platformRoles.length > 0;
    const hasOrgAccess = orgRoles && orgRoles.length > 0;

    if (!hasPlatformAccess && !hasOrgAccess) {
      return new Response(
        JSON.stringify({ error: "Admin, developer, or organization admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`RLS health check initiated by user ${user.id}, platform roles: ${JSON.stringify(platformRoles)}, org roles: ${JSON.stringify(orgRoles)}`);

    // Generate run ID
    const runId = crypto.randomUUID();
    const results: Array<{
      name: string;
      table: string;
      operation: string;
      expected: string;
      actual: string;
      passed: boolean;
      error?: string;
      executionTime: number;
    }> = [];

    // Create test clients
    // Anon client (unauthenticated) for testing anonymous access
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Authenticated client with the current user's token
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Define RLS tests
    const tests: RLSTest[] = [
      // Issues table tests
      {
        name: "Anonymous cannot read issues",
        table: "issues",
        operation: "select",
        expected: "deny",
        description: "Unauthenticated users should not be able to read issues",
        testFn: async (client) => {
          const { data, error } = await anonClient.from("issues").select("id").limit(1);
          // Should return empty or error due to RLS
          if (error) return { passed: true };
          return { passed: !data || data.length === 0 };
        }
      },
      {
        name: "Authenticated admin can read issues",
        table: "issues",
        operation: "select",
        expected: "allow",
        description: "Admin users should be able to read all issues",
        testFn: async (client) => {
          const { error } = await client.from("issues").select("id").limit(1);
          return { passed: !error, error: error?.message };
        }
      },
      {
        name: "Anonymous cannot insert issues",
        table: "issues",
        operation: "insert",
        expected: "deny",
        description: "Unauthenticated users should not be able to create issues",
        testFn: async () => {
          const { error } = await anonClient.from("issues").insert({
            title: "Test issue",
            reporter_id: crypto.randomUUID(), // Random UUID
          });
          return { passed: !!error };
        }
      },
      
      // Profiles table tests
      {
        name: "Anonymous cannot read profiles",
        table: "profiles",
        operation: "select",
        expected: "deny",
        description: "Unauthenticated users should not be able to read full profiles",
        testFn: async () => {
          const { data, error } = await anonClient.from("profiles").select("email").limit(1);
          if (error) return { passed: true };
          // Should not return email field
          return { passed: !data || data.length === 0 || !data[0]?.email };
        }
      },
      {
        name: "Authenticated user can read own profile",
        table: "profiles",
        operation: "select",
        expected: "allow",
        description: "Authenticated users should be able to read their own profile",
        testFn: async (client) => {
          const { error } = await client.from("profiles").select("*").eq("user_id", user.id);
          return { passed: !error, error: error?.message };
        }
      },

      // User roles table tests
      {
        name: "Anonymous cannot read user roles",
        table: "user_roles",
        operation: "select",
        expected: "deny",
        description: "Unauthenticated users should not be able to read user roles",
        testFn: async () => {
          const { data, error } = await anonClient.from("user_roles").select("id").limit(1);
          if (error) return { passed: true };
          return { passed: !data || data.length === 0 };
        }
      },

      // Organizations table tests  
      {
        name: "Anonymous cannot read organizations",
        table: "organizations",
        operation: "select",
        expected: "deny",
        description: "Unauthenticated users should not be able to read organizations",
        testFn: async () => {
          const { data, error } = await anonClient.from("organizations").select("id").limit(1);
          if (error) return { passed: true };
          return { passed: !data || data.length === 0 };
        }
      },

      // Teams table tests
      {
        name: "Anonymous cannot read teams",
        table: "teams",
        operation: "select",
        expected: "deny",
        description: "Unauthenticated users should not be able to read teams",
        testFn: async () => {
          const { data, error } = await anonClient.from("teams").select("id").limit(1);
          if (error) return { passed: true };
          return { passed: !data || data.length === 0 };
        }
      },

      // Queue items table tests
      {
        name: "Anonymous cannot read work orders",
        table: "queue_items",
        operation: "select",
        expected: "deny",
        description: "Unauthenticated users should not be able to read work orders",
        testFn: async () => {
          const { data, error } = await anonClient.from("queue_items").select("id").limit(1);
          if (error) return { passed: true };
          return { passed: !data || data.length === 0 };
        }
      },

      // Handoff records table tests
      {
        name: "Anonymous cannot read handoff records",
        table: "handoff_records",
        operation: "select",
        expected: "deny",
        description: "Unauthenticated users should not be able to read handoff records",
        testFn: async () => {
          const { data, error } = await anonClient.from("handoff_records").select("id").limit(1);
          if (error) return { passed: true };
          return { passed: !data || data.length === 0 };
        }
      },

      // RLS health checks table (meta test)
      {
        name: "Admin can read RLS health checks",
        table: "rls_health_checks",
        operation: "select",
        expected: "allow",
        description: "Admin users should be able to read RLS health check results",
        testFn: async (client) => {
          const { error } = await client.from("rls_health_checks").select("id").limit(1);
          return { passed: !error, error: error?.message };
        }
      },
    ];

    // Run all tests
    for (const test of tests) {
      const startTime = Date.now();
      try {
        const result = await test.testFn(authClient as any);
        const executionTime = Date.now() - startTime;
        
        results.push({
          name: test.name,
          table: test.table,
          operation: test.operation,
          expected: test.expected,
          actual: result.passed ? test.expected : (test.expected === "allow" ? "deny" : "allow"),
          passed: result.passed,
          error: result.error,
          executionTime,
        });
      } catch (error) {
        const executionTime = Date.now() - startTime;
        results.push({
          name: test.name,
          table: test.table,
          operation: test.operation,
          expected: test.expected,
          actual: "error",
          passed: false,
          error: error instanceof Error ? error.message : "Unknown error",
          executionTime,
        });
      }
    }

    // Store results in database
    const insertData = results.map((r) => ({
      check_name: r.name,
      table_name: r.table,
      operation: r.operation,
      expected_result: r.expected,
      actual_result: r.actual,
      passed: r.passed,
      error_message: r.error,
      execution_time_ms: r.executionTime,
      run_id: runId,
    }));

    await supabaseAdmin.from("rls_health_checks").insert(insertData);

    // Calculate summary
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const total = results.length;

    return new Response(
      JSON.stringify({
        run_id: runId,
        summary: {
          total,
          passed,
          failed,
          pass_rate: total > 0 ? Math.round((passed / total) * 100) : 0,
        },
        results,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in rls-health function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

Deno.serve(handler);
