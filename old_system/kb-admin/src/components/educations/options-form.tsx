// options-form.tsx
"use client";
import React from "react"; // Removed unused imports
import { PlusCircle, Trash2 } from "lucide-react";
import { Controller, useFieldArray } from "react-hook-form"; // Removed unused useForm

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // Make sure Checkbox is imported

// Assuming ClientOptionFormData is correctly defined in your form-schema.ts
// import { ClientOptionFormData } from './form-schema';

interface OptionsFormProps {
  prefix: `questions.${number}.options`;
  control: any; // Control object from useForm for the parent form (ChapterForm)
  register: any; // Register function from the parent form
  errors: any;   // Errors specific to this options array from parent formState
}

function OptionsForm({ prefix, control, register, errors }: OptionsFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: prefix,
    keyName: "fieldId", // Important: use a different keyName if 'id' is part of your data
  });

  return (
    <div className="space-y-3 pl-4 border-l ml-2 py-2">
      <div className="flex justify-between items-center mb-2">
        <h5 className="text-sm font-medium text-muted-foreground">Options</h5>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => append({ tempId: `opt-${Date.now()}`, text: "", isCorrect: fields.length === 0 })}
        >
          <PlusCircle className="h-3 w-3 mr-1" /> Add Option
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">No options added yet.</p>
      )}

      {fields.map((optionField, oIndex) => (
        <div key={optionField.fieldId} className="p-3 border rounded-md space-y-2 bg-background shadow-sm">
          <div className="flex justify-between items-center">
            <Label htmlFor={`${prefix}.${oIndex}.text`} className="text-xs font-semibold">
              Option {oIndex + 1}
            </Label>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(oIndex)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive"/>
            </Button>
          </div>
          <Input
            id={`${prefix}.${oIndex}.text`}
            {...register(`${prefix}.${oIndex}.text` as const)} // `as const` helps with type safety
            placeholder="Option text"
            className="h-9 text-sm" // Slightly increased height for better UX
          />
          {errors?.[oIndex]?.text && (
            <p className="text-xs text-destructive mt-1">{errors[oIndex].text.message}</p>
          )}
          <div className="flex items-center space-x-2 pt-1">
            {/* Controller is essential for custom/Shadcn components */}
            <Controller
              name={`${prefix}.${oIndex}.isCorrect` as const}
              control={control}
              defaultValue={false} // Set a default value for the checkbox
              render={({ field }) => (
                <Checkbox
                  id={`${prefix}.${oIndex}.isCorrect`}
                  checked={field.value}
                  onCheckedChange={field.onChange} // Use onCheckedChange for Shadcn Checkbox
                  aria-label="Is correct answer"
                />
              )}
            />
            <Label htmlFor={`${prefix}.${oIndex}.isCorrect`} className="text-xs font-normal cursor-pointer">
              Correct Answer
            </Label>
          </div>
          {errors?.[oIndex]?.isCorrect && (
            <p className="text-xs text-destructive mt-1">{errors[oIndex].isCorrect.message}</p>
          )}
        </div>
      ))}
      {/* General error for the options array itself, if applicable from Zod schema */}
      {errors && !Array.isArray(errors) && typeof errors.message === 'string' && (
        <p className="text-xs text-destructive mt-2">{errors.message}</p>
      )}
    </div>
  );
}

export default OptionsForm;