var buildCommon = require('../buildCommon');
var utils = require('../utils');

var createClass = buildCommon.createClass;

module.exports = function(document) {
  /**
   * This node represents a span node, with a className, a list of children, and
   * an inline style. It also contains information about its height, depth, and
   * maxFontSize.
   */
  function span(classes, children, height, depth, maxFontSize, style) {
      this.classes = classes || [];
      this.children = children || [];
      this.height = height || 0;
      this.depth = depth || 0;
      this.maxFontSize = maxFontSize || 0;
      this.style = style || {};
      this.attributes = {};
  }

  /**
   * Sets an arbitrary attribute on the span. Warning: use this wisely. Not all
   * browsers support attributes the same, and having too many custom attributes
   * is probably bad.
   */
  span.prototype.setAttribute = function(attribute, value) {
      this.attributes[attribute] = value;
  };

  /**
   * Convert the span into an HTML node
   */
  span.prototype.toNode = function() {
      var span = document.createElement("span");
      span.parseNode = this.parseNode;
      span.style = {};

      // Apply the class
      span.className = createClass(this.classes);

      // Apply inline styles
      for (var style in this.style) {
          if (Object.prototype.hasOwnProperty.call(this.style, style)) {
              span.style[style] = this.style[style];
          }
      }

      // Apply attributes
      for (var attr in this.attributes) {
          if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
              span.setAttribute(attr, this.attributes[attr]);
          }
      }

      // Append the children, also as HTML nodes
      for (var i = 0; i < this.children.length; i++) {
          span.appendChild(this.children[i].toNode());
      }

      return span;
  };

  /**
   * Convert the span into an HTML markup string
   */
  span.prototype.toMarkup = function() {
      var markup = "<span";

      // Add the class
      if (this.classes.length) {
          markup += " class=\"";
          markup += utils.escape(createClass(this.classes));
          markup += "\"";
      }

      var styles = "";

      // Add the styles, after hyphenation
      for (var style in this.style) {
          if (this.style.hasOwnProperty(style)) {
              styles += utils.hyphenate(style) + ":" + this.style[style] + ";";
          }
      }

      if (styles) {
          markup += " style=\"" + utils.escape(styles) + "\"";
      }

      // Add the attributes
      for (var attr in this.attributes) {
          if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
              markup += " " + attr + "=\"";
              markup += utils.escape(this.attributes[attr]);
              markup += "\"";
          }
      }

      markup += ">";

      // Add the markup of the children, also as markup
      for (var i = 0; i < this.children.length; i++) {
          markup += this.children[i].toMarkup();
      }

      markup += "</span>";

      return markup;
  };
  return span;
}
