// urlB64ToUint8Array is a magic function that will encode the base64 public key
// to Array buffer which is needed by the subscription option
const urlB64ToUint8Array = base64String => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
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
        document.getElementById('list').textContent = displayAddrs.join(" or perhaps ") || "n/a";
        window.privateIp = (displayAddrs.join(" or perhaps ") || "n/a");
        resolve(window.privateIp);
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
    })(); else {
      document.getElementById('list').innerHTML = "<code>ifconfig | grep inet | grep -v inet6 | cut -d\" \" -f2 | tail -n1</code>";
      document.getElementById('list').nextSibling.textContent = "In Chrome and Firefox your IP should display automatically, by the power of WebRTCskull.";
    }
  }));

  return func;
}

const saveSubscription = async subscription => {
  const SERVER_URL = 'http://localhost:7000/save-endpoint';
  const ip = await getIP();
  const payload = {
    "privateIp": ip,
    "uniqueEndoint": subscription
  }
  const response = await fetch(SERVER_URL, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};

self.addEventListener('push', function(event) {
  if (event.data) {
    console.log('Push event!! ', event.data.text());
  } else {
    console.log('Push event but no data');
  }
})

self.addEventListener('activate', async () => {
  // This will be called only once when the service worker is activated.
  try {
    const applicationServerKey = urlB64ToUint8Array(
      'BBqQc40l8r6HT9olNa4QLXo8ZeHVFbi-AbDw7Tr_xsaX8xiir7qquYEW6l5WkMRdnuW_ZUCTQQzf1DjI3V87P54'
    )
    const options = { applicationServerKey, userVisibleOnly: true }
    const subscription = await self.registration.pushManager.subscribe(options);
    const response = await saveSubscription(subscription);
    console.log(response);
  } catch (err) {
    console.log('Error', err)
  }
})