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
	"dojo/text!app/widgets/templates/view_dashboard.html",
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

			this.folderStore = new Memory({
				data: []
			});

			this.folderList = this.ctrl.folderList;
			if (!this.folderList) {
				this.isLoading = true;
				this.ctrl.getFolderList();
			}
			this.folderGroupList = this.ctrl.folderGroupList;
			var widget = this;
			this.handle = topic.subscribe("/lingoController/folderLoaded", function (data) {
				widget.folderGroup.set("value", "Private");
				widget.isLoading = false;
			});
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
		addReport: function () {
			var widget = this;

			var reportType = this.selReportType.get("value");
			if (!this.selectedReportId) {
				new messageWindow({
					message: "Please select a Report!",
					title: "Note"
				});
				return;
			}

			if (!reportType) {
				new messageWindow({
					message: "Please select a Report Type!",
					title: "Note"
				});
				this.selReportType.focus();
				return;
			}

			if (!this.addRptForm.validate()) {
				return;
			}

			var callback = function (obj) {
				widget.addDashboardItem(obj.data);
				widget.data.items.push(obj.data);
				widget.serializedData = widget.gridStack.save(false);
				widget.addRptDlg.hide();
			}

			var config = {};
			config.grid = {
				w: 4,
				h: 4
			}

			if (reportType == "total") {
				config.range = {
					range1Value: 33,
					range2Value: 66,
					range1Color: "#008000",
					range2Color: "#FFA500",
					range3Color: "#ff0000",
				};
				config.grid = {
					w: 2,
					h: 2
				}
			}

			var req = {
				dashboardId: this.dbId,
				reportId: this.selectedReportId,
				reportName: this.selReportName.get("value"),
				reportType: reportType,
				createdBy: this.agentId,
				modifiedBy: this.agentId,
				config: JSON.stringify(config)
			}
			this.ctrl.postAPI("addReport", req, callback);
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

			if (!data.items || data.items.length == 0) {
				this.showAddRptDlg();
			}
			data.items.forEach(item => {
				widget.addDashboardItem(item);
			});
		},
		showAddRptDlg: function () {
			var widget = this;
			widget.addRptForm.reset();
			widget.reportStore.setData([]);
			widget.reportGrid.refresh();
			widget.selectedReportId = null;
			if (!this.isLoading) {
				widget.folderGroup.set("value", "Private");
			}
			widget.addRptDlg.show();
		},
		postCreate: function () {
			var widget = this;
			this.inherited(arguments);

			// create grid and put into border container
			//var grid = new GridContainer({ nbZones: 3 }, "gridDIv");

			on(widget.addRptBtn, "click", function () {
				widget.showAddRptDlg();
			});

			on(widget.closeWindowBtn, "click", function () {
				//registry.byId("appTabContainer").selectChild(registry.byId("controlPanelContentPane"));
				widget.closeWindow();
			})

			on(widget.editBtn, "click", function () {
				widget.edit();
			});

			on(widget.resetBtn, "click", function () {
				widget.reset();
			});


			on(widget.saveBtn, "click", function () {
				widget.showEditDashboard();
			});

			on(widget.cloneBtn, "click", function () {
				widget.showEditDashboard(true);
			});

			on(widget.searchBtn, "click", function () {
				widget.searchReport();
			});

			on(widget.cancelSearchBtn, "click", function () {
				widget.addRptDlg.hide();
			});

			on(widget.addBtn, "click", function () {
				widget.addReport();
			});

			on(widget.createdByBtn, "click", function () {
				var agentId = window.localStorage.getItem("agentId");
				widget.getReportList({ 'createdBy': agentId });
			});
			on(widget.folderName, "change", function () {
				var folderId = widget.folderName.item.id;
				if (folderId) {
					widget.getReportList({ folderId: folderId });
				}
			});

			on(widget.scheduleBtn, "click", function () {
				new Schedule({ info: widget.data, type: "dashboard", ctrl: widget.ctrl });
			})


			on(widget.cancelConfigBtn, "click", function () {
				widget.configureDlg.hide();
			})

			on(widget.updateConfigBtn, "click", function () {
				widget.updateConfig();
			})

			on(widget.deleteBtn, "click", function () {
				var confirmDlg = new ConfirmDialog({
					title: "Delete Dashboard",
					content: "Do you really want to Delete Dashboard:  <i>" + widget.dbId + "</i>?",
					style: "width: 400px",
					onExecute: function () { widget.deleteDashboard() }
				});
				confirmDlg.set("buttonOk", "Delete");
				confirmDlg.set("buttonCancel", "No");
				confirmDlg.show();
			});

			widget.folderGroup.set("store", widget.folderGroupList);
			widget.folderName.set("store", widget.folderStore);

			on(widget.folderGroup, "change", function () {
				var group = widget.folderGroup.get("value");
				widget.folderList = widget.ctrl.folderList;
				if (!widget.folderList) {
					return;
				}
				var folderList = widget.folderList.filter(function (item) {
					if (item.groupName != group) {
						return false;
					}
					if (group == "Private" && item.createdBy != widget.agentId) {
						return false;
					}
					return true;
				})

				widget.folderStore.setData(folderList);
				widget.folderName.set("value", "");
			});

			var height = screen.height - 650;
			if (height < 200) {
				height = 200;
			}
			domStyle.set(widget.reportGridDiv, "height", height + "px");
			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow, Selector]);

			var reportLayout = [
				{ label: "Report Number", field: "id", width: 30, renderCell: lang.hitch(this, this.renderReportId) },
				{ label: "Report Name", field: "name", width: 60 },
				{ label: "Group Name", field: "folderGroup", width: 40 },
				{ label: "Folder Name", field: "folderName", width: 40 },
				{ label: "Create Date", field: "createdDate", width: 60, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Created By", field: "createdUser", width: 60 },
				{ label: "Modified Date", field: "modifiedDate", width: 60, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Modified By", field: "modifiedUser", width: 60 }
			];

			widget.reportGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Report Found!!",
				collection: widget.reportStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: reportLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowSelectAll: true
			}, widget.reportGridDiv);


			widget.reportGrid.on('dgrid-select', function (event) {
				// Get the rows that were just selected
				var row = event.rows[0];
				widget.selectedReportId = row.data.id;
				widget.selReportName.set("value", row.data.name);
				widget.selReportType.focus();
			});

			setTimeout(function () {
				widget.gridStack = GridStack.init({
					cellHeight: '100px',
					float: true,
					staticGrid: true,
					alwaysShowResizeHandle: true,
					minRow: 6
				}, widget.gridStackDiv);
				//widget.gridStack.load(items);

				widget.gridStack.on('change', function (event, items) {
					items.forEach(function (item) { console.log(item) });
				});

			}, 10)


			on(widget.minValue, "change", function () {
				widget.redrawRange();
			})

			on(widget.maxValue, "change", function () {
				widget.redrawRange();
			})


			on(widget.range1Color, "change", function () {
				widget.redrawRange();
			})

			on(widget.range2Color, "change", function () {
				widget.redrawRange();
			})

			on(widget.range3Color, "change", function () {
				widget.redrawRange();
			})

		},
		deleteDashboard: function () {
			var widget = this;
			var callback = function (obj) {
				widget.ctrl.showSuccessMessage(obj);
				widget.closeWindow();
				topic.publish("/lingoController/dashboardUpdated", obj.data);
			}

			this.ctrl.deleteAPI("dashboard", { id: this.dbId }, callback);
		},
		redrawRange: function () {

			var widget = this;
			var config = this.getRangeConfig();
			var value = dojo.byId("preview_total").innerText;
			var color = this.getTotalColor(config, value);
			domStyle.set(dojo.byId("preview_total"), "color", color);

			//range.allProps = rangeOptions;
			//dojo.query(".total-report-slider").forEach(dojo.empty);
			dojo.empty("total-report-slider");
			//values: [config.range1Value, config.range2Value, config.max],

			var range = new RangeSlider(".total-report-slider", {
				values: [config.range1Value, config.range2Value, config.max],
				pointRadius: 10,
				railHeight: 6,
				trackHeight: 6,
				min: config.min,
				max: config.max,
				colors: {
					points: [config.range1Color, config.range2Color, "transparent"], // ['blue', 'red']
					rail: config.range1Color,
					tracks: [config.range2Color, config.range3Color]
				}
			});

			range.onChange(val => {
				widget.range1Value.set("value", val[0]);
				widget.range2Value.set("value", val[1]);
				widget.redrawRange();
			});

		},
		getRangeConfig: function () {
			var widget = this;
			var config = {};
			config.min = parseInt(widget.minValue.get("value"));
			config.max = parseInt(widget.maxValue.get("value"));
			config.range1Value = parseInt(widget.range1Value.get("value"));
			config.range2Value = parseInt(widget.range2Value.get("value"));
			config.range1Color = widget.range1Color.value;
			config.range2Color = widget.range2Color.value;
			config.range3Color = widget.range3Color.value;

			return config;
		},
		edit: function () {
			var widget = this;
			widget.gridStack.setStatic(false);
			domStyle.set(widget.resetBtn.domNode, "display", "inline-block");
			domStyle.set(widget.saveBtn.domNode, "display", "inline-block");
			domStyle.set(widget.editBtn.domNode, "display", "none");
			dojo.query(".delete").style("display", "inline-block");
			dojo.query(".configure-item").style("display", "inline-block");
			widget.serializedData = widget.gridStack.save(false);
			console.log(widget.serializedData);
			//console.log(widget.gridStack.save(true, true));
		},
		reset: function () {
			var widget = this;
			console.log(widget.serializedData);
			widget.gridStack.setStatic(true);
			//widget.gridStack.removeAll();
			widget.gridStack.load(widget.serializedData);
			domStyle.set(widget.resetBtn.domNode, "display", "none");
			domStyle.set(widget.saveBtn.domNode, "display", "none");
			domStyle.set(widget.editBtn.domNode, "display", "inline-block");
			dojo.query(".delete").style("display", "none");
			dojo.query(".configure-item").style("display", "none");
		},
		searchReport: function () {
			var name = this.searchName.get("value");
			this.getReportList({ name: name });
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
		renderReportId: function (data, value, cell) {
			if (!value) {
				return;
			}

			var reportId = this.formatCaseNumber(value);
			var widget = this;
			var div = cell.appendChild(document.createElement("div"));
			var linkNode = dojo.create("a", { href: "javascript:void(null);", title: reportId, innerHTML: reportId }, div);

			on(linkNode, "click", lang.hitch(this, function () {
				widget.viewReportDetails({ id: value }, widget.ctrl);
			}));
			return;
		},
		showEditDashboard: function (isClone) {
			var widget = this;
			isUpdate = true;
			if (isClone) {
				isUpdate = false;
			}

			var config = widget.gridStack.save(false);
			widget.data.items.forEach(element => {
				var gridConfig = config.filter(function (el) { return el.itemId == element.id })[0];
				delete gridConfig.itemId;
				delete gridConfig.id;
				var itemConfig = JSON.parse(element.config);
				itemConfig.grid = gridConfig;
				element.config = JSON.stringify(itemConfig);
			});

			new CreateDashboard({
				data: this.data,
				isUpdate: isUpdate,
				isClone: isClone,
				ctrl: this.ctrl,
				updateCallback: lang.hitch(this, widget.updateCallback)
			})
		},
		updateCallback: function (data) {
			var widget = this;
			this.dbNameSpan.innerHTML = data.name + " (" + data.folderGroup + ")";
			this.data.folderId = data.folderId
			this.data.name = data.name;
			this.data.folderGroup = data.folderGroup;

			widget.gridStack.setStatic(true);
			domStyle.set(widget.resetBtn.domNode, "display", "none");
			domStyle.set(widget.saveBtn.domNode, "display", "none");
			domStyle.set(widget.editBtn.domNode, "display", "inline-block");
			dojo.query(".delete").style("display", "none");
			dojo.query(".configure-item").style("display", "none");
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
			});

			var itemConfig = {};
			if (item.config) {
				itemConfig = JSON.parse(item.config)
			}

			var gridConfig = itemConfig.grid;
			if (!gridConfig) {
				gridConfig = {};
			}
			if (!gridConfig.w) {
				gridConfig.w = 4;
			}

			if (!gridConfig.h) {
				gridConfig.h = 4;
			}

			gridConfig.content = containerDiv.outerHTML;
			gridConfig.id = cellId;
			gridConfig.itemId = itemId;

			this.gridStack.addWidget(gridConfig);
			containerDiv = dojo.byId("container_" + id + "_" + itemId);

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

			var reportId = this.formatId(item.reportId);
			var linkDiv = domConstruct.create("div", { style: "text-align: right;padding-top: 5px;margin-right: 20px;flex: 0 0 20px;" }, containerDiv);

			var linkNode = dojo.create("a", {
				id: "view_link_" + id + "_" + itemId,
				href: "javascript:void(null);",
				title: reportId,
				innerHTML: "View Report (" + reportId + ")",
				style: "margin-right: 10px",
			}, linkDiv);

			on(linkNode, "click", lang.hitch(this, function () {
				widget.viewReportDetails({ id: item.reportId }, widget.ctrl);
			}));

			if (item.reportType == "total") {

				var configureBtn = new Button({
					label: "Edit",
					showLabel: false,
					class: "configure-item",
					iconClass: "dijitIconConfigure",
					id: "edit_btn" + id + "_" + itemId,
					style: "display: none;margin-right: 5px !important",
					onClick: function () {
						widget.showConfigDlg(item);
					}
				});
				configureBtn.startup();
				configureBtn.placeAt(linkDiv);
			}

			var deleteBtn = new Button({
				label: "Delete",
				showLabel: false,
				class: "delete",
				iconClass: "trashIcon",
				id: "delete_btn" + id + "_" + itemId,
				style: "display: none;margin-right: 10px",
				onClick: function () {
					widget.confirmRemove(item);
				}
			});

			deleteBtn.startup();
			deleteBtn.placeAt(linkDiv);



			//this.gridStack.addWidget({ content: containerDiv.outerHTML, w: 4, h: 4 });



			/*
			on(dojo.byId("delete_btn" + id + "_" + itemId), "click", function () {
				widget.confirmRemove(this, item);
			})
			
		
			on(dojo.byId("view_link_" + id + "_" + itemId), "click", lang.hitch(this, function () {
				widget.viewReportDetails({ id: item.reportId }, widget.ctrl);
			}));
			*/
			var callback = function (obj) {
				domStyle.set(dojo.byId(loadingId), "display", "none");
				domStyle.set(dojo.byId(divId), "display", "inline-block");
				widget.showDashboardItem(obj.data, divId, item)
			}

			this.ctrl.getAPI("report", { id: item.reportId }, callback);

		},
		showConfigDlg: function (item) {

			var widget = this;
			widget.updateItem = item;


			if (item.config) {
				var itemConfig = JSON.parse(item.config);
				var config = itemConfig.range;

				widget.minValue.set("value", config.min);
				widget.maxValue.set("value", config.max);
				widget.range1Value.set("value", config.range1Value);
				widget.range2Value.set("value", config.range2Value);
				widget.range1Color.value = config.range1Color;
				widget.range2Color.value = config.range2Color;
				widget.range3Color.value = config.range3Color;
				var divId = "total_" + item.dashboardId + "_" + item.id;
				var value = dojo.byId(divId).innerText;
				this.previewTotal.innerText = value;

				var color = this.getTotalColor(config, value);
				domStyle.set(dojo.byId("preview_total"), "color", color);
			}

			this.configureDlg.show();
			widget.redrawRange();

		},
		updateConfig: function () {
			var item = this.updateItem;

			var currentConfig = JSON.parse(item.config);
			var config = this.getRangeConfig();

			lang.mixin(currentConfig.range, config);


			var divId = "total_" + item.dashboardId + "_" + item.id;
			var value = dojo.byId(divId).innerText;

			var color = this.getTotalColor(config, value);
			domStyle.set(dojo.byId(divId), "color", color);

			this.data.items.forEach(function (el) {
				if (el.id == item.id) {
					el.config = JSON.stringify(currentConfig);
				}
			});
			this.configureDlg.hide();
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
		confirmRemove: function (item) {
			var confirmDlg = new ConfirmDialog({
				title: "Remove Report",
				content: "Do you really want to remove <i>" + item.reportName + "</i>?",
				style: "width: 300px",
				buttonOk: "Remove",
				buttonCancel: "No",
				onExecute: lang.hitch(this, this.removeReport, item)
			});
			confirmDlg.set("buttonOk", "Yes");
			confirmDlg.set("buttonCancel", "No");
			confirmDlg.show();
		},
		removeReport: function (item) {
			var widget = this;
			var gridItems = widget.gridStack.getGridItems();
			var id = "cell_" + widget.dbId + "_" + item.id;

			var el = gridItems.filter(function (elm) {
				return elm.gridstackNode.id == id;
			})[0]

			var callback = function (obj) {
				widget.gridStack.removeWidget(el);
				widget.data.items = widget.data.items.filter(function (el) { return el.id != item.id; });
			}
			this.ctrl.callAPI("removeReport", { id: item.id }, callback, true, true, "delete");
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
				dojo.byId(divId).innerHTML = "<div class='report-total' style=\"color:" + color + "\" id = " + id + ">" + reportData.length + "</div";
			}

			if (type == "summary") {
				fmConfig.options.viewType = "grid";
				var height = screen.height - 350;
				widget.pivotGrid = new Flexmonster({
					container: "#" + divId,
					componentFolder: "external/flexmonster/",
					toolbar: false,
					height: '100%',
					report: fmConfig,
					licenseKey: environment.fmKey
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

				widget.pivotChart = new Flexmonster({
					container: "#" + divId,
					componentFolder: "external/flexmonster/",
					toolbar: false,
					report: chartSettings,
					height: '100%',
					licenseKey: environment.fmKey
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
		closeWindow: function () {
			var widget = this;
			registry.byId("appTabContainer").selectChild(registry.byId("dashboardTab"));

			var contentPane = registry.byId("dashboard_contentPane_" + widget.dbId);
			registry.byId("appTabContainer").removeChild(contentPane);
			contentPane.destroyRecursive();
		},
		handleOnClose: function () {
			var widget = this;
			if (widget.saveBtn.domNode.style.getPropertyValue("display") == "inline-block") {
				if (registry.byId("dashboard_contentPane_" + widget.dbId)) {
					registry.byId("appTabContainer").selectChild("dashboard_contentPane_" + widget.dbId);
				}
				var myDialog = new ConfirmDialog({
					title: "Closing DashBoard Tab - " + widget.dbId,
					content: "You cannot close this tab due to unsaved changes. Do You really want to close?",
					style: "width: 500px",
					onExecute: function () {
						widget.closeWindow();
					}
				});
				myDialog.show();
				return false;
			}
			widget.closeWindow();
		},
		destroy: function () {
			this.inherited(arguments);

			if (this.handle) {
				this.handle.remove();
			}
		}
	});

});
