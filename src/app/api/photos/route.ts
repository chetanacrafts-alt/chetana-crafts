import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const BUCKET = "purchase-photos";
const MAX_BYTES = 5 * 1024 * 1024;

function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string; ext: string } | null {
  const match = /^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const [, contentType, subtype, base64] = match;
  return {
    buffer: Buffer.from(base64, "base64"),
    contentType,
    ext: subtype === "jpeg" ? "jpg" : subtype,
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as { dataUrl?: string };
  if (!body.dataUrl) {
    return NextResponse.json({ error: "Missing dataUrl" }, { status: 400 });
  }

  const parsed = parseDataUrl(body.dataUrl);
  if (!parsed) {
    return NextResponse.json({ error: "Expected a base64 image data URL" }, { status: 400 });
  }
  if (parsed.buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large" }, { status: 413 });
  }

  const supabase = getSupabaseAdmin();
  const path = `${crypto.randomUUID()}.${parsed.ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, parsed.buffer, { contentType: parsed.contentType });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 502 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
