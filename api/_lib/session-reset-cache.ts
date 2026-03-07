let cachedResetTime: string | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 10_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSessionResetTime(supabase: any): Promise<string | null> {
  if (Date.now() < cacheExpiry) return cachedResetTime;

  if (!supabase) {
    cachedResetTime = null;
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return null;
  }

  try {
    const { data } = await supabase
      .from("activity_events")
      .select("created_at")
      .eq("type", "session_reset")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    cachedResetTime = data?.created_at || null;
  } catch {
    cachedResetTime = null;
  }

  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return cachedResetTime;
}

export function invalidateResetCache() {
  cacheExpiry = 0;
}
