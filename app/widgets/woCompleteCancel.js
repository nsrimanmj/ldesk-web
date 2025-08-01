define([
    "dojo/_base/declare",
    "dojo/parser",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom-style",
    "dojo/dom",
    "dojo/text!app/widgets/templates/wo_complete_cancel.html",
    'dojo/dom-construct',
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, on, domStyle, dom, template, domConstruct) { // jshint ignore:line

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
            widget.caseData = widget.data.caseDetails;
            widget.woAction = widget.actionName;
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
            widget.woCompCancelDlg.show();
            widget.woCompCancelDlg.set("title", widget.woAction + " Work Order");

            on(widget.closeBtn, "click", function () {
                widget.woCompCancelDlg.destroyRecursive();
            });
            if (widget.woAction == "Complete") {
                widget.form1.reset();
                domStyle.set(dom.byId(widget.optionDiv), "display", "none");
                domStyle.set(dom.byId(widget.dialogActionbar), "display", "block");
                domStyle.set(dom.byId(widget.completeDiv), "display", "block");
                domStyle.set(dom.byId(widget.cancelDiv), "display", "none");
            } else if (widget.woAction == "Cancel") {
                widget.form2.reset();
                domStyle.set(dom.byId(widget.optionDiv), "display", "none");
                domStyle.set(dom.byId(widget.dialogActionbar), "display", "block");
                domStyle.set(dom.byId(widget.completeDiv), "display", "none");
                domStyle.set(dom.byId(widget.cancelDiv), "display", "block");
            }

            on(widget.submitBtn, "click", function () {
                var info = dojo.clone(widget.data);
                info.statusId = 0;
                info.subStatusId = 0;
                if (widget.woAction == "Complete") {
                    if (!widget.form1.isValid()) {
                        widget.form1.validate();
                        return;
                    }
                    info.openCode = widget.openCode.get("value");
                    info.closeCode = widget.closeCode.get("value");
                    info.resDescr = widget.resDescription1.get("value");
                } else if (widget.woAction == "Cancel") {
                    if (!widget.form2.isValid()) {
                        widget.form2.validate();
                        return;
                    }
                    info.resDescr = widget.resDescription2.get("value");
                }

                info.status = "Awaiting Field Coordinator";
                if (widget.woAction == "Complete")
                    info.subStatus = "Completed - Pending Billing Review";
                else if (widget.woAction == "Cancel")
                    info.subStatus = "Cancelled - Pending Billing Review";
                info.queueName = "Field Ops";
                info.ownerId = widget.data.ownerId;

                var callback = function (obj) {
                    if (obj.response.code == 200) {
                        widget.woCompCancelDlg.destroyRecursive();
                        widget.ctrl.showSuccessMessage(obj);
                    }
                };
                widget.ctrl.updateWorkOrder(info, callback);
            });
        },

        destroy: function () {
            this.inherited(arguments);
        }
    });

});
