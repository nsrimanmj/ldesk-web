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
    "dojo/text!app/widgets/templates/wo_manual_billing.html",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, Dialog, TitleGroup, TitlePane, template) { // jshint ignore:line

    var widget = null;

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
        templateString: template,
        widgetsInTemplate: true,
        info: null,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;
            widget.ctrl = widget.lingoController;
            widget.woData = widget.info;
            widget.agentName = window.localStorage.getItem("agentName");
        },
        buildRendering: function () {
            this.inherited(arguments);
        },
        resize: function () {
            this.inherited(arguments);
        },
        init: function () {

        },
        submit: function (data) {
            var widget = this;
            var callback = function (obj) {
                if (obj.response.code == 200) {
                    widget.woManualBilling.destroyRecursive();
                    new messageWindow({
                        message: "Manual Billing Completed Successfully",
                        title: "Success"
                    });
                } else {
                    new messageWindow({
                        message: obj.response.message,
                        title: "Error"
                    });
                }
            }
            widget.ctrl.updateWorkOrder(data, callback);
        },
        postCreate: function () {
            var widget = this;

            on(widget.closeBtn, "click", function () {
                widget.woManualBilling.hide();
            });

            widget.submitBtn.on("click", lang.hitch(this, function () {
                if (!widget.billingForm.isValid()) {
                    widget.billingForm.validate();
                    return;
                } else {
                    var billingInfo = dojo.clone(widget.woData);
                    var totalBill = widget.totalBill.get("value");
                    billingInfo.statusId = 0;
                    billingInfo.subStatus = "Billable";
                    billingInfo.totalBill = totalBill;
                    billingInfo.billing = 1;
                    widget.submit(billingInfo);
                }
            }));
            widget.woManualBilling.show();

        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});
