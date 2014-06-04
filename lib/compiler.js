'use strict';

var rho = require('rho')
  , BlockCompiler = rho.BlockCompiler
  , InlineCompiler = rho.InlineCompiler
  , SubWalker = rho.SubWalker
  , cheerio = require('cheerio')
  , utils = require('./utils')
  , extend = require('extend');

/**
 * Compiler extends the `BlockCompiler` from Rho and adds SemiQuiz
 * syntactic rules on top of its grammar.
 *
 * @type {Function}
 */
var Compiler
  = module.exports
  = exports
  = function(options) {
  BlockCompiler.call(this, options);
};

Compiler.prototype = extend({}, BlockCompiler.prototype, {

  /**
   * Compiles the plain text into a form descriptor.
   *
   * Form descriptor is an object with following properties:
   *
   *   * `signature` -- SHA256 hash of the `input`
   *   * `text` -- a copy of `input`
   *   * `html` -- an object containing three markup strings:
   *
   *           * `template` -- initial compilation result (correct values stripped)
   *
   *           * `prompt` -- an empty HTML form (correct values stripped,
   *             solution blocks removed, sortables shuffled)
   *
   *           * `solution` -- correct values applied, solution blocks shown.
   *
   *   * `controls` -- an array of control descriptors.
   *
   * @param input {String} source text
   * @returns {Object} Form descriptor
   */
  compile: function(input) {
    this.reset();
    // Prepare form
    this.form = {
      signature: utils.sha256(input),
      text: input,
      html: {
        prompt: '',
        template: '',
        solution: ''
      },
      controls: []
    };
    // Inject formCompiler into inline compiler
    this.inline.formCompiler = this;
    // Render form
    this.form.html.template = this.append(input).outToString();
    this.prepareHtml();
    return this.form;
  },

  /**
   * Creates a control of specified `type`.
   *
   * The id for each control is a hash based on `this.form.controls.length`.
   * Two subsequent calls will yield the same result, if no controls
   * were placed into `this.form.controls` in between.
   *
   * @private
   * @param type {String} One of `checkboxGroup`, `radioGroup`, `inputText`, `selectMenu`.
   */
  createCtl: function(type) {
    var ctl = { type: type };
    var idx = this.form.controls.length;
    var id = this.form.signature + ':' + idx;
    ctl.id = 'c-' + utils.sha256(id).substring(0, 8);
    this.form.controls.push(ctl);
    return ctl;
  },

  /**
   * Composes an ID for the control item.
   *
   * @private
   * @param ctl
   * @returns {*}
   */
  mkItemId: function(ctl) {
    var len = ctl.items && ctl.items.length;
    return utils.sha256(ctl.id + ':' + len).substring(0, 8);
  },

  /**
   * Emits HTML tag attributes from specified object.
   */
  emitAttrs: function(attrs) {
    for (var k in attrs)
      if (attrs.hasOwnProperty(k))
        this.out.push(' ' + k + '="' + attrs[k] + '"');
  },

  /**
   * Controls are recognized after the initial set of Rho blocks,
   * before the generic `emitParagraph`.
   */
  emitParagraph: function(walk) {
    var _super = BlockCompiler.prototype.emitParagraph.bind(this);
    if (this.tryGroup('checkbox', walk)) return;
    if (this.tryGroup('radio', walk)) return;
    if (this.trySortableGroup(walk)) return;
    if (this.tryAssociativeGroup(walk)) return;
    return _super(walk);
  },

  /**
   *  Group controls are `checkboxGroup` and `radioGroup` which share
   *  the same semantics almost entirely.
   *
   *  Checkboxes are multiple choice controls. Each control begins with
   *  either `[ ] ` for incorrect choice or `[x] ` for correct choice.
   *
   *  Radios are single choice controls. Each control begins with
   *  either `( ) ` for incorrect choice or `(x) ` for correct choice.
   *  Radios should have exactly one correct choice (otherwise the behavior
   *  is undetermined).
   *
   *  Correct choices can be marked with either `x` or `+` sign.
   *
   *  Examples:
   *
   *   ```
   *   [ ] one
   *   [x] two
   *   [x] three
   *   [ ] four
   *
   *   ( ) one
   *   (+) two
   *   ( ) three
   *   ( ) four
   *   ```
   */
  tryGroup: function(type, walk) {
    if (!this.atGroupMarker(type, walk))
      return false;
    // Find the end of the block, checking for adjacent blocks
    var startIdx = walk.position;
    var found = false;
    while (walk.hasCurrent() && !found) {
      walk.scrollToTerm().skipWhitespaces();
      if (!this.atGroupMarker(type, walk))
        found = true;
    }
    var g = this.stripSelector(new SubWalker(walk, startIdx, walk.position));
    this.emitGroup(type, g);
    return true;
  },

  atGroupMarker: function(type, walk) {
    switch (type) {
      case 'checkbox':
        return walk.lookahead(function(w) {
          return (w.at('[ ] ') || w.at('[+] ') || w.at('[x] '));
        });
        break;
      case 'radio':
        return walk.lookahead(function(w) {
          return (w.at('( ) ') || w.at('(+) ') || w.at('(x) '));
        });
        break;
      default:
        return false;
    }
  },

  /**
   * Emits a control group, e.g.:
   *
   *   ```
   *   <fieldset id="{ctl.id}" class="checkboxGroup">
   *     <div id="item-{item.id}" class="item">
   *       <input id="{item.id}"
   *              name="{ctl.id}"
   *              type="checkbox"
   *              value="{item.id}"/>
   *       <label for="{item.id}">{item.label}</label>
   *     </div>
   *     ...
   *   </fieldset>
   *   ```
   */
  emitGroup: function(type, walk) {
    var ctl = this.createCtl(type + 'Group');
    ctl.items = [];
    // Tweak selector to use the generated id
    this.selector.id = ctl.id;
    // Append a class
    if (!Array.isArray(this.selector.classes))
      this.selector.classes = [];
    this.selector.classes.push(ctl.type);
    // Emit root element
    this.out.push('<fieldset');
    this.emitSelector();
    this.out.push('>');
    // Emit each item
    var startIdx = walk.position;
    while(walk.hasCurrent()) {
      walk.scrollToEol().skipWhitespaces();
      if (this.atGroupMarker(type, walk)) {
        this.emitGroupItem(ctl, new SubWalker(walk, startIdx, walk.position));
        startIdx = walk.position;
      }
    }
    // Emit the last one
    this.emitGroupItem(ctl, new SubWalker(walk, startIdx, walk.position));
    this.out.push('</fieldset>');
  },

  emitGroupItem: function(ctl, walk) {
    // Prepare item
    var type;
    if (ctl.type == 'checkboxGroup')
      type = 'checkbox';
    else if (ctl.type == 'radioGroup')
      type = 'radio';
    var id = this.mkItemId(ctl);
    var item = { id: id };
    walk.skip();  // `[`
    item.value = !walk.atSpace();  // `+|x` or ` `
    walk.skip(3); // `x] `
    item.label = new InlineCompiler(this.options)
      .toHtml(walk.substring(walk.position, walk.length).trim());
    // Add item to ctl
    ctl.items.push(item);
    // Write the markup
    this.out.push('<div');
    this.emitAttrs({
      'id': 'item-' + item.id,
      'class': 'item'
    });
    this.out.push('>');
    this.out.push('<input');
    this.emitAttrs({
      id: item.id,
      name: ctl.id,
      type: type,
      value: item.id
    });
    this.out.push('/>');
    this.out.push('<label for="' + item.id + '">');
    this.out.push(item.label);
    this.out.push('</label>');
    this.out.push('</div>');
  },

  /**
   * Sortable groups enable users to specify correct ordering for items.
   *
   * The exact sorting functionality (drag'n'drop, buttons, etc.) must be
   * implemented with client-side scripts.
   *
   * Each item must start with marker `^ `.
   *
   * Example:
   *
   * ```
   * ^ un
   * ^ deux
   * ^ trois
   * ^ quatre
   * ^ cinq
   * ^ six
   * ```
   */
  trySortableGroup: function(walk) {
    if (!walk.at('^ '))
      return false;
    // Find the end of the block, checking for adjacent blocks
    var startIdx = walk.position;
    var found = false;
    while (walk.hasCurrent() && !found) {
      walk.scrollToTerm().skipWhitespaces();
      if (!walk.at('^ '))
        found = true;
    }
    var g = this.stripSelector(new SubWalker(walk, startIdx, walk.position));
    this.emitSortableGroup(g);
    return true;
  },

  /**
   * Emits a sortable group, e.g.
   *
   * ```
   * <fieldset id="{ctl.id}" class="sortableGroup">
   *   <div id="item-{item.id}" class="item">
   *     <input id="{item.id}"
   *            type="hidden"
   *            name="{ctl.id}"
   *            value="{item.id}"/>
   *     <label>{item.label}</label>
   *   </div>
   *   ...
   * </fieldset>
   * ```
   */
  emitSortableGroup: function(walk) {
    var ctl = this.createCtl('sortableGroup');
    ctl.items = [];
    // Tweak selector to use the generated id
    this.selector.id = ctl.id;
    // Also append `sortableGroup` class
    if (!Array.isArray(this.selector.classes))
      this.selector.classes = [];
    this.selector.classes.push('sortableGroup');
    // Emit root element
    this.out.push('<fieldset');
    this.emitSelector();
    this.out.push('>');
    // Emit each item
    var startIdx = walk.position;
    while(walk.hasCurrent()) {
      walk.scrollToEol().skipWhitespaces();
      if (walk.at('^ ')) {
        this.emitSortableItem(ctl, new SubWalker(walk, startIdx, walk.position));
        startIdx = walk.position;
      }
    }
    // Emit the last one
    this.emitSortableItem(ctl, new SubWalker(walk, startIdx, walk.position));
    this.out.push('</fieldset>');
  },

  emitSortableItem: function(ctl, walk) {
    // Prepare item
    var id = this.mkItemId(ctl);
    var item = { id: id };
    walk.skip(2); // `^ `
    item.value = ctl.items.length;
    item.label = new InlineCompiler(this.options)
      .toHtml(walk.substring(walk.position, walk.length).trim());
    // Add item to ctl
    ctl.items.push(item);
    // Write the markup
    this.out.push('<div');
    this.emitAttrs({
      'id': 'item-' + item.id,
      'class': 'item'
    });
    this.out.push('>');
    this.out.push('<input');
    this.emitAttrs({
      'id': item.id,
      'name': ctl.id,
      'type': 'hidden',
      'value': item.id
    });
    this.out.push('/>');
    this.out.push('<label>');
    this.out.push(item.label);
    this.out.push('</label>');
    this.out.push('</div>');
  },

  /**
   * Associative groups enable users to drag select items into correct categories.
   *
   * The exact dragging functionality must be implemented with client-side scripts.
   *
   * Each category starts with marker `@ ` and must contain one or more select items,
   * which start with marker `* ` and are indented beyond category marker.
   *
   * Example:
   *
   * ```
   * @ Category 1
   *
   *   * one
   *   * two
   *   * three
   *
   * @ Category 2
   *
   *   * five
   *   * six
   *
   * ```
   */
  tryAssociativeGroup: function(walk) {
    if (!walk.at('@ '))
      return false;
    // Find the end of the block, checking for adjacent blocks
    var startIdx = walk.position;
    var found = false;
    while (!found && walk.hasCurrent()) {
      walk.scrollToTerm().skipBlankLines();
      if (walk.atSpaces(this.blockIndent)) {
        var i = walk.position;
        walk.skipWhitespaces();
        if (!walk.at('@') && !walk.at('*')) {
          found = true;
          walk.startFrom(i);
        }
      } else found = true;
    }
    var g = this.stripSelector(new SubWalker(walk, startIdx, walk.position));
    this.emitAssociativeGroup(g);
    return true;
  },

  /**
   * Emits an associative group, e.g.
   *
   * ```
   * <fieldset id="{ctl.id}" class="associativeGroup">
   *   <div class="categories>
   *     <div id="category-#{item.id}" class="category">
   *       <input id="{item.id}"
   *              type="hidden"
   *              name="{ctl.id}"
   *              value="{item.id}"/>
   *       <label>Category 1</label>
   *       <div class="dropTarget"></div>
   *     </div>
   *     ...
   *   </div>
   *   <div class="items">
   *     <div id="item-{item.id}" class="item">
   *       <input id="{item.id}"
   *              type="hidden"
   *              name="{ctl.id}"
   *              value="{item.id}"/>
   *       <label>{item.label}</label>
   *     </div>
   *     ...
   *   </div>
   * </fieldset>
   * ```
   */
  emitAssociativeGroup: function(walk) {
    var i, item;
    var ctl = this.createCtl('associativeGroup');
    ctl.items = [];
    // Tweak selector to use the generated id
    this.selector.id = ctl.id;
    // Also append `associativeGroup` class
    if (!Array.isArray(this.selector.classes))
      this.selector.classes = [];
    this.selector.classes.push('associativeGroup');
    // Emit root element
    this.out.push('<fieldset');
    this.emitSelector();
    this.out.push('>');
    // Parse categories and items
    var startIdx = walk.position;
    while(walk.hasCurrent()) {
      walk.scrollToEol().skipWhitespaces();
      this.parseAssociativeItem(ctl, new SubWalker(walk, startIdx, walk.position));
      startIdx = walk.position;
    }
    // Emit categories
    this.out.push('<div class="categories">');
    for (i = 0; i < ctl.items.length; i++) {
      item = ctl.items[i];
      if (!item.category)
        continue;
      this.out.push('<div');
      this.emitAttrs({
        'id': 'category-' + item.id,
        'class': 'category'
      });
      this.out.push('>');
      this.out.push('<input');
      this.emitAttrs({
        'id': item.id,
        'name': ctl.id,
        'type': 'hidden',
        'value': item.id
      });
      this.out.push('/>');
      this.out.push('<label>');
      this.out.push(item.label);
      this.out.push('</label>');
      this.out.push('</div>');
    }
    this.out.push('</div>');
    // Emit select items
    this.out.push('<div class="items">');
    for (i = 0; i < ctl.items.length; i++) {
      item = ctl.items[i];
      if (item.category)
        continue;
      this.out.push('<div');
      this.emitAttrs({
        'id': 'item-' + item.id,
        'class': 'item'
      });
      this.out.push('>');
      this.out.push('<input');
      this.emitAttrs({
        'id': item.id,
        'name': ctl.id,
        'type': 'hidden',
        'value': item.id
      });
      this.out.push('/>');
      this.out.push('<label>');
      this.out.push(item.label);
      this.out.push('</label>');
      this.out.push('</div>');
    }
    this.out.push('</div>');
    // Finish
    this.out.push('</fieldset>');
  },

  parseAssociativeItem: function(ctl, walk) {
    // Prepare item
    var id = this.mkItemId(ctl);
    var item = { id: id };
    if (walk.at('@ '))
      item.category = true;
    walk.skip(2); // marker
    item.label = new InlineCompiler(this.options)
      .toHtml(walk.substring(walk.position, walk.length).trim());
    // Add item to ctl
    ctl.items.push(item);
  },

  /**
   * Inline compiler prototype handles span-level controls.
   */
  InlineCompiler: (function() {

    var compiler = function(options) {
      InlineCompiler.call(this, options);
    };

    compiler.prototype = extend({}, InlineCompiler.prototype, {

      /**
       * Span-level controls are recognized after the initial set of Rho inline
       * elements, just before the generic `emitNormal` method.
       */
      emitNormal: function(walk) {
        if (this.emitText(walk)) return;
        if (this.tryInputText(walk)) return;
        if (this.trySelectMenu(walk)) return;
        var _super = InlineCompiler.prototype.emitNormal.bind(this);
        return _super(walk);
      },

      emitAttrs: function(attrs) {
        return this.formCompiler.emitAttrs(attrs);
      },

      /**
       * Input texts are enclosed in double curly braces -- like this.
       *
       * The amount of empty space determines the size of the input.
       *
       * Example: `There {{   is   }} an airplace in the sky.`
       */
      tryInputText: function(walk) {
        if (!walk.at('{{')) return false;
        var endIdx = walk.indexOf('}}');
        if (endIdx === null)
          return false;
        // We got an input
        walk.skip(2);
        var ctl = this.formCompiler.createCtl('inputText');
        ctl.value = walk.substring(walk.position, endIdx).trim();
        var size = endIdx - walk.position;
        this.out.push('<input');
        this.emitAttrs({
          id: ctl.id,
          name: ctl.id,
          class: ctl.type,
          type: 'text',
          size: size
        });
        this.out.push('/>');
        walk.startFrom(endIdx).skip(2);
        return true;
      },

      /**
       * Select menus are enclosed in parentheses, with each item is enclosed curly
       * braces.
       *
       * Example: `1 + 1 = ({one}{+two}{three})`
       */
      trySelectMenu: function(walk) {
        if (!walk.at('({')) return false;
        var endIdx = walk.indexOf('})');
        if (endIdx === null)
          return false;
        // We got a select menu
        walk.skip(2);
        var ctl = this.formCompiler.createCtl('selectMenu');
        ctl.items = [];
        this.out.push('<select');
        this.emitAttrs({
          id: ctl.id,
          name: ctl.id,
          class: ctl.type
        });
        this.out.push('>');
        this.emitMenuItems(ctl, new SubWalker(walk, walk.position, endIdx));
        this.out.push('</select>');
        walk.startFrom(endIdx).skip(2);
        return true;
      },

      emitMenuItems: function(ctl, walk) {
        while (walk.hasCurrent()) {
          var id = this.formCompiler.mkItemId(ctl);
          var option = { id: id };
          ctl.items.push(option);
          // Plus sign marks the correct answer
          if (walk.at('+')) {
            walk.skip();
            option.value = true;
          } else {
            option.value = false;
          }
          // Scan for label
          var startIdx = walk.position;
          while (walk.hasCurrent() && !walk.at('}'))
            walk.skip();
          option.label = walk.substring(startIdx, walk.position);
          // Option ready, emit it
          this.out.push('<option');
          this.emitAttrs({
            id: option.id,
            value: option.id
          });
          this.out.push('>');
          this.out.push(option.label);
          this.out.push('</option>');
          // Reposition to next option
          while (walk.hasCurrent() && !walk.at('{'))
            walk.skip();
          walk.skip();
        }
      }

    });
    return compiler;
  })(),

  /**
   * Generates `prompt` and `solution` markup by applying modifications
   * to `template` markup.
   */
  prepareHtml: function() {
    // The `solution` markup is built by distributing correct values
    // across the controls and disabling them
    var $ = cheerio.load(this.form.html.template);
    this.form.controls.forEach(function(ctl) {
      switch(ctl.type) {
        case 'checkboxGroup':
        case 'radioGroup':
          ctl.items.forEach(function(item) {
            var input = $('input#' + item.id);
            input.attr('disabled', 'disabled');
            if (item.value)
              input.attr('checked', 'checked');
          });
          break;
        case 'selectMenu':
          var select = $('select#' + ctl.id);
          select.attr('disabled', 'disabled');
          ctl.items.forEach(function(item) {
            if (item.value)
              select.val(item.id);
          });
          break;
        case 'inputText':
          var input = $('input#' + ctl.id);
          input.val(ctl.value);
          input.attr('disabled', 'disabled');
          break;
        case 'associativeGroup':
          var ag = $('fieldset#' + ctl.id);
          ag.addClass('disabled');
          utils.associativeGroupCategories(ctl).forEach(function(category) {
            var $dropTarget = ag.find('.dropTarget');
            category.items.forEach(function(item) {
              var $item = ag.find('#item-' + item.id);
              $dropTarget.append($item);
            });
          });
          break;
      }
    }, this);
    this.form.html.solution = $.html();
    // The `prompt` markup
    $ = cheerio.load(this.form.html.template);
    // Solution blocks are removed
    $('.solution').remove();
    // Sortable items are shuffled
    utils.shuffle($, '.sortableGroup');
    utils.shuffle($, '.associativeGroup .items');
    this.form.html.prompt = $.html();
  }

});
