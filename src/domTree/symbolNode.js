var buildCommon = require('../buildCommon');
var utils = require('../utils');

var createClass = buildCommon.createClass;

module.exports = function(document) {
  /**
   * SimpleDOM doesn't provide style attribute on elements, so we'll add it
   */
  function createElement(tagName) {
    var element = document.createElement(tagName);
    element.style = {};
    return element;
  }
  /**
   * A symbol node contains information about a single symbol. It either renders
   * to a single text node, or a span with a single text node in it, depending on
   * whether it has CSS classes, styles, or needs italic correction.
   */
  function symbolNode(value, height, depth, italic, skew, classes, style) {
      this.value = value || "";
      this.height = height || 0;
      this.depth = depth || 0;
      this.italic = italic || 0;
      this.skew = skew || 0;
      this.classes = classes || [];
      this.style = style || {};
      this.maxFontSize = 0;
  }

  /**
   * Creates a text node or span from a symbol node. Note that a span is only
   * created if it is needed.
   */
  symbolNode.prototype.toNode = function() {
      var node = document.createTextNode(this.value);
      var span = null;

      if (this.italic > 0) {
          span = createElement("span");
          span.style.marginRight = this.italic + "em";
      }

      if (this.classes.length > 0) {
          span = span || createElement("span");
          span.className = createClass(this.classes);
      }

      for (var style in this.style) {
          if (this.style.hasOwnProperty(style)) {
              span = span || createElement("span");
              span.style[style] = this.style[style];
          }
      }

      var result;
      if (span) {
          span.appendChild(node);
          result = span;
      } else {
          result = node;
      }
      result.parseNode = this.parseNode;
      return result;
  };

  /**
   * Creates markup for a symbol node.
   */
  symbolNode.prototype.toMarkup = function() {
      // TODO(alpert): More duplication than I'd like from
      // span.prototype.toMarkup and symbolNode.prototype.toNode...
      var needsSpan = false;

      var markup = "<span";

      if (this.classes.length) {
          needsSpan = true;
          markup += " class=\"";
          markup += utils.escape(createClass(this.classes));
          markup += "\"";
      }

      var styles = "";

      if (this.italic > 0) {
          styles += "margin-right:" + this.italic + "em;";
      }
      for (var style in this.style) {
          if (this.style.hasOwnProperty(style)) {
              styles += utils.hyphenate(style) + ":" + this.style[style] + ";";
          }
      }

      if (styles) {
          needsSpan = true;
          markup += " style=\"" + utils.escape(styles) + "\"";
      }

      var escaped = utils.escape(this.value);
      if (needsSpan) {
          markup += ">";
          markup += escaped;
          markup += "</span>";
          return markup;
      } else {
          return escaped;
      }
  };
  return symbolNode;
}
