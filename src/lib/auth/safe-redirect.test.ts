import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getSafeRedirectPath } from "./safe-redirect.ts";

describe("getSafeRedirectPath (redirect manipulation)", () => {
  it("keeps normal internal paths, including query and hash", () => {
    assert.equal(getSafeRedirectPath("/dashboard"), "/dashboard");
    assert.equal(getSafeRedirectPath("/dietitian/clients?page=2#top"), "/dietitian/clients?page=2#top");
    assert.equal(getSafeRedirectPath("/reset-password"), "/reset-password");
  });

  const attacks = [
    "https://evil.example",
    "http://evil.example/dashboard",
    "//evil.example",
    "///evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "/%2F%2Fevil.example",
    "/%2f%5cevil.example",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    " //evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "/dash board",
    "dashboard",
    "",
    "/%E0%A4%A",
    "/" + "a".repeat(600),
  ];
  for (const attack of attacks) {
    it(`rejects ${JSON.stringify(attack).slice(0, 40)}`, () => {
      assert.equal(getSafeRedirectPath(attack), "/dashboard");
    });
  }

  it("rejects non-strings and uses the given fallback", () => {
    assert.equal(getSafeRedirectPath(undefined), "/dashboard");
    assert.equal(getSafeRedirectPath(null, "/"), "/");
    assert.equal(getSafeRedirectPath(["/admin"], "/"), "/");
  });

  it("never redirects back into the auth flow", () => {
    assert.equal(getSafeRedirectPath("/sign-in?next=/admin"), "/dashboard");
    assert.equal(getSafeRedirectPath("/auth/confirm?code=x"), "/dashboard");
    assert.equal(getSafeRedirectPath("/sign-up"), "/dashboard");
  });
});
