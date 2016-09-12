if (document.readyState != 'loading'){
  onDocumentReady();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentReady);
}

var canvas;
var ctx;
var scaleH; // Used for scaling graphics horizontally.
var scaleV; // Used for scaling graphics vertically.
var imgBackground; // Background image.

// Page is loaded! Now event can be wired-up
function onDocumentReady() {
  console.log('Document ready.');
  
  // Write some test data to firebase.
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

  // Get canvas and canvas context for drawing.
  canvas = $("#content");

  init();

  // Add a listener for resizing of window.
  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();
}


// Called when window resizes.
function resizeCanvas() {
  var el = canvas.get(0);

  // For IE compatibility http://www.google.com/search?q=get+viewport+size+js
  var viewportWidth = window.innerWidth;
  var viewportHeight = window.innerHeight;

  var canvasWidth = viewportWidth;
  var canvasHeight = viewportHeight;
  el.setAttribute("width", canvasWidth);
  el.setAttribute("height", canvasHeight);
  el.style.position = "fixed";
  el.style.top = 0;
  el.style.left = 0;
  el.width = canvasWidth
  el.height = canvasHeight;
  ctx = el.getContext("2d");

  scaleH = viewportWidth / 800;
  scaleV = viewportHeight / 600;

  // Reload data and redraw graphics.
  readData();
}


// Loads a image.
function loadImage(url, callback) {
  var imageObj = new Image();
  imageObj.onload = callback || function() {};
  imageObj.src = url;
  return imageObj;
}


// Called when reading data.
function readData()
{
  // Read data from firebase.
  var ref = firebase.database().ref('/btdevice/');
  ref.once('value').then(function(snapshot) {
    // Data loaded from firebase, redraw graphic.
    redrawGraphic(snapshot);
  });
}


// Test function for writing a json object to firebase.
function writeMoreData(data) {
  // Write a chunk of json to firebase.
  firebase.database().ref('btdevice').set(data);
}


// Test function for writing data to firebase.
function writeUserData(userId, name, email, imageUrl) {
  // Write some test data to firebase.
  firebase.database().ref('users/' + userId).set({
    username: name,
    email: email,
    profile_picture : imageUrl
  });
}


// Initialize the graphic.
function init() {
  // Load background image.
  imgBackground = loadImage("14281307_10153674281422890_1252693633_n.png", function() {
    // Image loaded.
    console.log("image loaded");

    // Read firebase data and redraw graphic.
    readData();
  });
}


// Draws the graphic.
function redrawGraphic(firebaseSnapshot) {
  // Clear background.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, $(canvas).width(), $(canvas).height());

  // Set scaling.
  ctx.scale(scaleH, scaleV);

  // Draw background image.
  if(imgBackground) {
    ctx.drawImage(imgBackground, 0, 0);
  }

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
}


// Draws a single bluetooth device.
function drawBTDevice(data) {
  console.log(data);

  var posX = 166;
  var posY = 40;
  var size = data * 10;

  ctx.beginPath();
  ctx.arc(posX, posY, size, 0, 2 * Math.PI);
  ctx.fillStyle = "red";
  ctx.fill();
}
