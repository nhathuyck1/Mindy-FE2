import { z } from 'zod';

const fieldSchema = z.object({
  path: z
    .string()
    .max(250)
    .regex(/^[a-zA-Z0-9_.\[\]-]+$/),
  code: z
    .string()
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/),
});
const safeDetails = z.preprocess(
  (value) => {
    if (
      !Array.isArray(value) ||
      !value[0] ||
      typeof value[0] !== 'object' ||
      !('fields' in value[0]) ||
      !Array.isArray(value[0].fields)
    )
      return undefined;
    const fields = value[0].fields.slice(0, 2000).flatMap((field: unknown) => {
      const parsed = fieldSchema.safeParse(field);
      return parsed.success ? [parsed.data] : [];
    });
    return fields.length ? [{ fields }] : undefined;
  },
  z.array(z.object({ fields: z.array(fieldSchema) })).optional(),
);
export const safeErrorSchema = z.object({
  code: z.string().max(100),
  message: z.union([z.string(), z.array(z.string())]),
  details: safeDetails,
});
export type ValidationField = z.infer<typeof fieldSchema>;
export function validationFields(error: z.ZodError): ValidationField[] {
  return error.issues
    .map((issue) => ({ path: issue.path.map(String).join('.') || 'body', code: issue.code }))
    .slice(0, 2000);
}
