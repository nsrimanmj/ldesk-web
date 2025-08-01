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
	"dgrid/OnDemandGrid",
	"dojox/grid/EnhancedGrid",
	"dstore/Memory",
	"dojo/store/Observable",
	"app/widgets/schedule",
	"dojo/text!app/widgets/templates/report_email.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, domStyle, on, registry, ContentPane,
	OnDemandGrid, EnhancedGrid, StoreMemory, Observable, Schedule, template) { // jshint ignore:line

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


		},
		closeWindow: function () {
			var widget = this;
			registry.byId("appTabContainer").selectChild(registry.byId("reportsTab"));

			var contentPane = registry.byId("report_email_" + widget.reportId);
			registry.byId("appTabContainer").removeChild(contentPane);
			contentPane.destroyRecursive();
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

			//var height = screen.height - 390;
			var height = 600;
			const params = {
				filename: 'report-' + this.reportId,
				header: config.name,
				footer: "<div style='color:#df3800'>Generated at: ##CURRENT-DATE## </div>",
				destinationType: "plain"
			};

			widget.pivotGrid = new Flexmonster({
				container: "#viewPivotReport_" + this.reportId,
				componentFolder: "external/flexmonster/",
				toolbar: false,
				height: height,
				report: gridConfig,
				licenseKey: environment.fmKey,
				reportcomplete: function () {
					widget.pivotGrid.off("reportcomplete");
					widget.pivotGrid.exportTo('html', params, html => {
						widget.pivotGridPlain.innerHTML = html.data;
						domStyle.set(widget.pivotGridPlain, "display", "block");
					});
				}
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
				width: "99%",
				report: chartSettings,
				licenseKey: environment.fmKey,
				reportcomplete: function () {
					widget.pivotChart.off("reportcomplete");
					widget.pivotChart.exportTo('image', params, img1 => {
						// Create a new canvas element
						const canvas = img1.data;
						var base64 = canvas.toDataURL("image/png");
						widget.pivotChartPlain.src = base64;
						domStyle.set(widget.pivotChartPlain, "display", "block");
					});
				}
			});
			//this.replaceClass();
		},
		replaceClass: function () {
			const element = this.pivotGridPlain;
			const styles = getComputedStyle(element);

			for (const property in styles) {
				if (styles.hasOwnProperty(property)) {
					element.style[property] = styles[property];
				}
			}
			//element.classList.remove("myClass");
		},
		destroy: function () {
			this.inherited(arguments);

			//this.pivotGrid.dispose();
			//this.pivotChart.dispose();
		}
	});

});
