/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.property(res.body.stockData, 'price');
          assert.property(res.body.stockData, 'likes');
          done();
        });
      });
      
      test('1 stock with like', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({ stock: 'goog', like: 'true' })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.property(res.body, 'stockData');
            assert.equal(res.body.stockData.stock, 'GOOG');
            assert.property(res.body.stockData, 'price');
            assert.property(res.body.stockData, 'likes');
            done();
          });
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({ stock: 'goog' })
          .end(function (err, res) {
            const likesBefore = res.body.stockData.likes;
            chai.request(server)
              .get('/api/stock-prices')
              .query({ stock: 'goog', like: 'true' })
              .end(function (err, res) {
                assert.equal(res.body.stockData.likes, likesBefore);
                done();
              });
          });
      });
      
      test('2 stocks', function(done) {
        chai.request(server)
          .get('/api/stock-prices?stock=goog&stock=msft')
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.property(res.body, 'stockData', 'body should have stockData property');
            assert.equal(res.body.stockData[0].stock, 'GOOG', 'first stock shoud have GOOG as value');
            assert.equal(res.body.stockData[1].stock, 'MSFT', 'second stock should have MSFT as value');
            assert.property(res.body.stockData[0], 'price', 'first stock should have price property');
            assert.property(res.body.stockData[1], 'price', 'second stock should have price property');
            assert.property(res.body.stockData[0], 'rel_likes', 'first stock should have rel_likes property');
            assert.property(res.body.stockData[1], 'rel_likes', 'second stock should have rel_likes property');
            done();
          });
        });
        
        test('2 stocks with like', function(done) {
          chai.request(server)
            .get('/api/stock-prices?stock=goog&stock=msft&like=true')
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.property(res.body, 'stockData', 'body should have stockData property');
              assert.equal(res.body.stockData[0].stock, 'GOOG', 'first stock shoud have GOOG as value');
              assert.equal(res.body.stockData[1].stock, 'MSFT', 'second stock should have MSFT as value');
              assert.property(res.body.stockData[0], 'price', 'first stock should have price property');
              assert.property(res.body.stockData[1], 'price', 'second stock should have price property');
              assert.property(res.body.stockData[0], 'rel_likes', 'first stock should have rel_likes property');
              assert.property(res.body.stockData[1], 'rel_likes', 'second stock should have rel_likes property');
              done();
            });
      });
      
    });

});
