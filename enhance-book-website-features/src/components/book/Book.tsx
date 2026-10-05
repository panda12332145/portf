"use client";

import { useMemo, useRef, useImperativeHandle } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { SHEET_COUNT } from "@/lib/book-data";
import { PAGE_ART_RECT, PW, PH } from "@/lib/textures";
import type { BookTextures } from "@/lib/textures";

/* ================================================================== */
/*  Dimensões do livro                                                 */
/* ================================================================== */

const PAGE_W = 2.2;
const PAGE_H = 2.9;
const COVER_W = PAGE_W + 0.06;
const COVER_H = PAGE_H + 0.08;
const COVER_T = 0.05;
const BACK_T = 0.05;
const BLOCK_T = 0.185;
const BLOCK_TOP = BACK_T + BLOCK_T;
const EPS = 0.0085;
const SEG_X = 30;
const SEG_Y = 6;
const N = SHEET_COUNT;

const rightY = (i: number) => BLOCK_TOP + 0.006 + (N - 1 - i) * EPS;
const leftY = (i: number) => 0.078 + i * EPS;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const rawTFromX = (x: number) => clamp01((PAGE_W - x) / (2 * PAGE_W));

/** Converte um ponto local (x no eixo da página, z ao longo da lombada),
 * para uma página em repouso (t=0 ou t=1), em coordenadas de pixel do
 * canvas de textura da página — usado para saber se o toque caiu sobre a
 * ilustração. */
function localPointToCanvas(x: number, z: number, side: "front" | "back") {
  const u = side === "front" ? x / PAGE_W : 1 + x / PAGE_W;
  const canvasX = u * PW;
  const canvasY = (0.5 + z / PAGE_H) * PH;
  return { canvasX, canvasY };
}

function isInsideArtRect(canvasX: number, canvasY: number) {
  const { x, y, w, h } = PAGE_ART_RECT;
  return canvasX >= x && canvasX <= x + w && canvasY >= y && canvasY <= y + h;
}

/* ================================================================== */
/*  Molas (springs) — física de folha solta                            */
/* ================================================================== */

interface Spring {
  t: number;
  v: number;
  target: number;
  dragging: boolean;
  delay: number;
}

const makeSpring = (t = 0): Spring => ({ t, v: 0, target: t, dragging: false, delay: 0 });

function stepSpring(s: Spring, dt: number, k: number, c: number) {
  if (s.dragging) return;
  if (s.delay > 0) {
    s.delay -= dt;
    return;
  }
  const a = (s.target - s.t) * k - c * s.v;
  s.v += a * Math.min(dt, 0.05);
  s.t += s.v * dt;
  if (Math.abs(s.target - s.t) < 4e-4 && Math.abs(s.v) < 4e-3) {
    s.t = s.target;
    s.v = 0;
  }
}

/* ================================================================== */
/*  Tipos                                                              */
/* ================================================================== */

export interface BookApi {
  open: () => void;
  close: () => void;
  flipNext: () => void;
  flipPrev: () => void;
}

export interface BookVisualState {
  opened: boolean;
  flipped: number;
}

interface BookProps {
  textures: BookTextures;
  apiRef: React.MutableRefObject<BookApi | null>;
  progressRef: React.MutableRefObject<{ openT: number; flipped: number }>;
  onState: (s: BookVisualState) => void;
  /** chamado com o número de ordem (`order`) da arte quando o usuário toca
   * diretamente sobre a ilustração de uma página aberta. */
  onArtClick?: (order: number) => void;
}

type DragState = {
  kind: "sheet" | "cover";
  index: number;
  grab: number;
  tapTarget: number;
  moved: boolean;
  downX: number;
  downY: number;
  downLocalX: number;
  downLocalZ: number;
  lastT: number;
  lastTime: number;
} | null;

/* ================================================================== */
/*  Componente                                                         */
/* ================================================================== */

