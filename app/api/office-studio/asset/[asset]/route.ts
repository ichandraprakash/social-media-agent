import { getOfficeAsset } from "@/lib/office-studio";

// Serves images extracted from office-studio scene bundles.
// URLs are content hashes, so responses can be cached forever.
export async function GET(_request: Request, { params }: { params: Promise<{ asset: string }> }) {
  const { asset } = await params;
  const id = asset.replace(/\.[a-z]+$/i, "");
  if (!/^[a-f0-9]{20}$/.test(id)) return new Response("Not found", { status: 404 });

  const found = await getOfficeAsset(id);
  if (!found) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(found.data), {
    headers: {
      "Content-Type": found.mime,
      "Content-Length": String(found.data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
