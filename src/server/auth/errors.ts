// Thrown by requireAuthUser() / requireAreaAccess() when there is no verified
// user. Pages redirect to /sign-in instead; actions and route handlers let this
// surface as an error (never as "access granted").
export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthenticationRequiredError";
  }
}

// Thrown by requireAreaAccess() when the user is signed in but not allowed.
export class AuthorizationError extends Error {
  constructor(readonly reason: "inactive" | "forbidden" | "unverified_dietitian") {
    super("Not authorized");
    this.name = "AuthorizationError";
  }
}
