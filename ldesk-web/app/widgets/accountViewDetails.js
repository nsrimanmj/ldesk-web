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
	"dojo/topic",
	"dojo/_base/array",
	"dojo/query",
	"dojox/widget/TitleGroup",
	"dijit/TitlePane",
	"dijit/registry",
	"dojo/text!app/widgets/templates/account_view_details.html",
	"app/widgets/viewBillingHistory",
	"app/widgets/viewServiceInfo",
	"app/widgets/addNotes",
	"app/view/messageWindow",
	"dgrid/OnDemandGrid",
	"dojox/grid/EnhancedGrid",
	"dgrid/Selection",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	"dstore/legacy/DstoreAdapter",
	"app/view/summaryRow",
	"app/widgets/accountHierarchy",
	"dojo/domReady!"
], function (declare, parser, dom, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, topic, arrayUtil, query,
	TitleGroup, TitlePane, registry, template, ViewBillingHistory, ViewServices, AddNotes, messageWindow, OnDemandGrid, EnhancedGrid, Selection,
	DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DstoreAdapter, SummaryRow, AccountHierarchy) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.data = widget.info;

			if (!widget.data || widget.data.length == 0) {

				this.info = {};
				this.info.accountId = this.accountId;
			}


			//this.getServiceInfo();
			//this.getContactInfo();

			widget.serviceStore = new Memory({
				idProperty: 'srvId',
				data: []
			});
			widget.contactStore = new Memory({
				idProperty: 'contactId',
				data: []
			});

			this.getAccountDetails();
			this.getServiceDetails();
			this.getContactDetails();


		},
		initHierarchy: function () {
			this.accountHierarchy.init(this.accountId, this.topParentAppId);
		},
		getServiceDetails: function () {
			var widget = this;
			var callback = function (obj) {
				var data = obj.data;
				widget.serviceStore.setData(data);
				widget.servicesGrid.refresh();
			}

			this.ctrl.getServiceDetails(this.accountId, callback);

		},
		getContactDetails: function () {
			var widget = this;
			var callback = function (obj) {
				var data = obj.data;
				widget.contactStore.setData(data);
				widget.contactsGrid.refresh();
			}
			this.ctrl.getContactDetails(this.accountId, callback);
		},
		getAccountDetails: function () {
			var widget = this;
			var callback = function (response) {
				if (response.data && response.data.length > 0) {
					widget.setAccountDetails(response.data[0]);
				}
			}
			this.ctrl.searchAccount("appId", this.accountId, false, false, callback);
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.viewAccountDetailsTabContainer.resize();
		},
		init: function () {
			var widget = this;

		},
		setAccountDetails: function (data) {
			var widget = this;
			widget.data = data;
			widget.topParentAppId = widget.data.topParentAccountId;
			widget.accountNameSpan.innerHTML = widget.data.companyName;
			widget.appIdSpan.innerHTML = widget.data.accountId;
			widget.app_Id.set("value", widget.data.accountId);
			widget.parent_App_Id.set("value", widget.data.parentAccountId);
			widget.Top_parent_App_Id.set("value", widget.data.topParentAccountId);
			widget.account_Name.set("value", widget.data.companyName);
			widget.acc_Manager.set("value", widget.data.accountManager);
			widget.crm_Name.set("value", widget.data.crmName);
			widget.account_status.set("value", widget.data.status);
			widget.billing_Cycle.set("value", widget.data.billCycle);
			widget.pay_by_Account_Id.set("value", widget.data.payByAccountId);
			widget.created_Date.set("value", widget.data.created);
			widget.service_start.set("value", widget.data.serviceStart);
			widget.modified_Date.set("value", widget.data.updated);
			widget.billing_system.set("value", widget.data.billingSystem);
			widget.sales_repId.set("value", widget.data.salesRepId);
			widget.loc_Address.set("value", widget.data.locationAddress);
			widget.streetNo.set("value", widget.data.streetNo);
			widget.streetName.set("value", widget.data.streetName);
			widget.city.set("value", widget.data.city);
			widget.state.set("value", widget.data.stateCd);
			widget.zip.set("value", widget.data.zip);
		},
		editAccountDetails: function () {
			var widget = this;
			widget.app_Id.set("disabled", false);
			widget.parent_App_Id.set("disabled", false);
			widget.Top_parent_App_Id.set("disabled", false);
			widget.account_Name.set("disabled", false);
			widget.acc_Manager.set("disabled", false);
			widget.crm_Name.set("disabled", false);
			widget.account_status.set("disabled", false);
			widget.billing_Cycle.set("disabled", false);
			widget.pay_by_Account_Id.set("disabled", false);
			widget.created_Date.set("disabled", false);
			widget.service_start.set("disabled", false);
			widget.modified_Date.set("disabled", false);
			widget.billing_system.set("disabled", false);
			widget.sales_repId.set("disabled", false);
			widget.loc_Address.set("disabled", false);
			widget.submitBtn.set("disabled", false);

		},
		postCreate: function () {
			var widget = this;
			var accountNumber = widget.accountId;



			on(this.acctCloseWindowBtn, "click", lang.hitch(this, function () {
				this.closeWindow();
			}));
			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, DijitRegistry, SummaryRow]);

			var contactlayout = [
				{ label: "Contact Owner", field: "contactOwner", width: 110 },
				{ label: "Email", field: "email", width: 230 },
				{ label: "App Id", field: "accountId", width: 90 },
				{ label: "Contact Name", field: "contactName", width: 90 },
				{ label: "Phone", field: "phone", width: 90 },
				{ label: "Name", field: "name", width: 100 },
				{ label: "Title", field: "title", width: 120 },
				{ label: "Roles", field: "role", width: 90 },
				{ label: "Contact Status", field: "status", width: 90 },
				{ label: "Contact Creation Date", field: "contactCreatedDate", width: 110, formatter: lang.hitch(this, widget.dateFormatter) },
				{ label: "Contact Updation Date", field: "contactUpdatedDate", width: 110, formatter: lang.hitch(this, widget.dateFormatter) },
				{ label: "Priority", field: "priority", width: 90 },
				{ label: "Sales Id", field: "salesId", width: 90 }
			];

			widget.contactsGrid = new Grid({
				columns: contactlayout,
				className: "lingogrid",
				keepScrollPosition: true,
				selectionMode: "none",
				height: "100%",
				noDataMessage: "No contact found!!",
				autoWidth: true,
				collection: widget.contactStore,
				rowSelector: '20px',

			}, widget.contactDiv);

			widget.contactsGrid.startup();

			var servicelayout = [

				{ label: "Service Id", field: "srvId", width: 90, renderCell: lang.hitch(this, this.renderServiceNumber) },
				{ label: "App Id", field: "accountId", width: 50, hidden: true },
				{ label: "Account Name", field: "companyName", width: 90, hidden: true },
				{ label: "Service Number", field: "serviceNo", width: 90, },
				{ label: "Service Name", field: "serviceName", width: 90 },
				{ label: "Service Plan", field: "srvPlan", width: 110 },
				{ label: "Service Start Date", field: "serviceStartDate", width: 90, formatter: lang.hitch(this, widget.dateFormatter) },
				{ label: "Service End Date", field: "serviceEndDate", width: 90, formatter: lang.hitch(this, widget.dateFormatter) },
				{ label: "Status", field: "status", width: 50 },
				{ label: "Service Address", field: "srvAddress", width: 150 },
				{ label: "Billing Type", field: "billingType", width: 90 },
				{ label: "Top Parent App Id", field: "topParentAccountId", width: 80, hidden: true }
			];

			widget.servicesGrid = new Grid({
				columns: servicelayout,
				className: "lingogrid",
				keepScrollPosition: true,
				selectionMode: "none",
				height: "100%",
				autoWidth: true,
				noDataMessage: "No Services found!",
				collection: widget.serviceStore,
				rowSelector: '20px'

			}, widget.serviceDiv);

			widget.servicesGrid.startup();

			if (this.data) {
				this.setAccountDetails(this.data);
			}
		},

		renderServiceNumber: function (data, value, cell) {
			if (!value) {
				return;
			}
			var widget = this;
			var link = "<a href=\"javascript:void(null);\"> " + value + "</a>";
			var div = cell.appendChild(document.createElement("div"));



			dojo.create("label", { innerHTML: link }, div);
			on(cell, "click", lang.hitch(this, function () {
				widget.serviceData = widget.getServiceInfo(widget.serviceStore.data, value);
				new ViewServices({
					'serviceInfo': widget.serviceData,
					'lingoController': widget.ctrl
				});

			}));
			return;

		},
		getServiceInfo: function (data, value) {
			var widget = this;
			var item = arrayUtil.filter(data, function (item) {
				return item.srvId == value;
			});
			return item[0];
		},
		dateFormatter: function (value, data) {
			if (!value) return;

			var dt = new Date(value);
			return this.formatDate(dt, "MM/DD/YYYY H24:MI:SS");
		},
		closeWindow: function () {
			var requestContentPane = registry.byId(this.accountId + "_contentPane");
			registry.byId("appTabContainer").selectChild(registry.byId("controlPanelContentPane"));
			registry.byId("appTabContainer").removeChild(requestContentPane);
			registry.byId(this.accountId + "_contentPane").destroyRecursive();
			registry.byId("appTabContainer").startup();
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});