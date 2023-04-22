//tf.setBackend('cpu');
const videoElement = document.getElementById('video');
const canvas = document.getElementById('canvas');

const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const effectBtn = document.getElementById('effect-btn');
const uneffectBtn = document.getElementById('uneffect-btn');
const showfpsBtn = document.getElementById('showfps-btn');
const hidefpsBtn = document.getElementById('hidefps-btn');
const background_container = document.getElementById('background-container');
const effectlist = document.getElementById("effect_list");
const wait = document.getElementById("wait");
const fps_counter = document.getElementById('fps_counter');
var selected_effect;
var is_mobile;
/*************************************************/
// drlight 29.04.2021 add default vars
var backgroundImageRef;
let backgroundConfig = {type: "image", url: ""};
let usePipeline;
let constraints = {
	video: {
		width: 640,
		height: 360
	},
	audio: false
}
/**************************************************/

// check mobile device
if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {is_mobile = true} else {is_mobile = false};


let contextPerson = canvas.getContext('2d');
//var canvasStream = canvas.captureStream(30);

// samoilov 23.12.2020 add fps counter
/*const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.zIndex = 99999;
stats.domElement.style.opacity= '0.7';
stats.domElement.style.width = '100%';*/

// samoilov 08.05.2021 new fps counter
const times = [];
let fps;

function refreshLoop() {
  window.requestAnimationFrame(() => {
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift();
    }
    times.push(now);
    fps = times.length;
    refreshLoop();
  });
  fps_counter.innerHTML = "Частота кадров: " + fps + " к/с";
}

refreshLoop();

startBtn.addEventListener('click', e => {
  startBtn.disabled = true;
  stopBtn.disabled = false;

  uneffectBtn.disabled = false;
  effectBtn.disabled = false;
  
  //canvas.hidden = false;
  
  fps_counter.style.display = "flex";
  // temp
  //var videlem = document.getElementById("hidden-video-element");
  //document.body.appendChild(saved_canvas);
  /************************************************/
  startVideoStream();
  //startVideoStream_in_hidden();
});

stopBtn.addEventListener('click', e => {
  startBtn.disabled = false;
  stopBtn.disabled = true;

  uneffectBtn.disabled = true;
  effectBtn.disabled = true;

  uneffectBtn.hidden = true;
  effectBtn.hidden = false;

  //videoElement.hidden = false;
  //canvas.hidden = true;
  
  /*hidefpsBtn.disabled = true;
  showfpsBtn.disabled = true;

  hidefpsBtn.hidden = true;
  showfpsBtn.hidden = false;
  videoElement.width = 300;
  videoElement.height = 150;*/
  stopVideoStream();
  //document.getElementsByClassName('card')[0].removeChild( stats.dom );
  //fps_counter.removeChild( stats.dom );
  fps_counter.style.display = "none";
});

effectBtn.addEventListener('click', e => {
  
  effectBtn.hidden = true;
  uneffectBtn.hidden = false;
  
  /*showfpsBtn.disabled = false;
  hidefpsBtn.disabled = true;
  
  hidefpsBtn.hidden = true;
  showfpsBtn.hidden = false;*/

  selected_effect = effectlist.value;
  wait.hidden = false;
  //loadBodyPix();
  //drlight 29.04.2021 mediapipe run
  pipeConversion2Cavans();


});

uneffectBtn.addEventListener('click', e => {
  effectBtn.hidden = false;
  uneffectBtn.hidden = true;

 /* showfpsBtn.disabled = true;
  hidefpsBtn.disabled = false;
  
  hidefpsBtn.hidden = true;
  showfpsBtn.hidden = false;*/
  
  //videoElement.hidden = false;
  background_container.hidden = true;

  //pipeConversion2Cavans(true);
  stopVideoStream();
  startVideoStream();
  //setTimeout(() => {  pipeConversion2Cavans(true); }, 2000);

  
  //fps_counter.removeChild( stats.dom );

  
  //document.getElementsByClassName('card')[0].removeChild( stats.dom );
});

