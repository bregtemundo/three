"use client";

import { CameraShake, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { ReactLenis } from "@studio-freight/react-lenis";
import { useEffect, useRef } from "react";
import Particles from "./Particles";

import styles from "./layout.module.scss";

const Page = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

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
      <img src="/header.jpg" />
      <div className={styles.container}>
        <div className={styles.pill} ref={pillRef}>
          <Canvas ref={canvasRef}>
            <OrbitControls /*ref={canvasRef}*/ />

            <Particles pill={pillRef} canvasRef={canvasRef} />
          </Canvas>
        </div>
      </div>
    </ReactLenis>
  );
};

export default Page;
