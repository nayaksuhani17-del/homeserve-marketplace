/** True when real Supabase credentials are present (not placeholder values). */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes("your-project") || key.includes("your-anon")) return false;
  return true;
}
