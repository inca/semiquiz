'use strict';

var cheerio = require("cheerio")
  , Diff = require("diff")
  , utils = require("./utils")
  , latinize = require("latinize")
  , _ = require('underscore');

/**
 * Reviewer takes a `form` descriptor compiled with `Compiler` and
 * applies specified `params` (parsed from submitted HTML form)
 * to evaluate the result -- review descriptor.
 *
 * Usage:
 *
 * ```
 * new Reviewer({ ... }).compile(form, req.body);
 * ```
 *
 * The `params` hash is usually parsed by web framework
 * (e.g. `req.body` in Express with body parser). Keys usually
 * represent the `name` attribute of corresponding HTML control and
 * values usually denote to their `value` attributes.
 *
 * The resulting review descriptor is an object with following properties:
 *
 *   * `errorIds` -- an array of controls where incorrect answers are specified
 *   * `input` -- an answer serialized into an array of strings
 *   * `html` -- an object containing markup strings:
 *
 *           * `filled` -- the `prompt` markup with user values distributed
 *             across controls
 *
 *           * `review` -- the review markup highlights incorrect answers and
 *             performs the detailed diff-based review for text inputs
 *
 * Specified `options` can alter some processing defaults:
 *
 *   * `matchCase` (default: false) specify `true` to make text inputs case-sensitive
 *
 *   * `latinize` (default: false) specify `true` to coerce text input values to latin
 *     alphabet (effective against accented characters like àéîü...)
 *
 * @param options {Object} optional options for processing
 */
var Reviewer = module.exports = exports = function(options) {

  this.options = options || {};

};

/**
 * Applies the `params` to specified `form`.
 *
 * @param form {Object} form descriptor compiled with Compiler
 * @param params {Object} a hash containing submitted form data
 * @returns {Object} Review descriptor
 */
Reviewer.prototype.compile = function(form, params) {
  params = params || {};
  this.form = form;
  this.errorIds = [];
  this.input = [];
  this.$filled = cheerio.load(form.html.prompt);
  this.$review = cheerio.load(form.html.template);
  this.clearInputs(this.$filled);
  this.clearInputs(this.$review);
  form.controls.forEach(function(ctl) {
    var handler = this[ctl.type];
    if (typeof(handler) != 'function')
      throw new Error('Control type ' + ctl.type + ' not recognized.');
    handler.call(this, ctl, params[ctl.id]);
  }, this);
  return {
    errorIds: this.errorIds,
    input: this.input,
    html: {
      filled: this.$filled.html(),
      review: this.$review.html()
    }
  };
};

/**
 * Clears inputs from specified cheerio-wrapped `element`.
 *
 * @param element {Object} Cheerio-wrapped element
 */
Reviewer.prototype.clearInputs = function(element) {
  element('input, select')
    .removeAttr('checked')
    .attr('disabled', 'disabled')
    .val('');
};

Reviewer.prototype.checkboxGroup = function(ctl, param) {
  return this.checkboxRadioGroup(ctl, param);
};

Reviewer.prototype.radioGroup = function(ctl, param) {
  return this.checkboxRadioGroup(ctl, param);
};

Reviewer.prototype.checkboxRadioGroup = function(ctl, param) {
  if (!Array.isArray(param))
    param = [param];
  var ctlHit = true;
  ctl.items.forEach(function(item) {
    var checked = param.indexOf(item.id) != -1;
    if (checked) {
      this.$review("#" + item.id).attr("checked", "checked");
      this.$filled("#" + item.id).attr("checked", "checked");
      this.input.push(item.label);
    }
    var hit = checked == item.value;
    if (!hit) {
      this.$review("#item-" + item.id).addClass("error");
      ctlHit = false;
    }
  }, this);
  if (!ctlHit) {
    this.errorIds.push(ctl.id);
    this.$review("fieldset#" + ctl.id).addClass("error");
  }
};

Reviewer.prototype.selectMenu = function(ctl, param) {
  // findWhere({item.id: param})
  var selected = ctl.items.reduce(function(memo, item) {
    return memo || (item.id == param ? item : null);
  }, null);
  if (selected) {
    this.$review("select#" + ctl.id).val(selected.id);
    this.$filled("select#" + ctl.id).val(selected.id);
    this.input.push(selected.label);
  }
  if (!selected || !selected.value) {
    this.errorIds.push(ctl.id);
    this.$review("select#" + ctl.id).addClass("error");
  }
};

