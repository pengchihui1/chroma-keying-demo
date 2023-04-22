async function main() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
            "Browser API navigator.mediaDevices.getUserMedia not available"
        );
    }

    const videoConfig = {
        audio: true,
        video: {
            facingMode: "user",
            width: 592,
            height: 720,
            frameRate: {
                ideal: 30,
            },
        },
    };

    const video = document.querySelector('video');
    const canvas = document.querySelector('canvas');

    const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
    video.srcObject = stream

    video.width = 640;
    video.height = 480;

    const webcam = await tf.data.webcam(video);
    const model = await tf.loadGraphModel('./model/model.json');

    // Set initial recurrent state
    let [r1i, r2i, r3i, r4i] = [tf.tensor(0.), tf.tensor(0.), tf.tensor(0.), tf.tensor(0.)];

    // Set downsample ratio
    const downsample_ratio = tf.tensor(0.5);

    // Inference loop
    while (true) {
        await tf.nextFrame();
        const img = await webcam.capture();
        const src = tf.tidy(() => img.expandDims(0).div(255)); // normalize input
        const [fgr, pha, r1o, r2o, r3o, r4o] = await model.executeAsync(
            { src, r1i, r2i, r3i, r4i, downsample_ratio }, // provide inputs
            ['fgr', 'pha', 'r1o', 'r2o', 'r3o', 'r4o']   // select outputs
        );

        drawMatte(fgr.clone(), pha.clone(), canvas);

        canvas.style.backgroundImage = "url(/media/Earth.png)"
        canvas.style.backgroundRepeat = "no-repeat"
        canvas.style.backgroundPosition = "-49px -64px"

        // Dispose old tensors.
        tf.dispose([img, src, fgr, pha, r1i, r2i, r3i, r4i]);

        // Update recurrent states.
        [r1i, r2i, r3i, r4i] = [r1o, r2o, r3o, r4o];
    }
}

async function drawMatte(fgr, pha, canvas) {
    const rgba = tf.tidy(() => {
        const rgb = (fgr !== null) ?
            fgr.squeeze(0).mul(255).cast('int32') :
            tf.fill([pha.shape[1], pha.shape[2], 3], 255, 'int32');
        const a = (pha !== null) ?
            pha.squeeze(0).mul(255).cast('int32') :
            tf.fill([fgr.shape[1], fgr.shape[2], 1], 255, 'int32');
        return tf.concat([rgb, a], -1);
    });
    fgr && fgr.dispose();
    pha && pha.dispose();
    const [height, width] = rgba.shape.slice(0, 2);
    const pixelData = new Uint8ClampedArray(await rgba.data());
    const imageData = new ImageData(pixelData, width, height);
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    rgba.dispose();
}

window.addEventListener('load', main);