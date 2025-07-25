define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dojox/widget/TitleGroup",
	"dijit/TitlePane",
	"dijit/layout/TabContainer",
	"dijit/layout/LayoutContainer",
	"dijit/layout/ContentPane",
	"dojo/dom-construct",
	"dijit/form/Button",
	"dijit/form/Select",
	"dijit/form/TextBox",
	"dijit/form/RadioButton",
	"dijit/form/SimpleTextarea",
	"dijit/form/NumberTextBox",
	"dijit/form/ComboBox",
	"dijit/Fieldset",
	"dijit/Menu",
	"dijit/MenuItem",
	"dijit/registry",
	"dgrid/OnDemandGrid",
	"dojox/grid/EnhancedGrid",
	"dgrid/Selection",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	"app/view/summaryRow",
	"app/view/diaryEditor",
	"dstore/Memory",
	"dojo/store/Observable",
	"dijit/form/DateTextBox",
	"app/model/Status",
	"app/widgets/quickUpdate",
	"app/widgets/loaderAnimation",
	"dstore/Memory",
	"dojo/topic",
	"dojo/text!app/widgets/templates/my_cases.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, domStyle, on, TitleGroup, TitlePane, TabContainer, LayoutContainer,
	ContentPane, domConstruct, Button, Select, TextBox, RadioButton, Textarea, NumberTextBox, ComboBox, Fieldset, Menu, MenuItem, registry,
	OnDemandGrid, EnhancedGrid, Selection, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, diaryEditor,
	Memory, Observable, DateTextBox, StatusStore, _quickUpdate, Animation, StoreMemory, topic, template) { // jshint ignore:line

	var animation = new Animation('loading_icon');

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;

			this.ctrl = this.lingoController;

			this.agentStore = this.ctrl.getAgentStore();
			widget.agentId = parseInt(window.localStorage.getItem("agentId"));
			widget.agentName = window.localStorage.getItem("agentName");

			widget.handle = topic.subscribe("lingoController/agentListLoaded", lang.hitch(this, function (info) {
				widget.setAgentStore();
			}));

			this.agentCaseStore = Observable(new StoreMemory({
				idProperty: 'caseId',
				data: []
			}));

			this.submittedCaseStore = Observable(new StoreMemory({
				idProperty: 'caseId',
				data: []
			}));

			widget.statusStore = new StatusStore();
			widget.handle1 = topic.subscribe("lingoController/caseCreated", lang.hitch(this, function (info) {
				widget.getSubmittedCases();
			}));
			//Cases Info after every update
			widget.handle2 = topic.subscribe("lingoController/caseUpdated", lang.hitch(this, function (info) {
				widget.getAgentCases();
				widget.getSubmittedCases();
			}));
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			//	this.agentCasesGrid.resize();
			//	this.agentSubmittedCasesGrid.resize();
			//	this.agentCasesGrid.refresh();
			//	this.agentSubmittedCasesGrid.refresh();
			this.myCasesTab.resize();
			//this.agentCasesGrid.resize();
		},
		init: function () {

			this.getAgentCases();
			this.getSubmittedCases();
			this.agentCasesGrid.resize();
			this.agentSubmittedCasesGrid.resize();
			this.agentCasesGrid.refresh();
			this.agentSubmittedCasesGrid.refresh();

		},
		setAgentId: function () {

			var widget = this;

			var selAgentId = widget.myAgentList.get("value");
			if (selAgentId == '') {
				widget.myAgentList.set("displayedValue", widget.agentName);
				widget.agentNameSpan.innerHTML = widget.agentName;
			} else {
				widget.myAgentList.set("value", selAgentId);
			}

		},
		setAgentStore: function () {
			var widget = this;
			widget.myAgentList.set("store", widget.agentStore.getStore());
			widget.myAgentList.set("value", widget.agentId);
			widget.agentNameSpan.innerHTML = widget.agentName;
		},
		postCreate: function () {
			var widget = this;

			widget.agentNameSpan.innerHTML = widget.agentName;

			on(widget.myAgentList, "change", function (value) {
				widget.selecAgent = value;
			});

			on(widget.agentCasesreloadBtn, "click", function () {
				widget.getAgentCases();
			});

			on(widget.agentSubmittedreloadBtn, "click", function () {
				widget.getSubmittedCases();
			});

			on(widget.searchBtn, "click", function () {
				var agentData = widget.agentStore.getStore();
				var data1 = agentData.data.filter(dataRow => { return dataRow.userId == widget.selecAgent });
				var selAgentName;
				if (data1.length > 0) {
					selAgentName = data1[0].fullName;
				}

				if (selAgentName != null) {
					widget.agentNameSpan.innerHTML = selAgentName;
				}

				widget.getAgentCases();

			});

			widget.myCasesTab.startup();
			widget.myCasesTab.resize();

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow]);

			var casesLayout = [
				{ label: "Date/Time Opened", field: "createdDate", width: 130, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Case Number", field: "caseId", width: 90, renderCell: lang.hitch(this, this.renderCaseId) },
				{ label: "App Id", field: "accountId", width: 80, renderCell: lang.hitch(this, this.renderAccountId) },
				{ label: "Parent App Id", field: "parentAccountId", width: 80, renderCell: lang.hitch(this, this.renderAccountId) },
				{ label: "Record Type", field: "groupName", width: 80 },
				{ label: "Queue", field: "queueName", width: 80 },
				{ label: "Status", field: "status", width: 80 },
				{ label: "Category", field: "categoryName", width: 90 },
				{ label: "Type", field: "type", width: 90, hidden: true },
				{ label: "Subtype", field: "subType", width: 90, hidden: true },
				{ label: "Sub Status", field: "subStatus", width: 80 },
				{ label: "Child Account Name", field: "accountName", width: 80 },
				{ label: "Parent Account Name", field: "parentAccountName", width: 80 },
				{ label: "Service Number", field: "serviceNumber", width: 80 },
				{ label: "Service Priority", field: "servicePriority", width: 80 },
				{ label: "Provider", field: "provider", width: 80 },
				{ label: "Submitted By", field: "createdUser", width: 90 },
				{ label: "Assignee", field: "ownerName", width: 80 },
				{ label: "Contact Name", field: "contactName", width: 80, hidden: true },
				{ label: "Contact Phone", field: "contactPhone", width: 80, formatter: lang.hitch(this, this.phoneNumberFormatter), hidden: true },
				{ label: "Contact Email", field: "contactEmail", width: 80, hidden: true },
				{ label: "Modified Date", field: "modifiedDate", width: 130, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "FollowUp Date", field: "followUpDate", width: 130, formatter: lang.hitch(this, this.dateFormatter) }
			];

			//domStyle.set(widget.agentCasesDiv, "height", "500px");
			widget.agentCasesGrid = new Grid({
				id: "agentCasesGrid",
				loadingMessage: "Grid is loading",
				noDataMessage: "No Cases found !!",
				collection: widget.agentCaseStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: casesLayout,
				allowTextSelection: true,
				selectionMode: "single",
				rowSelector: '20px'
			}, widget.agentCasesDiv);

			widget.agentCasesGrid.startup();
			widget.agentCasesGrid.refresh();
			widget.agentCasesGrid.resize();

			/* widget.agentCasesGrid.on('dgrid-select', lang.hitch(this, function (event) {
				if (event.rows[0] && event.rows[0].data) {
					var caseId = event.rows[0].data.caseId;
					var data = widget.agentCaseStore.getSync(caseId);
					widget.quickUpdate.setCaseData(data, lang.hitch(this, widget.processUpdateResult));
				}
			})); */

			var agentSubmittedCasesLayout = [
				{ label: "Date/Time Opened", field: "createdDate", width: 130, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Case Number", field: "caseId", width: 90, renderCell: lang.hitch(this, this.renderCaseId) },
				{ label: "App Id", field: "accountId", width: 80, renderCell: lang.hitch(this, this.renderAccountId) },
				{ label: "Parent App Id", field: "parentAccountId", width: 80, renderCell: lang.hitch(this, this.renderAccountId) },
				{ label: "Record Type", field: "groupName", width: 80 },
				{ label: "Queue", field: "queueName", width: 80 },
				{ label: "Status", field: "status", width: 80 },
				{ label: "Category", field: "categoryName", width: 90 },
				{ label: "Type", field: "type", width: 90, hidden: true },
				{ label: "Subtype", field: "subType", width: 90, hidden: true },
				{ label: "Sub Status", field: "subStatus", width: 80 },
				{ label: "Child Account Name", field: "accountName", width: 80 },
				{ label: "Parent Account Name", field: "parentAccountName", width: 80 },
				{ label: "Service Number", field: "serviceNumber", width: 80 },
				{ label: "Service Priority", field: "servicePriority", width: 80 },
				{ label: "Provider", field: "provider", width: 80 },
				{ label: "Submitted By", field: "createdUser", width: 90 },
				{ label: "Assignee", field: "ownerName", width: 80 },
				{ label: "Contact Name", field: "contactName", width: 80, hidden: true },
				{ label: "Contact Phone", field: "contactPhone", width: 80, formatter: lang.hitch(this, this.phoneNumberFormatter), hidden: true },
				{ label: "Contact Email", field: "contactEmail", width: 80, hidden: true },
				{ label: "Modified Date", field: "modifiedDate", width: 130, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "FollowUp Date", field: "followUpDate", width: 130, formatter: lang.hitch(this, this.dateFormatter) }

			];

			widget.agentSubmittedCasesGrid = new Grid({
				id: "agentSubmittedCasesGrid",
				loadingMessage: "Grid is loading",
				noDataMessage: "No Cases found!!",
				collection: widget.submittedCaseStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: agentSubmittedCasesLayout,
				allowTextSelection: true,
				selectionMode: "single",
				rowSelector: '20px'
			}, widget.agentSubmittedDiv);

			widget.agentSubmittedCasesGrid.startup();
			widget.agentSubmittedCasesGrid.refresh();
			widget.agentSubmittedCasesGrid.resize();


			/* widget.agentSubmittedCasesGrid.on('dgrid-select', lang.hitch(this, function (event) {

				if (event.rows[0] && event.rows[0].data) {
					var caseId = event.rows[0].data.caseId;
					var data = widget.submittedCaseStore.getSync(caseId);
					widget.quickUpdate.setCaseData(data, lang.hitch(this, widget.processUpdateResult));
				}
			})); */

			// this.getAgentCases();
			// this.getSubmittedCases();

		},
		processUpdateResult: function () {
			this.getAgentCases();
			this.getSubmittedCases();
		},
		renderAccountId: function (data, value, cell) {
			if (!value) {
				return;
			}
			var widget = this;

			var div = cell.appendChild(document.createElement("div"));
			if (value != 0) {
				var linkNode = dojo.create("a", { href: "javascript:void(null);", title: value, innerHTML: value }, div);

				on(linkNode, "click", lang.hitch(this, function () {
					this.viewAccountDetails(value, widget.ctrl);
				}));
			} else {
				dojo.create('span', {
					innerHTML: value, style: 'color: blue'
				}, div);
			}
			return;
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
				}
				widget.ctrl.getCaseDetails(value, callback);
			}));
			return;
		},
		renderAgentName: function (data, value, cell) {
			var widget = this;
			var agentData = widget.agentStore.getStore();
			var data1 = agentData.data.filter(dataRow => { return dataRow.userId == value });
			var agentName = value;
			if (data1.length > 0) {
				agentName = data1[0].fullName;
			}
			var div = cell.appendChild(document.createElement("div"));
			dojo.create("label", {
				innerHTML: agentName
				//style: "padding-top:5px;padding-bottom:5px;text-align: center"
			}, div);

		},
		getAgentCases: function () {

			var widget = this;

			var agentId = parseInt(window.localStorage.getItem("agentId"));
			var selAgentId = widget.myAgentList.get("value");
			var reqAgentId = selAgentId == "" ? agentId : selAgentId;
			var request = {
				"ownerId": reqAgentId,
				"activeOnly": true
			}

			var requestStr = JSON.stringify(request);

			var callBack = function (obj) {
				animation.hide();
				if (obj.response.code == "200") {
					var data = [];
					if (obj.data && obj.data.length > 0) {
						data = obj.data;
					}

					widget.agentCaseStore.setData(data);
					widget.agentCasesGrid.set('summary', "Total Cases: " + data.length);
					widget.agentCasesGrid.refresh();
					widget.agentCasesGrid.resize();

				} else {
					widget.agentCaseStore.setData([]);
					widget.agentCasesGrid.set('summary', "Total Cases: " + 0);
					widget.agentCasesGrid.refresh();
					widget.agentCasesGrid.resize();

				}
			};
			animation.show();
			this.sendRequest("searchCases", requestStr, callBack, "Error while getting Data", "get");

		},
		getSubmittedCases: function () {

			var widget = this;

			var agentId = parseInt(window.localStorage.getItem("agentId"));
			var agent = window.localStorage.getItem("agent");

			var request = {
				"createdBy": agentId,
				"activeOnly": true
			}

			var requestStr = JSON.stringify(request);

			var callBack = function (obj) {
				animation.hide();
				if (obj.response.code == "200") {
					// if (obj.data && obj.data.length > 0) {
					var data = [];
					if (obj.data && obj.data.length > 0) {
						data = obj.data;
					}
					widget.submittedCaseStore.setData(data);
					widget.agentSubmittedCasesGrid.set('summary', "Total Cases: " + data.length);
					widget.agentSubmittedCasesGrid.refresh();
					widget.agentSubmittedCasesGrid.resize();
					//}

				} /*else {
					new messageWindow({
						message: obj.response.message,
						title: "Error"
					});
					widget.agentSubmittedCasesGrid.refresh();
					widget.agentSubmittedCasesGrid.resize();
				}*/
			};
			animation.show();
			this.sendRequest("searchCases", requestStr, callBack, "Error while getting Data", "get");

		},
		destroy: function () {
			this.inherited(arguments);
			if (this.handle1)
				this.handle1.remove();
			if (this.handle)
				this.handle.remove();
			if (this.handle2)
				this.handle2.remove();
		}
	});

});
