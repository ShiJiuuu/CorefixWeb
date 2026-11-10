import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import type { ReactNode } from "react";
import { createContext, useContext, useLayoutEffect } from "react";
import { Euler, PerspectiveCamera, PMREMGenerator, Vector3 } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

const ACCENT = "#efc79a";
const SILVER = "#d2d4d1";
const PCB = "#1f2925";
const STAGE_X = 3.4;
const STAGE_Y = 0.58;

// Internal hardware is 80% of the previous 0.8 layout (0.64 of the shell).
const MODULE_SCALE = 0.64;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const ShellFade = createContext(1);

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

type Vec3 = [number, number, number];

type BoxProps = {
  readonly size: Vec3;
  readonly position?: Vec3;
  readonly rotation?: Vec3;
  readonly color?: string;
  readonly metalness?: number;
  readonly roughness?: number;
  readonly opacity?: number;
  readonly emissive?: string;
  readonly emissiveIntensity?: number;
};

const Box = ({
  size,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = SILVER,
  metalness = 0.94,
  roughness = 0.2,
  opacity = 1,
}: BoxProps) => {
  const fade = useContext(ShellFade);
  const finalOpacity = opacity * fade;

  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        clearcoat={0.28}
        clearcoatRoughness={0.18}
        ior={1.45}
        reflectivity={0.75}
        anisotropy={0.32}
        transparent={finalOpacity < 1}
        opacity={finalOpacity}
      />
    </mesh>
  );
};

const MetalEnvironment = () => {
  const { gl, scene } = useThree();

  useLayoutEffect(() => {
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = generator.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.72;

    return () => {
      scene.environment = null;
      scene.environmentIntensity = 1;
      target.dispose();
      room.dispose();
      generator.dispose();
    };
  }, [gl, scene]);

  return null;
};

type Ease = (t: number) => number;

const linearEase: Ease = (t) => t;

/**
 * Short unlatch beat (the panels barely separate), then a hard outward
 * acceleration. This keeps the burst readable instead of teleporting apart.
 */
const blastEase: Ease = (t) => {
  const crack = 0.3;

  if (t < crack) {
    return 0.06 * (t / crack);
  }

  const release = (t - crack) / (1 - crack);
  return 0.06 + 0.94 * (1 - Math.pow(1 - release, 3));
};

/** Remaps a global 0-1 progress into a delayed local 0-1 window. */
const stagedProgress = (progress: number, delay: number) => {
  if (progress <= delay) {
    return 0;
  }
  return Math.min(1, (progress - delay) / (1 - delay));
};

const ExplodedPiece = ({
  children,
  progress,
  offset,
  rotation = [0, 0, 0],
  delay = 0,
  easing = linearEase,
  pivot = [0, 0, 0],
  shrink = 0,
  fadeAfter,
}: {
  readonly children: ReactNode;
  readonly progress: number;
  readonly offset: Vec3;
  readonly rotation?: Vec3;
  readonly delay?: number;
  readonly easing?: Ease;
  /** Rotate around the piece's own centre instead of the chassis origin. */
  readonly pivot?: Vec3;
  /** Recede slightly while flying so large panels do not dominate the frame. */
  readonly shrink?: number;
  /** Fade the piece to transparent once its travel passes this value. */
  readonly fadeAfter?: number;
}) => {
  const travel = easing(stagedProgress(progress, delay));
  const spin = rotation.map((value) => value * travel) as Vec3;
  const back = pivot.map((value) => -value) as Vec3;
  const fade =
    fadeAfter === undefined ? 1 : 1 - smoothstep(fadeAfter, 1, travel);

  return (
    <group
      position={offset.map((value) => value * travel) as Vec3}
      scale={1 - shrink * travel}
    >
      <ShellFade.Provider value={fade}>
        <group position={pivot}>
          <group rotation={spin}>
            <group position={back}>{children}</group>
          </group>
        </group>
      </ShellFade.Provider>
    </group>
  );
};

const Fan = ({
  position,
  radius = 0.38,
  spin = 0,
  dark = false,
}: {
  readonly position: Vec3;
  readonly radius?: number;
  readonly spin?: number;
  readonly dark?: boolean;
}) => {
  const bladeColor = dark ? "#5b5f5f" : "#a6a8a6";
  const fade = useContext(ShellFade);

  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, 0.12, 40]} />
        <meshPhysicalMaterial
          color={dark ? "#191b1b" : "#4b4e4e"}
          metalness={0.76}
          roughness={0.3}
          transparent={fade < 1}
          opacity={fade}
        />
      </mesh>
      <mesh position={[0, 0, 0.072]}>
        <torusGeometry args={[radius * 0.8, 0.018, 8, 44]} />
        <meshPhysicalMaterial
          color={dark ? "#3a3d3d" : "#b7b8b5"}
          metalness={0.7}
          roughness={0.36}
          transparent={fade < 1}
          opacity={fade}
        />
      </mesh>
      <mesh position={[0, 0, 0.079]}>
        <torusGeometry args={[radius * 1.02, 0.012, 8, 44]} />
        <meshPhysicalMaterial
          color={dark ? "#4b4f4e" : "#d0d0cc"}
          metalness={0.78}
          roughness={0.28}
          transparent={fade < 1}
          opacity={fade}
        />
      </mesh>
      <group rotation={[0, 0, spin]}>
        {Array.from({ length: 7 }).map((_, index) => {
          const angle = (index / 7) * Math.PI * 2;
          return (
            <mesh
              key={index}
              position={[
                Math.cos(angle) * radius * 0.35,
                Math.sin(angle) * radius * 0.35,
                0.08,
              ]}
              rotation={[0, 0, angle]}
            >
              <boxGeometry args={[radius * 0.57, radius * 0.065, 0.018]} />
              <meshPhysicalMaterial
                color={bladeColor}
                metalness={0.55}
                roughness={0.42}
                transparent={fade < 1}
                opacity={fade}
              />
            </mesh>
          );
        })}
      </group>
      <mesh position={[0, 0, 0.095]}>
        <circleGeometry args={[radius * 0.2, 28]} />
        <meshPhysicalMaterial
          color="#1b1c1c"
          metalness={0.5}
          roughness={0.3}
          transparent={fade < 1}
          opacity={fade}
        />
      </mesh>
      {[
        [-0.78, -0.78],
        [0.78, -0.78],
        [-0.78, 0.78],
        [0.78, 0.78],
      ].map(([x, y], index) => {
        return (
          <mesh key={index} position={[x * radius, y * radius, 0.083]}>
            <circleGeometry args={[radius * 0.075, 12]} />
            <meshPhysicalMaterial
              color={dark ? "#777b79" : "#d6d6d1"}
              metalness={0.78}
              roughness={0.26}
              transparent={fade < 1}
              opacity={fade}
            />
          </mesh>
        );
      })}
    </group>
  );
};

