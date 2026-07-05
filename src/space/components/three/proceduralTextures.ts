import * as THREE from "three";
import type { ProceduralTexture } from "../../utils/astronomyTypes";

const textureCache = new Map<string, THREE.CanvasTexture>();

/** Deterministic pseudo-random generator so textures are stable across renders. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createBodyTexture(
  kind: ProceduralTexture,
  baseColor: string,
  accentColor: string,
): THREE.CanvasTexture {
  const key = `${kind}|${baseColor}|${accentColor}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(hashString(key));

  const base = new THREE.Color(baseColor);
  const accent = new THREE.Color(accentColor);

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);

  const css = (c: THREE.Color, alpha = 1) =>
    `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${alpha})`;

  switch (kind) {
    case "sun": {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, css(accent));
      grad.addColorStop(0.5, css(base));
      grad.addColorStop(1, css(accent));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // granulation
      for (let i = 0; i < 900; i++) {
        const c = rand() > 0.5 ? accent.clone().lerp(base, rand()) : base.clone().multiplyScalar(0.85 + rand() * 0.3);
        ctx.fillStyle = css(c, 0.25 + rand() * 0.3);
        const r = 2 + rand() * 7;
        ctx.beginPath();
        ctx.arc(rand() * w, rand() * h, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "banded": {
      const bands = 9 + Math.floor(rand() * 5);
      for (let i = 0; i < bands; i++) {
        const y0 = (i / bands) * h;
        const bh = h / bands;
        const mix = base.clone().lerp(accent, rand());
        ctx.fillStyle = css(mix, 0.85);
        ctx.fillRect(0, y0, w, bh + 1);
        // soften band edges with wavy overlay
        ctx.fillStyle = css(mix.clone().multiplyScalar(1.08), 0.18);
        for (let x = 0; x < w; x += 8) {
          const wob = Math.sin(x * 0.05 + i * 2.4) * bh * 0.25;
          ctx.fillRect(x, y0 + wob, 8, bh * 0.5);
        }
      }
      // storm spots
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = css(accent.clone().multiplyScalar(0.8 + rand() * 0.4), 0.55);
        ctx.beginPath();
        ctx.ellipse(rand() * w, h * (0.3 + rand() * 0.4), 12 + rand() * 18, 5 + rand() * 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "rocky": {
      // mottled surface + craters
      for (let i = 0; i < 1400; i++) {
        const mix = base.clone().lerp(accent, rand() * 0.9);
        ctx.fillStyle = css(mix, 0.2 + rand() * 0.35);
        const r = 1.5 + rand() * 6;
        ctx.beginPath();
        ctx.arc(rand() * w, rand() * h, r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 45; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const r = 3 + rand() * 9;
        ctx.strokeStyle = css(accent, 0.5);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = css(base.clone().multiplyScalar(0.7), 0.5);
        ctx.beginPath();
        ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "earth": {
      const ocean = base;
      const land = accent;
      ctx.fillStyle = css(ocean);
      ctx.fillRect(0, 0, w, h);
      // continents: clustered blobs
      for (let c = 0; c < 8; c++) {
        const cx = rand() * w;
        const cy = h * (0.18 + rand() * 0.64);
        for (let i = 0; i < 60; i++) {
          ctx.fillStyle = css(land.clone().multiplyScalar(0.8 + rand() * 0.45), 0.85);
          ctx.beginPath();
          ctx.arc(cx + (rand() - 0.5) * 90, cy + (rand() - 0.5) * 46, 3 + rand() * 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // polar caps
      ctx.fillStyle = "rgba(240,248,255,0.92)";
      ctx.fillRect(0, 0, w, h * 0.07);
      ctx.fillRect(0, h * 0.93, w, h * 0.07);
      // clouds
      for (let i = 0; i < 130; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.10 + rand() * 0.16})`;
        ctx.beginPath();
        ctx.ellipse(rand() * w, rand() * h, 8 + rand() * 20, 2.5 + rand() * 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "icy": {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, css(base.clone().lerp(accent, 0.35)));
      grad.addColorStop(0.5, css(base));
      grad.addColorStop(1, css(base.clone().lerp(accent, 0.45)));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = css(accent, 0.12 + rand() * 0.12);
        const y = rand() * h;
        ctx.fillRect(0, y, w, 6 + rand() * 16);
      }
      break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  textureCache.set(key, texture);
  return texture;
}

/** Soft radial glow sprite texture (for sun halo, galaxy core, nebula puffs). */
export function createGlowTexture(color: string, innerAlpha = 0.9): THREE.CanvasTexture {
  const key = `glow|${color}|${innerAlpha}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = new THREE.Color(color);
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${rgb},${innerAlpha})`);
  grad.addColorStop(0.35, `rgba(${rgb},${innerAlpha * 0.45})`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}
