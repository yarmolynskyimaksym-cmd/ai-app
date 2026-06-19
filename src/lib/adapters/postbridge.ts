const BASE = "https://app.post-bridge.com/api";
const KEY = process.env.POSTBRIDGE_API_KEY || process.env.POST_BRIDGE_API_KEY;

export interface PBAccount { id: string; name: string; platform: string }

export async function getAccounts(): Promise<PBAccount[]> {
  if (!KEY) return [{ id: "mock_1", name: "Instagram (mock)", platform: "instagram" }];
  const res = await fetch(`${BASE}/accounts`, { headers: { "x-api-key": KEY } });
  const data = await res.json();
  return data.data || data || [];
}

export async function publishPost(content: string, accountIds: string[], scheduledAt?: string): Promise<string> {
  if (!KEY) return "mock_post_" + Date.now();
  const res = await fetch(`${BASE}/posts`, {
    method: "POST",
    headers: { "x-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ content, account_ids: accountIds, scheduled_at: scheduledAt }),
  });
  const data = await res.json();
  return data.id || data.data?.id || "unknown";
}
