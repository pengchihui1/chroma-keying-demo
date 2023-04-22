class Camera{
    constructor() {
        // 游玩頁面攝像頭video
        this.video = document.getElementById("video");
        this.videoCanvas= document.querySelector('canvas');
    }

    static async setupCamera(cameraParam) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            "Browser API navigator.mediaDevices.getUserMedia not available"
          );
        }
    
        const videoConfig = {
          audio: true,
          video: {
            facingMode: "user",
            width: 540,
            height: 720,
            frameRate: {
              ideal: 30,
            },
          },
        };
    
        const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
    
        const camera = new Camera();

        camera.video.srcObject = stream;
    
        await new Promise((resolve) => {
          camera.video.onloadedmetadata = () => {
            resolve(video);
          };
        });
    
        camera.video.play();
    
        const videoWidth = camera.video.videoWidth;
        const videoHeight = camera.video.videoHeight;
        // Must set below two lines, otherwise video element doesn't show.
        camera.video.width = videoWidth;
        camera.video.height = videoHeight;
    
        return camera;
      }

  // 不斷出發的攝像頭檢測
  async renderVideoCanvasResult(webcam,model,r1i, r2i, r3i, r4i,downsample_ratio) {
    await tf.nextFrame();
    const img = await webcam.capture();
    const src = tf.tidy(() => img.expandDims(0).div(255)); // normalize input
    const [fgr, pha, r1o, r2o, r3o, r4o] = await model.executeAsync(
        {src, r1i, r2i, r3i, r4i, downsample_ratio}, // provide inputs
        ['fgr', 'pha', 'r1o', 'r2o', 'r3o', 'r4o']   // select outputs
    );

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
    this.videoCanvas.width = width;
    this.videoCanvas.height = height;
    this.videoCanvas.getContext('2d').putImageData(imageData, 0, 0);
    rgba.dispose();
    
    this.videoCanvas.style.backgroundImage="url(/media/Earth.png)"
    this.videoCanvas.style.backgroundRepeat="no-repeat"
    this.videoCanvas.style.backgroundPosition="-49px -64px"
    
    // Dispose old tensors.
    tf.dispose([img, src, fgr, pha, r1i, r2i, r3i, r4i]);

    // Update recurrent states.
    [r1i, r2i, r3i, r4i] = [r1o, r2o, r3o, r4o];
  }

    //  循環調用
    async renderOutputResult(webcam,model,r1i, r2i, r3i, r4i,downsample_ratio) {
        await this.renderVideoCanvasResult(webcam,model,r1i, r2i, r3i, r4i,downsample_ratio);
    }


    loop(webcam,model,r1i, r2i, r3i, r4i,downsample_ratio) {
        const renderPrediction = async (webcam,model,r1i, r2i, r3i, r4i,downsample_ratio) => {
            if (window.CAMERA) {
              await this.renderOutputResult(webcam,model,r1i, r2i, r3i, r4i,downsample_ratio);
            }
            console.log(webcam,model,r1i, r2i, r3i, r4i,downsample_ratio)
            requestAnimationFrame();
        };
        renderPrediction(webcam,model,r1i, r2i, r3i, r4i,downsample_ratio);
    }
}


Camera.setupCamera()
    .then(async(res) => {
      // 创建全局对象
      window.CAMERA = res;

      const webcam = await tf.data.webcam(this.video);
      const model = await tf.loadGraphModel('./model/model.json');
  
      // Set initial recurrent state
      let [r1i, r2i, r3i, r4i] = [tf.tensor(0.), tf.tensor(0.), tf.tensor(0.), tf.tensor(0.)];
  
      // Set downsample ratio
      const downsample_ratio = tf.tensor(0.5);
    //   console.log(webcam,model)

      // 不断更新摄像头
      window.CAMERA.loop(webcam,model,r1i, r2i, r3i, r4i,downsample_ratio);
    })
    .catch((err) => {
      alert(err)
    });
  