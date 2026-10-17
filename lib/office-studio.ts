import "server-only";

import { createHash } from "node:crypto";
import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { roleForSeat, type AgentRoleKey } from "@/lib/agent-roles";

/**
 * Loads AgentWorld scene bundles from /office-studio/<office>.json.
 *
 * Bundles embed every image as a base64 data URI (~10 MB per file), so instead
 * of shipping them to the browser we parse each bundle once on the server,
 * store its images in memory by content hash (characters are shared between
 * offices, so they're deduplicated), and hand the client a slim scene whose
 * images are served as cacheable files from /api/office-studio/asset/<hash>.
 */

const STUDIO_DIR = path.join(process.cwd(), "office-studio");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const ASSET_ROUTE = "/api/office-studio/asset";
const PREFERRED_ANIMATION = "typing";

// ---- Bundle schema (schemaVersion 1.0) ----

type BundleCharacter = {
  id: string;
  name: string;
  width: number;
  height: number;
  sprite: string;
  thumbnail?: string;
  animations?: Record<string, string[]>;
};

type BundleSeat = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  zIndex: number;
  character?: BundleCharacter | null;
};

type SceneBundle = {
  schemaVersion: string;
  type: "agentworld-scene-bundle";
  office: { id: string; name: string; width: number; height: number; background: string };
  seats: BundleSeat[];
};

// ---- Slim scene sent to the client ----

export type OfficeCharacter = {
  id: string;
  name: string;
  /** Natural sprite size; used for the aspect ratio. */
  width: number;
  height: number;
  animation: string;
  /** Empty when the bundle references images that aren't available. */
  frames: string[];
  /** Set when this seat borrows another character's frames because its own are missing. */
  standInFor?: string;
};

export type OfficeSeat = {
  id: string;
  /** Position in the bundle's seat list (stable even when a seat is skipped). */
  index: number;
  /** Top-left corner and width of the character, in office pixels. */
  x: number;
  y: number;
  width: number;
  zIndex: number;
  character: OfficeCharacter;
};

export type OfficeScene = {
  key: string;
  width: number;
  height: number;
  background: string;
  seats: OfficeSeat[];
};

// ---- In-memory caches ----

type Asset = { mime: string; data: Buffer };

const assets = new Map<string, Asset>();
const scenes = new Map<string, { mtimeMs: number; scene: OfficeScene }>();
const warned = new Set<string>();

const EXTENSIONS: Record<string, string> = { "image/png": "png", "image/webp": "webp", "image/jpeg": "jpg", "image/gif": "gif" };

/** "/offices/day-office.jpeg" -> "day-office" (only safe file-name characters). */
export function officeKeyFromImage(officeImage: string) {
  const key = path.parse(officeImage).name;
  return /^[a-z0-9][a-z0-9_-]*$/i.test(key) ? key : null;
}

/** Load the scene for an office, or null when no bundle exists for it. */
export async function loadOfficeScene(key: string): Promise<OfficeScene | null> {
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(key)) return null;
  const file = path.join(STUDIO_DIR, `${key}.json`);

  let mtimeMs: number;
  try {
    mtimeMs = (await stat(file)).mtimeMs;
  } catch {
    return null;
  }

  const cached = scenes.get(key);
  if (cached && cached.mtimeMs === mtimeMs) return cached.scene;

  try {
    const bundle = JSON.parse(await readFile(file, "utf8")) as SceneBundle;
    if (bundle.type !== "agentworld-scene-bundle" || !bundle.office) throw new Error("Not an agentworld scene bundle");
    const scene = await toScene(key, bundle);
    scenes.set(key, { mtimeMs, scene });
    return scene;
  } catch (error) {
    console.error(`Failed to load office scene "${key}"`, error);
    return null;
  }
}

/** Each agent's avatar: the first frame of its office character (the first desk assigned to that role). */
export async function loadAgentAvatars(officeImage: string): Promise<Partial<Record<AgentRoleKey, string>>> {
  const key = officeKeyFromImage(officeImage);
  const scene = key ? await loadOfficeScene(key) : null;
  const avatars: Partial<Record<AgentRoleKey, string>> = {};
  for (const seat of scene?.seats ?? []) {
    avatars[roleForSeat(seat.index).key] ??= seat.character.frames[0];
  }
  return avatars;
}

