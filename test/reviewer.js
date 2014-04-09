'use strict';

var Reviewer = require('../lib/reviewer')
  , fs = require('fs')
  , path = require('path')
  , assert = require('assert')
  , _ = require('underscore')
  , cheerio = require('cheerio');

function loadSample(id) {
  var data = fs.readFileSync(path.join('test/samples/' + id + '.json'), 'utf-8');
  return JSON.parse(data);
}

describe('SemiQuiz Reviewer', function() {

  describe('checkboxGroup', function() {
    var form = loadSample('checkboxGroup');
    var params = {
      'c-46b48f3e': ['0966d970', 'c6b5dd62'],
      'c-f02bdb2f': ['253b07b6', 'c78c4352']
    };
    var review = new Reviewer().compile(form, params);

    it('should detect errors', function() {
      assert.equal(review.errorIds.length, 1);
    });

    it('should report input values', function() {
      assert.equal(review.input.length, 4);
      assert.equal(review.input.sort().join(','), 'five,three,three,two');
    });

  });

  describe('radioGroup', function() {
    var form = loadSample('radioGroup');

    it('should detect incorrect answer', function() {
      var review = new Reviewer().compile(form, {
        'c-7d1ccf68': '912a7ef6'
      });
      assert.equal(review.errorIds.length, 1);
    });

    it('should detect correct answer', function() {
      var review = new Reviewer().compile(form, {
        'c-7d1ccf68': '6129e461'
      });
      assert.equal(review.errorIds.length, 0);
    });
  });

  describe('selectMenu', function() {
    var form = loadSample('selectMenu');

    it('should detect incorrect answer', function() {
      var review = new Reviewer().compile(form, {
        'c-1e6c41c2': '0184b652',
        'c-a2ced4dc': '0e6f1cea',
        'c-78562237': '6441f554'
      });
      assert.equal(review.errorIds.length, 1);
    });

    it('should detect correct answer', function() {
      var review = new Reviewer().compile(form, {
        'c-1e6c41c2': '2c60392f',
        'c-a2ced4dc': '0e6f1cea',
        'c-78562237': '6441f554'
      });
      assert.equal(review.errorIds.length, 0);
    });

    it('should treat empty form as incorrect', function() {
      var review = new Reviewer().compile(form);
      assert.equal(review.errorIds.length, 3);
    });
  });

  describe('inputText', function() {
    var form = loadSample('inputText');

    var review = new Reviewer().compile(form, {
      'c-1ac95b3d': 'one',
      'c-c89111ad': 'Two',
      'c-a95f7481': 'TWELVE'
    });

    it('should detect correct answer', function() {
      assert.equal(review.errorIds.length, 0);
    });

    it('should report input values', function() {
      assert.equal(review.input.sort().join(','), 'TWELVE,Two,one');
    });

  });

  describe('inputText review', function() {
    var form = loadSample('inputText');
    var review = new Reviewer().compile(form, {
      'c-1ac95b3d': 'un',
      'c-c89111ad': 'deux',
      'c-a95f7481': 'trois'
    });

    it('should report errors', function() {
      assert.equal(review.errorIds.length, 3);
    });

  });

});