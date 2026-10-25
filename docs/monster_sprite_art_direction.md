# Monster Sprite Art Direction

## Scope and visual target

This brief covers the **95 bestiary IDs without an indexed dedicated PNG**: 86 creature monsters and all 9 IDs listed in `PEOPLE` in `src/bestiary.ts`. The inventory is the set difference between the bestiary's `MONSTERS` IDs and `public/assets/monsters/index.json` keys. Generate one distinct monster atlas per ID; humanoids in this brief also get dedicated atlases rather than relying on wardrobe composition.

Keep the existing outlined, illustrated game-sprite look: compact, expressive fantasy forms; a confident dark outer contour; clean interior linework; layered, readable color shapes; and selective bright accents for elemental effects. Use appealing, lively silhouettes with clear faces and readable anatomy at native cell size. Avoid photorealism, soft airbrush rendering, busy scenery, ground planes, text, UI, borders, and effects that obscure the character. Keep the design identifiable in every direction and animation pose.

## Atlas specification

- Transparent PNG, 9 columns × 4 rows; each cell is square and **96×96 or 128×128 px**. The complete atlas is 864×384 or 1152×512 px.
- Rows face **south, west, north, east**, in that order.
- Columns are **idle**, then **4 walk frames**, then **4 attack frames**, in that order.
- Keep each monster's foot point and scale consistent across all 36 cells; center the silhouette and leave enough transparent padding for attacks, wings, horns, tails, weapons, and effects.
- Animate walk with a clear, repeatable gait or float cycle. Make attack readable from the row's facing direction and consistent with the creature's behavior (bite, swipe, charge, slam, cast, shot, or other listed attack cue).
- Preserve distinguishing markings, palette, equipment, and elemental motifs in all four facings. No opaque backdrop or contact shadow.
- For CLI generation at 1536×1024, center a 1152×512 atlas with 128×128 cells; `tools/import_monster_atlas.py` crops the padded canvas and registers the sheet metadata.

## Generation batches

The batches group related biomes and palettes for coherent production. IDs remain exact bestiary keys and output filenames should be `<id>.png`.

### Batch 1 — Noa's meadows, farms, groves, and raiders (17)

- `highway_bandit` — Plum-clad road ambusher with a dark face scarf, sharp crimson eyes, and short dagger; lean, quick silhouette.
- `cloud_sheep` — Round, wind-tossed white sheep with a puff-cloud fleece, tiny curled horns, and buoyant flock energy.
- `furrow_mole` — Low, stout earth-brown mole with shovel claws, a pale muzzle, and a soil ridge along its back.
- `sheepskin_wolf` — Long-legged steppe wolf in shaggy cream sheepskin markings, with a russet muzzle and spring-loaded dodge pose.
- `vine_snail` — Plump green garden snail with a leaf-patterned spiral shell and two curling feelers; slow, sturdy expression.
- `tipsy_wasp` — Bright yellow-and-black hovering wasp with oversized glassy wings and a playful, slightly crooked flight pose.
- `dust_devil` — Small coiling wind-and-smoke vortex with a mischievous face and a few dry grass flecks caught in its spiral.
- `mesa_armadillo` — Compact stone-armored armadillo with layered ochre plates and a curled, mirror-bright shell rim.
- `caravan_raider` — Ochre-and-sand desert bandit with crimson hair, amber eyes, and a curved sword; scarf tails suggest a charging lunge.
- `shrine_mask` — Floating carved forest shrine mask, pale wood and leaf-gold, with luminous eyes and a nimble sideways drift.
- `moss_dryad` — Slender bark-bodied dryad with mossy hair, vine tendrils, and soft green seed-light gathered at her hands.
- `forest_turtle` — Broad, ancient woodland turtle with a moss-and-root shell, kind eyes, and heavy limbs ready to slam.
- `paddy_waterbug` — Flat, quick rice-paddy water beetle with a glossy teal shell, reed-like legs, and tiny rippling water accents.
- `thunder_eel` — Long rice-field eel with a sleek blue body, luminous yellow lightning fins, and sparks coiling around its whiskers.
- `nomad_raider` — Weathered steppe archer in cocoa leathers and an ochre fur-trimmed cap, auburn hair, and a distinctive recurved bow.
- `cursed_deserter` — Ash-pale undead soldier in battered navy armor, torn dark cloth, ember-red eyes, and a notched sword.
- `bamboo_ninja` — Nimble teal-clad forest shinobi with ink-dark twin tails, a compact face wrap, and paired throwing blades.

### Batch 2 — High passes, old plains, and ancient stone (16)

