define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/registry",
	"dstore/Memory",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/Selector",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	"app/view/summaryRow",
	"dijit/form/Form",
	"dojox/layout/TableContainer",
	"dijit/form/TextBox",
	"dijit/form/Textarea",
	"dijit/form/Select",
	"dojo/data/ObjectStore",
	"dstore/legacy/DstoreAdapter",
	"app/widgets/caseManagement",
	"app/widgets/loaderAnimation",
	"dojo/text!app/widgets/templates/add_network_event.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, Memory, lang, domStyle, on, OnDemandGrid, Selection, Selector, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, Form, TableContainer, TextBox, Textarea, Select, ObjectStore, DstoreAdapter, CaseManagement, Animation, template) { // jshint ignore:line

	var widget = null;
	var animation = new Animation('loading_icon');
	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			widget.data = widget.info;
			widget.networkStore = new Memory({
				idProperty: "caseId",
				data: widget.ctrl.networkEventsInfo
			});
		},

		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {

		},

		postCreate: function () {
			var widget = this;
			this.inherited(arguments);
			on(widget.cancelBtn, "click", function () {
				widget.addNetworkDialog.hide();
			});
			var Grid = declare([OnDemandGrid, Selection, Selector, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow]);
			var networkLayout = [
				{ label: "Create Date", field: "createdDate", width: 80, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Case Id", field: "caseId", width: 50 },
				{ label: "Provider", field: "provider", width: 60 },
				{ label: "Status", field: "status", width: 40 },
				{ label: "Subject", field: "subject", width: 80 },
				{ label: "Sub Type", field: "subType", width: 70 },
				{ label: "Notification Message", field: "notificationMsg", width: 120 },
				{ label: "Last Modified Date", field: "modifiedDate", width: 60, formatter: lang.hitch(this, this.dateFormatter) }
			];

			widget.networkCasesDetailsGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No cases Found!!",
				collection: widget.networkStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: networkLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowSelectAll: false
			}, widget.networkDiv);

			widget.networkCasesDetailsGrid.on('dgrid-select', function (event) {
				var caseList = [];
				caseList.push({
					"caseId": widget.data.caseId,
					"groupName": widget.data.groupName
				});
				var selected = Object.keys(widget.networkCasesDetailsGrid.selection)[0];
				if (!selected) {
					return;
				}
				var data = widget.networkStore.getSync(selected);
				var request = {
					"masterCaseId": data.caseId,
					"categoryId": data.categoryId,
					"statusId": data.statusId,
					"queueName": data.queueName,
					"ownerId": data.ownerId,
					"subStatusId": data.subStatusId,
					"servicePriorityId": data.servicePriorityId,
					"caseList": caseList
				}

				on(widget.addBtn, "click", lang.hitch(this, function () {
					widget.selectCase(request);
				}));
			});
			widget.addNetworkDialog.show();
		},
		selectCase: function (data) {
			var widget = this;
			widget.data.masterCaseId = data.masterCaseId;
			var requestStr = JSON.stringify(data);
			var callBack = function (obj) {
				animation.hide();
				widget.ctrl.showSuccessMessage(obj);
				widget.addNetworkDialog.hide();
				if (obj.response.code == "200") {
					widget.ctrl.getNetworkEvents();
				}

				widget.caseManagementWidget.setMasterCaseId(widget.data);
			};
			animation.show();
			this.sendRequest("setMasterCaseId", requestStr, callBack, "Error while getting Data", "put");
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
