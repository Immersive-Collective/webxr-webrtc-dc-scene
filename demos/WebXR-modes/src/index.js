import * as THREE from "three";
import ThreeMeshUI from "three-mesh-ui";

import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

let RAPIER
let world
let groundHeight = 0;
let gravity = { x: 0.0, y: -1.2, z: 0.0 };
let eventQueue

window.myRapierWorld
window.rigidBodies = window.rigidBodies || [];
window.threeCubes = window.threeCubes || [];

import * as shot from './libs/shotlines';
import * as tp from './libs/teleport';

console.log("shot", shot)



import('@dimforge/rapier3d').then(rapierModule => {

    //console.log("init rapierModule")

    init();

    RAPIER = rapierModule;

    world = new RAPIER.World(gravity);
    eventQueue = new RAPIER.EventQueue(true);

    addRapierGround();

    animate();

});



function addRapierGround() {

    console.log("addRapierGround");

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('draco_decoder/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load('assets/models/ground.glb', gltf => {
        let mesh = gltf.scene
        mesh.name = "PAD"
        scene.add(mesh);

        mesh.rotation.y = 0

        // if (gltf.animations && gltf.animations.length > 0) {
        //     console.log("gltf.animations",gltf.animations)
        //     mixer = new THREE.AnimationMixer(mesh);
            
        //     // Playing all animations
        //     for (let i = 0; i < gltf.animations.length; i++) {
        //         mixer.clipAction(gltf.animations[i]).play();
        //     }
        // }          

        
        gltf.scene.traverse(item => {


            // /* add lamps for animation */
            // if (/^Lamp\d+$/.test(String(item.name))) {
            //   console.log("+ Lamp added:", item.name)
            //   lamps.push(item);
            // }
          
          // if ((/^Lamp(\d*)$/).test(item.name) && item.isGroup && item.children[1] && item.children[1].material) {
          //     item.children[0].material.transparent = true;
          //     item.children[0].material.opacity = 0;
          //     lamps.push({
          //         mesh: item.children[0],
          //         isIncreasing: true  // initially set to increasing for all lamps
          //     });
          //     console.log("+ Lamp added:", item.name)
          // }

            if (item.isMesh) {

                console.log("isMesh:", item.name)

                const geometry = item.geometry;

                item.castShadow = true;     // allows the node to cast shadows
                item.receiveShadow = true;                 
              
                // you can swap material for refractions
                // item.material = new THREE.MeshPhongMaterial({ 
                //     transparent: true,  opacity: 0.1, 
                //     color: 0xFFFFFF
                //     //color: 0xFFFFFF, envMap: envMap1, refractionRatio: 0.98, reflectivity: 0.98
                // });
              
                //console.log(geometry)
                const vertices = geometry.attributes.position.array;
                const indices = geometry.index.array;
                const trimesh = new RAPIER.TriMesh(vertices, indices);
                // console.log('TriMesh created successfully', trimesh);
                // console.log('Vertices length:', vertices.length);
                // console.log('Indices length:', indices.length);
                let groundColliderDesc = RAPIER.ColliderDesc.trimesh(trimesh)
                    .setDensity(100)
                    .setTranslation(0, groundHeight, 0)
                    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
                // this part is a kind of hack...
                groundColliderDesc.shape.indices = indices;
                groundColliderDesc.shape.vertices = vertices;
                let groundCollider = world.createCollider(groundColliderDesc);

                window.groundColliderHandle = groundCollider.handle;
                window.myRapierWorld = world;
                window.eventQueue = eventQueue;


                item.material.wireframe = false;

            }



        })

    })


}




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


