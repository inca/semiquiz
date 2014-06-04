'use strict';

var crypto = require('crypto')
  , rho = require('rho')
  , cheerio = require('cheerio');

exports.sha256 = function(str) {
  var p = crypto.createHash('sha256');
  p.update(str, 'utf-8');
  return p.digest('hex');
};

exports.md5 = function(str) {
  var p = crypto.createHash('md5');
  p.update(str, 'utf-8');
  return p.digest('hex');
};

exports.escapeHtml = function(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

exports.associativeGroupCategories = function(ctl) {
  var categories = [];
  ctl.items.forEach(function(item) {
    if (item.category)
      categories.push({ item: item, items: [] });
    else {
      var category = categories[categories.length - 1];
      if (!category) return;
      category.items.push(item);
    }
  });
  return categories;
};

exports.shuffle = function($, selector) {
  var cnt = $(selector);
  cnt.each(function() {
    var container = $(this);
    var elems = container.children().get();
    for (var i = 0; i < elems.length; i++) {
      var rand = Math.floor(Math.random() * elems.length);
      container.append(elems[rand]);
      elems.splice(rand, 1);
    }
  });
};