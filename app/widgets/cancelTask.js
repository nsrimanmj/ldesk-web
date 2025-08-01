define([
    "dojo/_base/declare",
    "dojo/parser",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/registry",
    "dstore/Memory",
    "dojo/_base/lang",
    "dojo/dom-style",
    "dojo/dom",
    "dojo/on",
    "dijit/form/Form",
    "dojox/layout/TableContainer",
    "dijit/form/TextBox",
    "dijit/form/Textarea",
    "dijit/form/Select",
    "dojo/data/ObjectStore",
    "dstore/legacy/DstoreAdapter",
    "dojo/topic",
    "dojo/text!app/widgets/templates/cancel_task.html",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, Memory, lang, domStyle, dom, on, Form, TableContainer, TextBox, Textarea, Select, ObjectStore, DstoreAdapter, topic, template) { // jshint ignore:line

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
        },
        buildRendering: function () {
            var widget = this;
            this.inherited(arguments);
            widget.exceptionMsg = `<ul>
                    <li>Task Owner must be assigned to a User.</li>
                    <li>Case Owner must be assigned to a User.</li>
                    <li>Category should be Engineering</li>
                    <ul>`;
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
                    widget.cancelTaskDlg.destroyRecursive();
                    new messageWindow({
                        message: "Task Cancelled Successfully",
                        title: "Success"
                    });
                } else {
                    new messageWindow({
                        message: obj.response.message,
                        title: "Error"
                    });
                }
            };

            widget.ctrl.updateTask(data, lang.hitch(this, callback));
        },

        postCreate: function () {
            var widget = this;
            this.inherited(arguments);
            widget.cancelTaskDlg.show();
            on(widget.closeBtn, "click", function () {
                widget.cancelTaskDlg.hide();
            });
            if ((widget.data.ownerId == undefined || widget.data.ownerId == "") || (widget.caseData.ownerName == undefined || widget.caseData.ownerName == "") || (widget.data.category != "Engineering")) {
                domStyle.set(dom.byId(widget.exceptionDiv.domNode), "display", "block");
                widget.exceptionPane.set("content", widget.exceptionMsg);
                domStyle.set(dom.byId(widget.cancelTaskForm.domNode), "display", "none");
                widget.submitBtn.set("disabled", true);
                return;
            }

            widget.submitBtn.on("click", lang.hitch(this, function () {
                //validate the form and submit the data
                if (!widget.cancelTaskForm.isValid()) {
                    new messageWindow({
                        message: "Please enter required(*) values!!",
                        title: "NOTE"
                    });
                    return;
                } else {
                    var info = dojo.clone(widget.data);
                    info.resolution = widget.resCancel.get("value");
                    info.status = "Cancelled";
                    info.statusId = 0;
                    widget.submit(info);
                }
            }));



        },

        destroy: function () {
            this.inherited(arguments);
        }
    });

});
