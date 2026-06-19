const BASE = "https://api.post-bridge.com";
const KEY = process.env.POSTBRIDGE_API_KEY || process.env.POST_BRIDGE_API_KEY;
const HEADERS = () => ({ "x-api-key": KEY!, "Content-Type": "application/json" });

export interface PBAccount { id: string; name: string; platform: string }

export async function getAccounts(): Promise<PBAccount[]> {
  if (!KEY) return [{ id: "mock_1", name: "Instagram (mock)", platform: "instagram" }];
  const res = await fetch(`${BASE}/v1/social-accounts`, { headers: HEADERS() });
  const data = await res.json();
  return data.data || data || [];
}

export async function uploadMedia(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
  sizeBytes: number
): Promise<string> {
  if (!KEY) return "mock_media_" + Date.now();
  const res = await fetch(`${BASE}/v1/media/create-upload-url`, {
    method: "POST",
    headers: HEADERS(),
    body: JSON.stringify({ mime_type: mimeType, size_bytes: sizeBytes, name: fileName }),
  });
  const { media_id, upload_url } = await res.json();
  await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: fileBuffer as unknown as BodyInit,
  });
  return media_id;
}

export async function publishPost(
  caption: string,
  accountIds: string[],
  mediaIds?: string[],
  scheduledAt?: string
): Promise<string> {
  if (!KEY) return "mock_post_" + Date.now();
  const body: Record<string, unknown> = {
    caption,
    social_accounts: accountIds.map(Number),
    ...(mediaIds?.length ? { media: mediaIds } : {}),
    ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
  };
  const res = await fetch(`${BASE}/v1/posts`, {
    method: "POST",
    headers: HEADERS(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.id || data.data?.id || "unknown";
}
