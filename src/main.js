import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0d1317, 0.05);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 5);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace; 

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); 
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0x88ccff, 1.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; 

const loader = new GLTFLoader();
let guardianModel = null;

loader.load(
  '/models/sprite_guardian.glb', 
  (gltf) => {
    guardianModel = gltf.scene;
    guardianModel.position.set(0, -0.5, 0); 
    scene.add(guardianModel);
    console.log('✅ 守護者精靈載入成功！');
  },
  undefined,
  (error) => {
    console.error('❌ 模型載入發生錯誤:', error);
  }
);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
function tick() {
    const elapsedTime = clock.getElapsedTime();
    if(guardianModel) {
        guardianModel.position.y = -0.5 + Math.sin(elapsedTime * 1.5) * 0.1;
    }
    controls.update();
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
}
tick();