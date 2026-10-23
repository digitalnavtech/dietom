import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hasSupabaseAuthCookie, isSupabaseAuthCookie } from "./auth-cookies.ts";

describe("isSupabaseAuthCookie", () => {
  it("recognises Supabase session cookies, including chunks and PKCE", () => {
    for (const name of [
      "sb-iiairsxmjvajmdkjcqjy-auth-token",
      "sb-iiairsxmjvajmdkjcqjy-auth-token.0",
      "sb-iiairsxmjvajmdkjcqjy-auth-token.12",
      "sb-iiairsxmjvajmdkjcqjy-auth-token-code-verifier",
    ]) {
      assert.equal(isSupabaseAuthCookie(name), true, name);
    }
  });

  it("ignores unrelated cookies", () => {
    for (const name of ["theme", "sb-", "sb-abc-auth", "my-sb-abc-auth-token", "sb-ABC-auth-token", "sb-abc-auth-token.x"]) {
      assert.equal(isSupabaseAuthCookie(name), false, name);
    }
  });
});

describe("hasSupabaseAuthCookie", () => {
  it("is false for signed-out visitors", () => {
    assert.equal(hasSupabaseAuthCookie([]), false);
    assert.equal(hasSupabaseAuthCookie([{ name: "theme" }]), false);
  });

  it("is true when any session cookie is present", () => {
    assert.equal(hasSupabaseAuthCookie([{ name: "theme" }, { name: "sb-abc123-auth-token.1" }]), true);
  });
});
