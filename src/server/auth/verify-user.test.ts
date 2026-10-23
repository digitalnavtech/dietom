import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { verifyUser, type GetUserAuthClient } from "./verify-user.ts";

const ID = "6f1c2b3a-4d5e-4f60-8a7b-9c0d1e2f3a4b";

function fakeAuth(result: Awaited<ReturnType<GetUserAuthClient["getUser"]>>): GetUserAuthClient {
  return { getUser: async () => result };
}

// Minimal Supabase User; cast because tests don't need every field.
function user(fields: Record<string, unknown>) {
  return { id: ID, aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "", ...fields } as never;
}

describe("verifyUser", () => {
  it("returns a narrow user for a valid session", async () => {
    const result = await verifyUser(
      fakeAuth({
        data: {
          user: user({
            email: "asha@example.test",
            email_confirmed_at: "2026-10-01T00:00:00Z",
            // These must never leak into AuthUser:
            user_metadata: { role: "super_admin", full_name: "Asha" },
            app_metadata: { roles: ["admin"] },
          }),
        },
        error: null,
      }),
    );
    assert.deepEqual(result, { id: ID, email: "asha@example.test", emailConfirmed: true });
  });

  it("marks unconfirmed emails", async () => {
    const result = await verifyUser(fakeAuth({ data: { user: user({ email: "x@example.test" }) }, error: null }));
    assert.equal(result?.emailConfirmed, false);
  });

  it("returns null when not signed in", async () => {
    assert.equal(await verifyUser(fakeAuth({ data: { user: null }, error: null })), null);
  });

  it("returns null when the Auth server reports an error, even if a user object is present", async () => {
    const result = await verifyUser(
      fakeAuth({ data: { user: user({ email: "x@example.test" }) }, error: new Error("invalid JWT") }),
    );
    assert.equal(result, null);
  });

  it("fails closed when the Auth server is unreachable", async () => {
    const auth: GetUserAuthClient = {
      getUser: async () => {
        throw new Error("fetch failed");
      },
    };
    assert.equal(await verifyUser(auth), null);
  });

  it("rejects malformed user ids", async () => {
    assert.equal(await verifyUser(fakeAuth({ data: { user: user({ id: "admin" }) }, error: null })), null);
  });

  it("only calls getUser (never trusts getSession)", async () => {
    let getSessionCalled = false;
    const auth = {
      getUser: async () => ({ data: { user: user({}) }, error: null }),
      getSession: async () => {
        getSessionCalled = true;
        return { data: { session: null }, error: null };
      },
    };
    await verifyUser(auth);
    assert.equal(getSessionCalled, false);
  });
});
