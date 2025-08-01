define([
	"dojo/_base/declare",
	"dojo/parser",
	"dojo/topic",
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
	"dijit/registry",
	"dojo/text!app/widgets/templates/view_service_info.html",
	"dojo/domReady!"
], function (declare, parser, topic, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, Dialog, TitleGroup, TitlePane, registry, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			widget.serviceData = widget.serviceInfo;
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

			widget.ServiceDetails.show();
			widget.populateServiceDetails(widget.serviceData);

			this.disableWidgets(widget.serviceInfoDiv.domNode);

			on(widget.closeBtn, "click", function () {
				widget.ServiceDetails.hide();
			});

		},
		populateServiceDetails: function (data) {
			this.setWidgetValues(data, this.serviceInfoDiv.domNode);
		},

		destroy: function () {
			this.inherited(arguments);
		}
	});

});