const Screw = ({
  position,
  radius = 0.038,
  color = "#b8bab7",
}: {
  readonly position: Vec3;
  readonly radius?: number;
  readonly color?: string;
}) => {
  const fade = useContext(ShellFade);

  return (
    <mesh position={position}>
      <cylinderGeometry args={[radius, radius, 0.018, 16]} />
      <meshPhysicalMaterial
        color={color}
        metalness={0.86}
        roughness={0.22}
        transparent={fade < 1}
        opacity={fade}
      />
    </mesh>
  );
};

const PerforatedPanel = ({
  size,
  position,
  color = "#2a2d2d",
  columns = 18,
  rows = 8,
  holeColor = "#0b0c0c",
}: {
  readonly size: Vec3;
  readonly position: Vec3;
  readonly color?: string;
  readonly columns?: number;
  readonly rows?: number;
  readonly holeColor?: string;
}) => {
  const [width, height, depth] = size;

  return (
    <group position={position}>
      <Box size={size} color={color} metalness={0.74} roughness={0.32} />
      {Array.from({ length: rows }).map((_, row) => {
        return Array.from({ length: columns }).map((__, column) => {
          const x = -width * 0.43 + (column / (columns - 1)) * width * 0.86;
          const y = -height * 0.37 + (row / (rows - 1)) * height * 0.74;

          return (
            <Box
              key={`${row}-${column}`}
              size={[width * 0.025, height * 0.035, depth + 0.006]}
              position={[x, y, 0.003]}
              color={holeColor}
              metalness={0.25}
              roughness={0.7}
            />
          );
        });
      })}
    </group>
  );
};

const CpuModule = ({
  x,
  z,
  y,
}: {
  readonly x: number;
  readonly z: number;
  readonly y: number;
}) => {
  return (
    <group>
      <Box
        size={[0.98, 0.22, 0.88]}
        position={[x, y, z]}
        color="#6e7271"
        metalness={0.82}
        roughness={0.27}
      />
      {Array.from({ length: 11 }).map((_, index) => {
        const finX = x - 0.39 + index * 0.078;
        return (
          <Box
            key={index}
            size={[0.036, 0.36, 0.72]}
            position={[finX, y + 0.23, z]}
            color="#b1b3b0"
            metalness={0.8}
            roughness={0.25}
          />
        );
      })}
      <Box
        size={[0.62, 0.07, 0.56]}
        position={[x, y - 0.13, z]}
        color="#353938"
        metalness={0.48}
        roughness={0.4}
      />
      {[-1, 1].map((side) => {
        return (
          <group key={side}>
            <Box
              size={[0.055, 0.12, 0.82]}
              position={[x + side * 0.56, y + 0.02, z]}
              color="#b6b8b4"
              metalness={0.82}
              roughness={0.26}
            />
            <Box
              size={[0.1, 0.035, 0.72]}
              position={[x + side * 0.45, y + 0.19, z]}
              color="#6f7472"
              metalness={0.78}
              roughness={0.28}
            />
          </group>
        );
      })}
      {[
        [-0.49, -0.42],
        [0.49, -0.42],
        [-0.49, 0.42],
        [0.49, 0.42],
      ].map(([dx, dz], index) => {
        return (
          <Screw
            key={index}
            position={[x + dx, y + 0.08, z + dz]}
            radius={0.026}
          />
        );
      })}
    </group>
  );
};

const MemoryBank = ({
  x,
  y,
  z,
}: {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}) => {
  return (
    <group>
      <Box
        size={[0.92, 0.06, 0.5]}
        position={[x, y - 0.02, z]}
        color="#262a29"
        metalness={0.45}
        roughness={0.45}
      />
      {Array.from({ length: 8 }).map((_, index) => {
        const moduleX = x - 0.385 + index * 0.11;
        return (
          <group key={index}>
            <Box
              size={[0.052, 0.16, 0.42]}
              position={[moduleX, y + 0.06, z]}
              color={index % 3 === 0 ? "#34302a" : "#242625"}
              metalness={0.48}
              roughness={0.43}
            />
            <Box
              size={[0.052, 0.025, 0.43]}
              position={[moduleX, y + 0.155, z]}
              color="#c6a978"
              metalness={0.55}
              roughness={0.34}
            />
          </group>
        );
      })}
      {[-1, 1].map((side) => {
        return (
          <Box
            key={side}
            size={[0.045, 0.13, 0.45]}
            position={[x + side * 0.47, y + 0.06, z]}
            color="#b8b9b5"
            metalness={0.76}
            roughness={0.28}
          />
        );
      })}
      <Box
        size={[0.86, 0.012, 0.035]}
        position={[x, y + 0.17, z - 0.18]}
        color="#d5ba86"
        metalness={0.45}
        roughness={0.34}
      />
    </group>
  );
};

