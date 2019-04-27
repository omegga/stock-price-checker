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

const stockPricesCache = {};

function getUrl(symbol) {
  return `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.API_KEY}`;
}

function getStockPrice(symbol) {
  const url = getUrl(symbol);
  let data = '';
  // Use cache when necessary to avoid api limitations (maximum of 5 request/minute)
  if (stockPricesCache[symbol] && stockPricesCache[symbol].timeOfRequest > Date.now() - process.env.CACHE_TIMEOUT) {
    return Promise.resolve(stockPricesCache[symbol].value);
  }
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        data = JSON.parse(data);
        if (!data['Global Quote'] || !data['Global Quote']['05. price']) {
          return reject('err');
        }
        const price = data['Global Quote']['05. price'];
        stockPricesCache[symbol] = {
          value: price,
          timeOfRequest: Date.now()
        };
        resolve(price);
      });
    })
    .on('error', err => {
      console.error(err);
      reject(err);
    });
  });
}

async function insertLikeIfNoAssociatedIp(collection, stock, ip) {
  const existingLike = await collection.findOne({ stock, ip });
  if (existingLike === null) {
    await collection.insertOne({ stock, ip });
  }
}

async function getStockData(collection, stock, like, ip) {
  const price = await getStockPrice(stock);
  if (like) {
    await insertLikeIfNoAssociatedIp(collection, stock, ip);
  }
  const likes = await collection.countDocuments({ stock });
  return { stock, price, likes };
}

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});
module.exports = function (app) {

  let stockPriceCollection;
  MongoClient.connect(
    CONNECTION_STRING, 
    { useNewUrlParser: true },
    (err, client) => {
    if (err) {
      throw err;
    }
    console.log('successfully connected to database');
    stockPriceCollection = client.db('stock-price-checker').collection('stock-price');
  });

  app.route('/api/stock-prices')
    .get(async (req, res, next) => {
      const like = req.query.like === 'true';
      const ip = req.ip;
      let stock;
      let stocks;
      if (Array.isArray(req.query.stock)) {
        stocks = req.query.stock.map(s => s.toUpperCase());
      } else if (typeof req.query.stock === 'string') {
        stock = req.query.stock.toUpperCase();
      }

      try {
        if (stock) {
          return res.json({
            stockData: await getStockData(stockPriceCollection, stock, like, ip)
          });
        }
        if (stocks) {
          const stockData = [];
          for (let stock of stocks) {
            stockData.push(await getStockData(stockPriceCollection, stock, like, ip));
          }
          const [ first, second ] = stockData;
          first.rel_likes = first.likes - second.likes;
          second.rel_likes = second.likes - first.likes;
          delete first.likes;
          delete second.likes;
          return res.json({
            stockData
          });
        }
      } catch (e) {
        console.error(e);
        return res.send(e);
      }
    });
};
