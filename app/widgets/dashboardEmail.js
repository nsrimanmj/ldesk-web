const { style } = require("dojo/main");

define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dijit/registry",
	"dijit/layout/ContentPane",
	"app/widgets/createReport",
	"dgrid/OnDemandGrid",
	"dojox/grid/EnhancedGrid",
	"dojo/store/Memory",
	"dstore/Memory",
	"dojo/store/Observable",
	"dojo/dom-construct",
	"dojox/layout/GridContainer",
	'dojox/widget/Portlet',
	"dgrid/Selection",
	"dgrid/Selector",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	"app/view/summaryRow",
	"app/view/messageWindow",
	"dojo/topic",
	"dijit/ConfirmDialog",
	"app/widgets/createDashboard",
	"app/widgets/schedule",
	"dijit/form/Button",
	"dojo/text!app/widgets/templates/dashboard_email.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, domStyle, on, registry, ContentPane, CreateReport,
	OnDemandGrid, EnhancedGrid, Memory, StoreMemory, Observable, domConstruct, GridContainer, Portlet, Selection, Selector, DijitRegistry, ColumnResizer,
	ColumnReorder, ColumnHider, Keyboard, SummaryRow, messageWindow, topic, ConfirmDialog, CreateDashboard, Schedule, Button, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			this.dbId = this.info.id;
			this.getDashboardData();

			this.filterStore = Observable(new StoreMemory({
				idProperty: 'caseId',
				data: []
			}));

			this.reportStore = Observable(new StoreMemory({
				data: []
			}));


		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {

		},
		getDashboardData: function () {
			var widget = this;
			var callback = function (obj) {
				widget.data = obj.data;
				widget.showDashboard(obj.data);
			}
			req = {
				id: this.dbId
			}
			this.ctrl.getAPI("dashboard", req, callback, false, true);
		},
		showDashboard: function (data) {
			var widget = this;
			this.dbNameSpan.innerHTML = data.name + " (" + data.folderGroup + ")";
			this.dbIdSpan.innerHTML = this.formatId(this.dbId);

			if (!this.checkReportPermission(data, "dashboard")) {
				domStyle.set(this.buttonDiv, "display", "none");
				domStyle.set(this.dashboardDiv.domNode, "display", "none");
				domStyle.set(this.errorDiv, "display", "flex");
				return;
			}

			data.items.forEach(item => {
				widget.addDashboardItem(item);
			});
		},
		postCreate: function () {
			var widget = this;
			this.inherited(arguments);

			// create grid and put into border container
			//var grid = new GridContainer({ nbZones: 3 }, "gridDIv");

			on(widget.closeWindowBtn, "click", function () {
				//registry.byId("appTabContainer").selectChild(registry.byId("controlPanelContentPane"));
				widget.closeWindow();
			})

		},
		closeWindow: function () {
			var widget = this;
			registry.byId("appTabContainer").selectChild(registry.byId("dashboardTab"));

			var contentPane = registry.byId("dashboard_email_" + widget.dbId);
			registry.byId("appTabContainer").removeChild(contentPane);
			contentPane.destroyRecursive();
		},
		getReportList: function (req) {
			var widget = this;
			var callback = function (obj) {
				widget.reportStore.setData(obj.data);
				widget.reportGrid.refresh();
				widget.reportGrid.resize();
			}

			this.ctrl.getAPI("reportList", req, callback);
		},
		addDashboardItem: function (item) {
			var widget = this;
			var id = this.dbId;
			var itemId = item.id;
			var divId = "item_" + id + "_" + itemId;
			var cellId = "cell_" + id + "_" + itemId;
			var loadingId = "loading_" + id + "_" + itemId;

			var containerDiv = domConstruct.create("div", {
				class: 'dashboard-item',
				id: "container_" + id + "_" + itemId
			}, widget.dashboardDiv);

			var titleDiv = domConstruct.create("div", {
				class: "dijitTitlePaneTitle dijitTitlePaneTitleFixedOpen",
				style: "display: flex;align-items: center;flex: 0 0 20px;"
			}, containerDiv);

			domConstruct.create("label", {
				innerHTML: "<b>" + item.reportName + "</b>",
				style: "display: inline-block;width:90%;vertical-align: middle;text-align:left"
			}, titleDiv)

			var loadingDiv = domConstruct.create("div", {
				class: 'dashboard-img',
				id: loadingId
			}, containerDiv);

			var imgDiv = domConstruct.create("img", {
				src: "images/loading_icon.gif"
			}, loadingDiv);

			var itemDiv = domConstruct.create("div", {
				id: divId,
				style: "display: none;text-align: -webkit-center;flex: 1 1 auto;"
			}, containerDiv);

			if (item.reportType == "summary") {
				var plainDiv = domConstruct.create("div", {
					id: divId + "_plain",
					style: "display:none;text-align: -webkit-center;flex: 1 1 auto;"
				}, containerDiv);

			}

			if (item.reportType == "chart") {
				var plainDiv = domConstruct.create("img", {
					id: divId + "_plain",
					style: "display: none",
					src: ""
				}, containerDiv);

			}

			var callback = function (obj) {
				domStyle.set(dojo.byId(loadingId), "display", "none");
				domStyle.set(dojo.byId(divId), "display", "inline-block");
				widget.showDashboardItem(obj.data, divId, item)
			}

			this.ctrl.getAPI("report", { id: item.reportId }, callback);

		},
		getTotalColor: function (config, value) {

			var intVal = parseInt(value);

			var color = "#008000";
			if (!config) {
				return color;
			}
			//var config = JSON.parse(config);

			if (intVal < config.range1Value) {
				color = config.range1Color;
			}

			if (intVal > config.range1Value && intVal <= config.range2Value) {
				color = config.range2Color;
			}

			if (intVal > config.range2Value) {
				color = config.range3Color;
			}

			return color;
		},
		showDashboardItem: function (obj, divId, item) {
			var widget = this;
			var config = obj.config;
			var reportData = obj.data;
			this.reportInfo = obj;
			var type = item.reportType;

			if (!this.checkReportPermission(config, "report")) {
				dojo.byId(divId).innerHTML = '<div data-dojo-attach-point="errorDiv" style="height: 290px;justify-content: center;align-items: center;display: flex;">' +
					'<label style = "font-weight: bold;color: red;" > You do not have permission to view this Report!! <br>Group: <i>' +
					config.folderGroup + '</i> Created By: <i>' + config.createdUser +
					'</i></label></div > ';
				return;
			}

			var summaryConfig = JSON.parse(config.summaryConfig);
			var chartConfig = JSON.parse(config.chartConfig);
			var detailsConfig = JSON.parse(config.detailsConfig);
			var fmConfig = summaryConfig;

			if (!fmConfig.dataSource) {
				fmConfig.dataSource = {};
			}

			if (!fmConfig.options) {
				fmConfig.options = {};
			}

			if (!fmConfig.options.grid) {
				fmConfig.options.grid = {};
			}

			fmConfig.dataSource.data = reportData;
			fmConfig.dataSource.nullValueReplacement = "N/A"
			fmConfig.options.configuratorButton = false;
			fmConfig.options.validateFormulas = false;
			fmConfig.options.showEmptyData = false;
			fmConfig.options.grid.showHeaders = false;

			if (type == "total") {
				var config = {
					range1Value: 33,
					range2Value: 66,
					range1Color: "#008000",
					range2Color: "#FFA500",
					range3Color: "#ff0000"
				};

				if (item.config) {
					var itemConfig = JSON.parse(item.config);
					config = itemConfig.range;
				}
				var total = reportData.length;
				var color = this.getTotalColor(config, total);
				var id = "total_" + widget.dbId + "_" + item.id;
				dojo.byId(divId).innerHTML = "<div  style=\"width: 100%;height: 120px	;display: flex; justify-content: center;align-items: center;font-size: 100px\;color:" + color + "\" id = " + id + ">" + reportData.length + "</div";
			}

			var height = 600;
			const params = {
				header: "<b>" + config.name + "</b>",
				footer: "<div style='color:#df3800'>Generated at: ##CURRENT-DATE## </div>",
				destinationType: "plain"
			};

			if (type == "summary") {
				fmConfig.options.viewType = "grid";
				//var height = screen.height - 350;
				new Flexmonster({
					container: "#" + divId,
					componentFolder: "external/flexmonster/",
					toolbar: false,
					height: height,
					report: fmConfig,
					licenseKey: environment.fmKey,
					reportcomplete: function () {
						var pivot = dojo.byId(divId).uielement.flexmonster;
						pivot.off("reportcomplete");
						setTimeout(function () {
							pivot.exportTo('html', params, html => {
								dojo.byId(divId + "_plain").innerHTML = html.data;
								domStyle.set(dojo.byId(divId + "_plain"), "display", "block");
							});
						}, 100)
					}
				});
			}

			if (type == "chart") {
				var chartSettings = dojo.clone(fmConfig);
				chartConfig.showFilter = false;
				chartConfig.showMeasures = false;
				chartConfig.showDataLabels = false;
				chartConfig.showLegend = false;
				chartSettings.options.viewType = "charts";
				chartSettings.options.chart = chartConfig;

				new Flexmonster({
					container: "#" + divId,
					componentFolder: "external/flexmonster/",
					toolbar: false,
					report: chartSettings,
					height: height,
					licenseKey: environment.fmKey,
					reportcomplete: function () {
						var pivot = dojo.byId(divId).uielement.flexmonster;
						pivot.off("reportcomplete");
						pivot.exportTo('image', params, img1 => {
							// Create a new canvas element
							const canvas = img1.data;
							var base64 = canvas.toDataURL("image/png");
							dojo.byId(divId + "_plain").src = base64;
							domStyle.set(dojo.byId(divId + "_plain"), "display", "block");
						});
					}
				});
			}

			if (type == "details") {
				var reportType = config.type;
				if (!reportType) {
					reportType = "Case";
				}

				if (reportType == "Case") {
					this.detailsColumns = [
						{ title: "Created Date", field: "createdDate", width: 150, responsive: 0 },
						{ title: "Case Number", field: "caseNumber", width: 150, responsive: 0 },
						{ title: "Account Id", field: "accountId", width: 150, responsive: 0 },
						{ title: "Record Type", field: "recordType", width: 150, responsive: 0 },
						{ title: "Queue", field: "queue", width: 150, responsive: 1 },
						{ title: "Category", field: "category", width: 150, responsive: 1 },
						{ title: "Type", field: "type", width: 150, responsive: 1 },
						{ title: "Subtype", field: "subtype", width: 150, responsive: 1 },
						{ title: "Status", field: "status", width: 150, responsive: 2 },
						{ title: "Sub Status", field: "subStatus", width: 150, responsive: 2 },
						{ title: "Case Origin", field: "origin", width: 150, responsive: 2 },
						{ title: "Service Number", field: "serviceNumber", width: 150, responsive: 3 },
						{ title: "Closed Date", field: "closedDate", width: 150, responsive: 2 },
						{ title: "Subject", field: "subject", width: 200, responsive: 3 },
						{ title: "Owner", field: "ownerName", width: 150, responsive: 3 },
						{ title: "Shift Group", field: "shiftGroup", width: 200, responsive: 3 },
						{ title: "Contact Name", field: "contactName", width: 150, responsive: 3 },
						{ title: "Contact Email", field: "contactEmail", width: 150, responsive: 3 },
						{ title: "Contact Phone", field: "contactPhone", width: 150, responsive: 3 },
						{ title: "Source", field: "source", width: 150, responsive: 3 }
					]
				}

				if (reportType == "User Activity") {
					this.detailsColumns = [
						{
							title: "Activity Date", field: "activityDate", width: 150, responsive: 0, formatter: function (cell, formatterParams, onRendered) {
								return widget.formatDateStr(cell.getValue(), "YYYY-MM-DD");
							}
						},
						{ title: "User Id", field: "userId", width: 150, responsive: 0 },
						{ title: "User Name", field: "userName", width: 150, responsive: 0 },
						{ title: "Shift Group", field: "shiftGroup", width: 150, responsive: 0 },
						{ title: "Profile Name", field: "profileName", width: 150, responsive: 0 },
						{ title: "Record Type", field: "recordType", width: 150, responsive: 0 },
						{ title: "Case Open Count", field: "caseOpenCount", width: 150, responsive: 1 },
						{ title: "Case Close Count", field: "caseCloseCount", width: 150, responsive: 1 },
						{ title: "Internal Note Count", field: "intNoteCount", width: 150, responsive: 1 },
						{ title: "Public Note Count", field: "pubNoteCount", width: 150, responsive: 1 },
						{ title: "Email Count", field: "emailCount", width: 150, responsive: 1 },
						{ title: "Work Order Count", field: "woOpenCount", width: 150, responsive: 1 }
					]
				}

				this.viewDetailsTable = new Tabulator("#" + divId, {
					height: "250px",
					data: reportData,
					layout: "fitColumns",
					groupBy: detailsConfig.groupBy,
					columns: this.detailsColumns
				});
			}
		},
		destroy: function () {
			this.inherited(arguments);

			if (this.handle) {
				this.handle.remove();
			}
		}
	});

});