const GpuModule = ({
  x,
  y,
  z,
  index,
  rotation = [0, 0, 0],
}: {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly index: number;
  readonly rotation?: Vec3;
}) => {
  return (
    <group position={[x, y, z]} rotation={rotation}>
      <Box
        size={[0.94, 0.11, 1.72]}
        position={[0, 0, 0]}
        color="#303534"
        metalness={0.56}
        roughness={0.4}
      />
      <Box
        size={[0.35, 0.1, 0.35]}
        position={[0, 0.09, -0.55]}
        color="#151817"
        metalness={0.36}
        roughness={0.35}
      />
      {Array.from({ length: 8 }).map((_, stack) => {
        const stackZ = -0.71 + stack * 0.095;
        return (
          <Box
            key={stack}
            size={[0.11, 0.08, 0.075]}
            position={[stack % 2 === 0 ? -0.26 : 0.26, 0.085, stackZ]}
            color="#4b514f"
            metalness={0.62}
            roughness={0.32}
          />
        );
      })}
      <Box
        size={[0.82, 0.34, 1.1]}
        position={[0, 0.25, 0.27]}
        color="#777b79"
        metalness={0.8}
        roughness={0.27}
      />
      {Array.from({ length: 9 }).map((_, fin) => {
        return (
          <Box
            key={fin}
            size={[0.025, 0.31, 1.05]}
            position={[-0.35 + fin * 0.0875, 0.48, 0.27]}
            color="#aaadaa"
            metalness={0.82}
            roughness={0.24}
          />
        );
      })}
      <Box
        size={[0.86, 0.035, 0.055]}
        position={[0, 0.11, 0.82]}
        color="#c1ad84"
        metalness={0.58}
        roughness={0.3}
      />
      {Array.from({ length: 10 }).map((_, pin) => {
        return (
          <Box
            key={pin}
            size={[0.042, 0.04, 0.075]}
            position={[-0.34 + pin * 0.075, 0.125, 0.845]}
            color="#d5ba86"
            metalness={0.58}
            roughness={0.28}
          />
        );
      })}
      {Array.from({ length: 6 }).map((_, capacitor) => {
        return (
          <Box
            key={capacitor}
            size={[0.055, 0.042, 0.055]}
            position={[-0.3 + capacitor * 0.12, 0.065, 0.66]}
            color="#151817"
            metalness={0.38}
            roughness={0.38}
          />
        );
      })}
      {[-1, 1].map((side) => {
        return (
          <Box
            key={side}
            size={[0.026, 0.32, 1.08]}
            position={[side * 0.425, 0.27, 0.27]}
            color="#c2c3bf"
            metalness={0.84}
            roughness={0.24}
          />
        );
      })}
      {[
        [-0.4, -0.76],
        [0.4, -0.76],
        [-0.4, 0.76],
        [0.4, 0.76],
      ].map(([dx, dz], screw) => {
        return (
          <Screw
            key={screw}
            position={[dx, 0.075, dz]}
            radius={0.025}
            color="#c3c4c0"
          />
        );
      })}
      <Box
        size={[0.46, 0.035, 0.025]}
        position={[0, 0.08, 0.865]}
        color={index % 3 === 0 ? ACCENT : "#777b78"}
        metalness={0.35}
        roughness={0.32}
        emissive={index % 3 === 0 ? ACCENT : "#000000"}
        emissiveIntensity={index % 3 === 0 ? 0.22 : 0}
      />
    </group>
  );
};

const TrayRails = ({
  y,
  z,
  width = 5.8,
  depth = 5.1,
}: {
  readonly y: number;
  readonly z: number;
  readonly width?: number;
  readonly depth?: number;
}) => {
  return (
    <>
      <Box
        size={[width, 0.1, 0.1]}
        position={[0, y, z - depth / 2]}
        color="#9da09e"
        metalness={0.82}
        roughness={0.27}
      />
      <Box
        size={[width, 0.1, 0.1]}
        position={[0, y, z + depth / 2]}
        color="#9da09e"
        metalness={0.82}
        roughness={0.27}
      />
      <Box
        size={[0.1, 0.1, depth]}
        position={[-width / 2, y, z]}
        color="#737775"
        metalness={0.78}
        roughness={0.3}
      />
      <Box
        size={[0.1, 0.1, depth]}
        position={[width / 2, y, z]}
        color="#737775"
        metalness={0.78}
        roughness={0.3}
      />
      {[
        [-width / 2 + 0.18, z - depth / 2 + 0.18],
        [width / 2 - 0.18, z - depth / 2 + 0.18],
        [-width / 2 + 0.18, z + depth / 2 - 0.18],
        [width / 2 - 0.18, z + depth / 2 - 0.18],
      ].map(([screwX, screwZ], index) => {
        return (
          <Screw
            key={index}
            position={[screwX, y + 0.075, screwZ]}
            radius={0.035}
            color="#c5c6c2"
          />
        );
      })}
    </>
  );
};

const ComputeTray = ({ progress }: { readonly progress: number }) => {
  const y = 0.48;
  const z = -0.15;
  const xs = [-2.2, -0.735, 0.735, 2.2];
  const zs = [-1.22, 0.74];

  return (
    <ExplodedPiece
      progress={progress}
      offset={[0, 0.9, -0.25]}
      rotation={[0.025, 0.04, 0.012]}
    >
      <TrayRails y={y} z={z} width={5.78} depth={5.35} />
      <Box
        size={[5.58, 0.12, 5.15]}
        position={[0, y - 0.06, z]}
        color="#22322d"
        metalness={0.34}
        roughness={0.52}
      />
      {Array.from({ length: 9 }).map((_, index) => {
        return (
          <Box
            key={index}
            size={[0.012, 0.008, 4.2]}
            position={[-2.25 + index * 0.56, y + 0.015, -0.15]}
            color="#52675f"
            metalness={0.4}
            roughness={0.45}
          />
        );
      })}
      {[-1, 1].map((side) => {
        return (
          <Box
            key={side}
            size={[0.055, 0.035, 4.56]}
            position={[side * 2.55, y + 0.03, z]}
            color="#ba9966"
            metalness={0.48}
            roughness={0.34}
          />
        );
      })}
      {Array.from({ length: 14 }).map((_, index) => {
        return (
          <Box
            key={index}
            size={[0.15, 0.055, 0.1]}
            position={[-2.28 + index * 0.35, y + 0.03, 2.28]}
            color={index % 4 === 0 ? "#7d6244" : "#202322"}
            metalness={0.45}
            roughness={0.4}
          />
        );
      })}
      {zs.flatMap((moduleZ, row) => {
        return xs.map((moduleX, column) => {
          const index = row * 4 + column;
          const drift = [
            [-0.09, 0.08, 0.04, -0.012, 0.035, 0.018],
            [0.06, -0.045, 0.09, 0.01, -0.028, -0.016],
            [-0.055, 0.065, 0.12, -0.008, 0.022, 0.022],
            [0.095, -0.07, 0.055, 0.014, -0.034, -0.012],
            [0.045, 0.085, 0.11, 0.012, 0.03, -0.018],
            [-0.1, -0.055, 0.06, -0.014, -0.024, 0.02],
            [0.075, 0.06, 0.08, 0.01, 0.04, 0.016],
            [-0.06, -0.075, 0.13, -0.01, -0.03, -0.022],
          ][index];
          return (
            <GpuModule
              key={`${row}-${column}`}
              x={moduleX + drift[0] * progress}
              y={y + 0.1 + drift[1] * progress}
              z={moduleZ + drift[2] * progress}
              index={index}
              rotation={[
                drift[3] * progress,
                drift[4] * progress,
                drift[5] * progress,
              ]}
            />
          );
        });
      })}
      {Array.from({ length: 4 }).map((_, index) => {
        const x = -1.62 + index * 1.08;
        return (
          <group key={index} position={[x, y + 0.09, 1.98]}>
            <Box
              size={[0.74, 0.12, 0.58]}
              color="#454a48"
              metalness={0.65}
              roughness={0.33}
            />
            {Array.from({ length: 7 }).map((__, fin) => {
              return (
                <Box
                  key={fin}
                  size={[0.025, 0.2, 0.5]}
                  position={[-0.29 + fin * 0.097, 0.15, 0]}
                  color="#9da09d"
                  metalness={0.8}
                  roughness={0.26}
                />
              );
            })}
          </group>
        );
      })}
    </ExplodedPiece>
  );
};

