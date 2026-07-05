import * as THREE from "three";
import { RNG } from "../core/rng";
import { PRESETS, randomSpec } from "../presets";
import { CharacterSpec, CharacterSpecInput } from "../types";
import { ChaseMission } from "./ChaseMission";
import { InputPad } from "./InputPad";
import { GameStage, LiveCharacter } from "./stage";
import { ensureAudio, sfx } from "./sfx";

/**
 * GameDirector — the game's brain. A small state machine:
 *
 *   menu ──▶ select ──▶ play ──▶ celebrate ─┐
 *     ▲                   │        (next level loops back to play)
 *     └──── results ◀─────┘ (timeout)
 *
 * The lab sandbox stays intact; the director only talks to the 3D world
 * through GameStage. Missions are pluggable (ChaseMission today; racing,
 * herding and hatch-puzzles can implement the same start/update/cleanup).
 */

type Mode = "off" | "menu" | "select" | "play" | "celebrate" | "results";

interface AlbumEntry {
  species: string;
  palette: [string, string, string];
  level: number;
}

const ALBUM_KEY = "puppetlab-album-v1";
const ARENA_R = 3;

const AR_NAME: Record<string, string> = {
  blobfox: "ثعلوب",
  wobbit: "وبّيت",
  skitterbug: "دعسوقة",
  gumdrop: "قطقوطة",
  flapling: "رفراف",
};
const AR_MOVE: Record<string, string> = {
  trot: "رباعي رشيق",
  bouncy_walk: "مشّاء مرح",
  waddle: "يتهادى",
  scuttle: "سداسي سريع",
  hop: "قافز مطاطي",
  fly: "طيّار صغير",
};

const _camTarget = new THREE.Vector3();
const _camDelta = new THREE.Vector3();
const _drive = new THREE.Vector2();

export class GameDirector {
  timeScale = 1;

  private mode: Mode = "off";
  private level = 1;
  private album: AlbumEntry[] = loadAlbum();
  private runCaught: AlbumEntry[] = [];
  private playerSpec: CharacterSpecInput | null = null;
  private player: LiveCharacter | null = null;
  private mission: ChaseMission | null = null;
  private celebrateT = 0;
  private ring: THREE.Mesh | null = null;
  private rng = new RNG((Date.now() & 0xffffffff) >>> 0);
  private els: Record<string, HTMLElement> = {};
  private toastTimer: number | undefined;
  private hintTimer: number | undefined;

  constructor(
    private stage: GameStage,
    private input: InputPad,
    private onEnterLab: () => void
  ) {
    for (const id of [
      "gm-menu", "gm-select", "gm-hud", "gm-results", "gm-toast", "gm-joy",
      "gm-start", "gm-lab", "gm-album-count", "gm-cards", "gm-go", "gm-back",
      "gm-level", "gm-timerfill", "gm-quit", "gm-hint",
      "gm-res-title", "gm-res-sub", "gm-res-chips", "gm-retry", "gm-menu2",
    ]) {
      const el = document.getElementById(id);
      if (el) this.els[id] = el;
    }

    this.els["gm-start"].addEventListener("click", () => {
      ensureAudio();
      sfx.tick();
      this.showSelect();
    });
    this.els["gm-lab"].addEventListener("click", () => {
      this.mode = "off";
      this.cleanupPlay();
      this.onEnterLab();
    });
    this.els["gm-back"].addEventListener("click", () => this.showMenu());
    this.els["gm-go"].addEventListener("click", () => {
      ensureAudio();
      sfx.pop();
      this.startRun();
    });
    this.els["gm-quit"].addEventListener("click", () => this.showMenu());
    this.els["gm-retry"].addEventListener("click", () => {
      sfx.tick();
      this.hide("gm-results");
      this.startLevel();
      this.setMode("play");
    });
    this.els["gm-menu2"].addEventListener("click", () => this.showMenu());
    this.buildSelectCards();
  }

  // -- screens -----------------------------------------------------------------

  showMenu(): void {
    this.cleanupPlay();
    this.stage.clear();
    this.setMode("menu");
    this.resetCamera();
    // living menu background: the five presets wander behind the UI
    const names = Object.keys(PRESETS);
    names.forEach((name, i) => {
      const angle = (i / names.length) * Math.PI * 2;
      this.stage.add(PRESETS[name], { x: Math.sin(angle) * 2.1, z: Math.cos(angle) * 2.1, r: 0.85 });
    });
    const n = this.album.length;
    this.els["gm-album-count"].textContent =
      n > 0 ? `🥚 في ألبومك ${n} ${n === 1 ? "مخلوق" : "مخلوقات"}` : "";
  }

