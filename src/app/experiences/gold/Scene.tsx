import * as THREE from "three";
import { Environment, OrbitControls, useGLTF, Gltf, MeshPortalMaterial, Clone } from "@react-three/drei";
import { applyProps, Canvas, extend, useFrame } from "@react-three/fiber";
import { ReactLenis } from "@studio-freight/react-lenis";
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { geometry } from "maath";

extend(geometry);
const zPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const yPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1);
const carRotation = Math.PI / 10;
const startPosition = [-0.3, -0.3, -1.6];

function Scene() {
  const porscheRef = useRef<THREE.Object3D>(null);
  const porscheRef2 = useRef<THREE.Object3D>(null);

  useFrame(() => {
    if (porscheRef?.current && porscheRef2?.current) {
      const newZ = porscheRef.current.position.z + 0.01;

      if (newZ < 0.02) {
        porscheRef.current.translateZ(0.04);
        porscheRef2.current.translateZ(0.04);
        //porscheRef.current.position.z = porscheRef2.current.position.z = newZ;
      }
    }
  });

  return (
    <mesh>
      <roundedPlaneGeometry args={[1.6, 1.6, 0.05]} />
      <MeshPortalMaterial>
        <color attach="background" args={["#ffffff"]} />
        <Porsche
          ref={porscheRef}
          clip={false}
          scale={0.6}
          position={startPosition}
          rotation={[0, carRotation, 0]}
        />

        <Environment preset="city" />
      </MeshPortalMaterial>
      <Porsche
        ref={porscheRef2}
        scale={0.6}
        clip={true}
        position={startPosition}
        rotation={[0, carRotation, 0]}
      />

      <Environment preset="city" />
    </mesh>
  );
}

const Porsche = forwardRef(
  (
    props: {
      clip: boolean;
      scale: number;
      position: [number, number, number];
    },
    ref
  ) => {
    const clip = props.clip;

    const file = clip ? "/911-transformed.glb" : "/911-transformed2.glb";
    const { scene, nodes, materials } = useGLTF(file);
    useLayoutEffect(() => {
      Object.values(nodes).forEach((node) => node.isMesh && (node.receiveShadow = node.castShadow = true));
      Object.values(materials).forEach((material) => {
        if (clip) {
          applyProps(material, { clippingPlanes: [zPlane, yPlane] });
          //materials.clippingPlanes = [zPlane, yPlane];
        }
      });
      applyProps(materials.rubber, {
        color: "black",
        roughness: 0.6,
        roughnessMap: null,
        normalScale: [4, 4],
      });
      applyProps(materials.window, {
        color: "black",
        roughness: 0,
        clearcoat: 0.1,
      });
      applyProps(materials.coat, {
        envMapIntensity: 4,
        roughness: 0.5,
        metalness: 1,
      });
      applyProps(materials.paint, {
        envMapIntensity: 2,
        roughness: 0.15,
        metalness: 0.9,
        color: clip ? "gold" : "gold",
      });
    }, [nodes, materials]);

    return <Clone ref={ref} {...props} object={scene} />;
  }
);

export default Scene;
