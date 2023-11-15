# DEMOS


## LIVE
https://metaboy.tech/demos/wbrtc/2/

## VIDEO SCREEN RECORDINGS - MOBILE
https://github.com/Immersive-Collective/webxr-webrtc-dc-scene/assets/27820237/0c9ffc26-82cd-4f0a-a698-ea5c9d641755

Starting Media

```
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
```
