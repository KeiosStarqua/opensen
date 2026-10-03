/**
 * URL search handling shared by the router and route `validateSearch`.
 * Search values stay plain strings (`?i=1`, `?add=1`, `?redirectTo=%2Fhome`),
 * matching the URLs the Next.js app produced, instead of the router's default
 * JSON encoding.
 */
export function parseSearch(searchStr: string): Record<string, string> {
  const params = new URLSearchParams(
    searchStr.startsWith("?") ? searchStr.slice(1) : searchStr,
  );
  const result: Record<string, string> = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** A search value as a string, or undefined when missing or empty. */
export function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}
