import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { passwordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "./schemas.ts";

const valid = {
  fullName: "  Asha Rao ",
  email: "  Asha@Example.TEST ",
  password: "goodpass1",
  confirmPassword: "goodpass1",
};

describe("passwordSchema (matches Supabase: min 8, letters + digits)", () => {
  it("accepts letters + digits, 8 to 72 characters", () => {
    assert.equal(passwordSchema.safeParse("abcdefg1").success, true);
    assert.equal(passwordSchema.safeParse("a1".repeat(36)).success, true);
  });

  it("rejects weak or oversized passwords", () => {
    for (const bad of ["short1", "allletters", "12345678", "a1".repeat(37)]) {
      assert.equal(passwordSchema.safeParse(bad).success, false, bad);
    }
  });
});

describe("signUpSchema", () => {
  it("normalizes name and email", () => {
    const result = signUpSchema.parse(valid);
    assert.equal(result.fullName, "Asha Rao");
    assert.equal(result.email, "asha@example.test");
  });

  it("strips any role or privilege fields an attacker adds", () => {
    const result = signUpSchema.parse({
      ...valid,
      role: "super_admin",
      roles: ["admin"],
      user_metadata: { role: "admin" },
      app_metadata: { roles: ["admin"] },
    }) as Record<string, unknown>;
    assert.deepEqual(Object.keys(result).sort(), ["confirmPassword", "email", "fullName", "password"]);
  });

  it("requires matching passwords", () => {
    const result = signUpSchema.safeParse({ ...valid, confirmPassword: "different1" });
    assert.equal(result.success, false);
    assert.deepEqual(result.error?.issues[0]?.path, ["confirmPassword"]);
  });

  it("rejects invalid emails", () => {
    assert.equal(signUpSchema.safeParse({ ...valid, email: "not-an-email" }).success, false);
  });
});

describe("signInSchema / resetPasswordSchema", () => {
  it("sign-in accepts any non-empty password (no strength rules)", () => {
    assert.equal(signInSchema.safeParse({ email: "a@b.test", password: "x" }).success, true);
    assert.equal(signInSchema.safeParse({ email: "a@b.test", password: "" }).success, false);
  });

  it("reset requires a strong, confirmed password", () => {
    assert.equal(resetPasswordSchema.safeParse({ password: "newpass12", confirmPassword: "newpass12" }).success, true);
    assert.equal(resetPasswordSchema.safeParse({ password: "weak", confirmPassword: "weak" }).success, false);
    assert.equal(resetPasswordSchema.safeParse({ password: "newpass12", confirmPassword: "newpass13" }).success, false);
  });
});
