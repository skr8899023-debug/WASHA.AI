import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ProceduralAnimator, RoamArea } from "../anim/ProceduralAnimator";
import { BuiltCharacter, CharacterFactory } from "../factory/CharacterFactory";
import { CharacterSpecInput } from "../types";
import { ConfettiSystem } from "./Confetti";

/** A baked character + its animator, alive in the scene. */
export interface LiveCharacter {
  built: BuiltCharacter;
  animator: ProceduralAnimator;
}

/**
 * What the game layer is allowed to do with the 3D stage. main.ts implements
 * this on top of the sandbox's scene/cast management so GameDirector and
 * missions never touch scene internals directly.
 */
export interface GameStage {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  factory: CharacterFactory;
  confetti: ConfettiSystem;
  add(spec: CharacterSpecInput, area: RoamArea): LiveCharacter | null;
  remove(live: LiveCharacter): void;
  clear(): void;
}
