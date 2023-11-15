import * as THREE from "three";
import ThreeMeshUI from "three-mesh-ui";

import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import FontJSON from './assets/fonts/AndaleMono-msdf/AndaleMono-msdf.json';
import FontImage from './assets/fonts/AndaleMono-msdf/AndaleMono.png';




/* Colors */

const tronLegacyColors = {
    deepBlack: 0x0a0a0a,
    greyMetallic: 0x6f6f6f,
    darkGrey: 0x1c1c1c,
    brightBlue: 0x00d9ff,
    brightOrange: 0xff3700,
    pureWhite: 0xffffff,
    almostBlack: 0x1a1a1a,
    digitalBlue: 0x0057ff,
};

let camera, scene, renderer;
let controls,
    cameraPositions = [];

const objsToTest = [];
let raycaster;

let light;

/* Camera Positions */
const DEFAULT_CAMERA_ROT =
    '{"isEuler":true,"_x":-0.4890319918221778,"_y":0.029905380566305973,"_z":0.015910295468581418,"_order":"XYZ"}';
const DEFAULT_CAMERA_POS =
    '{"x":0.3966156804487375,"y":8.240668844853648,"z":16.11327172278412}';
const DEFAULT_CONTROLS_TARGET =
    '{"x":-1.8977369150584633,"y":-27.789645896127855,"z":-51.59438146811678}';


function createPopcorn() {

    const popcorn = new THREE.Group();

    const kernelGeometry = new THREE.SphereGeometry(0.5, 6, 6);
    const kernelMaterial = new THREE.MeshPhongMaterial({ color: 0xffffcc });

    for (let i = 0; i < 50; i++) {
        const kernel = new THREE.Mesh(kernelGeometry, kernelMaterial);

        // Randomize the size and rotation
        const scale = 0.3 + Math.random() * 1;
        kernel.scale.set(scale, scale, scale);
        kernel.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        // Randomize the position
        kernel.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);

        objsToTest.push(kernel)

        popcorn.add(kernel);
    }

    //return popcorn;
    scene.add(popcorn)

}


function addCube(size, position, rotation, wallColor, edgeColor, cast = false) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(position.x, position.y, position.z);
    cube.rotation.set(rotation.x, rotation.y, rotation.z);
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: edgeColor }),
    );
    cube.add(line);
    scene.add(cube);
    //objsToTest.push(line);

    if (cast == true) {
        objsToTest.push(cube);
    }
}

function addObjects() {

    addCube(
        2, { x: -3, y: 3, z: -6 }, { x: 0, y: 0, z: 0 },
        tronLegacyColors.deepBlack,
        tronLegacyColors.brightOrange,
        true,
    );
    addCube(
        2, { x: 3, y: 3, z: -6 }, { x: 0, y: 0, z: 0 },
        tronLegacyColors.deepBlack,
        tronLegacyColors.brightOrange,
        true,
    );
    addCube(
        2, { x: 0, y: -1, z: -1 }, { x: 0, y: 0, z: 0 },
        tronLegacyColors.deepBlack,
        tronLegacyColors.brightBlue,
        true,
    );


    createPopcorn();

}

/* Controls */
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

function saveCameraPosition() {
    const cameraData = {
        position: camera.position.clone(),
        rotation: camera.rotation.clone(),
    };
    const controlsData = { target: controls.target.clone() };
    // Store individual data (optional based on your use case)
    localStorage.setItem("cameraData", JSON.stringify(cameraData));
    localStorage.setItem("controlsData", JSON.stringify(controlsData));
    // Store combined data
    cameraPositions.push({ camera: cameraData, controls: controlsData });
    localStorage.setItem("cameraPositions", JSON.stringify(cameraPositions));
    console.log(JSON.stringify(cameraPositions[cameraPositions.length - 1]));
}


