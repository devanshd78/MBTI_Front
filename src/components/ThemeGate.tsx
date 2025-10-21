'use client';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import React, {
  memo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';

export type ThemeGateProps = {
  isOpen: boolean;
  onOpened?: () => void;
  quality?: 'low' | 'med' | 'high';
  primaryColor: string;
  accentColor: string;
  glowColor: string;
};

function GatePanel({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          metalness={0.9}
          roughness={0.2}
          envMapIntensity={1.5}
        />
      </mesh>
      <mesh position={[0, 0, 0.041]}>
        <boxGeometry args={[size[0] - 0.1, size[1] - 0.1, 0.005]} />
        <meshStandardMaterial
          color={color}
          metalness={0.95}
          roughness={0.15}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>
    </group>
  );
}

type GateLeafProps = {
  side: 'left' | 'right';
  targetOpen: number;
  speed?: number;
  primaryColor: string;
  accentColor: string;
};

/** Forward the rotating group so GateRig can read actual rotation.y */
const GateLeaf = forwardRef<THREE.Group, GateLeafProps>(
  function GateLeaf(
    { side = 'left', targetOpen = 0, speed = 6, primaryColor, accentColor },
    ref
  ) {
    const group = useRef<THREE.Group>(null);

    useImperativeHandle(ref, () => group.current as THREE.Group);

    const hingeX = side === 'left' ? -0.55 : 0.55;

    useFrame((_, dt) => {
      if (!group.current) return;
      const current = group.current.rotation.y;
      const next = THREE.MathUtils.damp(current, targetOpen, speed!, dt);
      group.current.rotation.y = next;
    });

    return (
      <group ref={group} position={[hingeX, 0, 0]}>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.15, 16]} />
          <meshStandardMaterial color={accentColor} metalness={0.98} roughness={0.05} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.15, 16]} />
          <meshStandardMaterial color={accentColor} metalness={0.98} roughness={0.05} />
        </mesh>
        <mesh position={[0, -0.8, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.15, 16]} />
          <meshStandardMaterial color={accentColor} metalness={0.98} roughness={0.05} />
        </mesh>

        <group position={[side === 'left' ? 0.5 : -0.5, 0, 0]}>
          <mesh>
            <boxGeometry args={[1, 2.1, 0.08]} />
            <meshStandardMaterial
              color={primaryColor}
              metalness={0.88}
              roughness={0.22}
              envMapIntensity={1.8}
            />
          </mesh>

          <GatePanel
            position={[0, 0.65, 0]}
            size={[0.7, 0.55, 0.09]}
            color={primaryColor}
          />
          <GatePanel
            position={[0, -0.05, 0]}
            size={[0.7, 0.55, 0.09]}
            color={primaryColor}
          />
          <GatePanel
            position={[0, -0.75, 0]}
            size={[0.7, 0.55, 0.09]}
            color={primaryColor}
          />

          <mesh position={[side === 'left' ? -0.5 : 0.5, 0, 0.04]}>
            <boxGeometry args={[0.03, 2.1, 0.02]} />
            <meshStandardMaterial
              color={accentColor}
              metalness={0.95}
              roughness={0.1}
              emissive={accentColor}
              emissiveIntensity={0.15}
            />
          </mesh>

          <mesh position={[side === 'left' ? 0.35 : -0.35, 0, 0.05]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.06, 16]} />
            <meshStandardMaterial color={accentColor} metalness={0.98} roughness={0.05} />
          </mesh>
          <mesh position={[side === 'left' ? 0.4 : -0.4, 0, 0.05]}>
            <boxGeometry args={[0.08, 0.12, 0.04]} />
            <meshStandardMaterial color={accentColor} metalness={0.95} roughness={0.1} />
          </mesh>
        </group>
      </group>
    );
  }
);