/** Look up an extracted image. Loads all bundles if the server restarted since the URL was issued. */
export async function getOfficeAsset(id: string): Promise<Asset | null> {
  if (!assets.has(id)) {
    const files = await readdir(STUDIO_DIR).catch(() => [] as string[]);
    await Promise.all(files.filter((f) => f.endsWith(".json")).map((f) => loadOfficeScene(path.parse(f).name)));
  }
  return assets.get(id) ?? null;
}

async function toScene(key: string, bundle: SceneBundle): Promise<OfficeScene> {
  const background = await resolveImage(bundle.office.background, key);
  if (!background) throw new Error("Office background is missing");

  const seats: OfficeSeat[] = [];
  for (const [index, seat] of (bundle.seats ?? []).entries()) {
    const c = seat.character;
    if (!c) continue;

    const animations = c.animations ?? {};
    const animation = PREFERRED_ANIMATION in animations ? PREFERRED_ANIMATION : Object.keys(animations)[0];
    const sources = animation ? animations[animation] : [c.sprite];
    const frames = (await Promise.all(sources.map((src) => resolveImage(src, key)))).filter((f): f is string => Boolean(f));

    seats.push({
      id: seat.id,
      index,
      x: seat.x,
      y: seat.y,
      width: seat.width,
      zIndex: seat.zIndex,
      character: { id: c.id, name: c.name, width: c.width, height: c.height, animation: animation ?? "idle", frames },
    });
  }

  return { key, width: bundle.office.width, height: bundle.office.height, background, seats: fillMissingCharacters(seats, key) };
}

/**
 * A seat whose character images are missing (e.g. a built-in studio character the
 * bundle only links to) borrows frames from another character in the same office,
 * so no desk is left empty. Prefers an exact size match, then the closest aspect
 * ratio, then the farthest desk (so the repeat is least noticeable).
 * Real frames are used automatically once the referenced files exist.
 */
function fillMissingCharacters(seats: OfficeSeat[], sceneKey: string): OfficeSeat[] {
  const donors = seats.filter((s) => s.character.frames.length > 0);
  if (donors.length === 0) return seats;

  return seats.map((seat) => {
    if (seat.character.frames.length > 0) return seat;
    const want = seat.character;
    const ratio = want.width / want.height;

    const donor = [...donors].sort((a, b) => {
      const exactA = Number(a.character.width === want.width && a.character.height === want.height);
      const exactB = Number(b.character.width === want.width && b.character.height === want.height);
      if (exactA !== exactB) return exactB - exactA;
      const ratioDiff = Math.abs(a.character.width / a.character.height - ratio) - Math.abs(b.character.width / b.character.height - ratio);
      if (Math.abs(ratioDiff) > 0.01) return ratioDiff;
      return Math.hypot(b.x - seat.x, b.y - seat.y) - Math.hypot(a.x - seat.x, a.y - seat.y);
    })[0];

    const warning = `${sceneKey}:standin:${seat.id}`;
    if (!warned.has(warning)) {
      warned.add(warning);
      console.warn(`[office-studio] "${sceneKey}" seat ${seat.id}: using ${donor.character.id} as a stand-in for ${want.id} until its frames are added.`);
    }

    return {
      ...seat,
      character: {
        ...donor.character,
        // Keep the stand-in's own proportions so it isn't stretched.
        width: donor.character.width,
        height: donor.character.height,
        standInFor: want.id,
      },
    };
  });
}

/** Turn a data URI or a /public path into a URL the browser can load. */
async function resolveImage(src: string, sceneKey: string): Promise<string | null> {
  if (src.startsWith("data:")) {
    const match = /^data:([\w/+.-]+);base64,(.*)$/s.exec(src);
    if (!match) return null;
    const [, mime, base64] = match;
    const id = createHash("sha1").update(base64).digest("hex").slice(0, 20);
    if (!assets.has(id)) assets.set(id, { mime, data: Buffer.from(base64, "base64") });
    return `${ASSET_ROUTE}/${id}.${EXTENSIONS[mime] ?? "bin"}`;
  }

  // Relative paths in bundles refer to files under /public.
  if (src.startsWith("/") && !src.includes("..")) {
    try {
      await access(path.join(PUBLIC_DIR, src));
      return src;
    } catch {
      const warning = `${sceneKey}:${path.dirname(src)}`;
      if (!warned.has(warning)) {
        warned.add(warning);
        console.warn(`[office-studio] "${sceneKey}" references ${src}, which is missing from /public. That character is hidden until the file is added.`);
      }
    }
  }
  return null;
}
