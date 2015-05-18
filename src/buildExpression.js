module.exports = function(buildGroup) {
  /**
   * Take a list of nodes, build them in order, and return a list of the built
   * nodes. This function handles the `prev` node correctly, and passes the
   * previous element from the list as the prev of the next element.
   */
  var buildExpression = function(expression, options, prev) {
      var groups = [];
      for (var i = 0; i < expression.length; i++) {
          var group = expression[i];
          groups.push(buildGroup(group, options, prev));
          prev = group;
      }
      return groups;
  };
  return buildExpression;
}
