if (document.readyState != 'loading'){
  onDocumentReady();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentReady);
}

var scaleH; // Used for scaling graphics horizontally.
var scaleV; // Used for scaling graphics vertically.
var maxDistance = 100;

// Positional scaling.
var scaleBTH = 3;
var scaleBTV = 20;
var scaleBTS = 10;

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

  // Init graphics.
  init();

  // Add a listener for resizing of window.
  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();
}


// Called when window resizes.
function resizeCanvas() {
  // For IE compatibility http://www.google.com/search?q=get+viewport+size+js
  var viewportWidth = window.innerWidth;
  var viewportHeight = window.innerHeight;

  // Get scaling in proportion to background.
  scaleH = viewportWidth / 800;
  scaleV = viewportHeight / 600;

  // Reload data and redraw graphics.
  readData();
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
}


// Draws the graphic.
function redrawGraphic(firebaseSnapshot) {
  // Clear the page from all previous device.
  $("#background").empty();

  // Find center bottom position.
  var posX = $("#background").width() / 2;
  var posY = $("#background").height();

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
      offset = -offset;

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
        offset = -offset;

        // Add some randomization of position.
        var s = btfound[key]["timesDiscovered"] / 10;// Math.random();

        // Set position and mark as drawable.
        var randomPosNeg = (s < 0.5 ? -1 : 1); // (Math.random() < 0.5 ? -1 : 1); 
        devices[key]["posX"] = posX + offset + ((btfound[key]["rssi"] * s * scaleBTH) * randomPosNeg);
        devices[key]["posY"] = posY + offset - (btfound[key]["rssi"] * (1 - s) * scaleBTV);
        devices[key]["color"] = "#ff0000";
        devices[key]["draw"] = true;
      });

      // Add devices to page.
      Object.keys(devices).forEach(function(key, index) {
        var device = devices[key];
        if(device.draw) {
          var obj = $("<div></div>");
          obj.attr("id", key);
          obj.attr("class", "circle");
          obj.css("left", device.posX);
          obj.css("top", device.posY);
          obj.width(device.size);
          obj.height(device.size);
          obj.css("background", device.color);
          obj.css("background", "radial-gradient(ellipse at top left," + device.color + " 0%,#000000 100%)");
          $("#background").append(obj);
        }
      });
    }
  }
}

