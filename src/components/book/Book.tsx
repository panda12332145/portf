"use client";

import { useMemo, useRef, useImperativeHandle } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { sheetCount, type BookTextures } from "@/lib/textures";
import { ART_AREA } from "@/lib/layout";
import type { BookPage } from "@/lib/types";

/* ================================================================== */
/*  Dimensões do livro (espaço local do livro, antes de ficar de pé)    */
/*    x → da lombada para a borda                                       */
/*    y → espessura (contracapa 0 → capa na frente)                     */
/*    z → altura da página                                              */
/*  O grupo externo gira esse espaço 90° em X: o livro fica EM PÉ.       */
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
/** resolução do canvas de cada página (mesma de src/lib/page-canvas.ts) */
const PAGE_PX = { W: 1024, H: 1350 };

/** Pose do livro de pé: parado no chão, capa virada para quem olha. */
const POSE = {
  closed: { x: -0.92, y: 1.5, yaw: -0.16, pitch: 0.012 },
  open: { x: 0, y: 1.5, yaw: 0, pitch: 0 },
};

const rightY = (i: number, n: number) => BLOCK_TOP + 0.006 + (n - 1 - i) * EPS;
const leftY = (i: number) => 0.078 + i * EPS;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const rawTFromX = (x: number) => clamp01((PAGE_W - x) / (2 * PAGE_W));
const smooth = (t: number) => t * t * (3 - 2 * t);

function localPointToCanvas(x: number, z: number, side: "front" | "back") {
  const u = side === "front" ? x / PAGE_W : 1 + x / PAGE_W;
  return { canvasX: u * PAGE_PX.W, canvasY: (0.5 + z / PAGE_H) * PAGE_PX.H };
}

/** O toque caiu sobre a área da ilustração desta página? */
function isOverArt(canvasX: number, canvasY: number) {
  return (
    canvasX >= ART_AREA.x - 20 &&
    canvasX <= ART_AREA.x + ART_AREA.w + 20 &&
    canvasY >= ART_AREA.y - 20 &&
    canvasY <= ART_AREA.y + ART_AREA.h + 20
  );
}

/* ================================================================== */
/*  Molas — física de folha solta                                      */
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
  /** vai direto para uma página (slug) — usado pela galeria/atalhos */
  goTo: (pageIndex: number) => void;
}

export interface BookVisualState {
  opened: boolean;
  flipped: number;
}

