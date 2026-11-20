/** Temporary UI convention: discovery only, never pricing or learning entitlement. */
export function isTrialNamed(...values: (string | null | undefined)[]) {
  return values.some((value) => {
    const text = (value ?? '').normalize('NFC').toLocaleLowerCase('vi');
    return (
      /(^|[^\p{L}\p{N}])(thử|trial)(?=$|[^\p{L}\p{N}])/u.test(text) ||
      /(^|[^a-z])hoc[\s_-]+thu(?=$|[^a-z])/i.test(text)
    );
  });
}
