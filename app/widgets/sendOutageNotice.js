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
    "dojo/text!app/widgets/templates/send_outage_notice.html",
    "app/model/States",
    "app/model/miniStores",
    "app/view/ValidationCheckedMultiSelect",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, Dialog, TitleGroup, TitlePane, template, States, MiniStores, ValidationCheckedMultiSelect) { // jshint ignore:line

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
                    widget.sendOutageDialog.destroyRecursive();
                    new messageWindow({
                        message: "Created Outage Notice Successfully",
                        title: "Success"
                    });
                } else {
                    new messageWindow({
                        message: obj.response.message,
                        title: "Error"
                    });
                }
            }
            widget.ctrl.sendOutageNotice(data, callback);
        },
        postCreate: function () {
            var widget = this;
            var statesModel = new States();
            var statesStore = statesModel.getStates();
            statesStore.remove(" ");
            widget.statesSelect.set("store", statesStore);
            var typeModel = new MiniStores();
            var servTypeStore = typeModel.getServiceType();
            widget.servType.set("store", servTypeStore);
            var accTypeStore = typeModel.getAccountType();
            widget.accType.set("store", accTypeStore);

            widget.submitBtn.on("click", lang.hitch(this, function () {
                //validate the form and submit the data
                if (!widget.outageForm.validate()) {
                    new messageWindow({
                        message: "Please enter required(*) values!!",
                        title: "NOTE"
                    });
                    return;
                } else {
                    var info = {};
                    info.caseId = widget.data.caseId;
                    info.servType = widget.servType.get("value").join(',');
                    info.messageType = widget.msgType.get("value");
                    info.statesAffected = widget.statesSelect.get("value").join(',');
                    info.accType = widget.accType.get("value").join(',');
                    info.message = widget.outageNotifMsg.get("value");
                    info.statusId = 0;
                    widget.submit(info);
                }
            }));

            on(widget.closeBtn, "click", function () {
                widget.sendOutageDialog.hide();
            });

            widget.sendOutageDialog.show();

        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});
