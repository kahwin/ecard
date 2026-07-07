const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const UCAPAN_PATH = path.join(ROOT, "ucapan.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg"
};

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  });
  res.end(body);
}

function readUcapan() {
  try {
    const raw = fs.readFileSync(UCAPAN_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const wishes = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.wishes)
        ? parsed.wishes
        : [];

    return wishes
      .map((entry) => ({
        name: String(entry && entry.name ? entry.name : "").trim(),
        message: String(entry && entry.message ? entry.message : "").trim()
      }))
      .filter((entry) => entry.name && entry.message);
  } catch {
    return [];
  }
}

function writeUcapan(wishes) {
  const payload = { wishes };
  fs.writeFileSync(UCAPAN_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function handleApi(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
    });
    res.end();
    return;
  }

  if (req.method === "GET") {
    sendJson(res, 200, { wishes: readUcapan() });
    return;
  }

  if (req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        const parsed = JSON.parse(body || "{}");
        const name = String(parsed.name || "").trim();
        const message = String(parsed.message || "").trim();

        if (!name || !message) {
          sendJson(res, 400, { error: "name_and_message_required" });
          return;
        }

        const wishes = readUcapan();
        wishes.unshift({
          name: name.slice(0, 60),
          message: message.slice(0, 500)
        });

        writeUcapan(wishes);
        sendJson(res, 200, { wishes });
      } catch {
        sendJson(res, 400, { error: "invalid_json" });
      }
    });

    return;
  }

  sendJson(res, 405, { error: "method_not_allowed" });
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const relPath = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(ROOT, relPath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if ((req.url || "").startsWith("/api/ucapan")) {
    handleApi(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});
