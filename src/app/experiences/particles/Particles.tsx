"use client";

import { OrbitControls, Points } from "@react-three/drei";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { TextureLoader } from "three";

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

  displaced.xy += vec2(random(pindex) - 0.5, random(position.x + pindex) - 0.5) * uRandom;
	float rndz = (random(pindex) + snoise2(vec2(pindex * 0.1, uTime * 0.1)));
	displaced.z += rndz * (random(pindex) * 2.0 * uDepth);
  

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
	 float dist = radius - distance(uv, vec2(0.5));
	 float t = smoothstep(0.0, border, dist);

	// final color
	color = colA;
	color.a = t + .2 ;

	//gl_FragColor = colB;
  
  
    if (length(gl_PointCoord - vec2(0.5, 0.5)) < radius) {
        gl_FragColor = color;
    } else {
        discard; // discard pixels outside the circle
    }
    
}
  `,
};

const Particles = () => {
  const ref = useRef();

  useFrame(({ clock }) => {
    if (!ref?.current) return;
    ref.current.material.uniforms.uTime.value = clock.getElapsedTime();
  });
  const [count, setcount] = useState(3000);
  const [radius, setradius] = useState(20);

  // load an image texture from /public, loop through the pixels and create a particle for each pixel
  const imageTexture = useLoader(THREE.TextureLoader, "/sample-05.png");
  //const imageTexture = useLoader(THREE.TextureLoader, "/seal.png");
  //const imageTextureData = useLoader(THREE.DataTextureLoader, "/seal.png");
  //const originalColors = Float32Array.from(imageTexture.);
  useEffect(() => {
    if (!ref.current) return;
    if (!imageTexture) return;
    ref.current.material.uniforms.uTexture.value = imageTexture;
    ref.current.material.uniforms.uTextureSize.value = new THREE.Vector2(
      imageTexture.image.width,
      imageTexture.image.height
    );
  }, [ref.current, imageTexture]);

  const numPoints = imageTexture.image.width * imageTexture.image.height;
  let numVisible = 0;
  const threshold = 0;
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

  numVisible = numPoints;

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
    //if (originalColors[i * 4 + 0] <= threshold) continue;

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
  console.log(positions);

  return (
    <points ref={ref}>
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
      {/* <pointsMaterial vertexColors={true} sizeAttenuation depthWrite={true} /> */}
      <shaderMaterial
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
