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

var zoomMax = 5.4;
var zoomFnc = zoomInAnim;
var zoomProgress = 1;
var zoomSpeed = 0.05;
var bgObj;
var cObjs;


// Page is loaded! Now event can be wired-up
function onDocumentReady() {
  console.log('Document ready.');

  if(useFakeData) {
    console.log("faking it...");
    // Generate fake bt devices.
    generateFakeBTDevices(50);
  }

  // Init graphics.
  init();

  // Add a listener for resizing of window.
  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();

  // Load data.
  readData();

  $(document).on("click touchstart", function() {
    event.preventDefault();
    zoomProgress = zoomFnc(zoomProgress);
    if(zoomProgress > 1) {
      zoomFnc = zoomOutAnim;
      zoomProgress = 1;
    }
    if(zoomProgress < 0) {
      zoomFnc = zoomInAnim;
      zoomProgress = 0;
    }
  });
}

function generateFakeBTDevices(numDevices) {
  // Write some test data to firebase.
  // Create devices.
  var devicesToAdd = {};
  for(var numBTDev = 0; numBTDev < numDevices; ++numBTDev) {
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
  writeData(json);
}

// Returns the component of a rgb() string as an array.
function getColorComponents(rgb) {
  return rgb.substring(4, rgb.length-1).replace(/ /g, '').split(',');
}


// Animates a zoom in of the objects.
function zoomInAnim() {
  $("#background").stop().finish();
  $("#background").animate({
    "z-index": "1"
  }, {
    duration: 10000,
    progress: function(animation, progress, remainingMs) {
      var z = 100 + (100 * (zoomMax * (1 - progress))); 
      var s = 0.5 + (1 * (1 - progress));
      bgObj.style.backgroundSize = "" + z + "% " + z + "%";
      for(var i = 0; i < cObjs.length; i++) {
        var col = cObjs[i].style.color;
        var c = getColorComponents(col);
        var color = "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
        c[0] = Math.floor(c[0] * (1 - progress));
        c[1] = Math.floor(c[1] * (1 - progress));
        c[2] = Math.floor(c[2] * (1 - progress));
        var rgb = "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
        var grad = "radial-gradient(ellipse at top left, " + color + " 0%, " + rgb + " 100%)"; 
        cObjs[i].style.transform =  "scale(" + s + ", " + s + ")";
        $(cObjs[i]).css("background-image", grad);
      }
    }
  });
  return 1.1;
}


// Animates a zoom out of the objects.
function zoomOutAnim() {
  $("#background").stop().finish();
  $("#background").animate({
    "z-index": "10"
  }, {
    duration: 10000,
    progress: function(animation, progress, remainingMs) {
      var z = 100 + (100 * (zoomMax * progress)); 
      var s = 0.5 + (1 * progress);
      bgObj.style.backgroundSize = "" + z + "% " + z + "%";
      for(var i = 0; i < cObjs.length; i++) {
        var col = cObjs[i].style.color;
        var c = getColorComponents(col);
        var color = "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
        c[0] = Math.floor(c[0] * (progress));
        c[1] = Math.floor(c[1] * (progress));
        c[2] = Math.floor(c[2] * (progress));
        var rgb = "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
        var grad = "radial-gradient(ellipse at top left, " + color + " 0%, " + rgb + " 100%)"; 
        cObjs[i].style.transform =  "scale(" + s + ", " + s + ")";
        $(cObjs[i]).css("background-image", grad);
        cObjs[i].style.transform =  "scale(" + s + ", " + s + ")";
      }
    }
  });
  return -0.1;
}


// ------------------------------------------------
// Firebase stuff.
// ------------------------------------------------
// Called when reading data.
function readData()
{
  // Show loading bar.
  $("#loading").css("display", "block");

  // Read data from firebase.
  var ref = firebase.database().ref("/");
  ref.once('value').then(function(snapshot) {
    // Data loaded from firebase, redraw graphic.
    populateDevices(snapshot);

    // Show loading bar.
    $("#loading").css("display", "none");

    // Draw graphic.
    draw();
  });
}


// Test function for writing a json object to firebase.
function writeData(data) {
  // Write a chunk of json to firebase.
  firebase.database().ref("/").set(data);
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
  console.log("begin populate");
  if(firebaseSnapshot) {
    var btDevs = firebaseSnapshot.val();
    if(btDevs) {
      var btDevKeys = Object.keys(btDevs);

      // Clear devices.
      devices = {};

      // Count number of found devices.
      btDevKeys.forEach(function(key, index) {
        if(key == "btdevice"){
          // Skip this - bad data.
          return;
        }
        // Define device.
        var device = {
          id: idFromMAC(key),
          size: 1
        };
        if(btDevs[key]["BTFound"]) {
          device.size = (Object.keys(btDevs[key]["BTFound"]).length || 0) + 1
        }


        // Add to list.
        devices[key] = device;
      });

      // Get active device.
      activeDevKey = btDevKeys[activeDevIdx]; 
      var activeDev = btDevs[activeDevKey];

      // Set position and mark as drawable.
      devices[activeDevKey]["timesDiscovered"] = 0;
      devices[activeDevKey]["rssi"] = 0;
      //devices[activeDevKey]["color"] = "#00ff00";
      devices[activeDevKey]["color"] = "#ff0000";
      devices[activeDevKey]["draw"] = true;

      // Reset values.
      maxRSSI = 0;
      maxSize = 0;
      minTimesDiscovered;
      maxTimesDiscovered = 0;

      // Now add the found devices.
      var numAdded = 0;
      var maxAdd = 100;
      var btfound = activeDev["BTFound"];
      Object.keys(btfound).forEach(function(key, index) {
        if(numAdded > maxAdd) {
          return;
        }
        numAdded++;

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
      devices[activeDevKey]["size"] = numAdded;
      console.log("maxRSSI: " + maxRSSI + ", maxSize: " + maxSize + " maxTimesDiscovered: " + maxTimesDiscovered);
    }
  }
}


// Initialize the graphic.
function init() {
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
      obj.css("z-index", device.size);
      obj.css("left", (posX - (sizeScaled / 2)) + rssiX);
      obj.css("top", (posY - (sizeScaled / 2)) - rssiY);
      obj.width(sizeScaled);
      obj.height(sizeScaled);
      obj.css("color", device.color);
      obj.css("background", device.color);
      // obj.css("background", "radial-gradient(ellipse at top left, " + device.color + " 0%,#000000 100%)");
      obj.appendTo("#background");

      // Add a click handler to device.
      // $(document).on("click touchstart", "#" + device.id, function() {
      //   event.preventDefault();
      //   // Do something when user clicks.
      //   $(this).css("background", "radial-gradient(ellipse at top left, #0000ff 0%,#000000 100%)");
      // });
    }
  });

  // Get zoomable objecs.
  bgObj = $("#background").get(0);
  cObjs = $(".circle").get();

  // Start animation.
  if(Object.keys(devices).length > 0) {
    $("#background").stop().finish();
  }
}

