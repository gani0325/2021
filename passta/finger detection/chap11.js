 // 1. 손감지

 function isMobile() {
   const isAndroid = /Android/i.test(navigator.userAgent);
   const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
   return isAndroid || isiOS;
 }
 
 let videoWidth, videoHeight, rafID, ctx, canvas, ANCHOR_POINTS,
     scatterGLHasInitialized = false, scatterGL, fingerLookupIndices = {
       thumb: [0, 1, 2, 3, 4],
       indexFinger: [0, 5, 6, 7, 8],
       middleFinger: [0, 9, 10, 11, 12],
       ringFinger: [0, 13, 14, 15, 16],
       pinky: [0, 17, 18, 19, 20]
     };  // for rendering each finger as a polyline
 
 const VIDEO_WIDTH = 640;
 const VIDEO_HEIGHT = 500;
 const mobile = isMobile();
 // Don't render the point cloud on mobile in order to maximize performance and
 // to avoid crowding limited screen space.
 const renderPointcloud = mobile === false;
 
 const state = {
   backend: 'webgl'
 };
 
 const stats = new Stats();
 stats.showPanel(0);
 document.body.appendChild(stats.dom);
 
 if (renderPointcloud) {
   state.renderPointcloud = true;
 }
 
 function setupDatGui() {
   const gui = new dat.GUI();
   gui.add(state, 'backend', ['webgl', 'wasm'])
       .onChange(async backend => {
         window.cancelAnimationFrame(rafID);
         await tf.setBackend(backend);
         await addFlagLabels();
         landmarksRealTime(video);
       });
 
   if (renderPointcloud) {
     gui.add(state, 'renderPointcloud').onChange(render => {
       document.querySelector('#scatter-gl-container').style.display =
           render ? 'inline-block' : 'none';
     });
   }
 }
 
 function drawPoint(y, x, r) {
   ctx.beginPath();
   ctx.arc(x, y, r, 0, 2 * Math.PI);
   ctx.fill();
 }
 
 function drawKeypoints(keypoints) {
   const keypointsArray = keypoints;
 
   for (let i = 0; i < keypointsArray.length; i++) {
     const y = keypointsArray[i][0];
     const x = keypointsArray[i][1];
     drawPoint(x - 2, y - 2, 3);
   }
 
   const fingers = Object.keys(fingerLookupIndices);
   for (let i = 0; i < fingers.length; i++) {
     const finger = fingers[i];
     const points = fingerLookupIndices[finger].map(idx => keypoints[idx]);
     drawPath(points, false);
   }
 }
 
 function drawPath(points, closePath) {
   const region = new Path2D();
   region.moveTo(points[0][0], points[0][1]);
   for (let i = 1; i < points.length; i++) {
     const point = points[i];
     region.lineTo(point[0], point[1]);
   }
 
   if (closePath) {
     region.closePath();
   }
   ctx.stroke(region);
 }
 
 let model;
 
 async function setupCamera() {
   if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
     throw new Error(
         'Browser API navigator.mediaDevices.getUserMedia not available');
   }
 
   const video = document.getElementById('video');
   const stream = await navigator.mediaDevices.getUserMedia({
     'audio': false,
     'video': {
       facingMode: 'user',
       // Only setting the video to a specified size in order to accommodate a
       // point cloud, so on mobile devices accept the default size.
       width: mobile ? undefined : VIDEO_WIDTH,
       height: mobile ? undefined : VIDEO_HEIGHT
     },
   });
   video.srcObject = stream;
 
   return new Promise((resolve) => {
     video.onloadedmetadata = () => {
       resolve(video);
     };
   });
 }
 
 async function loadVideo() {
   const video = await setupCamera();
   video.play();
   return video;
 }
 async function addFlagLabels() {
   if(!document.querySelector("#simd_supported")) {
     const simdSupportLabel = document.createElement("div");
     simdSupportLabel.id = "simd_supported";
     simdSupportLabel.style = "font-weight: bold";
     const simdSupported = await tf.env().getAsync('WASM_HAS_SIMD_SUPPORT');
     simdSupportLabel.innerHTML = `SIMD supported: <span class=${simdSupported}>${simdSupported}<span>`;
     document.querySelector("#info").appendChild(simdSupportLabel);
   }
 
   if(!document.querySelector("#threads_supported")) {
     const threadSupportLabel = document.createElement("div");
     threadSupportLabel.id = "threads_supported";
     threadSupportLabel.style = "font-weight: bold";
     const threadsSupported = await tf.env().getAsync('WASM_HAS_MULTITHREAD_SUPPORT');
     threadSupportLabel.innerHTML = `Threads supported: <span class=${threadsSupported}>${threadsSupported}</span>`;
     document.querySelector("#info").appendChild(threadSupportLabel);
   }
 }
 async function main() {
   await tf.setBackend(state.backend);
   if (!tf.env().getAsync('WASM_HAS_SIMD_SUPPORT') && state.backend == "wasm") {
     console.warn("The backend is set to WebAssembly and SIMD support is turned off.\nThis could bottleneck your performance greatly, thus to prevent this enable SIMD Support in chrome://flags");
   }
   model = await handpose.load();
   let video;
 
   try {
     video = await loadVideo();
   } catch (e) {
     let info = document.getElementById('info');
     info.textContent = e.message;
     info.style.display = 'block';
     throw e;
   }
 
  //  setupDatGui();
 
   videoWidth = video.videoWidth;
   videoHeight = video.videoHeight;
 
   canvas = document.getElementById('output');
   canvas.width = videoWidth;
   canvas.height = videoHeight;
   video.width = videoWidth;
   video.height = videoHeight;
 
   ctx = canvas.getContext('2d');
   ctx.clearRect(0, 0, videoWidth, videoHeight);
   ctx.strokeStyle = 'red';
   ctx.fillStyle = 'red';
 
   ctx.translate(canvas.width, 0);
   ctx.scale(-1, 1);
 
   // These anchor points allow the hand pointcloud to resize according to its
   // position in the input.
   ANCHOR_POINTS = [
     [0, 0, 0], [0, -VIDEO_HEIGHT, 0], [-VIDEO_WIDTH, 0, 0],
     [-VIDEO_WIDTH, -VIDEO_HEIGHT, 0]
   ];
 
   if (renderPointcloud) {
     document.querySelector('#scatter-gl-container').style =
         `width: ${VIDEO_WIDTH}px; height: ${VIDEO_HEIGHT}px;`;
 
     scatterGL = new ScatterGL(
         document.querySelector('#scatter-gl-container'),
         {'rotateOnStart': false, 'selectEnabled': false});
   }
 
   landmarksRealTime(video);
 }
 
 const landmarksRealTime = async (video) => {
   async function frameLandmarks() {
     stats.begin();
     ctx.drawImage(
         video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width,
         canvas.height);
     const predictions = await model.estimateHands(video);
     if (predictions.length > 0) {        // 결과 값 가짐 !!
       const result = predictions[0].landmarks;
       drawKeypoints(result, predictions[0].annotations);
       console.log("감지!")

 
       if (renderPointcloud === true && scatterGL != null) {
         const pointsData = result.map(point => {
           return [-point[0], -point[1], -point[2]];
         });
 
         const dataset =
             new ScatterGL.Dataset([...pointsData, ...ANCHOR_POINTS]);
 
         if (!scatterGLHasInitialized) {
           scatterGL.render(dataset);
 
           const fingers = Object.keys(fingerLookupIndices);
 
           scatterGL.setSequences(
               fingers.map(finger => ({indices: fingerLookupIndices[finger]})));
           scatterGL.setPointColorer((index) => {
             if (index < pointsData.length) {
               return 'steelblue';
             }
             return 'white';  // Hide.
           });
         } else {
           scatterGL.updateDataset(dataset);
         }
         scatterGLHasInitialized = true;
       }
     }
       else {
         console.log("감지못함")
    }
     
     stats.end();
     rafID = requestAnimationFrame(frameLandmarks);
   };
 
   frameLandmarks();
 };
 
 navigator.getUserMedia = navigator.getUserMedia ||
     navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
 
 main();



 // 2. 스톱워치

