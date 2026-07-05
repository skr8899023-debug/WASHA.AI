export type BodyShape = "round" | "bean" | "egg" | "pear" | "long" | "blob";
export type HeadStyle = "round" | "muzzle" | "broad" | "merged";
export type EyeStyle = "big_curious" | "wide" | "dot_shy" | "sleepy";
export type EarStyle = "none" | "large_soft" | "pointy" | "round" | "bunny" | "antennae";
export type TailStyle = "none" | "springy" | "fluffy" | "stub" | "whip";
export type Movement = "bouncy_walk" | "waddle" | "trot" | "scuttle" | "hop" | "fly";
export type Personality = "playful" | "shy" | "zen" | "grumpy" | "manic";

/**
 * The compact, AI-generatable character description. Every field except
 * `species` is optional — CharacterFactory fills sensible defaults derived
 * from leg count and movement, so a partial spec always builds.
 */
export interface CharacterSpec {
  species: string;
  body: BodyShape;
  head: HeadStyle;
  eyes: EyeStyle;
  legs: number;
  arms: number;
  ears: EarStyle;
  tail: TailStyle;
  palette: [string, string, string];
  movement: Movement;
  personality: Personality;
  size: number;
  seed: number;
}

export type CharacterSpecInput = Partial<CharacterSpec> & { species: string };
