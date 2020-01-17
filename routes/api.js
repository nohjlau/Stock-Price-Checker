/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true}, function (err) {
  if (err) throw err;
  console.log('MongoDB connection successful.');
});

var tickerSchema = new mongoose.Schema({
  symbol: String,
  likes: { type: Number, default: 0},
  ips: Array
});

var Ticker = mongoose.model('Ticker', tickerSchema);

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      // TODO: Implement Price lookup

      let ip = req.ip || req.connection.remoteAddress;
      let query = req.query.stock.toUpperCase();
      let likes = req.query.like === 'true'  ? 1 : 0;

      Ticker.findOne({symbol: query}, (err, res) => {
        if (err) throw err;
        if(res !== null) {
          console.log('Ticker already exists!');
          if(likes) {
            let ipExists = false;
            res.ips.forEach((d) => {
              ipExists = true;
              console.log("IP has already liked!");
            });
            if(!ipExists){
              console.log("IP doesn't exist. Increment likes");
              res.ips.push(ip);
              res.save(function(err, data) {
                if(err) throw err;
              })
            }
          }
        } else {
          var newTicker = new Ticker({
            symbol: query,
            likes: likes,
          })

          if(likes) {
            newTicker.ips = ip;
          }

          newTicker.save(function(err) {
            if (err) throw err;
            console.log('Ticker successfully saved.');
          })
        }
      });

      res.json({stockdata: {stock: query, price: 0, likes: likes}});

    }); 
};