import "server-only";

import { describeEnvIssues, serverEnvSchema, type ServerEnv } from "./env-schema";

// Validated server environment. "server-only" makes the build fail if a Client
// Component ever imports this file, so DATABASE_URL can't leak to the browser.
//
// Validation is lazy (on first use), not at import time. Pages that never touch
// the database still build and run without database credentials.
let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      `Invalid server environment variables:\n${describeEnvIssues(result.error)}`,
    );
  }
  cached = result.data;
  return cached;
}
