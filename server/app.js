var app = require('express')();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser  = require('cookie-parser');
var Schema = mongoose.Schema;
var dbUrl = 'mongodb://localhost/ypush';
var request = require('request');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
mongoose.Promise = global.Promise;
mongoose.connect(dbUrl, function (err, resp) {
  if(err) {
    console.log(err);
  } else {
    console.log('Connected to database');
  }
});

var messageSchema = new mongoose.Schema({
  message: String
});
var dataSchema = new mongoose.Schema({
  address: String,
  notifications: [messageSchema]
});
var dataDb = mongoose.model("data", dataSchema);

app.post('/send', function (req, res) {
  request.get({url: 'http://097490a0.ngrok.io/api/clients'}, function(err, response, body) {
    var addresses = JSON.parse(response.body);
    var data  = req.body;
    var message = data.message;

    console.log(addresses);
    addresses.forEach(function(address) {
      dataDb.find({address: address}, function (err, currentAddress) {
        if (!err) {
          if (currentAddress.length === 0) {
            var data = {
              address: address,
              notifications: [{message: message}]
            };
            dataDb.create(data);
          } else {
            dataDb.updateOne({address: address}, {
              $push: {
                notifications: {
                  message: message
                }
              }
            }).then(function (res) {
              if(res.ok === 1) {
                console.log('Notification added');
              }
            });
          }
        } else {
          console.log(err);
        }
      });
    });

    // dataDb.create(data);
    res.send('Hey there');
  });
});

app.listen(7000, function () {
  console.log('Server started');
});