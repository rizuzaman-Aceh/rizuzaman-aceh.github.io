// Local dev server for the static portfolio + Vercel-style /api functions.
// Zero dependencies (Node core only). Vercel production ignores this and uses
// its own static hosting + serverless functions for the files in /api.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PORT = process.env.PORT || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

// Adapt a Vercel-style (req, res) handler to Node's http res object.
function decorateRes(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    if (!res.getHeader("Content-Type")) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    res.end(JSON.stringify(obj));
    return res;
  };
  return res;
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

async function serveStatic(res, filePath) {
  const body = await readFile(filePath);
  res.statusCode = 200;
  res.setHeader("Content-Type", MIME[extname(filePath)] || "application/octet-stream");
  res.end(body);
}

async function tryFile(p) {
  try {
    const s = await stat(p);
    return s.isFile() ? p : null;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);

    // API routes -> Vercel-style function handlers in /api
    if (pathname.startsWith("/api/")) {
      const name = pathname.replace(/^\/api\//, "").replace(/\/$/, "");
      const handlerPath = join(ROOT, "api", `${name}.js`);
      const exists = await tryFile(handlerPath);
      if (!exists) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Not found" }));
        return;
      }
      const mod = await import(`${handlerPath}?t=${Date.now()}`);
      req.body = await readBody(req);
      decorateRes(res);
      await mod.default(req, res);
      return;
    }

    // Normalize path and prevent traversal
    let rel = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
    if (rel === "/" || rel === "") rel = "/index.html";

    let filePath = join(ROOT, rel);

    // Direct file hit
    let found = await tryFile(filePath);

    // cleanUrls: /about -> /about.html
    if (!found && !extname(rel)) {
      found = await tryFile(`${filePath}.html`);
    }
    // Directory index
    if (!found) {
      found = await tryFile(join(filePath, "index.html"));
    }

    if (found) {
      await serveStatic(res, found);
      return;
    }

    // SPA-ish fallback to index.html for unknown routes
    const fallback = await tryFile(join(ROOT, "index.html"));
    if (fallback) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(await readFile(fallback));
      return;
    }

    res.statusCode = 404;
    res.end("Not found");
  } catch (err) {
    console.error("[v0] server error:", err);
    res.statusCode = 500;
    res.end("Internal server error");
  }
});

server.listen(PORT, () => {
  console.log(`[v0] Portfolio dev server running on http://localhost:${PORT}`);
});
