'use strict';

require('dotenv').config();
var express           = require('express');
var bodyParser        = require('body-parser');
var expect            = require('chai').expect;
var cors              = require('cors');
var helmet            = require('helmet');
var mongoose          = require('mongoose');
var apiRoutes         = require('./routes/api.js');
var fccTestingRoutes  = require('./routes/fcctesting.js');
var runner            = require('./test-runner');
var app = express();

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({origin: '*'})); //For FCC testing purposes only
app.use(helmet.contentSecurityPolicy({directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"]}}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

app.get('/api/stock-prices', function(req, res) {
  // TODO: Implement IP check for Likes
  // TODO: Implement Price lookup
  let query = req.query.stock.toUpperCase();
  let likes = req.query.like === 'true'  ? 1 : 0;
  Ticker.findOne({symbol: query}, (err, res) => {
    if (err) throw err;
    if(res !== null) {
      console.log('Ticker already exists!');
    } else {
      var newTicker = new Ticker({
        symbol: query,
        likes: likes
      })

      newTicker.save(function(err) {
        if (err) throw err;
        console.log('Ticker successfully saved.');
      })
    }
  });

  res.json({stockdata: {stock: query, price: 0, likes: likes}});
});

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);  
    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port " + process.env.PORT);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        var error = e;
          console.log('Tests are not valid:');
          console.log(error);
      }
    }, 3500);
  }
});

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true}, function (err) {
  if (err) throw err;
  console.log('MongoDB connection successful.');
});

var tickerSchema = new mongoose.Schema({
  symbol: String,
  likes: { type: Number, default: 0}
});

var Ticker = mongoose.model('Ticker', tickerSchema);

module.exports = app; //for testing
