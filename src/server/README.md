# Server-only code (planned)

Code here must never be imported by Client Components. Each module will start with `import "server-only"` so an accidental client import fails the build.

Planned modules:

- `db/`: Drizzle client and schema
- `auth/`: session helpers and guards (`requireUser`, `requireRole`, `requireVerifiedDietitian`, `requireClientAccess`)
- `payments/`: `PaymentProvider` interface + Razorpay implementation
- `ai/`: OpenAI client, quota checks, usage recording
- `email/`: Resend client and job enqueueing
- `env.ts`: Zod-validated environment variables

Nothing is implemented yet (Step 1).