function restoreCameraPosition() {
    try {
        if (localStorage.getItem("cameraPositions") && camera) {
            let data = JSON.parse(localStorage.getItem("cameraPositions"));
            let cam = data[data.length - 1].camera;
            let con = data[data.length - 1].controls;
            camera.position.copy(new THREE.Vector3().copy(cam.position));
            camera.rotation.set(cam.rotation.x, cam.rotation.y, cam.rotation.z);
            if (controls) {
                controls.target.copy(new THREE.Vector3().copy(con.target));
            }
        } else {
            // Use the default values if no data is available in localStorage
            camera.position.copy(
                new THREE.Vector3().fromJSON(JSON.parse(DEFAULT_CAMERA_POS)),
            );
            let defaultRot = JSON.parse(DEFAULT_CAMERA_ROT);
            camera.rotation.set(defaultRot._x, defaultRot._y, defaultRot._z);
            if (controls) {
                controls.target.copy(
                    new THREE.Vector3().fromJSON(
                        JSON.parse(DEFAULT_CONTROLS_TARGET),
                    ),
                );
            }
        }
        controls.update();
    } catch (error) {
        console.error("Error restoring camera position:", error);
    }
}

/* Controllers */

import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory.js";
import { XRHandModelFactory } from "./libs/hands/XRHandModelFactory.js";

let hand1, hand2;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

let controllers = [];
let dummyMatrix;

const handModels = {
    left: null,
    right: null,
};
let handModelFactory;
let conS = [];

function generateRayTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    // Create a gradient that starts fading to transparent immediately
    const gradient = ctx.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, "rgba(255, 0, 0, 1)"); // Fully opaque at the start
    gradient.addColorStop(0.1, "rgba(255, 0, 0, 0)"); // Start fading out almost immediately

    // The rest of the gradient is transparent
    gradient.addColorStop(1, "rgba(255, 0, 0, 0)"); // Fully transparent towards the end

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    return canvas;
}

function generatePointerTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;

    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.arc(32, 32, 29, 0, 2 * Math.PI);
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.fill();

    return canvas;
}


function initControllers() {
    const rayTexture = new THREE.CanvasTexture(generateRayTexture());
    rayTexture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
        map: rayTexture,
        transparent: true,
        side: THREE.DoubleSide,
        alphaTest: 0.05,
    });

    const geometry = new THREE.BoxGeometry(0.005, 0.005, 20);
    geometry.translate(0, 0, -10.01);

    const uvAttribute = geometry.getAttribute("uv");
    for (let i = 0; i < uvAttribute.count; i++) {
        uvAttribute.setXY(i, i % 2, Math.floor(i / 4) % 2);
    }

    const linesHelper = new THREE.Mesh(geometry, material);
    linesHelper.rotation.z = 5 * (Math.PI / 4);

    const spriteMaterial = new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(generatePointerTexture()),
        sizeAttenuation: false,
        depthTest: false,
    });

    const pointer = new THREE.Sprite(spriteMaterial);
    pointer.scale.set(0.015, 0.015, 1);
    pointer.renderOrder = Infinity;

    controller1 = renderer.xr.getController(0);
    controller1.name = "controller1";
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.name = "controller2";
    scene.add(controller2);

    const controllerModelFactory = new XRControllerModelFactory();
    handModelFactory = new XRHandModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(
        controllerModelFactory.createControllerModel(controllerGrip1),
    );
    scene.add(controllerGrip1);

    hand1 = renderer.xr.getHand(0);
    hand1.userData.currentHandModel = 0;
    scene.add(hand1);

    handModels.left = [handModelFactory.createHandModel(hand1, "mesh")];
    const model1 = handModels.left[0];
    model1.visible = true;
    hand1.add(model1);

    hand1.addEventListener("pinchend", function () {
        console.log("hand1 pinched");
    });

    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(
        controllerModelFactory.createControllerModel(controllerGrip2),
    );
    scene.add(controllerGrip2);

    hand2 = renderer.xr.getHand(1);
    hand2.userData.currentHandModel = 2;
    scene.add(hand2);

    handModels.right = [handModelFactory.createHandModel(hand2, "mesh")];
    const model2 = handModels.right[0];
    model2.visible = true;
    hand2.add(model2);

    hand2.addEventListener("pinchend", function () {
        console.log("hand2 pinched");
    });

    window.hand1 = hand1;
    window.hand2 = hand2;

    controller1.addEventListener("connected", function (e) {
        console.log("Controller 1 connected!", e.data);
        if (e.data.gamepad !== null) {
            console.log("e.data.gamepad", e.data.gamepad.axes);
            if (conS.filter((obj) => obj.id === 0).length === 0) {
                conS.push({
                    id: 0,
                    data: e.data,
                });
            }
        }
    });

    controller2.addEventListener("connected", function (event) {
        console.log("Controller 2 connected!", event.data);
        if (event.data.gamepad !== null) {
            console.log("event.data.gamepad", event.data.gamepad.axes);
            if (conS.filter((obj) => obj.id === 1).length === 0) {
                conS.push({
                    id: 1,
                    data: event.data,
                });
            }
        }
    });

    controllers.push(controller1);
    controllers.push(controller2);

    controllers.forEach((controller) => {
        const simpleRayGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -10),
        ]);
        const simpleRay = new THREE.Line(
            simpleRayGeometry,
            new THREE.LineBasicMaterial({ color: 0xffffff, visible: true }),
        ); // Invisible for visual purposes
        controller.simpleRay = simpleRay; // Attach the simpleRay to the controller
        controller.add(simpleRay); // Add the simpleRay to the controller object
    });

    controllers.forEach((controller) => {
        const ray = linesHelper.clone();
        const point = pointer.clone();
        controller.add(ray, point);
        controller.ray = ray;
        controller.point = point;
    });

    const discRadius = 0.25;
    const discMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
    });
    const discGeometry = new THREE.CircleGeometry(discRadius, 32);

    controllers.forEach((controller) => {
        const disc = new THREE.Mesh(discGeometry, discMaterial);
        disc.visible = false; // Initially invisible
        controller.disc = disc; // Store the disc as a property of the controller
        scene.add(disc);
    });

    dummyMatrix = new THREE.Matrix4();
    raycaster = new THREE.Raycaster();



}

