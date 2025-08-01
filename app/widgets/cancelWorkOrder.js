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
    "dojo/text!app/widgets/templates/cancel_work_order.html",
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
            widget.data = widget.info;
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
                    widget.addWoNotes(data);
                    widget.cancelWorkOrderDlg.destroyRecursive();
                    new messageWindow({
                        message: "Cancelled work order Successfully",
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
            widget.cancelLabel.innerHTML = "Only take this action if the corresponding FN Work Order #"
                + " " + widget.data.externalTktNum
                + " " + "has been deleted in Field Nation.<br><br>The LDesk work order will be updated to 'Cancelled - Not Billable and cannot be reopened.";

            on(widget.closeBtn, "click", function () {
                widget.cancelWorkOrderDlg.hide();
            });

            widget.submitBtn.on("click", lang.hitch(this, function () {
                var cancelInfo = dojo.clone(widget.data);
                cancelInfo.statusId = 0;
                cancelInfo.status = "Canceled";
                cancelInfo.subStatusId = 0;
                cancelInfo.subStatus = "Not Billable";
                widget.submit(cancelInfo);
            }));
            widget.cancelWorkOrderDlg.show();

        },
        addWoNotes: function (req) {
            var info = {};
            var widget = this;
            info.woId = req.id;
            info.woNumber = req.workOrderNo;
            info.createdByTeam = "Field Ops";
            info.createdBy = widget.agentName;
            info.modifiedBy = widget.agentName;
            info.noteText = "Field Nation Work Order " + widget.data.externalTktNum + " has been deleted and no longer exists.";
            info.subject = req.status + "-" + req.subStatus;

            widget.ctrl.postAPI("woNotes", info);
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});