function addCube(size = {x:1,y:1,z:1}, position, rotation, wallColor, edgeColor, cast = false) {

    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z, 2, 2, 2);
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
        
        //console.log(pos)

        const [x, y, z] = pos;

        let sizeY = Math.ceil(Math.random()*2)

        let size = {x:1,y:sizeY,z:1}


        addCube(
            size, // Cube size
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


function getCameraPosition() {
  const cameraPosition = new THREE.Vector3();
  renderer.xr.getCamera(camera).getWorldPosition(cameraPosition);
  return cameraPosition;
}



function addBallTrajectory() {
  // Remove existing line if any

  if (window.ballTrajectory) {
    scene.remove(window.ballTrajectory);
  }

  let cameraPosition = getCameraPosition();
  let leftHand = renderer.xr.getController(0); // 0 is usually the left hand
  let leftHandPosition = new THREE.Vector3();
  leftHand.getWorldPosition(leftHandPosition);

  // Create the line to visualize this vector
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([leftHandPosition, cameraPosition]);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const line = new THREE.Line(lineGeometry, lineMaterial);

  window.ballTrajectory = line;

  // Add line to the scene
  scene.add(window.ballTrajectory);

}


function initControllers() {


    addBallTrajectory()
    shot.initShotLines(scene);

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

    /* rings */

    // Define the geometry and material for the wearable torus
    const torusGeometry = new THREE.TorusGeometry(0.06, 0.005, 16, 100); // Adjust the size as needed
    const torusMaterial = new THREE.MeshBasicMaterial({ color: tronLegacyColors.brightBlue }); // Green color for visibility

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

        // Create and add the ring
        const ring = new THREE.Mesh(torusGeometry, torusMaterial);
        controller.ring = ring;
        ring.position.set(0, 0, 0.15); // Adjust position relative to the controller
        ring.rotation.set(0, 0, 0); // Adjust rotation if needed
        controller.add(ring); // Attach the ring directly to the controller

    });

    dummyMatrix = new THREE.Matrix4();
    raycaster = new THREE.Raycaster();

    // const geometry = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength);
    const teleportRingGeometry = new THREE.RingGeometry(0.23, 0.25, 64);
    const teleportRingMaterial = new THREE.MeshBasicMaterial({ color: tronLegacyColors.brightBlue, side: THREE.DoubleSide });
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
        if (currentMode === 'teleportation') {
            teleportMode = true;
            activeController = controller1;
            teleportRing.visible = true;
            controller1.disc.visible = false;
        } else if (currentMode === 'weapon') {
            shootBallFromController(controller1)

        }
    });

    controller1.addEventListener('selectend', function () {
        if (currentMode === 'teleportation' && teleportMode) {
            performTeleportation();
        }
    });

    controller2.addEventListener('selectstart', function () {
        if (currentMode === 'teleportation') {
            teleportMode = true;
            activeController = controller2;
            teleportRing.visible = true;
            controller1.disc.visible = false;
        } else if (currentMode === 'weapon') {
            shootBallFromController(controller2)
        }
    });

    controller2.addEventListener('selectend', function () {
        if (currentMode === 'teleportation' && teleportMode) {
            performTeleportation();
        }
    });

    function performTeleportation() {
        if (currentMode === 'teleportation' && teleportMode && teleportRing.visible) {
            const teleportDestination = new THREE.Vector3();
            teleportRing.getWorldPosition(teleportDestination);
            cameraContainer.position.copy(teleportDestination);

            teleportMode = false;
            teleportRing.visible = false; // Hide the ring
            activeController = null;
        }
    }

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
                    //teleportRing.position.copy(intersect.point).add(new THREE.Vector3(0, offsetHeight, 0));
                    teleportRing.position.y += 0.03

                    controller.worldToLocal(intersectPoint);
                    controller.point.position.copy(intersectPoint);
                    controller.point.visible = true;

                    // Calculate distance from the controller to the intersection point
                    const distance = raycaster.ray.origin.distanceTo(intersectPoint);
                    const maxScale = 0.05; // Maximum scale
                    let scale = maxScale/distance
                    controller.point.scale.set(scale, scale, 1);
                
                }

            } else {
                if (controller.disc) {
                    controller.disc.visible = false;
                }
                controller.point.visible = false;
            }
        
    });
}


/* Teleportation / Weapon */

let currentMode = 'teleportation'; // Initial mode
const collisionThreshold = 0.12; // Threshold for ring collision, adjust as needed

let isColliding = false;
let collisionCooldown = false;
const cooldownTime = 100; // Cooldown time in milliseconds (1 second)


function startCooldown() {
    collisionCooldown = true;
    setTimeout(() => {
        collisionCooldown = false;
    }, cooldownTime);
}

function updateRingColors() {
    const newColor = (currentMode === 'teleportation') ? tronLegacyColors.brightBlue : tronLegacyColors.brightOrange; 
    controller1.ring.material.color.set(new THREE.Color(newColor));
    controller2.ring.material.color.set(new THREE.Color(newColor));

    // Toggle visibility of helper lines and points based on the current mode
    const helpersVisible = currentMode === 'weapon';
    controllers.forEach(controller => {
        controller.ray.visible = helpersVisible;
        controller.point.visible = helpersVisible;
    });
}

function getLastCharAsDigit(str) {
    if (str.length === 0) {
        return null; // or an appropriate default value
    }

    const lastChar = str.charAt(str.length - 1);
    const digit = parseInt(lastChar, 10);

    if (isNaN(digit)) {
        return null; // or handle non-digit characters as needed
    }

    return digit;
}