  private showSelect(): void {
    this.stage.clear();
    this.setMode("select");
    this.resetCamera();
    if (!this.playerSpec) this.pickSpec(PRESETS.wobbit, "wobbit");
    else this.preview(this.playerSpec);
  }

  private buildSelectCards(): void {
    const wrap = this.els["gm-cards"];
    wrap.innerHTML = "";
    for (const name of Object.keys(PRESETS)) {
      wrap.appendChild(this.makeCard(name, PRESETS[name]));
    }
    const dice = document.createElement("button");
    dice.className = "gm-pcard";
    dice.innerHTML = `<span class="gm-pname">🎲 مفاجأة</span><span class="gm-pmove">مخلوق عشوائي جديد</span>`;
    dice.addEventListener("click", () => {
      ensureAudio();
      sfx.tick();
      this.pickSpec(randomSpec(this.rng), null, dice);
    });
    wrap.appendChild(dice);
  }

  private makeCard(name: string, spec: CharacterSpecInput): HTMLButtonElement {
    const card = document.createElement("button");
    card.className = "gm-pcard";
    const dots = (spec.palette ?? []).map((c) => `<i style="background:${c}"></i>`).join("");
    card.innerHTML = `<span class="gm-pname">${AR_NAME[name] ?? name}</span><span class="gm-pmove">${AR_MOVE[spec.movement ?? ""] ?? ""}</span><span class="gm-dots">${dots}</span>`;
    card.addEventListener("click", () => {
      ensureAudio();
      sfx.tick();
      this.pickSpec(spec, name, card);
    });
    return card;
  }

  private pickSpec(spec: CharacterSpecInput, presetName: string | null, cardEl?: HTMLElement): void {
    this.playerSpec = spec;
    const wrap = this.els["gm-cards"];
    for (const el of Array.from(wrap.children)) el.classList.remove("active");
    if (cardEl) cardEl.classList.add("active");
    else if (presetName) {
      const idx = Object.keys(PRESETS).indexOf(presetName);
      if (idx >= 0) wrap.children[idx]?.classList.add("active");
    }
    (this.els["gm-go"] as HTMLButtonElement).disabled = false;
    this.preview(spec);
  }

  private preview(spec: CharacterSpecInput): void {
    this.stage.clear();
    // off to the side so the select card doesn't cover the star of the show
    const live = this.stage.add(spec, { x: -1.9, z: 1.1, r: 0.45 });
    live?.animator.setPlacement(-1.9, 1.1, 0.9);
  }

  // -- run / levels ------------------------------------------------------------

  private startRun(): void {
    if (!this.playerSpec) return;
    this.stage.clear();
    this.level = 1;
    this.runCaught = [];
    this.timeScale = 1;

    this.player = this.stage.add(this.playerSpec, { x: 0, z: 0, r: ARENA_R });
    if (!this.player) return;
    this.player.animator.controlMode = "drive";
    this.player.animator.speedMultiplier = 1.02 / Math.max(this.player.animator.baseSpeed, 0.05);
    this.player.animator.setPlacement(0, 0, Math.PI);

    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(ARENA_R - 0.05, ARENA_R, 72),
      new THREE.MeshBasicMaterial({ color: 0xc8a06a, transparent: true, opacity: 0.5 })
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.01;
    this.stage.scene.add(this.ring);

    this.setMode("play");
    this.hint("حرّك بطلك بالأسهم أو WASD — أمسك المخلوق قبل نهاية الوقت!");
    this.startLevel();
  }

  private startLevel(): void {
    if (!this.player) return;
    this.mission?.cleanup(true);
    this.mission = new ChaseMission(this.level, this.stage, this.player, this.rng, {
      toast: (m) => this.toast(m),
    });
    this.mission.start();
    this.els["gm-level"].textContent = `المستوى ${this.level}`;
  }

  private handleCaught(): void {
    const target = this.mission?.live;
    if (target) {
      const spec = target.built.spec as CharacterSpec;
      const at = target.built.group.position.clone().add(new THREE.Vector3(0, 0.5, 0));
      const colors = spec.palette.map((h) => new THREE.Color(h));
      colors.push(new THREE.Color("#ffffff"));
      this.stage.confetti.burst(at, colors, 170);
      const entry: AlbumEntry = { species: spec.species, palette: spec.palette, level: this.level };
      this.album.push(entry);
      this.runCaught.push(entry);
      saveAlbum(this.album);
      this.toast(`أمسكت بـ «${spec.species}»! 🎉`);
    }
    sfx.win();
    this.mission?.cleanup(true);
    this.mission = null;
    this.timeScale = 0.3;
    this.celebrateT = 1.5;
    this.setMode("celebrate");
  }