function raycast() {
    return objsToTest.reduce((closestIntersection, obj) => {
        const intersection = raycaster.intersectObject(obj, true);

        if (!intersection[0]) return closestIntersection;

        if (
            !closestIntersection ||
            intersection[0].distance < closestIntersection.distance
        ) {
            intersection[0].object = obj;
            return intersection[0];
        }

        return closestIntersection;
    }, null);
}

function updateRaycasting() {
    controllers.forEach((controller) => {
        // Use the simple ray attached to the controller for raycasting
        const simpleRay = controller.simpleRay;

        // Update raycaster using simpleRay's world position and direction
        raycaster.ray.origin.setFromMatrixPosition(simpleRay.matrixWorld);
        const rayDirection = new THREE.Vector3(0, 0, -1).applyMatrix4(
            simpleRay.matrixWorld,
        );
        rayDirection.sub(raycaster.ray.origin).normalize();
        raycaster.ray.direction.copy(rayDirection);

        // Perform raycasting and find the closest intersection
        const intersects = raycaster.intersectObjects(objsToTest, false);
        if (intersects.length > 0) {
            const closestIntersection = intersects.reduce(
                (closest, intersect) => {
                    return !closest || intersect.distance < closest.distance
                        ? intersect
                        : closest;
                },
                null,
            );

            if (closestIntersection) {
                const intersectPoint = closestIntersection.point;
                const intersectNormal = closestIntersection.face.normal;

                const disc = controller.disc;

                // Offset the disc position slightly above the intersection point
                const offsetDistance = 0.01; // Small offset to prevent z-fighting
                const offsetPoint = intersectPoint
                    .clone()
                    .add(intersectNormal.multiplyScalar(offsetDistance));
                disc.position.copy(offsetPoint);

                disc.lookAt(
                    offsetPoint.x + intersectNormal.x,
                    offsetPoint.y + intersectNormal.y,
                    offsetPoint.z + intersectNormal.z,
                );

                disc.visible = true;

                controller.worldToLocal(intersectPoint);
                controller.point.position.copy(intersectPoint);
                controller.point.visible = true;
            }
        } else {
            if (controller.disc) {
                controller.disc.visible = false;
            }
            controller.point.visible = false;
        }
    });
}

