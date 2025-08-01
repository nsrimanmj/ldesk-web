define(["dojo/_base/declare",
	"dojo/store/Memory"
], function (declare, Memory) {
	return declare(null, {

		data: {
			status: [
				{ id: 1, name: "Acknowledged" },
				{ id: 3, name: "Cancelled" },
				{ id: 4, name: "Closed" },
				{ id: 6, name: "In Progress" },
				{ id: 9, name: "New" },
				{ id: 11, name: "On Hold" },
				{ id: 12, name: "Open" },
				{ id: 13, name: "Opened" }
			],
			collectionStatus: [
				{ id: 3, name: "Cancelled" },
				{ id: 9, name: "New" },
				{ id: 11, name: "On Hold" },
				{ id: 4, name: "Closed" },
				{ id: 19, name: "Balance Transfer/Research" },
				{ id: 20, name: "Dispute" },
				{ id: 21, name: "Final Demand" },
				{ id: 22, name: "Promise to Pay" },
				{ id: 23, name: "Suspended" },
			],
			taskStatus: [
				{ id: 1, name: "New" },
				{ id: 2, name: "In Progress" },
				{ id: 3, name: "Closed" },
				{ id: 4, name: "Cancelled" }
			],
			subStatus: [
				{ id: 19, name: "Duplicate request", statusId: 3 },
				{ id: 21, name: "Invalid Account/Service Number", statusId: 3 },
				{ id: 22, name: "Invalid Case - Opened In Error", statusId: 3 },
				{ id: 24, name: "No Action Required", statusId: 3 },
				{ id: 37, name: "Service Number NOT Active", statusId: 3 },
				{ id: 38, name: "Service Order NOT Complete", statusId: 3 },
				{ id: 7, name: "Cancelled", statusId: 4 },
				{ id: 8, name: "Carrier Outage", statusId: 4 },
				{ id: 13, name: "Credit Applied", statusId: 4 },
				{ id: 14, name: "Credit Rejected", statusId: 4 },
				{ id: 36, name: "Service Disconnected", statusId: 4 },
				{ id: 39, name: "Service Retired/Replaced", statusId: 4 },
				{ id: 1, name: "24-hour Monitoring", statusId: 11 },
				{ id: 4, name: "Awaiting Client Feedback", statusId: 11 },
				{ id: 9, name: "Cleared", statusId: 11 },
				{ id: 23, name: "Monitoring", statusId: 11 },
				{ id: 42, name: "Pending Technician Assignment", statusId: 11 },
				{ id: 43, name: "24 Hour Auto Close", statusId: 11 },
				{ id: 28, name: "Pending FieldOps Quote", statusId: 11 },
				{ id: 6, name: "Awaiting Lingo Response", statusId: 12 },
				{ id: 11, name: "Carrier Outage", statusId: 12 },
				{ id: 12, name: "Contacting Customer", statusId: 12 },
				{ id: 20, name: "In Progress", statusId: 12 },
				{ id: 29, name: "Pending Review", statusId: 12 },
				{ id: 15, name: "Delay Network Maintenance", statusId: 12 },
				{ id: 16, name: "Dispatch IN", statusId: 12 },
				{ id: 17, name: "Dispatch IW", statusId: 12 },
				{ id: 18, name: "Dispatch OUT", statusId: 12 },
				{ id: 25, name: "Order Submitted", statusId: 12 },
				{ id: 29, name: "Pending Review", statusId: 12 },
				{ id: 30, name: "Referred TO Carrier", statusId: 12 },
				{ id: 32, name: "Refers TO Provisioning", statusId: 12 },
				{ id: 33, name: "Refer TO Engineering", statusId: 12 },
				{ id: 35, name: "Refer TO Sr. ARC", statusId: 12 },
				{ id: 40, name: "Vendor Meet", statusId: 12 },
			],
			statusInEdit: [
				{ id: 1, name: "Acknowledged" },
				{ id: 6, name: "In Progress" },
				//{ id: 9, name: "New" },
				{ id: 11, name: "On Hold" },
				{ id: 12, name: "Open" },
				//{ id: 13, name: "Opened" }
			],

			taskStatusInEdit: [
				{ id: 1, name: "New" },
				{ id: 2, name: "In Progress" }
			],

			collectionStatusInEdit: [

				{ id: 11, name: "On Hold" },
				{ id: 19, name: "Balance Transfer/Research" },
				{ id: 20, name: "Dispute" },
				{ id: 21, name: "Final Demand" },
				{ id: 22, name: "Promise to Pay" },
				{ id: 23, name: "Suspended" },
			],
		},

		store: null,
		getStatusStore: function () {
			this.data.status.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			});
			var store = new Memory({
				idProperty: "name",
				data: this.data.status
			});
			return store;
		},
		getEditStatusStore: function () {
			this.data.statusInEdit.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			});
			var store = new Memory({
				idProperty: "name",
				data: this.data.statusInEdit
			});
			return store;
		},
		getSubStatusStore: function (statusId) {
			this.data.subStatus.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			});
			var statusId = parseInt(statusId)
			var data = this.data.subStatus.filter((subStatus) => { return subStatus.statusId == statusId });
			var store = new Memory({
				idProperty: "name",
				data: data
			});
			return store;
		},
		getStatusIdByName: function (name) {
			var data = this.data.status.filter((status) => { return status.name == name });
			return data[0].id;
		},
		getTaskStatusStore: function () {
			this.data.taskStatus.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			});
			var store = new Memory({
				idProperty: "name",
				data: this.data.taskStatus
			});
			return store;
		},

		getTaskEditStatusStore: function () {
			this.data.taskStatusInEdit.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			});
			var store = new Memory({
				idProperty: "name",
				data: this.data.taskStatusInEdit
			});
			return store;
		},

		getCollecStatusStore: function () {
			this.data.collectionStatus.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			});
			var store = new Memory({
				idProperty: "name",
				data: this.data.collectionStatus
			});
			return store;
		},
		getCollecStatusEditStore: function () {
			this.data.collectionStatusInEdit.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			});
			var store = new Memory({
				idProperty: "name",
				data: this.data.collectionStatusInEdit
			});
			return store;
		},

	});
});
