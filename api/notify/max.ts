/**
 * Notifications to MAX messenger (botapi.max.ru).
 *
 * Configure via environment variables:
 *   MAX_BOT_TOKEN — token of your MAX bot
 *   MAX_CHAT_ID   — chat / dialog id that receives order notifications
 *
 * When not configured, notifications are logged to the server console.
 */

const MAX_API_BASE = "https://botapi.max.ru";

export async function notifyMax(text: string): Promise<void> {
  const token = process.env.MAX_BOT_TOKEN;
  const chatId = process.env.MAX_CHAT_ID;

  if (!token || !chatId) {
    console.log(`[MAX notify] (not configured) ${text}`);
    return;
  }

  try {
    const url = `${MAX_API_BASE}/messages?chat_id=${encodeURIComponent(chatId)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.error(`[MAX notify] failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error("[MAX notify] error:", err);
  }
}