const ControlTray = ({
  progress,
  pulse,
}: {
  readonly progress: number;
  readonly pulse: number;
}) => {
  const y = -0.98;
  const z = -0.1;

  return (
    <ExplodedPiece
      progress={progress}
      offset={[0.15, -0.63, 0.65]}
      rotation={[-0.02, 0.034, -0.016]}
    >
      <TrayRails y={y} z={z} width={5.7} depth={4.95} />
      <Box
        size={[5.48, 0.1, 4.78]}
        position={[0, y - 0.07, z]}
        color={PCB}
        metalness={0.34}
        roughness={0.5}
      />
      {Array.from({ length: 8 }).map((_, index) => {
        return (
          <Box
            key={index}
            size={[0.012, 0.01, 3.74]}
            position={[-2.18 + index * 0.62, y + 0.012, 0.02]}
            color={index % 3 === 0 ? "#7f7055" : "#4a635a"}
            metalness={0.42}
            roughness={0.46}
          />
        );
      })}
      <CpuModule x={-1.22} y={y + 0.08} z={-0.61} />
      <CpuModule x={1.12} y={y + 0.095} z={-0.49} />
      {[-1, 1].flatMap((side) => {
        return [-0.43, 0.43].map((bankOffset) => {
          return (
            <MemoryBank
              key={`${side}-${bankOffset}`}
              x={side * 1.18 + bankOffset + side * 0.028}
              y={y + 0.1 + (side > 0 ? 0.012 : -0.008)}
              z={-0.56 + (side > 0 ? 0.045 : -0.025)}
            />
          );
        });
      })}
      {Array.from({ length: 8 }).map((_, index) => {
        return (
          <Box
            key={index}
            size={[0.65, 0.035, 0.12]}
            position={[-2.05 + index * 0.59, y + 0.01, 0.52]}
            color="#8b6e4a"
            metalness={0.3}
            roughness={0.45}
          />
        );
      })}
      {Array.from({ length: 12 }).map((_, index) => {
        return (
          <Box
            key={index}
            size={[0.09, 0.06, 0.08]}
            position={[-2.05 + index * 0.37, y + 0.035, 0.72]}
            color={index % 4 === 0 ? "#71593e" : "#1c1f1e"}
            metalness={0.4}
            roughness={0.4}
          />
        );
      })}
      {[-1.95, 1.95].map((x) => {
        return (
          <Box
            key={x}
            size={[0.72, 0.065, 0.2]}
            position={[x, y + 0.01, 1.72]}
            color="#252928"
            metalness={0.5}
            roughness={0.38}
          />
        );
      })}
      <Box
        size={[4.85, 0.018, 0.045]}
        position={[0, y + 0.02, 0.9]}
        color="#9c7b51"
        metalness={0.36}
        roughness={0.4}
      />
      {[-0.72, 0.72].map((x) => {
        return (
          <group key={x} position={[x, y + 0.09, 1.12]}>
            <Box
              size={[0.92, 0.14, 0.66]}
              color="#414644"
              metalness={0.65}
              roughness={0.34}
            />
            {Array.from({ length: 8 }).map((_, fin) => {
              return (
                <Box
                  key={fin}
                  size={[0.028, 0.22, 0.58]}
                  position={[-0.36 + fin * 0.103, 0.18, 0]}
                  color="#9fa29f"
                  metalness={0.8}
                  roughness={0.26}
                />
              );
            })}
          </group>
        );
      })}
      {Array.from({ length: 4 }).map((_, index) => {
        const x = -1.83 + index * 1.22 + [0.04, -0.03, 0.06, -0.05][index];
        const fanZ = 2.03 + [0.015, -0.025, 0.035, -0.01][index];
        return (
          <group key={index}>
            <Box
              size={[0.88, 0.58, 0.34]}
              position={[x, y + 0.18 + (index % 2) * 0.025, fanZ]}
              color="#333736"
              metalness={0.62}
              roughness={0.35}
            />
            <Fan
              position={[x, y + 0.2 + (index % 2) * 0.025, fanZ + 0.19]}
              radius={0.3}
              spin={pulse * 0.4 + index * 0.7}
              dark
            />
          </group>
        );
      })}
      {[-2.35, 2.35].map((x) => {
        return (
          <Box
            key={x}
            size={[0.66, 0.055, 0.22]}
            position={[x, y + 0.02, 1.82]}
            color="#303433"
            metalness={0.5}
            roughness={0.4}
          />
        );
      })}
    </ExplodedPiece>
  );
};

