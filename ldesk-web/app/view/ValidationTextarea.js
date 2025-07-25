
define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/dom-construct",
	"dojo/on",
	"dijit/form/ValidationTextBox",
	"dijit/form/SimpleTextarea",
	"dojo/domReady!"
], function (declare, _parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, domConstruct, on, ValidationTextBox, SimpleTextarea) { // jshint ignore:line

	return declare(
		"ValidationTextarea",
		[ValidationTextBox, SimpleTextarea],
		{
			postCreate: function () {
				this.set("value", "");
				this.inherited(arguments);

				var value = this.get("value");
				// Create a character counter element
				if (this.maxLength) {
					this.maxLength = parseInt(this.maxLength);
					this.counterNode = domConstruct.create("div", {
						innerHTML: "(Max of" + " " + this.maxLength + " " + "characters allowed)",
						style: "color: gray; font-size: 12px; margin-top: 5px;"
					}, this.domNode, "after");
				}
			},
			validate: function () {
				if (arguments.length == 0) {
					return this.validate(false);
				}
				return this.inherited(arguments);
			},
			onFocus: function () {
				if (!this.isValid()) {
					this.displayMessage(this.getErrorMessage());
				}
			},
			onBlur: function () {
				this.validate(false);
			},
			regExp: "(.|[\r\n])+",
			isValid: function () {
				var value = this.get("value");
				if (this.required == false) {
					return true;
				} else {
					var regex = new RegExp(this.regExp);
					return regex.test(value);
				}
			}

		}
	);
});