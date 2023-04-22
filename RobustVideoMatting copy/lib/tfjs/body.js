class Bodypix {
  #independentCanvas = document.createElement("canvas");

  constructor(bodySegmentation) {
    this.bodySegmentation = bodySegmentation;
    this.model = this.bodySegmentation.SupportedModels.BodyPix;
    this.modelConfig = {
      architecture: "MobileNetV1",
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 4,
      visualization: "binaryMask",
    };
    this.visualization = {
      foregroundThreshold: 0.75,
      maskOpacity: 1,
      maskBlur: 0,
      pixelCellWidth: 10,
      backgroundBlur: 3,
      edgeBlur: 3,
    };
    this.hasBg = false;
  }

  static setupBodypix(bodySegmentation, videoWidth, videoHeight) {
    const bodypix = new Bodypix(bodySegmentation);
    bodypix.createIndepentCanvas(videoWidth, videoHeight);
    return bodypix;
  }

  createIndepentCanvas(videoWidth, videoHeight) {
    this.#independentCanvas.width = videoWidth;
    this.#independentCanvas.height = videoHeight;
  }

  async createDetector() {
    return this.bodySegmentation.createSegmenter(this.model, {
      architecture: this.modelConfig.architecture,
      outputStride: parseFloat(this.modelConfig.outputStride),
      multiplier: parseFloat(this.modelConfig.multiplier),
      quantBytes: parseFloat(this.modelConfig.quantBytes),
      modelUrl: "/static/model/body/model-stride16.json",
    });
  }

  async getSegmentation(segmenter) {
    return await segmenter.segmentPeople(window.CAMERA.video, {
      flipHorizontal: false,
      multiSegmentation: false,
      segmentBodyParts: true,
      segmentationThreshold: this.visualization.foregroundThreshold,
    });
  }

  async drawResults(segmentation) {
    if (segmentation.length > 0) {
      // 人部分進行透明處理後的數據，变成遮罩
      const data = await this.bodySegmentation.toBinaryMask(
        segmentation,
        { r: 0, g: 0, b: 0, a: 255 },
        { r: 0, g: 0, b: 0, a: 0 },
        false,
        this.visualization.foregroundThreshold
      );
      const ctx = window.CAMERA.videoCanvas.getContext("2d");
      // 獲取canvas的實際長寬
      const camCanvasSize = window.CAMERA.getCanvasSize();
      // 獲取video的實際長寬
      const camVideoSize = window.CAMERA.getVideoSize();

      // ctx.restore();

      const independent_ctx = this.#independentCanvas.getContext("2d");
      independent_ctx.globalCompositeOperation = "destination-over";
      independent_ctx.putImageData(data, 0, 0);
      const imageUrl = this.#independentCanvas.toDataURL();
      const newImage = new Image();

      // 關鍵代碼 处理后，剩下人
      newImage.onload = function() {
        // 這部分是mask
        ctx.globalCompositeOperation = "copy";
        // 拿到mask，將mask模糊化（虛化）;
        ctx.filter = "blur(8px)";
        ctx.drawImage(
          newImage,
          0,
          0,
          camCanvasSize ? camCanvasSize.width : camVideoSize.width,
          camCanvasSize ? camCanvasSize.height : camVideoSize.height
        );
        // 這部分是影像
        ctx.globalCompositeOperation = "source-in";
        // 拿到影像，取消模糊化
        ctx.filter = "none";
        ctx.drawImage(
          window.CAMERA.video,
          0,
          0,
          camCanvasSize ? camCanvasSize.width : camVideoSize.width,
          camCanvasSize ? camCanvasSize.height : camVideoSize.height
        );
      };

      newImage.src = imageUrl;
    }
  }

  changeBackground(img_src) {
    let interval_time = setInterval(() => {
      if (window.BODYPIX_DETECTOR) {
        this.hasBg = true;
        window.CAMERA.videoCanvas.style.backgroundPosition = "center";
        window.CAMERA.videoCanvas.style.backgroundSize = "cover";
        window.CAMERA.videoCanvas.style.backgroundImage = `url("${img_src}")`;
        clearInterval(interval_time);
      }
    }, 1000);
  }
}

document.addEventListener("hand-isReady", (e) => {
  if (bodySegmentation) {
    if (e.detail === "ready") {
      let bodypix;
      window.BODYPIX = bodypix = Bodypix.setupBodypix(
        window.bodySegmentation,
        window.CAMERA.video.videoWidth,
        window.CAMERA.video.videoHeight
      );
      bodypix.createDetector().then((res) => {
        window.BODYPIX_DETECTOR = res;
      });

      const event = new CustomEvent("body-isReady", { detail: "ready" });
      document.dispatchEvent(event);
    } else {
      alert("camera is not ready");
    }
  } else {
    alert("cant get bodySegmentation CDN");
  }
});
