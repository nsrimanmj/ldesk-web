define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/registry",
	"app/controller/searchCases",
	"dojo/store/Memory",
	"dstore/Memory",
	"dijit/form/Button",
	"dijit/form/ComboBox",
	"dijit/form/FilteringSelect",
	"dijit/form/Select",
	"dijit/form/SimpleTextarea",
	"dijit/form/DropDownButton",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/on",
	"app/view/messageWindow",
	"app/view/contentDialog",
	"dojo/text!app/widgets/templates/search_cases.html",
	"dojo/json",
	"dojo/store/Observable",
	"dijit/TitlePane",
	"dojox/widget/TitleGroup",
	"app/view/summaryRow",
	"dijit/layout/ContentPane",
	"dgrid/OnDemandGrid",
	"dojox/grid/EnhancedGrid",
	"dgrid/Selection",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/extensions/DijitRegistry",
	"dgrid/Keyboard",
	"dijit/DropDownMenu",
	"dijit/Menu",
	"dijit/MenuItem",
	"dojo/dom-construct",
	"dojo/topic",
	"app/view/diaryEditor",
	"dijit/TooltipDialog",
	"dijit/popup",
	"dojox/grid/enhanced/plugins/exporter/CSVWriter",
	"dojo/data/ItemFileWriteStore",
	"app/widgets/caseCreationFlow",
	"app/widgets/createNetworkEvent",
	"app/widgets/accountViewDetails",
	"app/widgets/viewCase",
	"dojo/dom-style",
	"dojo/dom",
	"dojo/domReady!"
], function (declare, parser, registry, searchController, Memory, dstoreMemory, Button, ComboBox, FilteringSelect, Select, Textarea, DropDownButton, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, arrayUtil, on, messageWindow, ContentDialog, template, json, Observable, TitlePane, TitleGroup, SummaryRow, ContentPane, OnDemandGrid, EnhancedGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, DijitRegistry, Keyboard, DropDownMenu, Menu, MenuItem, domConstruct, topic, DiaryEditor, TooltipDialog, popup, CSVWriter, ItemFileWriteStore, caseCreationFlow, CreateNetworkEvent, AccountDetails, ViewCase, domStyle, dom) { // jshint ignore:line

	var statusStore = new Memory({
		idProperty: 'name',
		data: [{
			name: "New",
			id: "0"
		},
		{
			name: "Opened",
			id: "1"
		},
		{
			name: "Acknowledged",
			id: "2"
		},
		{
			name: "Onhold",
			id: "3"
		},
		{
			name: "Closed",
			id: "4"
		}]
	});

	var priorityStore = new Memory({
		idProperty: 'name',
		data: [{
			name: "Critical",
			id: "0"
		},
		{
			name: "High",
			id: "1"
		},
		{
			name: "Medium",
			id: "2"
		},
		{
			name: "Low",
			id: "3"
		},
		{
			name: "None",
			id: "4"
		}]
	});

	var caseTypeStore = new Memory({
		idProperty: 'name',
		data: [{
			name: "Incident",
			id: "0"
		},
		{
			name: "Inquiry",
			id: "1"
		},
		{
			name: "Finance",
			id: "2"
		},
		{
			name: "Equipment",
			id: "3"
		},
		{
			name: "Network",
			id: "4"
		}]
	});

	var createdStore = new Memory({
		idProperty: 'name',
		data: [{
			name: 'qal4',
			id: 0
		}]
	});

	var previousSearchStore = Observable(new Memory({
		idProperty: 'id',
		data: []
	}));

	var cases = new dstoreMemory({
		idProperty: 'caseNumber',
		data: [{
			"priority": "Medium",
			"create_date": "2024-09-14",
			"caseNumber": "211820",
			"status": "New",
			"caseType": "Incident",
			"accountName": "Miller Corp",
			"type": null,
			"subType": null,
			"assignee": "qal4",
			"last_modified_date": "09-15-2024",
			"agentWorklog": "test",
			"autoWorklog": "test",
			"email_address": "test@lingo.com"
		}, {
			"priority": "Medium",
			"create_date": "2024-09-14",
			"caseNumber": "211821",
			"status": "New",
			"caseType": "Incident",
			"accountName": "Miller Corp",
			"type": null,
			"subType": null,
			"assignee": "qal4",
			"last_modified_date": "09-15-2024",
			"agentWorklog": "test",
			"autoWorklog": "test",
			"email_address": "test@lingo.com"
		}
		]
	});

	var widget = null;
	var searchCasesGrid = null;
	var previousSearchGrid = null;
	var previousSearches = [];
	var cpCtrl = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
		templateString: template,
		widgetsInTemplate: true,
		isLoaded: false,
		searchCtrl: null,
		categoryStore: null,
		typeStore: null,
		subTypeStore: null,
		ctrl: null,
		agentName: null,
		constructor: function (args) {
			this.agentName = window.localStorage.getItem("agent");
			this.searchCtrl = new searchController();
			this.categoryStore = null;
			this.typeStore = null;
			this.subTypeStore = null;
			this.getPreviousSearches();
			widget = this;
			cpCtrl = args.ctrl;
		},
		loadData: function () {
			//this.searchCtrl.loadData(lang.hitch(this, this.loadDataCallback));
			//this.isLoading = true;
		},
		init: function () {
			if (this.isLoading) {
				domStyle.set(dom.byId("loading_icon"), "display", "block");
			}

			this.searchForm.reset();
		},
		loadDataCallback: function () {
			this.isLoading = false;
			domStyle.set(dom.byId("loading_icon"), "display", "none");

			setTimeout(function () {
				widget.categoryStore = widget.searchCtrl.getCategoryStore();
				widget.typeStore = widget.searchCtrl.getTypeStore();
				widget.subTypeStore = widget.searchCtrl.getSubTypeStore();
			}, 100);
		},
		resize: function () {
			this.inherited(arguments);
		},
		postCreate: function () {

			this.searchForm.on('submit', function (evt) {
				evt.preventDefault();
				widget.searchCases();
				return false;
			});

			var retval = this.inherited(arguments);

			var ctrl = this.searchCtrl;

			var caseTypeCB = registry.byId("search_caseTypeComboBox");
			caseTypeCB.set("store", caseTypeStore);
			var typeCB = registry.byId("search_typeComboBox");

			caseTypeCB.on('change', function () {
				typeCB.reset();
				typeCB.set("placeHolder", "select a Type");
				//typeCB.set("store", ctrl.getTypeStore(groupCB.value, categoryCB.value));
			});

			var subTypeCB = this.subType;
			typeCB.on('change', function () {
				subTypeCB.reset();
				subTypeCB.set("placeHolder", "Select a SubType");
				subTypeCB.set("store", ctrl.getSubTypeStore(groupCB.value, categoryCB.value, typeCB.value));
			});

			var statusCB = registry.byId("search_statusComboBox");
			statusCB.set("store", statusStore);

			var priorityCB = registry.byId("search_priorityComboBox");
			priorityCB.set("store", priorityStore);
			this.searchTicketButton.on('click', function () {
				widget.searchCases();
			});

			var createdBy = widget.createdBy;
			createdBy.set("store", createdStore);

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow]);
			previousSearchGrid = new Grid({
				id: "searchTicketGrid",
				keepScrollPosition: true,
				columns: {
					searchDate: "Search Date",
					query: "Query"
				},
				height: "50%",
				maxRowsPerPage: 10,
				rowsPerPage: 10,
				store: previousSearchStore
			}, widget.previousSearchGrid);

			previousSearchGrid.on('.dgrid-row:dblclick', function () {
				widget.addPreviousSearch();

			});

			previousSearchGrid.addKeyHandler(13, function () {
				widget.addPreviousSearch();
			});

			this.previousSearchAdd.on('click', function () {
				widget.addPreviousSearch();
			});

			this.previousSearchSearch.on('click', function () {
				widget.addPreviousSearch();
				widget.searchCases();
			});

			var node = domConstruct.place("<div style='float: right;padding: 3px;font-weight: bold;'>Previous Searches</div>", widget.searchTitlePane.focusNode);
			on(node, 'mouseover', function () {
				popup.open({
					popup: widget.previousSearchesDlg,
					orient: ["below-centered", "above-centered"],
					around: node,
					onExecute: function () {
						popup.close(widget.previousSearchesDlg);
					},
					onCancel: function () {
						popup.close(widget.previousSearchesDlg);
					}
				});
			});

			on(widget.previousSearchesDlg, 'mouseleave', function () {
				popup.close(widget.previousSearchesDlg);
			});

			widget.renderCeateCaseButton();

			var layout = [
				{ label: "Case Type", field: "caseType", width: 50 },
				{ label: "Case Number", field: "caseNumber", width: 50, renderCell: lang.hitch(this, this.renderCaseNumber) },
				{ label: "Create Date", field: "create_date", width: 60 },
				{ label: "Email Address", field: "email_address", width: 50 },
				{ label: "Account Name", field: "accountName", width: 60, renderCell: lang.hitch(this, this.renderAccountName) },
				{ label: "Status", field: "status", width: 40 },
				{ label: "Type", field: "type", width: 40 },
				{ label: "Sub Type", field: "subType", width: 40 },
				{ label: "Assignee", field: "assignee", width: 50 },
				{ label: "Last Modified Date", field: "last_modified_date", width: 60 }
			];
			searchCasesGrid = new Grid({
				id: "searchCasesGrid",
				loadingMessage: "Grid is loading",
				noDataMessage: "No data",
				collection: cases,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: layout,
				selectionMode: "single",
				rowSelector: '20px'
			}, widget.searchResultGrid);

			searchCasesGrid.startup();
			searchCasesGrid.refresh();

			searchCasesGrid.on('dgrid-select', function (evt) {
				widget.agentWorkLog.set('value', evt.rows[0].data.agentWorklog);
				widget.autoWorkLog.set('value', evt.rows[0].data.autoWorklog);

				widget.selectedRowData = event.rows[0].data;
				topic.publish("searchCaseselected", {
					content: evt.rows[0].data.agentWorkLog
				});
				topic.publish("searchCaseselectedChangeAutoWorklog", {
					content: evt.rows[0].data.autoWorklog
				});
			});

			searchCasesGrid.on('dgrid-deselect', function () {
				widget.agentWorkLog.set('value', "");
				widget.autoWorkLog.set('value', "");
			});

			searchCasesGrid.on('.dgrid-row:dblclick', function () {
				widget.openCaseViewTab(widget.selectedRowData);
			});

			widget.btnViewWorklog.on('click', function () {
				new DiaryEditor("search_worklog", "Agent WorkLog", false, "", registry.byId("search_worklog").get("value"), true, null, "searchCaseselected");
			});
			widget.btnViewAutoWorklog.on('click', function () {
				new DiaryEditor("search_auto_worklog", "Agent WorkLog", false, "", registry.byId("search_auto_worklog").get("value"), true, null, "searchCaseselectedChangeAutoWorklog");
			});

			return retval;
		},
		searchCases: function () {
			if (!this.searchForm.validate()) {
				new messageWindow({
					message: "Form validation error!!",
					title: "Error"
				});
				return;
			}

			var count = 0;
			var requestObj = this.searchForm.value;
			for (var key in requestObj) {
				if (requestObj[key]) {
					count++;
					break;
				}
			}

			if (count === 0) {
				new messageWindow({
					message: "Atleast one search criteria required!!",
					title: "Note"
				});
				return;
			}

			var request = this.searchForm.value;

			request.createdFrom = this.formatDate(request.createdFrom);
			request.createdTo = this.formatDate(request.createdTo);

			this.searchCtrl.searchCases(request, this.callback);
		},
		callback: function () {
			widget.searchTitlePane.set('open', false);
			registry.byId("resultDiv").set('style', 'display:block');
			registry.byId("resultDiv").set('open', true);
			widget.saveSearches();
		},
		formatDate: function (date) {

			if (!date) {
				return null;
			}
			var d = new Date(date);
			var yyyy = d.getFullYear().toString();
			var mm = (d.getMonth() + 1).toString(); // getMonth() is zero-based         
			var dd = d.getDate().toString();

			return yyyy + '-' + (mm[1] ? mm : "0" + mm[0]) + '-' + (dd[1] ? dd : "0" + dd[0]);
		},
		getPreviousSearches: function () {
			var searches = window.localStorage.getItem(this.agentName + "_searches");
			if (searches) {
				try {
					previousSearches = JSON.parse(searches);
				} catch (e) {
					console.log(e);
				}
			}

			previousSearchStore.data = previousSearches;
		},
		addPreviousSearch: function () {
			var selection = Object.keys(previousSearchGrid.selection)[0];
			var row = previousSearchGrid.row(selection);
			var query = row.data.query;
			var fields = query.split('&');
			this.searchForm.reset();
			setTimeout(function () {
				widget.setFormValues(fields);
			}, 10);
		},
		setFormValues: function (fields) {
			var formValues = widget.searchForm.value;
			dojo.forEach(fields, function (item) {
				var res = item.split('=');
				formValues[res[0]] = res[1];
			});

			var category = widget.searchForm.value.category;

			this.searchForm.set('value', formValues);

			this.setSelectValues(widget.typeCB, 'type', widget.searchForm.value.type, 200);
			this.setSelectValues(widget.subType, 'subType', widget.searchForm.value.subType, 300);

			if (widget.searchForm.value.createdFrom) {
				this.createdFrom.set('value', new Date(widget.searchForm.value.createdFrom));
			}

			if (widget.searchForm.value.createdTo) {
				this.createdTo.set('value', new Date(widget.searchForm.value.createdTo));
			}

			popup.close(widget.previousSearchesDlg);
			widget.searchTitlePane.set('open', true);
			registry.byId("resultDiv").set('open', false);
		},
		setSelectValues: function (select, key, value, timeout) {
			if (!value) {
				return;
			}
			var item = {};
			item[key] = value;
			setTimeout(function () {
				select.set('item', item);
			}, timeout);
		},
		saveSearches: function () {
			var date = new Date();
			var options = {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit'
			};

			var dateStamp = date.toLocaleDateString('en-US', options) + " " + date.toLocaleTimeString('en-US');
			var searchObj = {};
			searchObj.id = this.getSearchId();
			searchObj.searchDate = dateStamp;
			var params = this.searchForm.value;
			var query = "";
			for (var key in params) {
				if (params[key]) {
					query += key + "=" + params[key] + "&";
				}
			}

			query = query.slice(0, -1);
			searchObj.query = query;
			previousSearches.push(searchObj);

			if (previousSearches.length > 25) {
				previousSearches.shift();
			}

			previousSearchStore.data = previousSearches;
			previousSearchGrid.set('store', previousSearchStore);
			window.localStorage.setItem(this.agentName + "_searches", JSON.stringify(previousSearches));
		},

		renderCeateCaseButton: function () {
			var widget = this;
			var menu = new DropDownMenu({ style: "display: none;" });

			var menuItem1 = new MenuItem({
				label: "Incident",
				onClick: function () {
					var incident = new caseCreationFlow({
						data: {
							"type": "Incident"
						},
						lingoController: widget.cpCtrl
					});
				}
			});
			menu.addChild(menuItem1);

			var menuItem2 = new MenuItem({
				label: "Inquiry",
				onClick: function () {
					var inquiry = new caseCreationFlow({
						data: {
							"type": "Inquiry"
						},
						lingoController: widget.cpCtrl
					});
				}
			});
			menu.addChild(menuItem2);

			var menuItem3 = new MenuItem({
				label: "Network Event",
				onClick: function () {
					var networkEvent = new CreateNetworkEvent();
				}
			});
			menu.addChild(menuItem3);

			widget.ceateCaseButtons = new DropDownButton({
				label: "New case",
				dropDown: menu
			});

			widget.createCaseButton.appendChild(widget.ceateCaseButtons.domNode);
		},

		renderAccountName: function (data, value, cell) {
			var link = "<a href=\"javascript:void(null);\"> " + value + "</a>";
			var div = cell.appendChild(document.createElement("div"));

			dojo.create("label", { innerHTML: link }, div);
			on(cell, "click", lang.hitch(this, function () {
				//data.accountid = wdget.getAccountId(data.accountName);
				data.accountId = data.caseNumber;
				this.openAccountViewTab(data);
			}));
			return;

		},
		renderCaseNumber: function (data, value, cell) {
			var link = "<a href=\"javascript:void(null);\"> " + value + "</a>";
			var div = cell.appendChild(document.createElement("div"));

			dojo.create("label", { innerHTML: link }, div);
			on(cell, "click", lang.hitch(this, function () {
				this.openCaseViewTab(data);
			}));
			return;

		},

		openAccountViewTab: function (data) {

			if (registry.byId(data.accountId + "_contentPane")) {
				registry.byId("appTabContainer").selectChild(data.accountId + "_contentPane");
				return;
			}
			var accountContentPane = new ContentPane({
				title: "VIEW-" + data.accountId,
				id: data.accountId + "_contentPane",
				style: "height: 970px!important"
			});

			var mainDiv = domConstruct.create("div", {
				id: "accountContentViewDiv",
				style: "margin-left:2%;width:95%;height:50em;"
			}, accountContentPane.containerNode);

			var accountDetails = new AccountDetails({
				'info': data,
				'ctrl': this.ctrl
			});
			accountDetails.placeAt(mainDiv);
			registry.byId("appTabContainer").addChild(accountContentPane);
			registry.byId("appTabContainer").selectChild(accountContentPane);
			registry.byId("appTabContainer").startup();
			accountDetails.init();
		},

		openCaseViewTab: function (data) {
			if (registry.byId("CASE" + data.caseNumber + "_contentPane")) {
				registry.byId("appTabContainer").selectChild("CASE" + data.caseNumber + "_contentPane");
				return;
			}
			var caseContentPane = new ContentPane({
				title: "CASE-" + data.caseNumber,
				id: "CASE" + data.caseNumber + "_contentPane",
				style: "height: 970px!important"
			});

			var mainDiv = domConstruct.create("div", {
				id: "caseViewDiv",
				style: "margin-left:2%;width:95%;height:50em;"
			}, caseContentPane.containerNode);

			var case_1 = new ViewCase();
			case_1.placeAt(mainDiv);
			registry.byId("appTabContainer").addChild(caseContentPane);
			registry.byId("appTabContainer").selectChild(caseContentPane);
			registry.byId("appTabContainer").startup();
			case_1.init();
		},

		getSearchId: function () {
			var id = 0;
			dojo.forEach(previousSearches, function (item) {
				if (id < item.id) {
					id = item.id;
				}
			});
			return id + 1;
		},

		destroy: function () {
			this.inherited(arguments);
			domConstruct.destroy("searchTicketGrid");
			//registry.byId("searchTicketGridContextMenu").destroyRecursive();
		}
	});

});
