import { RNG } from "./core/rng";
import {
  BodyShape,
  CharacterSpecInput,
  EarStyle,
  EyeStyle,
  HeadStyle,
  Movement,
  Personality,
  TailStyle,
} from "./types";

/** The five showcase archetypes: biped, quadruped, hexapod, hopper, flyer. */
export const PRESETS: Record<string, CharacterSpecInput> = {
  blobfox: {
    species: "blobfox",
    body: "round",
    head: "muzzle",
    legs: 4,
    arms: 0,
    ears: "pointy",
    tail: "springy",
    palette: ["#ffb86b", "#fff2d8", "#2a1f1a"],
    eyes: "big_curious",
    movement: "trot",
    personality: "playful",
  },
  wobbit: {
    species: "wobbit",
    body: "pear",
    head: "round",
    legs: 2,
    arms: 2,
    ears: "large_soft",
    tail: "stub",
    palette: ["#cdb4db", "#fff1e6", "#3a2e39"],
    eyes: "big_curious",
    movement: "bouncy_walk",
    personality: "playful",
  },
  skitterbug: {
    species: "skitterbug",
    body: "bean",
    head: "round",
    legs: 6,
    arms: 0,
    ears: "antennae",
    tail: "none",
    palette: ["#95d5b2", "#f6fff8", "#22333b"],
    eyes: "wide",
    movement: "scuttle",
    personality: "manic",
  },
  gumdrop: {
    species: "gumdrop",
    body: "blob",
    head: "merged",
    legs: 0,
    arms: 2,
    ears: "round",
    tail: "none",
    palette: ["#f4978e", "#fff5eb", "#38302e"],
    eyes: "big_curious",
    movement: "hop",
    personality: "zen",
  },
  flapling: {
    species: "flapling",
    body: "egg",
    head: "round",
    legs: 2,
    arms: 2,
    ears: "pointy",
    tail: "whip",
    palette: ["#8ecae6", "#f1faee", "#1d3557"],
    eyes: "wide",
    movement: "fly",
    personality: "shy",
  },
};

const PALETTES: [string, string, string][] = [
  ["#ffb86b", "#fff2d8", "#2a1f1a"],
  ["#8ecae6", "#f1faee", "#1d3557"],
  ["#cdb4db", "#fff1e6", "#3a2e39"],
  ["#95d5b2", "#f6fff8", "#22333b"],
  ["#f4978e", "#fff5eb", "#38302e"],
  ["#ffd166", "#fdfcdc", "#2f2504"],
  ["#a8dadc", "#ffe5ec", "#264653"],
  ["#e5989b", "#fff0f3", "#31263e"],
  ["#b5e48c", "#fefae0", "#283618"],
  ["#90dbf4", "#fdfdff", "#22223b"],
];

const SYL_A = ["blo", "wib", "mo", "fluf", "pip", "zib", "gro", "nib", "wug", "tup", "snor", "dib"];
const SYL_B = ["ble", "kin", "pod", "fox", "let", "bug", "loo", "nook", "puff", "zee", "bit", "gob"];

const BODIES: BodyShape[] = ["round", "bean", "egg", "pear", "long", "blob"];
const HEADS: HeadStyle[] = ["round", "muzzle", "broad"];
const EYESS: EyeStyle[] = ["big_curious", "wide", "dot_shy", "sleepy"];
const EARS: EarStyle[] = ["none", "large_soft", "pointy", "round", "bunny"];
const TAILS: TailStyle[] = ["none", "springy", "fluffy", "stub", "whip"];
const PERSONALITIES: Personality[] = ["playful", "shy", "zen", "grumpy", "manic"];

export function randomSpec(rng: RNG): CharacterSpecInput {
  const archetype = rng.pick(["biped", "quad", "bug", "hopper", "flyer"] as const);
  const palette = rng.pick(PALETTES);
  const species = rng.pick(SYL_A) + rng.pick(SYL_B);
  const personality = rng.pick(PERSONALITIES);
  const eyes = rng.pick(EYESS);
  const seed = rng.int(1, 999999);

  switch (archetype) {
    case "quad":
      return {
        species, palette, personality, eyes, seed,
        body: rng.pick(["round", "bean", "egg"] satisfies BodyShape[]),
        head: rng.pick(["muzzle", "round"] satisfies HeadStyle[]),
        legs: 4, arms: 0,
        ears: rng.pick(["pointy", "large_soft", "round", "bunny"] satisfies EarStyle[]),
        tail: rng.pick(["springy", "fluffy", "whip", "stub"] satisfies TailStyle[]),
        movement: rng.pick(["trot", "bouncy_walk"] satisfies Movement[]),
      };
    case "bug":
      return {
        species, palette, personality, eyes, seed,
        body: rng.pick(["bean", "long"] satisfies BodyShape[]),
        head: "round",
        legs: rng.pick([6, 6, 8]), arms: 0,
        ears: "antennae",
        tail: rng.pick(["none", "whip"] satisfies TailStyle[]),
        movement: "scuttle",
      };
    case "hopper":
      return {
        species, palette, personality, eyes, seed,
        body: rng.pick(["blob", "round", "pear"] satisfies BodyShape[]),
        head: "merged",
        legs: 0, arms: rng.pick([0, 2]),
        ears: rng.pick(["none", "round", "bunny", "large_soft"] satisfies EarStyle[]),
        tail: rng.pick(["none", "stub"] satisfies TailStyle[]),
        movement: "hop",
      };
    case "flyer":
      return {
        species, palette, personality, eyes, seed,
        body: rng.pick(["egg", "round"] satisfies BodyShape[]),
        head: "round",
        legs: 2, arms: 2,
        ears: rng.pick(["pointy", "none", "round"] satisfies EarStyle[]),
        tail: rng.pick(["whip", "springy", "none"] satisfies TailStyle[]),
        movement: "fly",
      };
    default:
      return {
        species, palette, personality, eyes, seed,
        body: rng.pick(BODIES),
        head: rng.pick(HEADS),
        legs: 2, arms: 2,
        ears: rng.pick(EARS),
        tail: rng.pick(TAILS),
        movement: rng.pick(["bouncy_walk", "waddle"] satisfies Movement[]),
      };
  }
}
