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
	"dstore/Memory",
	"dojo/store/Observable",
	"app/widgets/schedule",
	"dijit/ConfirmDialog",
	"app/view/messageWindow",
	"dojo/dom-construct",
	"dojox/widget/Toaster",
	"dojo/topic",
	"dojo/text!app/widgets/templates/view_report.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, domStyle, on, registry, ContentPane, CreateReport,
	OnDemandGrid, EnhancedGrid, StoreMemory, Observable, Schedule, ConfirmDialog, messageWindow, domConstruct, Toaster, topic, template) { // jshint ignore:line

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			this.reportId = this.info.id;
			this.getReportData();

			this.filterStore = Observable(new StoreMemory({
				idProperty: 'caseId',
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
		getReportData: function () {
			var widget = this;
			var callback = function (obj) {
				widget.showReport(obj.data);
			}
			req = {
				id: this.reportId
			}
			this.ctrl.getAPI("report", req, callback, false, true);
		},
		postCreate: function () {
			var widget = this;
			this.inherited(arguments);

			on(widget.closeWindowBtn, "click", function () {
				//registry.byId("appTabContainer").selectChild(registry.byId("controlPanelContentPane"));
				widget.closeWindow();
			})

			on(widget.editBtn, "click", function () {
				widget.showEditReport();
			});

			on(widget.cloneBtn, "click", function () {
				widget.showEditReport(true);
			});

			on(widget.deleteBtn, "click", function () {
				var confirmDlg = new ConfirmDialog({
					title: "Delete Report",
					content: "Do you really want to Delete Report:  <i>" + widget.reportId + "</i>?",
					style: "width: 400px",
					onExecute: function () { widget.deleteReport() }
				});
				confirmDlg.set("buttonOk", "Delete");
				confirmDlg.set("buttonCancel", "No");
				confirmDlg.show();
			});

			var Grid = declare([OnDemandGrid]);
			var filterLayout = [
				{ label: "Field", field: "field" },
				{ label: "Value", field: "value" }
			];

			widget.filterGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Filter found !!",
				collection: widget.filterStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: filterLayout,
				allowTextSelection: true,
				selectionMode: "single",
				rowSelector: '20px'
			}, widget.filterGridDiv);

			widget.filterGrid.startup();
			widget.filterGrid.refresh();

			on(widget.filterDialog, "show", function () {
				widget.filterGrid.resize();
			})

			on(widget.downloadCSV, "click", function () {
				widget.viewDetailsTable.download("csv", "report-" + widget.reportId + ".csv");
			})

			on(widget.downloadXLSX, "click", function () {
				widget.viewDetailsTable.download("xlsx", "report-" + widget.reportId + ".xlsx");
			})

			on(widget.scheduleBtn, "click", function () {
				widget.reportInfo.id = widget.reportId;
				new Schedule({ info: widget.reportInfo, type: "report", ctrl: widget.ctrl });
			})

			on(widget.detailsBtn, "click", function () {
				widget.detailsDlg.show();
			})

			on(widget.cancelDetailsBtn, "click", function () {
				widget.detailsDlg.hide();
			})

			on(widget.exportDetailsBtn, "click", function () {
				var content = widget.convertToCSV(widget.reportInfo.data);

				var filename = "report-" + widget.reportId + ".csv";

				var link = domConstruct.create('a', {});
				var mimeType = 'text/html' || 'text/plain';

				link.setAttribute('download', filename);
				link.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(content));
				link.click();
				widget.downloadToster.setContent("Details downloaded!!", "message", 2000);
				widget.downloadToster.show();

			})


			on(widget.exportSummaryBtn, "click", function () {

				var params = {
					destinationType: "plain",
					header: widget.reportInfo.config.name + " (id: " + widget.reportId + ")",
					filename: "report_summary_" + widget.reportId + ".csv"
				};
				widget.pivotGrid.exportTo("csv", params, function (result, error) {

					if (error) {
						new messageWindow({
							message: "Download Failed: " + error,
							title: "Error"
						});

						return;
					}
					var content = result.data;

					var filename = "report-summary" + widget.reportId + ".csv";

					var link = domConstruct.create('a', {});
					var mimeType = 'text/html' || 'text/plain';

					link.setAttribute('download', filename);
					link.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(content));
					link.click();
					widget.downloadToster.setContent("Summary downloaded!!", "message", 2000);
					widget.downloadToster.show();
				});
			})


			on(widget.exportChartBtn, "click", function () {

				var params = {
					header: "<div style='width: 100%;text-align: center;font-size: 12px;font-weight: bold'>" + widget.reportInfo.config.name + " (id: " + widget.reportId + ")</div>",
					filename: "report_chart_" + widget.reportId + ".png"
				};
				widget.pivotChart.exportTo('image', params, function (result, error) {
					if (error) {
						new messageWindow({
							message: "Download Failed: " + error,
							title: "Error"
						});

						return;
					}

					widget.downloadToster.setContent("Chart downloaded!!", "message", 2000);
					widget.downloadToster.show();
				});
			});
		},
		deleteReport: function () {
			var widget = this;
			var callback = function (obj) {
				widget.ctrl.showSuccessMessage(obj);
				widget.closeWindow();
				topic.publish("/lingoController/reportUpdated", obj.data);
			}

			this.ctrl.deleteAPI("report", { id: this.reportId }, callback);
		},
		closeWindow: function () {
			var widget = this;
			registry.byId("appTabContainer").selectChild(registry.byId("reportsTab"));

			var contentPane = registry.byId("report_contentPane_" + widget.reportId);
			registry.byId("appTabContainer").removeChild(contentPane);
			contentPane.destroyRecursive();
		},
		showEditReport: function (isClone) {
			var widget = this;
			var data = this.reportInfo;

			tabId = "update_report_content_pane_" + this.reportId;
			title = "Edit Report: " + this.reportId;

			if (isClone) {
				tabId = "clone_report_content_pane_" + this.reportId;
				title = "Clone Report: " + this.reportId;
			}

			if (registry.byId(tabId)) {
				registry.byId("appTabContainer").selectChild(tabId);
				return;
			}
			var editPane = new ContentPane({
				id: tabId,
				title: title,
				style: "overflow-y: auto",
				closable: false,
				onClose: function () {
					editPane.getParent().removeChild(editPane);
					editPane.destroyRecursive();
					widget.viewReportDetails({ id: widget.reportId }, widget.ctrl)
					//registry.byId("appTabContainer").selectChild(registry.byId("reportsTab"));
				}
			});

			data.id = this.reportId;
			var createView = new CreateReport({
				'lingoController': widget.ctrl,
				'contentPane': editPane,
				'info': data,
				'isUpdate': true,
				'isClone': isClone
			});

			var contentPane = registry.byId("report_contentPane_" + widget.reportId);
			registry.byId("appTabContainer").removeChild(contentPane);
			contentPane.destroyRecursive();

			editPane.addChild(createView);
			registry.byId("appTabContainer").addChild(editPane);
			registry.byId("appTabContainer").selectChild(editPane);
			registry.byId("appTabContainer").startup();

			//this.reportPane.addChild(createView);
		},
		showReport: function (obj) {

			var widget = this;

			var config = obj.config;
			var reportData = obj.data;
			this.reportInfo = obj;

			this.reportNameSpan.innerHTML = config.name + " (" + config.folderGroup + ")";
			this.reportIdSpan.innerHTML = this.formatCaseNumber(this.reportId);
			domStyle.set(this.loadingDiv, "display", "none");
			if (!this.checkReportPermission(config, "report")) {
				domStyle.set(this.buttonDiv, "display", "none");
				domStyle.set(this.reportDiv, "display", "none");
				domStyle.set(this.errorDiv, "display", "flex");
				return;
			}
			domStyle.set(this.reportDiv, "display", "block");
			var summaryConfig = JSON.parse(config.summaryConfig);
			var chartConfig = JSON.parse(config.chartConfig);
			var detailsConfig = JSON.parse(config.detailsConfig);
			var filterConfig = JSON.parse(config.filterConfig);

			this.setFilterStore(obj.filter);

			if (!summaryConfig.include) {
				domStyle.set(this.summaryFS.domNode, "display", "none")
			}

			if (!chartConfig.include) {
				domStyle.set(this.chartFS.domNode, "display", "none")
			}

			if (!detailsConfig.include) {
				domStyle.set(this.detailsFS.domNode, "display", "none")
			}

			domStyle.set(this.summayLoadingDiv, "display", "none");
			domStyle.set(this.chartLoadingDiv, "display", "none");
			domStyle.set(this.viewPivotReport, "display", "flex");
			domStyle.set(this.viewPivotChart, "display", "block");

			var gridConfig = summaryConfig;
			if (!gridConfig.dataSource) {
				gridConfig.dataSource = {};
			}

			if (!gridConfig.options) {
				gridConfig.options = {};
			}

			if (!gridConfig.options.grid) {
				gridConfig.options.grid = {};
			}

			gridConfig.dataSource.data = reportData;
			gridConfig.options.configuratorButton = false;
			gridConfig.options.showEmptyData = false;
			gridConfig.options.validateFormulas = false;
			gridConfig.options.grid.showHeaders = false;
			gridConfig.options.viewType = "grid";
			//gridConfig.options.autoSwitchToCompact = false;

			var height = screen.height - 390;

			widget.pivotGrid = new Flexmonster({
				container: "#viewPivotReport_" + this.reportId,
				componentFolder: "external/flexmonster/",
				toolbar: false,
				height: height,
				report: gridConfig,
				licenseKey: environment.fmKey
			});

			var chartSettings = dojo.clone(gridConfig);
			chartConfig.showFilter = false;
			chartConfig.showMeasures = false;
			chartConfig.showDataLabels = false;
			chartConfig.showLegend = false;
			chartSettings.options.viewType = "charts";
			chartSettings.options.chart = chartConfig;

			domStyle.set(this.viewPivotChartWrapper, "height", height + "px");

			widget.pivotChart = new Flexmonster({
				container: "#viewPivotChart_" + this.reportId,
				componentFolder: "external/flexmonster/",
				toolbar: false,
				height: "70%",
				width: "95%",
				report: chartSettings,
				licenseKey: environment.fmKey
			});
			widget.pivotChart.refresh();

			this.caseColumns = [
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
				{ title: "Source", field: "source", width: 150, responsive: 3 },
				{ title: "First Call Resolution ", field: "fcr", width: 200, responsive: 3 },
				{ title: "Total Open Time", field: "totalOpenTime", width: 150, responsive: 3 },
				{ title: "Closed By", field: "closedBy", width: 200, responsive: 3 },
				{ title: "Account Name", field: "accountName", width: 150, responsive: 3 },
				{ title: "Resolution Tier 1", field: "resolutionTier1", width: 150, responsive: 3 },
				{ title: "Resolution Tier 2", field: "resolutionTier2", width: 150, responsive: 3 },
				{ title: "Post Mortem", field: "postMortem", width: 150, responsive: 3 },
				{ title: "Account State", field: "accountState", width: 150, responsive: 3 },
				{ title: "Service Number Billing Type", field: "servBillingType", width: 150, responsive: 3 },
				{ title: "Service State", field: "serviceState", width: 150, responsive: 3 },
				{ title: "Service Priority", field: "servicePriority", width: 150, responsive: 3 }
			];

			this.userColumns = [
				{
					title: "Activity Date", field: "activityDate", width: 120, responsive: 0, formatter: function (cell, formatterParams, onRendered) {
						return widget.formatDateStr(cell.getValue(), "YYYY-MM-DD");
					}
				},
				{ title: "User Id", field: "userId", width: 100, responsive: 0 },
				{ title: "User Name", field: "userName", width: 150, responsive: 0 },
				{ title: "Shift Group", field: "shiftGroup", width: 150, responsive: 0 },
				{ title: "Record Type", field: "recordType", width: 150, responsive: 0 },
				{ title: "Case Open Count", field: "caseOpenCount", width: 150, responsive: 1 },
				{ title: "Case Close Count", field: "caseCloseCount", width: 150, responsive: 1 },
				{ title: "Internal Note Count", field: "intNoteCount", width: 150, responsive: 1 },
				{ title: "Public Note Count", field: "pubNoteCount", width: 150, responsive: 1 },
				{ title: "Email Count", field: "emailCount", width: 150, responsive: 1 },
				{ title: "Work Order Count", field: "woOpenCount", width: 150, responsive: 1 }
			];

			this.workOrderColumns = [
				{ title: "Work Order Record Type", field: "workOrderType", width: 150, responsive: 0 },
				{ title: "Case Service Number", field: "serviceNumber", width: 150, responsive: 0 },
				{ title: "Account Name", field: "account", width: 150, responsive: 0 },
				{ title: "Account : Migration Source", field: "billingSystem", width: 150, responsive: 0 },
				{ title: "Work Order Number", field: "workOrderNo", width: 150, responsive: 1 },
				{ title: "Waive Dispatch Fee", field: "waiveDispatchFee", width: 150, responsive: 1 },
				{ title: "Apply Charges to Billing", field: "applyCharges2Billing", width: 150, responsive: 1 },
				{ title: "Charges Applied to Billing", field: "billing", width: 150, responsive: 1 },
				{ title: "Client Charge", field: "clientCharge", width: 150, responsive: 2 },
				{ title: "Time Log Hours", field: "timeLogHours", width: 150, responsive: 2 },
				{ title: "Labor Total", field: "laborTotal", width: 150, responsive: 2 },
				{ title: "Materials Total", field: "materialsTotal", width: 150, responsive: 3 },
				{ title: "Penalties / Fees total", field: "penalties", width: 150, responsive: 2 },
				{ title: "Billing Charge Note", field: "billChargeNote", width: 200, responsive: 3 },
				{ title: "Sub-Status", field: "subStatus", width: 150, responsive: 3 },
				{ title: "Status", field: "status", width: 200, responsive: 3 },
				{ title: "Dispatch Type", field: "dispatchType", width: 150, responsive: 3 },
				{ title: "External Ticket Number", field: "externalTktNum", width: 150, responsive: 3 },
				{ title: "Dispatch Date/ETR", field: "dispatchDate", width: 150, responsive: 3 },
				{ title: "Dispatch Start Date", field: "dispatchStart", width: 150, responsive: 3 },
				{ title: "Dispatch End Date ", field: "dispatchEnd", width: 200, responsive: 3 },
				{ title: "Service Address", field: "serviceAddress", width: 150, responsive: 3 },
				{ title: "Queue", field: "queueName", width: 200, responsive: 3 },
				{ title: "Work Order Owner", field: "ownerName", width: 150, responsive: 3 },
				{ title: "Primary Dispatch Contact Name", field: "dispatchConName", width: 150, responsive: 3 },
				{ title: "Primary Dispatch Contact #", field: "dispatchConNo", width: 150, responsive: 3 },
				{ title: "Primary Dispatch Contact Email", field: "dispatchEmail", width: 150, responsive: 3 },
				{ title: "Open Code", field: "openCode", width: 150, responsive: 3 },
				{ title: "Close Code", field: "closeCode", width: 150, responsive: 3 },
				{ title: "Resolution Description", field: "resDescr", width: 150, responsive: 3 },
				{ title: "Created By", field: "createdUser", width: 150, responsive: 3 },
				{ title: "Created Date", field: "createdOn", width: 150, responsive: 3 },
				{ title: "Closed By", field: "closedUser", width: 150, responsive: 3 },
				{ title: "Closed Date", field: "closedOn", width: 150, responsive: 3 },
				{ title: "Pay Type", field: "payType", width: 150, responsive: 3 },
				{ title: "Work Order Cost", field: "woCost", width: 150, responsive: 3 },
				{ title: "Total Billed to Site", field: "totalBill", width: 150, responsive: 3 },
				{ title: "Itemized Total", field: "itemizedTotal", width: 150, responsive: 3 },
				{ title: "Rate", field: "rate", width: 150, responsive: 3 },
				{ title: "FN Labor Cost", field: "fnLaborCost", width: 150, responsive: 3 },
				{ title: "Expenses", field: "expenses", width: 150, responsive: 3 },
			];

			this.woChargeItemColumns = [
				{ title: "Work Order Record Type", field: "workOrderType", width: 150, responsive: 0 },
				{ title: "Work Order Number", field: "workOrderNo", width: 150, responsive: 0 },
				{ title: "Wo-Charge Itemization Name", field: "chargeItemName", width: 150, responsive: 0 },
				{ title: "Apply Charges to Client", field: "applyCharges2Client", width: 150, responsive: 0 },
				{ title: "Charge Type", field: "chargeType", width: 150, responsive: 1 },
				{ title: "Sub-Type", field: "subType", width: 150, responsive: 1 },
				{ title: "1/2 Hour Rate", field: "halfHourRate", width: 150, responsive: 1 },
				{ title: "1st Hour Rate", field: "firstHourRate", width: 150, responsive: 1 },
				{ title: "Client Charge", field: "clientCharge", width: 150, responsive: 1 },
				{ title: "Created By : Full Name", field: "createdBy", width: 150, responsive: 1 },
				{ title: "Created Date", field: "createdDate", width: 150, responsive: 0 },
				{ title: "Item Description", field: "description", width: 150, responsive: 0 },
				{ title: "Labor Hours Quoted", field: "laborHrsQuoted", width: 150, responsive: 0 },
				{ title: "Markup", field: "markup", width: 150, responsive: 0 },
				{ title: "Material Cost", field: "materialCost", width: 150, responsive: 1 },
				{ title: "Quoted Amount", field: "quotedAmount", width: 150, responsive: 1 },
				{ title: "Subtotal", field: "subTotal", width: 150, responsive: 1 },
				{ title: "Total Labor Hours", field: "totalLaborHrs", width: 150, responsive: 1 },
				{ title: "Account", field: "accountName", width: 150, responsive: 1 },
				{ title: "Account : Migration Source", field: "billingSystem", width: 150, responsive: 1 },
				{ title: "Case Number", field: "caseId", width: 150, responsive: 0 },
				{ title: "Case Service Number", field: "serviceNumber", width: 150, responsive: 1 },
				{ title: "Status", field: "status", width: 150, responsive: 1 },
				{ title: "Sub-Status", field: "subStatus", width: 150, responsive: 1 },
				{ title: "Dispatch Type", field: "dispatchType", width: 150, responsive: 1 },
				{ title: "Closed Date", field: "closedOn", width: 150, responsive: 1 },
				{ title: "Closed By : Full Name", field: "closedUser", width: 150, responsive: 1 },
				{ title: "External Ticket Number", field: "externalTktNum", width: 150, responsive: 1 },
				{ title: "Apply Charges to Billing", field: "applyCharges2Billing", width: 150, responsive: 1 },
				{ title: "Charges Applied to Billing", field: "billing", width: 150, responsive: 1 },
				{ title: "Waive Dispatch Fee", field: "waiveDispatchFee", width: 150, responsive: 1 },
				{ title: "Work Order Owner", field: "ownerName", width: 150, responsive: 1 }

			];

			this.taskColumns = [
				{ title: "Task Number", field: "taskNumber", width: 150, responsive: 0 },
				{ title: "Category", field: "category", width: 150, responsive: 0 },
				{ title: "Type", field: "type", width: 150, responsive: 0 },
				{ title: "Queue", field: "queue", width: 150, responsive: 0 },
				{ title: "Owner", field: "owner", width: 150, responsive: 1 },
				{ title: "Status", field: "status", width: 150, responsive: 1 },
				{ title: "Description", field: "description", width: 150, responsive: 1 },
				{ title: "Resolution", field: "resolution", width: 150, responsive: 1 },
				{ title: "Created By", field: "createdBy", width: 150, responsive: 2 },
				{ title: "Created Date", field: "createdDate", width: 150, responsive: 2 },
				{ title: "Closed By", field: "closedBy", width: 150, responsive: 2 },
				{ title: "Closed Date", field: "closedDate", width: 150, responsive: 3 },
				{ title: "Case Number", field: "caseNumber", width: 200, responsive: 3 },
				{ title: "Case Category", field: "caseCategory", width: 150, responsive: 3 },
				{ title: "Case Sub-Type", field: "caseSubType", width: 200, responsive: 3 },
				{ title: "Case Account Name", field: "caseAccountName", width: 150, responsive: 3 },
				{ title: "Case Account ID", field: "accountId", width: 150, responsive: 3 }
			];

			this.detailsColumns = this.caseColumns;

			var type = config.type;

			if (!type) {
				type = "Case";
			}

			if (type == "Case") {
				this.detailsColumns = this.caseColumns;
			}

			if (type == "User Activity") {
				this.detailsColumns = this.userColumns;
			}

			if (type == "Work Order") {
				this.detailsColumns = this.workOrderColumns;
			}

			if (type == "WO Charge Itemization") {

				this.detailsColumns = this.woChargeItemColumns;
			}

			if (type == "Task") {
				this.detailsColumns = this.taskColumns;
			}

			this.viewDetailsTable = new Tabulator("#viewDetailsTable_" + this.reportId, {
				height: "650px",
				data: reportData,
				layout: "fitColumns",
				downloadRowRange: "all",
				groupBy: detailsConfig.groupBy,
				columns: this.detailsColumns
			});
		},
		setFilterStore: function (filterConfig) {
			var values = [];
			for (const key in filterConfig) {
				if (filterConfig[key] != null && filterConfig[key] != 0) {
					values.push({ field: key, value: filterConfig[key] });
				}
			}
			this.filterStore.setData(values);
			this.filterGrid.refresh();
			this.filterGrid.resize();
		},
		convertToCSV: function (jsonData) {
			if (!jsonData.length) return "";

			const keys = Object.keys(jsonData[0]);
			const header = keys.join(",") + "\n";

			const rows = jsonData.map(obj => {
				return keys.map(key => {
					let val = obj[key];
					if (typeof val === "string" && val.includes(",")) {
						val = `"${val}"`;
					}

					if (typeof val === "string" && val.includes("\n")) {
						val = val.replace(/\n/g, '\\n')
					}

					return val;
				}).join(",");
			}).join("\n");

			return header + rows;
		},
		destroy: function () {

			if (this.detailsDlg) {
				this.detailsDlg.destroyRecursive();
			}

			if (this.downloadToster) {
				this.downloadToster.destroyRecursive(false);
			}

			this.inherited(arguments);
			//this.pivotGrid.dispose();
			//this.pivotChart.dispose();
		}
	});

});
