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

    it('should distribute submitted values', function() {
      var $ = cheerio.load(review.html.filled);
      assert.equal($('#0966d970').is(':checked'), true);
      assert.equal($('#c6b5dd62').is(':checked'), true);
      assert.equal($('#253b07b6').is(':checked'), true);
      assert.equal($('#c78c4352').is(':checked'), true);
      $ = cheerio.load(review.html.review);
      assert.equal($('#0966d970').is(':checked'), true);
      assert.equal($('#c6b5dd62').is(':checked'), true);
      assert.equal($('#253b07b6').is(':checked'), true);
      assert.equal($('#c78c4352').is(':checked'), true);
    });

    it('should report errors in review markup', function() {
      var $ = cheerio.load(review.html.review);
      assert.equal($('#item-c78c4352').hasClass('error'), true);
      assert.equal($('#item-253b07b6').hasClass('error'), false);
      assert.equal($('#c-46b48f3e').hasClass('error'), false);
      assert.equal($('#c-f02bdb2f').hasClass('error'), true);
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

    it('should distribute submitted values', function() {
      var review = new Reviewer().compile(form, {
        'c-7d1ccf68': '912a7ef6'
      });
      var $ = cheerio.load(review.html.filled);
      assert.equal($('#912a7ef6').is(':checked'), true);
      $ = cheerio.load(review.html.review);
      assert.equal($('#912a7ef6').is(':checked'), true);
    });

    it('should report errors in review markup', function() {
      var review = new Reviewer().compile(form, {
        'c-7d1ccf68': '912a7ef6'
      });
      var $ = cheerio.load(review.html.review);
      assert.equal($('#item-912a7ef6').hasClass('error'), true);
      assert.equal($('#c-7d1ccf68').hasClass('error'), true);
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

    it('should distribute submitted values', function() {
      var review = new Reviewer().compile(form, {
        'c-1e6c41c2': '0184b652',
        'c-a2ced4dc': '0e6f1cea',
        'c-78562237': '6441f554'
      });
      var $ = cheerio.load(review.html.filled);
      assert.equal($('#c-1e6c41c2').val(), '0184b652');
      assert.equal($('#c-a2ced4dc').val(), '0e6f1cea');
      assert.equal($('#c-78562237').val(), '6441f554');
      $ = cheerio.load(review.html.review);
      assert.equal($('#c-1e6c41c2').val(), '0184b652');
      assert.equal($('#c-a2ced4dc').val(), '0e6f1cea');
      assert.equal($('#c-78562237').val(), '6441f554');
    });

    it('should report errors in review markup', function() {
      var review = new Reviewer().compile(form, {
        'c-1e6c41c2': '0184b652',
        'c-a2ced4dc': '0e6f1cea',
        'c-78562237': '6441f554'
      });
      var $ = cheerio.load(review.html.review);
      assert.equal($('#c-1e6c41c2').hasClass('error'), true);
      assert.equal($('#c-a2ced4dc').hasClass('error'), false);
      assert.equal($('#c-78562237').hasClass('error'), false);
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

    it('should distribute submitted values', function() {
      var $ = cheerio.load(review.html.filled);
      assert.equal($('#c-1ac95b3d').val(), 'one');
      assert.equal($('#c-c89111ad').val(), 'Two');
      assert.equal($('#c-a95f7481').val(), 'TWELVE');
      $ = cheerio.load(review.html.review);
      assert.equal($('#c-1ac95b3d').val(), 'one');
      assert.equal($('#c-c89111ad').val(), 'Two');
      assert.equal($('#c-a95f7481').val(), 'TWELVE');
    });

  });

  describe('inputText review', function() {
    var form = loadSample('inputText');
    var review = new Reviewer().compile(form, {
      'c-1ac95b3d': 'un',
      'c-c89111ad': 'deux',
      'c-a95f7481': 'douze'
    });

    it('should report errors', function() {
      assert.equal(review.errorIds.length, 3);
    });

    it('should compile shallow reviews', function() {
      var $ = cheerio.load(review.html.filled);
      assert.equal($('#c-1ac95b3d').html(), '<mark>un</mark>');
      assert.equal($('#c-c89111ad').html(), '<mark>deux</mark>');
      assert.equal($('#c-a95f7481').html(), '<mark>douze</mark>');
    });

    it('should compile detailed reviews', function() {
      var $ = cheerio.load(review.html.review);
      assert.equal($('#c-1ac95b3d').html(), '<ins>one</ins><del>un</del>');
      assert.equal($('#c-c89111ad').html(), '<ins>two</ins><del>deux</del>');
      assert.equal($('#c-a95f7481').html(), '<ins>twelve</ins><del>douze</del>');
    });

  });

  describe('sortableGroup', function() {
    var form = loadSample('sortableGroup');

    describe('correct', function() {

      var review = new Reviewer().compile(form, {
        'c-3ef2918d': [ 'd2d51e43', 'ecc4db36', '6bc308bc',
          '4923e34e', '6f07526a', '654d7ee3', '8c7fd80c']
      });

      it('should detect correct answer', function() {
        assert.equal(review.errorIds.length, 0);
      });

      it('should report valid input', function() {
        assert.equal(review.input[0], '1: Wake up');
        assert.equal(review.input[1], '2: Brush teeth');
        assert.equal(review.input[2], '3: Go to work');
        assert.equal(review.input[3], '4: Work, work, work');
        assert.equal(review.input[4], '5: Go back home');
        assert.equal(review.input[5], '6: Have a dinner');
        assert.equal(review.input[6], '7: Go to sleep');
      });

    });

    describe('incorrect', function() {

      var review = new Reviewer().compile(form, {
        'c-3ef2918d': [ 'd2d51e43', 'ecc4db36', '6bc308bc',
          '654d7ee3', '4923e34e', '6f07526a', '8c7fd80c']
      });

      it('should detect incorrect answer', function() {
        assert.equal(review.errorIds.length, 1);
      });

      it('should report input', function() {
        assert.equal(review.input[0], '1: Wake up');
        assert.equal(review.input[1], '2: Brush teeth');
        assert.equal(review.input[2], '3: Go to work');
        assert.equal(review.input[3], '5: Work, work, work');
        assert.equal(review.input[4], '6: Go back home');
        assert.equal(review.input[5], '4: Have a dinner');
        assert.equal(review.input[6], '7: Go to sleep');
      });

      it('should arrange items in submitted order in `filled`', function() {
        var $ = cheerio.load(review.html.filled);
        var ids = $('.item').map(function(i, el) { return $(el).attr('id') });
        assert.equal(ids.get().join(','),
          'item-d2d51e43,item-ecc4db36,item-6bc308bc,item-654d7ee3,' +
            'item-4923e34e,item-6f07526a,item-8c7fd80c');
      });

      it('should arrange items in correct order in `review`', function() {
        var $ = cheerio.load(review.html.review);
        var ids = $('.item').map(function(i, el) { return $(el).attr('id') });
        assert.equal(ids.get().join(','),
          'item-d2d51e43,item-ecc4db36,item-6bc308bc,item-4923e34e,' +
            'item-6f07526a,item-654d7ee3,item-8c7fd80c');
      });

      it('should report errors in review markup', function() {
        var $ = cheerio.load(review.html.review);
        assert.equal($('#item-d2d51e43').hasClass('error'), false);
        assert.equal($('#item-ecc4db36').hasClass('error'), false);
        assert.equal($('#item-6bc308bc').hasClass('error'), false);
        assert.equal($('#item-654d7ee3').hasClass('error'), true);
        assert.equal($('#item-4923e34e').hasClass('error'), true);
        assert.equal($('#item-6f07526a').hasClass('error'), true);
        assert.equal($('#item-8c7fd80c').hasClass('error'), false);
      });

    });

  });

});

