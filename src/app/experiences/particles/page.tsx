"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { TextureLoader } from "three";
import Particles from "./Particles";

const Page = () => {
  return (
    <Canvas>
      <OrbitControls />
      <Particles />
    </Canvas>
  );
};

export default Page;