const NetworkStorageModules = ({ progress }: { readonly progress: number }) => {
  return (
    <>
      <ExplodedPiece
        progress={progress}
        offset={[-0.1, 0.15, 1.3]}
        rotation={[0.008, -0.028, 0.018]}
      >
        <group position={[0, -0.32, 2.08]}>
          {Array.from({ length: 8 }).map((_, index) => {
            const x = -2.38 + index * 0.68;
            return (
              <group
                key={index}
                position={[
                  0,
                  (index % 2 === 0 ? 1 : -1) * 0.012,
                  (index % 3) * 0.008,
                ]}
                rotation={[0, (index - 3.5) * 0.004, (index - 3.5) * 0.002]}
              >
                <Box
                  size={[0.42, 0.24, 0.5]}
                  position={[x, 0, 0]}
                  color="#121515"
                  metalness={0.5}
                  roughness={0.4}
                />
                <Box
                  size={[0.29, 0.04, 0.025]}
                  position={[x, -0.02, 0.265]}
                  color={ACCENT}
                  metalness={0.25}
                  roughness={0.3}
                  emissive={ACCENT}
                  emissiveIntensity={0.3}
                />
                <Box
                  size={[0.3, 0.13, 0.025]}
                  position={[x, 0.025, 0.265]}
                  color="#050707"
                  metalness={0.32}
                  roughness={0.55}
                />
                <Box
                  size={[0.07, 0.055, 0.035]}
                  position={[x + 0.14, 0.07, 0.28]}
                  color="#b5b6b2"
                  metalness={0.76}
                  roughness={0.3}
                />
              </group>
            );
          })}
        </group>
      </ExplodedPiece>

      <ExplodedPiece
        progress={progress}
        offset={[0.15, -0.36, 1.68]}
        rotation={[0.025, 0.022, -0.018]}
      >
        <group position={[0, -1.62, 2.2]}>
          {Array.from({ length: 8 }).map((_, index) => {
            const x = -1.82 + (index % 4) * 0.78;
            const y = index < 4 ? 0.17 : -0.17;
            return (
              <group
                key={index}
                position={[
                  (index % 2 === 0 ? -1 : 1) * 0.012,
                  ((index % 3) - 1) * 0.012,
                  (index % 4) * 0.012,
                ]}
                rotation={[
                  (index - 3.5) * 0.002,
                  (index % 2 === 0 ? -1 : 1) * 0.018,
                  (index - 3.5) * 0.003,
                ]}
              >
                <Box
                  size={[0.58, 0.25, 0.68]}
                  position={[x, y, 0]}
                  color="#252827"
                  metalness={0.58}
                  roughness={0.36}
                />
                <Box
                  size={[0.6, 0.035, 0.05]}
                  position={[x, y + 0.1, 0.36]}
                  color="#8a8e8b"
                  metalness={0.7}
                  roughness={0.3}
                />
                <Box
                  size={[0.4, 0.075, 0.045]}
                  position={[x, y + 0.12, 0.36]}
                  color="#b8b9b5"
                  metalness={0.72}
                  roughness={0.3}
                />
                <mesh
                  position={[x + 0.23, y + 0.03, 0.355]}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <cylinderGeometry args={[0.018, 0.018, 0.02, 12]} />
                  <meshPhysicalMaterial
                    color={ACCENT}
                    metalness={0.25}
                    roughness={0.3}
                    emissive={ACCENT}
                    emissiveIntensity={0.35}
                  />
                </mesh>
              </group>
            );
          })}
          {[-1.15, 1.15].map((x) => {
            return (
              <group key={x}>
                <Box
                  size={[0.78, 0.055, 0.26]}
                  position={[x, -0.39, 0.04]}
                  color="#2e3231"
                  metalness={0.45}
                  roughness={0.4}
                />
                <Box
                  size={[0.55, 0.02, 0.035]}
                  position={[x, -0.35, 0.185]}
                  color="#9d7b51"
                  metalness={0.3}
                  roughness={0.4}
                />
                {Array.from({ length: 3 }).map((_, chip) => {
                  return (
                    <Box
                      key={chip}
                      size={[0.12, 0.025, 0.1]}
                      position={[x - 0.22 + chip * 0.21, -0.315, 0.04]}
                      color="#151817"
                      metalness={0.38}
                      roughness={0.42}
                    />
                  );
                })}
              </group>
            );
          })}
        </group>
      </ExplodedPiece>
    </>
  );
};

const CoolingPowerModules = ({
  progress,
  pulse,
}: {
  readonly progress: number;
  readonly pulse: number;
}) => {
  return (
    <>
      <ExplodedPiece
        progress={progress}
        offset={[-0.1, 0.43, -0.83]}
        rotation={[0.012, 0.026, 0.038]}
      >
        <group position={[0, 0.46, -3.04]}>
          {Array.from({ length: 2 }).flatMap((__, row) => {
            return Array.from({ length: 6 }).map((_, column) => {
              return (
                <Fan
                  key={`${row}-${column}`}
                  position={[
                    -2.48 + column * 0.99,
                    0.94 - row * 0.69 + ((column % 3) - 1) * 0.018,
                    (column % 4) * 0.01,
                  ]}
                  radius={0.36}
                  spin={pulse * (row === 0 ? 0.8 : -0.8) + column * 0.2}
                  dark={row === 1}
                />
              );
            });
          })}
        </group>
      </ExplodedPiece>

      <ExplodedPiece
        progress={progress}
        offset={[0.43, -0.3, -0.58]}
        rotation={[0.018, 0.032, -0.02]}
      >
        <group position={[1.88, -0.98, -2.78]}>
          {Array.from({ length: 2 }).flatMap((__, column) => {
            return Array.from({ length: 3 }).map((_, row) => {
              const x = column * 0.95;
              const y = -0.72 + row * 0.72;
              return (
                <group key={`${column}-${row}`} position={[x, y, 0]}>
                  <Box
                    size={[0.88, 0.6, 1.08]}
                    color="#5f6462"
                    metalness={0.72}
                    roughness={0.32}
                  />
                  <Box
                    size={[0.5, 0.32, 0.035]}
                    position={[0, 0, 0.555]}
                    color="#202322"
                    metalness={0.45}
                    roughness={0.4}
                  />
                  <Fan
                    position={[0, 0.03, 0.58]}
                    radius={0.21}
                    spin={pulse * 0.5 + row * 0.3}
                    dark
                  />
                  <Box
                    size={[0.3, 0.07, 0.025]}
                    position={[0, -0.22, 0.58]}
                    color={ACCENT}
                    metalness={0.25}
                    roughness={0.32}
                    emissive={ACCENT}
                    emissiveIntensity={0.22}
                  />
                  {Array.from({ length: 5 }).map((_, vent) => {
                    return (
                      <Box
                        key={vent}
                        size={[0.04, 0.32, 0.018]}
                        position={[-0.3 + vent * 0.15, 0.02, 0.56]}
                        color="#111414"
                        metalness={0.35}
                        roughness={0.52}
                      />
                    );
                  })}
                  <Box
                    size={[0.5, 0.045, 0.05]}
                    position={[-0.15, 0.25, 0.58]}
                    color="#a2a4a0"
                    metalness={0.76}
                    roughness={0.28}
                  />
                  <Screw position={[-0.36, 0.23, 0.58]} radius={0.025} />
                  <Screw position={[0.36, 0.23, 0.58]} radius={0.025} />
                </group>
              );
            });
          })}
        </group>
      </ExplodedPiece>
    </>
  );
};

