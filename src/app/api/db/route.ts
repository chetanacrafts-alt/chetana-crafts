import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { ARRAY_TABLES, SETTINGS_ID, settingsToRow, rowToSettings, type Row } from "@/lib/db-mapping";
import type { ChetanaDB } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const supabase = getSupabaseAdmin();

  try {
    const tableKeys = Object.keys(ARRAY_TABLES) as Array<keyof typeof ARRAY_TABLES>;
    const [arrayResults, settingsResult] = await Promise.all([
      Promise.all(
        tableKeys.map((key) => supabase.from(ARRAY_TABLES[key].table).select("*"))
      ),
      supabase.from("settings").select("*").eq("id", SETTINGS_ID).maybeSingle(),
    ]);

    for (const result of arrayResults) {
      if (result.error) throw result.error;
    }
    if (settingsResult.error) throw settingsResult.error;

    const db = {} as ChetanaDB;
    tableKeys.forEach((key, i) => {
      const config = ARRAY_TABLES[key];
      const rows = (arrayResults[i].data ?? []) as Row[];
      (db[key] as unknown[]) = rows.map((r) => config.fromRow(r));
    });
    db.settings = rowToSettings(settingsResult.data as Row | null);

    return NextResponse.json(db);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  const body = (await request.json()) as Partial<ChetanaDB>;
  const failedTables: string[] = [];

  const tableKeys = Object.keys(ARRAY_TABLES) as Array<keyof typeof ARRAY_TABLES>;
  await Promise.all(
    tableKeys.map(async (key) => {
      const config = ARRAY_TABLES[key];
      const items = body[key];
      if (!Array.isArray(items)) return;

      const rows = items.map((item) => config.toRow(item as never));
      try {
        if (rows.length > 0) {
          const { error: upsertError } = await supabase
            .from(config.table)
            .upsert(rows, { onConflict: config.idField });
          if (upsertError) throw upsertError;
        }

        const postedIds = new Set(rows.map((r) => r[config.idField] as string));
        const { data: existing, error: selectError } = await supabase
          .from(config.table)
          .select(config.idField);
        if (selectError) throw selectError;

        const idsToDelete = ((existing ?? []) as unknown as Row[])
          .map((r) => r[config.idField] as string)
          .filter((id) => !postedIds.has(id));
        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from(config.table)
            .delete()
            .in(config.idField, idsToDelete);
          if (deleteError) throw deleteError;
        }
      } catch {
        failedTables.push(config.table);
      }
    })
  );

  if (body.settings) {
    const { error } = await supabase
      .from("settings")
      .upsert(settingsToRow(body.settings), { onConflict: "id" });
    if (error) failedTables.push("settings");
  }

  if (failedTables.length > 0) {
    return NextResponse.json({ error: `Failed tables: ${failedTables.join(", ")}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
