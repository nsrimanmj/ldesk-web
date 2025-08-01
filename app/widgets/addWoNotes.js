define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/on",
	"dojo/topic",
	"dojo/text!app/widgets/templates/add_wo_notes.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, on, topic,
	template) { // jshint ignore:line

	var widget = null;
	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			widget.data = widget.info;
			widget.agentName = window.localStorage.getItem("agentName");
			widget.agentGroups = JSON.parse(window.localStorage.getItem("groups"));
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
			widget.woNotesDlg.show();

			on(widget.closeBtn, "click", function () {
				widget.woNotesDlg.destroyRecursive();
			});

			on(widget.submitBtn, "click", function () {
				if (!widget.notesComments.isValid()) {
					widget.notesComments.validate();
					return;
				}
				var info = widget.getInfo();
				var callback = function (obj) {
					if (obj.response.code == 200) {
						widget.ctrl.showSuccessMessage(obj);
						topic.publish("workorder/notes_added/" + info.woId)
						widget.woNotesDlg.destroyRecursive();
					}
				}
				widget.ctrl.postAPI("woNotes", info, callback);

			});
		},
		getInfo: function () {
			var widget = this;
			var info = {};
			info.woId = widget.data.id;
			info.woNumber = widget.data.workOrderNo;
			info.createdByTeam = widget.getAgentGroup();
			info.createdBy = widget.agentName;
			info.modifiedBy = widget.agentName;
			info.noteText = widget.notesComments.get("value");
			info.subject = "Note from " + info.createdByTeam;

			return info;
		},
		getAgentGroup: function () {
			var widget = this;
			//console.log(widget.agentGroups);
			if (widget.agentGroups.hasOwnProperty('Incident'))
				return "Incident";
			if (widget.agentGroups.hasOwnProperty('Field Ops'))
				return "Field Ops";

			var groups = Object.keys(widget.agentGroups);
			if (groups.length > 0)
				return groups[0];
			return "";
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