  private handleLose(): void {
    sfx.lose();
    this.mission?.cleanup(true);
    this.mission = null;
    this.els["gm-res-title"].textContent = "انتهى الوقت! ⏰";
    const n = this.runCaught.length;
    this.els["gm-res-sub"].textContent =
      n > 0
        ? `وصلت إلى المستوى ${this.level} وأمسكت ${n} ${n === 1 ? "مخلوقاً" : "مخلوقات"}`
        : `وصلت إلى المستوى ${this.level} — المخلوق أسرع منك هذه المرة!`;
    this.els["gm-res-chips"].innerHTML = this.runCaught
      .map((e) => `<span class="gm-chip"><i style="background:${e.palette[0]}"></i>${e.species}</span>`)
      .join("");
    this.show("gm-results");
    this.setMode("results");
  }

  // -- per-frame ---------------------------------------------------------------

  update(dtReal: number, dtSim: number): void {
    if (this.mode === "play" && this.player && this.mission) {
      this.input.getWorldVector(this.stage.camera, _drive);
      this.player.animator.driveInput.copy(_drive);

      const tick = this.mission.update(dtSim);
      const fill = this.els["gm-timerfill"];
      fill.style.width = `${Math.max(0, this.mission.progress * 100).toFixed(1)}%`;
      fill.classList.toggle("low", this.mission.running && this.mission.progress < 0.25);

      if (tick === "caught") this.handleCaught();
      else if (tick === "timeout") this.handleLose();
      this.followCamera(dtReal);
    } else if (this.mode === "celebrate") {
      if (this.player) this.player.animator.driveInput.set(0, 0);
      this.timeScale += (1 - this.timeScale) * (1 - Math.exp(-2.2 * dtReal));
      this.celebrateT -= dtReal;
      this.followCamera(dtReal);
      if (this.celebrateT <= 0) {
        this.timeScale = 1;
        this.level++;
        this.startLevel();
        this.setMode("play");
      }
    }
  }

  private followCamera(dt: number): void {
    if (!this.player) return;
    const p = this.player.built.group.position;
    _camTarget.set(p.x, 0.55, p.z);
    _camDelta.copy(_camTarget).sub(this.stage.controls.target);
    const k = 1 - Math.exp(-5 * dt);
    _camDelta.multiplyScalar(k);
    this.stage.controls.target.add(_camDelta);
    this.stage.camera.position.add(_camDelta);
  }

  private resetCamera(): void {
    this.stage.camera.position.set(3.3, 1.9, 4.7);
    this.stage.controls.target.set(0, 0.55, 0);
  }

  // -- plumbing ----------------------------------------------------------------

  private setMode(mode: Mode): void {
    this.mode = mode;
    this.toggle("gm-menu", mode === "menu");
    this.toggle("gm-select", mode === "select");
    const hud = mode === "play" || mode === "celebrate";
    this.toggle("gm-hud", hud);
    this.toggle("gm-joy", hud);
    if (mode !== "results") this.hide("gm-results");
  }

  private cleanupPlay(): void {
    this.mission?.cleanup(true);
    this.mission = null;
    this.player = null;
    this.timeScale = 1;
    if (this.ring) {
      this.stage.scene.remove(this.ring);
      this.ring.geometry.dispose();
      (this.ring.material as THREE.Material).dispose();
      this.ring = null;
    }
    this.hide("gm-results");
  }

  private toast(msg: string): void {
    const el = this.els["gm-toast"];
    el.textContent = msg;
    el.classList.remove("hidden");
    el.classList.remove("pop");
    void el.offsetWidth; // restart animation
    el.classList.add("pop");
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => el.classList.add("hidden"), 2200);
  }

  private hint(msg: string): void {
    const el = this.els["gm-hint"];
    el.textContent = msg;
    el.classList.remove("hidden");
    window.clearTimeout(this.hintTimer);
    this.hintTimer = window.setTimeout(() => el.classList.add("hidden"), 4200);
  }

  private toggle(id: string, on: boolean): void {
    this.els[id].classList.toggle("hidden", !on);
  }

  private show(id: string): void {
    this.els[id].classList.remove("hidden");
  }

  private hide(id: string): void {
    this.els[id].classList.add("hidden");
  }
}

function loadAlbum(): AlbumEntry[] {
  try {
    const raw = localStorage.getItem(ALBUM_KEY);
    return raw ? (JSON.parse(raw) as AlbumEntry[]) : [];
  } catch {
    return [];
  }
}

function saveAlbum(album: AlbumEntry[]): void {
  try {
    localStorage.setItem(ALBUM_KEY, JSON.stringify(album.slice(-200)));
  } catch {
    /* storage may be unavailable — the game still works */
  }
}
