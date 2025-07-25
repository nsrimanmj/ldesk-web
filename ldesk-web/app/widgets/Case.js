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
	"dojo/topic",
	"dijit/registry",
	"dijit/layout/ContentPane",
	"dojo/dom-construct",
	"dojox/widget/TitleGroup",
	"dijit/TitlePane",
	"dgrid/OnDemandGrid",
	"dojox/grid/EnhancedGrid",
	"dgrid/Selection",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/extensions/DijitRegistry",
	"app/view/summaryRow",
	"dgrid/Keyboard",
	"app/widgets/viewCase",
	"app/widgets/caseCreationFlow",
	"app/widgets/createCollectionCase",
	"dojo/text!app/widgets/templates/case.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, topic, registry, ContentPane, domConstruct, TitleGroup, TitlePane, OnDemandGrid, EnhancedGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, DijitRegistry, SummaryRow, Keyboard, ViewCase, caseCreationFlow, CreateCollectionCase, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			widget.caseStore = new Memory({
				idProperty: 'caseId',
				data: []
			});

			widget.sfCaseStore = new Memory({
				idProperty: 'caseId',
				data: []
			});

			widget.emptyStore = new Memory({
				data: []
			});

			widget.handle1 = topic.subscribe("lingoController/caseCreated", lang.hitch(this, function (info) {
				widget.getCaseDetails();
			}));
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.casesGrid.resize();
			this.sfCasesGrid.resize();
		},
		init: function (appId) {
			var widget = this;
			widget.appId = appId;
			this.getCaseDetails();
			this.getSFCaseDetails();
		},
		setBillingSystem: function (billingSystem) {
			var widget = this;
			widget.billingSystem = billingSystem;
			if (widget.billingSystem == "Lingo-ION" || widget.billingSystem == "Lingo-ICE") {
				widget.caseCollectionBtn.set("disabled", true);
			} else {
				widget.caseCollectionBtn.set("disabled", false);
			}

		},
		getCaseDetails: function () {
			var widget = this;
			widget.casesGrid.set("collection", widget.emptyStore);

			if (widget.appId == null || widget.appId == "") {
				return;
			}
			var info = {
				"accountId": widget.appId
			}
			var callback = function (obj) {
				var data = obj.data || [];

				if (Array.isArray(data)) {
					data.sort(function (a, b) {
						return b.caseId - a.caseId;
					});
				}

				widget.caseStore.setData(data);
				widget.casesGrid.set("collection", widget.caseStore);
				widget.casesGrid.refresh();
				widget.casesGrid.resize();
			};
			widget.ctrl.searchCases(info, callback, true, false);
		},
		getSFCaseDetails: function () {
			var widget = this;
			widget.sfCaseStore.setData([]);

			if (widget.appId == null || widget.appId == "") {
				return;
			}
			var info = {
				"appId": widget.appId
			}
			var callback = function (obj) {
				var data = obj.data;
				widget.sfCaseStore.setData(data);
				widget.sfCasesGrid.refresh();
				widget.sfCasesGrid.resize();
			};
			widget.ctrl.getAPI("salesforceCases", info, callback);
		},
		openCaseViewTab: function (data) {
			var widget = this;
			if (registry.byId("case_contentPane_" + data.caseId)) {
				registry.byId("appTabContainer").selectChild("case_contentPane_" + data.caseId);
				return;
			}
			var caseContentPane = new ContentPane({
				title: "Case " + this.formatCaseNumber(data.caseId),
				id: "case_contentPane_" + data.caseId
			});

			/*
			var mainDiv = domConstruct.create("div", {
				id: "caseViewDiv_" + data.caseId,
				style: "width:99%;"
			}, caseContentPane.containerNode);
			*/
			var case_1 = new ViewCase({
				'lingoController': widget.ctrl,
				'info': data
			});
			caseContentPane.addChild(case_1);
			//case_1.placeAt(mainDiv);
			registry.byId("appTabContainer").addChild(caseContentPane);
			registry.byId("appTabContainer").selectChild(caseContentPane);
			registry.byId("appTabContainer").startup();
			case_1.init();
		},
		phoneNumberFormatter: function (value, data) {
			return this.formatPhoneNumber(value);
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
		postCreate: function () {
			var widget = this;
			var data = {};


			on(widget.caseInquiryBtn, "click", function () {
				var inquiry = new caseCreationFlow({
					data: {
						"type": "Inquiry"
					},
					lingoController: widget.ctrl
				});

			});
			on(widget.caseIncidentBtn, "click", function () {
				var incident = new caseCreationFlow({
					data: {
						"type": "Incident"
					},
					lingoController: widget.ctrl
				});

			});

			on(widget.caseEquipmentBtn, "click", function () {
				var equipment = new caseCreationFlow({
					data: {
						"type": "Equipment"
					},
					lingoController: widget.ctrl
				});
			});

			on(widget.caseCollectionBtn, "click", function () {

				const billingSystem = registry.byId("billing_system").get("value");

				if (billingSystem !== "Telcare") {
					new messageWindow({
						title: "Warning",
						message: "Collection Cases can only be created for Telcare accounts."
					});
					return;
				}
				// Check if there is an active collection case for the account
				const isCaseFound = widget.caseStore.filter(function (item) {
					return item.groupName === "Collections" &&
						item.status !== "Closed" &&
						item.status !== "Cancelled";
				}).fetchSync().length > 0;

				if (isCaseFound) {
					new messageWindow({
						title: "Warning",
						message: "An active collection case already exists for this account."
					});
				} else {
					new CreateCollectionCase({
						data: {
							"type": "Collections"
						},
						lingoController: widget.ctrl
					});
				}
			});

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, DijitRegistry, SummaryRow]);

			var casesLayout = [
				{ label: "Case Number", field: "caseId", width: 80, renderCell: lang.hitch(this, this.renderCaseId) },
				{ label: "App Id", field: "accountId", width: 70, renderCell: lang.hitch(this, this.renderAccountId) },
				{ label: "Account Name", field: "accountName", width: 90, renderCell: lang.hitch(this, this.renderAccountName) },
				{ label: "Record Type", field: "groupName", width: 80 },
				{ label: "Queue", field: "queueName", width: 60 },
				{ label: "Status", field: "status", width: 60 },
				{ label: "Sub-Status", field: "subStatus", width: 70 },
				{ label: "Category", field: "categoryName", width: 90 },
				{ label: "Type", field: "type", width: 90, hidden: true },
				{ label: "Subtype", field: "subType", width: 90, hidden: true },
				{ label: "Resolution T1", field: "resolutionT1", width: 90, hidden: true },
				{ label: "Resolution T2", field: "resolutionT2", width: 90, hidden: true },
				{ label: "Resolution T3", field: "resolutionT3", width: 90, hidden: true },
				{ label: "Owner", field: "ownerName", width: 80 },
				{ label: "Service Number", field: "serviceNumber", width: 90 },
				{ label: "Service Priority", field: "servicePriority", width: 90 },
				{ label: "Contact Name", field: "contactName", width: 90, hidden: true },
				{ label: "Contact Phone", field: "contactPhone", width: 90, formatter: lang.hitch(this, this.phoneNumberFormatter), hidden: true },
				{ label: "Contact Email", field: "contactEmail", width: 90, hidden: true },
				{ label: "Resolution Description", field: "resolutionDescription", width: 100, hidden: true },
				{ label: "Provider", field: "provider", width: 60, hidden: true },
				{ label: "Date/Time Opened", field: "createdDate", width: 120, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Modified Date/Time", field: "modifiedDate", width: 120, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Follow up Date/Time", field: "followUpDate", width: 120, hidden: true, formatter: lang.hitch(this, this.dateFormatter) }

			];
			widget.casesGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Cases found!",
				columns: casesLayout,
				className: "lingogrid",
				keepScrollPosition: true,
				selectionMode: 'single',
				allowTextSelection: true,
				height: "100%",
				autoWidth: true,
				rowSelector: '20px'
			}, widget.existingCasesdiv);

			widget.casesGrid.startup();
			widget.casesGrid.resize();
			widget.casesGrid.refresh();

			var sfCasesLayout = [
				{ label: "Date/Time Opened", field: "createdDate", width: 120, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Case Number", field: "caseNumber", width: 80 },
				{ label: "App Id", field: "appId", width: 70, renderCell: lang.hitch(this, this.renderAccountId) },
				{ label: "Record Type", field: "recordType", width: 80 },
				{ label: "Queue", field: "queue", width: 60, },
				{ label: "Status", field: "status", width: 60 },
				{ label: "Sub-Status", field: "subStatus", width: 70 },
				{ label: "Category", field: "category", width: 90 },
				{ label: "Sub Category", field: "subCategory", width: 90, hidden: true },
				{ label: "Sub Category (Tier 3)", field: "subCategoryT3", width: 90, hidden: true },
				{ label: "Service Number", field: "serviceName", width: 60 },
				{ label: "Resolution T1", field: "resolutionTier1", width: 90, hidden: true },
				{ label: "Resolution T2", field: "resolutionTier2", width: 90 },
				{ label: "Resolution T3", field: "resolutionTier3", width: 90 },
				{ label: "Owner", field: "ownerName", width: 80 },
				{ label: "Resolution Description", field: "resolutionDescription", width: 100 },
				{ label: "Last Modified Date/Time", field: "modifiedDate", width: 120, formatter: lang.hitch(this, this.dateFormatter) }
			];
			widget.sfCasesGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Salesforce Cases found!!",
				columns: sfCasesLayout,
				className: "lingogrid",
				keepScrollPosition: true,
				selectionMode: "single",
				allowTextSelection: true,
				height: "100%",
				autoWidth: true,
				rowSelector: '20px',
				collection: widget.sfCaseStore
			}, widget.SFCasesdiv);

			widget.sfCasesGrid.startup();
			widget.sfCasesGrid.resize();
			widget.sfCasesGrid.refresh();

			on(widget.existingCasesreloadBtn, "click", function () {
				widget.getCaseDetails();
			});
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
			}));
			return;

		},
		renderAccountName: function (data, value, cell) {
			var accountName;
			console.log(data)
			if (data.groupName == "Collections") {

			}
			// switch (object.groupName) {
			// 	case "TypeA":
			// 		accountName = object.caseData.accountName;
			// 		break;
			// 	case "TypeB":
			// 		accountName = object.caseData.collectionData?.accountName || "N/A";
			// 		break;
			// 	default:
			// 		accountName = "Unknown";
			// }
			// node.innerHTML = accountName;

		},
		destroy: function () {
			this.inherited(arguments);
			this.handle1.remove();
		},

		clear: function () {
			this.caseStore.setData([]);
			this.casesGrid.refresh();
			this.sfCaseStore.setData([]);
			this.sfCasesGrid.refresh();

		}


	});

});
