import * as THREE from "three";

/**
 * The "soft vinyl toy" shader. It runs on the single fused SkinnedMesh:
 *  - three.js skinning chunks (bone texture) deform the baked soft body
 *  - vertex colors carry the pre-blended node colors — no textures at all
 *  - lighting is a hand-tuned cartoon stack:
 *      wrap-diffuse with two soft toon bands   -> matte plush base
 *      warm scatter band at the terminator     -> gummy/subsurface feel
 *      tight stepped specular                  -> toy-plastic sheen
 *      warm fresnel rim                        -> premium studio pop
 *      world-height contact darkening          -> feet feel grounded
 * One cheap pass, no extra lights, mobile-safe.
 */

const VERT = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vColorV;

void main() {
  vColorV = color;

  #include <skinbase_vertex>
  #include <beginnormal_vertex>
  #include <skinnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>

  vec4 worldPos = modelMatrix * vec4( transformed, 1.0 );
  vWorldPos = worldPos.xyz;
  vWorldNormal = normalize( mat3( modelMatrix ) * objectNormal );
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform vec3 uSkyColor;
uniform vec3 uGroundColor;
uniform vec3 uRimColor;
uniform vec3 uScatterColor;
uniform float uGroundFade;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vColorV;

void main() {
  vec3 n = normalize( vWorldNormal );
  vec3 v = normalize( cameraPosition - vWorldPos );
  vec3 l = normalize( uLightDir );

  float ndl = dot( n, l );
  float wrap = clamp( ( ndl + 0.5 ) / 1.5, 0.0, 1.0 );

  // two soft cartoon bands instead of a hard cel edge
  float band = smoothstep( 0.22, 0.52, wrap ) * 0.62 + smoothstep( 0.6, 0.88, wrap ) * 0.38;

  vec3 hemi = mix( uGroundColor, uSkyColor, n.y * 0.5 + 0.5 );
  vec3 col = vColorV * ( hemi + uLightColor * band );

  // warm scatter at the light terminator: fakes soft translucent flesh
  float scatter = smoothstep( 0.5, 0.0, abs( wrap - 0.32 ) );
  col += uScatterColor * vColorV * scatter * 0.55;

  // tight toy-plastic sheen
  vec3 h = normalize( l + v );
  float spec = pow( max( dot( n, h ), 0.0 ), 90.0 );
  col += vec3( 1.0 ) * smoothstep( 0.24, 0.5, spec ) * 0.24 * ( 0.35 + 0.65 * band );

  // studio rim, warmer on the lit side
  float fresnel = pow( 1.0 - max( dot( n, v ), 0.0 ), 3.0 );
  col += uRimColor * fresnel * ( 0.3 + 0.7 * band ) * 0.5;

  // cheap grounding: fade to shadow near the floor
  float ao = smoothstep( 0.0, uGroundFade, vWorldPos.y );
  col *= mix( 0.6, 1.0, ao );

  // gentle saturation push keeps the candy colors from washing out under ACES
  float luma = dot( col, vec3( 0.2126, 0.7152, 0.0722 ) );
  col = mix( vec3( luma ), col, 1.18 );

  gl_FragColor = vec4( col, 1.0 );

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export interface StudioLightRig {
  lightDir: THREE.Vector3;
  lightColor: THREE.Color;
  skyColor: THREE.Color;
  groundColor: THREE.Color;
  rimColor: THREE.Color;
  scatterColor: THREE.Color;
}

export const DEFAULT_RIG: StudioLightRig = {
  lightDir: new THREE.Vector3(2.4, 4.2, 2.6).normalize(),
  lightColor: new THREE.Color("#fff1da").multiplyScalar(0.95),
  skyColor: new THREE.Color("#fff6e8").multiplyScalar(0.42),
  groundColor: new THREE.Color("#d9a96f").multiplyScalar(0.34),
  rimColor: new THREE.Color("#ffd9b8"),
  scatterColor: new THREE.Color("#ff9d6b"),
};

export function createFusedToonMaterial(rig: StudioLightRig = DEFAULT_RIG): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    vertexColors: true,
    uniforms: {
      uLightDir: { value: rig.lightDir.clone() },
      uLightColor: { value: rig.lightColor.clone() },
      uSkyColor: { value: rig.skyColor.clone() },
      uGroundColor: { value: rig.groundColor.clone() },
      uRimColor: { value: rig.rimColor.clone() },
      uScatterColor: { value: rig.scatterColor.clone() },
      uGroundFade: { value: 0.32 },
    },
  });
}
