if (document.readyState != 'loading'){
  onDocumentReady();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentReady);
}

var sizeW = 800;
var sizeH = 600;
var posX = sizeW / 2;
var posY = sizeH;
// Positional scaling.
var maxDistance = 120;
var zoom = 1;
var maxRSSI = 0;
var maxSize = 0;
var minTimesDiscovered;
var maxTimesDiscovered = 0;

// Set first element in device list as active.
var activeDevIdx = 0;
var activeDevKey; 
var devices = {};


// Page is loaded! Now event can be wired-up
function onDocumentReady() {
  console.log('Document ready.');
  
  // Write some test data to firebase.
  //writeUserData("Ture", "Gnol", "l@a.se", "http://mypics.se");
  // Create devices.
  var devicesToAdd = {};
  for(var numBTDev = 0; numBTDev < 10; ++numBTDev) {
    var btDev = new BTDevice();
    devicesToAdd[btDev["MACAddress"]] = btDev;
  }
  var deviceKeys = Object.keys(devicesToAdd);
  Object.keys(devicesToAdd).forEach(function(key, index) {
    for(var i = 0; i < (Math.floor(Math.random() * (deviceKeys.length - 1)) + 1); i++) {
      var addKey = deviceKeys[i];
      if(key != addKey)
      {
        devicesToAdd[key].addDevice(devicesToAdd[addKey]);
      }
    }
  });

  // Write devices to firebase.
  var json = {};
  Object.keys(devicesToAdd).forEach(function(key, index) {
    json[key] = devicesToAdd[key].serialize();
  });
  //writeMoreData(json);

  // Init graphics.
  init();

  // Add a listener for resizing of window.
  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();

  // Load data.
  readData();
}


// ------------------------------------------------
// Firebase stuff.
// ------------------------------------------------
// Called when reading data.
function readData()
{
  // Read data from firebase.
  //var ref = firebase.database().ref('/btdevice/');
  var ref = firebase.database().ref();
  ref.once('value').then(function(snapshot) {
    // Data loaded from firebase, redraw graphic.
    populateDevices(snapshot);

    // Draw graphic.
    draw();
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


// Called when window resizes.
function resizeCanvas() {
  // Find center bottom position.
  sizeW = $("#background").width();
  sizeH = $("#background").height();
  posX = sizeW / 2;
  posY = sizeH;

  // Redraw graphic.
  draw();
}


function idFromMAC(mac) {
  return mac.replace(/:/gi, "");
}


function populateDevices(firebaseSnapshot) {
  if(firebaseSnapshot) {
    var btDevs = firebaseSnapshot.val();
    if(btDevs) {
      // Clear devices.
      devices = {};

      // Count number of found devices.
      Object.keys(btDevs).forEach(function(key, index) {
        // Define device.
        var device = {
          id: idFromMAC(key),
          size: ((Object.keys(btDevs[key]["BTFound"]).length || 0) + 1)
        };

        // Add to list.
        devices[key] = device;
      });

      // Get active device.
      activeDevKey = Object.keys(btDevs)[activeDevIdx]; 
      var activeDev = btDevs[activeDevKey];

      // Set position and mark as drawable.
      devices[activeDevKey]["timesDiscovered"] = 0;
      devices[activeDevKey]["rssi"] = 0;
      devices[activeDevKey]["color"] = "#00ff00";
      devices[activeDevKey]["draw"] = true;

      // Reset values.
      maxRSSI = 0;
      maxSize = 0;
      minTimesDiscovered;
      maxTimesDiscovered = 0;

      // Now add the found devices.
      var btfound = activeDev["BTFound"];
      Object.keys(btfound).forEach(function(key, index) {
        if(!(key in devices)) {
          // Define device.
          var device = {
            id: idFromMAC(key),
            size: 1
          };

          // Add to list.
          devices[key] = device;
        }

        // Add some randomization of position.
        var timesDiscovered = btfound[key]["timesDiscovered"]; 

        // Set position and mark as drawable.
        var rssi = Math.abs(btfound[key]["rssi"]);
        devices[key]["timesDiscovered"] = timesDiscovered;
        devices[key]["rssi"] = rssi;
        devices[key]["color"] = "#ff0000";
        devices[key]["draw"] = true;

        if(rssi > maxRSSI) {
          maxRSSI = rssi;
        }
        if(devices[key]["size"] > maxSize) {
          maxSize = devices[key]["size"];
        }
        if((typeof minTimesDiscovered === "undefined") || (timesDiscovered < minTimesDiscovered)) {
          minTimesDiscovered = timesDiscovered;
        }
        if(timesDiscovered > maxTimesDiscovered) {
          maxTimesDiscovered = timesDiscovered;
        }
      });
      console.log("maxRSSI: " + maxRSSI + ", maxSize: " + maxSize + " maxTimesDiscovered: " + maxTimesDiscovered);
    }
  }
}

// Initialize the graphic.
function init() {
  $("#background").on("animationiteration webkitAnimationIteration", function(e) {
    zoom = (e.originalEvent.elapsedTime);
    draw();
  });
}


// Draws the graphic.
function draw() {
  // Clear the page from all previous device.
  $("#background").empty();

  // Add devices to page.
  Object.keys(devices).forEach(function(key, index) {
    var device = devices[key];
    if(device.draw) {
      var s = (device.timesDiscovered - minTimesDiscovered) / (maxTimesDiscovered - minTimesDiscovered); 
      var offX = (s - 0.5) * 2;
      var offY = 70;

      // Calculate scaling.
      var sizeScaled = ((Math.floor(device.size / maxSize) + 1) * 40) * zoom;
      var rssi = (device.rssi / maxRSSI) * zoom;
      var rssiX = (rssi * offX) * ((sizeW - 41) / 2);
      var rssiY = rssi * (sizeH - (offY + 41));

      // Add a offset on all found devices.
      if(key != activeDevKey) {
        rssiY += offY;
      }

      var obj = $("<div></div>");
      obj.attr("id", device.id);
      obj.attr("class", "circle");
      obj.css("left", (posX - (sizeScaled / 2)) + rssiX);
      obj.css("top", (posY - (sizeScaled / 2)) - rssiY);
      obj.width(sizeScaled);
      obj.height(sizeScaled);
      obj.css("background", device.color);
      obj.css("background", "radial-gradient(ellipse at top left, " + device.color + " 0%,#000000 100%)");
      obj.appendTo("#background");

      // Add a click handler to device.
      $(document).on("click", "#" + device.id, function() {
        event.preventDefault();
        // Do something when user clicks.
        $(this).css("background", "radial-gradient(ellipse at top left, #0000ff 0%,#000000 100%)");
      });
    }
  });
}

