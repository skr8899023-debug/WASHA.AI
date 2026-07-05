import * as THREE from "three";

/** Celebratory particle bursts — cheap THREE.Points, colored per event. */

interface Burst {
  points: THREE.Points;
  vel: Float32Array;
  life: number;
  max: number;
}

export class ConfettiSystem {
  private bursts: Burst[] = [];

  constructor(private scene: THREE.Scene) {}

  burst(pos: THREE.Vector3, colors: THREE.Color[], count = 140): void {
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = pos.x + (Math.random() - 0.5) * 0.12;
      p[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 0.12;
      p[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.12;
      const a = Math.random() * Math.PI * 2;
      const h = Math.random() * 1.6;
      vel[i * 3] = Math.cos(a) * h;
      vel[i * 3 + 1] = 1.6 + Math.random() * 2.4;
      vel[i * 3 + 2] = Math.sin(a) * h;
      const col = colors[Math.floor(Math.random() * colors.length)];
      c[i * 3] = col.r;
      c[i * 3 + 1] = col.g;
      c[i * 3 + 2] = col.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(c, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    this.scene.add(points);
    this.bursts.push({ points, vel, life: 0, max: 1.5 });
  }

  update(dt: number): void {
    for (let bi = this.bursts.length - 1; bi >= 0; bi--) {
      const b = this.bursts[bi];
      b.life += dt;
      const posAttr = b.points.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const n = arr.length / 3;
      for (let i = 0; i < n; i++) {
        b.vel[i * 3 + 1] -= 5.5 * dt;
        arr[i * 3] += b.vel[i * 3] * dt;
        arr[i * 3 + 1] += b.vel[i * 3 + 1] * dt;
        arr[i * 3 + 2] += b.vel[i * 3 + 2] * dt;
        if (arr[i * 3 + 1] < 0.03) {
          arr[i * 3 + 1] = 0.03;
          b.vel[i * 3 + 1] *= -0.3;
          b.vel[i * 3] *= 0.7;
          b.vel[i * 3 + 2] *= 0.7;
        }
      }
      posAttr.needsUpdate = true;
      const k = b.life / b.max;
      (b.points.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - k * k);
      if (b.life >= b.max) {
        this.scene.remove(b.points);
        b.points.geometry.dispose();
        (b.points.material as THREE.Material).dispose();
        this.bursts.splice(bi, 1);
      }
    }
  }
}
