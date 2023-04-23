const video = document.querySelector(".player");
const canvas = document.querySelector(".photo");
const ctx = canvas.getContext("2d");
const strip = document.querySelector(".strip");
const snap = document.querySelector(".snap");
const toggleCamera = document.querySelector("#toggleCamera");
const toggleAlpha = document.querySelector("#toggleAlpha");

let videoStream;
let draw = () => { };
let isRun = false;
let isUseRed = false;
let isUseRgbSplit = false;
let isUseGreenScreen = false;
let isAddAlpha = false;
let width = video.videoWidth;
let height = video.videoHeight;
canvas.width = width;
canvas.height = height;
function getVideo() {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then(localMediaStream => {
      console.log(localMediaStream);
      videoStream = localMediaStream;
      video.srcObject = localMediaStream;
      video.play();
      isRun = true;
    })
    .catch(e => console.error("OH! error", e));
}

function paintToCanvas() {
  //get real video size
  width = video.videoWidth;
  height = video.videoHeight;
  canvas.width = width;
  canvas.height = height;
  drawVideo();
}
function drawVideo() {
  draw = setInterval(() => {
    ctx.drawImage(video, 0, 0, width, height);
  }, 30);
}
function takePhoto() {
  snap.currentTime = 0;
  snap.play();

  const imageData = canvas.toDataURL("image/jpeg");
  const link = document.createElement("a");
  link.href = imageData;
  link.setAttribute("download", "photo");
  link.innerHTML = `<img src="${imageData}" alt="Your great photo!"/>`;
  strip.insertBefore(link, strip.firstChild);
}
function redEffect(pixels) {
  // red ,green, blue, alpha 循環
  for (let i = 0; i <= pixels.data.length; i += 4) {
    pixels.data[i] += 50;
    pixels.data[i + 1] -= 50;
    pixels.data[i + 2] *= 0.5;
  }
  return pixels;
}
function toggleRedEffect() {
  clearInterval(draw);

  if (!isUseRed) {
    draw = setInterval(() => {
      ctx.drawImage(video, 0, 0, width, height);
      let pixels = ctx.getImageData(0, 0, width, height);
      pixels = redEffect(pixels);
      ctx.putImageData(pixels, 0, 0);
    }, 30);
  } else {
    drawVideo();
  }
  isUseRed = !isUseRed;
}
function toggleRGBSplit() {
  clearInterval(draw);

  if (!isUseRgbSplit) {
    draw = setInterval(() => {
      ctx.drawImage(video, 0, 0, width, height);
      let pixels = ctx.getImageData(0, 0, width, height);
      pixels = rgbSplit(pixels);
      ctx.putImageData(pixels, 0, 0);
    }, 30);
  } else {
    drawVideo();
  }
  isUseRgbSplit = !isUseRgbSplit;
}
function toggleAlphaFunc() {
  if (!isAddAlpha) {
    ctx.globalAlpha = 0.3;
    toggleAlpha.textContent = "Cancel alpha";
  } else {
    ctx.globalAlpha = 1;
    toggleAlpha.textContent = "Add alpha";
  }

  isAddAlpha = !isAddAlpha;
}
function rgbSplit(pixels) {
  for (let i = 0; i < pixels.data.length; i += 4) {
    pixels.data[i - 150] = pixels.data[i + 0]; // RED
    pixels.data[i + 500] = pixels.data[i + 1]; // GREEN
    pixels.data[i - 550] = pixels.data[i + 2]; // Blue
  }
  return pixels;
}
function greenScreen(pixels) {
  const levels = {};

  [...document.querySelectorAll(".rgb input")].forEach(input => {
    levels[input.name] = input.value;
  });

  for (i = 0; i < pixels.data.length; i = i + 4) {
    red = pixels.data[i + 0];
    green = pixels.data[i + 1];
    blue = pixels.data[i + 2];
    alpha = pixels.data[i + 3];

    if (
      red >= levels.rmin &&
      green >= levels.gmin &&
      blue >= levels.bmin &&
      red <= levels.rmax &&
      green <= levels.gmax &&
      blue <= levels.bmax
    ) {
      // take it out!
      pixels.data[i + 3] = 0;
    }
  }

  return pixels;
}
function toggleGreenScreen() {
  clearInterval(draw);

  if (!isUseGreenScreen) {
    draw = setInterval(() => {
      ctx.drawImage(video, 0, 0, width, height);
      let pixels = ctx.getImageData(0, 0, width, height);
      pixels = greenScreen(pixels);
      ctx.putImageData(pixels, 0, 0);
    }, 30);
  } else {
    drawVideo();
  }
  isUseGreenScreen = !isUseGreenScreen;
}
function toggleCameraFunc() {
  if (isRun) {
    videoStop();
    init();
    toggleCamera.textContent = "Play";
    canvas.style.transform = "";
    video.style.transform = "";
  } else {
    getVideo();
    toggleCamera.textContent = "Pause";
    // 鏡像處理
    canvas.style.transform = "rotateY(180deg)";
    video.style.transform = "rotateY(180deg)";
  }
  isRun = !isRun;
}
function videoStop() {
  clearInterval(draw);

  let tracks = videoStream.getVideoTracks();
  tracks[0].stop();
}
function init() {
  canvas.width = 1280;
  canvas.height = 720;
  ctx.font = "20px Arial";
  ctx.fillText("Please press 'play' button to start!", 480, 360);
}
//getVideo();
video.addEventListener("canplay", paintToCanvas);

init();