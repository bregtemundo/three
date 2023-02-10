"use client";

import {
  Backdrop,
  Box,
  Center,
  MeshReflectorMaterial,
  MeshRefractionMaterial,
  MeshTransmissionMaterial,
  OrbitControls,
  RoundedBox,
  Sphere,
  Stage,
  Text3D,
  Torus,
  useCursor,
  useNormalTexture,
} from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { Physics, RigidBody, Debug, CuboidCollider } from "@react-three/rapier";
import { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import { TextureLoader } from "three/src/loaders/TextureLoader";

type HumptyProps = {
  position: [number, number, number];
  color: string;
};

const Hump = ({ position, color }: HumptyProps) => {
  const [normalMap, url] = useNormalTexture(51, {
    offset: [0, 0],
    repeat: [4, 4],
    anisotropy: 8,
  });
  const [displacementMap, normalMap2, roughnessMap, aoMap] = useLoader(TextureLoader, [
    "/Clay_001_height.png",
    "/Clay_001_normal.jpg",
    "/Clay_001_roughness.jpg",
    "/Clay_001_ambientOcclusion.jpg",
  ]);
  const repeat = 4;
  //displacementMap.repeat.set(repeat, repeat);

  const letters = useRef<any[]>([]);

  const indent = (e: any) => {
    console.log(e);
  };

  return (
    <Sphere castShadow receiveShadow args={[1, 100, 100]} position={position} onClick={indent}>
      <meshStandardMaterial
        color={color}
        //roughness={0.3}
        normalMap={normalMap2}
        //metalness={0.3}
        displacementMap={displacementMap}
        displacementScale={0.1}
        displacementBias={-0.2}
        bumpMap={displacementMap}
        bumpScale={0.9}
        roughnessMap={roughnessMap}
        //aoMap={roughnessMap}
      />
    </Sphere>
  );
};

export default Hump;
