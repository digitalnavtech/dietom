"use client";

import type { FieldPath, FieldValues } from "react-hook-form";

import {
  FormField,
  type FormFieldBaseProps,
} from "@/components/forms/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SelectFieldOption = { value: string; label: string };

type SelectFieldProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
  TTransformed extends FieldValues = TValues,
> = FormFieldBaseProps<TValues, TName, TTransformed> & {
  options: SelectFieldOption[];
  placeholder?: string;
  disabled?: boolean;
};

// Base UI Select (not a native <select>). The trigger is a <button>, so it gets
// the id/aria props and RHF's ref: on a validation error RHF can focus it.
export function SelectField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
  TTransformed extends FieldValues = TValues,
>({
  options,
  placeholder = "Select an option",
  disabled,
  ...fieldProps
}: SelectFieldProps<TValues, TName, TTransformed>) {
  return (
    <FormField
      {...fieldProps}
      render={({ field, a11y }) => (
        <Select
          items={options}
          name={field.name}
          // Empty string means "nothing chosen yet"; Base UI expects null for that.
          value={field.value ? field.value : null}
          onValueChange={(value) => field.onChange(value ?? "")}
          disabled={disabled || field.disabled}
        >
          <SelectTrigger
            {...a11y}
            ref={field.ref}
            onBlur={field.onBlur}
            className="h-10 w-full"
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}