const FrontServicePanels = ({ progress }: { readonly progress: number }) => {
  return (
    <>
      <ExplodedPiece
        progress={progress}
        offset={[8, 16, 2]}
        rotation={[0.32, 0.28, -0.42]}
        easing={blastEase}
        pivot={[0, 1.72, 3.73]}
        shrink={0.55}
        fadeAfter={0.66}
      >
        <group position={[0, 1.72, 3.73]}>
          <Box
            size={[6.18, 0.66, 0.15]}
            color="#777a79"
            metalness={0.78}
            roughness={0.3}
          />
          {Array.from({ length: 8 }).map((_, index) => {
            return (
              <group key={index}>
                <Box
                  size={[0.38, 0.18, 0.08]}
                  position={[-2.45 + index * 0.7, 0, 0.11]}
                  color="#111313"
                  metalness={0.4}
                  roughness={0.5}
                />
                <Box
                  size={[0.27, 0.035, 0.02]}
                  position={[-2.45 + index * 0.7, -0.035, 0.155]}
                  color={ACCENT}
                  metalness={0.2}
                  roughness={0.3}
                  emissive={ACCENT}
                  emissiveIntensity={0.2}
                />
              </group>
            );
          })}
        </group>
      </ExplodedPiece>

      <ExplodedPiece
        progress={progress}
        offset={[18, 16, 3]}
        rotation={[0.4, 0.62, 0.24]}
        delay={0.015}
        easing={blastEase}
        pivot={[0, 0.47, 3.73]}
        shrink={0.75}
        fadeAfter={0.66}
      >
        <PerforatedPanel
          size={[5.8, 1.72, 0.15]}
          position={[0, 0.47, 3.73]}
          color="#555958"
          columns={25}
          rows={11}
          holeColor="#0e1010"
        />
        <Box
          size={[5.86, 0.055, 0.17]}
          position={[0, -0.39, 3.74]}
          color="#b2b3b0"
          metalness={0.86}
          roughness={0.24}
        />
      </ExplodedPiece>

      <ExplodedPiece
        progress={progress}
        offset={[-30, -18, 3]}
        rotation={[-0.38, -0.34, 0.48]}
        delay={0.035}
        easing={blastEase}
        pivot={[-1.78, -1.57, 3.74]}
        shrink={0.65}
        fadeAfter={0.66}
      >
        <group position={[-1.78, -1.57, 3.74]}>
          <Box
            size={[2.38, 0.75, 0.16]}
            color="#707372"
            metalness={0.78}
            roughness={0.28}
          />
          {Array.from({ length: 8 }).map((_, index) => {
            const x = -0.92 + (index % 4) * 0.61;
            const y = index < 4 ? 0.16 : -0.18;
            return (
              <group key={index}>
                <Box
                  size={[0.5, 0.23, 0.09]}
                  position={[x, y, 0.12]}
                  color="#171919"
                  metalness={0.55}
                  roughness={0.36}
                />
                <Box
                  size={[0.03, 0.08, 0.015]}
                  position={[x + 0.19, y + 0.06, 0.172]}
                  color={ACCENT}
                  metalness={0.2}
                  roughness={0.3}
                  emissive={ACCENT}
                  emissiveIntensity={0.3}
                />
              </group>
            );
          })}
        </group>
      </ExplodedPiece>

      <ExplodedPiece
        progress={progress}
        offset={[30, -16, 3]}
        rotation={[0.34, 0.38, -0.46]}
        delay={0.05}
        easing={blastEase}
        pivot={[1.58, -1.57, 3.74]}
        shrink={0.65}
        fadeAfter={0.66}
      >
        <group position={[1.58, -1.57, 3.74]}>
          <Box
            size={[2.76, 0.75, 0.16]}
            color="#666a69"
            metalness={0.78}
            roughness={0.28}
          />
          {Array.from({ length: 7 }).map((_, index) => {
            const x = -0.99 + index * 0.33;
            return (
              <Box
                key={index}
                size={[0.17, 0.18, 0.06]}
                position={[x, 0.12, 0.12]}
                color="#111313"
                metalness={0.5}
                roughness={0.45}
              />
            );
          })}
          <Box
            size={[0.55, 0.37, 0.11]}
            position={[0.92, -0.12, 0.12]}
            color="#242626"
            metalness={0.42}
            roughness={0.42}
          />
          <Box
            size={[0.46, 0.02, 0.015]}
            position={[0.92, -0.16, 0.185]}
            color={ACCENT}
            metalness={0.2}
            roughness={0.3}
            emissive={ACCENT}
            emissiveIntensity={0.45}
          />
        </group>
      </ExplodedPiece>

      {[-1, 1].map((side) => {
        return (
          <ExplodedPiece
            key={side}
            progress={progress}
            offset={[side * 26, side * 10, 3]}
            rotation={[0.08, side * 0.72, side * 0.46]}
            delay={0.06}
            easing={blastEase}
            pivot={[side * 3.35, 0, 3.7]}
            shrink={0.55}
            fadeAfter={0.66}
          >
            <Box
              size={[0.19, 4.54, 0.22]}
              position={[side * 3.35, 0, 3.7]}
              color="#a2a3a0"
              metalness={0.83}
              roughness={0.25}
            />
          </ExplodedPiece>
        );
      })}
    </>
  );
};

const RearAssembly = ({
  progress,
  pulse,
}: {
  readonly progress: number;
  readonly pulse: number;
}) => {
  return (
    <ExplodedPiece
      progress={progress}
      offset={[0, -24, -18]}
      rotation={[-0.55, 0, 0.3]}
      delay={0.08}
      easing={blastEase}
      pivot={[0, 0, -3.73]}
      shrink={0.75}
      fadeAfter={0.66}
    >
      <group position={[0, 0, -3.73]}>
        <Box
          size={[6.5, 4.48, 0.15]}
          color="#464a49"
          metalness={0.72}
          roughness={0.35}
        />
        {Array.from({ length: 2 }).flatMap((__, row) => {
          return Array.from({ length: 6 }).map((_, column) => {
            return (
              <Fan
                key={`${row}-${column}`}
                position={[-2.48 + column * 0.99, 1.28 - row * 0.72, -0.1]}
                radius={0.37}
                spin={pulse * (row === 0 ? 1 : -1) + column * 0.24}
                dark={row === 1}
              />
            );
          });
        })}
        {Array.from({ length: 3 }).flatMap((__, column) => {
          return Array.from({ length: 2 }).map((_, row) => {
            return (
              <group
                key={`${column}-${row}`}
                position={[-2.02 + column * 2.02, -1.02 - row * 0.75, -0.12]}
              >
                <Box
                  size={[1.78, 0.57, 0.2]}
                  color="#777a78"
                  metalness={0.77}
                  roughness={0.3}
                />
                <Box
                  size={[0.18, 0.3, 0.05]}
                  position={[0.72, 0, -0.13]}
                  color="#171919"
                  metalness={0.5}
                  roughness={0.4}
                />
                <Box
                  size={[0.06, 0.2, 0.02]}
                  position={[0.72, 0, -0.165]}
                  color={ACCENT}
                  metalness={0.25}
                  roughness={0.3}
                  emissive={ACCENT}
                  emissiveIntensity={0.35}
                />
              </group>
            );
          });
        })}
      </group>
    </ExplodedPiece>
  );
};

