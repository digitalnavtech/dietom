import { z } from "zod";

// Shared by src/server/env.ts (the app) and drizzle.config.ts (the CLI).
// This file must not import "server-only", because the CLI runs outside Next.js.
//
// Error messages name the variable and the problem, but NEVER include the value,
// because values are secrets and error messages end up in logs.

// Catches values copied from a template and never filled in.
const PLACEHOLDER = /YOUR[-_]|\[YOUR|<your|changeme/i;

const notPlaceholder = z
  .string()
  .refine((value) => !PLACEHOLDER.test(value), {
    error: `still contains a template placeholder (e.g. YOUR_...). Paste the real value from the Supabase dashboard.`,
  });

export const databaseUrlSchema = z
  .string({ error: "DATABASE_URL is missing. Add it to .env.local." })
  .min(1, "DATABASE_URL is empty. Add it to .env.local.")
  .pipe(notPlaceholder)
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return url.protocol === "postgres:" || url.protocol === "postgresql:";
      } catch {
        return false;
      }
    },
    {
      error:
        "DATABASE_URL must be a postgresql:// connection string. If your password has special characters (@ : / # ?), URL-encode them.",
    },
  )
  // The driver decodes %XX sequences in the username/password and crashes on a
  // stray "%". Catch it here with a clear message instead.
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        decodeURIComponent(url.username);
        decodeURIComponent(url.password);
        return true;
      } catch {
        return false;
      }
    },
    {
      error:
        'DATABASE_URL has a "%" that is not a valid encoding. Encode a literal % as %25 (then # as %23, ? as %3F), or use a password with only letters and digits.',
    },
  );

export const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .url({ error: "NEXT_PUBLIC_SUPABASE_URL must be a URL like https://<project-ref>.supabase.co" })
    .pipe(notPlaceholder),
  // Publishable key: safe in the browser, but only because RLS protects every table.
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string({ error: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing." })
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is empty.")
    .pipe(notPlaceholder),
  DATABASE_URL: databaseUrlSchema,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

// Formats Zod issues as "- NAME: message" lines (no values). `name` labels
// issues from single-value schemas, which have no path.
export function describeEnvIssues(error: z.ZodError, name = "env"): string {
  return error.issues
    .map((issue) => `- ${issue.path.join(".") || name}: ${issue.message}`)
    .join("\n");
}