function switchMode() {
    currentMode = (currentMode === 'teleportation') ? 'weapon' : 'teleportation';
    updateRingColors();
    console.log("Switched to mode:", currentMode);
}

function update() {
    updateRaycasting();    // Existing raycasting updates
    checkRingCollision();  // New function for checking ring collisions
}

function checkRingCollision() {
    // Create vectors to store world positions
    const ring1WorldPosition = new THREE.Vector3();
    const ring2WorldPosition = new THREE.Vector3();

    // Get world positions of the rings
    controller1.ring.getWorldPosition(ring1WorldPosition);
    controller2.ring.getWorldPosition(ring2WorldPosition);

    // Check for ring collision using world positions
    const distance = ring1WorldPosition.distanceTo(ring2WorldPosition);
    //console.log("Rings distance:", distance);

    if (distance < collisionThreshold && !isColliding && !collisionCooldown) {
        isColliding = true;
        switchMode();
        startCooldown(); // Start the cooldown period
    } else if (distance >= collisionThreshold && isColliding) {
        isColliding = false; // Rings are no longer colliding
    }
}


/* Shooting balls */

function shootBallFromController(controller) {
    console.log("shootBallFromController:", controller);

    // The size, density, and speed factor for the ball
    let ballSize = 0.15 + Math.random() * 0.01;
    let density = 10;
    let speedFactor = 12;

    // Get the world position of the controller
    const controllerWorldPosition = new THREE.Vector3();
    controller.getWorldPosition(controllerWorldPosition);

    // Get the world position of the point sprite
    const pointSpriteWorldPosition = new THREE.Vector3();
    controller.point.getWorldPosition(pointSpriteWorldPosition);

    // Create and shoot the ball towards the point sprite
    createAndShootBall(controllerWorldPosition, pointSpriteWorldPosition, ballSize, tronLegacyColors.brightOrange, density, speedFactor);
}

function createAndShootBall(startPosition, targetPosition, radius, color, density, speedFactor) {
    // Calculate direction from start to target position
    let direction = new THREE.Vector3().subVectors(targetPosition, startPosition).normalize();

    // Create the rigid body description and set its properties
    let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(startPosition.x, startPosition.y, startPosition.z)
        .setLinvel(direction.x * speedFactor, direction.y * speedFactor, direction.z * speedFactor);
    let rigidBody = myRapierWorld.createRigidBody(rigidBodyDesc);

    // Create the sphere geometry and material
    const sphereGeometry = new THREE.SphereGeometry(radius);
    const sphereMaterial = new THREE.MeshStandardMaterial({ color: color });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereMesh.position.copy(startPosition);
    scene.add(sphereMesh);

    // Create the collider
    let colliderDesc = RAPIER.ColliderDesc.ball(radius).setDensity(density);
    myRapierWorld.createCollider(colliderDesc, rigidBody);

    // Store the rigid body and mesh for future reference
    window.rigidBodies.push(rigidBody);
    window.threeCubes.push(sphereMesh);
}


function logRapierEvents() {
    window.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
        //console.log("Inside drainCollisionEvents. Handle1:", handle1, "Handle2:", handle2, "Started:", started);
        
        if (handle1 === window.liftColliderHandle || handle2 === window.liftColliderHandle) {
            let ballHandle = handle1 === window.liftColliderHandle ? handle2 : handle1;
            console.log(`Monkey is involved in a collision event with ball: ${ballHandle}`);
            
            // If the collision has stopped and this ball handle hasn't been handled already
            if (!started && !window.handledBalls.includes(ballHandle)) {
                incrementPoints(ballHandle);  // Pass the ball handle to the incrementPoints function
            }
        }
    });
}



function updateRapier() {


    if (window.myRapierWorld && window.rigidBodies) {

        //window.myRapierWorld.step();
        window.myRapierWorld.step(window.eventQueue);

        //console.log(window.rigidBodies)

        for(let i = 0; i < window.rigidBodies.length; i++) {

            if(window.rigidBodies[i].bodyType() == 0) {

                let position = window.rigidBodies[i].translation();
                window.threeCubes[i].position.set(position.x, position.y, position.z);

                // Add this part to update the rotation
                let rotation = window.rigidBodies[i].rotation(); // Assuming the rotation method returns a quaternion
                window.threeCubes[i].quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
            }
        }

        // - TO DO
        logRapierEvents()


    }
}






function render() {

    updateRapier();

    updateRaycasting();
    
    checkRingCollision();

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


}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

