const COLOR_PALETTE = [
  "#ffffff",
  "#800000",
  "#469990",
  "#e6194b",
  "#42d4f4",
  "#fabed4",
  "#aaffc3",
  "#9a6324",
  "#000075",
  "#f58231",
  "#4363d8",
  "#ffd8b1",
  "#dcbeff",
  "#808000",
  "#ffe119",
  "#911eb4",
  "#bfef45",
  "#f032e6",
  "#3cb44b",
  "#a9a9a9",
];

class Pose {
  constructor() {
    this.model = poseDetection.SupportedModels.MoveNet;
    this.modelConfig = {
      modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
      // modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      modelUrl: "/static/model/movenet/mutipose/movenet-model.json",
    };
    this.scoreThreshold = 0.3;
    this.points = null;
    this.isDrawLine = false;
  }

  async createDetector() {
    return poseDetection.createDetector(this.model, {
      modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
      // modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      modelUrl: "/static/model/movenet/mutipose/movenet-model.json",
      // modelUrl: "/static/model/movenet/movenet-model.json",
    });
  }

  async getPoints(detector) {
    return await detector.estimatePoses(window.CAMERA.video, {
      // maxPoses: 1,
      flipHorizontal: false,
    });
  }

  drawResults(poses) {
    for (const pose of poses) {
      this.drawResult(pose);
    }
  }

  drawResult(pose) {
    if (pose.keypoints != null) {
      this.drawKeypoints(pose.keypoints);
      this.drawSkeleton(pose.keypoints, pose.id);
    }
  }

  drawKeypoints(keypoints) {
    const keypointInd = poseDetection.util.getKeypointIndexBySide(this.model);
    window.CAMERA.videoCanvas.getContext("2d").fillStyle = "Red";
    window.CAMERA.videoCanvas.getContext("2d").strokeStyle = "White";
    window.CAMERA.videoCanvas.getContext("2d").lineWidth = 2;

    for (const i of keypointInd.middle) {
      this.drawKeypoint(keypoints[i]);
    }

    window.CAMERA.videoCanvas.getContext("2d").fillStyle = "Green";
    for (const i of keypointInd.left) {
      this.drawKeypoint(keypoints[i]);
    }

    window.CAMERA.videoCanvas.getContext("2d").fillStyle = "Orange";
    for (const i of keypointInd.right) {
      this.drawKeypoint(keypoints[i]);
    }
  }

  drawKeypoint(keypoint) {
    // If score is null, just show the keypoint.
    const score = keypoint.score != null ? keypoint.score : 1;
    const ratioObj = window.CAMERA.getCanvasVideoRatio();

    if (score >= this.scoreThreshold) {
      const circle = new Path2D();
      circle.arc(
        keypoint.x * ratioObj.x,
        keypoint.y * ratioObj.y,
        4,
        0,
        2 * Math.PI
      );
      window.CAMERA.videoCanvas.getContext("2d").fill(circle);
      window.CAMERA.videoCanvas.getContext("2d").stroke(circle);
    }
  }

  /**
   * Draw the skeleton of a body on the video.
   * @param keypoints A list of keypoints.
   */
  drawSkeleton(keypoints, poseId) {
    // Each poseId is mapped to a color in the color palette.
    const color = poseId != null ? COLOR_PALETTE[poseId % 20] : "White";

    const ratioObj = window.CAMERA.getCanvasVideoRatio();
    window.CAMERA.videoCanvas.getContext("2d").fillStyle = color;
    window.CAMERA.videoCanvas.getContext("2d").strokeStyle = color;
    window.CAMERA.videoCanvas.getContext("2d").lineWidth = 4;

    poseDetection.util.getAdjacentPairs(this.model).forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];

      // If score is null, just show the keypoint.
      const score1 = kp1.score != null ? kp1.score : 1;
      const score2 = kp2.score != null ? kp2.score : 1;

      if (score1 >= this.scoreThreshold && score2 >= this.scoreThreshold) {
        window.CAMERA.videoCanvas.getContext("2d").beginPath();
        window.CAMERA.videoCanvas
          .getContext("2d")
          .moveTo(kp1.x * ratioObj.x, kp1.y * ratioObj.y);
        window.CAMERA.videoCanvas
          .getContext("2d")
          .lineTo(kp2.x * ratioObj.x, kp2.y * ratioObj.y);
        window.CAMERA.videoCanvas.getContext("2d").stroke();
      }
    });
  }
}

document.addEventListener("camera-isReady", async (e) => {
  if (poseDetection) {
    if (e.detail === "ready") {
      let pose;
      window.POSE = pose = new Pose();
      pose.isDrawLine = document.getElementsByName("poseLine")[0]?.content
        ? document.getElementsByName("poseLine")[0].content
        : false;
      window.POSE_DETECTOR = await pose.createDetector();

      const event = new CustomEvent("pose-isReady", { detail: "ready" });
      document.dispatchEvent(event);
    } else {
      alert("camera is not ready");
      return;
    }
  } else {
    alert("cant get bodySegmentation CDN");
    return;
  }
});
