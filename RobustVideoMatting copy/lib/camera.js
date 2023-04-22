const VIDEO_SIZE = {
  "640 X 480": { width: 640, height: 480 },
  "640 X 360": { width: 640, height: 360 },
  "360 X 270": { width: 360, height: 270 },
  "270 X 360": { width: 270, height: 360 },
  "540 X 720": { width: 540, height: 720 },
  "690 X 920": { width: 690, height: 920 },
};
function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isMobile() {
  return isAndroid() || isiOS();
}
async function wait(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

// 攝像頭對象
class Camera {

  // 是否打開fps檢測
  #isFPS = false;

  #startInferenceTime;
  #numInferences = 0;
  #inferenceTimeSum = 0;
  #lastPanelUpdate = 0;
  #ML_drawResults = {
    example: () => { },
  };

  // 預處理圖片的函數變量（可選，默認為null）
  #preImage;

  constructor() {
    // 游玩頁面攝像頭video
    this.video = document.getElementById("video");

    // canvas相關
    this.outputCanvas;
    this.canvasImageWidth;
    this.canvasImageHeight;
    this.canvasImageOffsetX = 0;
    this.canvasImageOffsetY = 0;

    this.outputCtx;

    this.bgUrl;

    // canvas相關，從DISC 15之後，上面的canvas為輸出canvas（稱作「output canvas」），
    // 下面的canvas分別對應output canvas的三個圖層，默認不會輸出，但是可以將這三個圖層按順序合起來輸出到output canvas
    // 透明無用
    this.frontCanvas;
    //  姿勢識別、手勢追蹤、去背景後的video合成影片
    this.videoCanvas;
    // 星球背景
    this.backCanvas;

    this.frontImage;
    this.frontOtherImage;
    this.backImage;

    // fps相關
    this.stats;
  }

  /**
   * Initiate a Camera instance and wait for the camera stream to be ready.
   * @param cameraParam From app `STATE.camera`.
   * 啓動攝像頭
   */
  static async setupCamera(cameraParam) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        "Browser API navigator.mediaDevices.getUserMedia not available"
      );
    }

    const { targetFPS, sizeOption } = cameraParam;
    const $size = VIDEO_SIZE[sizeOption];
    const videoConfig = {
      audio: true,
      video: {
        facingMode: "user",
        // Only setting the video to a specified size for large screen, on
        // mobile devices accept the default size.
        // width: isMobile() ? VIDEO_SIZE["690 X 920"].width : $size.width,
        // height: isMobile() ? VIDEO_SIZE["690 X 920"].height : $size.height,
        width: 592,
        height: 792,
        frameRate: {
          ideal: targetFPS,
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

    // 實時動態的畫面
    camera.initCanvasByID("output");

    return camera;
  }

  // 自定義有id的canvas，顯示影像裡的內容
  initCanvasByID(id_name) {
    // const dom = document.getElementById(id_name);
    if (typeof id_name !== "string") {
      alert("獲取的id_name類型不正確！");
      return;
    }

    let dom;
    if (id_name === "output") {
      const itemDom = document.getElementById("output");
      if (itemDom) {
        dom = itemDom;
      } else {
        dom = document.createElement("canvas");
        dom.setAttribute("id", "output");
        const containerDom = document.getElementById("container");
        containerDom.append(dom);
      }
    } else {
      const itemDom = document.getElementById("output");
      if (itemDom) {
        document.removeChild(itemDom);
      }
      dom = document.createElement("canvas");
      dom.setAttribute("id", id_name);
      const containerDom = document.getElementById("container");
      containerDom.append(dom);
    }

    // 從meta元素獲取canvasWidth & canvasHeight，沒有就預設是fullscreen
    let canvasWidth = document.getElementsByName("canvasWidth").length
      ? Number(document.getElementsByName("canvasWidth")[0].content)
      : window.innerWidth;
    let canvasHeight = document.getElementsByName("canvasHeight").length
      ? Number(document.getElementsByName("canvasHeight")[0].content)
      : window.innerHeight;

    const item = this.getObjectFitSize(
      true,
      canvasWidth,
      canvasHeight,
      this.video.videoWidth,
      this.video.videoHeight
    );
    dom.width = item.width;
    dom.height = item.height;

    const ctx = dom.getContext("2d");

    this.outputCanvas = dom;
    this.canvasImageWidth = item.width;
    this.canvasImageHeight = item.height;
    this.canvasImageOffsetX = item.x;
    this.canvasImageOffsetY = item.y;
    this.outputCtx = ctx;

    this.frontCanvas = document.createElement("canvas");
    this.videoCanvas = document.createElement("canvas");
    this.backCanvas = document.createElement("canvas");

    // 需要對videoCanvas進行鏡像處理，因為傳進去的video是鏡像的
    // this.videoCanvas.getContext("2d").save();
    // this.videoCanvas.getContext("2d").translate(item.width, 0);
    // this.videoCanvas.getContext("2d").scale(-1, 1);
  }

  getCanvasSize() {
    return {
      width: this.canvasImageWidth,
      height: this.canvasImageHeight,
      offsetX: this.canvasImageOffsetX,
      offsetY: this.canvasImageOffsetY,
    };
  }

  setCanvasSize(widthSize = 0, heightSize = 0) {
    if (typeof widthSize !== "number" && typeof heightSize !== "number") {
      alert("請輸入數字！");
      return;
    }
    const item = this.getObjectFitSize(
      true,
      widthSize ? widthSize : this.canvasImageWidth,
      heightSize ? heightSize : this.canvasImageHeight,
      this.video.width,
      this.video.height
    );
    if (this.outputCanvas) {
      this.outputCanvas.width = item.width;
      this.outputCanvas.height = item.height;
      this.canvasImageWidth = item.width;
      this.canvasImageHeight = item.height;
      this.canvasImageOffsetX = item.x;
      this.canvasImageOffsetY = item.y;

      const ctx = this.outputCanvas.getContext("2d");
      ctx.restore();
      ctx.translate(item.width, 0);
      ctx.scale(-1, 1);
    }
  }

  getCanvasVideoRatio() {
    return {
      x: this.canvasImageWidth / this.video.width,
      y: this.canvasImageHeight / this.video.height,
    };
  }

  // 計算 object fit
  // https://stackoverflow.com/questions/37256745/object-fit-get-resulting-dimensions
  getObjectFitSize(
    contains /* true = contain, false = cover */,
    containerWidth,
    containerHeight,
    width,
    height
  ) {
    var doRatio = width / height;
    var cRatio = containerWidth / containerHeight;

    var targetWidth = 0;
    var targetHeight = 0;
    var test = contains ? doRatio > cRatio : doRatio < cRatio;

    var w = 0;
    var h = 0;
    var x = 0;
    var y = 0;

    if (test) {
      targetWidth = containerWidth;
      targetHeight = targetWidth / doRatio;
      w = width;
      h = w / cRatio;
      x = 0;
      y = (height - h) / 2;
    } else {
      targetHeight = containerHeight;
      targetWidth = targetHeight * doRatio;
      h = height;
      w = h * cRatio;
      x = (width - w) / 2;
      y = 0;
    }

    return {
      width: targetWidth,
      height: targetHeight,
      x,
      y,
      w,
      h,
    };
  }

  getVideoSize() {
    return this.video
      ? {
        width: this.video.width,
        height: this.video.height,
      }
      : null;
  }

  changeFPSStatus() {
    this.#isFPS = !this.#isFPS;
  }


  addML(ML_name, drawResultsFunction) {
    this.#ML_drawResults[ML_name] = drawResultsFunction;
  }

  updatePreImage(
    isUpdate = false,
    options = {
      method: "",
      func: () => { },
    }
  ) {
    if (!isUpdate) {
      this.#preImage = null;
      return;
    }
    if (options.method) {
      switch (options.method) {
        case "grayscale":
          this.#preImage = this.grayscale;
          break;

        default:
          break;
      }
      return;
    }
    if (options.func) {
      console.log(1);
      this.#preImage = options.func;
      return;
    }
  }

  drawCtx() {
    if (this.#preImage) {
      this.outputCtx.putImageData(
        this.#preImage(this.video),
        0,
        0,
        0,
        0,
        this.canvasImageWidth,
        this.canvasImageHeight
      );
    } else {
      this.outputCtx.drawImage(
        this.video,
        0,
        0,
        this.canvasImageWidth,
        this.canvasImageHeight
      );
    }
  }

  clearCtx() {
    this.outputCtx.clearRect(
      0,
      0,
      this.canvasImageWidth,
      this.canvasImageHeight
    );
  }

  // fps相關
  setupStats() {
    const stats = new Stats();
    stats.customFpsPanel = stats.addPanel(
      new Stats.Panel("FPS", "#0ff", "#002")
    );
    stats.showPanel(stats.domElement.children.length - 1);

    const parent = document.getElementById("stats");
    parent.appendChild(stats.domElement);

    const statsPanes = parent.querySelectorAll("canvas");

    for (let i = 0; i < statsPanes.length; ++i) {
      statsPanes[i].style.width = "140px";
      statsPanes[i].style.height = "80px";
    }
    this.stats = stats;
  }
  // fps相關
  beginEstimateHandsStats() {
    this.#startInferenceTime = (performance || Date).now();
  }
  // fps相關
  endEstimateHandsStats() {
    const endInferenceTime = (performance || Date).now();
    this.#inferenceTimeSum += endInferenceTime - this.#startInferenceTime;
    ++this.#numInferences;

    const panelUpdateMilliseconds = 1000;
    if (endInferenceTime - this.#lastPanelUpdate >= panelUpdateMilliseconds) {
      const averageInferenceTime = this.#inferenceTimeSum / this.#numInferences;
      this.#inferenceTimeSum = 0;
      this.#numInferences = 0;
      this.stats.customFpsPanel.update(
        1000.0 / averageInferenceTime,
        120 /* maxValue */
      );
      this.#lastPanelUpdate = endInferenceTime;
    }
  }

  setFrontImage(isSet = false, image) {
    if (!isSet) {
      this.frontImage = null;
    } else {
      this.frontImage = image ? image : null;
    }
  }

  setFrontOtherImage(isSet = false, image) {
    if (!isSet) {
      this.frontOtherImage = null;
    } else {
      this.frontOtherImage = image ? image : null;
    }
  }

  setBackImage(isSet = false, image) {
    if (!isSet) {
      this.backImage = null;
    } else {
      this.backImage = image ? image : null;
    }
  }



  // 不斷出發的攝像頭檢測
  async renderVideoCanvasResult(webcam, model) {

    let segmentation = null;//去背景對象
    let points = null;//手的坐標對象

    // 檢測人物，當有人的時候，將結果賦值到這個變量上面
    let poses = null;//檢查有人時

    if (this.#isFPS) {
      this.beginEstimateHandsStats();
    }

    // Set initial recurrent state
    let [r1i, r2i, r3i, r4i] = [tf.tensor(0.), tf.tensor(0.), tf.tensor(0.), tf.tensor(0.)];

    // Set downsample ratio
    const downsample_ratio = tf.tensor(0.5);

    await tf.nextFrame();
    const img = await webcam.capture();
    const src = tf.tidy(() => img.expandDims(0).div(255)); // normalize input
    const [fgr, pha, r1o, r2o, r3o, r4o] = await model.executeAsync(
      { src, r1i, r2i, r3i, r4i, downsample_ratio }, // provide inputs
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

    // Dispose old tensors.
    tf.dispose([img, src, fgr, pha, r1i, r2i, r3i, r4i]);

    // Update recurrent states.
    [r1i, r2i, r3i, r4i] = [r1o, r2o, r3o, r4o];

    // 姿勢識別處理過的canvas
    if (window?.POSE_DETECTOR) {
      try {
        window.POSE.points = poses = await window.POSE.getPoints(
          window.POSE_DETECTOR
        );

        if (window.FRAME) {
          window.FRAME.func("poses", poses);
        }

        if (window.POSE.isDrawLine && poses && poses.length > 0) {
          window.POSE.drawResults(poses);
        }
        if (window?.AR && window.AR.selected) {
          const itemRatio = this.getCanvasVideoRatio();

          const itemImage = window.AR.drawResults(
            this.videoCanvas.width,
            this.videoCanvas.height,
            itemRatio,
            poses
          );
          if (itemImage) {
            this.videoCanvas.getContext("2d").drawImage(itemImage, 0, 0);
          }
        }
      } catch (error) {
        window.POSE_DETECTOR?.dispose();
        window.POSE_DETECTOR = null;
        alert("rendrResult2\n" + error);
      }
    }

    // 手勢追蹤處理過的影響
    if (window?.HAND_DETECTOR) {
      try {
        window.HAND.points = points = await window.HAND.getPoints(
          window.HAND_DETECTOR
        );
        if (window.FRAME) {
          window.FRAME.func("hands", points);
        }
        if (window.HAND.isDrawLine && points && points.length > 0) {
          window.HAND.drawResults(points);
        }
      } catch (error) {
        window.HAND_DETECTOR?.dispose();
        window.HAND_DETECTOR = null;
        alert("renderResult1\n" + error);
      }
    }

    if (window?.threeRenderer) {
      this.videoCanvas
        .getContext("2d")
        .drawImage(window.threeRenderer.domElement, 0, 0);
    }

    if (this.#isFPS) {
      this.endEstimateHandsStats();
    }
  }


  // 自拍頁功能
  async renderOutputResult() {

    const webcam = await tf.data.webcam(this.video);
    const model = await tf.loadGraphModel('/disc/disc_17_camWithHandPose/model/model.json');
    // 渲染圖層在中間的canvas 人物去背景 姿勢檢測 手勢追蹤
    await this.renderVideoCanvasResult(webcam, model);

    this.outputCtx.clearRect(
      0,
      0,
      this.canvasImageWidth,
      this.canvasImageHeight
    );

    // 放大
    // this.outputCtx.drawImage(
    //   this.backCanvas,
    //   90,
    //   (90 / 3) * 4,
    //   this.canvasImageWidth - 180,
    //   this.canvasImageHeight - (180 / 3) * 4,
    //   0,
    //   0,
    //   this.canvasImageWidth,
    //   this.canvasImageHeight
    // );

    this.outputCtx.drawImage(
      this.videoCanvas,
      90,
      (90 / 3) * 4,
      this.canvasImageWidth - 180,
      this.canvasImageHeight - (180 / 3) * 4,
      0,
      0,
      this.canvasImageWidth,
      this.canvasImageHeight
    );

    // this.outputCtx.drawImage(
    //   this.frontCanvas,
    //   90,
    //   (90 / 3) * 4,
    //   this.canvasImageWidth - 180,
    //   this.canvasImageHeight - (180 / 3) * 4,
    //   0,
    //   0,
    //   this.canvasImageWidth,
    //   this.canvasImageHeight
    // );

    // 原始大小
    // this.outputCtx.drawImage(
    //   this.backCanvas,
    //   0,
    //   0,
    //   this.canvasImageWidth,
    //   this.canvasImageHeight
    // );

    // this.outputCtx.drawImage(
    //   this.videoCanvas,
    //   0,
    //   0,
    //   this.canvasImageWidth,
    //   this.canvasImageHeight
    // );

    // this.outputCtx.drawImage(
    //   this.frontCanvas,
    //   0,
    //   0,
    //   this.canvasImageWidth,
    //   this.canvasImageHeight
    // );
  }


  loop() {
    const renderPrediction = async () => {
      if (window.FRAME.Camera) {
        await this.renderOutputResult();
      }

      requestAnimationFrame(renderPrediction);
    };

    renderPrediction();
  }
}

Camera.setupCamera({
  targetFPS: 30,
  sizeOption: "540 X 720",
})
  .then((res) => {
    window.CAMERA = res;
    if (window.Stats) {
      window.CAMERA.setupStats();
      window.CAMERA.changeFPSStatus();
    }
    // 不斷啓動更新canvas
    window.CAMERA.loop();
    // 廣播通信
    const event = new CustomEvent("camera-isReady", { detail: "ready" });
    document.dispatchEvent(event);
  })
  .catch((err) => {
    const emEl = document.getElementById("error-modal");
    const emiEl = document.getElementById("error-modal-info");

    emiEl.innerText = "攝像頭權限未開啟，倒計時結束后會自動重啓（15）";
    let count = 15;
    let interval = setInterval(() => {
      emiEl.innerText =
        "攝像頭權限未開啟，倒計時結束后會自動重啓" +
        "（" +
        String(count).padStart(2, "0") +
        "）";
      count--;
      if (count < 0) {
        clearInterval(interval);
        window.location.reload();
      }
    }, 1000);
    emEl?.classList?.remove("hidden");
  });
