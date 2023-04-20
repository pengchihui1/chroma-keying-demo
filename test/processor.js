let processor = {
    // 實時更新
    timerCallback: function() {
      if (this.video.paused || this.video.ended) {
        return;
      }
      this.computeFrame();
      let self = this;
      setTimeout(function () {
          self.timerCallback();
        }, 0);
    },
  
    doLoad: async function() {
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
      
      const stream = await  navigator.mediaDevices.getUserMedia(videoConfig);
      this.video = document.getElementById("video");
      this.video.srcObject =stream
      this.video.onloadedmetadata = () => {
        this.video.play();
      };
      this.c1 = document.getElementById("c1");
      this.ctx1 = this.c1.getContext("2d");
      this.c2 = document.getElementById("c2");
    
      this.ctx2 = this.c2.getContext("2d");
      let self = this;
      // 點擊事件
      this.video.addEventListener("play", function() {
          self.width = self.video.videoWidth ;
          self.height = self.video.videoHeight;
          self.timerCallback();
        }, false);
    },
  
    computeFrame: function() {
      const rgba = [0, 0, 0, 255];
      const tolerance = 150;
      const [r0, g0, b0, a0] = rgba;
      var r, g, b, a;

      this.c2.style.backgroundImage="url(/media/Earth.png)"
      this.c2.style.backgroundRepeat="no-repeat"
      this.c2.style.backgroundPosition="-49px -64px"

      // 獲得來之視頻裏canvas的内容
      this.ctx1.drawImage(this.video, 0, 0, this.width, this.height);
      let frame = this.ctx1.getImageData(0, 0, this.width, this.height);
          let l = frame.data.length / 4;
  
      // 去綠幕處理
      // for (let i = 0; i < l; i++) {
      //   let r = frame.data[i * 4 + 0];
      //   let g = frame.data[i * 4 + 1];
      //   let b = frame.data[i * 4 + 2];
      //   if (g > 100 && r > 100 && b < 43)
      //     frame.data[i * 4 + 3] = 0;
      // }

      // 去除背景
      for (let i = 0; i < frame.data.length; i += 4) {
        r = frame.data[i];
        g = frame.data[i + 1];
        b = frame.data[i + 2];
        a = frame.data[i + 3];
        const t = Math.sqrt((r - r0) ** 2 + (g - g0) ** 2 + (b - b0) ** 2 + (a - a0) ** 2);
        if (t > tolerance) {
          frame.data[i] = 0;
          frame.data[i + 1] = 0;
          frame.data[i + 2] = 0;
          frame.data[i + 3] = 0;
        }
      }

      this.ctx2.putImageData(frame, 0, 0);
      return;
    }
  };
// 加載内容
document.addEventListener("DOMContentLoaded", () => {
  processor.doLoad();
});