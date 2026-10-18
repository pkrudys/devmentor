"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

export interface CrudFormProps<TSchema extends z.ZodObject<z.ZodRawShape>> {
  schema: TSchema;
  initialValues?: Partial<z.infer<TSchema>>;
  onSubmit: (values: z.infer<TSchema>) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  /** Field errors from the server envelope — takes precedence over local Zod errors. */
  fieldErrors?: Record<string, string>;
}

type FieldKind = "string" | "number" | "boolean" | "enum" | "unsupported";

function unwrapOptional(schema: z.ZodTypeAny): { inner: z.ZodTypeAny; optional: boolean } {
  if (schema instanceof z.ZodOptional) {
    // `instanceof` narrows to ZodOptional's default type param (internal
    // $ZodType), not the public ZodTypeAny `unwrap()` actually returns here.
    return { inner: schema.unwrap() as z.ZodTypeAny, optional: true };
  }
  return { inner: schema, optional: false };
}

function fieldKind(schema: z.ZodTypeAny): FieldKind {
  if (schema instanceof z.ZodString) return "string";
  if (schema instanceof z.ZodNumber) return "number";
  if (schema instanceof z.ZodBoolean) return "boolean";
  if (schema instanceof z.ZodEnum) return "enum";
  return "unsupported";
}

/**
 * Schema-driven form: covers string/number/boolean/enum fields (optionally
 * wrapped in `.optional()`) — the common cases. A field type this doesn't
 * recognize renders as a disabled text input rather than crashing; extend
 * `fieldKind`/the switch below when a new case genuinely appears.
 */
export function CrudForm<TSchema extends z.ZodObject<z.ZodRawShape>>({
  schema,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  fieldErrors,
}: CrudFormProps<TSchema>) {
  const shape = schema.shape as Record<string, z.ZodTypeAny>;
  const fieldNames = Object.keys(shape);
  const [values, setValues] = useState<Record<string, unknown>>(() => ({ ...initialValues }));
  const [submitting, setSubmitting] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string> | undefined>(undefined);

  const errors = fieldErrors ?? localErrors;

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    const result = schema.safeParse(values);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (path && !(path in next)) {
          next[path] = issue.message;
        }
      }
      setLocalErrors(next);
      return;
    }
    setLocalErrors(undefined);
    setSubmitting(true);
    try {
      await onSubmit(result.data);
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
    }
    if (event.key === "Escape" && onCancel) {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-4">
      {fieldNames.map((name) => {
        const { inner, optional } = unwrapOptional(shape[name]);
        const kind = fieldKind(inner);
        const error = errors?.[name];
        const value = values[name];

        return (
          <div key={name} className="flex flex-col gap-1">
            <label htmlFor={name} className="text-sm font-medium text-foreground">
              {name}
              {!optional && (
                <span aria-hidden className="text-destructive">
                  {" "}
                  *
                </span>
              )}
            </label>

            {kind === "boolean" ? (
              <input
                id={name}
                type="checkbox"
                checked={Boolean(value)}
                onChange={(event) => setValues((v) => ({ ...v, [name]: event.target.checked }))}
              />
            ) : kind === "enum" ? (
              <select
                id={name}
                value={typeof value === "string" ? value : ""}
                onChange={(event) => setValues((v) => ({ ...v, [name]: event.target.value }))}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Select…
                </option>
                {(inner as unknown as { options: string[] }).options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={name}
                type={kind === "number" ? "number" : "text"}
                disabled={kind === "unsupported"}
                value={typeof value === "string" || typeof value === "number" ? value : ""}
                onChange={(event) =>
                  setValues((v) => ({
                    ...v,
                    [name]: kind === "number" ? event.target.valueAsNumber : event.target.value,
                  }))
                }
                className={cn(
                  "rounded-md border bg-background px-3 py-2 text-sm",
                  error && "border-destructive"
                )}
              />
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );
      })}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
