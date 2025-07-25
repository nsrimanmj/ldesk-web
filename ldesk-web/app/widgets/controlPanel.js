define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/layout/BorderContainer",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/date",
	"dojo/on",
	"dojo/dom",
	"dojo/date/locale",
	"dijit/registry",
	"app/controller/LingoController",
	"app/widgets/changePassword",
	"app/widgets/Case",
	"app/widgets/accountSearch",
	"app/widgets/myCases",
	"app/widgets/searchCases",
	"app/widgets/networkEvents",
	"app/widgets/accountHierarchy",
	"app/widgets/notification",
	"app/widgets/reports",
	"app/widgets/dashboard",
	"app/view/messageWindow",
	"app/widgets/activeCases",
	"app/widgets/activeWorkOrders",
	"app/widgets/adminPanel",
	"app/widgets/activeTasks",
	"app/widgets/accountDue",
	"dojo/text!app/widgets/templates/controlPanel.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _BorderContainer, lang, domStyle, dojoDate, on, dom, locale, registry, LingoController,
	ChangePassword, Case, accountSearch, myCases, searchCases, netwrokEvents, AccountHierarchy, notification, _reports, _dashboard, messageWindow, activeCases, activeWorkOrders, adminPanel, activeTasks, 
	accountDue,template) { // jshint ignore:line

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			//widget.lingoController = new LingoController({ info: {} });
		},
		init: function () {
			window.scrollTo(0, 0);

		},
		initNetworkEvents: function () {
			this.networkEvents.init();
		},
		initHierarchy: function () {
			var accountId = registry.byId("app_id").get("value");
			var topParentAccountId = registry.byId("top_parent_app_id").get("value");
			this.accountHierarchy.init(accountId, topParentAccountId);
		},
		initMyCaseTab: function () {
			this.myCases.init();
			//this.myCases.setAgentId();
		},
		initReportTab: function () {
			this.reports.init();
		},
		initDashboardTab: function () {
			this.dashboard.init();
		},
		initCases: function () {
			//console.log("init cases");
			var appId = registry.byId("app_id").get("value");
			var accBillingSystem = registry.byId("billing_system").get("value");
			this.createCase.init(appId);
			this.createCase.setBillingSystem(accBillingSystem);
		},
		initActiveCases: function () {
			this.activeCases.init();
		},
		initActiveWo: function () {
			this.activeWo.init();
		},
		initActiveTask: function () {
			this.activeTasks.init();
		},
		initAccDue: function () {
			this.accountDue.init();
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.appTabContainer.resize();
		},
		postCreate: function () {
			var widget = this;
			//domStyle.set(widget.appDiv, "height", window.screen.height + "px");
			//domStyle.set(widget.appDiv, "display", "block");

			widget.appTabContainer.startup();
			widget.appTabContainer.resize();
			widget.acctTabContainer.startup();
			widget.acctTabContainer.resize();

			on(widget.searchSelect, 'change', function (value) {
				widget.cp_searchLabelValue = dom.byId("cp_searchLabel");
				widget.cp_regexpLabelValue = dom.byId("cp_regexpLabel");
				var label = document.querySelector("label[for='cp_regexpCheckbox']");
				var cp_searchLabel2 = document.querySelector("label[for='cp_searchText2']");
				widget.cp_searchText.focus();
				if (value == "App ID") {
					widget.cp_searchLabelValue.innerHTML = "App ID";
					domStyle.set(widget.cp_regexpCheckbox.domNode, "display", "none");
					label.style.display = "none";
					widget.cp_searchText.constraints = { pattern: "\\d+" };
					//cp_searchLabel2.innerHTML = ""; 
					widget.cp_searchText.set("value", "");
					domStyle.set(widget.cp_searchText2.domNode, "display", "none");
				}
				else if (value == "Service Number") {
					widget.cp_searchLabelValue.innerHTML = "Service Number";
					domStyle.set(widget.cp_regexpCheckbox.domNode, "display", "none");
					label.style.display = "none";
					widget.cp_searchText.constraints = { pattern: "\\d+" };
					//cp_searchLabel2.innerHTML = "";
					widget.cp_searchText.set("value", "");
					domStyle.set(widget.cp_searchText2.domNode, "display", "none");

				}
				else if (value == "Contact Email") {
					widget.cp_searchText.set("value", "");
					domStyle.set(widget.cp_searchText2.domNode, "display", "none");
					widget.cp_searchLabelValue.innerHTML = "Contact Email";
					domStyle.set(widget.cp_regexpCheckbox.domNode, "display", "inline-block");
					domStyle.set(widget.cp_regexpCheckbox.domNode, "position", "relative");
					domStyle.set(widget.cp_regexpCheckbox.domNode, "left", "20px");
					domStyle.set(label, "position", "relative");
					domStyle.set(label, "left", "17px");
					domStyle.set(label, "top", "2px");
					label.style.display = "inline-block";
				}
				else if (value == "Contact Phone") {
					widget.cp_searchText.set("value", "");
					domStyle.set(widget.cp_searchText2.domNode, "display", "none");
					widget.cp_searchLabelValue.innerHTML = "Contact Phone";
					domStyle.set(widget.cp_regexpCheckbox.domNode, "display", "none");
					label.style.display = "none";
				}
				else if (value == "Case Number") {
					widget.cp_searchLabelValue.innerHTML = "Case Number";
					domStyle.set(widget.cp_regexpCheckbox.domNode, "display", "none");
					label.style.display = "none";
					//widget.cp_searchText.constraints = { pattern: "\\d+" };
					widget.cp_searchText.set("value", "");
					domStyle.set(widget.cp_searchText2.domNode, "display", "none");
				}
				else if (value == "Work Order") {
					widget.cp_searchLabelValue.innerHTML = "Work Order Number";
					domStyle.set(widget.cp_regexpCheckbox.domNode, "display", "none");
					label.style.display = "none";
					//widget.cp_searchText.constraints = { pattern: "\\d+" };
					widget.cp_searchText.set("value", "");
					domStyle.set(widget.cp_searchText2.domNode, "display", "none");
				} else if (value == "External Work Order") {
					widget.cp_searchLabelValue.innerHTML = "External Work Order Number";
					domStyle.set(widget.cp_regexpCheckbox.domNode, "display", "none");
					label.style.display = "none";
					//widget.cp_searchText.constraints = { pattern: "\\d+" };
					widget.cp_searchText.set("value", "");
					domStyle.set(widget.cp_searchText2.domNode, "display", "none");
				}
				else if (value == "Task Number") {
					widget.cp_searchLabelValue.innerHTML = "Task Number";
					domStyle.set(widget.cp_regexpCheckbox.domNode, "display", "none");
					label.style.display = "none";
					//widget.cp_searchText.constraints = { pattern: "\\d+" };
					widget.cp_searchText.set("value", "");
					domStyle.set(widget.cp_searchText2.domNode, "display", "none");
				}
				else if (value == "Customer Name") {
					widget.cp_searchText.set("value", "");
					domStyle.set(widget.cp_searchText2.domNode, "display", "none");
					widget.cp_searchLabelValue.innerHTML = "Customer Name";
					domStyle.set(widget.cp_regexpCheckbox.domNode, "display", "inline-block");
					domStyle.set(widget.cp_regexpCheckbox.domNode, "position", "relative");
					domStyle.set(widget.cp_regexpCheckbox.domNode, "left", "20px");
					domStyle.set(label, "position", "relative");
					domStyle.set(label, "left", "17px");
					domStyle.set(label, "top", "2px");
					label.style.display = "inline-block";

				}
				else if (value == "Location Address") {
					widget.cp_searchText.set("value", "");
					domStyle.set(widget.cp_searchText2.domNode, "display", "none");
					widget.cp_searchLabelValue.innerHTML = "Location Address";
					domStyle.set(widget.cp_regexpCheckbox.domNode, "display", "inline-block");
					domStyle.set(widget.cp_regexpCheckbox.domNode, "position", "relative");
					domStyle.set(widget.cp_regexpCheckbox.domNode, "left", "20px");
					domStyle.set(label, "position", "relative");
					domStyle.set(label, "left", "17px");
					domStyle.set(label, "top", "2px");
					label.style.display = "inline-block";

				}
			});
			on(widget.cp_searchText, "keyPress", lang.hitch(this, function (event) {
				if (event.keyCode == 13) {
					widget.getAccountInfo();
				}
			}));

		},

		getAccountInfo: function () {
			var widget = this;
			var regExp = false;
			var activeFlag = false;
			var searchKey = widget.searchSelect.get("value");
			if (widget.cp_regexpCheckbox.checked) {
				regExp = widget.cp_regexpCheckbox.get("value");
			}
			if (widget.cp_activeCheckbox.checked) {
				activeFlag = widget.cp_activeCheckbox.get("value");
			}
			var searchValue = widget.cp_searchText.get("value");
			if (widget.cp_searchText2.get("value")) {
				searchValue += " " + widget.cp_searchText2.get("value");
			}
			searchValue = searchValue.trim();
			var flag = true;

			var data = {};

			widget.clearDetails();

			if (searchValue === "") {
				new messageWindow({
					message: searchKey + " " + "Should not be Empty",
					title: "Note"
				});

			} else {

				if (widget.validateSearchValue(searchKey, searchValue, flag)) {

					if (searchKey == "Case Number") {
						var caseId = parseInt(searchValue);
						var caseNumber = this.formatCaseNumber(caseId);
						var ctrl = this.lingoController;

						var callback = function (obj) {
							ctrl.viewCaseDetails(caseNumber, ctrl, obj.data);
						}
						ctrl.getCaseDetails(caseId, callback);
					} else if (searchKey == "Work Order") {

						var id = parseInt(searchValue.replace(/\D/g, ''));
						if (isNaN(id)) {
							new messageWindow({
								message: "Please enter a valid Work Order Number!!",
								title: "Note"
							});

							return;
						}
						var ctrl = this.lingoController;

						var callback = function (obj) {
							var data = obj.data;
							widget.viewWODetails(data.workOrderNo, ctrl, obj.data);

						}
						ctrl.getWorkOrderDetails(id, callback);

					} else if (searchKey == "Task Number") {

						var id = parseInt(searchValue.replace(/\D/g, ''));
						if (isNaN(id)) {
							new messageWindow({
								message: "Please enter a valid Task Number!!",
								title: "Note"
							});

							return;
						}
						var ctrl = this.lingoController;

						var callback = function (obj) {
							if (obj.response.code == 200) {

								var data = obj.data;
								widget.viewTaskDetails(data.taskNumber, ctrl, obj.data);
							}
							else {
								new messageWindow({
									message: `Task ${id} not found`,
									title: "Note"
								});

								return;
							}

						}
						ctrl.getTaskDetails(id, callback);

					} else if (searchKey == "External Work Order") {

						var id = parseInt(searchValue.replace(/\D/g, ''));
						if (isNaN(id)) {
							new messageWindow({
								message: "Please enter a valid Work Order Number!!",
								title: "Note"
							});

							return;
						}
						var ctrl = this.lingoController;

						var callback = function (obj) {
							var data = obj.data;
							widget.viewWODetails(data.workOrderNo, ctrl, obj.data);

						}
						ctrl.getFnWorkOderDetails(id, callback);

					} else {
						widget.accountSearch.getAccountDetails(searchKey, searchValue, regExp, activeFlag);
					}


				}
			}
			widget.acctTabContainer.selectChild(widget.accountTab);

			//widget.lingoController.searchUser(searchKey, searchValue, regExp, lang.hitch(this, widget.searchUser.populateAccountDetails));
		},
		clearDetails: function () {
			var widget = this;
			widget.accountSearch.clear();
			widget.createCase.clear();
			widget.accountHierarchy.clear();
		},
		validateSearchValue: function (searchKey, searchValue, flag) {
			var widget = this;
			if (searchKey == "App ID") {
				var pattern = new RegExp("^[0-9A-Za-z,-.]+$");
				if (!pattern.test(searchValue)) {
					new messageWindow({
						message: "Please enter a valid App ID!!",
						title: "Note"
					});
					flag = false;
				}
				if (flag == false) {
					return flag;
				}
			}
			if (searchKey == "Service Number") {
				var pattern = new RegExp("^[0-9A-Za-z,_.-]+$");
				if (!pattern.test(searchValue)) {
					new messageWindow({
						message: "Please enter a valid Service Number!!",
						title: "Note"
					});
					flag = false;
				}
				if (flag == false) {
					return flag;
				}
			}
			if (searchKey == "Contact Phone") {
				var pattern = new RegExp("^\\d{10}$");
				if (!pattern.test(searchValue)) {
					new messageWindow({
						message: "Please enter a valid Contact Phone!!",
						title: "Note"
					});
					flag = false;
				}
				if (flag == false) {
					return flag;
				}
			}

			if (searchKey == "Contact Email") {
				var pattern = new RegExp("^[^`^]*$");
				if (!pattern.test(searchValue)) {
					new messageWindow({
						message: "Please enter a valid Contact Email!!",
						title: "Note"
					});
					flag = false;
				}
				if (flag == false) {
					return flag;
				}
			}

			if (searchKey == "Case Number") {
				var pattern = new RegExp("^\\d+$");
				if (!pattern.test(searchValue)) {
					new messageWindow({
						message: "Please enter a valid Case Number!!",
						title: "Note"
					});
					flag = false;
				}
				if (flag == false) {
					return flag;
				}
			}

			if (searchKey == "Work Order") {
				var pattern = new RegExp("^(WO[0-9]+|[0-9]+)$");
				if (!pattern.test(searchValue)) {
					new messageWindow({
						message: "Please enter a valid Work Order Number!!",
						title: "Note"
					});
					return false;
				}

			}

			if (searchKey == "External Work Order") {
				var pattern = new RegExp("^\\d+$");
				if (!pattern.test(searchValue)) {
					new messageWindow({
						message: "Please enter a valid External Work Order Number!!",
						title: "Note"
					});
					return false;
				}
			}
			if (searchKey == "Task Number") {
				var pattern = new RegExp("^(T[0-9]+|[0-9]+)$");
				if (!pattern.test(searchValue)) {
					new messageWindow({
						message: "Please enter a valid Task Number!!",
						title: "Note"
					});
					return false;
				}



			}
			if (searchKey == "Customer Name") {
				var pattern = new RegExp("^[^`^]*$");
				if (!pattern.test(searchValue)) {
					new messageWindow({
						message: "Please enter a valid Customer Name!!",
						title: "Note"
					});
					flag = false;
				}
				if (flag == false) {
					return flag;
				}
			}

			if (searchKey == "Location Address") {
				var pattern = new RegExp("^[^`^]*$");
				if (!pattern.test(searchValue)) {
					new messageWindow({
						message: "Please enter a valid Location Address!!",
						title: "Note"
					});
					flag = false;
				}
				if (flag == false) {
					return flag;
				}
			}

			return true;
		},
		clearAccountDetails: function () {
			var widget = this;
			widget.cp_searchText.set("value", null);
			widget.accountSearch.clear();
			widget.createCase.clear();
			widget.accountHierarchy.clear();
		},
		destroy: function () {
			this.adminPanelContentPane.destroyRecursive(false);
			this.inherited(arguments);
		}
	});

});