function render() {

    ThreeMeshUI.update();

    updateRaycasting();

    renderer.render(scene, camera);
}


/* WebRTC */


function createWebRTCCapabilitiesPanel(webrtcCapabilities) {

    const container = new ThreeMeshUI.Block({
        justifyContent: 'center',
        contentDirection: 'column',
        fontFamily: FontJSON,
        fontTexture: FontImage,
        fontSize: 0.04,
        padding: 0.02,
        width: 1,
        borderRadius: 0.11
    });

    container.position.set(0, 1.3, -2.2);
    container.rotation.x = -0.55;
    scene.add(container);

    const buttonOptions = {
        width: 0.6,
        height: 0.15,
        justifyContent: 'center',
        offset: 0.05,
        margin: 0.02,
        borderRadius: 0.075
    };

    for (const key in webrtcCapabilities) {
        
        const button = new ThreeMeshUI.Block(buttonOptions);

        button.add(new ThreeMeshUI.Text({ content: key }));

        console.log("key", key)

        const idleStateAttributes = {
            state: 'idle',
            attributes: {
                offset: 0.035,
                backgroundColor: new THREE.Color(0x666666),
                backgroundOpacity: webrtcCapabilities[key] ? 1 : 0.3,
                fontColor: new THREE.Color(0xffffff)
            },
        };

        button.setupState(idleStateAttributes);

        if (webrtcCapabilities[key]) {
            const hoveredStateAttributes = {
                state: 'hovered',
                attributes: {
                    offset: 0.035,
                    backgroundColor: new THREE.Color(0x999999),
                    backgroundOpacity: 1,
                    fontColor: new THREE.Color(0xffffff)
                },
            };
            button.setupState(hoveredStateAttributes);
            // Add any specific function you want to execute on click
            // Example: button.setupState({ state: 'selected', ... });
        }

        container.add(button);
    }

    return container;
}



function addWebcamTextureToMesh() {

    // Example usage:
    // Assuming you have a mesh (like a plane) in your scene
    const myMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    myMesh.position.set(0,5,-4)
    scene.add(myMesh);

    // Constraints for the media stream (video only in this case)
    const constraints = { video: true };

    // Obtain media stream from webcam
    navigator.mediaDevices.getUserMedia(constraints)
        
        .then(stream => {
            // Create a video element
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();

            // Create a texture from the video
            const texture = new THREE.VideoTexture(video);
            texture.minFilter = THREE.LinearFilter;
            //texture.format = THREE.RGBFormat;

            // Apply this texture to the mesh material
            myMesh.material.map = texture;
            myMesh.material.needsUpdate = true;
        })

        .catch(error => {
            console.error('Error accessing webcam:', error);
        });

}


function applyWebcamTextureToMeshes() {

    const startButton = document.getElementById("startButton");

    const constraints = { video: true };

    let video = document.createElement('video');
    video.playsInline = true;
    video.muted = true;

    let texture;

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            video.srcObject = stream;
            texture = new THREE.VideoTexture(video);
            texture.minFilter = THREE.LinearFilter;
        })
        .catch(error => {
            console.error('Error accessing webcam:', error);
        });

    const applyTextureToMesh = (mesh) => {
        mesh.material.map = texture;
        mesh.material.needsUpdate = true;
    };

    // Function to start video playback
    const startVideo = () => {

        console.log("startVideo")

        video.play().then(() => {
            scene.traverse((object) => {
                if (object.isMesh) {
                    applyTextureToMesh(object);
                    console.log("applyTextureToMesh")
                }
            });
        }).catch(error => console.error("Error playing video:", error));

        // Optionally, hide or disable the start button after starting the video
        startButton.visible = false;
    };

    // Attach the startVideo function to your start button
    startButton.addEventListener("click", () => startVideo());

}



