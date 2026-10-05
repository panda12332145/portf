"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Book, type BookApi, type BookVisualState } from "./Book";
import type { BookTextures } from "@/lib/textures";
import type { BookPage } from "@/lib/types";

/* ================================================================== */
/*  Chão: poça de luz quente no escuro do estúdio                      */
/* ================================================================== */

function useFloorTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#120d07";
    ctx.fillRect(0, 0, 512, 512);
    const g = ctx.createRadialGradient(256, 256, 10, 256, 256, 250);
    g.addColorStop(0, "rgba(255,214,140,0.30)");
    g.addColorStop(0.35, "rgba(196,148,74,0.14)");
    g.addColorStop(0.7, "rgba(120,84,36,0.05)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

/* ================================================================== */
/*  Poeira dourada                                                     */
/* ================================================================== */

function Dust() {
  const ref = useRef<THREE.Points>(null!);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 160;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 11;
      arr[i * 3 + 1] = Math.random() * 4.4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 7;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.03}
        color="#ffe6b0"
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ================================================================== */
/*  Câmera: parallax suave + enquadramento responsivo                  */
/* ================================================================== */

function CameraRig({
  progressRef,
}: {
  progressRef: React.MutableRefObject<{ openT: number; flipped: number }>;
}) {
  const { camera, pointer, size } = useThree();
  const target = useRef(new THREE.Vector3(0, 1.28, 0));
  const desired = useRef(new THREE.Vector3());
  const intro = useRef(0);

  useFrame((state, dt) => {
    const oT = THREE.MathUtils.clamp(progressRef.current.openT, 0, 1);
    const open = oT * oT * (3 - 2 * oT);

    intro.current = Math.min(1, intro.current + dt / 1.6);
    const ease = 1 - Math.pow(1 - intro.current, 3);

    const aspect = Math.max(size.width / size.height, 0.35);
    const fov = (state.camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const halfTan = Math.tan(fov / 2);

    // altura/largura que precisam caber na tela (livro em pé + dobra aberta)
    // quanto precisa caber na tela: livro fechado (retrato estreito) × aberto
    const neededH = THREE.MathUtils.lerp(3.26, 3.3, open) + 0.3 * (1 - ease);
    const neededW = THREE.MathUtils.lerp(2.62, 4.95, open);
    const dH = neededH / (2 * halfTan);
    const dW = neededW / (2 * halfTan * aspect);
    const dist = Math.max(dH, dW) * 1.02 * (1 + 0.12 * (1 - ease));

    desired.current.set(
      pointer.x * 0.55,
      THREE.MathUtils.lerp(1.98, 1.64, open) - pointer.y * 0.3,
      dist,
    );
    camera.position.lerp(desired.current, 0.06);

    target.current.set(
      pointer.x * 0.12,
      THREE.MathUtils.lerp(1.44, 1.28, open) - pointer.y * 0.1,
      0.12,
    );
    camera.lookAt(target.current);
  });

  return null;
}

/* ================================================================== */
/*  Cena                                                               */
/* ================================================================== */

interface SceneProps {
  textures: BookTextures;
  pages: BookPage[];
  apiRef: React.MutableRefObject<BookApi | null>;
  progressRef: React.MutableRefObject<{ openT: number; flipped: number }>;
  onState: (s: BookVisualState) => void;
  onPageClick?: (slug: string) => void;
  /** fora da tela o loop é pausado (economia de GPU) */
  active?: boolean;
}

export function Scene({
  textures,
  pages,
  apiRef,
  progressRef,
  onState,
  onPageClick,
  active = true,
}: SceneProps) {
  const floor = useFloorTexture();

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 38, near: 0.1, far: 80, position: [0, 2.1, 8] }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#120d07"]} />
      <fog attach="fog" args={["#120d07", 9, 30]} />

      <hemisphereLight args={["#ffeccb", "#3a2c14", 0.55]} />
      <directionalLight
        position={[5.5, 8.5, 4.2]}
        intensity={2.5}
        color="#ffe3b4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={26}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
      />
      <directionalLight position={[-6, 4, -3]} intensity={0.7} color="#b9cbe8" />
      <pointLight position={[0, 1.4, 3.4]} intensity={7} distance={9} color="#ffd9a0" />

      {/* chão */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[18, 64]} />
        <meshStandardMaterial map={floor} roughness={1} metalness={0} />
      </mesh>

      <Dust />
      <Book
        textures={textures}
        pages={pages}
        apiRef={apiRef}
        progressRef={progressRef}
        onState={onState}
        onPageClick={onPageClick}
      />
      <CameraRig progressRef={progressRef} />
    </Canvas>
  );
}
