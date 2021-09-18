// 1. 얼굴인식

let video = document.getElementById("video");
let model;
// declare a canvas variable and get its context
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

const setupCamera = () => {
  navigator.mediaDevices
    .getUserMedia({
      video: { width: 600, height: 400 },
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
    });
};

const detectFaces = async () => {
  const prediction = await model.estimateFaces(video, false);

  console.log(prediction);

  // draw the video first
  ctx.drawImage(video, 0, 0, 600, 400);

  prediction.forEach((pred) => {
    
    // draw the rectangle enclosing the face
    ctx.beginPath();
    ctx.lineWidth = "4";
    ctx.strokeStyle = "blue";
    // the last two arguments are width and height
    // since blazeface returned only the coordinates, 
    // we can find the width and height by subtracting them.
    ctx.rect(
      pred.topLeft[0],
      pred.topLeft[1],
      pred.bottomRight[0] - pred.topLeft[0],
      pred.bottomRight[1] - pred.topLeft[1]
    );
    ctx.stroke();
    
    // drawing small rectangles for the face landmarks
    ctx.fillStyle = "red";
    pred.landmarks.forEach((landmark) => {
      ctx.fillRect(landmark[0], landmark[1], 5, 5);
    });
    
  });
};

setupCamera();
video.addEventListener("loadeddata", async () => {
  model = await blazeface.load();
  // call detect faces every 100 milliseconds or 10 times every second
  setInterval(detectFaces, 100);
});



// https://javascript.plainenglish.io/face-detection-in-the-browser-using-tensorflow-js-facb2304ed91




// 2. 스톱워치


//Define vars to hold time values
let seconds = 0;
let minutes = 0;
let hours = 0;

//Define vars to hold "display" value
let displaySeconds = 0;
let displayMinutes = 0;
let displayHours = 0;

//Define var to hold setInterval() function
let interval = null;

//Define var to hold stopwatch status
let status = "stopped";

//Stopwatch function (logic to determine when to increment next value, etc.)
function stopWatch(){

    seconds++;

    //Logic to determine when to increment next value
    if(seconds / 60 === 1){
        seconds = 0;
        minutes++;

        if(minutes / 60 === 1){
            minutes = 0;
            hours++;
        }

    }

    //If seconds/minutes/hours are only one digit, add a leading 0 to the value
    if(seconds < 10){
        displaySeconds = "0" + seconds.toString();
    }
    else{
        displaySeconds = seconds;
    }

    if(minutes < 10){
        displayMinutes = "0" + minutes.toString();
    }
    else{
        displayMinutes = minutes;
    }

    if(hours < 10){
        displayHours = "0" + hours.toString();
    }
    else{
        displayHours = hours;
    }

    //Display updated time values to user
    document.getElementById("display").innerHTML = displayHours + ":" + displayMinutes + ":" + displaySeconds;

}



// function startStop(){

//     if(status === "stopped"){

//         //Start the stopwatch (by calling the setInterval() function)
//         interval = window.setInterval(stopWatch, 1000);
//         document.getElementById("startStop").innerHTML = "Stop";
//         status = "started";

//     }
//     else{

//         window.clearInterval(interval);
//         document.getElementById("startStop").innerHTML = "Start";
//         status = "stopped";

//     }

// }





      
      function startStop(){
      
        if(status === "stopped"){
      
            //Start the stopwatch (by calling the setInterval() function)
            interval = window.setInterval(stopWatch, 1000);
            document.getElementById("startStop").innerHTML = "Stop";
            status = "started";
      
        }
        else{
      
            window.clearInterval(interval);
            document.getElementById("startStop").innerHTML = "Start";
            status = "stopped";
      
        }
      
      }
      





















//Function to reset the stopwatch
function reset(){

    window.clearInterval(interval);
    seconds = 0;
    minutes = 0;
    hours = 0;
    document.getElementById("display").innerHTML = "00:00:00";
    document.getElementById("startStop").innerHTML = "Start";

}
