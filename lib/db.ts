import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Piece } from './types';

// All database access happens server-side with the service-role key.
// The table has RLS enabled with zero policies (deny-all), so nothing
// short of this key can read or write it. No NEXT_PUBLIC_* Supabase
// vars exist anywhere in this app.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const TABLE = 'mcc_content_pieces';

export async function listPieces(): Promise<Piece[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Piece[];
}

export async function getPiece(id: string): Promise<Piece | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Piece | null;
}

export async function createPiece(input: Partial<Piece>): Promise<Piece> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Piece;
}

export async function updatePiece(id: string, input: Partial<Piece>): Promise<Piece> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Piece;
}

export async function deletePiece(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
