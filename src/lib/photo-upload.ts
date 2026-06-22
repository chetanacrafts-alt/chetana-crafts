/** Uploads a compressed image data URL (from fileToCompressedDataURL) to
 * Supabase Storage and returns the public URL to store instead of the raw
 * data — keeps purchase records small and makes the photo viewable from any
 * device, not just the one it was taken on. */
export async function uploadPurchasePhoto(dataUrl: string): Promise<string> {
  const res = await fetch("/api/photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  });
  if (!res.ok) {
    throw new Error(`Photo upload failed: ${res.status}`);
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}
