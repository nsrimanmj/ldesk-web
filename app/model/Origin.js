define(["dojo/_base/declare",
	"dstore/Memory",
	"dstore/legacy/DstoreAdapter",
], function (declare, Memory, DstoreAdapter) {
	return declare(null, {

		data: {
			origin: [
				{ id: 1, name: "Lost Line System" },
				{ id: 2, name: "Project-Driven" },
				{ id: 3, name: "Fax" },
				{ id: 4, name: "Phone" },
				{ id: 5, name: "Self-Service Portal" },
				{ id: 6, name: "Chat" },
				{ id: 7, name: "Email" },
				{ id: 8, name: "Web" },
				{ id: 9, name: "MBA" },
				{ id: 10, name: "Web-Form" },
				{ id: 11, name: "LDesk" }
			]
		},

		store: null,
		getOriginStore: function () {
			this.data.origin.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			});
			var store = new DstoreAdapter(new Memory({
				idProperty: "name",
				data: this.data.origin
			}));
			return store;
		},
		getOriginData: function () {
			return this.data.origin;
		}

	});
});
