const SUPABASE_URL = "https://jjjlvsmwlffddnalighh.supabase.co";
const SUPABASE_KEY = "sb_publishable_QH0rxV2hO_O-sSd2T_CAcw_npxIhqtK";

export default async function handler(request, context) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json", "allow": "POST" }
    });
  }

  try {
    const body = await request.json();
    const visitorId = String(body.visitorId || "").slice(0, 120);
    if (visitorId.length < 8) throw new Error("Invalid visitor identifier");

    const geo = context.geo || {};
    const countryCode = geo.country?.code || "XX";
    const countryName = geo.country?.name || "Unknown";
    const city = geo.city || null;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/track_site_visit`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "authorization": `Bearer ${SUPABASE_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        p_visitor_id: visitorId,
        p_country_code: countryCode,
        p_country_name: countryName,
        p_city: city
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || "Counter database is not configured");
    }

    return new Response(JSON.stringify({
      ok: true,
      country_code: countryCode,
      country_name: countryName
    }), {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json", "cache-control": "no-store" }
    });
  }
}

export const config = { path: "/api/track-visit" };
