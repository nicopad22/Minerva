import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Singleton client — Supabase manages the session via localStorage automatically
let _client = null;

export function createClient() {
    if (_client) return _client;
    _client = createSupabaseClient(
        process.env.NEXT_PUBLIC_dbUrl,
        process.env.NEXT_PUBLIC_dbKey
    );
    return _client;
}