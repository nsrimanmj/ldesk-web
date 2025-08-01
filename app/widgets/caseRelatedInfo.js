define([
    "dojo/_base/declare",
    "dojo/parser",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dstore/Memory",
    "dojo/_base/lang",
    "dojo/dom-style",
    "dojo/on",
    "dgrid/OnDemandGrid",
    "dgrid/Selection",
    "dgrid/extensions/DijitRegistry",
    "dgrid/extensions/ColumnResizer",
    "dgrid/extensions/ColumnReorder",
    "dgrid/extensions/ColumnHider",
    "dgrid/Keyboard",
    "app/view/summaryRow",
    "dojox/widget/TitleGroup",
    "dijit/TitlePane",
    "dojo/text!app/widgets/templates/case_related_info.html",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, OnDemandGrid, Selection, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, TitleGroup, TitlePane, template) { // jshint ignore:line

    var widget = null;

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
        templateString: template,
        widgetsInTemplate: true,
        info: null,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;

            widget.data = widget.info;
            widget.ctrl = widget.lingoController;
            widget.statusChangeStore = new Memory({
                idProperty: 'caseId',
                data: []
            });
            widget.escalationStore = new Memory({
                idProperty: 'escalationId',
                data: []
            });

            widget.relatedCasesStore = new Memory({
                idProperty: 'caseId',
                data: []
            });

            widget.historyStore = new Memory({
                idProperty: 'entryId',
                data: []
            });

            //widget.getStatusChanges(widget.data.caseId);
        },
        buildRendering: function () {
            this.inherited(arguments);
        },
        /* resize: function () {
             this.inherited(arguments);
             this.caseStatusChangeGrid.resize();
             this.caseEscReqGrid.resize();
             this.relatedCasesGrid.resize();
         },*/
        init: function (caseId) {
            var widget = this;
            widget.getStatusChanges(caseId);
            widget.getEscalations(caseId);
            widget.getCaseHistory(caseId);
            if (widget.data.groupName == 'Network') {
                widget.getRelatedCases(caseId);
            }
        },
        getStatusChanges: function (caseId) {
            var widget = this
            var requestObj = {
                "caseId": caseId
            };
            var callBack = function (obj) {
                if (obj.response.code == "200") {
                    widget.statusChangeStore.setData(obj.data);
                    widget.caseStatusChangeGrid.set("collection", widget.statusChangeStore);
                    widget.caseStatusChangeGrid.refresh();
                    widget.caseStatusChangeGrid.resize();
                }
            }
            widget.ctrl.getAPI("getStatusChangeDetails", requestObj, callBack);
        },
        getEscalations: function (caseId) {
            var widget = this
            var requestObj = {
                "caseId": caseId
            };
            var callBack = function (obj) {
                if (obj.response.code == "200") {
                    widget.escalationStore.setData(obj.data);
                    widget.caseEscReqGrid.set("collection", widget.escalationStore);
                    widget.caseEscReqGrid.refresh();
                    widget.caseEscReqGrid.resize();
                }
            }
            widget.ctrl.getAPI("getCaseEscalationDetails", requestObj, callBack);
        },

        getRelatedCases: function (caseId) {
            var widget = this;

            var request = {
                "masterCaseId": caseId
            }
            var requestStr = JSON.stringify(request);

            var callBack = function (obj) {

                if (obj.response.code == "200") {
                    if (obj.data && obj.data.length > 0) {
                        widget.relatedCasesStore.setData(obj.data);
                        widget.relatedCasesGrid.set("collection", widget.relatedCasesStore);
                        widget.relatedCasesGrid.set('summary', "Total Cases: " + obj.data.length);
                        widget.relatedCasesGrid.refresh();
                        widget.relatedCasesGrid.resize();
                    }

                }
            };

            this.sendRequest("searchCases", requestStr, callBack, "Error while getting Data", "get");

        },
        getCaseHistory: function (caseId) {
            var widget = this;
            var request = { "caseId": caseId };
            var callBack = function (obj) {
                if (obj.response.code == "200") {
                    widget.historyStore.setData(obj.data);
                    widget.caseHistoryGrid.set("collection", widget.historyStore);
                    widget.caseHistoryGrid.refresh();
                    widget.caseHistoryGrid.resize();
                }
            }
            widget.ctrl.getAPI("caseHistory", request, callBack);

        },
        renderCaseId: function (data, value, cell) {
            if (!value) {
                return;
            }

            var caseId = this.formatCaseNumber(value);
            var widget = this;
            var div = cell.appendChild(document.createElement("div"));
            var linkNode = dojo.create("a", { href: "javascript:void(null);", title: caseId, innerHTML: caseId }, div);

            on(linkNode, "click", lang.hitch(this, function () {
                var callback = function (obj) {
                    widget.viewCaseDetails(caseId, widget.ctrl, obj.data);
                    // widget.viewDlg.hide();
                }
                widget.ctrl.getCaseDetails(value, callback);
            }));
            return;
        },

        postCreate: function () {
            var widget = this;

            var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow]);
            if (widget.data.groupName != 'Network') {
                domStyle.set(widget.caseRelatedReqPanel.domNode, "display", "none");
            }

            //Related tab consists following grids
            //Case status chnages Grid
            var stausChangeLayout = [
                { label: "Case Name", field: "caseName", width: 110 },
                { label: "Created Date", field: "createdDate", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
                { label: "Status Changed From", field: "statusOld", width: 90 },
                { label: "Status Changed To", field: "statusNew", width: 90 },
                { label: "Status Time(Numeric Hours)", field: "statusTime", width: 90 }
            ];
            widget.caseStatusChangeGrid = new Grid({
                noDataMessage: "No staus Changes Found!!",
                columns: stausChangeLayout,
                className: "lingogrid",
                keepScrollPosition: true,
                selectionMode: "none",
                height: "100%",
                autoWidth: true,
                rowSelector: '20px'
            }, widget.caseRelatedStatusChangediv);
            widget.caseStatusChangeGrid.startup();

            //Escalation Requests Grid
            var escReqLayout = [
                { label: "Escalation Request", field: "escalationId", width: 110 },
                { label: "Created By", field: "createdBy", width: 80 },
                { label: "Created Date", field: "createdDate", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
                { label: "Requested Level", field: "escalationLevel", width: 90 },
                { label: "Reason for Escalation", field: "escalationNote", width: 90 }
            ];
            widget.caseEscReqGrid = new Grid({
                noDataMessage: "No Escalations Found!!",
                columns: escReqLayout,
                className: "lingogrid",
                keepScrollPosition: true,
                selectionMode: "none",
                height: "100%",
                autoWidth: true,
                rowSelector: '20px'
            }, widget.caseRelatedEscReqdiv);

            widget.caseEscReqGrid.startup();

            //related Cases grid

            var relatedCasesLayout = [
                { label: "Case Id", field: "caseId", width: 50, renderCell: lang.hitch(this, this.renderCaseId) },
                { label: "App Id", field: "accountId", width: 50 },
                { label: "Service Number", field: "serviceNumber", width: 50 },
                { label: "Create Date", field: "createdDate", width: 60, formatter: lang.hitch(this, this.dateFormatter) },
                { label: "Status", field: "status", width: 40 },
                { label: "Case Type", field: "groupName", width: 50 },
                { label: "Last Modified Date", field: "modifiedDate", width: 60 }
            ];


            widget.relatedCasesGrid = new Grid({
                noDataMessage: "No Related Cases Found!!",
                columns: relatedCasesLayout,
                className: "lingogrid",
                keepScrollPosition: true,
                selectionMode: "none",
                height: "100%",
                autoWidth: true,
                rowSelector: '20px'
            }, widget.caseRelatedReqdiv);

            widget.relatedCasesGrid.startup();

            //Case History Grid
            var historyLayout = [
                { label: "Date", field: "modifiedDate", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
                { label: "Field", field: "field", width: 90 },
                { label: "User", field: "userName", width: 80 },
                { label: "Original Value", field: "oldValue", width: 90 },
                { label: "New Value", field: "newValue", width: 90 },
                { label: "Description", field: "description", width: 110, hidden: true }
            ];
            widget.caseHistoryGrid = new Grid({
                noDataMessage: "No Data!!",
                columns: historyLayout,
                className: "lingogrid",
                keepScrollPosition: true,
                selectionMode: "none",
                height: "100%",
                autoWidth: true,
                rowSelector: '20px'
            }, widget.caseRelatedHistorydiv);

            widget.caseHistoryGrid.startup();
        },

        destroy: function () {
            this.inherited(arguments);
        }
    });

});
