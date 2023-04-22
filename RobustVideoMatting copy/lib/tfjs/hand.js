const ANCHOR_POINTS = [
  [0, 0, 0],
  [0, 0.1, 0],
  [-0.1, 0, 0],
  [-0.1, -0.1, 0],
];

const fingerLookupIndices = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
}; // for rendering each finger as a polyline

const connections = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
];

class Hand {
  constructor() {
    this.model = handPoseDetection.SupportedModels.MediaPipeHands;
    this.modelConfig = {
      detectorModelUrl:
        "/static/model/hand-pose/tfjs-webgl/detector-model.json",
      landmarkModelUrl:
        "/static/model/hand-pose/tfjs-webgl/landmark-model.json",
      // solutionPath: "/static/model/hand-pose/tfjs-webgl/",
      runtime: "tfjs",
      modelType: "lite",
      maxHands: 8,
    };
    this.scoreThreshold = 0.9;
    this.points = null;
    this.isDrawLine = false;
  }

  async createDetector() {
    return handPoseDetection.createDetector(this.model, this.modelConfig);
  }

  async getPoints(detector) {
    return await detector.estimateHands(window.CAMERA.video, {
      flipHorizontal: false,
    });
  }

  async drawResults(hands) {
    // Sort by right to left hands.
    hands.sort((hand1, hand2) => {
      if (hand1.handedness < hand2.handedness) return 1;
      if (hand1.handedness > hand2.handedness) return -1;
      return 0;
    });

    // Pad hands to clear empty scatter GL plots.
    while (hands.length < 2) hands.push({});

    for (let i = 0; i < hands.length; ++i) {
      this.drawResult(hands[i]);
    }
  }

  /**
   * Draw the keypoints on the video.
   * @param hand A hand with keypoints to render.
   */
  drawResult(hand) {
    if (hand.keypoints != null) {
      this.drawKeypoints(hand.keypoints, hand.handedness);
    }
  }

  /**
   * Draw the keypoints on the video.
   * @param keypoints A list of keypoints.
   * @param handedness Label of hand (either Left or Right).
   */
  drawKeypoints(keypoints, handedness) {
    const keypointsArray = keypoints;
    window.CAMERA.videoCanvas.getContext("2d").fillStyle =
      handedness === "Left" ? "Red" : "Blue";
    window.CAMERA.videoCanvas.getContext("2d").strokeStyle = "white";
    window.CAMERA.videoCanvas.getContext("2d").lineWidth = 4;

    for (let i = 0; i < keypointsArray.length; i++) {
      const y = keypointsArray[i].x;
      const x = keypointsArray[i].y;
      this.drawPoint(x - 2, y - 2, 3);
    }

    const fingers = Object.keys(fingerLookupIndices);
    for (let i = 0; i < fingers.length; i++) {
      const finger = fingers[i];
      const points = fingerLookupIndices[finger].map((idx) => keypoints[idx]);
      this.drawPath(points, false);
    }
  }

  drawPath(points, closePath) {
    const region = new Path2D();
    const ratioObj = window.CAMERA.getCanvasVideoRatio();

    region.moveTo(points[0].x * ratioObj.x, points[0].y * ratioObj.y);
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      region.lineTo(point.x * ratioObj.x, point.y * ratioObj.y);
    }

    if (closePath) {
      region.closePath();
    }
    window.CAMERA.videoCanvas.getContext("2d").stroke(region);
  }

  drawPoint(y, x, r) {
    const ratioObj = window.CAMERA.getCanvasVideoRatio();

    window.CAMERA.videoCanvas.getContext("2d").beginPath();
    window.CAMERA.videoCanvas
      .getContext("2d")
      .arc(x * ratioObj.x, y * ratioObj.y, r, 0, 2 * Math.PI);
    window.CAMERA.videoCanvas.getContext("2d").fill();
  }
}

document.addEventListener("pose-isReady", async (e) => {
  if (handPoseDetection) {
    if (e.detail === "ready") {
      let hand;
      window.HAND = hand = new Hand();
      hand.isDrawLine = document.getElementsByName("handLine")[0]?.content
        ? document.getElementsByName("handLine")[0].content
        : false;
      window.HAND_DETECTOR = await hand.createDetector();

      const event = new CustomEvent("hand-isReady", { detail: "ready" });
      document.dispatchEvent(event);
    } else {
      alert("camera is not ready");
    }
  } else {
    alert("cant get handPoseDetection CDN");
  }
});
