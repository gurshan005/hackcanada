"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { AdditiveBlending, Color, MathUtils } from "three";

function seededNoise(index: number): number {
  const value = Math.sin(index * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function GlowOrb({ position, color, scale }: { position: [number, number, number]; color: string; scale: number }) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }
    const t = state.clock.getElapsedTime();
    ref.current.rotation.x = MathUtils.lerp(ref.current.rotation.x, Math.sin(t * 0.25) * 0.2, 0.08);
    ref.current.rotation.y = MathUtils.lerp(ref.current.rotation.y, Math.cos(t * 0.25) * 0.2, 0.08);
  });

  return (
    <Float speed={0.7} rotationIntensity={0.8} floatIntensity={1.1}>
      <group ref={ref} position={position}>
        <mesh scale={scale}>
          <icosahedronGeometry args={[1.1, 3]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.22}
            roughness={0.2}
            metalness={0.1}
            emissive={new Color(color)}
            emissiveIntensity={0.9}
          />
        </mesh>
      </group>
    </Float>
  );
}

function Particles() {
  const points = useMemo(() => {
    const array = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i += 1) {
      array[i * 3] = (seededNoise(i + 1) - 0.5) * 20;
      array[i * 3 + 1] = (seededNoise(i + 101) - 0.5) * 15;
      array[i * 3 + 2] = (seededNoise(i + 201) - 0.5) * 10;
    }
    return array;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        color="#9cc6ff"
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

export function BackgroundScene() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 opacity-70">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 6, 3]} intensity={0.8} color="#8ec5ff" />
        <directionalLight position={[-3, -2, 4]} intensity={0.6} color="#7ef0d6" />
        <GlowOrb position={[-3.5, 1.8, -0.8]} color="#5f8cff" scale={1.8} />
        <GlowOrb position={[3.4, -2.2, -1]} color="#31d6bb" scale={1.45} />
        <GlowOrb position={[0.4, 2.8, -1.5]} color="#f5a623" scale={1.1} />
        <Particles />
      </Canvas>
    </div>
  );
}
