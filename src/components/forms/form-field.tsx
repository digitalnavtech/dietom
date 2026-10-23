"use client";

import { useId } from "react";
import {
  Controller,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { FormErrorMessage } from "@/components/forms/form-error-message";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

// Accessibility props every control must receive so the label, description and
// error message are announced together with the input.
export type FieldA11yProps = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

export type FormFieldRenderArgs<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> = {
  field: ControllerRenderProps<TValues, TName>;
  fieldState: ControllerFieldState;
  a11y: FieldA11yProps;
};

// TTransformed = values after Zod cleans them (what onSubmit receives).
export type FormFieldBaseProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
  TTransformed extends FieldValues = TValues,
> = {
  control: Control<TValues, unknown, TTransformed>;
  name: TName;
  label: string;
  description?: string;
  // Shown after the label, e.g. "(optional)".
  labelHint?: string;
  className?: string;
};

type FormFieldProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
  TTransformed extends FieldValues = TValues,
> = FormFieldBaseProps<TValues, TName, TTransformed> & {
  render: (args: FormFieldRenderArgs<TValues, TName>) => React.ReactNode;
};

// The one wrapper every form control goes through. It connects a control to
// React Hook Form (via Controller) and renders label + description + error.
// Generics mean `name` is checked against the form's schema at compile time:
// a typo like name="emial" is a TypeScript error.
export function FormField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
  TTransformed extends FieldValues = TValues,
>({
  control,
  name,
  label,
  description,
  labelHint,
  className,
  render,
}: FormFieldProps<TValues, TName, TTransformed>) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const invalid = fieldState.invalid;
        const describedBy =
          [description ? descriptionId : null, invalid ? errorId : null]
            .filter(Boolean)
            .join(" ") || undefined;

        return (
          <Field data-invalid={invalid} className={className}>
            <FieldLabel htmlFor={id}>
              {label}
              {labelHint ? (
                <span className="font-normal text-muted-foreground">
                  {labelHint}
                </span>
              ) : null}
            </FieldLabel>
            {render({
              field,
              fieldState,
              a11y: {
                id,
                "aria-invalid": invalid,
                "aria-describedby": describedBy,
              },
            })}
            {description ? (
              <FieldDescription id={descriptionId}>{description}</FieldDescription>
            ) : null}
            <FormErrorMessage id={errorId} message={fieldState.error?.message} />
          </Field>
        );
      }}
    />
  );
}