type DebrisParticle = {
  readonly origin: Vec3;
  readonly direction: Vec3;
  readonly speed: number;
  readonly size: number;
  readonly spin: Vec3;
  readonly delay: number;
  readonly life: number;
  readonly accent: boolean;
};

const noise = (value: number) => {
  const raw = Math.sin(value) * 43758.5453123;
  return raw - Math.floor(raw);
};

const createDebris = (): DebrisParticle[] => {
  const halfX = 3.16;
  const halfY = 2.2;
  const halfZ = 3.72;

  return Array.from({ length: 96 }).map((_, index) => {
    const seed = index * 1.618 + 3.17;
    const face = Math.floor(noise(seed) * 6);
    const u = noise(seed + 1.7) * 2 - 1;
    const v = noise(seed + 3.1) * 2 - 1;
    let origin: Vec3;
    let normal: Vec3;

    switch (face) {
      case 0:
        origin = [-halfX, v * halfY, u * halfZ];
        normal = [-1, 0, 0];
        break;
      case 1:
        origin = [halfX, v * halfY, u * halfZ];
        normal = [1, 0, 0];
        break;
      case 2:
        origin = [u * halfX, halfY, v * halfZ];
        normal = [0, 1, 0];
        break;
      case 3:
        origin = [u * halfX, -halfY, v * halfZ];
        normal = [0, -1, 0];
        break;
      case 4:
        origin = [u * halfX, v * halfY, halfZ];
        normal = [0, 0, 1];
        break;
      default:
        origin = [u * halfX, v * halfY, -halfZ];
        normal = [0, 0, -1];
        break;
    }

    const swirlX = noise(seed + 5.3) * 2 - 1;
    const swirlY = noise(seed + 7.9) * 2 - 1;
    const swirlZ = noise(seed + 9.7) * 2 - 1;
    const direction: Vec3 = [
      normal[0] + swirlX * 0.55,
      normal[1] * 0.75 + swirlY * 0.45 + 0.18,
      normal[2] + swirlZ * 0.55,
    ];
    const length = Math.hypot(...direction) || 1;

    return {
      origin,
      direction: [
        direction[0] / length,
        direction[1] / length,
        direction[2] / length,
      ],
      speed: 4.2 + noise(seed + 11.3) * 9.5,
      size: 0.008 + noise(seed + 13.7) * 0.018 + (index % 13 === 0 ? 0.018 : 0),
      spin: [
        (noise(seed + 15.1) * 2 - 1) * 7,
        (noise(seed + 17.3) * 2 - 1) * 7,
        (noise(seed + 19.9) * 2 - 1) * 7,
      ],
      delay: 0.04 + noise(seed + 21.7) * 0.16,
      life: 0.22 + noise(seed + 23.3) * 0.24,
      accent: index % 11 === 0,
    };
  });
};

const DEBRIS = createDebris();

const ExplosionDebris = ({ progress }: { readonly progress: number }) => {
  if (progress <= 0.01 || progress >= 0.8) {
    return null;
  }

  return (
    <group>
      {DEBRIS.map((particle, index) => {
        const age = (progress - particle.delay) / particle.life;
        if (age <= 0 || age >= 1) {
          return null;
        }

        const distance = particle.speed * age + 2.4 * age * age;
        const fade = Math.min(1, age * 8) * Math.pow(1 - age, 1.35);
        const scale = particle.size * (1 - 0.45 * age);

        return (
          <mesh
            key={index}
            position={[
              particle.origin[0] + particle.direction[0] * distance,
              particle.origin[1] +
                particle.direction[1] * distance -
                1.2 * age * age,
              particle.origin[2] + particle.direction[2] * distance,
            ]}
            rotation={[
              particle.spin[0] * age,
              particle.spin[1] * age,
              particle.spin[2] * age,
            ]}
            scale={scale}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial
              color={particle.accent ? ACCENT : "#bfbeb7"}
              transparent
              opacity={0.8 * fade}
            />
          </mesh>
        );
      })}
    </group>
  );
};