export function Book({ textures, apiRef, progressRef, onState, onArtClick }: BookProps) {
  const contentRef = useRef<THREE.Group>(null!);
  const coverPivotRef = useRef<THREE.Group>(null!);
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.36));
  const rayHitRef = useRef(new THREE.Vector3());

  const springsRef = useRef<Spring[]>(Array.from({ length: N }, () => makeSpring(0)));
  const coverRef = useRef<Spring>(makeSpring(0));
  const lastTRef = useRef<number[]>(Array.from({ length: N }, () => -1));
  const dragRef = useRef<DragState>(null);
  const visualRef = useRef<BookVisualState>({ opened: false, flipped: 0 });

  /* ------------------------- geometria das folhas ----------------- */
  const sheetData = useMemo(
    () =>
      Array.from({ length: N }, () => {
        const geo = new THREE.PlaneGeometry(PAGE_W, PAGE_H, SEG_X, SEG_Y);
        geo.rotateX(-Math.PI / 2);
        geo.translate(PAGE_W / 2, 0, 0);
        const pos = geo.attributes.position as THREE.BufferAttribute;
        const count = pos.count;
        const base = new Float32Array(count * 2);
        for (let i = 0; i < count; i++) {
          base[i * 2] = pos.getX(i) / PAGE_W; // s: 0 (lombada) → 1 (borda)
          base[i * 2 + 1] = pos.getZ(i); // z ao longo da lombada
        }
        return {
          geo,
          base,
          colsX: new Float32Array(SEG_X + 1),
          colsY: new Float32Array(SEG_X + 1),
        };
      }),
    []
  );

  /**
   * Deforma a folha como papel de verdade: integra a direção do papel
   * coluna a coluna (preserva o comprimento do arco), com curvatura que
   * depende do progresso e da velocidade — a ponta fica "para trás",
   * molenga, quando a folha se move rápido.
   */
  const deformSheet = (i: number, t: number, vel: number) => {
    const { geo, base, colsX, colsY } = sheetData[i];
    const tc = THREE.MathUtils.clamp(t, -0.03, 1.03);
    const yBase = tc < 0.5 ? rightY(i) : leftY(i);

    const bend = THREE.MathUtils.clamp(
      0.55 * Math.sin(Math.PI * clamp01(tc)) + vel * 0.085,
      -0.85,
      0.85
    );

    const ds = PAGE_W / SEG_X;
    colsX[0] = 0;
    colsY[0] = yBase;
    for (let j = 1; j <= SEG_X; j++) {
      const sm = (j - 0.5) / SEG_X;
      let theta = Math.PI * tc - bend * Math.pow(sm, 1.55);
      theta = THREE.MathUtils.clamp(theta, -0.42, Math.PI + 0.42);
      colsX[j] = colsX[j - 1] + Math.cos(theta) * ds;
      colsY[j] = colsY[j - 1] + Math.sin(theta) * ds;
    }

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const bow = Math.sin(Math.PI * clamp01(tc));
    for (let v = 0; v < pos.count; v++) {
      const s = base[v * 2];
      const bz = base[v * 2 + 1];
      const ix = Math.min(SEG_X, Math.round(s * SEG_X));
      pos.setXYZ(v, colsX[ix], colsY[ix], bz * (1 - bow * 0.16 * s));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  };

  /* ------------------------- materiais ---------------------------- */
  const sheetMats = useMemo(
    () =>
      textures.sheets.map((st) => ({
        front: new THREE.MeshStandardMaterial({
          map: st.front,
          roughness: 0.86,
          metalness: 0,
          side: THREE.FrontSide,
        }),
        back: new THREE.MeshStandardMaterial({
          map: st.back,
          roughness: 0.86,
          metalness: 0,
          side: THREE.BackSide,
        }),
      })),
    [textures]
  );

  const coverMats = useMemo(() => {
    const cloth = () =>
      new THREE.MeshStandardMaterial({ map: textures.cloth, roughness: 0.92, metalness: 0 });
    const paper = new THREE.MeshStandardMaterial({
      map: textures.endpaper,
      roughness: 0.9,
      metalness: 0,
    });
    const art = new THREE.MeshStandardMaterial({
      map: textures.cover,
      roughness: 0.8,
      metalness: 0,
    });
    // box: +x, -x, +y (dentro), -y (fora), +z, -z
    return [cloth(), cloth(), paper, art, cloth(), cloth()];
  }, [textures]);

  const backMats = useMemo(() => {
    const cloth = () =>
      new THREE.MeshStandardMaterial({ map: textures.cloth, roughness: 0.92, metalness: 0 });
    const paper = new THREE.MeshStandardMaterial({
      map: textures.endpaper,
      roughness: 0.9,
      metalness: 0,
    });
    return [cloth(), cloth(), paper, cloth(), cloth(), cloth()];
  }, [textures]);

  const blockMats = useMemo(() => {
    const edge = () =>
      new THREE.MeshStandardMaterial({ map: textures.edge, roughness: 0.95, metalness: 0 });
    const top = new THREE.MeshStandardMaterial({ color: "#f1e7cf", roughness: 0.95, metalness: 0 });
    const bottom = new THREE.MeshStandardMaterial({ map: textures.cloth, roughness: 0.92 });
    return [edge(), edge(), top, bottom, edge(), edge()];
  }, [textures]);

  const spineMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: textures.cloth, roughness: 0.88, metalness: 0 }),
    [textures]
  );

  /* ------------------------- API imperativa ----------------------- */
  const springs = springsRef.current;
  const cover = coverRef.current;

  const countFlipped = () => springs.reduce((a, s) => a + (s.t > 0.5 ? 1 : 0), 0);

  useImperativeHandle(apiRef, () => ({
    open: () => {
      cover.dragging = false;
      cover.delay = 0;
      cover.target = 1;
    },
    close: () => {
      const fc = countFlipped();
      for (let i = 0; i < fc; i++) {
        const s = springs[i];
        s.dragging = false;
        s.target = 0;
        s.delay = (fc - 1 - i) * 0.13;
      }
      cover.dragging = false;
      cover.target = 0;
      cover.delay = fc * 0.13 + 0.3;
    },
    flipNext: () => {
      if (dragRef.current) return;
      if (cover.t < 0.5 || cover.target < 1) {
        cover.dragging = false;
        cover.delay = 0;
        cover.target = 1;
        return;
      }
      const fc = countFlipped();
      if (fc < N) {
        const s = springs[fc];
        s.dragging = false;
        s.delay = 0;
        s.target = 1;
      }
    },
    flipPrev: () => {
      if (dragRef.current) return;
      const fc = countFlipped();
      if (fc > 0) {
        const s = springs[fc - 1];
        s.dragging = false;
        s.delay = 0;
        s.target = 0;
      } else if (cover.t > 0.5) {
        cover.dragging = false;
        cover.target = 0;
        cover.delay = 0.05;
      }
    },
  }));

  /* ------------------------- arrastar ----------------------------- */
  const toLocal = (e: ThreeEvent<PointerEvent>) => {
    // projeta o raio do ponteiro num plano matemático — estável durante o gesto
    if (e.ray.intersectPlane(dragPlaneRef.current, rayHitRef.current)) {
      return contentRef.current.worldToLocal(rayHitRef.current.clone());
    }
    return contentRef.current.worldToLocal(e.point.clone());
  };

  const onPlaneDown = (e: ThreeEvent<PointerEvent>) => {
    if (dragRef.current) return;
    if (cover.t < 0.9) return;
    const p = toLocal(e);
    if (Math.abs(p.z) > COVER_H / 2 + 0.4) return;
    const ne = e.nativeEvent;
    const now = performance.now();
    const fc = countFlipped();

    if (p.x > 0) {
      if (fc >= N || p.x > PAGE_W + 0.4) return;
      e.stopPropagation();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      const s = springs[fc];
      s.dragging = true;
      s.delay = 0;
      s.v = 0;
      dragRef.current = {
        kind: "sheet",
        index: fc,
        grab: s.t - rawTFromX(p.x),
        tapTarget: 1,
        moved: false,
        downX: ne.clientX,
        downY: ne.clientY,
        downLocalX: p.x,
        downLocalZ: p.z,
        lastT: s.t,
        lastTime: now,
      };
    } else {
      if (p.x < -(COVER_W + 0.4)) return;
      if (fc > 0) {
        e.stopPropagation();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        const i = fc - 1;
        const s = springs[i];
        s.dragging = true;
        s.v = 0;
        dragRef.current = {
          kind: "sheet",
          index: i,
          grab: s.t - rawTFromX(p.x),
          tapTarget: 0,
          moved: false,
          downX: ne.clientX,
          downY: ne.clientY,
          downLocalX: p.x,
          downLocalZ: p.z,
          lastT: s.t,
          lastTime: now,
        };
      } else if (springs.every((s) => s.t < 0.02)) {
        e.stopPropagation();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        cover.dragging = true;
        cover.v = 0;
        dragRef.current = {
          kind: "cover",
          index: -1,
          grab: cover.t - clamp01(-p.x / COVER_W),
          tapTarget: cover.t > 0.5 ? 1 : 0,
          moved: false,
          downX: ne.clientX,
          downY: ne.clientY,
          downLocalX: p.x,
          downLocalZ: p.z,
          lastT: cover.t,
          lastTime: now,
        };
      }
    }
  };

  const onPlaneMove = (e: ThreeEvent<PointerEvent>) => {
    const d = dragRef.current;
    if (!d) return;
    const p = toLocal(e);
    const ne = e.nativeEvent;
    const now = performance.now();
    if (Math.abs(ne.clientX - d.downX) + Math.abs(ne.clientY - d.downY) > 8) {
      d.moved = true;
    }
    const dt = Math.max((now - d.lastTime) / 1000, 1e-3);

    if (d.kind === "sheet") {
      const s = springs[d.index];
      const t = clamp01(rawTFromX(p.x) + d.grab);
      const vel = (t - d.lastT) / dt;
      s.v = s.v * 0.6 + vel * 0.4;
      s.t = t;
      d.lastT = t;
      d.lastTime = now;
    } else {
      const t = clamp01(clamp01(-p.x / COVER_W) + d.grab);
      const vel = (t - d.lastT) / dt;
      cover.v = cover.v * 0.6 + vel * 0.4;
      cover.t = t;
      d.lastT = t;
      d.lastTime = now;
    }
  };

  const onPlaneUp = (e: ThreeEvent<PointerEvent>) => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);

    if (d.kind === "sheet") {
      const s = springs[d.index];
      s.dragging = false;

      if (!d.moved) {
        // toque sem arrasto: verifica se caiu sobre a ilustração da página
        const side: "front" | "back" = d.tapTarget === 1 ? "front" : "back";
        const { canvasX, canvasY } = localPointToCanvas(d.downLocalX, d.downLocalZ, side);
        if (onArtClick && isInsideArtRect(canvasX, canvasY)) {
          const order = d.tapTarget === 1 ? d.index * 2 + 1 : d.index * 2 + 2;
          onArtClick(order);
          return;
        }
        s.target = d.tapTarget;
      } else if (Math.abs(s.v) > 1.5) {
        s.target = s.v > 0 ? 1 : 0;
      } else {
        s.target = s.t > 0.45 ? 1 : 0;
      }
      const avgV = THREE.MathUtils.clamp(s.v, -3.5, 3.5);
      s.v = avgV;
    } else {
      cover.dragging = false;
      if (!d.moved) {
        cover.target = d.tapTarget;
      } else if (Math.abs(cover.v) > 1.5) {
        cover.target = cover.v > 0 ? 1 : 0;
      } else {
        cover.target = cover.t > 0.5 ? 1 : 0;
      }
      cover.v = THREE.MathUtils.clamp(cover.v, -3, 3);
    }
  };

  const openIfClosed = (e: ThreeEvent<MouseEvent>) => {
    if (cover.t < 0.5) {
      e.stopPropagation();
      cover.dragging = false;
      cover.delay = 0;
      cover.target = 1;
    }
  };

  /* ------------------------- loop --------------------------------- */
  useFrame((state, dt) => {
    const time = state.clock.elapsedTime;

    for (let i = 0; i < N; i++) {
      const s = springs[i];
      stepSpring(s, dt, 92, 14);
      const last = lastTRef.current[i];
      if (Math.abs(s.t - last) > 1e-5 || Math.abs(s.v) > 5e-4 || s.dragging || last < 0) {
        deformSheet(i, s.t, s.v);
        lastTRef.current[i] = s.t;
      }
    }

    stepSpring(cover, dt, 56, 13.2);
    const oT = THREE.MathUtils.clamp(cover.t, -0.02, 1.02);
    const oC = clamp01(oT);
    const e = oC * oC * (3 - 2 * oC);

    const pivot = coverPivotRef.current;
    pivot.position.y = 0.178 + 0.128 * Math.cos(Math.PI * oC);
    pivot.rotation.z = -Math.PI * (1 - oC);

    const content = contentRef.current;
    content.position.x = THREE.MathUtils.lerp(-0.992, 0.03, e);
    content.position.z = THREE.MathUtils.lerp(-0.541, 0, e);
    content.position.y = (1 - e) * (0.015 + 0.028 * Math.sin(time * 0.9));
    content.rotation.y = (1 - e) * (-0.5 + Math.sin(time * 0.3) * 0.045);

    const p = progressRef.current;
    p.openT = oT;
    const fc = countFlipped();
    p.flipped = fc;
    const vis = visualRef.current;
    const opened = oT > 0.55;
    if (vis.opened !== opened || vis.flipped !== fc) {
      vis.opened = opened;
      vis.flipped = fc;
      onState({ ...vis });
    }
  });

  /* ------------------------- render ------------------------------- */
  return (
    <group ref={contentRef}>
      {/* plano invisível de interação */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0.9, 0.36, 0]}
        onPointerDown={onPlaneDown}
        onPointerMove={onPlaneMove}
        onPointerUp={onPlaneUp}
        onPointerCancel={onPlaneUp}
      >
        <planeGeometry args={[16, 16]} />
        <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
      </mesh>

      {/* contracapa */}
      <mesh
        position={[COVER_W / 2 - 0.03, BACK_T / 2, 0]}
        material={backMats}
        castShadow
        receiveShadow
        onClick={openIfClosed}
      >
        <boxGeometry args={[COVER_W, BACK_T, COVER_H]} />
      </mesh>

      {/* miolo (bloco de páginas) */}
      <mesh
        position={[0.03 + (PAGE_W - 0.06) / 2, BACK_T + BLOCK_T / 2, 0]}
        material={blockMats}
        castShadow
        receiveShadow
        onClick={openIfClosed}
      >
        <boxGeometry args={[PAGE_W - 0.06, BLOCK_T, PAGE_H - 0.06]} />
      </mesh>

      {/* lombada */}
      <mesh
        position={[-0.015, BLOCK_TOP / 2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material={spineMat}
        castShadow
        onClick={openIfClosed}
      >
        <cylinderGeometry args={[0.115, 0.115, COVER_H * 0.99, 20, 1, true]} />
      </mesh>

      {/* folhas */}
      {sheetData.map((sd, i) => (
        <group key={i}>
          <mesh
            geometry={sd.geo}
            material={sheetMats[i].front}
            castShadow
            receiveShadow
            frustumCulled={false}
          />
          <mesh
            geometry={sd.geo}
            material={sheetMats[i].back}
            position={[0, -0.0012, 0]}
            frustumCulled={false}
          />
        </group>
      ))}

      {/* capa dianteira com dobradiça na lombada */}
      <group ref={coverPivotRef} position={[0, 0.178, 0]}>
        <mesh
          position={[-COVER_W / 2, 0, 0]}
          material={coverMats}
          castShadow
          onClick={openIfClosed}
          onPointerOver={() => {
            if (cover.t < 0.5) document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <boxGeometry args={[COVER_W, COVER_T, COVER_H]} />
        </mesh>
      </group>
    </group>
  );
}
