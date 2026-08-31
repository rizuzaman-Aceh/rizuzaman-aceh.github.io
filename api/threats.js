// Optional Vercel Serverless Function for verified threat-intelligence telemetry.
// Set THREATFOX_AUTH_KEY in Vercel Project Settings to enable live ThreatFox data.
// Without the key, the frontend stays in clearly labelled DEMO TELEMETRY mode.

const json = (status, body) => ({
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  body: JSON.stringify(body)
});

export default async function handler(req) {
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const key = process.env.THREATFOX_AUTH_KEY;
  if (!key) {
    return json(200, {
      live: false,
      source: "ThreatFox",
      message: "THREATFOX_AUTH_KEY belum dikonfigurasi; gunakan DEMO TELEMETRY.",
      data: []
    });
  }

  try {
    const response = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Auth-Key": key },
      body: JSON.stringify({ query: "get_iocs", days: 1 }),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return json(502, { live: false, error: "Threat intelligence upstream unavailable." });

    const payload = await response.json();
    if (payload.query_status !== "ok" || !Array.isArray(payload.data)) {
      return json(502, { live: false, error: "Threat intelligence response invalid." });
    }

    const items = payload.data.slice(0, 60).map(item => ({
      id: item.id,
      type: item.threat_type,
      iocType: item.ioc_type,
      malware: item.malware_printable || item.malware || "Unknown",
      confidence: item.confidence_level,
      firstSeen: item.first_seen,
      country: item.country || null
    }));
    const families = new Set(items.map(x => x.malware).filter(Boolean));
    return json(200, {
      live: true,
      source: "ThreatFox",
      fetchedAt: new Date().toISOString(),
      count: items.length,
      families: families.size,
      data: items
    });
  } catch (error) {
    console.error("ThreatFox proxy error:", error);
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    return json(timedOut ? 504 : 500, { live: false, error: timedOut ? "Threat intelligence upstream timed out." : "Threat telemetry request failed." });
  }
}
