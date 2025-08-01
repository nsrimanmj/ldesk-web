const { callback } = require("dojo/_base/Deferred");

define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dijit/Dialog",
	"dojox/form/CheckedMultiSelect",
	"dojox/form/ListInput",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/Selector",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	"app/view/summaryRow",
	"dstore/Memory",
	"dojo/store/Observable",
	"dijit/form/Button",
	"dojox/validate/web",
	"app/view/messageWindow",
	"dojo/text!app/widgets/templates/schedule.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, domStyle, on, Dialog, _CheckedMultiSelect, _ListInput,
	OnDemandGrid, Selection, Selector, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, StoreMemory, Observable, Button, validate, messageWindow, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;

			this.statusStore = new StoreMemory({
				data: []
			});

			this.agentStore = this.ctrl.getAgentStore().getStore();
			this.getSchedule();
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.statusGrid.resize();
		},
		init: function () {

		},
		getSchedule: function () {
			var req = {
				id: this.info.id,
				type: this.type
			}

			this.ctrl.getAPI("schedule", req, lang.hitch(this, this.setValues), true, false);
		},
		setValues: function (obj) {
			var widget = this;

			var cronExp = "0 * * * ?";
			if (obj.data) {
				this.isUpdate = true;
				var schConfig = obj.data.config;
				widget.subject.set("value", schConfig.subject);
				widget.description.set("value", schConfig.description);
				if (schConfig.toList) {
					widget.toList.set("value", schConfig.toList.split(','));
				}

				if (!schConfig.includeSummary) {
					widget.includeSummary.set("value", false);
				}

				if (!schConfig.includeChart) {
					widget.includeChart.set("value", false);
				}

				if (!schConfig.attachDetails) {
					widget.attachDetails.set("value", false);
				}

				this.currentData = [];
				this.currentData.push({
					nextRunTime: obj.data.nextRunTime,
					prevRunTime: obj.data.prevRunTime,
					startTime: obj.data.startTime,
					status: obj.data.status
				});

				widget.statusStore.setData(this.currentData);
				widget.statusGrid.refresh();
				cronExp = schConfig.cronExp;
			}

			$('#schedule_div').cron("value", cronExp);


		},
		renderPauseResume: function (data, value, cell) {
			var widget = this;

			var label = "Pause";
			var iconClass = 'pauseIcon';
			if (value == "PAUSED") {
				label = "Resume";
				iconClass = 'playIcon';
			}

			var div = cell.appendChild(document.createElement("div"));

			var w = new Button({
				label: label,
				iconClass: iconClass,
				showLabel: false,
				onClick: function () {
					widget.pauseResume(data);
				}
			}).placeAt(div);

			w._destroyOnRemove = true;
			return
		},
		renderDelete: function (data, value, cell) {
			var widget = this;

			var div = cell.appendChild(document.createElement("div"));

			var w = new Button({
				label: "Delete",
				showLabel: false,
				iconClass: 'trashIcon',
				onClick: function () {
					widget.deleteSchedule(data);
				}
			}).placeAt(div);

			w._destroyOnRemove = true;
			return
		},
		formatStatus: function (value, data) {

			if (value != "PAUSED") {
				return { html: "<label style=\"color: green\">ACTIVE</label>" };
			}

			return { html: "<label style =\"color:orange\">" + value + "</label>" };
		},
		renderStatusHeader: function (cell, value, data) {
			var label = "Pause";
			if (value == "PAUSED") {
				label = "Resume"
			}
			var div = cell.appendChild(document.createElement("div"));
			dojo.create("label", { innerHTML: label }, div)
		},
		postCreate: function () {
			var widget = this;
			this.inherited(arguments);
			widget.scheduleDlg.show();
			on(widget.cancelBtn, "click", function () {
				widget.scheduleDlg.destroyRecursive();
				this.destroy();
			});

			on(widget.scheduleDlg, "hide", function () {
				this.destroyRecursive();
			});

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow, Selector]);
			var statusLayout = [
				{ label: "Start Time", field: "startTime", width: 80 },
				{ label: "Previous Run Time", field: "prevRunTime", width: 80 },
				{ label: "Next Run Time", field: "nextRunTime", width: 80 },
				{ label: "Status", field: "status", width: 40, formatter: lang.hitch(this, this.formatStatus) },
				{ label: "Action", field: "status", width: 50, renderCell: lang.hitch(this, this.renderPauseResume) },
				{ label: "Delete", field: "", width: 50, renderCell: lang.hitch(this, this.renderDelete) },
			];

			widget.statusGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Schedule for this Report",
				collection: widget.statusStore,
				className: 'lingogrid ldesk-auto-grid',
				keepScrollPosition: false,
				columns: statusLayout,
				selectionMode: "none",
				rowSelector: '20px'
			}, widget.currentStatusDiv);

			widget.agentList.set("store", this.agentStore);

			on(widget.agentList, "change", function (event) {
				var selectedValue = widget.agentList.get("value");
				var toList = widget.toList.get("value") + "," + widget.agentStore.get(selectedValue).emailAddress;
				widget.toList.set("value", toList);
			});

			on(widget.addBtn, "click", function () {
				if (!widget.mailingList.validate()) {
					widget.mailingList.focus();
					return;
				}
				var value = widget.mailingList.get("value");
				var toList = widget.toList.get("value") + "," + value;
				widget.toList.set("value", toList);
			});

			on(widget.saveBtn, "click", function () {
				widget.saveSchedule();
			})

			if (this.type == "report") {
				widget.subject.set("value", widget.info.config.name);
			} else {
				widget.subject.set("value", widget.info.name);
			}

			var userInfo = JSON.parse(window.localStorage.getItem("userInfo"));
			widget.toList.set("value", userInfo.emailAddress);

			var cronExp = "0 0 0 * * ?";
			setTimeout(() => {
				$('#schedule_div').cron({
					initial: cronExp,
				});
			}, 10);

			if (this.type == "dashboard") {
				domStyle.set(this.includeDiv, "display", "none");
				domStyle.set(this.attachDiv, "display", "none");
			}

		},
		saveSchedule: function () {
			var widget = this;

			if (!this.subject.validate()) {
				this.subject.focus();
				return;
			}

			if (!this.description.isValid()) {
				this.description.focus();
				return;
			}

			if (!this.toList.validate(this.toList.get("value").join(','))) {
				new messageWindow({
					message: "Invalid Email Address in the list!",
					title: "ERROR"
				});
				return;
			}
			var cronExp = $('#schedule_div').cron("value");
			var req = {
				subject: this.subject.get("value"),
				description: this.description.get("value"),
				cronExp: cronExp,
				itemId: this.info.id,
				itemType: this.type,
				includeSummary: this.includeSummary.get("value"),
				includeChart: this.includeChart.get("value"),
				attachDetails: this.attachDetails.get("value"),
				toList: this.toList.get("value").join(',')
			}

			var callback = function (obj) {
				widget.ctrl.showSuccessMessage(obj);
				widget.scheduleDlg.hide();
				widget.scheduleDlg.destroyRecursive();
			}

			if (this.isUpdate) {
				this.ctrl.putAPI("schedule", req, callback);
			} else {
				this.ctrl.postAPI("schedule", req, callback);
			}
		},
		pauseResume: function (data) {
			var widget = this;
			var req = {
				"itemId": this.info.id,
				"itemType": this.type
			}

			var api = "pauseSchedule";
			var newStatus = "PAUSED";
			if (data.status == "PAUSED") {
				newStatus = "NORMAL";
				api = "resumeSchedule";
			}

			var callback = function (obj) {
				widget.ctrl.showSuccessMessage(obj);
				widget.currentData[0].status = newStatus;
				widget.statusStore.setData(widget.currentData);
				widget.statusGrid.refresh();
			}

			this.ctrl.postAPI(api, req, callback);

		},
		deleteSchedule: function () {
			var widget = this;
			var req = {
				"id": this.info.id,
				"type": this.type
			}

			var callback = function (obj) {
				widget.ctrl.showSuccessMessage(obj);
				widget.scheduleDlg.hide();
				widget.scheduleDlg.destroyRecursive();
			}
			this.ctrl.callAPI("schedule", req, callback, true, true, "delete");
		},
		destroy: function () {
			this.scheduleDlg.destroyRecursive();
			this.inherited(arguments);
		}
	});

});
