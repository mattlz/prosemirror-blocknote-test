#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function parseDotEnv(content) {
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function upsertEnvFile(filePath, updates) {
  const exists = existsSync(filePath);
  const original = exists ? readFileSync(filePath, "utf8") : "";
  const lines = original.split(/\r?\n/);
  const keys = new Set(Object.keys(updates));

  const newLines = lines.map((line) => {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) return line;
    const [k] = line.split("=", 1);
    if (keys.has(k)) {
      const v = updates[k];
      keys.delete(k);
      return `${k}=${v.includes(" ") || v.includes("\n") ? '"' + v.replaceAll("\n", " ") + '"' : v}`;
    }
    return line;
  });

  for (const k of keys) {
    const v = updates[k];
    newLines.push(`${k}=${v.includes(" ") || v.includes("\n") ? '"' + v.replaceAll("\n", " ") + '"' : v}`);
  }

  const banner = "# Updated by scripts/setupAuth.mjs";
  const out = [banner, ...newLines.filter(Boolean)].join("\n") + "\n";
  writeFileSync(filePath, out, "utf8");
}

async function main() {
  const mode = process.argv[2] || "dev"; // dev | local

  const envFile = mode === "dev" ? path.join(repoRoot, ".env.dev") : path.join(repoRoot, ".env.local");
  if (!existsSync(envFile)) {
    console.error(`Missing ${envFile}.`);
    process.exit(1);
  }

  const env = parseDotEnv(readFileSync(envFile, "utf8"));
  const deployment = env.CONVEX_DEPLOYMENT;
  if (!deployment) {
    console.error(`CONVEX_DEPLOYMENT not found in ${envFile}`);
    process.exit(1);
  }

  // Generate new key pair
  const keys = await generateKeyPair("RS256", { extractable: true });
  const privateKey = (await exportPKCS8(keys.privateKey)).trimEnd();
  const publicKey = await exportJWK(keys.publicKey);
  const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

  // 1) Set JWKS in Convex env for the chosen deployment (verification on the backend)
  {
    const res = spawnSync(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["--yes", "convex", "env", "set", "JWKS", jwks],
      { stdio: "inherit", env: { ...process.env, CONVEX_DEPLOYMENT: deployment } }
    );
    if (res.status !== 0) {
      console.error("Warning: Failed setting JWKS in Convex env. You may need to run `npx convex dev` to select/login to the project, then re-run this script.");
    }
  }

  // 2) Put JWT_PRIVATE_KEY into Next.js local env (signing on the frontend server)
  {
    const nextEnvPath = path.join(repoRoot, ".env.local");
    const updates = { JWT_PRIVATE_KEY: privateKey };

    // If connecting to dev, also point Next at dev Convex URL
    if (mode === "dev" && env.NEXT_PUBLIC_CONVEX_URL) {
      updates.NEXT_PUBLIC_CONVEX_URL = env.NEXT_PUBLIC_CONVEX_URL;
    }
    upsertEnvFile(nextEnvPath, updates);
  }

  // 3) Optionally set CONVEX_SITE_URL if provided (used by some providers)
  if (env.CONVEX_SITE_URL) {
    const res2 = spawnSync(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["--yes", "convex", "env", "set", "CONVEX_SITE_URL", env.CONVEX_SITE_URL],
      { stdio: "inherit", env: { ...process.env, CONVEX_DEPLOYMENT: deployment } }
    );
    if (res2.status !== 0) {
      console.error("Warning: Failed setting CONVEX_SITE_URL in Convex env (continuing). ");
    }
  }

  console.log("\n✅ Convex Auth keys configured:");
  console.log(`- Deployment: ${deployment}`);
  console.log("- Convex env: JWKS set");
  console.log("- .env.local: JWT_PRIVATE_KEY set");
  if (mode === "dev" && env.NEXT_PUBLIC_CONVEX_URL) console.log(`- Next points to: ${env.NEXT_PUBLIC_CONVEX_URL}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
