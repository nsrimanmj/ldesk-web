define(["dojo/_base/declare",
	"dstore/Memory",
	 "dstore/legacy/DstoreAdapter"
], function (declare, Memory, DstoreAdapter) {
	return declare(null, {

		data: {
			postMortem: [
				{ id: 1, name: "AE" },
				{ id: 2, name: "BAU" },
				{ id: 3, name: "Carrier" },
				{ id: 4, name: "CS" },
				{ id: 5, name: "Customer" },
				{ id: 6, name: "Engineering" },
				{ id: 7, name: "External Email" },
				{ id: 8, name: "Inside Wire" },
				{ id: 9, name: "Lingo Eq Failure" },
				{ id: 10, name: "PCS" },
				{ id: 11, name: "People" },
				{ id: 12, name: "Process" },
				{ id: 13, name: "Provisioning" },
				{ id: 14, name: "Sales" },
				{ id: 15, name: "Service Delivery" },
				{ id: 16, name: "System" },
				{ id: 17, name: "TSaaS" }
			
			],
		
		},

		store: null,
		getPostMortemStore: function () {
			var store =  new DstoreAdapter(new Memory({
				idProperty: "name",
				data: this.data.postMortem
			}));
			return store;
		}
		

	});
});
