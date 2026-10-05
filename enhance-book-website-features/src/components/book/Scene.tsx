"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Book } from "./Book";
import type { BookTextures } from "@/lib/textures";
import type { BookApi, BookVisualState } from "./Book";

/* ================================================================== */
/*  Poeira dourada flutuando                                           */
/* ================================================================== */

function Dust() {
  const ref = useRef<THREE.Points>(null!);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 130;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = 0.2 + Math.random() * 3.4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.018;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.22) * 0.08;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.032}
        color="#fff3cf"
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ================================================================== */
/*  Câmera cinematográfica com parallax + intro                        */
/* ================================================================== */

function CameraRig({
  progressRef,
}: {
  progressRef: React.MutableRefObject<{ openT: number; flipped: number }>;
}) {
  const { camera, pointer, size } = useThree();
  const target = useRef(new THREE.Vector3(0, 0.12, 0));
  const desired = useRef(new THREE.Vector3());

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const oT = THREE.MathUtils.clamp(progressRef.current.openT, 0, 1);
    const open = oT * oT * (3 - 2 * oT);

    const aspect = size.width / size.height;
    const responsive = THREE.MathUtils.clamp(1.3 / Math.min(aspect, 1.3), 1, 2.15);

    // dolly de abertura (intro)
    const introK = THREE.MathUtils.clamp(t / 1.7, 0, 1);
    const intro = 1 + 0.28 * (1 - (1 - Math.pow(1 - introK, 3)));

    const dist = THREE.MathUtils.lerp(6.9, 6.35, open) * responsive * intro;
    const baseY = dist * 0.64;
    const baseZ = dist * 0.72;

    desired.current.set(pointer.x * 0.55, baseY - pointer.y * 0.28, baseZ);
    camera.position.lerp(desired.current, 0.055);

    target.current.set(pointer.x * 0.14, 0.1, 0.05);
    camera.lookAt(target.current);
  });

  return null;
}

/* ================================================================== */
/*  Cena                                                               */
/* ================================================================== */

interface SceneProps {
  textures: BookTextures;
  apiRef: React.MutableRefObject<BookApi | null>;
  progressRef: React.MutableRefObject<{ openT: number; flipped: number }>;
  onState: (s: BookVisualState) => void;
  onArtClick?: (order: number) => void;
}

export function Scene({ textures, apiRef, progressRef, onState, onArtClick }: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 38, near: 0.1, far: 60, position: [0, 4.6, 7.6] }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#e8ddc6"]} />
      <fog attach="fog" args={["#e8ddc6", 11, 19]} />

      <hemisphereLight args={["#fff6e2", "#a08a63", 0.8]} />
      <directionalLight
        position={[4.5, 7.5, 3.2]}
        intensity={2.2}
        color="#ffe7bd"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={22}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
      />
      <directionalLight position={[-5, 3.5, -2.5]} intensity={0.5} color="#cfdcff" />

      {/* piso */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
        <circleGeometry args={[16, 48]} />
        <meshStandardMaterial color="#ded0b1" roughness={1} metalness={0} />
      </mesh>

      <Dust />
      <Book
        textures={textures}
        apiRef={apiRef}
        progressRef={progressRef}
        onState={onState}
        onArtClick={onArtClick}
      />
      <CameraRig progressRef={progressRef} />
    </Canvas>
  );
}
