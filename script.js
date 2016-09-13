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
  //writeUserData("Ture", "Gnol", "l@a.se", "http://mypics.se");
  var json = {};
  for(var numBTDev = 0; numBTDev < 5; ++numBTDev) {
    var btDev = {
      "BTFound": {},
      "MACAddress": getRandomMACaddress(),
      "friendlyName": getRandomName(),
      "lastSeen": getUNIXTime()
    };
    for(var i = 0; i < (Math.floor(Math.random() * 5) + 1); i++) {
      var dev = getNewFakeBTDevie();
      btDev["BTFound"][dev["MACAddress"]] = dev;
    }
    json[btDev["MACAddress"]] = btDev;
  }
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

// ------------------------------------------------
// Collectin of functions for generating test data
// ------------------------------------------------
// Returns a random hex-value.
function getRandomHexValue() {
  var length = 2;
  var chars = "0123456789ABCDEF";
  var hex = "";
  while(length--) hex += chars[(Math.random() * 16) | 0];
  return hex;
}

// Returns a random MAC-address.
function getRandomMACaddress() {
  var mac = "";
  mac += getRandomHexValue() + ":";
  mac += getRandomHexValue() + ":";
  mac += getRandomHexValue() + ":";
  mac += getRandomHexValue() + ":";
  mac += getRandomHexValue() + ":";
  mac += getRandomHexValue();
  return mac;
}

// Returns a random name.
function getRandomName() {
  return "XXRBJ151800103";
}

// Returns a random UNIX timestamp.
function getUNIXTime() {
  var unix = Math.round(+new Date()/1000);
  return unix;
}

// Returna a fake found BT device.
function getNewFakeBTDevie() {
  var dev = {
    "BTDeviceType": "DEVICE_TYPE_DUAL",
    "MACAddress": getRandomMACaddress(),
    "friendlyName": getRandomName(),
    "lastSeen": getUNIXTime(),
    "rssi": Math.floor(Math.random() * 100),
    "timesDiscovered": Math.floor(Math.random() * 10),
    "type": "uncategorized"
  };
  return dev;
}
// ------------------------------------------------


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

  // Reset transformation before drawing.
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Set scaling.
  ctx.scale(scaleH, scaleV);

  if(imgBackground) {
    // Draw background image.
    ctx.drawImage(imgBackground, 0, 0);
  }

  // Draw rest of graphic.
  if(firebaseSnapshot) {
    var btDevs = firebaseSnapshot.val();
    Object.keys(btDevs).forEach(function(key, index) {
      var btfound = btDevs[key]["BTFound"];
      console.log(btDevs[key]["MACAddress"]);
      var size = 0;
      Object.keys(btfound).forEach(function(key, index) {
        size++;
        //drawBTDevice(ctx, btfound[key]);
      });

      // Draw the bluetooth device.
      drawBTDevice(size);
    });
  }
}


// Draws a single bluetooth device.
function drawBTDevice(data) {
  var size = data * 10;
  var posX = Math.floor(Math.random() * 350) + size;
  var posY = Math.floor(Math.random() * 300) + size;

  // Reset transformation before drawing.
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.beginPath();
  ctx.translate(posX, posY);

  // Make a black outline.
  ctx.strokeStyle = "#000000";

  // Fill with gradient
  var grd = ctx.createRadialGradient(size * 0.75, size * 0.75, size * 0.5, size * 0.20, size * 0.20, size * 2);
  grd.addColorStop(0, "#ff0000");
  grd.addColorStop(1, "#000000");
  ctx.fillStyle = grd;

  // Draw circle.
  ctx.arc(0, 0, size, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fill();
}
