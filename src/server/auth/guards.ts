import "server-only";

import { decideAreaAccess, type AreaDecision, type ProtectedArea } from "@/lib/auth/area-access";

import type { AccessContext } from "./access";
import { AuthenticationRequiredError, AuthorizationError } from "./errors";
import { getAccessContext } from "./session";

// Server-side authorization for dashboard areas. Two flavours:
//
// - getAreaAccess(): for pages. Returns the decision so the page can render
//   the right state (redirect to sign-in, "access denied", content).
// - requireAreaAccess(): for Server Actions and Route Handlers. Throws unless
//   allowed. EVERY protected action/handler must call it itself: a page being
//   protected does NOT protect the actions it uses, because actions are
//   separate public HTTP endpoints.

export async function getAreaAccess(
  area: ProtectedArea,
): Promise<{ context: AccessContext | null; decision: AreaDecision }> {
  const context = await getAccessContext();
  return { context, decision: decideAreaAccess(context, area) };
}

export async function requireAreaAccess(area: ProtectedArea): Promise<AccessContext> {
  const { context, decision } = await getAreaAccess(area);
  if (decision.allowed && context) return context;
  if (decision.allowed || decision.reason === "unauthenticated") {
    throw new AuthenticationRequiredError();
  }
  throw new AuthorizationError(decision.reason);
}
