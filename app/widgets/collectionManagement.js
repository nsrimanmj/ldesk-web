define([
    "dojo/_base/declare",
    "dojo/parser",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/registry",
    "dojo/_base/lang",
    "dojo/dom-style",
    "dojo/topic",
    "dijit/ConfirmDialog",
    "dijit/Dialog",
    "dgrid/OnDemandGrid",
    "dojox/grid/EnhancedGrid",
    "dgrid/Selection",
    "dgrid/extensions/DijitRegistry",
    "dgrid/extensions/ColumnResizer",
    "dgrid/extensions/ColumnReorder",
    "dgrid/extensions/ColumnHider",
    "dgrid/Keyboard",
    "app/view/summaryRow",
    "dstore/Memory",
    "dojo/_base/array",
    "dojo/json",
    "dojo/on",
    "dojo/date",
    "dojo/date/locale",
    "dojo/dom-construct",
    "dojo/text!app/widgets/templates/collection_management.html",
    "dgrid/Selector",
    "app/model/Status",
    "app/model/miniStores",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, lang, domStyle, topic, ConfirmDialog, Dialog, OnDemandGrid, EnhancedGrid, Selection, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, Memory, arrayUtil, json, on, date, locale, domConstruct, template,
    Selector, StatusStore, MiniStores) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], {
        templateString: template,
        widgetsInTemplate: true,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;
            widget.ctrl = widget.lingoController;
            widget.agentStore = widget.ctrl.getAgentStore();
            widget.statusStore = new StatusStore();
            widget.miniStores = new MiniStores();
        },
        buildRendering: function () {
            this.inherited(arguments);
        },

        resize: function () {
            this.inherited(arguments);
        },
        init: function () {
        },
        populateData: function (data) {
            var widget = this;
            widget.data = data;
            widget.collectionData = widget.data.collectionInfo;
            widget.setWidgetValues(widget.data, widget.colManagementFormTable.domNode);
            widget.setWidgetValues(widget.collectionData, widget.colManagementFormTable.domNode);
            widget.ownerId.set("value", widget.data.ownerId);
            widget.status.set("value", widget.data.status);
            widget.promiseToPayTerms.set("value", widget.collectionData.promiseToPayTerms);
            if (widget.collectionData.denyDate) {
                var denyDate = new Date(widget.collectionData.denyDate);
                widget.denyDate.set("value", denyDate);
            }
            if (widget.collectionData.lastPaymentDate) {
                var lastPaymentDate = new Date(widget.collectionData.lastPaymentDate);
                widget.lastPaymentDate.set("value", lastPaymentDate);
            }
            if (widget.collectionData.disconnectDate) {
                var disconnectDate = new Date(widget.collectionData.disconnectDate);
                widget.disconnectDate.set("value", disconnectDate);
            }
            if (widget.collectionData.promiseToPayDate) {
                var promiseToPayDate = new Date(widget.collectionData.promiseToPayDate);
                widget.promiseToPayDate.set("value", promiseToPayDate);
            }
            if (widget.collectionData.finalDemandDate) {
                var finalDemandDate = new Date(widget.collectionData.finalDemandDate);
                widget.finalDemandDate.set("value", finalDemandDate);
            }

            if (data.followUpDate) {
                var date = new Date(data.followUpDate);
                widget.followUpDate1.set("value", date);
                // Set the time value
                var followUpTime = data.followUpDate.split(' ')[1];
                var timeParts = followUpTime.split(':');
                var time = new Date();
                time.setHours(timeParts[0], timeParts[1], timeParts[2]);
                widget.followUpTime1.set("value", time);
            }


        },
        getInfo: function (info) {
            var widget = this;
            info.groupName = widget.data.groupName;
            info.ownerId = widget.ownerId.get("value");
            info.status = widget.status.get("value");
            info.serviceNumber = "0";
            info.categoryId = 3;
            info.description = "test";
            info.queueName = "Collections";

        },
        getCollectionInfo: function (info) {
            var widget = this;
            widget.getWidgetvalues(info, widget.colManagementFormTable.domNode);
            if (widget.followUpDate1.get("displayedValue") && widget.followUpDate1.get("displayedValue") != "") {
                var date1 = widget.followUpDate1.get("displayedValue") + " " + widget.followUpTime1.get("displayedValue");
                var dt = new Date(date1);
                info.followUpDate = widget.formatDate(dt, "YYYY-MM-DD H24:MI:SS");
                console.log(info.followUpDate);
            }
            if (widget.denyDate.get("displayedValue")) {
                var denyDt = widget.getFormattedDateTime(widget.denyDate.get("value"));
                info.denyDate = denyDt
            }
            if (widget.lastPaymentDate.get("displayedValue")) {
                var ltPymtDt = widget.getFormattedDateTime(widget.lastPaymentDate.get("value"));
                info.lastPaymentDate = ltPymtDt;
            }
            if (widget.disconnectDate.get("displayedValue")) {
                var disConDt = widget.getFormattedDateTime(widget.disconnectDate.get("value"));
                info.disconnectDate = disConDt;
            }
            if (widget.promiseToPayDate.get("displayedValue")) {
                var prPayDate = widget.getFormattedDateTime(widget.promiseToPayDate.get("value"));
                info.promiseToPayDate = prPayDate;
            }
            if (widget.finalDemandDate.get("displayedValue")) {
                var fnDemDt = widget.getFormattedDateTime(widget.finalDemandDate.get("value"));
                info.finalDemandDate = fnDemDt;
            }
            var begVal = widget.beginningBal.get("value");
            info.beginningBal = widget.formatAmountToDouble(begVal);
            var due30 = widget.dueAmount30Days.get("value");
            info.dueAmount30Days = widget.formatAmountToDouble(due30);
            var due60 = widget.dueAmount60Days.get("value");
            info.dueAmount60Days = widget.formatAmountToDouble(due60);
            var totBal = widget.totalBalance.get("value");
            info.totalBalance = widget.formatAmountToDouble(totBal);
            var ltPymtAmt = widget.lastPaymentAmt.get("value");
            info.lastPaymentAmt = widget.formatAmountToDouble(ltPymtAmt);
            var prPyAmt = widget.promiseToPayAmt.get("value");
            info.promiseToPayAmt = widget.formatAmountToDouble(prPyAmt);


        },
        disableFields: function () {
            var widget = this;
            widget.beginningBal.set("disabled", true);
            widget.dueAmount30Days.set("disabled", true);
            widget.dueAmount60Days.set("disabled", true);
            widget.lastPaymentAmt.set("disabled", true);
            widget.lastPaymentDate.set("disabled", true);
            widget.totalBalance.set("disabled", true);
            widget.followUpDate1.set("disabled", false);
            widget.followUpTime1.set("disabled", false);

        },
        modifyColStatusStore: function () {
            var widget = this;
            var store = this.statusStore.getCollecStatusEditStore();
            widget.status.set("store", store);
        },
        disableViewFields: function () {
            var widget = this;
            widget.followUpDate1.set("disabled", true);
            widget.followUpTime1.set("disabled", true);
        },
        postCreate: function () {
            var widget = this;
            widget.disableWidgets(widget.colManagementFormTable.domNode);
            widget.disableViewFields();

            if (widget.data) {

                widget.populateData(widget.data);
            }
            widget.ownerId.set("store", widget.agentStore.getAgentsByGroup("Collections"));
            widget.status.set("store", widget.statusStore.getCollecStatusStore());
            widget.promiseToPayTerms.set("store", widget.miniStores.getPromiseToPayTerms());

        },
        destroy: function () {
            this.inherited(arguments);
        }
    });


});