function GateFrame({
  primaryColor,
  accentColor,
  glowColor,
}: {
  primaryColor: string;
  accentColor: string;
  glowColor: string;
}) {
  return (
    <group>
      <mesh position={[0, 1.15, -0.05]}>
        <boxGeometry args={[2.4, 0.15, 0.15]} />
        <meshStandardMaterial color={accentColor} metalness={0.85} roughness={0.3} />
      </mesh>

      <mesh position={[-1.125, 0, -0.05]}>
        <boxGeometry args={[0.15, 2.4, 0.15]} />
        <meshStandardMaterial color={accentColor} metalness={0.85} roughness={0.3} />
      </mesh>

      <mesh position={[1.125, 0, -0.05]}>
        <boxGeometry args={[0.15, 2.4, 0.15]} />
        <meshStandardMaterial color={accentColor} metalness={0.85} roughness={0.3} />
      </mesh>

      <mesh position={[0, -1.15, -0.05]}>
        <boxGeometry args={[2.4, 0.15, 0.15]} />
        <meshStandardMaterial color={accentColor} metalness={0.85} roughness={0.3} />
      </mesh>

      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[2.2, 2.3, 0.03]} />
        <meshStandardMaterial color={primaryColor} metalness={0.7} roughness={0.4} />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.04, 2.2, 0.02]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={1.5}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>

      <mesh position={[0, 1.05, 0.02]}>
        <boxGeometry args={[1.8, 0.08, 0.04]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={0.8}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {[-0.9, 0.9].map((x, i) => (
        <mesh key={i} position={[x, 1.05, 0.02]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={2}
          />
        </mesh>
      ))}
    </group>
  );
}

function GateRig({
  isOpen,
  onOpened,
  primaryColor,
  accentColor,
  glowColor
}: Pick<ThemeGateProps, 'isOpen' | 'onOpened' | 'primaryColor' | 'accentColor' | 'glowColor'>) {
  const [opened, setOpened] = useState(false);
  const leftTarget = isOpen ? THREE.MathUtils.degToRad(-95) : 0;
  const rightTarget = isOpen ? THREE.MathUtils.degToRad(95) : 0;

  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);

  const epsilon = THREE.MathUtils.degToRad(0.8);

  useFrame(() => {
    if (!isOpen || opened) return;

    const left = leftRef.current?.rotation.y ?? 0;
    const right = rightRef.current?.rotation.y ?? 0;

    if (Math.abs(left - leftTarget) < epsilon && Math.abs(right - rightTarget) < epsilon) {
      setOpened(true);
      onOpened?.();
    }
  });

  return (
    <group>
      <GateFrame primaryColor={primaryColor} accentColor={accentColor} glowColor={glowColor} />

      {/* Pass refs directly to the rotating leaves */}
      <GateLeaf
        ref={leftRef}
        side="left"
        targetOpen={leftTarget}
        primaryColor={primaryColor}
        accentColor={accentColor}
      />

      <GateLeaf
        ref={rightRef}
        side="right"
        targetOpen={rightTarget}
        primaryColor={primaryColor}
        accentColor={accentColor}
      />
    </group>
  );
}

function ThemeGateRaw({
  isOpen,
  onOpened,
  quality = 'med',
  primaryColor,
  accentColor,
  glowColor
}: ThemeGateProps) {
  const dpr: [number, number] =
    quality === 'high' ? [1, 2] : quality === 'low' ? [1, 1.5] : [1, 1.75];

  return (
    <div className="relative w-full h-full">
      <Canvas
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        dpr={dpr}
        camera={{ position: [0, 0.3, 3.5], fov: 50 }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-5, 3, -2]} intensity={0.8} color={glowColor} />
        <pointLight position={[0, 0, 2]} intensity={0.5} color={glowColor} distance={5} />

        <pointLight position={[-2, 1, -1]} intensity={0.6} color={accentColor} />
        <pointLight position={[2, 1, -1]} intensity={0.6} color={accentColor} />

        <group position={[0, -0.1, 0]}>
          <GateRig
            isOpen={isOpen}
            onOpened={onOpened}
            primaryColor={primaryColor}
            accentColor={accentColor}
            glowColor={glowColor}
          />
          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.5}
            blur={2.8}
            far={4}
            resolution={512}
          />
        </group>

        {/* Keep original prop to avoid UI changes */}
        <Environment preset="city" environmentIntensity={0.6} />

        <fog attach="fog" args={['#0f172a', 5, 12]} />
      </Canvas>
    </div>
  );
}

export default memo(ThemeGateRaw);
