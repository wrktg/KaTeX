module.exports = function(document) {
  /**
   * This node represents a document fragment, which contains elements, but when
   * placed into the DOM doesn't have any representation itself. Thus, it only
   * contains children and doesn't have any HTML properties. It also keeps track
   * of a height, depth, and maxFontSize.
   */
  function documentFragment(children, height, depth, maxFontSize) {
      this.children = children || [];
      this.height = height || 0;
      this.depth = depth || 0;
      this.maxFontSize = maxFontSize || 0;
  }

  /**
   * Convert the fragment into a node
   */
  documentFragment.prototype.toNode = function() {
      // Create a fragment
      var frag = document.createDocumentFragment();
      frag.parseNode = this.parseNode;

      // Append the children
      for (var i = 0; i < this.children.length; i++) {
          frag.appendChild(this.children[i].toNode());
      }

      return frag;
  };

  /**
   * Convert the fragment into HTML markup
   */
  documentFragment.prototype.toMarkup = function() {
      var markup = "";

      // Simply concatenate the markup for the children together
      for (var i = 0; i < this.children.length; i++) {
          markup += this.children[i].toMarkup();
      }

      return markup;
  };
  return documentFragment;
}
