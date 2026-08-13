import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";

const dataFile = path.resolve(__dirname, "data/wedding.json");

function attachWeddingDataApi(server: ViteDevServer) {
  server.middlewares.use("/api/wedding-data", (req, res) => {
    if (req.method === "GET") {
      if (!fs.existsSync(dataFile)) {
        res.statusCode = 404;
        res.end();
        return;
      }
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(fs.readFileSync(dataFile, "utf8"));
      return;
    }

    if (req.method === "PUT") {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      req.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        let text = raw;
        try {
          const parsed = JSON.parse(raw) as { settings?: { githubToken?: string } };
          if (parsed.settings) parsed.settings.githubToken = "";
          text = JSON.stringify(parsed, null, 2);
        } catch {
          /* keep raw body */
        }
        fs.mkdirSync(path.dirname(dataFile), { recursive: true });
        fs.writeFileSync(dataFile, text.endsWith("\n") ? text : `${text}\n`);
        res.statusCode = 204;
        res.end();
      });
      return;
    }

    res.statusCode = 405;
    res.end();
  });
}

function weddingDataPlugin(): Plugin {
  return {
    name: "wedding-data-file",
    configureServer: attachWeddingDataApi,
    configurePreviewServer: attachWeddingDataApi,
  };
}

export default defineConfig({
  plugins: [react(), weddingDataPlugin()],
  base: process.env.GITHUB_PAGES === "true" ? "/WeddingPrep/" : "/",
});
