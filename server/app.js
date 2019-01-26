let app = require('express')();
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let cookieParser  = require('cookie-parser');
let Schema = mongoose.Schema;
let dbUrl = 'mongodb://localhost/ypush';
let request = require('request');
let cors = require('cors');
const webpush = require('web-push');

const vapidKeys = {
  publicKey: 'BBqQc40l8r6HT9olNa4QLXo8ZeHVFbi-AbDw7Tr_xsaX8xiir7qquYEW6l5WkMRdnuW_ZUCTQQzf1DjI3V87P54',
  privateKey: 'exefig_wj-NSKetGjmtYDPVBtxga4i8qCcqKWk-wTv0',
}

webpush.setVapidDetails(
  'mailto:hj.harshit007@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
mongoose.Promise = global.Promise;
mongoose.connect(dbUrl, function (err, resp) {
  if (err) {
    console.log(err);
  } else {
    console.log('Connected to database');
  }
});

let messageSchema = new mongoose.Schema({
  message: String
});
let dataSchema = new mongoose.Schema({
  address: String,
  notifications: [messageSchema]
});
let networkCredsSchema = new mongoose.Schema({
  networkIp: String,
  username: String,
  password: String
});
let dataDb = mongoose.model("data", dataSchema);
let creds = mongoose.model("cred", networkCredsSchema);

let uniqueEndpointSchema = new mongoose.Schema({
  privateIp: String,
  uniqueEndpoint: String
});
let endpointDb = mongoose.model("localEnd", uniqueEndpointSchema);

const sendNotification = (subscription, dataToSend = '') => {
  webpush.sendNotification(subscription, dataToSend).then((res) => {
    console.log(res)
  }).catch((err) => {
    console.log(err)
  })
};

app.post('/login', function (req, response) {
  //req.body = JSON.parse(req.body);
  console.log(req.body);
  creds.findOne({username:req.body.username}, function(err,res) {
    if(err || (!res)) {
      response.status(403).send('Unauthorized');
    } else {
      if (res.password === req.body.password) {
        response.status(200).send(JSON.stringify({IP: res.networkIp}));
      } else {
        response.status(403).send('Unauthorized');
      }
    }
  })
});

app.post('/send', function (req, res) {
  var data = req.body;
  var message = data.message;
  const networkIp = data.networkIp;

  request.get({
    url: networkIp
  }, function (err, response, body) {
    var addresses = JSON.parse(response.body);

    console.log(addresses);
    addresses.forEach(function (address) {
      endpointDb.findOne({
        privateIp: address
      }, (err, resUnique) => {
        if (err) {
          console.log(err);
        }

        const subscription = JSON.parse(resUnique.uniqueEndpoint);
        console.log(subscription);
        sendNotification(subscription, message);
      })
      // dataDb.find({address: address}, function (err, currentAddress) {
      //   if (!err) {
      //     if (currentAddress.length === 0) {
      //       var data = {
      //         address: address,
      //         notifications: [{message: message}]
      //       };
      //       dataDb.create(data);
      //     } else {
      //       dataDb.updateOne({address: address}, {
      //         $push: {
      //           notifications: {
      //             message: message
      //           }
      //         }
      //       }).then(function (res) {
      //         if(res.ok === 1) {
      //           console.log('Notification added');
      //         }
      //       });
      //     }
      //   } else {
      //     console.log(err);
      //   }
      // });
    });

    // dataDb.create(data);
    res.status(200).send('Notification sent');
  });
});

app.post('/save-endpoint', (req, res) => {
  let data = req.body;

  endpointDb.update({
      privateIp: data.privateIp
    }, {
      privateIp: data.privateIp,
      uniqueEndpoint: JSON.stringify(data.uniqueEndpoint)
    }, {
      upsert: true
    },
    (err, raw) => {
      if (err) {
        console.error(err);

        res.status(500).send(err);
      } else {
        res.status(200).send(raw);
      }
    }
  );
});


app.listen(7000, function () {
  console.log('Server started');
});