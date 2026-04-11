/**
 * cn() — className birleştirme helper.
 *
 * `clsx` ve `tailwind-merge` dependency eklemeden minimal bir implementasyon.
 * Koşullu sınıflar için falsy değerler (false, null, undefined, '') filtrelenir.
 *
 * Örnek:
 *   cn("px-4 py-2", isActive && "bg-arena-red", { "opacity-50": disabled })
 */
type ClassValue =
  | string
  | number
  | null
  | boolean
  | undefined
  | Record<string, boolean | null | undefined>
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) classes.push(nested);
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(" ");
}
