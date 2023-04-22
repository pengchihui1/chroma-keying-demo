import * as handdetection from "@tensorflow-models/hand-pose-detection";
import * as posedetection from "@tensorflow-models/pose-detection";

// hand
export const DEFAULT_LINE_WIDTH = 2;
export const DEFAULT_RADIUS = 4;

export const VIDEO_SIZE = {
  "640 X 480": { width: 640, height: 480 },
  "640 X 360": { width: 640, height: 360 },
  "360 X 270": { width: 360, height: 270 },
};

export const STATE = {
  camera: { targetFPS: 30, sizeOption: "640 X 480" },
  backend: "tfjs-webgl",
  flags: {},
  modelConfig: {},
};

export const MEDIAPIPE_HANDS_CONFIG = {
  type: "lite",
  render3D: false,
};

export const MOVENET_CONFIG = {
  maxPoses: 1,
  type: "lightning",
  scoreThreshold: 0.3,
  customModel: "",
  enableTracking: false,
};

export const TUNABLE_FLAG_VALUE_RANGE_MAP = {
  WEBGL_VERSION: [1, 2],
  WASM_HAS_SIMD_SUPPORT: [true, false],
  WASM_HAS_MULTITHREAD_SUPPORT: [true, false],
  WEBGL_CPU_FORWARD: [true, false],
  WEBGL_PACK: [true, false],
  WEBGL_FORCE_F16_TEXTURES: [true, false],
  WEBGL_RENDER_FLOAT32_CAPABLE: [true, false],
  WEBGL_FLUSH_THRESHOLD: [-1, 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
  CHECK_COMPUTATION_FOR_ERRORS: [true, false],
};

export const BACKEND_FLAGS_MAP = {
  ["tfjs-webgl"]: [
    "WEBGL_VERSION",
    "WEBGL_CPU_FORWARD",
    "WEBGL_PACK",
    "WEBGL_FORCE_F16_TEXTURES",
    "WEBGL_RENDER_FLOAT32_CAPABLE",
    "WEBGL_FLUSH_THRESHOLD",
  ],
  ["mediapipe-gpu"]: [],
};

export const MODEL_BACKEND_MAP = {
  [handdetection.SupportedModels.MediaPipeHands]: [
    "mediapipe-gpu",
    "tfjs-webgl",
  ],
  [posedetection.SupportedModels.MoveNet]: [
    "tfjs-webgl",
    // "tfjs-wasm",
  ],
};

export const TUNABLE_FLAG_NAME_MAP = {
  PROD: "production mode",
  WEBGL_VERSION: "webgl version",
  WASM_HAS_SIMD_SUPPORT: "wasm SIMD",
  WASM_HAS_MULTITHREAD_SUPPORT: "wasm multithread",
  WEBGL_CPU_FORWARD: "cpu forward",
  WEBGL_PACK: "webgl pack",
  WEBGL_FORCE_F16_TEXTURES: "enforce float16",
  WEBGL_RENDER_FLOAT32_CAPABLE: "enable float32",
  WEBGL_FLUSH_THRESHOLD: "GL flush wait time(ms)",
};
