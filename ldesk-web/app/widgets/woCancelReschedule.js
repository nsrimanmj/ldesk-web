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
    "dojo/text!app/widgets/templates/wo_cancel_reschedule.html",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, on, domStyle, dom, template) { // jshint ignore:line

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
            widget.wocancelRescheduleDlg.show();
            widget.wocancelRescheduleDlg.set("title", widget.woAction + " Work Order");
            widget.timeZone.set("value", widget.data.caseDetails.timeZone)

            on(widget.closeBtn, "click", function () {
                widget.wocancelRescheduleDlg.destroyRecursive();
            });

            if (widget.woAction == "Reschedule") {
                domStyle.set(dom.byId(widget.optionDiv), "display", "none");
                domStyle.set(dom.byId(widget.dialogActionbar), "display", "block");
                domStyle.set(dom.byId(widget.rescheduleDiv), "display", "block");
                domStyle.set(dom.byId(widget.cancelDiv), "display", "block");
            } else if (widget.woAction = "Cancel") {
                widget.wocancelRescheduleDlg.set("title", widget.woAction + " Work Order(Request for Cancellation)");
                domStyle.set(dom.byId(widget.optionDiv), "display", "none");
                domStyle.set(dom.byId(widget.dialogActionbar), "display", "block");
                domStyle.set(dom.byId(widget.rescheduleDiv), "display", "none");
                domStyle.set(dom.byId(widget.cancelDiv), "display", "block");
            }

            on(widget.submitBtn, "click", function () {
                var info = dojo.clone(widget.data);
                info.statusId = 0;
                info.subStatusId = 0;
                if (widget.woAction == "Reschedule") {
                    if (!widget.form1.isValid() || !widget.form2.isValid()) {
                        widget.form1.validate();
                        widget.form2.validate();
                        return;
                    }
                    info.subStatus = "Reschedule Request";
                    var date1 = widget.dispatchDate.get("displayedValue") + " " + widget.dispatchTime.get("displayedValue");
                    var dt = new Date(date1);
                    info.rescheduleDate = widget.formatDate(dt, "YYYY-MM-DD H24:MI:SS");
                    info.notesText = "Reschedule Date & Time:" + info.rescheduleDate + " " + widget.timeZone.get("value") + " " + widget.noteForDispatcher.get("value");
                    //console.log(info.dispatchDate);
                } else if (widget.woAction == "Cancel") {
                    if (!widget.form2.isValid()) {
                        widget.form2.validate();
                        return;
                    }
                    info.subStatus = "Cancellation Request";
                    info.notesText = widget.noteForDispatcher.get("value");
                }
                info.woAction = widget.woAction;
                info.status = "Awaiting Field Coordinator";
                info.modifiedUser = widget.agentName;
                var callback = function (obj) {
                    if (obj.response.code == 200) {
                        widget.addWoNotes(info);
                        widget.wocancelRescheduleDlg.destroyRecursive();
                        widget.ctrl.showSuccessMessage(obj);
                    }
                };
                widget.ctrl.updateWorkOrder(info, callback);
            });

        },
        addWoNotes: function (req) {
            var info = {};
            var widget = this;
            info.woId = req.id;
            info.woNumber = req.workOrderNo;
            info.createdByTeam = "Incident";
            info.createdBy = widget.agentName;
            info.modifiedBy = widget.agentName;
            info.noteText = req.notesText;
            info.subject = req.status + "-" + req.subStatus;

            widget.ctrl.postAPI("woNotes", info);
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});
