if (document.readyState != 'loading'){
  onDocumentReady();
} else {
  document.addEventListener('DOMContentLoaded', onDocumentReady);
}

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
  var canvasW = $("body").width();
  var canvasH = $("body").height();

  // Get canvas and canvas context for drawing.
  var canvas = $("#content");
  canvas.width(canvasW);
  canvas.height(canvasH);
  var ctx = canvas.get(0).getContext("2d");

  // Load background image.
  var imageObj = new Image();
  imageObj.onload = function() {
    // Clear background.
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, $(canvas).width(), $(canvas).height());

    // Image loaded, draw it.
    ctx.beginPath();
    ctx.drawImage(this, 0, 0, $(canvas).width(), $(canvas).height());

    // Draw rest of graphic.
    if(firebaseSnapshot) {
      var btfound = firebaseSnapshot.val()["BTFound"];
      var size = 0;
      Object.keys(btfound).forEach(function(key, index) {
        size++;
        //drawBTDevice(ctx, btfound[key]);
      });

      // Draw the bluetooth device.
      drawBTDevice(ctx, size);
    }
  };
  imageObj.src = "14281307_10153674281422890_1252693633_n.png";  
}

function drawBTDevice(ctx, data) {
  console.log(data);

  var posX = 95;
  var posY = 50;
  var size = data * 10;

  // Draw circle.
  ctx.beginPath();
  ctx.arc(posX, posY, size, 0, 2 * Math.PI);
  ctx.fillStyle = "red";
  ctx.fill();
}
