// Optional Vercel Serverless Function for verified threat-intelligence telemetry.
// Set THREATFOX_AUTH_KEY in Vercel Project Settings to enable live ThreatFox data.
// Without the key, the frontend stays in clearly labelled DEMO TELEMETRY mode.

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const key = process.env.THREATFOX_AUTH_KEY;
  if (!key) {
    res.status(200).json({
      live: false,
      source: "ThreatFox",
      message: "THREATFOX_AUTH_KEY belum dikonfigurasi; gunakan DEMO TELEMETRY.",
      data: []
    });
    return;
  }

  try {
    const response = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Auth-Key": key },
      body: JSON.stringify({ query: "get_iocs", days: 1 }),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) {
      res.status(502).json({ live: false, error: "Threat intelligence upstream unavailable." });
      return;
    }

    const payload = await response.json();
    if (payload.query_status !== "ok" || !Array.isArray(payload.data)) {
      res.status(502).json({ live: false, error: "Threat intelligence response invalid." });
      return;
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
    res.status(200).json({
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
    res.status(timedOut ? 504 : 500).json({ live: false, error: timedOut ? "Threat intelligence upstream timed out." : "Threat telemetry request failed." });
  }
}
