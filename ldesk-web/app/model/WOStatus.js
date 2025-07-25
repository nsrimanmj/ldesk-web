define(["dojo/_base/declare",
    "dstore/Memory",
    "dstore/legacy/DstoreAdapter"
], function (declare, Memory, DstoreAdapter) {
    return declare(null, {

        data: {
            status: [
                { id: 1, name: "Pending Dispatch", woType: "Inside Wiring Dispatch" },
                { id: 2, name: "Technician On Site", woType: "Inside Wiring Dispatch" },
                { id: 3, name: "On Hold", woType: "Inside Wiring Dispatch" },
                { id: 4, name: "Canceled", woType: "Inside Wiring Dispatch" },
                { id: 5, name: "Closed", woType: "Inside Wiring Dispatch" },
                { id: 6, name: "Pending Dispatch", woType: "Carrier Dispatch" },
                { id: 7, name: "Technician On Site", woType: "Carrier Dispatch" },
                { id: 8, name: "On Hold", woType: "Carrier Dispatch" },
                { id: 9, name: "Canceled", woType: "Carrier Dispatch" },
                { id: 10, name: "Closed", woType: "Carrier Dispatch" },
                { id: 11, name: "Pending Dispatch", woType: "Repair CCS Dispatch" },
                { id: 12, name: "Awaiting Field Coordinator", woType: "Repair CCS Dispatch" },
                { id: 13, name: "Closed", woType: "Repair CCS Dispatch" },
                { id: 14, name: "Canceled", woType: "Repair CCS Dispatch" },
                { id: 15, name: "Draft", woType: "Repair Field Nation Dispatch" },
                { id: 16, name: "Published", woType: "Repair Field Nation Dispatch" },
                { id: 17, name: "Routed", woType: "Repair Field Nation Dispatch" },
                { id: 18, name: "Closed", woType: "Repair Field Nation Dispatch" },
                { id: 19, name: "Canceled", woType: "Repair Field Nation Dispatch" },
                { id: 20, name: "Assigned", woType: "Repair Field Nation Dispatch" },
                { id: 21, name: "Awaiting Field Coordinator", woType: "Repair Field Nation Dispatch" },
                { id: 22, name: "New", woType: "Repair Field Nation Dispatch" },
                { id: 23, name: "Error", woType: "Repair Field Nation Dispatch" },
                { id: 24, name: "New", woType: "Inside Wiring Dispatch" },
                { id: 25, name: "New", woType: "Carrier Dispatch" },
                { id: 26, name: "New", woType: "Repair CCS Dispatch" },
                { id: 27, name: "Deleted in FN", woType: "Repair Field Nation Dispatch" }
            ],
            subStatus: [
                { id: 1, name: "Completed - Pending Billing Review", statusId: 12 },
                { id: 2, name: "Cancelled - Pending Billing Review", statusId: 12 },
                { id: 3, name: "Billable", statusId: 13 },
                { id: 4, name: "Not Billable", statusId: 13 },
                { id: 5, name: "Completed", statusId: 13 },
                { id: 6, name: "Not Billable", statusId: 14 },
                { id: 7, name: "Canceled", statusId: 14 },
                { id: 8, name: "Billable", statusId: 18 },
                { id: 9, name: "Not Billable", statusId: 18 },
                { id: 10, name: "Billable", statusId: 19 },
                { id: 11, name: "Not Billable", statusId: 19 },
                { id: 12, name: "Technician Assigned", statusId: 20 },
                { id: 13, name: "ETA Set", statusId: 20 },
                { id: 14, name: "Confirmed", statusId: 20 },
                { id: 15, name: "Checked in", statusId: 20 },
                { id: 16, name: "Checked out", statusId: 20 },
                { id: 17, name: "At risk", statusId: 20 },
                { id: 18, name: "On my way", statusId: 20 },
                { id: 19, name: "On Hold", statusId: 20 },
                { id: 20, name: "Delayed", statusId: 20 },
                { id: 21, name: "Cancelled", statusId: 20 },
                { id: 22, name: "Pending Approval", statusId: 21 },
                { id: 23, name: "Approved - Pending Client Billing", statusId: 21 },
                { id: 24, name: "Cancelled - Pending Client Billing", statusId: 21 },
                { id: 25, name: "Cancellation Request", statusId: 21 },
                { id: 26, name: "Increase Requested", statusId: 21 },
                { id: 27, name: "Reschedule Request", statusId: 21 },
                { id: 28, name: "Billable", statusId: 14 },
                { id: 29, name: "Pending Manual Billing", statusId: 12 },
                { id: 30, name: "Pending Manual Billing", statusId: 21 },
                { id: 31, name: "Pending Manual Billing", statusId: 13 },
                { id: 32, name: "Pending Manual Billing", statusId: 18 },
                { id: 33, name: "Pending Manual Billing", statusId: 14 },
                { id: 34, name: "Pending Manual Billing", statusId: 19 }
            ]
        },

        store: null,
        getWOStatusStore: function (woType) {
            var woType = woType;
            var data = this.data.status.filter((status) => { return status.woType == woType });
            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: data
            }));
            return store;
        },
        getWOSubStatusStore: function (statusId) {
            var statusId = parseInt(statusId);
            var data = this.data.subStatus.filter((subStatus) => { return subStatus.statusId == statusId });
            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: data
            }));
            return store;
        },

        getWoStatusIdByName: function (name, type) {
            var data = this.data.status.filter((status) => { return status.name == name && status.woType == type });
            if (data.length > 0) {
                return data[0].id;
            }
        }

    });
});    