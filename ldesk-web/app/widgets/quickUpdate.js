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
	"dijit/Dialog",
	"dojox/widget/TitleGroup",
	"dijit/TitlePane",
	"app/model/Status",
	"dojo/text!app/widgets/templates/quick_update.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, Dialog, TitleGroup, TitlePane, StatusStore, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			this.ctrl = this.lingoController;
			var widget = this;
			widget.statusStore = new StatusStore();
			this.agentStore = this.ctrl.getAgentStore();
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {

		},
		postCreate: function () {
			var widget = this;
			this.inherited(arguments);
			widget.caseStatus.set("store", this.statusStore.getStatusStore());


			on(widget.caseStatus, "change", function () {
				var statusId = widget.caseStatus.item.id;
				var store = widget.statusStore.getSubStatusStore(statusId);
				if (store.data.length == 0) {
					widget.caseSubStatus.set("value", "");
					widget.caseSubStatus.set("disabled", true);
				} else {
					widget.caseSubStatus.set("disabled", false);
				}
				widget.caseSubStatus.set("store", store);
			});

			on(widget.updateBtn, "click", function () {
				widget.update();
			})

		},
		setCaseData: function (data, callback) {
			var widget = this;

			this.data = data;
			this.reset();
			this.updateFS.set("title", "<b>Updating case: " + this.formatCaseNumber(data.caseId) + "</b>");

			this.caseStatus.set("value", data.status);
			setTimeout(function () {
				widget.caseSubStatus.set("value", data.subStatusId);
			}, 10)

			var store = this.agentStore.getAgentsByGroup(data.groupName);
			widget.caseAssignee.set("store", store);
			this.caseAssignee.set("value", data.ownerId);

			if (callback) {
				this.callback = callback;
			}
		},
		update: function () {
			var widget = this;
			var statusId = this.caseStatus.item.id;
			var subStatusId = this.caseSubStatus.item.id;
			var ownerId = this.caseAssignee.get("value");

			this.data.statusId = statusId;
			this.data.status = this.caseStatus.get("value");
			this.data.subStatusId = subStatusId;
			this.data.subStatus = this.caseSubStatus.get("value");

			var callback = function (response) {
				if (widget.callback) {
					widget.callback();
				}
			}

			this.ctrl.updateCase(this.data, callback);
		},
		reset: function () {
			this.caseStatus.set("value", "");
			this.caseSubStatus.set("value", "");
			this.caseAssignee.set("value", "");
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