/*showfpsBtn.addEventListener('click', e => {
	
  showfpsBtn.disabled = true;
  hidefpsBtn.disabled = false;
  
  hidefpsBtn.hidden = false;
  showfpsBtn.hidden = true;
  
  
  //document.getElementsByClassName('card')[0].appendChild( stats.dom );
  fps_counter.appendChild( stats.dom );
  
});*/

/*hidefpsBtn.addEventListener('click', e => {
	
  showfpsBtn.disabled = false;
  hidefpsBtn.disabled = true;
  
  hidefpsBtn.hidden = true;
  showfpsBtn.hidden = false;
  
  //document.getElementsByClassName('card')[0].removeChild( stats.dom );
  fps_counter.removeChild( stats.dom );
  
});*/

videoElement.onplaying = () => {
  //if (videoElement.videoHeight>videoElement.videoWidth) {
	//calc_aspect();
	function gcd (a, b) {
            return (b == 0) ? a : gcd (b, a%b);
    };
	var divider = gcd (videoElement.videoWidth,videoElement.videoHeight);
	var width_aspect = videoElement.videoWidth/divider;
	var height_aspect = videoElement.videoHeight/divider;
	/*alert ("Resolution = "+videoElement.videoWidth+" x "+videoElement.videoHeight);
	alert ("Aspect = "+width_aspect+" : "+height_aspect);*/
	videoElement.width = '640';
	videoElement.height = videoElement.width/width_aspect*height_aspect;
	// TODO check canvas height and width for vertical phone camera!
	/*canvas.width = videoElement.width;
	canvas.height = videoElement.height;*/
  //};

};


function startVideoStream() {
  /*videoElement.addEventListener('play', function () {
	var $this = this; //cache
	(function loop() {
		if (!$this.paused && !$this.ended) {
			contextPerson.drawImage($this, 0, 0);
			setTimeout(loop, 1000 / 60); // drawing at 60fps
		}
	})();
  }, 0);*/
  wait.hidden = false;
  navigator.mediaDevices.getUserMedia(constraints)
	//let {width, height} = stream.getTracks()[0].getSettings();
    .then(stream => {

      videoElement.srcObject = stream;
      videoElement.play();
      wait.hidden = true;
    })
    .catch(err => {
      startBtn.disabled = false;
      effectBtn.disabled = true;
      stopBtn.disabled = true;
	  //showfpsBtn.disabled = true;
      alert(`Following error occured: ${err}`);
    });
}

function stopVideoStream() {
  //pipeConversion2Cavans(true);
  
  const stream = videoElement.srcObject;

  videoElement.pause();
  videoElement.src = "";
  videoElement.srcObject = null;
  let tracks = stream.getTracks();
  for (let track in tracks) {
	tracks[track].onended = null;
	//console.info('close stream');
	tracks[track].stop();
  };
  //contextPerson.clearRect(0, 0, canvas.width, canvas.height);

}
// drlight 29.04.2021 mediapipe conversion func
async function pipeConversion2Cavans(newStream){
		let sourcePlayback = {
			sourceStream: videoElement.srcObject,
			newStream: newStream
		}
		let segmentationConfig = {
			backend: "wasmSimd",
			//inputResolution: getSelectVaule('resSelect'),
			inputResolution: "256x144",
			//model: getSelectVaule('modelSelect') || 'meet',
			model: "meet",
			//pipeline: getSelectVaule('pipeSelect'),
			//webgl2
			//canvas2dcpu
			pipeline: "webgl2",
		}
		if(segmentationConfig.model === 'mlkit'){
			segmentationConfig.inputResolution = '256x256'
		}
		backgroundConfig.type = "blur";
		backgroundConfig.url = "";
		//backgroundImageRef.src = "";
		
		/*console.log("sourcePlayback: ", sourcePlayback)
		console.log('segmentationConfig: ', segmentationConfig)
		console.log('backgroundConfig: ', backgroundConfig)*/

		if(!usePipeline){
			usePipeline = new RenderingPipeline()
		}
		usePipeline.useRenderingPipeline(sourcePlayback, backgroundConfig, segmentationConfig, backgroundImageRef, function (data){
			console.warn("useRenderingPipeline callback data: ", data)
			if(data.canvas){
				let canvas = data.canvas
				let stream
				if(canvas.captureStream){
					stream = canvas.captureStream()
				}else if(canvas.mozCaptureStream){
					stream = canvas.mozCaptureStream()
				}else {
					log.error('Current browser does not support captureStream!!')
				}
				//localVideo.srcObject = stream
				videoElement.srcObject = stream;

				//createPeerConnection(stream)
			}
		})
		wait.hidden = true;
}

