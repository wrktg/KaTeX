/**
 * These objects store the data about the DOM nodes we create, as well as some
 * extra data. They can then be transformed into real DOM nodes with the
 * `toNode` function or HTML markup using `toMarkup`. They are useful for both
 * storing extra properties on the nodes, as well as providing a way to easily
 * work with the DOM.
 *
 * Similar functions for working with MathML nodes exist in mathMLTree.js.
 */

var buildCommon = require('./buildCommon');
var utils = require("./utils");
var fontMetrics = require("./fontMetrics");
var symbols = require("./symbols");

var createClass = buildCommon.createClass;
var sizeElementFromChildren = buildCommon.sizeElementFromChildren;

module.exports = function(document){

  var span = require('./domTree/span')(document);
  var symbolNode = require('./domTree/symbolNode')(document);
  var documentFragment = require('./domTree/documentFragment')(document);

  /**
   * Makes a symbolNode after translation via the list of symbols in symbols.js.
   * Correctly pulls out metrics for the character, and optionally takes a list of
   * classes to be attached to the node.
   */
  var makeSymbol = function(value, style, mode, color, classes) {
      // Replace the value with its replaced value from symbol.js
      if (symbols[mode][value] && symbols[mode][value].replace) {
          value = symbols[mode][value].replace;
      }

      var metrics = fontMetrics.getCharacterMetrics(value, style);

      var element;
      if (metrics) {
        element = new symbolNode(
          value, metrics.height, metrics.depth, metrics.italic, metrics.skew,
          classes);
      } else {
          // TODO(emily): Figure out a good way to only print this in development
          typeof console !== "undefined" && console.warn(
              "No character metrics for '" + value + "' in style '" +
                  style + "'");
          element = new symbolNode(value, 0, 0, 0, 0, classes);
      }

      if (color) {
        element.style.color = color;
      }

      return element;
  };

  /**
   * Makes a symbol in the italic math font.
   */
  var mathit = function(value, mode, color, classes) {
      return makeSymbol(
          value, "Math-Italic", mode, color, classes.concat(["mathit"]));
  };

  /**
   * Makes a symbol in the upright roman font.
   */
  var mathrm = function(value, mode, color, classes) {
      // Decide what font to render the symbol in by its entry in the symbols
      // table.
      if (symbols[mode][value].font === "main") {
          return makeSymbol(value, "Main-Regular", mode, color, classes);
      } else {
          return makeSymbol(
              value, "AMS-Regular", mode, color, classes.concat(["amsrm"]));
      }
  };

  /**
   * Makes a span with the given list of classes, list of children, and color.
   */
  var makeSpan = function(classes, children, color) {
      var element = new span(classes, children);

      sizeElementFromChildren(element);

      if (color) {
        element.style.color = color;
      }

      return element;
  };

  /**
   * Makes a document fragment with the given list of children.
   */
  var makeFragment = function(children) {
      var fragment = new documentFragment(children);

      sizeElementFromChildren(fragment);

      return fragment;
  };

  /**
   * Makes an element placed in each of the vlist elements to ensure that each
   * element has the same max font size. To do this, we create a zero-width space
   * with the correct font size.
   */
  var makeFontSizer = function(options, fontSize) {
      var fontSizeInner = makeSpan([], [new symbolNode("\u200b")]);
      fontSizeInner.style.fontSize = (fontSize / options.style.sizeMultiplier) + "em";

      var fontSizer = makeSpan(
          ["fontsize-ensurer", "reset-" + options.size, "size5"],
          [fontSizeInner]);

      return fontSizer;
  };

  /**
   * Makes a vertical list by stacking elements and kerns on top of each other.
   * Allows for many different ways of specifying the positioning method.
   *
   * Arguments:
   *  - children: A list of child or kern nodes to be stacked on top of each other
   *              (i.e. the first element will be at the bottom, and the last at
   *              the top). Element nodes are specified as
   *                {type: "elem", elem: node}
   *              while kern nodes are specified as
   *                {type: "kern", size: size}
   *  - positionType: The method by which the vlist should be positioned. Valid
   *                  values are:
   *                   - "individualShift": The children list only contains elem
   *                                        nodes, and each node contains an extra
   *                                        "shift" value of how much it should be
   *                                        shifted (note that shifting is always
   *                                        moving downwards). positionData is
   *                                        ignored.
   *                   - "top": The positionData specifies the topmost point of
   *                            the vlist (note this is expected to be a height,
   *                            so positive values move up)
   *                   - "bottom": The positionData specifies the bottommost point
   *                               of the vlist (note this is expected to be a
   *                               depth, so positive values move down
   *                   - "shift": The vlist will be positioned such that its
   *                              baseline is positionData away from the baseline
   *                              of the first child. Positive values move
   *                              downwards.
   *                   - "firstBaseline": The vlist will be positioned such that
   *                                      its baseline is aligned with the
   *                                      baseline of the first child.
   *                                      positionData is ignored. (this is
   *                                      equivalent to "shift" with
   *                                      positionData=0)
   *  - positionData: Data used in different ways depending on positionType
   *  - options: An Options object
   *
   */
  var makeVList = function(children, positionType, positionData, options) {
      var depth;
      var currPos;
      var i;
      if (positionType === "individualShift") {
          var oldChildren = children;
          children = [oldChildren[0]];

          // Add in kerns to the list of children to get each element to be
          // shifted to the correct specified shift
          depth = -oldChildren[0].shift - oldChildren[0].elem.depth;
          currPos = depth;
          for (i = 1; i < oldChildren.length; i++) {
              var diff = -oldChildren[i].shift - currPos -
                  oldChildren[i].elem.depth;
              var size = diff -
                  (oldChildren[i - 1].elem.height +
                   oldChildren[i - 1].elem.depth);

              currPos = currPos + diff;

              children.push({type: "kern", size: size});
              children.push(oldChildren[i]);
          }
      } else if (positionType === "top") {
          // We always start at the bottom, so calculate the bottom by adding up
          // all the sizes
          var bottom = positionData;
          for (i = 0; i < children.length; i++) {
              if (children[i].type === "kern") {
                  bottom -= children[i].size;
              } else {
                  bottom -= children[i].elem.height + children[i].elem.depth;
              }
          }
          depth = bottom;
      } else if (positionType === "bottom") {
          depth = -positionData;
      } else if (positionType === "shift") {
          depth = -children[0].elem.depth - positionData;
      } else if (positionType === "firstBaseline") {
          depth = -children[0].elem.depth;
      } else {
          depth = 0;
      }

      // Make the fontSizer
      var maxFontSize = 0;
      for (i = 0; i < children.length; i++) {
          if (children[i].type === "elem") {
              maxFontSize = Math.max(maxFontSize, children[i].elem.maxFontSize);
          }
      }
      var fontSizer = makeFontSizer(options, maxFontSize);

      // Create a new list of actual children at the correct offsets
      var realChildren = [];
      currPos = depth;
      for (i = 0; i < children.length; i++) {
          if (children[i].type === "kern") {
              currPos += children[i].size;
          } else {
              var child = children[i].elem;

              var shift = -child.depth - currPos;
              currPos += child.height + child.depth;

              var childWrap = makeSpan([], [fontSizer, child]);
              childWrap.height -= shift;
              childWrap.depth += shift;
              childWrap.style.top = shift + "em";

              realChildren.push(childWrap);
          }
      }

      // Add in an element at the end with no offset to fix the calculation of
      // baselines in some browsers (namely IE, sometimes safari)
      var baselineFix = makeSpan(
          ["baseline-fix"], [fontSizer, new symbolNode("\u200b")]);
      realChildren.push(baselineFix);

      var vlist = makeSpan(["vlist"], realChildren);
      // Fix the final height and depth, in case there were kerns at the ends
      // since the makeSpan calculation won't take that in to account.
      vlist.height = Math.max(currPos, vlist.height);
      vlist.depth = Math.max(-depth, vlist.depth);
      return vlist;
  };

  return {
    makeSymbol: makeSymbol,
    makeSpan: makeSpan,
    makeFragment: makeFragment,
    makeFontSizer: makeFontSizer,
    makeVList: makeVList,
    mathit: mathit,
    mathrm: mathrm,
    span: span,
    symbolNode: symbolNode,
    documentFragment: documentFragment
  }
};
