'use client';
import * as THREE from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
export function setupRenderer(gl: THREE.WebGLRenderer) {
  gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = 1.0;
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
}
export function ktx2Loader(gl: THREE.WebGLRenderer) {
  const loader = new KTX2Loader();
  // Mevcutsa transcoder path public/basis altında olabilir; yoksa loader devre dışı kalır.
  loader.detectSupport(gl);
  return loader;
}
export function dracoLoader() {
  const draco = new DRACOLoader();
  // İstersen: draco.setDecoderPath('/draco/');
  return draco;
}
