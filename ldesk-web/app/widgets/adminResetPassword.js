define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dojox/layout/TableContainer",
	"dojo/text!app/widgets/templates/admin_reset_password.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, domStyle, on, TableContainer, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {

		},
		submit: function () {
			var widget = this;
			if (widget.password.get('value') == null || widget.password.get('value').trim() == "") {
				new messageWindow({
					title: "Error",
					message: "Password can't be empty."
				});

				return;
			}
			var callback = function () {
				widget.resetPassword.hide();
			};
			var info = {
				"userName": widget.userInfo.loginName,
				"password": widget.password.get('value')
			}
			widget.ctrl.resetPassword(info, lang.hitch(this, callback));
		},
		postCreate: function () {
			var widget = this;
			this.inherited(arguments);
			widget.resetPassword.show();

			widget.submitBtn.on("click", lang.hitch(this, function () {
				if (!widget.validate()) {
					return;
				} else {
					widget.submit();
				}
			}));



			on(widget.resetPassword, "hide", lang.hitch(this, function () {
				widget.resetPassword.destroyRecursive();
				this.destroy();
			}));


			widget.cancelButton.on("click", lang.hitch(this, function () {
				widget.resetPassword.hide();
			}));

		},

		validate: function () {
			var widget = this;

			if (!widget.passform.isValid()) {
				widget.passform.validate();
				return false;
			}

			return true;

		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});

