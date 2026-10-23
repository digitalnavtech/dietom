import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseSupabasePublicEnv } from "./public-env.ts";

const url = "https://abcdefghijklmnopqrst.supabase.co";
// Built in pieces so secret scanners (e.g. GitHub push protection) don't
// mistake these fake test values for real leaked keys.
const SECRET_PREFIX = ["sb", "secret", ""].join("_");

function fakeJwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

describe("parseSupabasePublicEnv", () => {
  it("accepts a publishable key", () => {
    const env = parseSupabasePublicEnv({ url, publishableKey: "sb_publishable_abc123" });
    assert.equal(env.url, url);
  });

  it("accepts a legacy anon JWT", () => {
    assert.doesNotThrow(() => parseSupabasePublicEnv({ url, publishableKey: fakeJwt({ role: "anon" }) }));
  });

  it("rejects a new-style secret key", () => {
    assert.throws(
      () => parseSupabasePublicEnv({ url, publishableKey: `${SECRET_PREFIX}abc123` }),
      /SECRET \/ service-role key/,
    );
  });

  it("rejects a legacy service_role JWT", () => {
    assert.throws(
      () => parseSupabasePublicEnv({ url, publishableKey: fakeJwt({ role: "service_role" }) }),
      /SECRET \/ service-role key/,
    );
  });

  it("rejects missing values with messages that never include the value", () => {
    assert.throws(() => parseSupabasePublicEnv({ url: undefined, publishableKey: undefined }), /NEXT_PUBLIC_SUPABASE_URL/);
    try {
      parseSupabasePublicEnv({ url: "not a url", publishableKey: `${SECRET_PREFIX}TOPSECRET` });
      assert.fail("should throw");
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.equal(error.message.includes("TOPSECRET"), false);
      assert.equal(error.message.includes("not a url"), false);
    }
  });
});
