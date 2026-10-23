// Thrown by requireAuthUser() when there is no verified user. Phase 4B will
// turn this into a redirect to the sign-in page. Until then it surfaces as an
// error (never as "access granted").
export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthenticationRequiredError";
  }
}
