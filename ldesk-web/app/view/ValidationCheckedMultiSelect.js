define([
    "dojo/_base/declare",
    "dijit/form/Form",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojox/form/CheckedMultiSelect",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/domReady!"
], function (declare, Form, _WidgetBase, _TemplatedMixin, CheckedMultiSelect, domConstruct, on) {

    return declare("ValidationCheckedMultiSelect", [CheckedMultiSelect], {
        // Custom error message node
        errorMessageNode: null,

        postCreate: function () {
            this.inherited(arguments);

            // Create and hide the error message initially
            this.errorMessageNode = domConstruct.create("div", {
                innerHTML: "Please select at least one option.",
                style: "color: red; font-size: 12px; margin-bottom: 10px",
                className: "error-message",
                "aria-live": "polite"
            }, this.domNode, "last");

            // Set up validation hook
            this._attachValidation();
        },

        _attachValidation: function () {
            this.on("change", () => {
                this._hasBeenBlurred = true; // mark field as interacted with
                this.validate();
            });
        },

        // Called by Dojo form on submit
        validate: function () {
            const valid = this.isValid();
            this.errorMessageNode.style.display = valid ? "none" : "block";
            return valid;
        },

        // Custom validation logic
        isValid: function () {
            const value = this.getValue();
            return value && value.length > 0;
        },

        // Optional: Provide focus behavior
        focus: function () {
            if (this.containerNode && this.containerNode.firstChild) {
                this.containerNode.firstChild.focus();
            }
        },

        // Called on blur to trigger validation
        _onBlur: function () {
            this._hasBeenBlurred = true;
            this.validate();
        }
    });
});