const timeStamp = document.querySelector(".timestamp");
const recordList = document.querySelector(".record-list");
const startBtn = document.querySelector(".start-btn");
// const startBtn = document.querySelector(".start-btn").addEventListener('click', handleClick);

const labBtn = document.querySelector(".lab-btn");



let minutes = 0; //분
let seconds = 0; //초
let milisec = 0; //밀리초
let count = 0; //시간 세는 변수
let timer; //setInterval 값을 넣어 나중에 clearInterval하기위한 변수

function countTime() {
    if (startBtn.value == "시작") {
    

    startBtn.value = "중단";
    startBtn.className = "stop-btn";
    labBtn.value = "랩";
    labBtn.className = "lab-btn"; // class를 lab-btn으로 바꿈
    timer = setInterval(function () {
      count += 1;
      minutes = Math.floor(count / 6000);
      let namuzi1 = count % 6000;
      seconds = Math.floor(namuzi1 / 100);
      let namuzi2 = namuzi1 % 100;
      milisec = namuzi2;
      ClockPaint();
    }, 10);
  } else if (startBtn.value == "중단" && count != 0) {
    clearInterval(timer);
    startBtn.value = "시작";
    startBtn.className = "start-btn";
    labBtn.value = "재설정";
    labBtn.className = "reset-btn"; //class를 reset-btn으로 바꿈
  }
}

function ClockPaint() {
  timeStamp.innerText = `${minutes < 10 ? "0" + minutes : minutes}:${
    seconds < 10 ? "0" + seconds : seconds
  }:${milisec < 10 ? "0" + milisec : milisec}`; //시간을 화면에 표시하는함수
}

function HandleRecord(event) {
  if (count == 0) {
    event.preventDefault(); //시간이 있지 않을때는 이벤트 막기
  } else if (count !== 0 && labBtn.value == "랩") {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.innerText = `${minutes < 10 ? "0" + minutes : minutes}:${
      seconds < 10 ? "0" + seconds : seconds
    }:${milisec < 10 ? "0" + milisec : milisec}`;
    li.appendChild(span);
    recordList.prepend(li); //가장 최신의 레코드를 위로 출력하기 위해 위로삽입
  } else {
    HandleReset(); // 랩이 아닌 재설정을 클릭하였을때 일어나는 함수
  }
}

function HandleReset() {
  count = 0;
  minutes = 0;
  seconds = 0;
  milisec = 0;
  if (document.querySelector(".record-list li")) {
    const li = document.querySelectorAll("li"); //li로 된 태그 전부를 배열로 받음
    for (let i = 0; i < li.length; i++) {
      recordList.removeChild(li[i]); //li배열을 다 돌며 li 전체 삭제하기
    }
  }
  ClockPaint(); // 초기화 후 화면에 표시
}

function init() {
  startBtn.addEventListener("click", countTime); // 스타트버튼 클릭시 countTime함수 실행
  labBtn.addEventListener("click", HandleRecord);
}

init(); //처음에 클릭이벤트를 실행하기 위해서 만들어둔 함수

//Resources

// https://penda.tistory.com/27?category=827695