// bodyPix main parametres set
function loadBodyPix() {
  if (is_mobile === true) {multiplier = 0.50} else {multiplier = 1};
  options = {
	architecture: 'MobileNetV1', // MobileNetV1 -falster less accurate, ResNet50 - slower more accurate
    multiplier: multiplier, // 1, 0.75, 0.50 smaller - lower accuracy
    outputStride: 16, // Stride 16, 32 are supported for the ResNet architecture and stride 8, and 16 are supported for the MobileNetV1 architecture). It specifies the output stride of the BodyPix model. The smaller the value, the larger the output resolution, and more accurate the model at the cost of speed. A larger value results in a smaller model and faster prediction time but lower accuracy.
    quantBytes: 4 //1, 2, 4 smaller - lower accuracy
  }
  bodyPix.load(options)
    .then(net => perform(net))
    .catch(err => console.log(err))
  }

function drawBody(personSegmentation)
{
    contextPerson.drawImage(videoElement, 0, 0, videoElement.width, videoElement.height);
    var imageData = contextPerson.getImageData(0,0, videoElement.width, videoElement.height);
    var pixel = imageData.data;
    for (var p = 0; p<pixel.length; p+=4)
    {
      if (personSegmentation.data[p/4] == 0) {
          pixel[p+3] = 0;
      }
    }
    contextPerson.imageSmoothingEnabled = true;
    contextPerson.putImageData(imageData,0,0);
}

async function perform(net) {
  while (startBtn.disabled && effectBtn.hidden) {
    videoElement.hidden = true;
    canvas.hidden = false;
	// Begin monitoring code for frames per second
    //stats.begin();
    //const segmentation = await net.segmentPerson(video);

    const backgroundBlurAmount = 10; // Defaults to 3. Should be an integer between 1 and 20.
    const edgeBlurAmount = 5; //Defaults to 3. Should be an integer between 0 and 20.
    const flipHorizontal = false; // If the output should be flipped horizontally. Defaults to false.
	const internalResolution = 'high'; // high, low, medium, full
	const segmentationThreshold = 0.7; // 0...1 a higher value will create a tighter crop around a person but may result in some pixels being that are part of a person being excluded from the returned segmentation mask.
	//const maxDetections = 5; // 0...20 for multiperson default 5
    //const scoreThreshold = 0.3; // 0...1 for multiperson default 0.3
    //const nmsRadius = 20; // 0...30 for multiperson default 20

	options = {
		flipHorizontal: flipHorizontal,
		internalResolution: internalResolution,
		segmentationThreshold: segmentationThreshold
	};
	
	if (selected_effect === 'background' && effectBtn.hidden) {
		background_container.style.width = videoElement.width;
		background_container.style.height = videoElement.height;
		background_container.hidden = false;
		canvas.style.position = 'absolute';
		segmentation = await net.segmentPerson(videoElement, options);
		drawBody(segmentation);
	} else if (selected_effect === 'blur' && effectBtn.hidden) {
		//segmentation = await net.segmentPerson(videlem);
		segmentation = await net.segmentPerson(videoElement, options);
		canvas.style.position = 'relative';
		//bodyPix.drawBokehEffect(canvas, videlem, segmentation, backgroundBlurAmount, edgeBlurAmount, flipHorizontal, internalResolution, segmentationThreshold);
		bodyPix.drawBokehEffect(canvas, videoElement, segmentation, backgroundBlurAmount, edgeBlurAmount, flipHorizontal);
	}
	wait.hidden = true;
	  
	// End monitoring code for frames per second
    //stats.end();
  }
  background_container.hidden = true;
}
