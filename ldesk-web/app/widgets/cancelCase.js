define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/_base/lang",
    "dojo/dom-style",
    "dojo/on",
    "app/model/postMortem",
    "app/model/Status",
    "app/widgets/viewCase",
    "dojo/text!app/widgets/templates/cancel_case.html",
    "dojo/domReady!"
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, domStyle, on, PostMortemStore, StatusStore, ViewCase, template) { // jshint ignore:line

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
            widget.postMortemStore = new PostMortemStore();
            widget.statusStore = new StatusStore();

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
                    widget.cancelCaseDialog.destroyRecursive();
                    new messageWindow({
                        message: "Case Cancelled Successfully",
                        title: "Success"
                    });
                } else {
                    new messageWindow({
                        message: obj.response.message,
                        title: "Error"
                    });
                }
            };

            widget.ctrl.updateCase(data, lang.hitch(this, callback));
        },

        setCaseDetails: function () {

            var widget = this;
            var callback = function (obj) {
                widget.cancelCaseDialog.hide();
                widget.setWidgetValues(obj.data, widget.caseClosureWidget.domNode);
                widget.setWidgetValues(obj.data, widget.caseManagementWidget.domNode);
                widget.setWidgetValues(obj.data, widget.caseEventWidget.domNode);
            }


            widget.ctrl.getCaseDetails(widget.data.caseId, callback);


        },

        postCreate: function () {
            var widget = this;
            this.inherited(arguments);
            widget.subStatus.set("store", widget.statusStore.getSubStatusStore(3));
            widget.postMortem.set("store", this.postMortemStore.getPostMortemStore());
            if (widget.data.groupName == "Inquiry" || widget.data.groupName == "Equipment") {
                domStyle.set(widget.IncTable.domNode, "display", "none");
            } else if (widget.data.groupName == "Incident" || widget.data.groupName == "Network") {
                domStyle.set(widget.InqTable.domNode, "display", "none");
            }

            on(widget.closeBtn, "click", function () {
                widget.cancelCaseDialog.hide();
            });

            widget.submitBtn.on("click", lang.hitch(this, function () {
                if (widget.data.groupName == "Incident" || widget.data.groupName == "Network") {
                    widget.data.status = "Cancelled";
                    widget.data.statusId = 3;
                    widget.data.subStatus = widget.subStatus.get("value");
                    widget.data.subStatusId = 0;
                    widget.data.postMortem = widget.postMortem.get("value");
                    widget.data.resolutionDescription = widget.cancelDescIncident.get("value");
                } else if (widget.data.groupName == "Inquiry" || widget.data.groupName == "Equipment") {
                    widget.data.status = "Cancelled";
                    widget.data.statusId = 3;
                    widget.data.subStatusId = 0;
                    widget.data.resolutionDescription = widget.cancelDescInquiry.get("value");
                }
                if (!widget.validate(widget.data.groupName)) {
                    new messageWindow({
                        message: "Please enter required(*) values!!",
                        title: "NOTE"
                    });
                    return;
                } else {
                    widget.submit(widget.data);
                }
            }));
            widget.cancelCaseDialog.show();
        },
        validate: function (groupName) {
            var widget = this;
            if ((groupName == "Incident") && !widget.formInc.isValid()) {
                widget.formInc.validate();
                return false;
            }
            if ((groupName == "Inquiry") && !widget.formInq.isValid()) {
                widget.formInq.validate();
                return false;
            }
            if ((groupName == "Network") && !widget.formInc.isValid()) {
                widget.formInc.validate();
                return false;
            }

            return true;

        },

        destroy: function () {
            this.inherited(arguments);
        }
    });

});
