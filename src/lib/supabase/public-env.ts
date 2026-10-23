import { z } from "zod";

// Public Supabase settings, safe to ship to the browser.
//
// Next.js inlines NEXT_PUBLIC_* variables into the client bundle at build time,
// but only when they are written out literally as process.env.NEXT_PUBLIC_X,
// which is why they are read one by one below.
//
// Safety net: a secret or service-role key pasted into a NEXT_PUBLIC_ variable
// would be shipped to every visitor and bypass RLS. Those are rejected here.
// Error messages never include the value.

function isPrivilegedKey(value: string): boolean {
  if (value.startsWith("sb_secret_")) return true;
  // Legacy keys are JWTs; the payload's `role` claim reveals a service key.
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
      role?: unknown;
    };
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

const publicEnvSchema = z.object({
  url: z.url({
    error: "NEXT_PUBLIC_SUPABASE_URL must be a URL like https://<project-ref>.supabase.co",
  }),
  publishableKey: z
    .string({ error: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing." })
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is empty.")
    .refine((value) => !isPrivilegedKey(value), {
      error:
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY contains a SECRET / service-role key. Use the publishable key; never expose secret keys to the browser.",
    }),
});

export type SupabasePublicEnv = z.infer<typeof publicEnvSchema>;

// Pure validation (exported for tests). Throws a value-free error.
export function parseSupabasePublicEnv(input: {
  url: string | undefined;
  publishableKey: string | undefined;
}): SupabasePublicEnv {
  const result = publicEnvSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `- ${issue.message}`).join("\n");
    throw new Error(`Invalid Supabase configuration:\n${issues}`);
  }
  return result.data;
}

let cached: SupabasePublicEnv | undefined;

export function getSupabasePublicEnv(): SupabasePublicEnv {
  cached ??= parseSupabasePublicEnv({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return cached;
}
