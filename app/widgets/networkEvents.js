define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/on",
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
	"dstore/Memory",
	"dojo/store/Observable",
	"dijit/form/Button",
	"app/widgets/createNetworkEvent",
	"app/widgets/addtoNetworkEvent",
	"app/widgets/loaderAnimation",
	"dijit/layout/AccordionContainer",
	"dojo/dom-style",
	"dojo/text!app/widgets/templates/network_events.html",
	"dojo/domReady!"
], function (declare, _parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, on, topic, OnDemandGrid, Selection, Selector, DijitRegistry, ColumnResizer,
	ColumnReorder, ColumnHider, Keyboard, SummaryRow, StoreMemory, Observable, Button, CreateNetworkEvent, AddToNetworkEvent, Animation, _AccordionContainer, domStyle, template) { // jshint ignore:line

	var animation = new Animation('loading_icon');

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			var widget = this;
			lang.mixin(this, args);
			this.ctrl = this.lingoController;

			this.caseStore = new StoreMemory({
				idProperty: 'caseId',
				data: []
			});

			this.relatedCaseStore = new StoreMemory({
				idProperty: 'caseId',
				data: []
			});

			this.handle1 = topic.subscribe("lingoController/getNetworkEvents", lang.hitch(this, function (obj) {
				this.updateNetworkInfo(obj);
			}));
			this.handle2 = topic.subscribe("lingoController/caseCreated", lang.hitch(this, function (obj) {
				widget.ctrl.getNetworkEvents();
			}));
			this.handle3 = topic.subscribe("lingoController/netWorkEventUpdated", lang.hitch(this, function (obj) {
				widget.ctrl.getNetworkEvents();
			}));


		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.networkGrid.resize();
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
					widget.viewDlg.hide();
				}
				widget.ctrl.getCaseDetails(value, callback);
			}));
			return;
		},
		postCreate: function () {
			var widget = this;
			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow, Selector]);
			var disableRow = function () {
				var row = this.inherited(arguments);
				var data = arguments[0];
				if (data.status == "Cancelled" || data.status == "Closed") {
					domStyle.set(row, 'backgroundColor', '#f0f0f0');
					domStyle.set(row, 'color', '#a0a0a0');
					domStyle.set(row, 'cursor', 'not-allowed');
					domStyle.set(row, 'pointer-events', 'none');
				}

				return row;
			}
			var networkCasesLayout = [
				{ label: "Create Date", field: "createdDate", width: 60, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Case Number", field: "caseId", width: 35, renderCell: lang.hitch(this, this.renderCaseId) },
				{ label: "Owner Name", field: "ownerName", width: 60 },
				{ label: "Provider", field: "provider", width: 60 },
				{ label: "Status", field: "status", width: 40 },
				{ label: "Sub Status", field: "subStatus", width: 40, hidden: true },
				{ label: "Subject", field: "subject", width: 50 },
				{ label: "Sub Type", field: "subType", width: 50 },
				{ label: "Notification Message", field: "notificationMsg", width: 50 },
				{ label: "Related Cases", field: "childCount", width: 50, renderCell: lang.hitch(this, this.renderRalatedCases) },
				{ label: "Service Priority", field: "servicePriority", width: 50 },
				{ label: "Last Modified Date", field: "modifiedDate", width: 60, formatter: lang.hitch(this, this.dateFormatter) }
			];

			widget.networkGrid = new Grid({
				id: "networkGrid",
				loadingMessage: "Grid is loading",
				noDataMessage: "No Network Events Found!!",
				collection: widget.caseStore,
				className: 'lingogrid ldesk-auto-grid',
				keepScrollPosition: false,
				columns: networkCasesLayout,
				selectionMode: "single",
				rowSelector: '20px'
			}, widget.networkEventsDiv);

			var casesLayout = [
				{ label: "Case Id", field: "caseId", width: 50, renderCell: lang.hitch(this, this.renderCaseId) },
				{ label: "App Id", field: "accountId", width: 50 },
				{ label: "Service Number", field: "serviceNumber", width: 50 },
				{ label: "Create Date", field: "createdDate", width: 60 },
				{ label: "Status", field: "status", width: 40 },
				{ label: "Case Type", field: "groupName", width: 50 },
				{ label: "Last Modified Date", field: "modifiedDate", width: 60, formatter: lang.hitch(this, this.dateFormatter) },
				{ id: "select", label: "Select", field: "", width: 30, selector: 'checkbox' }

			];

			widget.casesGrid = new Grid({
				id: "relatedCaseGrid",
				loadingMessage: "Grid is loading",
				noDataMessage: "No cases Found!!",
				collection: widget.relatedCaseStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: casesLayout,
				selectionMode: "single",
				rowSelector: '20px',
				renderRow: disableRow,
				allowSelectAll: false
			}, widget.relatedCasesDiv);

			if (!widget.isActionAllowed("case-remove-network", "Network")) {
				widget.casesGrid.toggleColumnHiddenState("select", true);
			}

			on(widget.createNetworkBtn, "click", function () {

				var callback = function (data) {
					widget.init();
				}

				var network = new CreateNetworkEvent({
					lingoController: widget.ctrl,
					callback: callback
				});

			});

			on(widget.closeViewDlgBtn, "click", function () {
				widget.relatedCaseStore.setData([]);
				widget.casesGrid.refresh();
				widget.viewDlg.hide();
			});

			on(widget.removeCaseBtn, "click", function () {
				widget.removeCases();
			});

			var height = screen.height - 420;
			domStyle.set(this.networkEventsDiv, "height", height + "px");

			widget.networkGrid.startup();
			widget.networkGrid.refresh();

			on(widget.networkCasesreloadBtn, "click", function () {
				widget.ctrl.getNetworkEvents();
			});



		},
		renderRalatedCases: function (data, value, cell) {
			var widget = this;
			if (!value) {
				value = 0;
			}
			var div = cell.appendChild(document.createElement("div"));
			dojo.create("label", { innerHTML: value, style: "padding-top:5px;padding-bottom:5px;text-align: center" }, div);

			if (value > 0) {
				var w = new Button({
					label: "View",
					onClick: function () {
						widget.viewRelatedCases(data);
					}
				}).placeAt(div);
			}

			var w = new Button({
				label: "Add",
				action: "case-add-to-network",
				recordType: "Network",
				style: "padding-left:2px;",
				onClick: function () {
					widget.showAddCases(data);
				}
			}).placeAt(div);

			w._destroyOnRemove = true;
			return
		},
		showAddCases: function (data) {
			var widget = this;
			var callback = function (count) {
				data.childCount += count;
				widget.networkGrid.refresh();
			};
			new AddToNetworkEvent({ data: data, lingoController: this.ctrl, callback: callback });
		},

		updateNetworkInfo: function (data) {
			var widget = this;
			widget.caseStore.setData(data);
			widget.networkGrid.resize();
			widget.networkGrid.set('summary', "Total Cases: " + widget.caseStore.data.length);
			widget.networkGrid.resize();
			widget.networkGrid.refresh();
		},


		viewRelatedCases: function (data) {
			var widget = this;
			widget.relatedCaseStore.setData([]);
			widget.casesGrid.refresh();
			widget.viewDlg.show();
			widget.searchCases(data.caseId);
			widget.selectedMasterCaseId = data.caseId;
		},
		searchCases: function (caseId) {
			var widget = this;

			var request = {
				"masterCaseId": caseId
			}
			var requestStr = JSON.stringify(request);

			var callBack = function (obj) {
				animation.hide();
				if (obj.response.code == "200") {
					if (obj.data && obj.data.length > 0) {
						widget.relatedCaseStore.setData(obj.data);
						widget.casesGrid.set('summary', "Total Cases: " + obj.data.length);
						widget.casesGrid.refresh();
					}

				} else {
					new messageWindow({
						message: obj.response.message,
						title: "Error"
					});
				}
			};
			animation.show();
			this.sendRequest("searchCases", requestStr, callBack, "Error while getting Data", "get");
		},
		removeCases: function () {
			var widget = this;

			var selected = Object.keys(widget.casesGrid.selection);
			var caseList = [];
			selected.forEach(function (caseId) {
				var caseObj = widget.relatedCaseStore.getSync(caseId);
				caseList.push({ "caseId": caseObj.caseId });
			});

			var masterCaseId = widget.selectedMasterCaseId;

			var request = {
				"masterCaseId": masterCaseId,
				"caseList": caseList
			}
			var requestStr = JSON.stringify(request);

			var callBack = function (obj) {
				animation.hide();
				if (obj.response.code == "200") {
					if (widget.callback) {
						widget.callback(selected.length);
					}
					var data = widget.caseStore.getSync(masterCaseId);
					data.childCount -= selected.length;
					widget.networkGrid.refresh();

					if (selected.length > 0) {

						new messageWindow({
							message: "SUCCESS: Removed:  " + selected.length + " cases from Network Event ID: " + masterCaseId,
							title: "SUCCESS"
						});

						selected.forEach(function (caseId) {
							widget.relatedCaseStore.remove(caseId);
							widget.casesGrid.set('summary', "Total Cases: " + widget.relatedCaseStore.data.length);
							widget.casesGrid.refresh();
						});
					} else {
						new messageWindow({
							message: "Please Select a case required to be removed",
							title: "NOTE"
						});
					}
					//widget.viewDlg.hide();

				} else {
					new messageWindow({
						message: obj.response.message,
						title: "Error"
					});
				}
			};
			animation.show();
			this.sendRequest("removeMasterCaseId", requestStr, callBack, "Error while getting Data", "put");
		},
		destroy: function () {
			this.inherited(arguments);
			// console.log("NetworkEvents: destroy!");
			if (this.handle1) this.handle1.remove();
			if (this.handle2) this.handle2.remove();
			if (this.handle3) this.handle3.remove();
		},
		destroyRecursive: function () {
			this.viewDlg.destroyRecursive();
			this.inherited(arguments);
			console.log("NetworkEvents: destroyRecursive!");
		}

	});

});
