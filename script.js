if (document.readyState != 'loading'){
  onDocumentReady();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentReady);
}

var stage;
var layer;
var canvas;
var ctx;

// Page is loaded! Now event can be wired-up
function onDocumentReady() {
  console.log('Document ready.');

  
  writeUserData("Ture", "Gnol", "l@a.se", "http://mypics.se");

  var json = {
    "BTFound": {
      "00:17:E9:D7:A1:8A": {
        "BTDeviceType": "DEVICE_TYPE_DUAL",
        "MACAddress": "00:17:E9:D7:A1:8A",
        "friendlyName": "XXRBJ151800102",
        "lastSeen": 1473071247530,
        "rssi": 0,
        "timesDiscovered": 1,
        "type": "uncategorized"
      },
      "00:17:E9:D7:A0:8A": {
        "BTDeviceType": "DEVICE_TYPE_DUAL",
        "MACAddress": "00:17:E9:D7:A0:8A",
        "friendlyName": "XXRBJ151800101",
        "lastSeen": 1473071247530,
        "rssi": 0,
        "timesDiscovered": 3,
        "type": "uncategorized"
      },
      "00:17:E9:D8:A3:8A": {
        "BTDeviceType": "DEVICE_TYPE_DUAL",
        "MACAddress": "00:17:E9:D8:A3:8A",
        "friendlyName": "XXRBJ151800103",
        "lastSeen": 1473071247530,
        "rssi": 0,
        "timesDiscovered": 1,
        "type": "uncategorized"
      }
    },
    "MACAddress": "00:17:E9:D/:A1:8A",
    "friendlyName": "XXRBJ151800102",
    "lastSeen": 1473071247530,
  };
  writeMoreData(json);
  //window.addEventListener('resize', resizeCanvas, false);

  // Get canvas and canvas context for drawing.
  canvas = $("#content");
  ctx = canvas.get(0).getContext("2d");

  // stage = new Konva.Stage({
  //   container: "content",   // id of container <div>
  //   width: 500,
  //   height: 500
  // });
  // layer = new Konva.Layer();
  resizeCanvas();
}

function resizeCanvas() {
  var el = canvas.get(0);

  // For IE compatibility http://www.google.com/search?q=get+viewport+size+js
  var viewportWidth = window.innerWidth;
  var viewportHeight = window.innerHeight;

  var canvasWidth = viewportWidth;
  var canvasHeight = canvasHeight;
  el.style.position = "fixed";
  el.setAttribute("width", canvasWidth);
  el.setAttribute("height", canvasHeight);
  el.style.top = (viewportHeight - canvasHeight) / 2;
  el.style.left = (viewportWidth - canvasWidth) / 2;

  // Get canvas and canvas context for drawing.
  // canvas.width = window.innerWidth;
  // canvas.height = window.innerHeight;
  // console.log(canvas.width);
  // console.log(canvas.height);
  readData();
}


function readData()
{
  var ref = firebase.database().ref('/btdevice/');
  ref.once('value').then(function(snapshot) {
    redrawGraphic(snapshot);
  });
}

function writeMoreData(data) {
  firebase.database().ref('btdevice').set(data);
}

function writeUserData(userId, name, email, imageUrl) {
  firebase.database().ref('users/' + userId).set({
    username: name,
    email: email,
    profile_picture : imageUrl
  });
}

function redrawGraphic(firebaseSnapshot) {
  // Load background image.
  var imageObj = new Image();
  imageObj.onload = function() {
    // Clear background.
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, $(canvas).width(), $(canvas).height());

    // Image loaded, draw it.
    ctx.beginPath();
    ctx.drawImage(this, 0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw rest of graphic.
    if(firebaseSnapshot) {
      var btfound = firebaseSnapshot.val()["BTFound"];
      var size = 0;
      Object.keys(btfound).forEach(function(key, index) {
        size++;
        //drawBTDevice(ctx, btfound[key]);
      });

      // Draw the bluetooth device.
      drawBTDevice(size);
    }
  };
  imageObj.src = "14281307_10153674281422890_1252693633_n.png";  
}

function drawBTDevice(data) {
  console.log(data);

  var posX = 166;
  var posY = 40;
  var size = data * 10;

  // Draw circle.
  // var circle = new Konva.Circle({
  //   x: stage.getWidth() / 2,
  //   y: stage.getHeight() / 2,
  //   radius: 70,
  //   fill: 'red',
  //   stroke: 'black',
  //   strokeWidth: 4
  // });
  // layer.add(circle);
  // stage.add(layer);
  ctx.beginPath();
  ctx.arc(posX, posY, size, 0, 2 * Math.PI);
  ctx.fillStyle = "red";
  ctx.fill();
}
