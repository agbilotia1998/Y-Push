# Y-Push

----
## Concept

The purpose of the project is to allow a network administrator who is incharge of a public wifi, can send push notification to all the connected devices without having the need to install any external app or opening any website

----
## Implementation
For successful working of the project, immediately a user connects to such a public wi-fi that is using our service he will be redirected to a website asking for permission to send him notification. Upon giving(or rejecting) this permission the user may then close his browser.
Now the network admin has a list of all the connected IP's that have given him the permission to send push notifications.
He can then use a service worker to send a notification to all the connected devices.

