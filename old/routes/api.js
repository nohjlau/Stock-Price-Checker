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
var fetch = require('node-fetch');

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
      let ip = req.ip || req.connection.remoteAddress;
      let query;
      if(typeof(req.query.stock) === 'string') {
        query = req.query.stock.toUpperCase();
      } else {
        query = [];
        req.query.stock.forEach(d => {
          query.push(d);
        });
      }
      let likes = req.query.like === 'true'  ? 1 : 0;

      function currentLikes(ticker) {
        Ticker.findOne({symbol:ticker}, (err, res) => {
          if(err) throw err;
          console.log(res.likes);
          return res.likes;
        })
      }
      if(typeof(query) === 'string') { // ONE TICKER
        fetch('https://repeated-alpaca.glitch.me/v1/stock/' + query + '/quote')
          .then(function(res) {
            return res.json();
          })
          .then(function(json) {
            if(json.latestPrice == null) {
              res.json({stockdata: { error: "external source error"}});
              console.log('Invalid stock ticker!');
            } else {
              res.json({stockdata: {stock: query, price: json.latestPrice, likes: currentLikes(query)}});
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
                      res.likes = res.likes + 1;
                      console.log(res.likes);
                      res.save(function(err) {
                        if(err) throw err;
                        console.log("Successfully liked!");
                      })
                    }
                  }
                } else {
                  var newTicker = new Ticker({
                    symbol: query,
                    likes: 0,
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
            }
          });
      } else { // TWO tickers
        // No database modification. We only fetch data and compare relative likes unless the like is clicked
        fetch('https://repeated-alpaca.glitch.me/v1/stock/' + query[0] + '/quote')
          .then(function(res) {
            return res.json();
          })
          .then(function(json) {

            fetch('https://repeated-alpaca.glitch.me/v1/stock/' + query[1] + '/quote')
              .then(function(res2) {
                return res2.json();
              })
              .then(function(json2) {
                //TODO: Finish implementing the two ticker logic
                res.json({
                  stockData: [{stock:query[0], price: json.latestPrice}, {stock:query[1], price: json2.latestPrice}]
                });
              })
          });

      
      
      }

    });
    
};