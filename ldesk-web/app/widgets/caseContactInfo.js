define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/registry",
	"dstore/Memory",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dijit/form/Form",
	"dojox/layout/TableContainer",
	"dijit/form/TextBox",
	"dijit/form/Textarea",
	"dijit/form/Select",
	"dojo/data/ObjectStore",
	"dstore/legacy/DstoreAdapter",
	"app/model/miniStores",
	"dojo/text!app/widgets/templates/case_contact_info.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, Memory, lang, domStyle, on, Form, TableContainer, TextBox, Textarea, Select, ObjectStore, DstoreAdapter, MiniStores, template) { // jshint ignore:line

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
			widget.miniStores = new MiniStores();
			this.reqLabel = "<req>";
			this.reqLabel2 = "<req>";
			if (widget.data.groupName == "Inquiry" || widget.data.groupName == "Equipment") {
				this.reqLabel2 = "";
			}
			if (widget.data.groupName != "Incident" && widget.data.groupName != "Inquiry")
				this.reqLabel = "";
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {

		},
		getInfo: function (info) {
			var widget = this;
			widget.getWidgetvalues(info, widget.caseContactInfoTable.domNode);
			// widget.getWidgetvalues(info, widget.eqContactTable.domNode);
			if (widget.data.groupName == "Equipment") {
				if (widget.followUpDate1.get("displayedValue") && widget.followUpDate1.get("displayedValue") != "") {
					var date1 = widget.followUpDate1.get("displayedValue") + " " + widget.followUpTime1.get("displayedValue");
					var dt = new Date(date1);
					info.followUpDate = widget.formatDate(dt, "YYYY-MM-DD H24:MI:SS");
					console.log(info.followUpDate);
				}
			}

		},
		populateData: function (data) {
			var widget = this;
			widget.data = data;
			this.setWidgetValues(data, widget.caseContactInfoTable.domNode);
			if (widget.data.groupName == "Collections") {
				widget.collectionData = widget.data.collectionInfo;
				this.setWidgetValues(widget.collectionData, widget.caseContactInfoTable.domNode);
			}
			//this.setWidgetValues(data, widget.eqContactTable.domNode);
			if (data.followUpDate) {
				var date = new Date(data.followUpDate);
				widget.followUpDate1.set("value", date);
				// Set the time value
				var followUpTime = data.followUpDate.split(' ')[1];
				var timeParts = followUpTime.split(':');
				var time = new Date();
				time.setHours(timeParts[0], timeParts[1], timeParts[2]);
				widget.followUpTime1.set("value", time);
			}

		},
		disableFields: function () {
			var widget = this;
			this.disableWidgets(widget.caseContactInfoTable.domNode);
			if (widget.data.groupName == "Equipment") {
				widget.followUpDate1.set("disabled", true);
				widget.followUpTime1.set("disabled", true);
			}
		},
		resetFields: function () {
			var widget = this;
			if (widget.data.groupName == "Equipment") {
				widget.followUpDate1.reset();
				widget.followUpTime1.reset();
			}

		},
		postCreate: function () {
			var widget = this;

			// this.disableWidgets(widget.caseContactInfoTable.domNode);
			// this.disableWidgets(widget.eqContactTable.domNode);
			widget.disableFields();

			widget.updateFieldVisibility(widget.data.groupName, widget.caseContactInfoTable);

			widget.contactMethod.set('store', widget.miniStores.getContactMethodStore());
			if (widget.data)
				widget.populateData(widget.data);

		},
		activateFields: function () {
			var widget = this;
			if (widget.data.groupName == "Incident") {
				widget.localContactName.set("required", true);
				widget.localContactNum.set("required", true);

			} else {
				widget.localContactName.set("required", false);
				widget.localContactNum.set("required", false);
			}
			if (widget.data.groupName == "Equipment") {
				//widget.clientContactEmail.set("required", true);
				widget.contactPhone.set("required", false);
				widget.contactName.set("required", false);
				widget.followUpDate1.set("disabled", false);
				widget.followUpTime1.set("disabled", false);

				// widget.localContactName.set("disabled", true);
				// widget.localContactNum.set("disabled", true);
				// widget.contactMethod.set("disabled", true);
				// widget.intTicketNum.set("disabled", true);
			}

			if (widget.data.groupName == "Collections") {
				widget.contactPhone.set("required", false);
				widget.contactName.set("required", false);
			}

		},

		destroy: function () {
			this.inherited(arguments);
		}
	});

});