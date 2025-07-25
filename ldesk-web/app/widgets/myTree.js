define(["dojo/_base/declare",
	"dojo/_base/array",
	"dgrid/util/touch",
	"dgrid/Tree"
], function (declare, arrayUtil, touchUtil, Tree) {
	return declare(Tree, {
		// override the expand function from the Employee class
		expand: function (target, expand, noTransition, lastRowsFirst) {
			//console.log("Expand: ", target);

			var grid = this;
			var row = target.element ? target : this.row(target);
			isExpanded = !!this._expanded[row.id];

			for (var i in grid.columns) {
				var item = grid.columns[i];
				if (item.hideCollapsed) {
					grid.toggleColumnHiddenState(item.id, isExpanded);
				}
			}
			return this.inherited(arguments);
		},
		shouldExpand: function (row, level, previouslyExpanded) {
			//console.log("shouldExpand", row, level, previouslyExpanded);
			if (row.data.expand == true)
				return true;
			return false;
			//return this.inherited(arguments);
		}

	});
});
