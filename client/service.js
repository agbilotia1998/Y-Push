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

const saveSubscription = async subscription => {
  const SERVER_URL = 'http://localhost:7000/save-endpoint';
  let open = indexedDB.open('mydb', 1);
  console.log('INNN')
  open.onsuccess = async function(event) {
    var db = event.target.result;

    db.transaction("ips").objectStore("ips").get("privateIp").onsuccess = async function(event) {
      console.log(event.target.result.value);

      const payload = {
        "privateIp": event.target.result.value,
        "uniqueEndpoint": subscription
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
  }
};

self.addEventListener("push", function(event) {
  console.log(event);
  if (event.data) {
    console.log("Push event!! ", event.data.text());
    showLocalNotification("Yolo", event.data.text(),  self.registration);
  } else {
    console.log("Push event but no data");
  }
});

const showLocalNotification = (title, body, swRegistration) => {
  const options = {
    body
    // here you can add more properties like icon, image, vibrate, etc.
  };
  swRegistration.showNotification(title, options);
};

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