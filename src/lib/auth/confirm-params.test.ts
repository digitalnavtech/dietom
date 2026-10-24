import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { authErrorMessage, getAuthErrorPage, getSignInStatus } from "./auth-messages.ts";
import { parseConfirmParams } from "./confirm-params.ts";

const p = (query: string) => parseConfirmParams(new URLSearchParams(query));

describe("parseConfirmParams (email confirmation & password reset links)", () => {
  it("accepts a signup confirmation link", () => {
    assert.deepEqual(p("token_hash=abc123def&type=signup&next=/dashboard/meal-plans"), {
      kind: "otp",
      tokenHash: "abc123def",
      type: "signup",
      next: "/dashboard/meal-plans",
    });
  });

  it("always sends recovery links to /reset-password, whatever next says", () => {
    const result = p("token_hash=abc123def&type=recovery&next=/admin");
    assert.equal(result.kind, "otp");
    if (result.kind === "otp") assert.equal(result.next, "/reset-password");
  });

  it("rejects unknown or dangerous link types", () => {
    for (const type of ["invite", "magiclink", "admin", ""]) {
      assert.deepEqual(p(`token_hash=abc123def&type=${type}`), { kind: "error", errorCode: "link_invalid" });
    }
  });

  it("sanitizes next to prevent open redirects", () => {
    const result = p("token_hash=abc123def&type=email&next=https://evil.example");
    assert.equal(result.kind === "otp" && result.next, "/dashboard");
    const code = p("code=abcdef123&next=//evil.example");
    assert.equal(code.kind === "code" && code.next, "/dashboard");
  });

  it("supports PKCE code links", () => {
    assert.deepEqual(p("code=abcdef123"), { kind: "code", code: "abcdef123", isRecovery: false, next: "/dashboard" });
    assert.deepEqual(p("code=abcdef123&type=recovery"), {
      kind: "code",
      code: "abcdef123",
      isRecovery: true,
      next: "/reset-password",
    });
  });

  it("maps expired and broken links to safe error codes", () => {
    assert.deepEqual(p("error=access_denied&error_code=otp_expired"), { kind: "error", errorCode: "link_expired" });
    assert.deepEqual(p("error=server_error"), { kind: "error", errorCode: "link_invalid" });
    assert.deepEqual(p(""), { kind: "error", errorCode: "link_invalid" });
    assert.deepEqual(p("token_hash=<script>&type=email"), { kind: "error", errorCode: "link_invalid" });
    assert.deepEqual(p("code=%20"), { kind: "error", errorCode: "link_invalid" });
  });
});

describe("auth messages", () => {
  it("never reveals whether an account exists on failed sign-in", () => {
    assert.equal(authErrorMessage("invalid_credentials"), authErrorMessage("user_not_found"));
  });

  it("uses a generic message for unknown codes", () => {
    assert.equal(authErrorMessage("totally_new_error"), "Something went wrong. Please try again.");
    assert.equal(authErrorMessage(undefined), "Something went wrong. Please try again.");
  });

  it("only shows allowlisted error pages and status banners", () => {
    assert.equal(getAuthErrorPage("link_expired").title, "This link has expired");
    assert.equal(getAuthErrorPage("<script>alert(1)</script>").title, "Something went wrong");
    assert.equal(getAuthErrorPage("toString").title, "Something went wrong");
    assert.equal(getSignInStatus("signed_out"), "You've been signed out.");
    assert.equal(getSignInStatus("Your account was hacked, call 555"), null);
    assert.equal(getSignInStatus("constructor"), null);
  });
});
