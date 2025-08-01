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
    "dojo/text!app/widgets/templates/create_task.html",
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
                    widget.createTaskDialog.destroyRecursive();
                    new messageWindow({
                        message: "Created task Successfully",
                        title: "Success"
                    });
                } else {
                    new messageWindow({
                        message: obj.response.message,
                        title: "Error"
                    });
                }
            }
            widget.ctrl.createTask(data, callback);
        },
        postCreate: function () {
            var widget = this;
            widget.caseId.set("value", widget.data.caseId);
            widget.category.set("value", "Engineering");
            widget.submitBtn.on("click", lang.hitch(this, function () {
                //validate the form and submit the data
                if (!widget.taskForm.isValid()) {
                    new messageWindow({
                        message: "Please enter required(*) values!!",
                        title: "NOTE"
                    });
                    return;
                } else {
                    var info = {};
                    info.caseId = widget.data.caseId;
                    var category = widget.category.get("value");
                    var type = widget.type.get("value");
                    if (category == "Engineering") {
                        info.queueName = "Engineering";
                    }
                    info.category = category;
                    info.type = type;
                    info.groupName = "Engineering";
                    info.ownerId = 0;
                    info.statusId = 1;
                    info.status = "New";
                    info.description = widget.descp.get("value");
                    widget.submit(info);
                }
            }));

            on(widget.closeBtn, "click", function () {
                widget.createTaskDialog.hide();
            });

            widget.createTaskDialog.show();

        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});
