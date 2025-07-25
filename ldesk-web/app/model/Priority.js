define(["dojo/_base/declare",
	"dojo/store/Memory"
], function (declare, Memory) {
	return declare(null, {

		data: {
			priority: [
				{ id: 1, name: "High" },
				{ id: 2, name: "Medium" },
				{ id: 3, name: "Low" }
			]
		},

		store: null,
		getStore: function () {
			var store = new Memory({
				idProperty: "id",
				data: this.data.priority
			});
			return store;
		}
	});
});
