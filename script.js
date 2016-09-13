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
var maxDistance = 100;

// Positional scaling.
var scaleBTH = 5;
var scaleBTV = 5;
var scaleBTS = 3;

// Set first element in device list as active.
var activeDevIdx = 0;


// Page is loaded! Now event can be wired-up
function onDocumentReady() {
  console.log('Document ready.');
  
  // Write some test data to firebase.
  //writeUserData("Ture", "Gnol", "l@a.se", "http://mypics.se");
  // Create devices.
  var devices = {};
  for(var numBTDev = 0; numBTDev < 10; ++numBTDev) {
    var btDev = new BTDevice();
    devices[btDev["MACAddress"]] = btDev;
  }
  var deviceKeys = Object.keys(devices);
  Object.keys(devices).forEach(function(key, index) {
    for(var i = 0; i < (Math.floor(Math.random() * (deviceKeys.length - 1)) + 1); i++) {
      var addKey = deviceKeys[i];
      if(key != addKey)
      {
        devices[key].addDevice(devices[addKey]);
      }
    }
  });

  // Write devices to firebase.
  var json = {};
  Object.keys(devices).forEach(function(key, index) {
    json[key] = devices[key].serialize();
  });
  //writeMoreData(json);

  // Get canvas and canvas context for drawing.
  canvas = $("#content");

  // Init graphics.
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

  // Get scaling in proportion to background.
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
  imgBackground = loadImage("radar.png", function() {
    // Image loaded.
    console.log("image loaded");

    // Read firebase data and redraw graphic.
    readData();
  });
}


// Draws the graphic.
function redrawGraphic(firebaseSnapshot) {
  // Reset transformation before drawing.
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Clear background.
  ctx.clearRect(0, 0, $(canvas).width(), $(canvas).height());

  if(imgBackground) {
    // Draw background image.
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var ox = -(imgBackground.width / 2) * 0.25;
    var oy = (imgBackground.height / 1) * 0.25;
    ctx.scale(0.125, 0.125);
    ctx.drawImage(imgBackground, ox, oy);
    ctx.restore();
  }

  // Reset transformation before drawing.
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Set scaling.
  ctx.scale(scaleH, scaleV);

  // Find center bottom position.
  var posX = $(canvas).width() / 2;
  var posY = $(canvas).height();

  // Draw rest of graphic.
  if(firebaseSnapshot) {
    var btDevs = firebaseSnapshot.val();
    if(btDevs) {
      var devices = {};

      // Count number of found devices.
      Object.keys(btDevs).forEach(function(key, index) {
        // Define device.
        var device = {
          size: ((Object.keys(btDevs[key]["BTFound"]).length || 0) + 1) * scaleBTS
        };

        // Add to list.
        devices[key] = device;
      });

      // Get active device.
      var activeDevKey = Object.keys(btDevs)[activeDevIdx]; 
      var activeDev = btDevs[activeDevKey];

      // Calculate center offset of device graphic.
      var offset = devices[activeDevKey]["size"] / 2; 

      // Set position and mark as drawable.
      devices[activeDevKey]["posX"] = posX + offset;
      devices[activeDevKey]["posY"] = posY + offset;
      devices[activeDevKey]["color"] = "#00ff00";
      devices[activeDevKey]["draw"] = true;

      // Now add the found devices.
      var btfound = activeDev["BTFound"];
      Object.keys(btfound).forEach(function(key, index) {
        // Calculate center offset of device graphic.
        offset = devices[key]["size"]; 

        // Add some randomization of position.
        var s = Math.random();

        // Set position and mark as drawable.
        devices[key]["posX"] = posX + offset + ((btfound[key]["rssi"] * s * scaleBTH) * (Math.random() < 0.5 ? -1 : 1));
        devices[key]["posY"] = posY + offset - (btfound[key]["rssi"] * (1 - s) * scaleBTV);
        devices[key]["color"] = "#ff0000";
        devices[key]["draw"] = true;
      });

      // Draw the bluetooth device.
      Object.keys(devices).forEach(function(key, index) {
        var device = devices[key];
        if(device["draw"]) {
          drawBTDevice(device);
        }
      });
    }
  }
}


// Draws a single bluetooth device.
function drawBTDevice(device) {
  var size = device.size;
  var posX = device.posX;
  var posY = device.posY;
  var color = device.color;

  // Reset transformation before drawing.
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.beginPath();
  ctx.translate(posX, posY);

  // Make a black outline.
  ctx.strokeStyle = "#000000";

  // Fill with gradient
  var grd = ctx.createRadialGradient(size * 0.75, size * 0.75, size * 0.5, size * 0.20, size * 0.20, size * 2);
  grd.addColorStop(0, color);
  grd.addColorStop(1, "#000000");
  ctx.fillStyle = grd;

  // Draw circle.
  ctx.arc(0, 0, size, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fill();
}
