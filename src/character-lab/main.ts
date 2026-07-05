import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ProceduralAnimator, RoamArea } from "./anim/ProceduralAnimator";
import { RNG } from "./core/rng";
import { BuiltCharacter, CharacterFactory } from "./factory/CharacterFactory";
import { PRESETS, randomSpec } from "./presets";
import { CharacterSpecInput } from "./types";

// ---------------------------------------------------------------- scene setup

const stage = document.getElementById("stage")!;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xecd6b3, 8, 22);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 60);
camera.position.set(3.3, 1.9, 4.7);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.55, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 1.6;
controls.maxDistance = 11;
controls.maxPolarAngle = 1.45;

// lights only matter for the eye/mouth PBR bits — the body has its own shader
scene.add(new THREE.HemisphereLight(0xfff3e0, 0xd9b98c, 1.0));
const key = new THREE.DirectionalLight(0xfff1dd, 2.2);
key.position.set(2.4, 4.2, 2.6);
scene.add(key);

// soft studio floor
{
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
  g.addColorStop(0, "#f9ecd6");
  g.addColorStop(0.6, "#f0dcbc");
  g.addColorStop(1, "#e7cea8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(26, 48),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
}

// -------------------------------------------------------------- character mgmt

interface LiveCharacter {
  built: BuiltCharacter;
  animator: ProceduralAnimator;
}

const params = new URLSearchParams(location.search);
const resolution = Number(params.get("res")) || 64;
const factory = new CharacterFactory(resolution);
const cast: LiveCharacter[] = [];
const rng = new RNG((Math.random() * 0xffffffff) >>> 0);

const statsEl = document.getElementById("stats")!;
const bakingEl = document.getElementById("baking")!;
const jsonInput = document.getElementById("jsonInput") as HTMLTextAreaElement;
const jsonError = document.getElementById("jsonError")!;

function clearCast(): void {
  for (const live of cast) {
    scene.remove(live.built.group);
    scene.remove(live.built.shadow);
    live.built.dispose();
  }
  cast.length = 0;
}

function addCharacter(spec: CharacterSpecInput, area: RoamArea): BuiltCharacter | null {
  try {
    const built = factory.build(spec);
    scene.add(built.group);
    scene.add(built.shadow);
    cast.push({ built, animator: new ProceduralAnimator(built, area) });
    return built;
  } catch (err) {
    jsonError.textContent = err instanceof Error ? err.message : String(err);
    return null;
  }
}

function frameCamera(distance: number): void {
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).addScaledVector(dir, distance);
}

function showSpec(spec: CharacterSpecInput): void {
  bakingEl.classList.add("on");
  requestAnimationFrame(() => {
    clearCast();
    frameCamera(5.4);
    const built = addCharacter(spec, { x: 0, z: 0, r: 1.7 });
    if (built) {
      jsonInput.value = JSON.stringify(displaySpec(built.spec as unknown as Record<string, unknown>), null, 2);
      jsonError.textContent = "";
      statsEl.textContent = `${built.triCount.toLocaleString()} tris · 1 draw call body · baked in ${built.bakeMs.toFixed(0)} ms · grid ${resolution}³`;
    }
    bakingEl.classList.remove("on");
  });
}

function showParade(): void {
  bakingEl.classList.add("on");
  requestAnimationFrame(() => {
    clearCast();
    frameCamera(8.2);
    const names = Object.keys(PRESETS);
    let tris = 0;
    let ms = 0;
    names.forEach((name, i) => {
      const angle = (i / names.length) * Math.PI * 2;
      const built = addCharacter(PRESETS[name], {
        x: Math.sin(angle) * 2.1,
        z: Math.cos(angle) * 2.1,
        r: 0.85,
      });
      if (built) {
        tris += built.triCount;
        ms += built.bakeMs;
      }
    });
    statsEl.textContent = `${cast.length} puppets · ${tris.toLocaleString()} tris · baked in ${ms.toFixed(0)} ms`;
    jsonInput.value = "// parade mode — pick a preset to edit its JSON";
    bakingEl.classList.remove("on");
  });
}

/** strip derived/noisy fields so the JSON stays ~15 friendly lines */
function displaySpec(spec: Record<string, unknown>): Record<string, unknown> {
  const { species, body, head, eyes, legs, arms, ears, tail, palette, movement, personality } = spec;
  return { species, body, head, eyes, legs, arms, ears, tail, palette, movement, personality };
}

// ------------------------------------------------------------------------- UI

const dock = document.getElementById("dock")!;
const chipFor = new Map<string, HTMLButtonElement>();

function setActiveChip(name: string | null): void {
  for (const [n, el] of chipFor) el.classList.toggle("active", n === name);
}

for (const name of Object.keys(PRESETS)) {
  const btn = document.createElement("button");
  btn.textContent = name;
  btn.addEventListener("click", () => {
    setActiveChip(name);
    showSpec(PRESETS[name]);
  });
  dock.appendChild(btn);
  chipFor.set(name, btn);
}
{
  const all = document.createElement("button");
  all.textContent = "✦ all";
  all.addEventListener("click", () => {
    setActiveChip("__all");
    showParade();
  });
  dock.appendChild(all);
  chipFor.set("__all", all);

  const dice = document.createElement("button");
  dice.className = "dice";
  dice.title = "random creature (R)";
  dice.textContent = "🎲";
  dice.addEventListener("click", rollRandom);
  dock.appendChild(dice);
}

function rollRandom(): void {
  setActiveChip(null);
  showSpec(randomSpec(rng));
}

window.addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") rollRandom();
});

// JSON panel
const panel = document.getElementById("panel")!;
const togglePanel = document.getElementById("togglePanel")!;
togglePanel.addEventListener("click", () => {
  panel.classList.remove("hidden");
  togglePanel.classList.add("open");
});
document.getElementById("closePanel")!.addEventListener("click", () => {
  panel.classList.add("hidden");
  togglePanel.classList.remove("open");
});
document.getElementById("applyJson")!.addEventListener("click", () => {
  try {
    const spec = JSON.parse(jsonInput.value) as CharacterSpecInput;
    setActiveChip(null);
    showSpec(spec);
  } catch (err) {
    jsonError.textContent = err instanceof Error ? err.message : String(err);
  }
});

// ------------------------------------------------------------------ main loop

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  const t = clock.elapsedTime;
  for (const live of cast) live.animator.update(dt, t);
  controls.update();
  renderer.render(scene, camera);
});

// boot
const bootPreset = params.get("preset");
if (bootPreset === "all") {
  setActiveChip("__all");
  showParade();
} else if (bootPreset && PRESETS[bootPreset]) {
  setActiveChip(bootPreset);
  showSpec(PRESETS[bootPreset]);
} else {
  setActiveChip("blobfox");
  showSpec(PRESETS.blobfox);
}
