'use strict';

var cheerio = require("cheerio")
  , Diff = require("diff")
  , utils = require("./utils")
  , latinize = require("latinize");

/**
 * Takes a form descriptor compiled with `Compiler` and
 * applies specified `params` to evaluate the result -- review descriptor.
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
 * Finally, `options` can alter some processing defaults:
 *
 *   * `matchCase` (default: false) specify `true` to make text inputs case-sensitive
 *   * `latinize` (default: false) specify `true` to coerce text input values to latin
 *     alphabet (effective against accented characters like àéîü...)
 *
 * @param form {Object} form descriptor compiled with Compiler
 * @param params {Object} a hash containing submitted form data
 * @param opts {Object} optional options for processing
 * @returns {Object} Review descriptor
 */
module.exports = exports = function(form, params, opts) {
  var options = opts || {};
  var $review = cheerio.load(form.html.template || form.html.solution);
  var $filled = cheerio.load(form.html.prompt);
  clearInputs($review);
  clearInputs($filled);
  var submission = {
    errorIds: [],
    input: [],
    html: {
      filled: "",
      review: ""
    }
  };
  // Matching each control
  form.controls.forEach(function(ctl) {
    var param = params[ctl.id] || "";
    switch(ctl.type) {
      case "checkboxGroup":
      case "radioGroup":
        var ctlHit = true;
        ctl.items.forEach(function(item) {
          var checked = param.indexOf(item.id) != -1;
          if (checked) {
            $review("input#" + item.id).attr("checked", "checked");
            $filled("input#" + item.id).attr("checked", "checked");
            submission.input.push(item.label);
          }
          var hit = checked == item.value;
          if (!hit) {
            $review("#item-" + item.id).addClass("error");
            ctlHit = false;
          }
        });
        if (!ctlHit) {
          submission.errorIds.push(ctl.id);
          $review("fieldset#" + ctl.id).addClass("error");
        }
        break;
      case "selectMenu":
        // findWhere({item.id: param})
        var selected = ctl.items.reduce(function(memo, item) {
          return memo || (item.id == param ? item : null);
        }, null);
        if (selected) {
          $review("select#" + ctl.id).val(selected.id);
          $filled("select#" + ctl.id).val(selected.id);
          submission.input.push(selected.label);
        }
        if (!selected || !selected.value) {
          submission.errorIds.push(ctl.id);
          $review("select#" + ctl.id).addClass("error");
        }
        break;
      case "inputText":
        var actual = param.toString().trim();
        var expected = ctl.value.trim();
        submission.input.push(actual);
        $review("input#" + ctl.id).val(actual);
        $filled("input#" + ctl.id).val(actual);
        // Eval diff
        var diff, tA = actual, tE = expected;
        if (!options.matchCase) {
          tA = tA.toLowerCase();
          tE = tE.toLowerCase();
        }
        if (options.latinize) {
          tA = latinize(tA);
          tE = latinize(tE);
        }
        diff = Diff.diffWords(tA, tE);
        if (diff.length > 1 || (diff[0].added || diff[0].removed)) {
          submission.errorIds.push(ctl.id);
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
          reviewMarkup = '<span id="' + ctl.id + '" class="review error detailed">' +
            reviewMarkup + "</span>";
          filledMarkup = '<span id="' + ctl.id + '" class="review error">' +
            filledMarkup + "</span>";
          $review("input#" + ctl.id).replaceWith(reviewMarkup);
          $filled("input#" + ctl.id).replaceWith(filledMarkup);
          // Final cleanups
          $filled('#' + ctl.id + ' ins + mark').prev().remove();
        }
        break;
    }
  });
  // All controls processed
  submission.html.review = $review.html();
  submission.html.filled = $filled.html();
  return submission;
};

/**
 * Clears input values from specified `$html` and disable them.
 *
 * @param $html -- cheerio-wrapped document node
 */
function clearInputs($html) {
  $html('input, select')
    .removeAttr('checked')
    .attr('disabled', 'disabled')
    .val('');
}