- `ice_bat` — Small translucent glacier bat with faceted pale-blue wings, frost-edged ears, and a crisp hanging-to-flight silhouette.
- `woolly_mammoth` — Massive shaggy highland mammoth with icy cream curls, broad curved tusks, and a weighty charging gait.
- `cairn_walker` — Lopsided cairn golem assembled from stacked slate, with pebble limbs and glowing seams that catch the light.
- `mist_crane` — Elegant white mountain crane with long dark legs, wind-swept crest feathers, and mist ribbons trailing its wings.
- `money_toad` — Round turquoise cliff toad with a coin-like golden back marking and a sly water-spitting grin.
- `cloud_qilin` — Graceful pale qilin with curled cloud mane, branching horn, and bright lightning accents along its hooves.
- `phantom_hoplite` — Ancient translucent bronze-and-violet soldier spirit with a crested helm, round shield, and short spear.
- `statue_hand` — Huge weathered stone hand crawling on articulated fingers, with moss in the cracks and a petrifying gaze in its palm.
- `ghost_charioteer` — Windblown skeletal driver in faded ceremonial armor, spectral reins streaming behind a hovering wheel motif.
- `ice_pike` — Sleek blue river pike with a sharp ice-spine crest, glassy scales, and a forceful forward-thrusting body.
- `bridge_troll` — Stocky river bridge troll with slab-like shoulders, mossy hide, and a healing green glow under the skin.
- `rope_spider` — Pale cliff spider with long rope-like legs, a banded abdomen, and a few taut web strands framing its bite.
- `pass_gargoyle` — Compact granite gargoyle with folded stone wings, horned brow, and bright mineral eyes.
- `toll_keeper` — Silver-haired woodland guard in deep forest-green armor, carrying a broad two-handed blade and a sturdy stance.
- `lost_wisp` — Lonely indigo marshland wisp with a masked face, ragged dark flame-tail, and a curled curse spark.
- `maze_minotaur` — Powerful metal-horned maze brute with a broad chest, dark bronze hide, and a heavy, low charging pose.

### Batch 3 — Marsh, royal dead, and storm coast (12)

- `bog_hulk` — Huge mud-caked marsh brute with reed tufts, a sagging belly, and thick arms poised for a ground slam.
- `marsh_hydra` — Poison-green swamp hydra with several distinct snapping heads, yellow eyes, and a few venom droplets.
- `bog_witch` — Slender forest-green spellcaster with mint twin tails, violet eyes, staff, and curling poisonous bog wisps.
- `bone_royal_guard` — Tall skeleton sentinel in tarnished gold-and-iron royal armor, with a squared shield and disciplined stance.
- `corpse_bloom` — Carnivorous grave flower with a pallid petal-maw, thorny stem, and toxic purple spores gathered at its center.
- `first_king` — Imposing undead monarch with a cracked dark-gold crown, ancient burial robes, and a curse-lit scepter.
- `frost_harpy` — Sharp-featured cliff harpy with pale blue-gray feathers, hooked talons, and a wind-whipped crest.
- `rime_wyvern` — Lean ice wyvern with a ridged frost-blue back, narrow wings, and a long tail ending in a frozen barb.
- `lighthouse_fiend` — Fiery coastal demon with a lighthouse-lens eye, ember horns, and a bright, compact flame mantle.
- `sea_cultist` — Coastal ritualist in a black robe, blue hair, teal eyes, and shell-like details, lifting a staff for a water spell.
- `storm_griffin` — Strong cliff griffin with a tawny body, dark hooked beak, lightning-blue feather tips, and wide charging wings.
- `sea_dragon` — Regal deep-water dragon with finned horns, layered turquoise scales, and a broad wave-shaped tail.

### Batch 4 — Flower country, waterways, and the old mine (17)

- `royal_bee` — Bright golden queen bee with a tiny crown-like stripe, translucent wings, and a confident hovering pose.
- `sunflower_sentinel` — Sturdy sunflower guardian with a warm petal halo, leaf arms, and seed projectiles poised at its face.
- `fighting_rooster` — Fiery red farm rooster with an arched comb, strong spurs, and an energetic forward charge.
- `silver_stag` — Elegant silver-antlered deer with cool blue highlights and a startled, mid-flee step.
- `skull_crab` — Salt-dune crab with a pale skull-shaped carapace, dark eye sockets, and reflective shell edges.
- `lavender_moth` — Soft violet moth with broad patterned wings, feathery antennae, and a cloud of lavender dust.
- `sea_krait` — Coiled black-and-cream sea snake with clear warning bands, a narrow head, and a small burning toxin glow.
- `rafflesia` — Giant red-orange carrion flower with spotted fleshy petals and a ring of poisonous spores.
- `black_panther` — Sleek shadow-black jungle cat with violet edge highlights, bright eyes, and a low dodging pounce.
- `snow_otter` — Playful white river otter with a blue-gray mask, slick whiskers, and a curled swimming posture.
- `falls_nymph` — Delicate waterfall spirit with flowing ice-blue hair, translucent water-veiled robes, and frost motes.
- `armored_rhino` — Heavy caravan-road rhino with overlapping iron plates, a blunt horn, and a forceful forward charge.
- `wild_yak` — Shaggy highland yak with long dark fur, icy shoulder tufts, and sweeping horns above a slamming stance.
- `haunted_minecart` — Empty iron ore cart animated by a ghostly glow, with rattling wheels and a lunging coal-black maw.
- `silver_golem` — Bulky mine guardian of polished silver ore and dark rock, with reflective plates and a heavy slam pose.
- `ice_worm` — Segmented glacier worm with a translucent blue shell, a frosty drill-like head, and a curling frost shot.
- `maple_bear` — Broad russet bear with maple-leaf markings across its shoulders and sturdy forearms raised to slam.

