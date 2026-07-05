import * as THREE from "three";

/**
 * Unified player input: WASD/arrow keys on desktop, a drag joystick on touch.
 * Output is a camera-relative world-XZ vector (x → world X, y → world Z) that
 * feeds straight into ProceduralAnimator.driveInput.
 */

const KEYMAP: Record<string, [number, number]> = {
  ArrowUp: [0, 1],
  KeyW: [0, 1],
  ArrowDown: [0, -1],
  KeyS: [0, -1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

export class InputPad {
  private pressed = new Set<string>();
  private touch = new THREE.Vector2();
  private touchOn = false;
  private fwd = new THREE.Vector3();

  constructor(joyEl: HTMLElement, stickEl: HTMLElement) {
    window.addEventListener("keydown", (e) => {
      if (KEYMAP[e.code]) {
        this.pressed.add(e.code);
        if (document.body.classList.contains("mode-game")) e.preventDefault();
      }
    });
    window.addEventListener("keyup", (e) => this.pressed.delete(e.code));
    window.addEventListener("blur", () => this.pressed.clear());

    const R = 44;
    let pid = -1;
    const setStick = (dx: number, dy: number) => {
      stickEl.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    joyEl.addEventListener("pointerdown", (e) => {
      pid = e.pointerId;
      joyEl.setPointerCapture(pid);
      this.touchOn = true;
    });
    joyEl.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid) return;
      const r = joyEl.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2);
      let dy = e.clientY - (r.top + r.height / 2);
      const len = Math.hypot(dx, dy) || 1;
      const cl = Math.min(len, R);
      dx = (dx / len) * cl;
      dy = (dy / len) * cl;
      this.touch.set(dx / R, dy / R);
      setStick(dx, dy);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      pid = -1;
      this.touchOn = false;
      this.touch.set(0, 0);
      setStick(0, 0);
    };
    joyEl.addEventListener("pointerup", end);
    joyEl.addEventListener("pointercancel", end);
  }

  getWorldVector(camera: THREE.Camera, out: THREE.Vector2): THREE.Vector2 {
    let x = 0;
    let y = 0;
    for (const code of this.pressed) {
      const m = KEYMAP[code];
      x += m[0];
      y += m[1];
    }
    if (this.touchOn) {
      x = this.touch.x;
      y = -this.touch.y; // screen-up = forward
    }
    const len = Math.hypot(x, y);
    if (len < 0.04) return out.set(0, 0);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    camera.getWorldDirection(this.fwd);
    this.fwd.y = 0;
    if (this.fwd.lengthSq() < 1e-6) this.fwd.set(0, 0, -1);
    this.fwd.normalize();
    const fx = this.fwd.x;
    const fz = this.fwd.z;
    // right vector on the ground plane is (-fz, fx)
    return out.set(-fz * x + fx * y, fx * x + fz * y);
  }
}
