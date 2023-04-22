
// fetch中使用AbortController結合定時器，控制超時進行關閉fetch
const timeout_ms = 20000;

class FRAME {
  constructor() {
    this.Camera;

    this.points;

    this.func = (name, value) => {};
  }

  loadCamera() {
    let intervalTime = setInterval(() => {
      if (window.CAMERA) {
        this.Camera = window.CAMERA;
        clearInterval(intervalTime);
      }
    }, 1000);
  }

  // 加載主頁的常見dom，單獨拿出來是爲了後續方便添加
  loadJueryDom() {
    this.$App = $("#app");
    this.$Log = $("#log");
    this.$LogLoading = $("#log_loading");
  }

  /**
   * @param {(name,value)=>{}} xxx
   * 傳入一個function，回傳姿勢模塊的名字`name`，以及每秒的值`value`
   */
  ml_useData(xxx) {
    this.func = xxx;
  }


  async get_uuid() {
    try {
      const url = `/api/getuuid`;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout_ms);
      const response = await fetch(url, {
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async upload(
    dirname = "",
    fire = null,
    fileName = "",
    fileType = "",
    isSync = false
  ) {
    try {
      const fd = new FormData();
      const uploadUrl = `/upload?isSync=${isSync}`;

      fd.append(dirname, fire, fileName);

      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout_ms);

      const response = await fetch(
        uploadUrl,
        {
          method: "post",
          body: fd,
          signal: controller.signal,
        },
        fileType
      );
      clearTimeout(id);
      return response;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async print(path = "", type = "local") {
    // console.log(path);
    if (!path) {
      throw new Error("參數不完整", {
        path,
      });
    }

    const response = await fetch("/api/getprint", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imagepath: path,
        type,
      }),
    });
    return response;
  }

  // 新增一筆打印資料到ar項目數據庫上
  async toArCreate(image_url, video_url, mind_url, type, id) {
    console.log(image_url, video_url, mind_url);
    if (!image_url || !video_url || !mind_url) {
      throw new Error("參數不完整");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout_ms);

    const response = await fetch("/api/ar/create", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url,
        video_url,
        mind_url,
        type,
        id,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return response;
  }

  // 更新create新增的打印資料的狀態
  async toArUpdate(id = "", print_state = false, print_photo = "") {
    if (!id || !print_photo) {
      throw new Error("參數不完整", {
        id,
        print_photo,
      });
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout_ms);
    const response = await fetch("/api/ar/update", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        print_state,
        print_photo,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  }

  // 獲取待打印資料
  async toArGetQueuingPrint() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout_ms);
    const response = await fetch("/api/ar/getqueuingprint", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  }

  // 更新待打印資料的打印狀態
  async toArQueuingPrintUpdate(queuingPrintId, print_state = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout_ms);
    const response = await fetch("/api/ar/queuingprintupdate", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queuingPrintId,
        print_state,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  }

  // 獲取自拍機文案
  async toArGetIntroduction() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout_ms);
    const response = await fetch("/api/ar/getintroduction", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  }

  // 獲取自拍機用戶資料
  async toArGetUser() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout_ms);
    const response = await fetch("/api/ar/getselfieuser", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  }
}

window.FRAME = new FRAME();
window.FRAME.loadCamera();
