const SUPABASE_URL = "https://jjjlvsmwlffddnalighh.supabase.co";
const SUPABASE_KEY = "sb_publishable_QH0rxV2hO_O-sSd2T_CAcw_npxIhqtK";

export default async function handler() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_site_stats`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "authorization": `Bearer ${SUPABASE_KEY}`,
        "content-type": "application/json"
      },
      body: "{}"
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || "Counter database is not configured");
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json", "cache-control": "no-store" }
    });
  }
}

export const config = { path: "/api/public-stats" };
