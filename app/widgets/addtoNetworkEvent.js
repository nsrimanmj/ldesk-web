define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/on",
	"dijit/form/Button",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/Selector",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	"app/view/summaryRow",
	"dstore/Memory",
	"dojo/store/Observable",
	"app/widgets/loaderAnimation",
	"dojo/dom-style",
	"dojo/text!app/widgets/templates/add_to_network_event.html",
	"dojo/domReady!"
], function (declare, _parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, on, Button, OnDemandGrid, Selection, Selector, DijitRegistry, ColumnResizer, ColumnReorder
	, ColumnHider, Keyboard, SummaryRow, StoreMemory, Observable, Animation, domStyle, template) { // jshint ignore:line

	var animation = new Animation('loading_icon');

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			this.ctrl = this.lingoController;

			this.caseStore = new StoreMemory({
				idProperty: 'caseId',
				data: []
			});

		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.networkGrid.refresh();
		},
		init: function () {
			var widget = this;
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
					widget.addToDlg.destroyRecursive();
				}
				widget.ctrl.getCaseDetails(value, callback);
			}));
			return;
		},
		renderAccountId: function (data, value, cell) {
			if (!value) {
				return;
			}
			var widget = this;
			var div = cell.appendChild(document.createElement("div"));
			var linkNode = dojo.create("a", { href: "javascript:void(null);", title: value, innerHTML: value }, div);

			on(linkNode, "click", lang.hitch(this, function () {
				this.viewAccountDetails(value, widget.ctrl);
				widget.addToDlg.destroyRecursive();
			}));
			return;

		},
		postCreate: function () {
			var widget = this;

			var Grid = declare([OnDemandGrid, Selection, Selector, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow]);

			var casesLayout = [
				{ label: "Create Date", field: "createdDate", width: 60, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Case Id", field: "caseId", width: 50, renderCell: lang.hitch(this, this.renderCaseId) },
				{ label: "App Id", field: "accountId", width: 50, renderCell: lang.hitch(this, this.renderAccountId) },
				{ label: "Service Number", field: "serviceNumber", width: 50 },
				{ label: "Status", field: "status", width: 40 },
				{ label: "Service Address", field: "serviceAddress", width: 80 },
				{ label: "Trouble Reported", field: "subType", width: 120 },
				{ label: "Last Modified Date", field: "modifiedDate", width: 60, formatter: lang.hitch(this, this.dateFormatter), hidden: true },
				{ label: "Select", field: "", width: 30, selector: 'checkbox' }
			];

			widget.casesGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No cases Found!!",
				collection: widget.caseStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: casesLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowSelectAll: false
			}, widget.caseResultDiv);

			on(widget.addBtn, "click", function () {
				widget.addToNetworkEvent();

			});

			on(widget.searchBtn, "click", function () {
				widget.searchCases();
			});

			on(widget.closeBtn, "click", function () {
				widget.addToDlg.destroyRecursive();
				this.destroy();
			});


			widget.casesGrid.startup();
			widget.casesGrid.refresh();
			widget.addToDlg.show();
		},
		renderCheckbox: function (column, selected, cell, object) {
			column.selector = "checkbox";
			var inputNode = column.grid._defaultRenderSelectorInput(column, selected, cell, object);
			return inputNode;
		},
		renderRalatedCases: function (data, value, cell) {
			var widget = this;
			if (!value) {
				value = 0;
			}
			var div = cell.appendChild(document.createElement("div"));
			dojo.create("label", {
				innerHTML: value,
				style: "padding-top:5px;padding-bottom:5px;text-align: center"
			}, div);

			var w = new Button({
				label: "Add Cases",
				onClick: function () {
					widget.showAddCases(data.caseId);
				}
			}).placeAt(div);;
			w._destroyOnRemove = true;
			return
		},
		searchCases: function () {
			var widget = this;
			var accountId = widget.addDlgAppId.get("value");
			var groupName = widget.addDlgCaseType.get("displayedValue");
			var caseId = widget.addDlgCaseId.get("value");


			if (groupName == "--None--") {
				groupName = "";
			}
			var request = {
				"groupName": groupName,
				"accountId": accountId,
				"activeOnly": true,
				"caseId": caseId
			}

			var callBack = function (obj) {
				if (obj.response.code == "200") {
					var caseData = obj.data.filter(function (caseObj) {
						return caseObj.masterCaseId == 0 && caseObj.groupName != "Network";
					});

					widget.caseStore.setData(caseData);
					widget.casesGrid.set('summary', "Total Cases: " + caseData.length);
					widget.casesGrid.refresh();
				}
			};
			widget.ctrl.getAPI("searchCases", request, callBack);
		},
		addToNetworkEvent: function () {
			var widget = this;

			var selected = Object.keys(widget.casesGrid.selection);
			var caseList = [];
			selected.forEach(function (caseId) {
				var caseObj = widget.caseStore.getSync(caseId);
				caseList.push({
					"caseId": caseObj.caseId,
					"groupName": caseObj.groupName
				});
			});

			var masterCaseId = widget.data.caseId;
			var request = {
				"masterCaseId": masterCaseId,
				"categoryId": widget.data.categoryId,
				"statusId": widget.data.statusId,
				"queueName": widget.data.queueName,
				"ownerId": widget.data.ownerId,
				"subStatusId": widget.data.subStatusId,
				"servicePriorityId": widget.data.servicePriorityId,
				"caseList": caseList
			}
			var requestStr = JSON.stringify(request);

			var callBack = function (obj) {
				animation.hide();
				if (obj.response.code == "200") {
					if (widget.callback) {
						widget.callback(selected.length);
					}
					if (selected.length > 0) {
						new messageWindow({
							message: "SUCCESS: Added:  " + selected.length + " cases to Network Event ID: " + masterCaseId,
							title: "SUCCESS"
						});
						widget.addToDlg.destroyRecursive();
						widget.destroy();

					} else {
						new messageWindow({
							message: "Please Select the required Cases and add cases to Network Event ID:" + masterCaseId,
							title: "NOTE"
						});
					}
				} else {
					new messageWindow({
						message: obj.response.message,
						title: "Error"
					});
				}
			};
			animation.show();
			this.sendRequest("setMasterCaseId", requestStr, callBack, "Error while getting Data", "put");
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
