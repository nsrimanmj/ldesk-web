define(["dojo/_base/declare",
    "dstore/Memory",
    "dstore/legacy/DstoreAdapter"
], function (declare, Memory, DstoreAdapter) {
    return declare(null, {

        data: {
            priority: [
                { id: 1, name: "High" },
                { id: 2, name: "Medium" },
                { id: 3, name: "Low" }
            ],

            timeZone: [
                { id: "CT", name: "CT" },
                { id: "ET", name: "ET" },
                { id: "MT", name: "MT" },
                { id: "PT", name: "PT" },
                { id: "HI", name: "HI" },
                { id: "AZ", name: "AZ" }
            ],

            servicePriority: [
                { id: 1, name: "Not Service Affecting" },
                { id: 2, name: "Out Of Service" },
                { id: 3, name: "Service Affecting" }
            ],

            contactMethod: [
                { id: "Email", name: "Email" },
                { id: "Phone", name: "Phone" }
            ],

            resolutionCodeInquiry: [
                { id: "Lingo", name: "Lingo" },
                { id: "Inactive Account", name: "Inactive Account" }
            ],

            resolutionCodeEquipment: [
                { id: "Lingo", name: "Lingo" },
                { id: "Inactive Account", name: "Inactive Account" },
                { id: "Shipping Label Request Completed", name: "Shipping Label Request Completed" },
                { id: "No Equipment Charge Applied", name: "No Equipment Charge Applied" },
                { id: "Inquiry Resolved", name: "Inquiry Resolved" },
                { id: "RMA info Forwarded to Customer", name: "RMA info Forwarded to Customer" },
                { id: "Equipment Delivery Confirmed", name: "Equipment Delivery Confirmed" },
                { id: "Other", name: "Other" }
            ],

            escalationLevels: [
                { id: "Level 0", name: "Level 0" },
                { id: "Level 1", name: "Level 1" },
                { id: "Level 2", name: "Level 2" },
                { id: "Level 3", name: "Level 3" },
                { id: "Level 4", name: "Level 4" },
                { id: "Level 5", name: "Level 5" }
            ],

            woChargeType: [
                { id: "Labor", name: "Labor" },
                { id: "Materials", name: "Materials" },
                { id: "Penalties/Fees", name: "Penalties/Fees" }
            ],

            woRecordType: [
                { id: "Carrier Dispatch", name: "Carrier Dispatch" },
                { id: "Repair CCS Dispatch", name: "Repair CCS Dispatch" },
                { id: "Repair Field Nation Dispatch", name: "Repair Field Nation Dispatch" }
            ],

            equipmentStatus: [
                { id: 'New', name: "New" },
                { id: "Used", name: "Used" }
            ],

            billingSyatem: [
                { id: "Telcare", name: "Telcare" },
                { id: "Lingo-ION", name: "Lingo-ION" },
                { id: "Lingo-ICE", name: "Lingo-ICE" }
            ],
            category: [
                { id: "Engineering", name: "Engineering" }
            ],

            queue: [
                { id: "Engineering", name: "Engineering" }
            ],

            serviceType: [
                { id: "T1", name: "T1 Services" },
                { id: "DS", name: "DSL Services" },
                { id: "FR", name: "Network Services" },
                { id: "TF", name: "Toll Free/PIN" },
                { id: "PO", name: "Local Services" },
                { id: "OT", name: "Others" },
                { id: "VP", name: "VOIP Local Service" },
                { id: "PR", name: "PRI Service" },
                { id: "WL", name: "Wireless" }
            ],

            accountType: [
                { id: "SMB", name: "SMB" },
                { id: "CA", name: "CA" },
                { id: "BA", name: "BA" },
                { id: "BUS", name: "BUS" },
                { id: "RES", name: "RES" },
                { id: "BUSPRE", name: "BUSPRE" }
            ],

            promiseToPayTerms: [
                { id: "One-time", name: "One-time" },
                { id: "Weekly", name: "Weekly" },
                { id: "Every Two Weeks", name: "Every Two Weeks" },
                { id: "Monthly", name: "Monthly" }
            ],

            treatmentStatus: [
                { id: "Reminder Notice Sent", name: "Reminder Notice Sent" },
                { id: "Suspend Notice Sent", name: "Suspend Notice Sent" },
                { id: "Disconnect Notice Sent", name: "Disconnect Notice Sent" },
                { id: "Final Demand Notice Sent", name: "Final Demand Notice Sent" }
            ]

        },

        store: null,
        getPriorityStore: function () {
            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: this.data.priority
            }));
            return store;
        },

        getTimeZoneStore: function () {
            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: this.data.timeZone
            }));
            return store;
        },

        getServicePriorityStore: function () {
            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: this.data.servicePriority
            }));
            return store;
        },

        getContactMethodStore: function () {
            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: this.data.contactMethod
            }));
            return store;
        },

        getResolutionCodeStore: function (group) {
            var store = null;
            if (group == "Equipment")
                store = new DstoreAdapter(new Memory({
                    idProperty: "name",
                    data: this.data.resolutionCodeEquipment
                }));
            else
                store = new DstoreAdapter(new Memory({
                    idProperty: "name",
                    data: this.data.resolutionCodeInquiry
                }));
            return store;
        },

        getEscalationLevelStore: function () {
            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: this.data.escalationLevels
            }));
            return store;
        },

        getWOChargeType: function () {
            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: this.data.woChargeType
            }));
            return store;
        },
        getWORecordType: function () {
            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: this.data.woRecordType
            }));
            return store;
        },
        getEquipmentStatus: function () {
            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: this.data.equipmentStatus
            }));
            return store;
        },
        getBillingSystem: function () {
            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: this.data.billingSyatem
            }));
            return store;
        },
        getCategory: function () {
            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: this.data.category
            }));
            return store
        },
        getQueue: function () {
            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: this.data.queue
            }));
            return store;
        },

        getServiceType: function () {

            var store = new DstoreAdapter(new Memory({
                idProperty: "id",
                data: this.data.serviceType
            }));
            return store;
        },

        getAccountType: function () {

            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: this.data.accountType
            }));
            return store;
        },

        getPromiseToPayTerms: function () {

            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: this.data.promiseToPayTerms
            }));
            return store;
        },

        getTreatmentStatus: function () {

            var store = new DstoreAdapter(new Memory({
                idProperty: "name",
                data: this.data.treatmentStatus
            }));
            return store;
        }


    });
});