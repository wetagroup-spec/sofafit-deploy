import { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { files, examplePhotos } from "@db/schema";
import { notifyMax } from "./notify/max";

// ── Minimal ZIP builder (store method) ─────────────────────────
function crc32(bytes: Uint8Array): number {
  const c = crc32 as { table?: Uint32Array };
  if (!c.table) {
    c.table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let x = i;
      for (let k = 0; k < 8; k++) x = x & 1 ? 0xedb88320 ^ (x >>> 1) : x >>> 1;
      c.table[i] = x >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = c.table[(crc ^ bytes[i]) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
const u16 = (n: number) => [n & 255, (n >> 8) & 255];
const u32 = (n: number) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
function buildZip(entries: { name: string; data: Uint8Array }[]): Uint8Array {
  const chunks: Uint8Array[] = [];
  const central: number[][] = [];
  let offset = 0;
  const pushArr = (arr: number[]) => { chunks.push(new Uint8Array(arr)); offset += arr.length; };
  const pushData = (d: Uint8Array) => { chunks.push(d); offset += d.length; };
  for (const e of entries) {
    const nameBytes = new TextEncoder().encode(e.name.replace(/[^\w.\-() ]+/g, "_") || "file");
    const crc = crc32(e.data);
    const localOffset = offset;
    pushArr([0x50, 0x4b, 0x03, 0x04, ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(crc), ...u32(e.data.length), ...u32(e.data.length), ...u16(nameBytes.length), ...u16(0)]);
    pushData(nameBytes);
    pushData(e.data);
    central.push([0x50, 0x4b, 0x01, 0x02, ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(crc), ...u32(e.data.length), ...u32(e.data.length), ...u16(nameBytes.length),
      ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(localOffset), ...nameBytes]);
  }
  const centralStart = offset;
  for (const cb of central) pushArr(cb);
  const centralSize = offset - centralStart;
  pushArr([0x50, 0x4b, 0x05, 0x06, ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length),
    ...u32(centralSize), ...u32(centralStart), ...u16(0)]);
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) { out.set(c, pos); pos += c.length; }
  return out;
}

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

function safeName(name: string): string {
  const base = name.replace(/[^\w.\-() ]+/g, "_").slice(-120);
  return base || "file";
}

async function store(buf: Buffer, originalName: string): Promise<string> {
  await mkdir(UPLOADS_DIR, { recursive: true });
  const rel = path.join("uploads", `${Date.now()}-${randomBytes(5).toString("hex")}-${safeName(originalName)}`);
  await writeFile(path.join(process.cwd(), rel), buf);
  return rel;
}

async function servePath(storagePath: string, fileName: string, mimeType: string, download: boolean) {
  const abs = path.join(process.cwd(), storagePath);
  if (!abs.startsWith(UPLOADS_DIR)) {
    return new Response("Forbidden", { status: 403 });
  }
  const data = await readFile(abs);
  const headers: Record<string, string> = {
    "Content-Type": mimeType,
    "Content-Length": String(data.length),
    "Cache-Control": "private, max-age=3600",
  };
  headers["Content-Disposition"] =
    `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(fileName)}`;
  return new Response(new Uint8Array(data), { headers });
}

export const uploadsApp = new Hono<{ Bindings: HttpBindings }>();

// Upload one or more files attached to an order (and optionally a message)
uploadsApp.post("/orders/:orderId/files", async (c) => {
  const orderId = Number(c.req.param("orderId"));
  if (!Number.isFinite(orderId)) return c.json({ error: "Bad order id" }, 400);
  const kind = (c.req.query("kind") || "input") as "input" | "result" | "attachment";
  const messageIdRaw = c.req.query("messageId");
  const messageId = messageIdRaw ? Number(messageIdRaw) : null;

  const body = await c.req.parseBody({ all: true });
  const raw = body["files"];
  const list = (Array.isArray(raw) ? raw : raw ? [raw] : []).filter(
    (f): f is File => f instanceof File,
  );
  if (list.length === 0) return c.json({ error: "No files" }, 400);

  const db = getDb();
  const created = [];
  for (const f of list) {
    const buf = Buffer.from(await f.arrayBuffer());
    const rel = await store(buf, f.name);
    const result = await db.insert(files).values({
      orderId,
      messageId,
      kind,
      fileName: f.name,
      mimeType: f.type || "application/octet-stream",
      size: buf.length,
      storagePath: rel,
    });
    const id = Number(result[0].insertId);
    const [row] = await db.select().from(files).where(eq(files.id, id));
    created.push(row);
  }

  void notifyMax(
    `📎 Order #${orderId}: ${created.length} file(s) uploaded (${kind}): ${created
      .map((f) => f.fileName)
      .join(", ")}`,
  );

  return c.json({ files: created });
});

// Serve order file inline (previews)
uploadsApp.get("/files/:id", async (c) => {
  const db = getDb();
  const [row] = await db.select().from(files).where(eq(files.id, Number(c.req.param("id"))));
  if (!row) return c.json({ error: "Not found" }, 404);
  return servePath(row.storagePath, row.fileName, row.mimeType, false);
});

// Download order file
uploadsApp.get("/files/:id/download", async (c) => {
  const db = getDb();
  const [row] = await db.select().from(files).where(eq(files.id, Number(c.req.param("id"))));
  if (!row) return c.json({ error: "Not found" }, 404);
  return servePath(row.storagePath, row.fileName, row.mimeType, true);
});

// Download several files as one ZIP — /api/files/zip?ids=1,2,3
uploadsApp.get("/files-zip", async (c) => {
  const ids = (c.req.query("ids") || "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  if (!ids.length) return c.json({ error: "No ids" }, 400);
  const db = getDb();
  const rows = await db.select().from(files).where(inArray(files.id, ids));
  const entries: { name: string; data: Uint8Array }[] = [];
  for (const r of rows) {
    const abs = path.join(process.cwd(), r.storagePath);
    if (!abs.startsWith(UPLOADS_DIR)) continue;
    try {
      const buf = await readFile(abs);
      entries.push({ name: r.fileName || `file-${r.id}`, data: new Uint8Array(buf) });
    } catch { /* skip missing */ }
  }
  if (!entries.length) return c.json({ error: "No files found" }, 404);
  const zip = buildZip(entries);
  return new Response(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(zip.length),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("sofafit-photos.zip")}`,
    },
  });
});

// Upload photos for a portfolio example
uploadsApp.post("/examples/:exampleId/photos", async (c) => {
  const exampleId = Number(c.req.param("exampleId"));
  if (!Number.isFinite(exampleId)) return c.json({ error: "Bad example id" }, 400);

  const body = await c.req.parseBody({ all: true });
  const raw = body["files"];
  const list = (Array.isArray(raw) ? raw : raw ? [raw] : []).filter(
    (f): f is File => f instanceof File,
  );
  if (list.length === 0) return c.json({ error: "No files" }, 400);

  const db = getDb();
  const created = [];
  for (const f of list) {
    const buf = Buffer.from(await f.arrayBuffer());
    const rel = await store(buf, f.name);
    const result = await db.insert(examplePhotos).values({
      exampleId,
      storagePath: rel,
      mimeType: f.type || "image/jpeg",
    });
    const id = Number(result[0].insertId);
    const [row] = await db.select().from(examplePhotos).where(eq(examplePhotos.id, id));
    created.push(row);
  }
  return c.json({ photos: created });
});

// Serve example photo
uploadsApp.get("/example-photos/:id", async (c) => {
  const db = getDb();
  const [row] = await db
    .select()
    .from(examplePhotos)
    .where(eq(examplePhotos.id, Number(c.req.param("id"))));
  if (!row) return c.json({ error: "Not found" }, 404);
  return servePath(row.storagePath, `photo-${row.id}.jpg`, row.mimeType, false);
});
