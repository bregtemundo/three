"use client";

import {
  Backdrop,
  Box,
  Center,
  MeshReflectorMaterial,
  MeshRefractionMaterial,
  MeshTransmissionMaterial,
  OrbitControls,
  Stage,
  Text3D,
  Torus,
  useCursor,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, Debug, CuboidCollider } from "@react-three/rapier";
import { Suspense, useRef, useState } from "react";
import styles from "./page.module.scss";

const Page = () => {
  const letters = useRef<any[]>([]);

  const bounceLetter = (index: number) => {
    const letter = letters.current[index];
    letter.applyImpulse({ x: 0, y: 50, z: 0 }, true);
    letter.applyTorqueImpulse({ x: Math.random() * 30, y: Math.random() * 30, z: 0 }, true);
  };

  return (
    <Canvas>
      <color attach={"background"} args={["cc0000"]} />
      <OrbitControls />
      <Suspense>
        <Stage environment="city" preset="portrait" shadows={{ type: "contact", offset: -0.7 }}>
          <Physics>
            {["B", "o", "r", "n"].map((letter, index) => (
              <RigidBody
                key={index}
                ref={(el) => {
                  if (el) letters.current[index] = el;
                }}
                friction={0.5}
                colliders="cuboid"
                restitution={0.4}
                position={[-2 + index * 3, 5, 0]}
                rotation={[0, 0, Math.random() * 4]}>
                <Text3D
                  onClick={() => bounceLetter(index)}
                  font={"/fonts/romana.json"}
                  bevelEnabled
                  bevelSize={0.05}
                  scale={[3, 3, 3]}>
                  {letter}
                  {/* @ts-ignore */}
                  <MeshTransmissionMaterial
                    transmission={0.8}
                    thickness={4}
                    transmissionSampler={true}
                    chromaticAberration={0.5}
                  />
                </Text3D>
              </RigidBody>
            ))}

            <RigidBody type="fixed" colliders="cuboid" restitution={0} position={[0, -0.5, 0]} friction={0}>
              <mesh>
                <boxGeometry args={[20, 0.5, 20]} />
                <meshBasicMaterial color="black" />
              </mesh>
            </RigidBody>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
              <planeBufferGeometry args={[20, 20]} />
              <MeshReflectorMaterial
                blur={[100, 100]}
                resolution={2048}
                mixBlur={1}
                mixStrength={50}
                roughness={1}
                depthScale={0.4}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#050505"
                metalness={0.5}
                mirror={0}
              />
            </mesh>

            {/* <Debug /> */}
          </Physics>
        </Stage>
      </Suspense>
    </Canvas>
  );
};

export default Page;
