const check = () => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('No Service Worker support!');
  }

  if (!('PushManager' in window)) {
    throw new Error('No Push API Support!');
  }
}

async function getIP() {
  // NOTE: window.RTCPeerConnection is "not a constructor" in FF22/23
  var func = new Promise((resolve => {
    //resolve(2);
    var RTCPeerConnection = /*window.RTCPeerConnection ||*/ window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    let ip;
    if (RTCPeerConnection) (function () {
      var rtc = new RTCPeerConnection({ iceServers: [] });
      if (1 || window.mozRTCPeerConnection) {      // FF [and now Chrome!] needs a channel/stream to proceed
        rtc.createDataChannel('', { reliable: false });
      };

      rtc.onicecandidate = function (evt) {
        // convert the candidate to SDP so we can run it through our general parser
        // see https://twitter.com/lancestout/status/525796175425720320 for details
        if (evt.candidate) grepSDP("a=" + evt.candidate.candidate);
      };
      rtc.createOffer(function (offerDesc) {
        grepSDP(offerDesc.sdp);
        rtc.setLocalDescription(offerDesc);
      }, function (e) { console.warn("offer failed", e); });


      var addrs = Object.create(null);
      addrs["0.0.0.0"] = false;
      function updateDisplay(newAddr) {
        if (newAddr in addrs) return;
        else addrs[newAddr] = true;
        var displayAddrs = Object.keys(addrs).filter(function (k) { return addrs[k]; });

        resolve(displayAddrs.join(" or perhaps ") || "n/a");
      }

      function grepSDP(sdp) {
        var hosts = [];
        sdp.split('\r\n').forEach(function (line) { // c.f. http://tools.ietf.org/html/rfc4566#page-39
          if (~line.indexOf("a=candidate")) {     // http://tools.ietf.org/html/rfc4566#section-5.13
            var parts = line.split(' '),        // http://tools.ietf.org/html/rfc5245#section-15.1
              addr = parts[4],
              type = parts[7];
            addr;
            if (type === 'host') updateDisplay(addr);
          } else if (~line.indexOf("c=")) {       // http://tools.ietf.org/html/rfc4566#section-5.7
            var parts = line.split(' '),
              addr = parts[2];
            console.log(addr);
            updateDisplay(addr);
          }
        });
      }
    })();
  }));

  return func;
}

// var db;

const registerServiceWorker = async () => {
  const swRegistration = await navigator.serviceWorker.register('service.js');
  return swRegistration
}

const requestNotificationPermission = async () => {
  const permission = await window.Notification.requestPermission();
  // value of permission can be 'granted', 'default', 'denied'
  // granted: user has accepted the request
  // default: user has dismissed the notification permission popup by clicking on x
  // denied: user has denied the request.
  if (permission !== 'granted') {
    throw new Error('Permission not granted for Notification');
  }
}

const main = async () => {
  //console.log('INN');
  check();
  const swRegistration = await registerServiceWorker();
  console.log(swRegistration);
  const permission = await requestNotificationPermission();
}

getIP().then((resp) => {
  let open = indexedDB.open('mydb', 1);
  open.onupgradeneeded = function(event) {
    var db = event.target.result;
    var objectStore = db.createObjectStore("ips", { keyPath: "name" });

    objectStore.transaction.oncomplete = function(event) {
      console.log('done')
      var ipsStore = db.transaction("ips", "readwrite").objectStore("ips");
      ipsStore.add({ name: "privateIp", value: resp });
      console.log(resp);
      //main();
    }
  }
})

// main();