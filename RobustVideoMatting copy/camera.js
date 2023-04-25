class Camera {
  constructor() {
    // 游玩頁面攝像頭video
    this.video = document.getElementById("video");
    this.outputCanvas = document.querySelector('canvas');
  }

  // Set initial recurrent state
  r1i = tf.tensor(0.)
  r2i = tf.tensor(0.);
  r3i = tf.tensor(0.);
  r4i = tf.tensor(0.); 

  // Set downsample ratio
  downsample_ratio = tf.tensor(0.3);

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
  async renderVideoCanvasResult(webcam, model) {
    this.videoCanvas.style.backgroundImage = "url(/media/Earth.png)"
    this.videoCanvas.style.backgroundRepeat = "no-repeat"
    this.videoCanvas.style.backgroundPosition = "-49px -64px"
    this.videoCanvas.style.transform = "rotateY(180deg)";
    // Set initial recurrent state
    let [r1i, r2i, r3i, r4i] = [tf.tensor(0.), tf.tensor(0.), tf.tensor(0.), tf.tensor(0.)];

    // Set downsample ratio
    const downsample_ratio = tf.tensor(0.5);

    // while (true) {
      await tf.nextFrame();
      const img = await tf.browser.fromPixelsAsync(this.video);
      const src = tf.tidy(() => img.expandDims(0).div(255)); // normalize input
      const [fgr, pha, r1o, r2o, r3o, r4o] = await window.model.executeAsync(
        { src, r1i: this.r1i, r2i: this.r2i, r3i: this.r3i, r4i: this.r4i, downsample_ratio: this.downsample_ratio }, // provide inputs
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
      this.outputCanvas.width = width;
      this.outputCanvas.height = height;
      // console.log(this.videoCanvas)
      this.outputCanvas.getContext('2d').putImageData(imageData,  0,0);
      rgba.dispose();

      // Dispose old tensors.
      tf.dispose([img, src, fgr, pha, this.r1i, this.r2i, this.r3i, this.r4i]);

      // Update recurrent states.
      this.r1i = r1o;
      this.r2i = r2o;
      this.r3i = r3o;
      this.r4i = r4o;
    // }

  }

  //  循環調用
  async renderOutputResult(webcam, model) {
    await this.renderVideoCanvasResult(webcam, model);
  }


  loop(webcam, model) {
    const renderPrediction = async (webcam, model) => {
      if (window.CAMERA) {
        await this.renderOutputResult(webcam, model);
      }
      window.requestAnimationFrame(() => {
        renderPrediction(webcam, model)
      });
    };
    renderPrediction(webcam, model);
  }
}


Camera.setupCamera()
  .then(async (res) => {
    // 创建全局对象
    window.CAMERA = res;

    const webcam = await tf.data.webcam(this.video);
    const model = await tf.loadGraphModel('./model/model.json');

    // const webcam = await tf.data.webcam(this.video);
    // const model = await tf.loadGraphModel('/disc/disc_17_camWithHandPose/model/model.json');

    // console.log("加载内容", webcam, model)
    //   console.log(webcam,model)
    // 不断更新摄像头
    window.CAMERA.loop(webcam, model);
  })
  .catch((err) => {
    alert(err)
  });
