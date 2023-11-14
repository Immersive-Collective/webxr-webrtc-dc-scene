import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';



/* Colors */

const tronLegacyColors = {
    deepBlack: 0x0A0A0A,
    greyMetallic: 0x6F6F6F,
    darkGrey: 0x1C1C1C,
    brightBlue: 0x00D9FF,
    brightOrange: 0xFF3700,
    pureWhite: 0xFFFFFF,
    almostBlack: 0x1A1A1A,
    digitalBlue: 0x0057FF
};


let camera, scene, renderer;
let controls, cameraPositions = []




function addCube(size, position, rotation, wallColor, edgeColor) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshBasicMaterial({ color: wallColor });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(position.x, position.y, position.z);
    cube.rotation.set(rotation.x, rotation.y, rotation.z);
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: edgeColor }));
    cube.add(line);
    scene.add(cube);
}


function addObjects() {
    addCube(2,{x:1,y:2,z:3},{x:0,y:0,z:0},tronLegacyColors.deepBlack,tronLegacyColors.brightOrange )
}


/* Controls */

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

function saveCameraPosition() {
    const cameraData = {
        position: camera.position.clone(),
        rotation: camera.rotation.clone()
    };
    const controlsData = { target: controls.target.clone() };

    // Store individual data (optional based on your use case)
    localStorage.setItem('cameraData', JSON.stringify(cameraData));
    localStorage.setItem('controlsData', JSON.stringify(controlsData));

    // Store combined data
    cameraPositions.push({ camera: cameraData, controls: controlsData });
    localStorage.setItem('cameraPositions', JSON.stringify(cameraPositions));

    console.log(JSON.stringify(cameraPositions[cameraPositions.length-1]));
}

function restoreCameraPosition() {
    try {
        if (localStorage.getItem('cameraPositions') && camera) {
            let data = JSON.parse(localStorage.getItem('cameraPositions'));
            let cam = data[data.length-1].camera;
            let con = data[data.length-1].controls;

            camera.position.copy(new THREE.Vector3().copy(cam.position));
            camera.rotation.set(cam.rotation.x, cam.rotation.y, cam.rotation.z);

            if(controls) {
                controls.target.copy(new THREE.Vector3().copy(con.target));
            }
        } else {
            // Use the default values if no data is available in localStorage
            camera.position.copy(new THREE.Vector3().fromJSON(JSON.parse(DEFAULT_CAMERA_POS)));
            
            let defaultRot = JSON.parse(DEFAULT_CAMERA_ROT);
            camera.rotation.set(defaultRot._x, defaultRot._y, defaultRot._z);

            if(controls) {
                controls.target.copy(new THREE.Vector3().fromJSON(JSON.parse(DEFAULT_CONTROLS_TARGET)));
            }
        }
        controls.update();
    } catch(error) {
        console.error('Error restoring camera position:', error);
    }
}


function makeScene() {

    restoreCameraPosition()    

    addObjects(); 

}




function init() {


    const container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(tronLegacyColors.deepBlack, 10, 50); // white fog that starts at 10 units and ends at 50 units.


    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.6, 0);

    // Checkered plane
    const size = 100, divisions = 100;
    // GridHelper( size : number, divisions : Number, colorCenterLine : Color, colorGrid : Color )
    const gridHelper = new THREE.GridHelper(size, divisions, tronLegacyColors.deepBlack, tronLegacyColors.brightBlue);
    scene.add(gridHelper);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    container.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer));
    //document.body.appendChild(renderer.domElement);

    // VR Button
    document.body.appendChild(VRButton.createButton(renderer));


    // ORBIT CONTROLS
    controls = new OrbitControls(camera, container);

    controls.enableDamping = false;
    //controls.dampingFactor = 0.5;
    //controls.minPolarAngle = 0;
    // controls.maxPolarAngle = Math.PI / 2.1; // This is already the default, means camera can't go more than 90 degrees.        
    controls.minDistance = 0.25; // The closest the camera can get to the target
    controls.maxDistance = 900; // The farthest the camera can be from the target
    const debouncedSave = debounce(saveCameraPosition, 300); // 300ms delay
    controls.addEventListener('end', debouncedSave);





    window.addEventListener('resize', onWindowResize, false);

    makeScene();

    animate();

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    renderer.render(scene, camera);
}


init();
