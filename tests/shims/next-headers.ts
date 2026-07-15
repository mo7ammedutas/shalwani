// Shim for "next/headers" in unit tests. cookies() is only used by the
// request-scoped helpers, which the unit suite doesn't touch.
export async function cookies() {
  return {
    get: () => undefined,
  };
}
