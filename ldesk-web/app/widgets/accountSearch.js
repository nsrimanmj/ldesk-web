define([
	"dojo/_base/declare",
	"dojo/parser",
	"dojo/dom",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dstore/Memory",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dojo/query",
	"dojo/dom-construct",
	"dojox/widget/TitleGroup",
	"dijit/TitlePane",
	"dijit/layout/ContentPane",
	"dijit/registry",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	"app/view/summaryRow",
	"dojo/text!app/widgets/templates/account_search.html",
	"app/view/messageWindow",
	"app/widgets/accountViewDetails",
	"dojo/domReady!"
], function (declare, parser, dom, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, query, domConstruct, TitleGroup, TitlePane, ContentPane,
	registry, OnDemandGrid, Selection, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard,
	SummaryRow, template, messageWindow, _AccountDetails) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			widget.accountStore = new Memory({
				idProperty: "accountId",
				data: []
			});
			widget.accStore = new Memory({
				idProperty: "accountId",
				data: []
			});
			this.notification = registry.byId("notification_div");

		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {
			this.inherited(arguments);
		},
		postCreate: function () {

			var widget = this;

			on(widget.accountDetailsViewBtn, "click", function () {
				widget.viewAccountDetails(widget.accountId, widget.ctrl, widget.data);
			});

			var Grid = declare([OnDemandGrid, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, Selection, DijitRegistry, SummaryRow]);
			var multiAccLayout = [
				{ label: "App Id", field: "accountId", width: 100 },
				{ label: "Account Name", field: "companyName", width: 130 },
				{ label: "Parent Account Id", field: "parentAccountId", width: 90 },
				{ label: "Top Parent Account Id", field: "topParentAccountId", width: 90 },
				{ label: "Account Manager", field: "accountManager", width: 130 },
				{ label: "Created", field: "created", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Service Start", field: "serviceStart", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Status", field: "status", width: 80 },
				{ label: "Location Address", field: "locationAddress", width: 200 },
				{ label: "Billing System", field: "billingSystem", width: 90, hidden: true },
			];

			widget.multiGrid = new Grid({
				id: "multiGrid",
				columns: multiAccLayout,
				className: "lingogrid",
				keepScrollPosition: true,
				selectionMode: "single",
				autoWidth: true,
				collection: widget.accStore,
				rowSelector: '20px',

			}, widget.multiAccDiv);

			widget.multiGrid.startup();
			widget.multiGrid.refresh();

			widget.multiGrid.on('.dgrid-row:dblclick', function (event) {
				widget.selectAccount();
			});

			on(widget.openBtn, "click", lang.hitch(this, function () {
				widget.selectAccount();
			}));

			on(widget.closeBtn, "click", lang.hitch(this, function () {
				widget.multiAccDlg.hide();
			}));
		},
		selectAccount: function () {
			var selected = Object.keys(widget.multiGrid.selection)[0];
			if (!selected) {
				return;
			}
			var data = widget.accountStore.getSync(selected);
			widget.populateAccountInfo(data);
			widget.multiAccDlg.hide();
		},
		getAccountDetails: function (searchKey, searchValue, regExpFlag, activeOnlyFlag) {
			var widget = this;

			var callback = function (obj) {
				var data = obj.data;
				widget.data = obj.data;
				if (obj.notificationMsg) {
					widget.notification.setMessage(obj.notificationMsg);
				}


				if (data.length == 1) {
					widget.populateAccountInfo(data[0]);
				} else {
					widget.accountStore.setData(data);
					widget.accStore = widget.getAccountStore(widget.accountStore.data);
					widget.multiAccDlg.show();
					widget.multiGrid.refresh();
				}
			}
			widget.ctrl.searchAccount(searchKey, searchValue, regExpFlag, activeOnlyFlag, callback);
		},
		getAccountStore: function (data) {
			var widget = this;
			var tmpArry = [];
			var tmp = [];
			dojo.forEach(data, function (item) {
				if (tmpArry.indexOf(item.accountId) == -1) {
					tmpArry.push(item.accountId);

					tmp.push(item);

				}
			});
			widget.accStore.setData(tmp);
			return widget.accStore;
		},
		populateAccountInfo: function (data) {
			var widget = this;
			var acctInfo = data;
			this.accountId = acctInfo.accountId;

			//widget.searchTitlePane.set("title", "<b>Lingo Account : "+data.account+"</b>");
			//var accountIdVal = this.renderAccountId("2");
			//widget.account.set("value","Miller Corp");
			widget.searchTitlePane.set("title", acctInfo.companyName);
			widget.appId.set("value", acctInfo.accountId);
			widget.parentAppId.set("value", acctInfo.parentAccountId);
			widget.TopparentAppId.set("value", acctInfo.topParentAccountId);
			widget.accountName.set("value", acctInfo.companyName);
			widget.accManager.set("value", acctInfo.accountManager);
			widget.servicestart.set("value", acctInfo.serviceStart);
			widget.status.set("value", acctInfo.status);
			widget.billingCycle.set("value", acctInfo.billCycle);
			widget.paybyAccountId.set("value", acctInfo.payByAccountId);
			widget.crmName.set("value", acctInfo.crmName);
			widget.salesrepId.set("value", acctInfo.salesRepId);
			widget.locAddress.set("value", acctInfo.locationAddress);
			widget.billingsystem.set("value", acctInfo.billingSystem);
			widget.createdDate.set("value", acctInfo.created);
			widget.modifiedDate.set("value", acctInfo.updated);
			widget.accountDetailsViewBtn.set("disabled", false);
			widget.ctrl.searchedAccData = data;
		},
		clear: function () {
			widget = this;
			widget.searchTitlePane.set("title", null);
			widget.appId.set("value", null);
			widget.parentAppId.set("value", null);
			widget.TopparentAppId.set("value", null);
			widget.accountName.set("value", null);
			widget.accManager.set("value", null);
			widget.servicestart.set("value", null);
			widget.status.set("value", null);
			widget.billingCycle.set("value", null);
			widget.paybyAccountId.set("value", null);
			widget.crmName.set("value", null);
			widget.salesrepId.set("value", null);
			widget.locAddress.set("value", null);
			widget.paybyAccountId.set("value", null);
			widget.billingsystem.set("value", null);
			widget.createdDate.set("value", null);
			widget.modifiedDate.set("value", null);
			widget.accountDetailsViewBtn.set("disabled", true);
			widget.accountStore.setData([]);
		},
		destroy: function () {
			this.multiAccDlg.destroyRecursive();
			this.inherited(arguments);
		}
	});

});




