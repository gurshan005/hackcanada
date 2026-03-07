"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

function BookStack() {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.12;
    ref.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.25) * 0.05;
  });

  return (
    <group ref={ref}>
      <mesh position={[0, -0.65, 0]}>
        <boxGeometry args={[2.4, 0.34, 1.4]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.45} />
      </mesh>
      <mesh position={[0.15, -0.25, 0.02]} rotation={[0, 0.07, 0]}>
        <boxGeometry args={[2.1, 0.34, 1.3]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.45} />
      </mesh>
      <mesh position={[-0.1, 0.12, -0.02]} rotation={[0, -0.08, 0]}>
        <boxGeometry args={[1.9, 0.32, 1.2]} />
        <meshStandardMaterial color="#10b981" roughness={0.45} />
      </mesh>

      <mesh position={[1.15, 0.42, 0.22]} rotation={[0.2, 0.1, -0.75]}>
        <cylinderGeometry args={[0.045, 0.045, 1.8, 24]} />
        <meshStandardMaterial color="#f97316" roughness={0.42} />
      </mesh>
    </group>
  );
}

export function BookStackModel() {
  return (
    <div className="h-[180px] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]">
      <Canvas camera={{ position: [0, 0.2, 4], fov: 36 }}>
        <ambientLight intensity={0.78} />
        <directionalLight position={[3, 4, 3]} intensity={0.85} color="#ffffff" />
        <directionalLight position={[-2, 2, 2]} intensity={0.45} color="#bfdbfe" />
        <BookStack />
      </Canvas>
    </div>
  );
}
