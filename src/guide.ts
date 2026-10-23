// The quest guide: where a quest's step leads (whom to talk to or hand in to, or the field its
// monsters live in, or the map to visit) and the way there from map to map, through the maps'
// ways out and, where only a ship goes, to the ship's captain (src/world_index.ts). Also the
// place someone stands at, for the quest texts ("บาฮามัส · โอเอซิส").

import { MAP_NAMES } from "./maps";
import { MONSTER_BY_ID } from "./bestiary";
import { MAP_LINKS, NPC_PLACES, SHIPS } from "./world_index";
import type { MapId } from "./maps";
import type { QuestDef, Quests, Who } from "./quests";

// Where a step leads: a map, and someone there to walk up to (or none: arriving is enough).
export interface Dest {
  map: MapId;
  npc?: string;
  name: string; // what the guide calls it ("ท่านนาดีม", "ทะเลทรายใหญ่")
}

const mapName = (id: string) => (MAP_NAMES as Record<string, string>)[id] ?? id;

// The town (or field) and the spot in it someone stands at.
export function placeOf(who: Who): string {
  const spot = NPC_PLACES[`${who.map}:${who.npc}`];
  return spot ? `${mapName(who.map)} · ${spot}` : mapName(who.map);
}

// The field a monster lives in (the slime colours live outside Eden).
export function monsterField(id: string): MapId {
  return MONSTER_BY_ID[id]?.field ?? "field";
}

// Where a quest's current step leads: to whoever takes it once its goal is met (or a talk step's
// someone), else to where the goal is done. Null when there is nowhere to go (a level to reach).
export function questDest(quests: Quests, q: QuestDef): Dest | null {
  const st = quests.step(q.id);
  if (!st) return null;
  const to: Dest = { map: st.to.map, npc: st.to.npc, name: st.to.name };
  if (quests.ready(q.id) || st.goal.kind === "talk") return to;
  const g = st.goal;
  if (g.kind === "kill") return { map: monsterField(g.what[0]), name: mapName(monsterField(g.what[0])) };
  if (g.kind === "collect" && g.from?.length) return { map: monsterField(g.from[0]), name: mapName(monsterField(g.from[0])) };
  if (g.kind === "visit") return { map: g.map, name: mapName(g.map) };
  if (g.kind === "collect") return to;
  return null;
}

// The first move on the shortest way from one map to another: walk out to the next map, or board
// the ship at this port (its captain's id). Null when there is no way.
export type Hop = { walk: MapId } | { ship: string };
export function nextHop(from: MapId, to: MapId): Hop | null {
  if (from === to) return null;
  const first = new Map<string, Hop>([[from, { walk: from }]]);
  const queue: string[] = [from];
  while (queue.length) {
    const at = queue.shift()!;
    const ship = SHIPS[at];
    const ways: [string, Hop][] = [
      ...(MAP_LINKS[at] ?? []).map((m): [string, Hop] => [m, { walk: m as MapId }]),
      ...(ship ? ship.ports.map((m): [string, Hop] => [m, { ship: ship.npc }]) : []),
    ];
    for (const [m, hop] of ways) {
      if (first.has(m)) continue;
      first.set(m, at === from ? hop : first.get(at)!);
      if (m === to) return first.get(m)!;
      queue.push(m);
    }
  }
  return null;
}
