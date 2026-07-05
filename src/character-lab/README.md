# Puppet Lab — procedural soft-body character engine (prototype)

A fully procedural 3D character generator built on Three.js. Characters are
cute puppet-like creatures assembled from primitive shapes (spheres, tapered
capsules, blobs) that render as **one seamless soft body** — no visible seams,
no external assets, no animation files, one skinned draw call per character.

Open `/character-lab.html` (dev: `npm run dev` → http://localhost:5173/character-lab.html).
URL params: `?preset=wobbit|blobfox|skitterbug|gumdrop|flapling|all`, `?res=48`
(marching-cubes grid, default 64).

## The core trick: bake the fusion, animate the skeleton

Metaball/SDF looks usually come from per-pixel raymarching (expensive) or
realtime marching cubes (CPU-hungry). This engine does neither at runtime:

1. **Anatomy plan** (`factory/anatomy.ts`) — the JSON spec is mapped to a bone
   hierarchy plus a list of *blob nodes*: tapered capsules with a position,
   radii, blend distance, color and owning bone. Four archetypes cover every
   spec: biped, multiped (4/6/8 legs), hopper (0 legs) and flyer.

2. **Field bake** (`core/field.ts`) — the nodes define a scalar density field
   (smooth union: each node contributes `density · falloff(d, blend)`, iso
   level 1). The field is polygonized **once** with marching cubes into a
   single watertight mesh. Where primitives meet, the field sums and bulges
   into an organic weld — seams cannot exist by construction.

3. **Vertex pass** (`factory/CharacterFactory.ts`) — for every baked vertex,
   the *same node influences* are evaluated again to derive:
   - **vertex colors**: node colors blended by influence → palette colors melt
     into each other across part boundaries (plus tint-only nodes for bellies,
     cheek blush and face masks — zero geometry, pure color);
   - **skin weights**: per-bone influence sums, top-4 normalized → the mesh
     bends exactly as softly as it was fused.

4. **Runtime** — a standard `THREE.SkinnedMesh` with a custom shader. All
   animation is bone animation; the GPU does what it does best.

Baking a character takes ~100–250 ms at grid 64³ (one-time, per spec).

## Rendering (`material/FusedToonMaterial.ts`)

One `ShaderMaterial` (skinning chunks included) with a hand-built cartoon
stack: wrap diffuse with two soft toon bands, a warm scatter band at the light
terminator (gummy subsurface feel), a tight stepped specular (vinyl-toy sheen),
warm fresnel rim, hemisphere ambient, world-height contact darkening, and a
gentle saturation push under ACES tone mapping. Eyes are glossy beads
(`MeshPhysicalMaterial` + unlit highlight dots); mouths are torus arcs
projected onto the fused surface via field bisection. Ground contact is a
radial-gradient blob shadow — no shadow maps anywhere.

## Animation (`anim/ProceduralAnimator.ts`)

Zero animation files. One `update(dt, t)` drives:

- **Walk/waddle/trot/scuttle** — phase-offset gait for any leg count (biped
  alternation, quadruped diagonals, tripod for 6+). Foot targets follow a
  cycloid step arc; legs are solved with analytic two-bone IK (`anim/boneUtils.ts`)
  with outward knee poles for bugs; feet stay world-flat. Body gets bounce,
  roll/waddle sway, speed lean and volume-preserving squash on the hips bone.
- **Hop** — a piecewise cycle: anticipation crouch (squash 0.8) → launch
  (stretch 1.18) → airborne parabola (forward travel only while airborne) →
  landing splat with recovery wobble. Squash scales the root bone so the whole
  fused body stretches like rubber.
- **Fly** — hover bob, wing flap with tip lag driving a subtle body pump,
  banking into turns, dangling legs.
- **Steering** — characters wander a roam disc with smoothly damped heading.
- **Secondary motion** (`anim/SpringChain.ts`) — every ear, tail and antenna is
  a spring chain: a virtual tip particle chases its rigid-pose target, so all
  body motion automatically injects lag, wobble and overshoot. Personality
  ("grumpy", "shy"…) poses the chains (ears back/drooped) and scales tempo,
  amplitude, tail wag, blink rate and head bob.
- **Life** — breathing (chest scale), timed blinks (eye Y-scale), micro head
  look-around noise.

Update order matters: body pose → `updateMatrixWorld` → leg IK (patches its own
subtree matrices) → spring chains → render.

## Character JSON

```json
{
  "species": "blobfox",
  "body": "round",
  "head": "muzzle",
  "eyes": "big_curious",
  "legs": 4,
  "arms": 0,
  "ears": "pointy",
  "tail": "springy",
  "palette": ["#ffb86b", "#fff2d8", "#2a1f1a"],
  "movement": "trot",
  "personality": "playful"
}
```

Everything except `species` is optional — defaults are derived from leg count.
Enums: `body` round|bean|egg|pear|long|blob · `head` round|muzzle|broad|merged ·
`eyes` big_curious|wide|dot_shy|sleepy · `ears` none|large_soft|pointy|round|bunny|antennae ·
`tail` none|springy|fluffy|stub|whip · `movement` bouncy_walk|waddle|trot|scuttle|hop|fly ·
`personality` playful|shy|zen|grumpy|manic. Plus optional `size` (0.5–1.8) and
`seed`. Five presets in `presets.ts` cover biped, quadruped, hexapod, hopper
and flyer; `randomSpec()` generates new species from curated tables.

## Mobile performance notes

- **One skinned draw call per character body** (~15–20 k tris at grid 64³);
  eyes/mouth add 3–5 tiny draws. Bake at `?res=48` for low-end devices
  (~8 k tris, visually almost identical at phone scale).
- The fragment shader is a handful of `smoothstep`s — far cheaper than PBR;
  no shadow maps, no postprocessing, fog + blob shadows instead.
- Pixel ratio is clamped to 2; all textures are two tiny generated canvases.
- Baking is CPU-bounded but incremental-friendly: field fill is AABB-scoped per
  node. For spawning crowds, bake in a Web Worker (geometry data is
  transferable) or cache by spec hash — identical JSON → identical mesh.
- Springs/IK cost is O(bones); 30–40 bones per character, trivial at 60 fps.

## Where this goes next (full engine roadmap)

1. **More primitives**: ellipsoids, bent capsules, torus nodes (for horns,
   shells, beaks) — the field/marching pipeline is shape-agnostic.
2. **Detail pass**: bake-time displacement (fur nibs, scales) along the field
   gradient; per-node roughness/sheen written into a second vertex attribute.
3. **LOD**: bake 2–3 grids (64/48/32) per spec and swap by screen size.
4. **Blend-shape emotions**: bake N field variants (happy/angry cheek and brow
   nodes) into morph targets — same pipeline, drive with the animator.
5. **Interaction**: IK look-at, grab targets for arms, terrain-adaptive foot
   planting (raycast the ground instead of y=0).
6. **Crowds**: worker-pool baking + `InstancedSkinnedMesh`-style batching for
   herds of identical species.
7. **AI loop**: the JSON is deliberately LLM-friendly — schema-constrained
   generation ("make me a grumpy six-legged librarian") maps 1:1 to specs, and
   `seed` keeps results reproducible.
8. **Serialization**: bake → export glTF (mesh + skeleton are standard three.js
   objects) for use in any engine.