Reviewer.prototype.inputText = function(ctl, param) {
  var actual = (param || '').toString().trim();
  var expected = ctl.value.trim();
  this.input.push(actual);
  this.$review("input#" + ctl.id).val(actual);
  this.$filled("input#" + ctl.id).val(actual);
  // Eval diff
  var diff, tA = actual, tE = expected;
  if (!this.options.matchCase) {
    tA = tA.toLowerCase();
    tE = tE.toLowerCase();
  }
  if (this.options.latinize) {
    tA = latinize(tA);
    tE = latinize(tE);
  }
  diff = Diff.diffWords(tA, tE);
  if (diff.length > 1 || (diff[0].added || diff[0].removed)) {
    this.errorIds.push(ctl.id);
    // Prepare the review markup
    var ia = 0
      , ie = 0
      , reviewMarkup = ""
      , filledMarkup = "";
    diff.forEach(function(chunk) {
      var l = chunk.value.length;
      var v;
      if (!chunk.added && !chunk.removed) {
        v = actual.substring(ia, ia + l);
        ia += l;
        ie += l;
        reviewMarkup += '<span>' + utils.escapeHtml(v) + '</span>';
        filledMarkup += '<span>' + utils.escapeHtml(v) + '</span>';
      } else if (chunk.added) {
        v = expected.substring(ie, ie + l);
        ie += l;
        reviewMarkup += '<ins>' + utils.escapeHtml(v) + '</ins>';
        filledMarkup += '<ins class="masked">&hellip;</ins>';
      } else if (chunk.removed) {
        v = actual.substring(ia, ia + l);
        ia += l;
        reviewMarkup += '<del>' + utils.escapeHtml(v) + '</del>';
        filledMarkup += '<mark>' + utils.escapeHtml(v) + '</mark>';
      }
    });
    // Replace the input with review markup
    reviewMarkup = '<span id="' + ctl.id + '" class="inputText-review error detailed">' +
      reviewMarkup + "</span>";
    filledMarkup = '<span id="' + ctl.id + '" class="inputText-review error">' +
      filledMarkup + "</span>";
    this.$review("input#" + ctl.id).replaceWith(reviewMarkup);
    this.$filled("input#" + ctl.id).replaceWith(filledMarkup);
    // Final cleanups
    this.$filled('#' + ctl.id + ' ins + mark').prev().remove();
  }
};

Reviewer.prototype.sortableGroup = function(ctl, param) {
  if (!Array.isArray(param))
    param = [param];
  var $filled = this.$filled('#' + ctl.id);
  var $review = this.$review('#' + ctl.id);
  // `disabled` class indicates that sorting won't be shuffled on client
  $filled.addClass('disabled');
  $review.addClass('disabled');
  // Arrange items in `filled` and in `review` in submitted order
  param.forEach(function(id) {
    $filled.append($filled.find('#item-' + id));
    $review.append($review.find('#item-' + id));
  });
  // Check the input
  var ctlHit = true;
  ctl.items.forEach(function(item, index) {
    var submittedIndex = param.indexOf(item.id);
    this.input.push((submittedIndex + 1) + ': ' + item.label);
    var hit = submittedIndex == index;
    if (!hit) {
      this.$review("#item-" + item.id).addClass("error");
      ctlHit = false;
    }
  }, this);
  if (!ctlHit) {
    this.errorIds.push(ctl.id);
    this.$review("fieldset#" + ctl.id).addClass("error");
  }
};

Reviewer.prototype.associativeGroup = function(ctl, param) {
  if (!Array.isArray(param))
    param = [param];
  var $filled = this.$filled('#' + ctl.id);
  var $review = this.$review('#' + ctl.id);
  // `disabled` class indicates that sorting won't be shuffled on client
  $filled.addClass('disabled');
  $review.addClass('disabled');
  // Parse params category-wise
  var submittedCategories = []
    , correctCategories = utils.associativeGroupCategories(ctl);
  param.forEach(function(id) {
    if (id == 'leftovers')
      return submittedCategories.push({ item: { id: '' }, items: []});
    var item = _(ctl.items).findWhere({ id: id });
    if (!item) return;
    if (item.category) {
      submittedCategories.push({ item: item, items: [] });
    } else {
      var category = submittedCategories[submittedCategories.length - 1];
      if (!category) return;
      category.items.push(item);
    }
  });
  // Arrange items in `filled` in submitted order
  submittedCategories.forEach(function(category) {
    var $filledTarget = $filled
      .find('#category-' + category.item.id)
      .find('.dropTarget');
    var $reviewTarget = $review
      .find('#category-' + category.item.id)
      .find('.dropTarget');
    category.items.forEach(function(item) {
      $filledTarget.append($filled.find('#item-' + item.id));
      $reviewTarget.append($review.find('#item-' + item.id));
    });
  });
  // Check the input
  var ctlHit = true;
  submittedCategories.forEach(function(category) {
    if (!category.id) return;
    var correct = _(correctCategories).find(function(cat) {
      return cat.item.id == category.item.id;
    });
    if (!correct) { // nothing to compare against
      ctlHit = false;
      return;
    }
    // Match submitted
    category.items.forEach(function(item) {
      var matches = _(correct.items).findWhere({ id: item.id });
      if (!matches) {
        ctlHit = false;
        $review.find('#item-' + item.id).addClass('error');
      }
    });
    // See if any leftovers exist
    correct.items.forEach(function(item) {
      var matches = _(category.items).findWhere({ id: item.id });
      if (!matches) {
        ctlHit = false;
        $review.find('#item-' + item.id).addClass('error');
      }
    });
  });
  if (!ctlHit) {
    this.errorIds.push(ctl.id);
    this.$review("fieldset#" + ctl.id).addClass("error");
  }
};

