import { z } from "zod";

// Shared by the browser forms (instant feedback) and the Server Actions
// (the real check, because anyone can skip the browser).
//
// No schema has a role field, and z.object() drops unknown keys, so a forged
// `role: "admin"` in a request never reaches our code. Roles are assigned
// only by the database signup trigger ("customer") and by server-side admin code.

// Matches the Supabase project settings: min 8, letters and digits.
// Max 72 because bcrypt ignores everything after 72 bytes.
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use 72 characters or fewer")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .pipe(z.email("Enter a valid email address"));

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(120, "Name must be 120 characters or fewer"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords don't match",
  });

export const signInSchema = z.object({
  email: emailSchema,
  // No strength rules on sign-in: just "something was typed".
  password: z.string().min(1, "Password is required").max(72, "Password is too long"),
  // Where to go afterwards; re-checked with getSafeRedirectPath on the server.
  next: z.string().max(512).optional(),
});

export const emailOnlySchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords don't match",
  });

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignInInput = z.input<typeof signInSchema>;
export type EmailOnlyInput = z.input<typeof emailOnlySchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;

// What every auth Server Action returns (actions that succeed by redirecting
// never return).
export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; code?: string; fieldErrors?: Record<string, string> };

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}
