import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAccessContext } from "../../server/auth/access.ts";
import { decideAreaAccess, isProtectedPath } from "./area-access.ts";

const userId = "6f1c2b3a-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const ctx = (roles: string[], profileStatus = "active", dietitianVerificationStatus: string | null = null) =>
  buildAccessContext({ userId, profileStatus, roles, dietitianVerificationStatus });

describe("decideAreaAccess", () => {
  it("unauthenticated visitors are sent to sign in, for every area", () => {
    for (const area of ["customer", "dietitian", "admin"] as const) {
      assert.deepEqual(decideAreaAccess(null, area), { allowed: false, reason: "unauthenticated" });
    }
  });

  it("customers may enter the customer area only", () => {
    const customer = ctx(["customer"]);
    assert.deepEqual(decideAreaAccess(customer, "customer"), { allowed: true });
    assert.deepEqual(decideAreaAccess(customer, "dietitian"), { allowed: false, reason: "forbidden" });
    assert.deepEqual(decideAreaAccess(customer, "admin"), { allowed: false, reason: "forbidden" });
  });

  it("suspended or deleted accounts are blocked everywhere, whatever roles they hold", () => {
    for (const status of ["suspended", "deleted", null]) {
      const blocked = ctx(["customer", "dietitian", "admin", "super_admin"], status as string, "approved");
      for (const area of ["customer", "dietitian", "admin"] as const) {
        assert.deepEqual(decideAreaAccess(blocked, area), { allowed: false, reason: "inactive" });
      }
    }
  });

  it("dietitians need an APPROVED verification", () => {
    for (const status of ["pending", "rejected", "suspended", null]) {
      assert.deepEqual(decideAreaAccess(ctx(["customer", "dietitian"], "active", status), "dietitian"), {
        allowed: false,
        reason: "unverified_dietitian",
      });
    }
    assert.deepEqual(decideAreaAccess(ctx(["dietitian"], "active", "approved"), "dietitian"), { allowed: true });
  });

  it("an approved verification without the dietitian role is not enough", () => {
    assert.deepEqual(decideAreaAccess(ctx(["customer"], "active", "approved"), "dietitian"), {
      allowed: false,
      reason: "forbidden",
    });
  });

  it("admin area: admin and super_admin only", () => {
    assert.deepEqual(decideAreaAccess(ctx(["admin"]), "admin"), { allowed: true });
    assert.deepEqual(decideAreaAccess(ctx(["super_admin"]), "admin"), { allowed: true });
    assert.deepEqual(decideAreaAccess(ctx(["customer", "dietitian"], "active", "approved"), "admin"), {
      allowed: false,
      reason: "forbidden",
    });
  });

  it("role escalation: forged role strings never grant access", () => {
    const forged = ctx(["customer", "Admin", "admin ", "superadmin", "root"]);
    assert.deepEqual(decideAreaAccess(forged, "admin"), { allowed: false, reason: "forbidden" });
  });
});

describe("isProtectedPath", () => {
  it("matches the three areas and their nested pages", () => {
    for (const path of ["/dashboard", "/dashboard/diet-tracker", "/dietitian", "/dietitian/clients", "/admin", "/admin/users"]) {
      assert.equal(isProtectedPath(path), true, path);
    }
  });

  it("does not match public pages or look-alike paths", () => {
    for (const path of ["/", "/ui-kit", "/sign-in", "/dashboards", "/administrator", "/admin-help"]) {
      assert.equal(isProtectedPath(path), false, path);
    }
  });
});
