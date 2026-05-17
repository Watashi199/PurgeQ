/**
 * Banlist data layer — Supabase queries + local cache.
 *
 * The cache is a flat Map<lowercased-faceit-name, BanInfo> stored in
 * chrome.storage.local, shared by all three MV3 contexts. The service
 * worker is the only writer; popup and content script consume the cache.
 *
 * RLS policies on the bans table mean every query is automatically
 * filtered to {bans user owns} ∪ {bans in banlists they're a member of}.
 * No client-side filtering needed.
 */
import { supabase } from './supabase';

const CACHE_KEY = 'purgeq_banlist_cache';

export interface BanInfo {
  id: string;
  faceit_name: string;
  reason: string;
  /** Renamed from `author` on the wire — matches the DB column author_name. */
  author: string;
  banlist_id: string;
  /** Banlist display name, useful for "Banned via X list" tooltips on shared bans. */
  banlist_name: string;
  /** True when this ban lives in the current user's own banlist (vs a shared one). */
  is_own: boolean;
  created_at: string;
  updated_at: string;
}

/** Internal storage layout — flat object for chrome.storage compatibility. */
interface CachedBanlist {
  timestamp: number;
  data: Record<string, BanInfo>;
}

// ───────── Cache helpers ─────────

export async function getCachedBanlist(): Promise<Map<string, BanInfo>> {
  try {
    const stored = await chrome.storage.local.get(CACHE_KEY);
    const cached = stored[CACHE_KEY] as CachedBanlist | undefined;
    if (!cached) return new Map();
    return new Map(Object.entries(cached.data));
  } catch (error) {
    console.error('[PurgeQ] Failed to read banlist cache:', error);
    return new Map();
  }
}

export async function clearBanlistCache(): Promise<void> {
  try {
    await chrome.storage.local.remove(CACHE_KEY);
  } catch (error) {
    console.error('[PurgeQ] Failed to clear banlist cache:', error);
  }
}

async function writeCache(banlist: Map<string, BanInfo>): Promise<void> {
  const payload: CachedBanlist = {
    timestamp: Date.now(),
    data: Object.fromEntries(banlist),
  };
  await chrome.storage.local.set({ [CACHE_KEY]: payload });
}

// ───────── Supabase queries ─────────

/**
 * Fetch all bans visible to the current user (own + shared) and refresh
 * the local cache. Returns the new Map.
 *
 * Caller is responsible for being signed in — RLS will return an empty
 * set for anon callers.
 */
export async function refreshBanlistFromSupabase(): Promise<Map<string, BanInfo>> {
  const { data: userData } = await supabase.auth.getUser();
  const currentUserId = userData?.user?.id ?? null;

  const { data, error } = await supabase
    .from('bans')
    .select('id, faceit_name, reason, author_name, banlist_id, created_at, updated_at, banlist:banlists(name, owner_id)');

  if (error) throw error;

  const map = new Map<string, BanInfo>();
  for (const row of data ?? []) {
    const banlist = (row as { banlist?: { name: string; owner_id: string } | null }).banlist;
    map.set(row.faceit_name.toLowerCase(), {
      id: row.id,
      faceit_name: row.faceit_name,
      reason: row.reason,
      author: row.author_name,
      banlist_id: row.banlist_id,
      banlist_name: banlist?.name ?? 'Banlist',
      is_own: banlist?.owner_id === currentUserId,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  await writeCache(map);
  return map;
}

/**
 * Cache of the current user's personal banlist id, so addBan doesn't have
 * to look it up on every insert.
 */
let _personalBanlistIdCache: string | null = null;

/**
 * Cache of the current user's display_name, used as the fallback author
 * when an ADD_BAN message arrives without one (e.g. the inline ban form
 * on a FACEIT card where the user hasn't set a custom author yet).
 */
let _displayNameCache: string | null = null;

export function resetPersonalBanlistCache(): void {
  _personalBanlistIdCache = null;
  _displayNameCache = null;
}

async function getPersonalBanlistId(): Promise<string> {
  if (_personalBanlistIdCache) return _personalBanlistIdCache;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('banlists')
    .select('id')
    .eq('owner_id', userId)
    .single();

  if (error) throw error;
  _personalBanlistIdCache = data.id;
  return data.id;
}

async function getDisplayName(): Promise<string> {
  if (_displayNameCache) return _displayNameCache;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('Not signed in');

  const { data } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle();

  _displayNameCache = data?.display_name?.trim() || 'User';
  return _displayNameCache;
}

export interface AddBanInput {
  faceit_name: string;
  reason: string;
  /**
   * Display name attached to this ban entry. If omitted or empty, the
   * user's Discord display_name is used (resolved + cached on first call).
   * That covers the inline FACEIT ban form, which doesn't know — and
   * shouldn't have to ask — the user's preferred author label.
   */
  author_name?: string;
}

/**
 * Insert a new ban into the current user's personal banlist. RLS will
 * refuse the insert if the user is signed out or doesn't own a banlist
 * (shouldn't happen — the signup trigger creates one).
 */
export async function addBan(input: AddBanInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('Not signed in');

  const banlistId = await getPersonalBanlistId();
  const authorName = input.author_name?.trim() || (await getDisplayName());

  const { error } = await supabase
    .from('bans')
    .insert({
      banlist_id: banlistId,
      faceit_name: input.faceit_name.trim(),
      reason: input.reason.trim(),
      author_id: userId,
      author_name: authorName,
    });

  if (error) throw error;
}

/**
 * Delete a ban by its id. The id comes from the local cache (BanInfo.id)
 * so callers can identify exactly which ban to remove, including bans in
 * shared banlists where the user has editor rights.
 */
export async function removeBanById(banId: string): Promise<void> {
  const { error } = await supabase.from('bans').delete().eq('id', banId);
  if (error) throw error;
}
