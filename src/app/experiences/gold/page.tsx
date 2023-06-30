"use client";

import * as THREE from "three";
import { Environment, OrbitControls, useGLTF, Gltf, MeshPortalMaterial, Clone } from "@react-three/drei";
import { applyProps, Canvas, extend, useFrame } from "@react-three/fiber";
import { ReactLenis } from "@studio-freight/react-lenis";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { geometry } from "maath";
import styles from "./layout.module.scss";
import Scene from "./scene";

extend(geometry);
const zPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const yPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1);

const Page = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mode, setmode] = useState("gold");

  useEffect(() => {
    console.log(canvasRef.current);
  }, [canvasRef]);

  return (
    <ReactLenis
      root
      options={{
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
        orientation: "vertical", // vertical, horizontal
        gestureOrientation: "vertical", // vertical, horizontal, both
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      }}>
      <div
        className={styles.scene}
        onClick={() => {
          mode === "gold" ? setmode("white") : setmode("gold");
        }}>
        MODE:{mode}
        <Canvas ref={canvasRef} gl={{ localClippingEnabled: true }}>
          <OrbitControls /*ref={canvasRef}*/ />
          <Scene />
        </Canvas>
      </div>
    </ReactLenis>
  );
};

export default Page;
