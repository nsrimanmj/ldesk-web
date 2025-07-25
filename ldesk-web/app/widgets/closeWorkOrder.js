define([
    "dojo/_base/declare",
    "dojo/parser",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/registry",
    "dijit/form/CurrencyTextBox",
    "dstore/Memory",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/dom-style",
    "dojo/dom",
    "dojo/on",
    "dojo/number",
    "dojo/topic",
    "dgrid/OnDemandGrid",
    "dgrid/Selection",
    "dgrid/Selector",
    "dgrid/extensions/DijitRegistry",
    "dgrid/extensions/ColumnResizer",
    "dgrid/extensions/ColumnReorder",
    "dgrid/extensions/ColumnHider",
    "dgrid/Keyboard",
    "app/view/summaryRow",
    "dstore/legacy/DstoreAdapter",
    "app/model/miniStores",
    "dojo/text!app/widgets/templates/close_work_order.html",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, CurrencyTextBox, Memory, lang, arrayUtil, domStyle, dom, on, number, topic, OnDemandGrid, Selection, Selector, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, DstoreAdapter, MiniStores, template) { // jshint ignore:line

    var widget = null;
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
        templateString: template,
        widgetsInTemplate: true,
        info: null,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;
            widget.ctrl = widget.lingoController;
            widget.data = widget.info;
            widget.itemizedCharges = new Memory({
                idProperty: "ciId",
                data: []
            });

            widget.chargeTypesList = widget.ctrl.woChargeTypes;

            widget.miniStores = new MiniStores();

        },

        buildRendering: function () {
            var widget = this;
            this.inherited(arguments);

            widget.exceptionMsg = `<ul>
                    <li>Work Order must be assigned to a User.</li>
                    <li>Status must be Awaiting Field Coordinator.</li>
                    <li>Itemization of Charges must have at least 1 entry.</li>
                    <ul>`;
            widget.exceptionMsgFN = `<ul>
                    <li>Work Order must be assigned to a User.</li>
                    <li>Status must be Awaiting Field Coordinator.</li>
                    <li>Sub- Status must be Approved - Pending Client Billing or Cancelled - Pending Client Billing.</li>
                    <li>Itemization of Charges must have at least 1 entry.</li>
                    <li>Repair MUST complete all Repair Update fields when Field Nation WO is Paid.</li>
                    <ul>`;
            widget.exceptionMsg2 = `<ul>
                <li><b>Closed – Billable (or) Pending Manual Billing</b></li>
                <li>This process failed because 1 or more of the below requirements were not met:</li>
                <ul>
                    <li>Apply Changes to Telcare must be checked.</li>
                    <li>Work Order Cost must be greater than $0.</li>
                    <li>Client Charge must be greater than $0.</li>
                    <li>Waive Dispatch Fee cannot be checked.</li>
                    <li>There must be either a valid Labor Charge or No Access under Itemization.</li>
                    <li>No Cancellation Charges are allowed.</li>
                </ul>
                </ul>
            `;
            widget.exceptionMsg3 = `<ul>
                <li>Closed – Not Billable</li>
                <li>This process failed because 1 or more of the below requirements were not met:</li>
                <ul>
                    <li>Work Order Cost must be greater than $0.</li>
                    <li>There must be either a valid Labor or No Access charge under Itemization.</li>
                    <li>No Cancellation Charges are allowed.</li>
                    <li>Client Charge must be greater than $0 unless Waive Dispatch Fee is checked.</li>
                </ul>
            </ul>
            `;
            widget.exceptionMsg4 = `<ul>
                <li>Canceled – Billable (or) Pending Manual Billing</li>
                <li>This process failed because 1 or more of the below requirements were not met:</li>
                <ul>
                    <li>Apply Changes to Telcare must be checked.</li>
                    <li>Waive Dispatch Fee cannot be checked.</li>
                    <li>Charge Itemization can only contain one of the following:</li>
                    <ul>
                        <li>Cancelled - Fee Assessed ($50)</li>
                        <li>Late Cancellation ($230)</li>
                    </ul>
                </ul>
            </ul>
            `;
            widget.exceptionMsg5 = `<ul>
                <li>Canceled – Not Billable</li>
                <li>This process failed because 1 or more of the below requirements were not met:</li>
                <ul>
                    <li>Apply Changes to Telcare must be unchecked.</li>
                    <li>Charge Itemization can only contain one of the following:</li>
                    <ul>
                        <li>Cancelled - No Fee Assessed</li>
                        <li>Cancelled - Fee Assessed ($50)</li>
                        <li>Late Cancellation ($230)</li>
                    </ul>
                    <li>Client Charge must be greater than $0 unless Waive Dispatch Fee is checked.</li>
                </ul>
            </ul>
            `
        },
        resize: function () {
            this.inherited(arguments);
            this.chargeItemizationsGrid.resize();
        },
        init: function () {
            this.createChargeForm.reset();
        },
        reset: function () {
            this.init();
        },
        setGridData: function (obj) {
            var widget = this;
            if (obj.data.length == 0) {
                domStyle.set(dom.byId(widget.exceptionDiv.domNode), "display", "block");
                if (widget.data.workOrderType == "Repair CCS Dispatch")
                    widget.exceptionPane.set("content", widget.exceptionMsg);
                else if (widget.data.workOrderType == "Repair Field Nation Dispatch")
                    widget.exceptionPane.set("content", widget.exceptionMsgFN);
                widget.submitBtn.set("disabled", true);
                domStyle.set(dom.byId(widget.page1.domNode), "display", "none");
                domStyle.set(dom.byId(widget.closeWOForm.domNode), "display", "none");
                return;
            }
            widget.itemizedCharges.setData(obj.data);
            widget.chargeItemizationsGrid.set("collection", widget.itemizedCharges);
            widget.chargeItemizationsGrid.refresh();
            widget.chargeItemizationsGrid.resize();
        },
        getItemizedCharges: function () {
            var widget = this;
            if (widget.data) {
                var info = { "workOrderNumber": widget.data.workOrderNo };
                widget.ctrl.getAPI("getItemizedChargesList", info, lang.hitch(this, this.setGridData));
            }

        },
        populateData: function () {
            var widget = this;
            if (widget.data) {
                if (widget.data.workOrderType == "Repair CCS Dispatch") {
                    if (widget.data.ownerId == 0 || widget.data.status != 'Awaiting Field Coordinator') {
                        domStyle.set(dom.byId(widget.exceptionDiv.domNode), "display", "block");
                        //domStyle.set(dom.byId(widget.exceptionPane), "content", widget.exceptionMsg);
                        widget.exceptionPane.set("content", widget.exceptionMsg);
                        //  widget.exceptionPane.innerHTML = widget.exceptionMsg;
                        domStyle.set(dom.byId(widget.page1.domNode), "display", "none");
                        domStyle.set(dom.byId(widget.closeWOForm.domNode), "display", "none");
                        widget.submitBtn.set("disabled", true);
                        return;
                    }
                } else if (widget.data.workOrderType == "Repair Field Nation Dispatch") {
                    if (widget.data.ownerId == 0 || widget.data.status != 'Awaiting Field Coordinator' || (widget.data.subStatus != "Approved - Pending Client Billing" && widget.data.subStatus != "Cancelled - Pending Client Billing") ||
                        (widget.data.status == "Approved - Pending Client Billing" && (widget.data.openCode.length == 0 || widget.data.closeCode.length == 0 || widget.data.resDescr.length == 0))) {
                        domStyle.set(dom.byId(widget.exceptionDiv.domNode), "display", "block");
                        widget.exceptionPane.set("content", widget.exceptionMsgFN);
                        domStyle.set(dom.byId(widget.page1.domNode), "display", "none");
                        domStyle.set(dom.byId(widget.closeWOForm.domNode), "display", "none");
                        widget.submitBtn.set("disabled", true);
                        return;
                    }
                }
                widget.woCost.set("value", widget.data.woCost);
                widget.itemizedTotal.set("value", widget.data.itemizedTotal);
                widget.clientCharge.set("value", widget.data.clientCharge);
                widget.data.waiveDispatchFee == 1 ? widget.waiveDispatchFee.set("checked", true) : widget.waiveDispatchFee.set("checked", false);
            }
        },
        postCreate: function () {
            var widget = this;
            this.inherited(arguments);

            widget.closeWODlg.show();
            widget.getItemizedCharges();
            widget.populateData();

            on(widget.cancelBtn, "click", function () {
                widget.closeWODlg.destroyRecursive();
            });

            var Grid = declare([OnDemandGrid, Selection, Selector, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow]);
            var chargesLayout = [
                { label: "Charge Type", field: "chargeType", width: 50 },
                { label: "Sub Type", field: "subType", width: 50 },
                { label: "Sub Total", field: "subTotal", width: 50 },
                { label: "Client Charge", field: "clientCharge", width: 50 },
                { label: "Description", field: "description", width: 90 }
            ];

            widget.chargeItemizationsGrid = new Grid({
                loadingMessage: "Grid is loading",
                noDataMessage: "No Items to Display!!",
                collection: widget.itemizedCharges,
                className: 'lingogrid',
                columns: chargesLayout,
                selectionMode: "single",
                rowSelector: '20px',
            }, widget.itemizedChargesDiv);

            widget.chargeItemizationsGrid.startup();
            widget.chargeItemizationsGrid.refresh();

            if (widget.data.caseDetails.billingSystem == "Lingo-ICE" || widget.data.caseDetails.billingSystem == "Lingo-ION") {
                var subStatusStore = new DstoreAdapter(new Memory({
                    idProperty: 'name',
                    data: [
                        { name: "Not Billable", id: 1 },
                        { name: "Pending Manual Billing", id: 2 }
                    ]
                }));
                widget.woSubStatus.set("value", "");
                widget.woSubStatus.set("store", subStatusStore);
            }

            on(widget.woSubStatus, "change", function (value) {
                if (value == "Billable") {
                    widget.chargesToTelcare.set("required", true);
                } else if (value == "Not Billable") {
                    widget.chargesToTelcare.set("required", false);
                } else if (value == "Pending Manual Billing") {
                    widget.chargesToTelcare.set("required", true);
                }
            });

            on(widget.submitBtn, "click", function () {
                var status = widget.woStatus.get("value");
                var subStatus = widget.woSubStatus.get("value");
                var applyCharges2Billing = widget.chargesToTelcare.checked == true ? 1 : 0;

                if (!widget.validate()) {
                    domStyle.set(dom.byId(widget.exceptionDiv.domNode), "display", "block");
                    if (status == "Closed") {
                        if (subStatus == "Billable" || subStatus == "Pending Manual Billing") {
                            widget.exceptionPane.set("content", widget.exceptionMsg2);
                        } else if (subStatus == "Not Billable") {
                            widget.exceptionPane.set("content", widget.exceptionMsg3);
                        }
                    } else if (status == "Canceled") {
                        if (subStatus == "Billable" || subStatus == "Pending Manual Billing") {
                            widget.exceptionPane.set("content", widget.exceptionMsg4);
                        } else if (subStatus == "Not Billable") {
                            widget.exceptionPane.set("content", widget.exceptionMsg5);
                        }
                    }
                    return;
                }

                var info = dojo.clone(widget.data);
                info.statusId = 0;
                info.status = status;
                info.subStatusId = 0;
                info.subStatus = subStatus;
                if (subStatus == "Pending Manual Billing") {
                    info.queueId = 81;
                }
                info.applyCharges2Billing = applyCharges2Billing;
                info.clientCharge = widget.clientCharge.get("value");
                info.billChargeNote = widget.getBillingChargeNote(info);
                //status + " - " + subStatus + "\n Vendor WO# : " + widget.data.externalTktNum + "\n Dispatch WO#: " + widget.data.workOrderNo + "\n Repair Case: " + widget.data.caseNumber;
                var callback = function (obj) {
                    if (obj.response.code == 200) {
                        widget.closeWODlg.destroyRecursive();
                        widget.ctrl.showSuccessMessage(obj);
                    }
                }
                widget.ctrl.updateWorkOrder(info, callback);

            });
        },
        getBillingChargeNote: function (info) {
            var note = "";
            var widget = this;
            var dispatchDate = widget.data.workOrderType == "Repair Field Nation Dispatch" ? widget.data.dispatchStart : widget.data.dispatchDate;
            var chargeData = widget.itemizedCharges.data[0];
            if (info.subStatus == "Billable" || info.subStatus == "Pending Manual Billing") {
                note = info.status + " - " + info.subStatus + " Vendor WO# : " + widget.data.externalTktNum + "\nDispatch WO#: " + widget.data.workOrderNo + "\nRepair Case: " + widget.data.caseNumber + "\n\nDate of Dispatch:" +
                    dispatchDate + "\n\nCharge Breakdown: \n****" + widget.getChargeBreakdown() + "Total:" + widget.data.itemizedTotal + "\n****\nTotal Billed To Site: $" +
                    widget.clientCharge.get("value") + "\n\nScope of Work: " + widget.data.scopeOfWork + "\nResolution Description: " + widget.data.resDescr;
            }
            // } else if (info.subStatus == "Not Billable") {
            //     note = info.status + " - " + info.subStatus + "\n Vendor WO# : " + widget.data.externalTktNum + "\n Dispatch WO#: " + widget.data.workOrderNo + "\n Repair Case: " + widget.data.caseNumber;
            // }
            return note;
        },
        getChargeBreakdown: function () {
            var chargeNote = "";
            var widget = this;
            arrayUtil.map(widget.itemizedCharges.data, function (item) {
                chargeNote = chargeNote + item.chargeType + '-' + item.description + "\n";
            });
            return chargeNote;
        },
        validate: function () {
            var widget = this;

            if (!widget.closeWOForm.isValid()) {
                widget.closeWOForm.validate();
                return false;
            }
            var status = widget.woStatus.get("value");
            var subStatus = widget.woSubStatus.get("value");
            var isValid = true;
            var applyCharges2Billing = widget.chargesToTelcare.checked == true ? 1 : 0;
            var subTypeList = arrayUtil.map(widget.itemizedCharges.data, function (item) {
                return item.subType;
            });
            var chargeTypeList = arrayUtil.map(widget.itemizedCharges.data, function (item) {
                return item.chargeType;
            });
            console.log(subTypeList);
            console.log(chargeTypeList);

            if (status == "Closed") {
                if (widget.itemizedCharges.data.length < 1)
                    return false;
                // List of valid subTypes
                var validSubTypes = [
                    "Hourly Rate – Standard",
                    "Hourly Rate – After-Hours",
                    "Hourly Rate – Premium",
                    "Hourly Rate – Custom",
                    "Fixed Rate",
                    "Blended Rate",
                    "POTS IW Package",
                    "POTS Cross-Connect Package",
                    "Installation Package",
                    "Quote",
                    "No Access ($230)",
                    ""
                ];

                // Check for duplicates and validate subTypes
                var subTypeCount = {};
                var violations = [];
                var afterHrscount = 0;
                var materialCount = 0;
                if (chargeTypeList.includes("Materials")) {
                    arrayUtil.forEach(chargeTypeList, function (charge) {
                        if (charge == "Materials")
                            materialCount = materialCount + 1;
                    });
                }
                if (subTypeList.includes("Hourly Rate – After-Hours")) {
                    arrayUtil.forEach(subTypeList, function (subType) {
                        if (subType == "Hourly Rate – After-Hours")
                            afterHrscount = afterHrscount + 1;
                    });
                }
                /* else {
                    if (widget.itemizedCharges.data.length > 1)
                        return false;
                } */
                if (widget.itemizedCharges.data.length - materialCount == 0)
                    return false;
                if (widget.itemizedCharges.data.length - (afterHrscount + materialCount) > 1)
                    return false;

                arrayUtil.forEach(subTypeList, function (subType) {
                    if (validSubTypes.includes(subType)) {
                        if (subTypeCount[subType]) {
                            subTypeCount[subType]++;
                        } else {
                            subTypeCount[subType] = 1;
                        }
                    } else {
                        isValid = false;
                    }
                });
                if (!isValid)
                    return false;


                // Check for violations
                for (var subType in subTypeCount) {
                    if (subTypeCount[subType] > 1 && subType != "Hourly Rate – After-Hours" && subType != "") {
                        violations.push(subType);
                        return false;
                    }
                }

                if (subStatus == "Billable" || subStatus == "Pending Manual Billing") {
                    if (applyCharges2Billing == 0 || widget.data.woCost <= 0 || widget.data.waiveDispatchFee == 1 || widget.data.clientCharge <= 0)
                        return false;

                } else if (subStatus == "Not Billable") {
                    if (applyCharges2Billing == 1 || widget.data.woCost <= 0 || (widget.data.clientCharge != 0 && widget.data.waiveDispatchFee != 1))
                        return false;
                }
            } else if (status == "Canceled") {
                if (widget.itemizedCharges.data.length != 1)
                    return false;

                if (subStatus == "Billable" || subStatus == "Pending Manual Billing") {
                    if (applyCharges2Billing == 0 || widget.data.waiveDispatchFee == 1)
                        return false;

                    /* arrayUtil.forEach(subTypeList, function (subType) {
                        if (subType != "Cancelled - Fee Assessed ($50)" && subType != "Late Cancellation ($230)")
                            return false;
                    }); */
                    var validSubTypes = ["Cancelled - Fee Assessed ($50)", "Late Cancellation ($230)"];
                    return arrayUtil.every(subTypeList, function (subType) {
                        return validSubTypes.includes(subType);
                    });
                } else if (subStatus == "Not Billable") {
                    if (applyCharges2Billing == 1 || (widget.data.clientCharge != 0 && widget.data.waiveDispatchFee != 1))
                        return false;
                    /* arrayUtil.forEach(subTypeList, function (subType) {
                        if (subType != "Cancelled - Fee Assessed ($50)" && subType != "Late Cancellation ($230)" && subType != "Cancelled - No Fee Assessed")
                            return false;
                    }); */
                    var validSubTypes = ["Cancelled - No Fee Assessed", "Cancelled - Fee Assessed ($50)", "Late Cancellation ($230)"];
                    var allValid = arrayUtil.every(subTypeList, function (subType) {
                        return validSubTypes.includes(subType);
                    });

                    if (!allValid) {
                        return false;
                    }
                    /* if (widget.data.clientCharge != 0) {
                        if (widget.data.waiveDispatchFee != 1 ) {
                            return false;
                        }
                    } */
                }
            }
            return true;
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});
