"use client";

import {
  Backdrop,
  Box,
  Center,
  Float,
  MeshReflectorMaterial,
  MeshRefractionMaterial,
  MeshTransmissionMaterial,
  OrbitControls,
  Sphere,
  SpotLight,
  Stage,
  Text3D,
  Torus,
  useCursor,
  useNormalTexture,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, Debug, CuboidCollider } from "@react-three/rapier";
import { Suspense, useRef, useState } from "react";
import Hump from "./Hump";
import styles from "./page.module.scss";

const Page = () => {
  return (
    <Canvas>
      <color attach={"background"} args={["orange"]} />
      <OrbitControls />

      <Suspense>
        <Stage
          intensity={0.3}
          environment="sunset"
          preset="upfront"
          shadows={{ type: "contact", offset: 0, opacity: 0.2, color: "brown" }}>
          <Center>
            <Float speed={3} castShadow={false}>
              <Hump position={[0, 1, 0]} color={"orange"} />
              {/* <Hump position={[1.5, 0, 0]} color={"green"} />
            <Hump position={[3, 0, 0]} color={"darkblue"} />
            <Hump position={[4.5, 0, 0]} color={"black"} /> */}
            </Float>
          </Center>
        </Stage>
      </Suspense>
    </Canvas>
  );
};

export default Page;