// function applyWebcamTextureToMeshes() {
//     // Constraints for the media stream (video only in this case)
//     const constraints = { video: true };

//     // Obtain media stream from webcam
//     navigator.mediaDevices.getUserMedia(constraints)
//         .then(stream => {
//             // Create a video element
//             const video = document.createElement('video');
//             video.srcObject = stream;
//             video.play();

//             // Create a texture from the video
//             const texture = new THREE.VideoTexture(video);
//             texture.minFilter = THREE.LinearFilter;

//             // Function to apply texture to a mesh
//             const applyTextureToMesh = (mesh) => {
//                 mesh.material.map = texture;
//                 mesh.material.needsUpdate = true;
//             };

//             // Traverse the scene and apply texture to all meshes
//             scene.traverse((object) => {
//                 if (object.isMesh) {
//                     applyTextureToMesh(object);
//                 }
//             });
//         })
//         .catch(error => {
//             console.error('Error accessing webcam:', error);
//         });
// }






function checkWebRTCCapabilities() {
  const capabilities = {
    getUserMedia: false,
    getDisplayMedia: false,
    RTCPeerConnection: false
  };

  if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
    capabilities.getUserMedia = true;
  }

  if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
    capabilities.getDisplayMedia = true;
  }

  if (window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection) {
    capabilities.RTCPeerConnection = true;
  }

  return capabilities;
}





/* Floor */

function createFloor() {
    const geometry = new THREE.BoxGeometry(20, 0.1, 20); // Thin, flat box
    const material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.DoubleSide,
        visible: false,
    });
    const floor = new THREE.Mesh(geometry, material);
    floor.position.y = -0.05; // Adjust to align the top surface with y = 0
    floor.name = "Floor";
    scene.add(floor);
    objsToTest.push(floor);
}





/* Scene */


function initWebRTC() {

    const webrtcCapabilities = checkWebRTCCapabilities();

    console.log("webrtcCapabilities", webrtcCapabilities);

    const capabilitiesPanel = createWebRTCCapabilitiesPanel(webrtcCapabilities);

    // addWebcamTextureToMesh();

    applyWebcamTextureToMeshes();

}






function makeScene() {

    restoreCameraPosition();

    addObjects();

    createFloor();

    initControllers();

    initWebRTC()
}




function init() {
    const container = document.createElement("div");
    document.body.appendChild(container);

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(tronLegacyColors.deepBlack, 10, 50); // white fog that starts at 10 units and ends at 50 units.
    // scene.background
    scene.background = new THREE.Color(tronLegacyColors.darkGrey);

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        100,
    );
    camera.position.set(0, 1.6, 0);

    // Checkered plane
    const size = 100,
        divisions = 100;
    // GridHelper( size : number, divisions : Number, colorCenterLine : Color, colorGrid : Color )
    const gridHelper = new THREE.GridHelper(
        size,
        divisions,
        tronLegacyColors.deepBlack,
        tronLegacyColors.brightBlue,
    );
    scene.add(gridHelper);

    //objsToTest.push(gridHelper);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    // Set foveation level here
    renderer.xr.setFoveation(0.33); // Example: 0.5 is a mid-level foveation

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
    controls.addEventListener("end", debouncedSave);

    // light
    const hemilight = new THREE.HemisphereLight(0xf6ffff, 0xfffddc, 1.3);
    scene.add(hemilight);

    light = new THREE.DirectionalLight(0xe6ffff, 3);

    scene.add(light);
    light.position.set(0, 1.2, -10);
    light.castShadow = true;
    light.shadow.camera.left = -5;
    light.shadow.camera.right = 5;
    light.shadow.camera.top = 5;
    light.shadow.camera.bottom = -5;
    light.shadow.camera.near = 0.3;
    light.shadow.camera.far = 512;
    light.shadow.mapSize.set(256 * 10, 256 * 10);
    light.shadow.radius = 1;

    window.addEventListener("resize", onWindowResize, false);

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

init();