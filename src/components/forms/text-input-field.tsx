"use client";

import type { FieldPath, FieldValues } from "react-hook-form";

import {
  FormField,
  type FormFieldBaseProps,
} from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";

type TextInputFieldProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
  TTransformed extends FieldValues = TValues,
> = FormFieldBaseProps<TValues, TName, TTransformed> & {
  type?: "text" | "email" | "tel" | "url" | "password";
  placeholder?: string;
  // Helps browsers and password managers autofill correctly, e.g. "email", "name".
  autoComplete?: string;
  maxLength?: number;
  disabled?: boolean;
};

export function TextInputField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
  TTransformed extends FieldValues = TValues,
>({
  type = "text",
  placeholder,
  autoComplete,
  maxLength,
  disabled,
  ...fieldProps
}: TextInputFieldProps<TValues, TName, TTransformed>) {
  return (
    <FormField
      {...fieldProps}
      render={({ field, a11y }) => (
        <Input
          {...field}
          {...a11y}
          value={field.value ?? ""}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          disabled={disabled || field.disabled}
          className="h-10"
        />
      )}
    />
  );
}
