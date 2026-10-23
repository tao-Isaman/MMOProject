// The kind of place each map is (terrain buffs, progression.ts SkillDef.terrain and
// TreeNode.terrain): a historian's archaeology, or any skill whose numbers change with the
// ground under the player's feet. Every map has one kind: the towns are towns, the fields go by
// what they look like (their names and builders in src/maps.ts and src/world3d/field_*.ts); a
// map not in the table (one added later) is guessed from its id, grassland when nothing fits.
//
// No runtime imports here: progression.ts (and tools/tree_check.cjs through it) reads the kinds.

export const TERRAIN_KINDS = ["town", "grassland", "forest", "snow", "desert", "jungle", "coast", "volcano", "ruins", "mountain"] as const;
export type TerrainKind = (typeof TERRAIN_KINDS)[number];

export const TERRAIN_NAMES: Record<TerrainKind, string> = {
  town: "ในเมือง", grassland: "ทุ่งหญ้า", forest: "ป่า", snow: "หิมะ", desert: "ทะเลทราย", jungle: "ป่าดิบ",
  coast: "ชายฝั่งและทะเล", volcano: "ภูเขาไฟ", ruins: "ซากโบราณ", mountain: "ภูเขา",
};

// Every map of the world as it stands (src/maps.ts: TOWNS, FIELDS, the first field).
const TERRAIN: Record<string, TerrainKind> = {
  // the towns
  eden: "town", iceberg: "town", trunrada: "town", kradia: "town", bahamas: "town", yodia: "town", osaki: "town",
  noa: "town", suzhou: "town", highland: "town", venezia: "town",
  // round Eden and north to the snow
  field: "grassland", west_woods: "forest", royal_road: "grassland",
  snow_foothills: "snow", ice_pass: "snow", north_icefield: "snow",
  // east: the river, the steppe, the stones and the border
  pine_river: "forest", west_steppe: "grassland", horse_meadow: "grassland", stone_plain: "ruins",
  border_woods: "forest", border_line: "ruins", demon_land: "volcano",
  // south: the savanna, the desert, the jungle, the coast and the islands
  south_savanna: "grassland", desert_edge: "desert", great_desert: "desert", south_jungle: "jungle",
  mangrove_coast: "coast", sakura_hills: "forest", volcano: "volcano",
  // the west lands
  noa_meadow: "grassland", noa_plains: "grassland", dry_plains: "desert", elder_forest: "forest",
  rice_terraces: "grassland", highland_downs: "mountain", karst_peaks: "mountain", ancient_plain: "ruins",
  frozen_river: "snow", west_pass: "mountain", tangled_hills: "mountain", lagoon_marsh: "coast",
  royal_necropolis: "ruins", north_cliffs: "coast", west_cape: "coast",
};

// A map not in the table: by the words in its id.
const GUESS: [RegExp, TerrainKind][] = [
  [/snow|ice|frozen|glacier|frost/, "snow"],
  [/desert|dune|dry|sand|oasis/, "desert"],
  [/jungle|swamp/, "jungle"],
  [/coast|cape|lagoon|beach|sea|harbo|bay|reef|marsh/, "coast"],
  [/volcan|lava|ash|demon/, "volcano"],
  [/ruin|necropolis|ancient|tomb|temple/, "ruins"],
  [/peak|pass|cliff|mount|highland|hill|canyon/, "mountain"],
  [/wood|forest|grove|bamboo/, "forest"],
];

export function terrainOf(map: string): TerrainKind {
  return TERRAIN[map] ?? GUESS.find(([re]) => re.test(map))?.[1] ?? "grassland";
}