### Batch 5 — Glass desert, aurora, and demon front (14)

- `glass_scorpion` — Clear faceted desert scorpion with a glowing pale-gold core, angular pincers, and a raised glass stinger.
- `meteor_imp` — Small soot-dark imp with a molten meteor-stone belly, ember horns, and a bright burst-ready tail.
- `snow_fox` — Petite white fox with blue ear tips, a sweeping plume tail, and a quick twisting dodge pose.
- `aurora_wisp` — Luminous northern spirit with a simple friendly face and ribbons of green, cyan, and rose aurora.
- `three_eyed_crow` — Dark cape crow with three distinct glowing eyes, glossy feathers, and a sly gold-catching claw.
- `cursed_doll` — Small stitched cloth doll with button seams, uneven pigtails, and a violet curse thread winding around it.
- `floating_eye` — Single large stone eye in a cracked, levitating rock shell, with a focused pupil and a small rock bolt forming nearby.
- `storm_elemental` — Spiraling blue-gray thunder spirit with a sharp face, forked lightning arcs, and a floating windblown silhouette.
- `village_ghoul` — Slow, hunched village undead in ragged ash-brown clothes, with pale skin and a close-knit pack menace.
- `thorn_crawler` — Low, many-legged thorn demon with a dark green carapace, hooked briars, and toxic ember accents.
- `demon_soldier` — Compact red demon infantry in black iron plates, with swept horns, a broad shield, and a disciplined stance.
- `blood_mage` — Tall dark-robed demon caster with crimson runes, a blood-red spell orb, and a composed healing gesture.
- `demon_general` — Commanding metal-armored demon with a crown of horns, heavy shoulders, and a broad silhouette suited to a boss slam.
- `crag_roc` — Enormous rust-and-gold mountain bird with hooked talons, layered flight feathers, and a diving charge pose.

### Batch 6 — Dragon summit, frostlands, and the First Tree (19)

- `frost_giant` — Towering blue-gray giant with ice-plated shoulders, a blunt frozen club, and a broad overhead slam.
- `sky_whelp` — Young lightning dragon with bright cobalt scales, tiny swept horns, luminous wing membranes, and crackling breath.
- `sky_dragon` — Majestic storm dragon with long cobalt body, branching lightning horns, and sweeping cloudlike wings.
- `feathered_raptor` — Agile forest raptor with layered green-and-rust feathers, a sharp beak, and a low hunting spring.
- `three_horn` — Stout primeval herbivore with three ivory horns, moss-green hide, and a deliberate forward charge.
- `frozen_knight` — Silent icebound knight in pale blue plate, with a frosted visor, chipped sword, and slow deliberate steps.
- `snow_queen` — Elegant frost monarch with a crystalline crown, flowing ice-white cloak, and a precise frost spell.
- `snow_leopard` — Agile pale mountain cat with charcoal rosettes, thick tail, icy blue eyes, and a twisting dodge.
- `cliff_ascetic` — Silver-haired mountain monk in spare white-and-sand robes, teal eyes, and a simple staff with wind ribbons.
- `echo_bat` — Cave bat with broad indigo ears, concentric sound-wave markings, and a small ring of visible sonic pulses.
- `giant_revenant` — Huge iron-bound undead with a cracked helmet, frost-dark armor, and a lumbering slam stance.
- `frost_titan` — Massive ice giant with glacier plates, a bright frozen core, and a slow heavy strike silhouette.
- `banyan_wraith` — Floating tree spirit with a hollow bark mask, hanging root hair, and thorned green spectral trails.
- `land_octopus` — Curious terrestrial octopus with a rounded teal mantle, broad expressive eyes, and curling suction-cup arms.
- `spirit_elephant` — Noble pale elephant spirit with gold-lit tusks, leaf-like ear ornaments, and a forceful protective charge.
- `temple_guardian` — Symmetrical carved-stone guardian with a calm mask face, moss seams, and monumental fists ready to slam.
- `ancient_treant` — Ancient forest tree-being with a wise knotwood face, branch antlers, moss mantle, and glowing healing leaves.
- `golden_firefly` — Tiny radiant firefly with a golden lantern abdomen, delicate wings, and a bright warm halo kept inside the cell.
- `first_tree_warden` — Towering sacred tree guardian in luminous gold wood, leaf wings, a calm divine face, and commanding branch arms.

## Coverage check

| Batch | Assets |
| --- | ---: |
| 1. Noa's meadows, farms, groves, and raiders | 17 |
| 2. High passes, old plains, and ancient stone | 16 |
| 3. Marsh, royal dead, and storm coast | 12 |
| 4. Flower country, waterways, and the old mine | 17 |
| 5. Glass desert, aurora, and demon front | 14 |
| 6. Dragon summit, frostlands, and the First Tree | 19 |
| **Total** | **95** |

Humanoids included: `highway_bandit`, `nomad_raider`, `cursed_deserter`, `bamboo_ninja`, `caravan_raider`, `toll_keeper`, `bog_witch`, `sea_cultist`, and `cliff_ascetic`.
