    const rayTexture = new THREE.CanvasTexture(generateRayTexture());
    rayTexture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
        map: rayTexture,
        transparent: true,
        side: THREE.DoubleSide,
        alphaTest: 0.05
    });

    const geometry = new THREE.BoxGeometry(0.005, 0.005, 20);
    geometry.translate(0, 0, -10.01);

    const uvAttribute = geometry.getAttribute('uv');

    // Update UVs for the box. This assumes that the box sides are laid out in the following order:
    // - index 0-3: right face
    // - index 4-7: left face
    // - index 8-11: top face
    // - index 12-15: bottom face
    // - index 16-19: front face
    // - index 20-23: back face
    // The UVs for the left and right faces should stretch across the 0.01 width of the box,
    // so the U coordinates should be either 0 or 1, and the V coordinates should go from 0 to 1 over the 10 length of the box.
    // The UVs for the top and bottom faces should stretch over the 10 length and 0.01 width,
    // so both U and V coordinates should go from 0 to 1.

    // Adjust UVs for all sides of the box
    for (let i = 0; i < 4; i++) {
      // set UVs for the right face
      uvAttribute.setXY(i, i < 2 ? 0 : 1, i % 2);
    }

    for (let i = 4; i < 8; i++) {
      // set UVs for the left face
      uvAttribute.setXY(i, i < 6 ? 0 : 1, i % 2);
    }

    for (let i = 8; i < 12; i++) {
      // set UVs for the top face
      uvAttribute.setXY(i, (i - 8) % 2, (i - 8) < 2 ? 0 : 1);
    }

    for (let i = 12; i < 16; i++) {
      // set UVs for the bottom face
      uvAttribute.setXY(i, (i - 12) % 2, (i - 12) < 2 ? 0 : 1);
    }

    for (let i = 16; i < 20; i++) {
      // set UVs for the front face
      uvAttribute.setXY(i, i % 2, i < 18 ? 0 : 1);
    }

    for (let i = 20; i < 24; i++) {
      // set UVs for the back face
      uvAttribute.setXY(i, i % 2, i < 22 ? 0 : 1);
    }

    const linesHelper = new THREE.Mesh(geometry, material);
    linesHelper.rotation.z = -Math.PI / 4;




// const rayTexture = new THREE.CanvasTexture(generateRayTexture());
// rayTexture.needsUpdate = true;

// const material = new THREE.MeshBasicMaterial({
//     map: rayTexture,
//     transparent: true,
//     side: THREE.DoubleSide,
//     alphaTest: 0.05
// });

// const geometry = new THREE.BoxGeometry(0.01, 0.01, 10);
// geometry.translate(0, 0, -5);

// const uvAttribute = geometry.getAttribute('uv');
// for (let i = 0; i < uvAttribute.count; i += 2) {
//     let u = uvAttribute.getX(i);
//     let v = uvAttribute.getY(i);
//     // Adjust the UVs for the side faces
//     if ([8, 9, 10, 11].includes(i)) {
//         // Top face
//         uvAttribute.setXY(i, u, 0);
//         uvAttribute.setXY(i + 1, u, 1);
//     } else if ([12, 13, 14, 15].includes(i)) {
//         // Bottom face
//         uvAttribute.setXY(i, u, 1);
//         uvAttribute.setXY(i + 1, u, 0);
//     } else {
//         // Front, back, and side faces
//         uvAttribute.setXY(i, 0, v);
//         uvAttribute.setXY(i + 1, 1, v);
//     }
// }

// const linesHelper = new THREE.Mesh(geometry, material);



        // const rayTexture = new THREE.CanvasTexture(generateRayTexture());
        // rayTexture.needsUpdate = true;

        // const material = new THREE.MeshBasicMaterial({
        //     map: rayTexture,
        //     transparent: true,
        //     side: THREE.DoubleSide,
        //     alphaTest: 0.05
        // });

        // const geometry = new THREE.BoxGeometry(0.0025, 0.0025, 10);
        // geometry.translate(0, 0, -5);

        // const uvAttribute = geometry.getAttribute('uv');
        // for (let i = 0; i < uvAttribute.count; i++) {
        //     let u = uvAttribute.getX(i);
        //     let v = uvAttribute.getY(i);
        //     if (i % 8 < 4) {
        //         // Front and back faces
        //         uvAttribute.setXY(i, u, v);
        //     } else {
        //         // Sides, top and bottom faces
        //         uvAttribute.setXY(i, 0, u);
        //     }
        // }

        // const linesHelper = new THREE.Mesh(geometry, material);


    // const rayTexture = new THREE.CanvasTexture(generateRayTexture());
    // rayTexture.needsUpdate = true;

    // const material = new THREE.MeshBasicMaterial({
    //     color: 0xff0000, // Red color for the ray
    //     map: rayTexture, // Use the texture as a map which includes alpha
    //     transparent: true,
    //     side: THREE.DoubleSide,
    //     alphaTest: 0.05 // Adjust this value as needed
    // });

    // const geometry = new THREE.PlaneGeometry(0.01, 10); // Width and length of the ray
    // geometry.translate(0, 5, 0); // Shifting the geometry so it starts at the controller

    // // Flip UVs to invert the gradient texture
    // const uvAttribute = geometry.getAttribute('uv');
    // for (let i = 0; i < uvAttribute.count; i++) {
    //     let u = uvAttribute.getX(i);
    //     let v = 1 - uvAttribute.getY(i); // Inverting V coordinate
    //     uvAttribute.setXY(i, u, v);
    // }

    // const linesHelper = new THREE.Mesh(geometry, material);
    // linesHelper.rotation.x = -Math.PI / 2; // Rotate to align with controller direction
    