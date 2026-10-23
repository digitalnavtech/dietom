import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { appRole } from "../db/schema/enums.ts";
import { APP_ROLES, buildAccessContext, hasAnyRole, hasRole } from "./access.ts";

const userId = "6f1c2b3a-4d5e-4f60-8a7b-9c0d1e2f3a4b";

describe("APP_ROLES", () => {
  it("matches the app_role database enum exactly", () => {
    assert.deepEqual([...APP_ROLES], appRole.enumValues);
  });
});

describe("buildAccessContext", () => {
  it("gives an active customer the customer role", () => {
    const ctx = buildAccessContext({
      userId,
      profileStatus: "active",
      roles: ["customer"],
      dietitianVerificationStatus: null,
    });
    assert.deepEqual(ctx, { userId, isActive: true, roles: ["customer"], isVerifiedDietitian: false });
  });

  it("drops unknown role strings instead of trusting them", () => {
    const ctx = buildAccessContext({
      userId,
      profileStatus: "active",
      roles: ["customer", "root", "ADMIN", "super_admin "],
      dietitianVerificationStatus: null,
    });
    assert.deepEqual(ctx.roles, ["customer"]);
  });

  it("dedupes and orders roles consistently", () => {
    const ctx = buildAccessContext({
      userId,
      profileStatus: "active",
      roles: ["admin", "customer", "admin"],
      dietitianVerificationStatus: null,
    });
    assert.deepEqual(ctx.roles, ["customer", "admin"]);
  });

  for (const status of ["suspended", "deleted", null, "ACTIVE", ""]) {
    it(`grants no roles when profile status is ${JSON.stringify(status)}`, () => {
      const ctx = buildAccessContext({
        userId,
        profileStatus: status,
        roles: ["customer", "dietitian", "super_admin"],
        dietitianVerificationStatus: "approved",
      });
      assert.equal(ctx.isActive, false);
      assert.deepEqual(ctx.roles, []);
      assert.equal(ctx.isVerifiedDietitian, false);
    });
  }

  it("requires BOTH the dietitian role and an approved verification", () => {
    const base = { userId, profileStatus: "active" };
    assert.equal(
      buildAccessContext({ ...base, roles: ["customer", "dietitian"], dietitianVerificationStatus: "approved" })
        .isVerifiedDietitian,
      true,
    );
    for (const status of ["pending", "rejected", "suspended", null]) {
      assert.equal(
        buildAccessContext({ ...base, roles: ["dietitian"], dietitianVerificationStatus: status })
          .isVerifiedDietitian,
        false,
        `status ${status}`,
      );
    }
    // An approved dietitian_profiles row without the dietitian role is not enough.
    assert.equal(
      buildAccessContext({ ...base, roles: ["customer"], dietitianVerificationStatus: "approved" })
        .isVerifiedDietitian,
      false,
    );
  });
});

describe("hasRole / hasAnyRole", () => {
  const ctx = buildAccessContext({
    userId,
    profileStatus: "active",
    roles: ["customer", "dietitian"],
    dietitianVerificationStatus: "pending",
  });

  it("checks single roles", () => {
    assert.equal(hasRole(ctx, "dietitian"), true);
    assert.equal(hasRole(ctx, "admin"), false);
  });

  it("checks any of several roles", () => {
    assert.equal(hasAnyRole(ctx, ["admin", "super_admin"]), false);
    assert.equal(hasAnyRole(ctx, ["admin", "customer"]), true);
    assert.equal(hasAnyRole(ctx, []), false);
  });
});
