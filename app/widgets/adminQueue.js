define([
	"dojo/_base/declare",
	"dojo/parser",
	"dojo/aspect",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/registry",
	"dijit/layout/ContentPane",
	"dojo/store/Memory",
	"dstore/Memory",
	"dojo/store/Observable",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dijit/Dialog",
	"dojox/widget/TitleGroup",
	"dijit/TitlePane",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/Selector",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	"app/view/summaryRow",
	"dijit/form/Button",
	"dojo/topic",
	"dojo/text!app/widgets/templates/admin_queue.html",
	"dojo/domReady!"
], function (declare, parser, aspect, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, ContentPane,
	Memory, StoreMemory, Observable, lang, domStyle, on, Dialog, TitleGroup, TitlePane, OnDemandGrid, Selection, Selector, DijitRegistry, ColumnResizer,
	ColumnReorder, ColumnHider, Keyboard, SummaryRow, Button, topic, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		constructor: function (args) {
			lang.mixin(this, args);
			this.ctrl = this.lingoController;
			var widget = this;
			this.agentId = JSON.parse(window.localStorage.getItem("agentId"));

			this.queueStore = Observable(new StoreMemory({
				data: [],
				idProperty: "queueID"
			}));

			this.userStore = Observable(new StoreMemory({
				data: [],
				idProperty: "userId"
			}));

			this.caseStore = Observable(new StoreMemory({
				data: [],
				idProperty: "caseId"
			}));

		},
		init: function () {
			var widget = this;
			widget.getQueueList();

		},
		getQueueList: function () {
			var widget = this;
			var callback = function (obj) {
				widget.queueStore.setData(obj.data);
				widget.queueGrid.refresh();
				widget.queueGrid.resize();
			}

			this.ctrl.getAPI("queueList", null, callback)
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.queueGrid.resize();
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
					widget.caseDlg.hide();
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
			if (value != 0) {
				var linkNode = dojo.create("a", { href: "javascript:void(null);", title: value, innerHTML: value }, div);

				on(linkNode, "click", lang.hitch(this, function () {
					this.viewAccountDetails(value, widget.ctrl);
					widget.caseDlg.hide();
				}));
			} else {
				dojo.create('span', {
					innerHTML: value, style: 'color: blue'
				}, div);
			}
			return;
		},
		renderCaseCount: function (data, value, cell) {
			if (!value) {
				return;
			}

			var widget = this;
			var div = cell.appendChild(document.createElement("div"));
			var linkNode = dojo.create("a", { href: "javascript:void(null);", title: value, innerHTML: value }, div);

			on(linkNode, "click", lang.hitch(this, function () {
				widget.viewCaseList(data.queueID);
			}));
			return;
		},
		renderUserCount: function (data, value, cell) {
			if (!value) {
				return;
			}

			var widget = this;
			var div = cell.appendChild(document.createElement("div"));
			var linkNode = dojo.create("a", { href: "javascript:void(null);", title: value, innerHTML: value }, div);

			on(linkNode, "click", lang.hitch(this, function () {
				widget.viewUserList(data.queueID, "all");
			}));
			return;
		},
		renderSessionCount: function (data, value, cell) {
			if (!value) {
				return;
			}

			if (value == 0) {
				return 0;
			}

			var widget = this;
			var div = cell.appendChild(document.createElement("div"));
			var linkNode = dojo.create("a", { href: "javascript:void(null);", title: value, innerHTML: value }, div);

			on(linkNode, "click", lang.hitch(this, function () {
				widget.viewUserList(data.queueID, "session");
			}));
			return;
		},
		renderSessionStatus: function (data, value, cell) {
			var widget = this;

			var statusStr = "<span class='grey-dot'></span><span>Offline </span>";
			if (data.userAgent) {
				if (value) {
					statusStr = "<span class='red-dot'></span><span>Busy </span>";
				} else {
					statusStr = "<span class='green-dot'></span><span> Active </span>";
				}
			}
			var div = cell.appendChild(document.createElement("div"));
			dojo.create("label", { title: value, innerHTML: statusStr }, div);
			return;
		},
		viewUserList: function (queueId, type) {

			var widget = this;
			var req = {
				"queueId": queueId
			}

			var callback = function (obj) {
				widget.userDlg.show();
				var data = obj.data;

				if (type == "session") {
					data = obj.data.filter(item => {
						return item.userAgent != null;
					})
				}
				widget.userStore.setData(data);
				widget.userGrid.refresh();
			}

			this.ctrl.getAPI("queueUserList", req, callback)
		},
		viewCaseList: function (queueId) {

			var widget = this;
			var req = {
				"queueId": queueId,
				"activeOnly": true
			}

			var callback = function (obj) {
				widget.caseDlg.show();
				var data = obj.data;
				widget.caseStore.setData(data);
				widget.caseGrid.refresh();
			}

			this.ctrl.getAPI("searchCases", req, callback)
		},
		postCreate: function () {
			var widget = this;
			this.inherited(arguments);

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow, Selector]);

			var queueLayout = [
				{ label: "Queue Id", field: "queueID", width: 30 },
				{ label: "Group", field: "groupName", width: 60 },
				{ label: "Queue Name", field: "queueName", width: 90 },
				{ label: "Case Count", field: "caseCount", width: 60, renderCell: lang.hitch(this, this.renderCaseCount) },
				{ label: "User Count", field: "userCount", width: 60, renderCell: lang.hitch(this, this.renderUserCount) },
				{ label: "Session Count", field: "sessionCount", width: 60, renderCell: lang.hitch(this, this.renderSessionCount) }
			];

			widget.queueGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No queue Found!!",
				collection: widget.queueStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: queueLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowSelectAll: true,
				allowTextSelection: true,
				height: "100%",
				sort: [{ property: "groupName", descending: false }]
			}, widget.queueGridDiv);

			var height = screen.height - 400;
			domStyle.set(this.queueGridDiv, "height", height + "px")

			on(this.cancelUsrDlgBtn, "click", function () {
				widget.userDlg.hide();
			})

			on(this.cancelCaseDlgBtn, "click", function () {
				widget.caseDlg.hide();
			})

			var userLayout = [
				{ label: "User Id", field: "userId", width: 30 },
				{ label: "Login Name", field: "loginName", width: 60 },
				{ label: "Name", field: "fullName", width: 90 },
				{ label: "Shift Group", field: "shiftGroup", width: 90 },
				{ label: "Auth Source", field: "authSource", width: 40 },
				{ label: "Session Status", field: "busyStatus", width: 40, renderCell: lang.hitch(this, this.renderSessionStatus) },
				{ label: "Last Login Time", field: "lastLoginTime", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Last Access Time", field: "lastAccessTime", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Login IP", field: "ip", width: 60 },
				{ label: "User Agent", field: "userAgent", width: 120, hidden: true },
				{ label: "Machine Id", field: "machineId", width: 120, hidden: true }
			];

			widget.userGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No queue Found!!",
				collection: widget.userStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: userLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowSelectAll: true,
				allowTextSelection: true,
				height: "100%"
			}, widget.userGridDiv);

			var caseLayout = [
				{ label: "Case Number", field: "caseNumber", width: 60, renderCell: lang.hitch(this, this.renderCaseId) },
				{ label: "Account Id", field: "accountId", width: 60, renderCell: lang.hitch(this, this.renderAccountId) },
				{ label: "Service Number", field: "serviceNumber", width: 90 },
				{ label: "Group", field: "groupName", width: 60 },
				{ label: "Queue", field: "queueName", width: 90 },
				{ label: "Category", field: "categoryName", width: 90 },
				{ label: "Type", field: "type", width: 90 },
				{ label: "Subtype", field: "subType", width: 90 },
				{ label: "Origin", field: "origin", width: 90 },
				{ label: "Status", field: "status", width: 60 },
				{ label: "Owner", field: "ownerName", width: 80 },
				{ label: "Created Date", field: "createdDate", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Service Address", field: "serviceAddress", width: 120 },
				{ label: "Modified Date", field: "modifiedDate", width: 90, hidden: true, formatter: lang.hitch(this, this.dateFormatter) }
			];

			widget.caseGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No queue Found!!",
				collection: widget.caseStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: caseLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowSelectAll: true,
				allowTextSelection: true,
				height: "100%"
			}, widget.caseGridDiv);

		},
		onFolderSelect: function (folder) {
			var widget = this;
			this.getCaseList(folder);
		},
		destroy: function () {
			this.userDlg.destroyRecursive();
			this.caseDlg.destroyRecursive();
			this.inherited(arguments);
		}
	});

});