const Chassis = ({
  explosion,
  innerExplosion,
  pulse,
  showShell,
}: {
  readonly explosion: number;
  readonly innerExplosion: number;
  readonly pulse: number;
  readonly showShell: boolean;
}) => {
  return (
    <>
      {showShell ? (
        <group>
          {[-1, 1].map((side) => {
            return (
              <ExplodedPiece
                key={side}
                progress={explosion}
                offset={[side * 30, side * 10, -16]}
                rotation={[side * 0.32, side * 1.05, side * 0.42]}
                delay={0.05}
                easing={blastEase}
                pivot={[side * 3.16, 0, 0]}
                shrink={0.75}
                fadeAfter={0.66}
              >
                <Box
                  size={[0.14, 4.48, 7.46]}
                  position={[side * 3.18, 0, 0]}
                  color="#525756"
                  metalness={0.63}
                  roughness={0.38}
                />
                <Box
                  size={[0.24, 0.12, 7.58]}
                  position={[side * 3.08, 2.22, 0]}
                  color="#9a9d9b"
                  metalness={0.83}
                  roughness={0.26}
                />
                <Box
                  size={[0.24, 0.12, 7.58]}
                  position={[side * 3.08, -2.22, 0]}
                  color="#9a9d9b"
                  metalness={0.83}
                  roughness={0.26}
                />
              </ExplodedPiece>
            );
          })}

          <ExplodedPiece
            progress={explosion}
            offset={[2, 18, -5]}
            rotation={[0.66, 0.08, -0.46]}
            delay={0.02}
            easing={blastEase}
            pivot={[0, 2.2, 0]}
            shrink={0.75}
            fadeAfter={0.66}
          >
            <Box
              size={[6.52, 0.1, 7.46]}
              position={[0, 2.2, 0]}
              color="#777a79"
              metalness={0.75}
              roughness={0.32}
            />
            <Box
              size={[6.07, 0.025, 6.98]}
              position={[0, 2.27, -0.06]}
              color="#292c2c"
              metalness={0.55}
              roughness={0.4}
            />
          </ExplodedPiece>

          <ExplodedPiece
            progress={explosion}
            offset={[-2, -26, -8]}
            rotation={[-0.56, -0.06, 0.38]}
            delay={0.06}
            easing={blastEase}
            pivot={[0, -2.2, 0]}
            shrink={0.75}
            fadeAfter={0.66}
          >
            <Box
              size={[6.52, 0.13, 7.46]}
              position={[0, -2.2, 0]}
              color="#414544"
              metalness={0.72}
              roughness={0.34}
            />
            <Box
              size={[5.85, 0.075, 0.17]}
              position={[0, -2.12, 3.4]}
              color="#9d9f9c"
              metalness={0.8}
              roughness={0.27}
            />
          </ExplodedPiece>

          {[-1, 1].map((side) => {
            return (
              <ExplodedPiece
                key={side}
                progress={explosion}
                offset={[side * 22, -16, -11]}
                rotation={[0.26, side * 0.58, side * 0.34]}
                delay={0.09}
                easing={blastEase}
                pivot={[side * 2.7, 0, -2.85]}
                shrink={0.55}
                fadeAfter={0.66}
              >
                <Box
                  size={[0.13, 3.95, 0.13]}
                  position={[side * 2.7, 0, -2.85]}
                  color="#686c6b"
                  metalness={0.72}
                  roughness={0.32}
                />
              </ExplodedPiece>
            );
          })}
        </group>
      ) : null}

      <group position={[0, 0, 0]} scale={MODULE_SCALE}>
        <ComputeTray progress={stagedProgress(innerExplosion, 0)} />
        <ControlTray
          progress={stagedProgress(innerExplosion, 0.05)}
          pulse={pulse}
        />
        <NetworkStorageModules progress={stagedProgress(innerExplosion, 0.1)} />
        <CoolingPowerModules
          progress={stagedProgress(innerExplosion, 0.15)}
          pulse={pulse}
        />
      </group>

      {showShell ? (
        <>
          <FrontServicePanels progress={explosion} />
          <RearAssembly progress={explosion} pulse={pulse} />
        </>
      ) : null}
    </>
  );
};

const ServerScene = () => {
  const frame = useCurrentFrame();

  const shellExit = interpolate(frame, [112, 168], [0, 1], {
    ...CLAMP,
    easing: Easing.linear,
  });
  const effectProgress = shellExit;
  const innerExplosion = interpolate(frame, [146, 290], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.16, 0.55, 0.22, 1),
  });
  const scale = interpolate(frame, [0, 300], [0.92, 1.08], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  return (
    <ThreeCanvas
      width={1920}
      height={1080}
      camera={{
        position: [9.6, 5.1, 13.2],
        fov: 34,
        near: 0.1,
        far: 100,
      }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#050505"]} />
      <MetalEnvironment />
      <ambientLight intensity={1.15} />
      <hemisphereLight color="#f4f3ef" groundColor="#161817" intensity={0.55} />
      <directionalLight
        position={[7.5, 9.5, 9]}
        intensity={1.9}
        color="#fffdf8"
      />
      <directionalLight
        position={[-7, 5, 3]}
        intensity={0.85}
        color="#d5d8d6"
      />

      <group
        position={[STAGE_X, STAGE_Y, 0]}
        rotation={[0.035, 0, 0]}
        scale={scale}
      >
        <Chassis
          explosion={shellExit}
          innerExplosion={innerExplosion}
          pulse={effectProgress}
          showShell={frame < 170}
        />
        <ExplosionDebris progress={effectProgress} />
      </group>
    </ThreeCanvas>
  );
};

const OpeningContour = () => {
  const frame = useCurrentFrame();

  if (frame >= 112) {
    return null;
  }

  const blackout = interpolate(frame, [0, 24, 90, 130], [1, 1, 1, 0], CLAMP);
  const outlineOpacity = interpolate(
    frame,
    [24, 34, 96, 112],
    [0, 0.72, 0.72, 0],
    CLAMP,
  );
  const trace = interpolate(frame, [26, 100], [0, 100], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  const scale = interpolate(frame, [0, 300], [0.92, 1.08], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  const camera = new PerspectiveCamera(34, 16 / 9, 0.1, 100);
  camera.position.set(9.6, 5.1, 13.2);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  const corners: Vec3[] = [
    [-3.28, 2.22, 3.76],
    [-3.28, 2.22, -3.74],
    [3.28, 2.22, -3.74],
    [3.28, 2.22, 3.76],
    [3.28, -2.22, 3.76],
    [-3.28, -2.22, 3.76],
  ];
  const rotation = new Euler(0.035, 0, 0);
  const contourPoints = corners.map(([x, y, z]) => {
    const projected = new Vector3(x, y, z)
      .multiplyScalar(scale)
      .applyEuler(rotation)
      .add(new Vector3(STAGE_X, STAGE_Y, 0))
      .project(camera);
    return [
      (projected.x * 0.5 + 0.5) * 1920,
      (-projected.y * 0.5 + 0.5) * 1080,
    ] as const;
  });
  const contourPath = `M ${contourPoints
    .map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" L ")} Z`;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        opacity: blackout,
      }}
    >
      <svg
        viewBox="0 0 1920 1080"
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, opacity: outlineOpacity }}
      >
        <defs>
          <filter id="trace-glow" x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        <path
          d={contourPath}
          fill="none"
          stroke="rgba(190, 195, 192, 0.16)"
          strokeWidth="2"
        />
        <path
          d={contourPath}
          fill="none"
          stroke="#e7c795"
          strokeWidth="10"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="12 88"
          strokeDashoffset={100 - trace}
          opacity="0.28"
          filter="url(#trace-glow)"
        />
        <path
          d={contourPath}
          fill="none"
          stroke="#f2e5d2"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="12 88"
          strokeDashoffset={100 - trace}
        />
      </svg>
    </AbsoluteFill>
  );
};

export const B300Reveal = () => {
  return (
    <AbsoluteFill
      style={{
        background: "#030303",
        overflow: "hidden",
      }}
    >
      <ServerScene />
      <OpeningContour />
    </AbsoluteFill>
  );
};
