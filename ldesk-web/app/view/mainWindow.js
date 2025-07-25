define([
	"dojo/_base/declare",
	"dijit/layout/BorderContainer",
	"dijit/layout/ContentPane",
	"dojo/_base/lang",
	"dojo/io-query",
	"app/controller/LingoController",
	"app/widgets/controlPanel",
	"app/widgets/header",
	"dijit/registry",
	"dojo/domReady!"
], function (declare, BorderContainer, ContentPane, lang, ioQuery, LingoController, ControlPanel, Header, registry, template) { // jshint ignore:line
	var widget = null;

	return declare(null, { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;

			widget.lingoController = new LingoController({ info: {} });
			this.buildUI();
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {

		},
		buildUI: function () {
			var widget = this;
			this.inherited(arguments);

			// create a BorderContainer as the top widget in the hierarchy
			this.bc = new BorderContainer({
				id: "mainContainer",
				style: "height: 100%; width: 100%;",
				design: 'sidebar',
				gutters: false
			});

			// create a ContentPane as the top pane in the BorderContainer
			var cp1 = new ContentPane({
				id: "headerContainer",
				region: "top",
				gutters: false,
				style: "width: 100%;padding: 0px",
			});

			//Add the header widget
			var header = new Header({ lingoController: widget.lingoController });
			cp1.addChild(header);

			// create a ContentPane as the center pane in the BorderContainer
			var cp2 = new ContentPane({
				id: "contentContainer",
				region: "center",
				gutters: false,
				style: "width: 100%;padding: 1px",
			});

			//Add the controlPanel widget
			this.ctrlPanel = new ControlPanel({ lingoController: widget.lingoController });
			cp2.addChild(this.ctrlPanel);

			// create a ContentPane as the bottom pane in the BorderContainer
			/*
			var cp3 = new ContentPane({
				id: "bottomContainer",
				region: "bottom",
				gutters: true,
				style: "border: 1px solid #b6bcc7;"
			});
			*/
			this.bc.addChild(cp1);
			this.bc.addChild(cp2);
			//this.bc.addChild(cp3);

			// put the top level widget into the document, and then call startup()
			document.body.appendChild(this.bc.domNode);
			this.bc.startup();

			this.handleQueryString();
		},
		handleQueryString: function () {
			var uri = location.search;

			var query = uri.substring(uri.indexOf("?") + 1, uri.length);
			var queryObject = ioQuery.queryToObject(query);
			if (queryObject.appId) {
				var appId = queryObject.appId;
				this.ctrlPanel.searchSelect.set("value", "App ID");
				this.ctrlPanel.cp_searchText.set("value", appId);
				this.ctrlPanel.getAccountInfo();
				if (queryObject.view != "cp") {
					this.lingoController.viewAccountDetails(appId, this.lingoController);
				}

			}

			if (queryObject.reportId) {
				var reportId = queryObject.reportId;
				if (queryObject.view == "email") {
					this.lingoController.viewReportEmail({ id: reportId }, this.lingoController);
				} else {
					this.lingoController.viewReportDetails({ id: reportId }, this.lingoController);
				}
			}

			if (queryObject.dbId) {
				var dbId = queryObject.dbId;
				if (queryObject.view == "email") {
					this.lingoController.viewDashboardEmail({ id: dbId }, this.lingoController);
				} else {
					this.lingoController.viewDashboardDetails({ id: dbId }, this.lingoController);
				}

			}


			if (queryObject.hasOwnProperty('reports')) {
				registry.byId("appTabContainer").selectChild(registry.byId("reportsTab"));
			}

			if (queryObject.hasOwnProperty('dashboard')) {
				registry.byId("appTabContainer").selectChild(registry.byId("dashboardTab"));
			}

			if (queryObject.caseId) {
				var caseId = queryObject.caseId;
				var caseNumber = this.formatCaseNumber(caseId);
				var ctrl = this.lingoController;

				var callback = function (obj) {
					ctrl.viewCaseDetails(caseNumber, ctrl, obj.data);
				}
				ctrl.getCaseDetails(caseId, callback);

				//this.lingoController.viewCaseDetails({ id: caseId }, this.lingoController);
			}

			if (queryObject.woId) {
				var woId = parseInt(queryObject.woId.replace(/\D/g, ''));
				var ctrl = this.lingoController;

				var callback = function (obj) {
					ctrl.viewWODetails(obj.data.workOrderNo, ctrl, obj.data);
				}
				ctrl.getWorkOrderDetails(woId, callback);

			}

			if (queryObject.taskId) {
				var taskId = parseInt(queryObject.taskId.replace(/\D/g, ''));
				var ctrl = this.lingoController;

				var callback = function (obj) {
					ctrl.viewTaskDetails(obj.data.taskNumber, ctrl, obj.data);
				}
				ctrl.getTaskDetails(taskId, callback);

			}
		},
		formatCaseNumber: function (value) {
			return String(value).padStart(8, '0');
		},

		destroy: function () {
			this.inherited(arguments);
			//this.bc.destroyRecursive();
			console.log("Destroyed!!");
		}
	});

});
