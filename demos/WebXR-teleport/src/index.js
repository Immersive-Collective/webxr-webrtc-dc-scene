import * as THREE from "three";
import ThreeMeshUI from "three-mesh-ui";

import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

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
        const scale = 0.5 + Math.random() * 0.5;
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

    let rsize = Math.ceil(Math.random()*10)

    const geometry = new THREE.BoxGeometry(size, rsize, size, 2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ color: wallColor });
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


    function generateUniquePositions(count, min, max, spacing) {
        const positions = new Set();
        while (positions.size < count) {
            const x = Math.floor(Math.random() * (max - min + 1)) + min;
            const y = 0.25; //Math.floor(Math.random() * (max - min + 1)) + min;
            const z = Math.floor(Math.random() * (max - min + 1)) + min;
            const position = `${x * spacing},${y * spacing},${z * spacing}`;
            positions.add(position);
        }
        return Array.from(positions).map(pos => pos.split(',').map(Number));
    }

    const uniquePositions = generateUniquePositions(40, -10, 10, 1); // Generates 10 unique positions

    uniquePositions.forEach(pos => {
        
        console.log(pos)

        const [x, y, z] = pos;

        addCube(
            1, // Cube size
            { x, y, z }, // Position
            { x: 0, y: 0, z: 0 }, // Rotation
            tronLegacyColors.deepBlack, // Color 1
            tronLegacyColors.brightBlue, // Color 2
            true // Other parameters if needed
        );
    });




    // createPopcorn()

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

const objsToTest = [];
let raycaster;

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

let teleportMode = false;
let teleportRing;
let cameraContainer
let activeController




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


    /* 
        Teleportation 

    */



    const teleportRingGeometry = new THREE.RingGeometry(0.2, 0.25, 32);
    const teleportRingMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
    teleportRing = new THREE.Mesh(teleportRingGeometry, teleportRingMaterial);
    teleportRing.rotation.x = -Math.PI / 2; // Rotate to lay flat on the ground
    teleportRing.visible = false; // Initially invisible
    scene.add(teleportRing);


    cameraContainer = new THREE.Object3D();
    scene.add(cameraContainer);
    
    cameraContainer.add(camera);

    /* parent controllers to the container */
    cameraContainer.add(controller1);
    cameraContainer.add(controller2);  

    cameraContainer.add(hand1)
    cameraContainer.add(hand2)

    cameraContainer.add(model1)
    cameraContainer.add(model2)

    cameraContainer.add(controllerGrip1)
    cameraContainer.add(controllerGrip2)


    controller1.addEventListener('selectstart', function () {
        teleportMode = true;
        activeController = controller1;
        teleportRing.visible = true;
    });

    controller1.addEventListener('selectend', performTeleportation);

    controller2.addEventListener('selectstart', function () {
        teleportMode = true;
        activeController = controller2;
        teleportRing.visible = true;
    });

    controller2.addEventListener('selectend', performTeleportation);

    function performTeleportation() {
        if (teleportMode && teleportRing.visible) {
            
            const teleportDestination = new THREE.Vector3();
            teleportRing.getWorldPosition(teleportDestination);
            
            //teleportDestination.y = cameraContainer.position.y; // Adjust height
            cameraContainer.position.copy(teleportDestination);

            teleportMode = false;
            teleportRing.visible = false; // Hide the ring
            activeController = null;
        }
    }



    // controller1.addEventListener('selectstart', function () {
    //     console.log("controller1 selectstart")
    //     teleportMode = true; // Enable teleportation mode
    //     teleportRing.visible = true; // Show teleportation ring
    // });

    // controller1.addEventListener('selectend', function () {
    //     console.log("controller1 selectend")
    //     if (teleportMode && controller1.disc.visible) {
            
    //         // Get world position of the teleportation disc
            
    //         const teleportDestination = new THREE.Vector3();
    //         controller1.disc.getWorldPosition(teleportDestination);

    //         // You might want to adjust the y-coordinate based on your application's need
    //         // For instance, setting it to a standard player height or keeping the current height:
    //         // teleportDestination.y = cameraContainer.position.y; 

    //         // Move the container, which effectively teleports the camera
    //         cameraContainer.position.copy(teleportDestination);

    //         teleportMode = false; // Disable teleportation mode
    //         controller1.disc.visible = false; // Hide the disc

    //         teleportRing.visible = false; // Hide the ring


    //     }
    // });



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

        const intersects = raycaster.intersectObjects(objsToTest, false);

 
            // Perform normal raycasting
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

                    teleportRing.position.copy(intersectPoint);

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



// function updateRaycasting() {

//     controllers.forEach((controller) => {
//         // Use the simple ray attached to the controller for raycasting
//         const simpleRay = controller.simpleRay;

//         // Update raycaster using simpleRay's world position and direction
//         raycaster.ray.origin.setFromMatrixPosition(simpleRay.matrixWorld);
//         const rayDirection = new THREE.Vector3(0, 0, -1).applyMatrix4(
//             simpleRay.matrixWorld,
//         );
//         rayDirection.sub(raycaster.ray.origin).normalize();
//         raycaster.ray.direction.copy(rayDirection);

//         // Perform raycasting and find the closest intersection
//         const intersects = raycaster.intersectObjects(objsToTest, false);
//         if (intersects.length > 0) {
//             const closestIntersection = intersects.reduce(
//                 (closest, intersect) => {
//                     return !closest || intersect.distance < closest.distance
//                         ? intersect
//                         : closest;
//                 },
//                 null,
//             );

//             if (closestIntersection) {
//                 const intersectPoint = closestIntersection.point;
//                 const intersectNormal = closestIntersection.face.normal;

//                 const disc = controller.disc;

//                 // Offset the disc position slightly above the intersection point
//                 const offsetDistance = 0.01; // Small offset to prevent z-fighting
//                 const offsetPoint = intersectPoint
//                     .clone()
//                     .add(intersectNormal.multiplyScalar(offsetDistance));
//                 disc.position.copy(offsetPoint);

//                 disc.lookAt(
//                     offsetPoint.x + intersectNormal.x,
//                     offsetPoint.y + intersectNormal.y,
//                     offsetPoint.z + intersectNormal.z,
//                 );

//                 disc.visible = true;

//                 controller.worldToLocal(intersectPoint);
//                 controller.point.position.copy(intersectPoint);
//                 controller.point.visible = true;
//             }
//         } else {
//             if (controller.disc) {
//                 controller.disc.visible = false;
//             }
//             controller.point.visible = false;
//         }
//     });

// }

function render() {
    updateRaycasting();

    renderer.render(scene, camera);
}





/* WebRTC */

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
    const geometry = new THREE.BoxGeometry(40, 0.1, 40); // Thin, flat box
    const material = new THREE.MeshBasicMaterial({
        color: tronLegacyColors.deepBlack,
        side: THREE.DoubleSide,
        visible: true,
    });
    const floor = new THREE.Mesh(geometry, material);
    floor.position.y = -0.06; // Adjust to align the top surface with y = 0
    floor.name = "Floor";
    scene.add(floor);
    objsToTest.push(floor);
}





/* Scene */


function initWebRTC() {

    // Usage

    const webrtcCapabilities = checkWebRTCCapabilities();

    console.log("webrtcCapabilities", webrtcCapabilities);


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