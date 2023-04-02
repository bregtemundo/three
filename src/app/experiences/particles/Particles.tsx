"use client";

import { OrbitControls, Points } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Mesh, ShaderMaterial, TextureLoader } from "three";
import { useTransform, useScroll, useTime } from "framer-motion";

var glslify = require("glslify");

// Custom shader material
const CustomMaterial = {
  uniforms: {
    uTime: { value: 0.0 },
    uRandom: { value: 0.1 },
    uDepth: { value: 1.1 },
    uSize: { value: 0.02 },
    uTextureSize: { value: new THREE.Vector2(300, 300) },
    uTexture: { value: "" },
    uTouch: { value: null },
    uMotion: { value: 3.0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  },
  vertexShader: `
  attribute float pindex;
  //attribute vec3 position;
  attribute vec3 offset;
  //attribute vec2 uv;
  attribute float angle;

uniform float uTime;
uniform float uRandom;
uniform float uDepth;
uniform float uSize;
uniform vec2 uTextureSize;
uniform sampler2D uTexture;
uniform sampler2D uTouch;
uniform float uMotion;

varying vec2 vPUv;
varying float pointsize;

  varying vec2 vUv;


  float rand(vec2 n) { 
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }
  
  float snoise2(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    
    float res = mix(
      mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
      mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
  }
  
  float random(float n) {
    return fract(sin(n) * 43758.5453123);
  }

void main() {
  vUv = uv;

	// particle uv
	vec2 puv = position.xy / uTextureSize;
	vPUv = puv;

  // pixel color
	vec4 colA = texture2D(uTexture, puv);
	float grey = colA.r * 0.21 + colA.g * 0.71 + colA.b * 0.07;

  vec3 displaced = position;

  float xMove = sin(position.x +  position.y  + uTime);
  float yMove = sin(position.y + uTime);

  displaced.z += (xMove )  *  uMotion;
  //displaced.y += yMove * 0.8;

  //displaced.xy += vec2(random(pindex) - 0.5, random(position.x + pindex) - 0.5) * uRandom;
	float rndz = (random(pindex) + snoise2(vec2(pindex * 0.1, uTime * 0.1)));
	//displaced.z += rndz * (random(pindex) * 2.0 * uDepth);
  

  // center
	displaced.xy -= uTextureSize * 0.5;

  // particle size
	float psize = (snoise2(vec2(uTime, pindex) * 0.5) + 2.0);
	psize *= max(grey, 0.2);
	psize *= uSize;

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
	mvPosition.xyz += position * psize;
	vec4 finalPosition = projectionMatrix * mvPosition;

  gl_Position = finalPosition;
  pointsize = psize ;
  gl_PointSize =  400.0 * grey * psize;
  
}
  `,
  fragmentShader: `
  precision highp float;
  

  uniform sampler2D uTexture;
  uniform vec2 uMouse;
  uniform vec2 uResolution;

varying vec2 vPUv;
varying vec2 vUv;
varying float pointsize;


void main() {
	vec4 color = vec4(0.0);
	vec2 uv = vUv;
	vec2 puv = vPUv;

	// pixel color
	vec4 colA = texture2D(uTexture, puv);

	// greyscale
	float grey = colA.r * 0.21 + colA.g * 0.71 + colA.b * 0.07;
	vec4 colB = vec4(grey, grey, grey, 1.0);

	// circle
	 float border = 0.3;
	 float radius =  0.5;
	 //float dist = radius - distance(uv, vec2(0.5));
	 //float t = smoothstep(0.0, border, dist);

	// final color
	color = colB;
	//color.a = 0.1 ;

  // if distance to uMouse is less than radius, use colA else use colB
  //float dist = length(uMouse - gl_FragCoord.xy);

  // Calculate  coordinates
  vec2 st = (gl_FragCoord.xy - vec2(uResolution.x, uResolution.y)) / uResolution.xy;
      
  float dist = distance(st, uMouse);
 
  //float dist = length(uMouse - ndc);

  if(abs(dist) < .12){
    color = colA;
  } 
  else{color =  colB;}

	//gl_FragColor = colB;
  
  //float dist = length(gl_PointCoord - vec2(0.5, 0.5));
  float t = dist / radius; // calculate interpolation factor
  vec4 endColor = vec4(0.0, 0.0, 0.0, 0.0);
    if (length(gl_PointCoord - vec2(0.5, 0.5)) < radius) {
        // gradiant
        //color.a = t;
        gl_FragColor = color;
        // color fade
        //gl_FragColor = mix( endColor, color, t);
    } else {
        discard; // discard pixels outside the circle
    }
    
}
  `,
};

type ParticlesProps = {
  pill: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
};

const Particles = ({ pill, canvasRef }: ParticlesProps) => {
  const ref = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  const { scrollYProgress } = useScroll({
    target: pill,
    //offset: ["50% end"],
  });
  const pillWidth = useTransform(scrollYProgress, [0, 1], [100, 50]);
  const clipPathWidth = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const clipPathRadius = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const motionAmount = useTransform(scrollYProgress, [0, 1], [6, 0]);
  const backgroundColor = useTransform(scrollYProgress, [0, 1], ["#222222", "#1e1e1e"]);
  const cameraPosition = useTransform(
    scrollYProgress,
    [0, 1],
    [
      [-2.9101373606688017, -64.38964459455003, 8.252288300761979],
      [0, 0, 114],
    ]
  );
  const cameraRotation = useTransform(
    scrollYProgress,
    [0, 1],
    [
      [1.4433294643892935, -0.0447990729184042, 0.3361706600681633],
      [0, 0, 0],
    ]
  );

  useFrame(({ clock, camera, mouse }) => {
    const offsetX = mouse.x * 5;
    const offsetY = mouse.y * 5;

    camera.rotation.set(cameraRotation.get()[0], cameraRotation.get()[1], cameraRotation.get()[2]);
    camera.position.set(
      cameraPosition.get()[0] + offsetX,
      cameraPosition.get()[1] + offsetY,
      cameraPosition.get()[2]
    );

    if (pill?.current) {
      const destWidth = window.innerWidth - (clipPathWidth.get() / 100) * (window.innerWidth - 415);
      //convert width to inset percentage
      const w = (100 * (window.innerWidth - destWidth)) / window.innerWidth / 2;

      pill.current.style.clipPath = `inset(0% ${w}% round ${clipPathRadius.get()}%)`;
      pill.current.style.backgroundColor = `${backgroundColor.get()}`;
    }
    if (!materialRef?.current || !canvasRef?.current) return;
    if (!materialRef.current?.uniforms?.uTime) return;
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    materialRef.current.uniforms.uMotion.value = motionAmount.get();

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mousePos = new THREE.Vector2(
      (mouse.x - canvasRect.left) / canvasRect.width,
      (mouse.y - canvasRect.top) / canvasRect.height
    );
    materialRef.current.uniforms.uMouse.value = [mouse.x, mouse.y];
  });

  useEffect(() => {
    const handleResize = () => {
      if (materialRef.current)
        materialRef.current.uniforms.uResolution.value = new THREE.Vector2(
          window.innerWidth,
          window.innerHeight
        );
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const limitPoints = false;

  // load an image texture from /public, loop through the pixels and create a particle for each pixel
  const imageTexture = useLoader(THREE.TextureLoader, "/sample-05.png");
  //const imageTexture = useLoader(THREE.TextureLoader, "/seal.png");
  //const imageTextureData = useLoader(THREE.DataTextureLoader, "/seal.png");
  //const originalColors = Float32Array.from(imageTexture.);
  useEffect(() => {
    if (!materialRef.current) return;
    if (!imageTexture) return;
    if (!materialRef.current?.uniforms?.uTexture) return;
    materialRef.current.uniforms.uTexture.value = imageTexture;
    materialRef.current.uniforms.uTextureSize.value = new THREE.Vector2(
      imageTexture.image.width,
      imageTexture.image.height
    );
  }, [materialRef.current, imageTexture]);

  const numPoints = imageTexture.image.width * imageTexture.image.height;
  let numVisible = 0;
  const threshold = 20;
  // Get image data
  const canvas = document.createElement("canvas");
  canvas.width = imageTexture.image.width;
  canvas.height = imageTexture.image.height;
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(imageTexture.image, 0, 0);
  const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
  const originalColors = Float32Array.from(imageData?.data || []);

  numVisible = 0;
  for (let i = 0; i < numPoints; i++) {
    if (originalColors[i * 4 + 0] > threshold) numVisible++;
  }

  if (!limitPoints) numVisible = numPoints;

  // positions
  const positions = new Float32Array(numVisible * 3);
  //positions.set([-0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0]);

  // positions.setXYZ(0, -0.5, 0.5, 0.0);
  // positions.setXYZ(1, 0.5, 0.5, 0.0);
  // positions.setXYZ(2, -0.5, -0.5, 0.0);
  // positions.setXYZ(3, 0.5, -0.5, 0.0);

  // uvs
  const uvs = new Float32Array(4 * 2);
  uvs.set([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]);
  // uvs.setXYZ(0, 0.0, 0.0);
  // uvs.setXYZ(1, 1.0, 0.0);
  // uvs.setXYZ(2, 0.0, 1.0);
  // uvs.setXYZ(3, 1.0, 1.0);

  // index
  const index = new Uint16Array([0, 2, 1, 2, 3, 1]);

  const indices = new Uint16Array(numVisible);
  const offsets = new Float32Array(numVisible * 3);
  const angles = new Float32Array(numVisible);
  // const vertexColors = new Float32Array(numVisible * 4);

  for (let i = 0, j = 0; i < numPoints; i++) {
    if (limitPoints && originalColors[i * 4 + 0] <= threshold) continue;

    // vertexColors[j * 4 + 0] = originalColors[i * 4 + 0] / 255;
    // vertexColors[j * 4 + 1] = originalColors[i * 4 + 1] / 255;
    // vertexColors[j * 4 + 2] = originalColors[i * 4 + 2] / 255;
    // vertexColors[j * 4 + 3] = originalColors[i * 4 + 3] / 255;

    offsets[j * 3 + 0] = i % imageTexture.image.width;
    offsets[j * 3 + 1] = Math.floor(i / imageTexture.image.width);

    positions[j * 3 + 0] = i % imageTexture.image.width;
    positions[j * 3 + 1] = Math.floor(i / imageTexture.image.width);
    positions[j * 3 + 2] = 1;

    indices[j] = i;

    angles[j] = Math.random() * Math.PI;

    j++;
  }

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />

        {/* <bufferAttribute attach="index" array={index} count={index.length} itemSize={1} /> */}

        {/* <bufferAttribute attach="attributes-uv" count={uvs.length / 2} array={uvs} itemSize={2} /> */}
        <bufferAttribute attach="attributes-pindex" count={indices.length / 1} array={indices} itemSize={1} />
        <bufferAttribute attach="attributes-offset" count={offsets.length / 3} array={offsets} itemSize={3} />
        <bufferAttribute attach="attributes-angle" count={angles.length / 1} array={angles} itemSize={1} />

        {/* <bufferAttribute
          attach="attributes-color"
          count={vertexColors.length / 4}
          array={vertexColors}
          itemSize={4}
        /> */}
      </bufferGeometry>
      {/* <pointsMaterial sizeAttenuation color={"#CCFF00"} depthWrite={true} /> */}
      <shaderMaterial
        ref={materialRef}
        depthWrite={false}
        uniforms={CustomMaterial.uniforms}
        vertexShader={CustomMaterial.vertexShader}
        fragmentShader={CustomMaterial.fragmentShader}
      />
    </points>
  );
};

export default Particles;

/*
 
      */
