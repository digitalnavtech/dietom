"use client";

import type { FieldPath, FieldValues } from "react-hook-form";

import {
  FormField,
  type FormFieldBaseProps,
} from "@/components/forms/form-field";
import { Textarea } from "@/components/ui/textarea";

type TextareaFieldProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
  TTransformed extends FieldValues = TValues,
> = FormFieldBaseProps<TValues, TName, TTransformed> & {
  placeholder?: string;
  rows?: number;
  // When set, shows a live "120 / 280" counter. Validation still comes from Zod.
  maxLength?: number;
  disabled?: boolean;
};

export function TextareaField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
  TTransformed extends FieldValues = TValues,
>({
  placeholder,
  rows = 4,
  maxLength,
  disabled,
  ...fieldProps
}: TextareaFieldProps<TValues, TName, TTransformed>) {
  return (
    <FormField
      {...fieldProps}
      render={({ field, a11y }) => {
        const length = String(field.value ?? "").length;
        return (
          <div className="flex flex-col gap-1">
            <Textarea
              {...field}
              {...a11y}
              value={field.value ?? ""}
              rows={rows}
              placeholder={placeholder}
              disabled={disabled || field.disabled}
            />
            {maxLength ? (
              <p
                className={
                  length > maxLength
                    ? "self-end text-xs text-destructive"
                    : "self-end text-xs text-muted-foreground"
                }
              >
                {length} / {maxLength}
              </p>
            ) : null}
          </div>
        );
      }}
    />
  );
}
