'use strict';

var Compiler = require('../lib/compiler')
  , fs = require('fs')
  , path = require('path')
  , assert = require('assert')
  , _ = require('underscore');

describe('SemiQuiz Compiler Samples', function() {

  var dir = './test/samples';

  var files = fs.readdirSync(dir).filter(function(f) {
    return path.extname(f) == '.rho';
  });

  files.forEach(function(file) {

    var basename = path.basename(file, '.rho');

    var text = fs.readFileSync(path.join(dir, file), 'utf-8')
      , form = new Compiler().compile(text)
      , json = fs.readFileSync(path.join(dir, basename + '.json'), 'utf-8')
      , template = JSON.parse(json);

    describe(basename, function() {

      it('should have equal number of controls', function() {
        assert.equal(form.controls.length, template.controls.length);
      });

      it('should have matching control types', function() {
        form.controls.forEach(function(sCtl) {
          var id = sCtl.id;
          var dCtl = _(template.controls).findWhere({ id: id });
          assert.equal(sCtl.type, dCtl.type);
        });
      });

      it('should have matching control values', function() {
        form.controls.forEach(function(sCtl) {
          var id = sCtl.id;
          var dCtl = _(template.controls).findWhere({ id: id });
          if (sCtl.items) {
            sCtl.items.forEach(function(sItem) {
              var dItem = _(dCtl.items).findWhere({ id: sItem.id });
              assert.notEqual(sItem.value, undefined);
              assert.equal(sItem.value, dItem.value);
            });
          } else {
            assert.notEqual(sCtl.value, undefined);
            assert.equal(sCtl.value, dCtl.value);
          }
        });
      });

    });

  });

});