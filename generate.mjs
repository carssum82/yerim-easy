#!/usr/bin/env node
// GPT Image API CLI: 프롬프트로 이미지를 생성해 파일로 저장합니다.
// 사용법: node generate.mjs "프롬프트" [--size 1024x1024] [--quality high] [--n 1] [--out images] [--model gpt-image-2]
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

// .env 파일이 있으면 읽어서 환경변수에 반영 (이미 설정된 값은 유지)
try {
  for (const line of (await readFile(new URL(".env", import.meta.url), "utf8")).split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    model: { type: "string", default: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2" },
    size: { type: "string", default: "1024x1024" },
    quality: { type: "string", default: "auto" },
    n: { type: "string", default: "1" },
    out: { type: "string", default: "images" },
  },
});

const prompt = positionals.join(" ").trim();
const apiKey = process.env.OPENAI_API_KEY;
if (!prompt) {
  console.error('사용법: node generate.mjs "프롬프트" [--size 1024x1024] [--quality low|medium|high|auto] [--n 1] [--out images]');
  process.exit(1);
}
if (!apiKey) {
  console.error("OPENAI_API_KEY 가 없습니다. .env 파일 또는 환경변수로 설정하세요.");
  process.exit(1);
}

const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const res = await fetch(`${base}/images/generations`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify({
    model: values.model,
    prompt,
    size: values.size,
    quality: values.quality,
    n: Number(values.n),
  }),
});

const data = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`API 오류 (${res.status}): ${data?.error?.message ?? JSON.stringify(data)}`);
  process.exit(1);
}

await mkdir(values.out, { recursive: true });
const stamp = Date.now();
for (const [i, img] of data.data.entries()) {
  const file = join(values.out, `image-${stamp}-${i + 1}.png`);
  if (img.b64_json) await writeFile(file, Buffer.from(img.b64_json, "base64"));
  else if (img.url) await writeFile(file, Buffer.from(await (await fetch(img.url)).arrayBuffer()));
  else continue;
  console.log(`저장됨: ${file}`);
}
