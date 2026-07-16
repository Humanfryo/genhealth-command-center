import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Piece } from './types';

// All database access happens server-side with the service-role key.
// The table has RLS enabled with zero policies (deny-all), so nothing
// short of this key can read or write it. No NEXT_PUBLIC_* Supabase
// vars exist anywhere in this app.
//
// The client is created lazily on first use, not at module load: a missing
// env var should fail a request with a readable error, not fail the build.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: SupabaseClient<any, 'public', any> | null = null;

function supabaseClient() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Database is not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

const TABLE = 'mcc_content_pieces';

export async function listPieces(): Promise<Piece[]> {
  const { data, error } = await supabaseClient()
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  // The board and schedule render at most a 2-line preview — don't ship
  // full draft bodies (up to ~2K words each) in the home page's payload.
  return (data as Piece[]).map((p) => ({ ...p, body: p.body.slice(0, 240) }));
}

export async function getPiece(id: string): Promise<Piece | null> {
  const { data, error } = await supabaseClient()
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Piece | null;
}

export async function createPiece(input: Partial<Piece>): Promise<Piece> {
  const { data, error } = await supabaseClient()
    .from(TABLE)
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Piece;
}

export async function updatePiece(id: string, input: Partial<Piece>): Promise<Piece | null> {
  const { data, error } = await supabaseClient()
    .from(TABLE)
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Piece | null;
}

export async function deletePiece(id: string): Promise<void> {
  const { error } = await supabaseClient().from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
