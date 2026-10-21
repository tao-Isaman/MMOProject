// Characters and where their saves live. Every character keeps its progress, bag, look and bot
// settings in localStorage under "mmoproject.c<id>.<what>"; the roster lists the characters
// for the title screen. Saves from before there were characters become character 1.

import type { ClassId } from "./progression";

const ROSTER_KEY = "mmoproject.roster.v1";
const LEGACY = ["character.v1", "inventory.v3", "inventory.v2", "inventory.v1", "look.v1", "bot.v1"];
export const MAX_CHARACTERS = 6;

export interface CharEntry {
  id: string;
  name: string;
  cls: ClassId;
  level: number;
  created: number;
  played: number;
}

export interface Roster {
  chars: CharEntry[];
  last: string | null;
}

let current = "";

// Which character the game is playing; every saveKey() after this is that character's.
export function useCharacter(id: string): void {
  current = id;
}

export function currentCharacter(): string {
  return current;
}

export function saveKey(what: string, id = current): string {
  return `mmoproject.c${id}.${what}`;
}

export function readJson<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") as T | null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode or blocked storage: nothing persists
  }
}

export function loadRoster(): Roster {
  const r = readJson<Roster>(ROSTER_KEY);
  if (r && Array.isArray(r.chars)) return r;
  // first run with characters: an existing save becomes character 1
  const old = readJson<{ cls?: ClassId; level?: number }>("mmoproject.character.v1");
  const roster: Roster = { chars: [], last: null };
  if (old?.cls) {
    for (const what of LEGACY) {
      const v = localStorage.getItem(`mmoproject.${what}`);
      if (v !== null) {
        try {
          localStorage.setItem(saveKey(what, "1"), v);
          localStorage.removeItem(`mmoproject.${what}`);
        } catch {
          // leave it where it was
        }
      }
    }
    roster.chars.push({ id: "1", name: "ตัวละคร 1", cls: old.cls, level: old.level ?? 1, created: Date.now(), played: Date.now() });
    roster.last = "1";
  }
  saveRoster(roster);
  return roster;
}

export function saveRoster(r: Roster): void {
  write(ROSTER_KEY, r);
}

export function newCharacterId(r: Roster): string {
  let n = 1;
  while (r.chars.some((c) => c.id === String(n))) n++;
  return String(n);
}

export function deleteCharacter(r: Roster, id: string): void {
  r.chars = r.chars.filter((c) => c.id !== id);
  if (r.last === id) r.last = r.chars[0]?.id ?? null;
  // every save of that character (a new one may get the same id)
  try {
    const prefix = saveKey("", id);
    for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) localStorage.removeItem(key);
  } catch {
    // nothing to remove
  }
  saveRoster(r);
}

// Keep the roster's line for the playing character in step with the game.
export function touchCharacter(patch: Partial<CharEntry>): void {
  const r = loadRoster();
  const c = r.chars.find((e) => e.id === current);
  if (!c) return;
  Object.assign(c, patch, { played: Date.now() });
  r.last = current;
  saveRoster(r);
}
