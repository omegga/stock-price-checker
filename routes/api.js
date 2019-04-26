/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
const https = require('https');

function getUrl(symbol) {
  return `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${process.env.API_KEY}`;
}

function getStockPrice(symbol) {
  const url = getUrl(symbol);
  let data = '';
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    })
    .on('error', err => {
      console.error(err);
      reject(err);
    });
  });
}


const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});
module.exports = function (app) {

  let stockPriceCollection;
  MongoClient.connect(CONNECTION_STRING, (err, client) => {
    if (err) {
      throw err;
    }
    console.log('successfully connected to database');
    stockPriceCollection = client.db('stock-price-checker').collection('stock-price');
  });

  app.route('/api/stock-prices')
    .get(async function (req, res){
      let result = await getStockPrice(req.query.stock);
      result = JSON.parse(result);
      console.log(Object.keys(result));
      return res.send('ok');
    });
};
