import { z } from "zod";

// Zod schemas describe valid data once; React Hook Form uses them in the
// browser now, and server actions will reuse the same schema later so the
// rules can't drift apart. (Client-side validation is for UX, server-side
// validation is for security. We'll need both.)

export const INTEREST_OPTIONS = [
  { value: "individual", label: "I want to improve my own nutrition" },
  { value: "dietitian", label: "I'm a dietitian or nutritionist" },
  { value: "curious", label: "Just exploring" },
] as const;

const interestValues: readonly string[] = INTEREST_OPTIONS.map((option) => option.value);

export const newsletterInterestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be 60 characters or fewer"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .pipe(z.email("Enter a valid email address, like name@example.com")),
  // Starts as "" (nothing chosen) so the select can show a placeholder.
  interest: z
    .string()
    .refine((value) => interestValues.includes(value), "Choose the option that best describes you"),
  message: z
    .string()
    .trim()
    .max(280, "Keep your note to 280 characters or fewer"),
  // Lets you try the error path. Not part of a real form.
  simulateFailure: z.boolean(),
});

// z.input = what the form holds while editing; z.output = the cleaned result
// (e.g. trimmed strings) that onSubmit receives.
export type NewsletterInterestInput = z.input<typeof newsletterInterestSchema>;
export type NewsletterInterestValues = z.output<typeof newsletterInterestSchema>;