interface BookProps {
  textures: BookTextures;
  pages: BookPage[];
  apiRef: React.MutableRefObject<BookApi | null>;
  progressRef: React.MutableRefObject<{ openT: number; flipped: number }>;
  onState: (s: BookVisualState) => void;
  /** toque sobre a ilustração de uma página (abre a ampliação) */
  onPageClick?: (slug: string) => void;
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

export function Book({
  textures,
  pages,
  apiRef,
  progressRef,
  onState,
  onPageClick,
}: BookProps) {
  const N = sheetCount(pages);
  const rigRef = useRef<THREE.Group>(null!);
  const contentRef = useRef<THREE.Group>(null!);
  const coverPivotRef = useRef<THREE.Group>(null!);
  /** plano matemático do arrasto — vertical, de frente para a câmera */
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.5));
  const rayHitRef = useRef(new THREE.Vector3());

  const springsRef = useRef<Spring[]>(Array.from({ length: N }, () => makeSpring(0)));
  const coverRef = useRef<Spring>(makeSpring(0));
  const lastTRef = useRef<number[]>(Array.from({ length: N }, () => -1));
  const dragRef = useRef<DragState>(null);
  const visualRef = useRef<BookVisualState>({ opened: false, flipped: 0 });
  const poseRef = useRef({ x: POSE.closed.x, y: POSE.closed.y, yaw: POSE.closed.yaw });

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
          base[i * 2] = pos.getX(i) / PAGE_W;
          base[i * 2 + 1] = pos.getZ(i);
        }
        return {
          geo,
          base,
          colsX: new Float32Array(SEG_X + 1),
          colsY: new Float32Array(SEG_X + 1),
        };
      }),
    [N],
  );

  /**
   * Deforma a folha como papel de verdade: integra a direção do papel
   * coluna a coluna (preservando o comprimento do arco), com curvatura
   * que depende do progresso e da velocidade — a ponta fica "molenga"
   * quando a folha se move rápido.
   */
  const deformSheet = (i: number, t: number, vel: number) => {
    const { geo, base, colsX, colsY } = sheetData[i];
    const tc = THREE.MathUtils.clamp(t, -0.03, 1.03);
    const yBase = tc < 0.5 ? rightY(i, N) : leftY(i);

    const bend = THREE.MathUtils.clamp(
      0.55 * Math.sin(Math.PI * clamp01(tc)) + vel * 0.085,
      -0.85,
      0.85,
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

  /* --------------------------- materiais -------------------------- */
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
    [textures],
  );

  const coverMats = useMemo(() => {
    const cloth = () =>
      new THREE.MeshStandardMaterial({ map: textures.cloth, roughness: 0.92, metalness: 0 });
    const paper = new THREE.MeshStandardMaterial({ map: textures.endpaper, roughness: 0.9 });
    const art = new THREE.MeshStandardMaterial({ map: textures.cover, roughness: 0.78 });
    // box: +x, -x, +y (interno), -y (capa), +z, -z
    return [cloth(), cloth(), paper, art, cloth(), cloth()];
  }, [textures]);

  const backMats = useMemo(() => {
    const cloth = () =>
      new THREE.MeshStandardMaterial({ map: textures.cloth, roughness: 0.92, metalness: 0 });
    const paper = new THREE.MeshStandardMaterial({ map: textures.endpaper, roughness: 0.9 });
    return [cloth(), cloth(), paper, cloth(), cloth(), cloth()];
  }, [textures]);

  const blockMats = useMemo(() => {
    const edge = () =>
      new THREE.MeshStandardMaterial({ map: textures.edge, roughness: 0.95, metalness: 0 });
    const top = new THREE.MeshStandardMaterial({ color: "#f1e7cf", roughness: 0.95 });
    const bottom = new THREE.MeshStandardMaterial({ map: textures.cloth, roughness: 0.92 });
    return [edge(), edge(), top, bottom, edge(), edge()];
  }, [textures]);

  const spineMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: textures.spine, roughness: 0.88, metalness: 0 }),
    [textures],
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
    goTo: (pageIndex: number) => {
      if (dragRef.current) return;
      const sheet = Math.floor(Math.max(0, pageIndex) / 2);
      cover.dragging = false;
      cover.target = 1;
      cover.delay = 0;
      springs.forEach((s, i) => {
        s.dragging = false;
        s.delay = 0;
        s.target = i < sheet ? 1 : 0;
      });
    },
  }));

  /* ---------------------------- arrasto --------------------------- */
  const toLocal = (e: ThreeEvent<PointerEvent>) => {
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
    if (Math.abs(ne.clientX - d.downX) + Math.abs(ne.clientY - d.downY) > 8) d.moved = true;
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
        // toque sem arrasto: caiu sobre a ilustração?
        const side: "front" | "back" = d.tapTarget === 1 ? "front" : "back";
        const { canvasX, canvasY } = localPointToCanvas(d.downLocalX, d.downLocalZ, side);
        const page = pages[d.index * 2 + (d.tapTarget === 1 ? 0 : 1)];
        if (onPageClick && page?.image && isOverArt(canvasX, canvasY)) {
          onPageClick(page.slug);
          return;
        }
        s.target = d.tapTarget;
      } else if (Math.abs(s.v) > 1.5) {
        s.target = s.v > 0 ? 1 : 0;
      } else {
        s.target = s.t > 0.45 ? 1 : 0;
      }
      s.v = THREE.MathUtils.clamp(s.v, -3.5, 3.5);
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

  /* ------------------------------ loop ---------------------------- */
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
    const e = smooth(clamp01(oT));

    /* capa com dobradiça na lombada */
    const pivot = coverPivotRef.current;
    pivot.position.y = 0.178 + 0.128 * Math.cos(Math.PI * clamp01(oT));
    pivot.rotation.z = -Math.PI * (1 - clamp01(oT));

    /* o livro inteiro: fecha em pé sobre a mesa, abre de frente */
    const pose = poseRef.current;
    const bob = Math.sin(time * 0.85) * 0.012 * (1 - e);
    const breathe = Math.sin(time * 0.42) * 0.035 * (1 - e);
    pose.x = THREE.MathUtils.lerp(POSE.closed.x, POSE.open.x, e);
    pose.y = THREE.MathUtils.lerp(POSE.closed.y, POSE.open.y, e) + bob;
    pose.yaw = THREE.MathUtils.lerp(POSE.closed.yaw, POSE.open.yaw, e) + breathe;

    const rig = rigRef.current;
    rig.position.set(pose.x, pose.y, 0);
    rig.rotation.set(
      THREE.MathUtils.lerp(POSE.closed.pitch, POSE.open.pitch, e),
      pose.yaw,
      Math.sin(time * 0.6) * 0.006 * (1 - e),
    );

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

  /* ------------------------------ render -------------------------- */
  return (
    <group ref={rigRef} position={[POSE.closed.x, POSE.closed.y, 0]}>
      {/* ── gira o livro para ficar EM PÉ, capa virada para a câmera ── */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <group ref={contentRef}>
          {/* plano invisível de interação (de frente para a câmera) */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0.9, 0.42, 0]}
            onPointerDown={onPlaneDown}
            onPointerMove={onPlaneMove}
            onPointerUp={onPlaneUp}
            onPointerCancel={onPlaneUp}
          >
            <planeGeometry args={[10, 10]} />
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

          {/* miolo */}
          <mesh
            position={[0.03 + (PAGE_W - 0.06) / 2, BACK_T + BLOCK_T / 2, 0]}
            material={blockMats}
            castShadow
            receiveShadow
            onClick={openIfClosed}
          >
            <boxGeometry args={[PAGE_W - 0.06, BLOCK_T, PAGE_H - 0.06]} />
          </mesh>

          {/* lombada (rótulo dourado aparecendo de lado) */}
          <mesh
            position={[-0.015, BLOCK_TOP / 2, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            material={spineMat}
            castShadow
            onClick={openIfClosed}
          >
            <cylinderGeometry args={[0.115, 0.115, COVER_H * 0.99, 24, 1, true]} />
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

          {/* capa dianteira, dobradiça na lombada */}
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
      </group>
    </group>
  );
}
