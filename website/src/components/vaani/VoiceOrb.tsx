import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import type { AgentState } from './useCallSimulation'

const noise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`

const vertex = /* glsl */ `
uniform float uTime; uniform float uAmp;
varying float vNoise; varying vec3 vNormal; varying vec3 vView;
${noise}
void main(){
  float n1 = snoise(normal * 1.4 + vec3(uTime * 0.5));
  float n2 = snoise(normal * 3.8 + vec3(uTime * 1.6));
  float d = n1 * (0.10 + uAmp * 0.32) + n2 * uAmp * 0.14;
  vec3 pos = position + normal * d;
  vNoise = d;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vView = -mv.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`

const fragment = /* glsl */ `
uniform vec3 uColorA; uniform vec3 uColorB; uniform float uAmp; uniform float uAlpha;
varying float vNoise; varying vec3 vNormal; varying vec3 vView;
void main(){
  float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.2);
  vec3 col = mix(uColorA, uColorB, smoothstep(-0.15, 0.35, vNoise));
  col += fres * 0.9;
  gl_FragColor = vec4(col * (0.5 + uAmp * 0.7), uAlpha);
}`

const palette: Record<AgentState, [string, string]> = {
  listening: ['#5ef2ff', '#3b82f6'],
  thinking: ['#ffb020', '#8b5cf6'],
  speaking: ['#8b5cf6', '#f472b6'],
  interrupted: ['#f87171', '#ffb020'],
}

function Blob({
  ampRef,
  state,
  alpha,
  wireframe,
  scale,
}: {
  ampRef: RefObject<number>
  state: AgentState
  alpha: number
  wireframe?: boolean
  scale: number
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.1 },
      uAlpha: { value: alpha },
      uColorA: { value: new THREE.Color(palette.listening[0]) },
      uColorB: { value: new THREE.Color(palette.listening[1]) },
    }),
    [alpha],
  )
  const target = useMemo(() => ({ a: new THREE.Color(), b: new THREE.Color() }), [])

  useFrame((_, dt) => {
    uniforms.uTime.value += dt
    const amp = (ampRef.current ?? 0.1) + Math.sin(uniforms.uTime.value * 18) * 0.04 * (ampRef.current ?? 0)
    uniforms.uAmp.value += (amp - uniforms.uAmp.value) * 0.1
    target.a.set(palette[state][0])
    target.b.set(palette[state][1])
    uniforms.uColorA.value.lerp(target.a, 0.06)
    uniforms.uColorB.value.lerp(target.b, 0.06)
    if (mesh.current) {
      mesh.current.rotation.y += dt * 0.18
      mesh.current.rotation.x += dt * 0.05
    }
  })

  return (
    <mesh ref={mesh} scale={scale}>
      <icosahedronGeometry args={[1, wireframe ? 12 : 48]} />
      <shaderMaterial
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        wireframe={wireframe}
        depthWrite={!wireframe}
      />
    </mesh>
  )
}

export function VoiceOrb({ ampRef, state, active }: { ampRef: RefObject<number>; state: AgentState; active: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.8], fov: 45 }}
      dpr={[1, 2]}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: true }}
    >
      <Blob ampRef={ampRef} state={state} alpha={1} scale={1} />
      <Blob ampRef={ampRef} state={state} alpha={0.18} scale={1.28} wireframe />
    </Canvas>
  )
}
