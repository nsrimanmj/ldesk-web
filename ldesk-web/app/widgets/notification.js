define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/registry",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/on",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/dom-class",
	"dojo/dom",
	"dojo/text!app/widgets/templates/notification.html",
	"dojo/domReady!"
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, lang, arrayUtil, on, domConstruct, domStyle, domClass, dom, template) { // jshint ignore:line

	return declare("notification", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
		},
		buildRendering: function () {
			this.inherited(arguments);
			this.hideAll();
			this.msg = "";
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {

		},
		setMessage: function (msg) {

			this.msgDiv.innerHTML = msg;
			this.msg = msg;

			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
			}

			if (msg == "") {
				domStyle.set(this.notificationDiv, "display", "none");
				registry.byId("mainContainer").resize();
				return;
			}
			//this.msgDiv.start();

			//domClass.remove(this.msgDiv, "blink");
			//domClass.add(this.msgDiv, "blink");
			domStyle.set(this.notificationDiv, "display", "block");
			registry.byId("mainContainer").resize();
			/*
			this.timeoutId = setTimeout(lang.hitch(this, function () {
				domStyle.set(this.notificationDiv, "display", "none");
				registry.byId("mainContainer").resize();
			}), 120000) */

		},
		postCreate: function () {
			var widget = this;
			this.inherited(arguments);
		},
		hideAll: function () {
			var widget = this;
			domStyle.set(widget.notificationDiv, "display", "none");
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
