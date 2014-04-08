'use strict';

var Reviewer = require('../lib/reviewer')
  , fs = require('fs')
  , path = require('path')
  , assert = require('assert')
  , _ = require('underscore');

function loadSample(id) {
  var data = fs.readFileSync(path.join('test/samples/' + id + '.json'), 'utf-8');
  return JSON.parse(data);
}

describe('SemiQuiz Reviewer', function() {

  it('checkboxGroup', function() {
    var form = loadSample('checkboxGroup');
    var params = {
      'c-46b48f3e': ['0966d970', 'c6b5dd62'],
      'c-f02bdb2f': ['253b07b6', 'c78c4352']
    };
    var review = new Reviewer().compile(form, params);
    assert.equal(review.errorIds.length, 1);
    assert.equal(review.input.length, 4);
    assert.equal(review.input.sort().join(','), 'five,three,three,two');
  });

  it('radioGroup', function() {
    var form = loadSample('radioGroup');
    var review = new Reviewer().compile(form, {
      'c-7d1ccf68': '912a7ef6'
    });
    assert.equal(review.errorIds.length, 1);
    review = new Reviewer().compile(form, {
      'c-7d1ccf68': '6129e461'
    });
    assert.equal(review.errorIds.length, 0);
  });



});