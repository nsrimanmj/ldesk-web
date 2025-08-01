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
    "dojo/text!app/widgets/templates/charge_itemizations.html",
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

            widget.chargeSubTypeStore = new DstoreAdapter(new Memory({
                idProperty: 'name',
                data: []
            }));

            widget.miniStores = new MiniStores();
        },

        buildRendering: function () {
            this.inherited(arguments);
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
            widget.itemizedCharges.setData(obj.data);
            widget.chargeItemizationsGrid.set("collection", widget.itemizedCharges);
            widget.chargeItemizationsGrid.refresh();
            widget.chargeItemizationsGrid.resize();
        },
        setChargeSubTypeStore: function (chargeType) {
            var widget = this;
            widget.chargeSubTypeStore.data = [];
            var tmpArry = [];
            if (!chargeType) {
                chargeType = "\w*";
            }
            var dataStore = new DstoreAdapter(new Memory({
                'idProperty': 'name',
                'data': widget.chargeTypesList
            }));
            var filter = dataStore.query({
                'chargeType': new RegExp(chargeType)
            });

            dojo.forEach(filter, function (item) {
                if (item.subType != null && tmpArry.indexOf(item.subType) == -1) {
                    item.label = item.subType;
                    item.name = item.subType;
                    item.id = item.chargeId;
                    tmpArry.push(item);
                }
            });
            tmpArry.sort((a, b) => {
   				 if (a.label < b.label) return -1; 
   				 if (a.label > b.label) return 1;  
    			return 0;                         
			});
             widget.chargeSubTypeStore.store.setData(tmpArry);
            widget.chargeSubType.set('store', widget.chargeSubTypeStore);

        },
        getItemizedCharges: function () {
            var widget = this;
            if (widget.data) {
                var info = { "workOrderNumber": widget.data.workOrderNo };
                widget.ctrl.getAPI("getItemizedChargesList", info, lang.hitch(this, this.setGridData));
            }

        },
        postCreate: function () {
            var widget = this;
            this.inherited(arguments);
            //widget.setChargeSubTypeStore();
            widget.woItemizedChargesDlg.show();
            widget.getItemizedCharges();

            on(widget.closeBtn1, "click", function () {
                widget.woItemizedChargesDlg.destroyRecursive();
            });

            on(widget.cancelBtn, "click", function () {
                // widget.woItemizedChargesDlg.destroyRecursive();
                domStyle.set(dom.byId(widget.page1), "display", "block");
                domStyle.set(dom.byId(widget.page2), "display", "none");
                domStyle.set(dom.byId(widget.dialogActionbar), "display", "none");
                widget.resetTable(widget.materialTable);
                widget.resetTable(widget.laborTable);
            });

            var Grid = declare([OnDemandGrid, Selection, Selector, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow]);
            var chargesLayout = [
                { label: "WO-Charge Itemization Name", field: "ciId", width: 30 },
                { label: "Charge Type", field: "chargeType", width: 50 },
                { label: "Sub Type", field: "subType", width: 50 },
                { label: "Sub Total", field: "subTotal", width: 50 },
                { label: "Client Charge", field: "clientCharge", width: 50 },
                { label: "Description", field: "description", width: 90 },
                { label: "Total Labor Hours", field: "totalLaborHrs", width: 30, hidden: true },
                { label: "Created By", field: "createdBy", width: 50, hidden: true },
                { label: "Created Date", field: "createdDate", width: 50, hidden: true }

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

            widget.chargeType.set('store', widget.miniStores.getWOChargeType());

            /*  widget.chargeItemizationsGrid.on('dgrid-select', function (event) {
                 domStyle.set(dom.byId(widget.chargeInfoDiv), "display", "block");
                 widget.selectedItemRowData = event.rows[0].data;
                 //console.log(widget.selectedItemRowData);
                 var chargeInfo = JSON.stringify(widget.selectedItemRowData);
                 widget.chargeInfo.set("value", chargeInfo);
             });
 
             widget.chargeItemizationsGrid.on('dgrid-deselect', function (event) {
                 domStyle.set(dom.byId(widget.chargeInfoDiv), "display", "none");
             }); */

            on(widget.newChargeBtn, "click", function () {
                domStyle.set(dom.byId(widget.page1), "display", "none");
                domStyle.set(dom.byId(widget.page2), "display", "block");
                domStyle.set(dom.byId(widget.dialogActionbar), "display", "block");
                widget.createChargeForm.reset();
                widget.chargeType.set("disabled", false);
                widget.chargeSubType.set("disabled", false);
                domStyle.set(dom.byId(widget.laborDes), "display", "none");
                domStyle.set(dom.byId(widget.chargeTable.domNode), "display", "none");
                domStyle.set(dom.byId(widget.materialTable.domNode), "display", "none");
                domStyle.set(dom.byId(widget.laborTable.domNode), "display", "none");
                domStyle.set(dom.byId(widget.nextBtn.domNode), "display", "none");
                domStyle.set(dom.byId(widget.submitBtn.domNode), "display", "none");
                domStyle.set(dom.byId(widget.previousBtn.domNode), "display", "none");
            });

            on(widget.chargeType, "change", function (value) {
                widget.chargeSubType.reset();
                if (value) {
                    widget.setChargeSubTypeStore(value);
                    widget.displayConditionsChargeType(value);
                }
            });

            on(widget.chargeSubType, "change", function (value) {
                if (widget.chargeType.get("value") == "Labor")
                    widget.displayConditionsSubType(value);
                else {
                    widget.firstHrRate.set("required", false);
                    widget.totalLabourHours.set("required", false);
                    widget.halfHrRate.set("required", false);
                    widget.quotedAmount.set("required", false);
                    widget.hrsQuoted.set("required", false);
                }
            });

            on(widget.nextBtn, "click", function () {
                if (!widget.createChargeForm.isValid()) {
                    widget.createChargeForm.validate();
                    return;
                }
                widget.chargeType.set("disabled", true);
                widget.chargeSubType.set("disabled", true);
                domStyle.set(dom.byId(widget.laborDes), "display", "block");
                domStyle.set(dom.byId(widget.chargeTable.domNode), "display", "block");
                //widget.laborDescription.set("value", widget.getDescription());
                widget.setLaborDescription();
                domStyle.set(dom.byId(widget.laborTable.domNode), "display", "none");
                domStyle.set(dom.byId(widget.nextBtn.domNode), "display", "none");
                domStyle.set(dom.byId(widget.submitBtn.domNode), "display", "inline-block");
                domStyle.set(dom.byId(widget.previousBtn.domNode), "display", "inline-block");
            });

            on(widget.previousBtn, "click", function () {
                widget.chargeType.set("disabled", false);
                widget.chargeSubType.set("disabled", false);
                widget.laborDescription.reset();
                domStyle.set(dom.byId(widget.laborTable.domNode), "display", "block");
                domStyle.set(dom.byId(widget.nextBtn.domNode), "display", "inline-block");
                domStyle.set(dom.byId(widget.submitBtn.domNode), "display", "none");
                domStyle.set(dom.byId(widget.laborDes), "display", "none");
                domStyle.set(dom.byId(widget.chargeTable.domNode), "display", "none");
                domStyle.set(dom.byId(widget.previousBtn.domNode), "display", "none");
            });

            on(widget.submitBtn, "click", function () {
                var info = {};
                if (!widget.createChargeForm.isValid()) {
                    widget.createChargeForm.validate();
                    return;
                }
                widget.getInfoToCreate(info);
                var callback = function (obj) {
                    if (obj.response.code == 200) {
                        widget.getItemizedCharges();
                        topic.publish("/workOrder/ItemizedChargeUpdated-" + widget.data.id, obj);
                        domStyle.set(dom.byId(widget.page1), "display", "block");
                        domStyle.set(dom.byId(widget.page2), "display", "none");
                        domStyle.set(dom.byId(widget.dialogActionbar), "display", "none");
                    }
                };
                widget.ctrl.postAPI("createItemizedCharges", info, callback);
            });
        },
        showMarkup: function (event) {
            var widget = this;
            widget.markup.reset();
            if (widget.applyCharges2Client.checked)
                widget.markup.set("disabled", false);
            else
                widget.markup.set("disabled", true);
        },
        displayConditionsChargeType: function (value) {
            var widget = this;
            if (value == 'Labor') {
                widget.chargeSubType.set("disabled", false);
                widget.chargeSubType.set("required", true);
                widget.disableWidgets(widget.laborTable.domNode);
                widget.resetTable(widget.laborTable);
                widget.materialDescription.set("required", false);
                widget.materialCost.set("required", false);
                domStyle.set(dom.byId(widget.laborTable.domNode), "display", "block");
                domStyle.set(dom.byId(widget.materialTable.domNode), "display", "none");
                domStyle.set(dom.byId(widget.nextBtn.domNode), "display", "inline-block");
                domStyle.set(dom.byId(widget.submitBtn.domNode), "display", "none");
            } else if (value == "Materials") {
                domStyle.set(dom.byId(widget.laborTable.domNode), "display", "none");
                widget.chargeSubType.set("disabled", true);
                widget.chargeSubType.set("required", false);
                widget.totalLabourHours.set("required", false);
                widget.resetTable(widget.materialTable);
                widget.materialDescription.set("required", true);
                widget.materialCost.set("required", true);
                domStyle.set(dom.byId(widget.materialTable.domNode), "display", "block");
                domStyle.set(dom.byId(widget.nextBtn.domNode), "display", "none");
                domStyle.set(dom.byId(widget.submitBtn.domNode), "display", "inline-block");
            } else {
                widget.chargeSubType.set("disabled", false);
                widget.chargeSubType.set("required", true);
                widget.materialDescription.set("required", false);
                widget.materialCost.set("required", false);
                widget.totalLabourHours.set("required", false);
                domStyle.set(dom.byId(widget.materialTable.domNode), "display", "none");
                domStyle.set(dom.byId(widget.laborTable.domNode), "display", "none");
                domStyle.set(dom.byId(widget.nextBtn.domNode), "display", "none");
                domStyle.set(dom.byId(widget.submitBtn.domNode), "display", "inline-block");
            }
        },
        displayConditionsSubType: function (value) {
            var widget = this;
            var subTypeItem = widget.chargeSubType.item;
            //console.log(subTypeItem);
            widget.disableWidgets(widget.laborTable.domNode);
            widget.resetTable(widget.laborTable);
            widget.totalLabourHours.set("disabled", false);
            widget.totalLabourHours.set("required", true);
            if (value == 'Hourly Rate – Standard' || value == 'Hourly Rate – After-Hours' || value == 'Hourly Rate – Premium' || value == 'Hourly Rate – Custom') {
                widget.firstHrRate.set("disabled", false);
                widget.firstHrRate.set("required", true);
                widget.firstHrRate.set("value", subTypeItem.firstHourRate);

                widget.halfHrRate.set("disabled", false);
                widget.halfHrRate.set("required", true);
                widget.halfHrRate.set("value", subTypeItem.halfHourRate);
            } else if (value == 'Fixed Rate' || value == 'Blended Rate' || value == 'Quote' || value == 'POTS IW Package' || value == 'POTS Cross-Connect Package' || value == 'Installation Package') {
                if (value != 'POTS IW Package' && value != 'POTS Cross-Connect Package' && value != 'Installation Package') {
                    widget.quotedAmount.set("disabled", false);
                    widget.quotedAmount.set("required", true);
                }
                //widget.quotedAmount.set("required", false);
                widget.hrsQuoted.set("disabled", false);
                widget.hrsQuoted.set("required", true);
                widget.hrsQuoted.set("value", subTypeItem.firstHourRate);
                if (value != 'Fixed Rate' & value != 'Quote') {
                    widget.halfHrRate.set("disabled", false);
                    widget.halfHrRate.set("required", true);
                    widget.halfHrRate.set("value", subTypeItem.halfHourRate);
                }
                //widget.halfHrRate.set("required", false);
            }
        },
        getDescription: function () {
            var widget = this;
            var desc = "";
            var chargeType = widget.chargeType.get("value");
            var subType = widget.chargeSubType.get("value");
            if (widget.laborDescription.get("value") != "") {
                return widget.laborDescription.get("value")
            }

            if (chargeType == 'Labor') {
                var value = subType;
                if (value == 'Hourly Rate – Standard' || value == 'Hourly Rate – After-Hours' || value == 'Hourly Rate – Premium' || value == 'Hourly Rate – Custom') {
                    desc = "Labor Charged at $" + widget.firstHrRate.get("value") + " for 1st hour and $" + widget.halfHrRate.get("value") + " per half hour afterwards. Total Labor Hours: " + number.round(widget.totalLabourHours.get("value"), 2);
                } else if (value == 'Fixed Rate' || value == 'Blended Rate' || value == 'Quote') {
                    desc = "Quote approved for $" + widget.quotedAmount.get("value") + " for " + widget.hrsQuoted.get("value") + " hours.  Total Labor Hours: " + number.round(widget.totalLabourHours.get("value"), 2);
                } else if (value == 'POTS IW Package' || value == 'POTS Cross-Connect Package' || value == 'Installation Package') {
                    desc = value + " includes " + widget.hrsQuoted.get("value") + " labor hours and $" + widget.halfHrRate.get("value") + " per half hour afterwards. Total Labor Hours: " + number.round(widget.totalLabourHours.get("value"), 2);
                }
            } else if (chargeType == 'Materials') {
                desc = widget.materialDescription.get("value");
            } else if (chargeType == 'Penalties/Fees') {
                desc = subType;
            }
            return desc;
        },
        getInfoToCreate: function (info) {
            var widget = this;
            var subTotal = 0;
            var clientCharge = 0;
            var chargeType = widget.chargeType.get("value");
            var subType = widget.chargeSubType.get("value");
            var subTypeItem = widget.chargeSubType.item;
            var totLabHrs = parseFloat(widget.totalLabourHours.get("value"));
            var hrsQuoted = parseFloat(widget.hrsQuoted.get("value"));
            var quotedAmount = widget.quotedAmount.get("value");
            var rem = 0;
            var roundoff = 0;
            //calculating subTotal and clientCharge
            if (chargeType == 'Labor') {
                if (subType == 'Fixed Rate' || subType == 'Quote') {
                    subTotal = quotedAmount;
                    clientCharge = subTotal;
                } else if (subType == 'Blended Rate') {
                    if (totLabHrs > hrsQuoted) {
                        rem = totLabHrs - hrsQuoted;
                        roundoff = Math.ceil(rem * 2) / 2;
                        subTotal = quotedAmount + (widget.halfHrRate.get("value") * widget.getHalfHrCount(roundoff));
                    }
                    else
                        subTotal = quotedAmount;
                    clientCharge = subTotal;
                } else if (subType == 'POTS IW Package' || subType == 'POTS Cross-Connect Package' || subType == 'Installation Package') {
                    if (totLabHrs > hrsQuoted) {
                        rem = totLabHrs - hrsQuoted;
                        roundoff = Math.ceil(rem * 2) / 2;
                        subTotal = widget.halfHrRate.get("value") * widget.getHalfHrCount(roundoff);
                    }
                    else
                        subTotal = 0;
                    clientCharge = subTotal;
                } else {
                    if (totLabHrs <= 1 && totLabHrs > 0)
                        subTotal = widget.firstHrRate.get("value");
                    else if (totLabHrs > 1) {
                        rem = totLabHrs - 1;
                        roundoff = Math.ceil(rem * 2) / 2;
                        subTotal = widget.firstHrRate.get("value") + (widget.halfHrRate.get("value") * widget.getHalfHrCount(roundoff));
                    }
                    clientCharge = subTotal;
                }
            } else if (chargeType == 'Materials') {

                subTotal = widget.materialCost.get("value");
                if (widget.markup.checked == true) {
                    info.markup = 1;
                    clientCharge = number.round(subTotal / 0.6, 2);
                }
                else {
                    clientCharge = subTotal;
                    info.markup = 0;
                }
                info.materialCost = subTotal;
                info.applyCharges2Client = widget.applyCharges2Client.checked == true ? 1 : 0;
                if (info.applyCharges2Client == 0)
                    clientCharge = 0;
            } else if (chargeType == 'Penalties/Fees') {
                subTotal = subTypeItem.firstHourRate;
                clientCharge = subTotal;
            }
            //setting data to info
            info.workOrderNumber = widget.data.workOrderNo;
            info.woId = widget.data.id;
            info.description = widget.getDescription();
            info.chargeType = chargeType;
            info.subType = subType;
            info.subTotal = number.round(subTotal, 2);
            info.clientCharge = number.round(clientCharge, 2);
            info.firstHourRate = widget.firstHrRate.get("value");
            info.halfHourRate = widget.halfHrRate.get("value");
            info.quotedAmount = quotedAmount;
            info.totalLaborHrs = totLabHrs;
            info.laborHrsQuoted = hrsQuoted;
        },
        resetTable: function (laborTbl) {
            var widget = this;
            dojo.forEach(laborTbl._children, function (child) {
                child.reset();
            });
        },
        getHalfHrCount: function (value) {
            return number.round(value * 2);
        },
        roundToNearestHalf: function (num) {
            return Math.ceil(number.round(num) * 2) / 2;
        },
        setLaborDescription: function () {
            var widget = this;
            var info = {};
            widget.getInfoToCreate(info);
            widget.laborDescription.set("value", widget.getDescription());
            widget.subTotal.set("value", info.subTotal);
            widget.clientCharge.set("value", info.clientCharge);
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});