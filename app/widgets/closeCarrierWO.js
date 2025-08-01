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
    "dijit/form/DateTextBox",
    "dijit/form/TimeTextBox",
    "dojox/widget/TitleGroup",
    "dijit/TitlePane",
    "app/model/WOStatus",
    "dojo/text!app/widgets/templates/close_carrier_wo.html",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, DateTextBox, TimeTextBox, TitleGroup, TitlePane, WOStatusStore, template) { // jshint ignore:line

    var widget = null;

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
        templateString: template,
        widgetsInTemplate: true,
        info: null,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;
            widget.data = widget.info;
            widget.ctrl = widget.lingoController;

            widget.statusStore = new WOStatusStore();
        },
        buildRendering: function () {
            this.inherited(arguments);
        },
        resize: function () {
            this.inherited(arguments);
        },
        init: function () {

        },
        populateData: function (data) {
            var widget = this;
            this.setWidgetValues(data, widget.closeCarrierWOTable.domNode);
            var date = new Date(widget.data.dispatchDate);
            widget.dispatchDate1.set("value", date);

            // Set the time value
            var dispatchTime = widget.data.dispatchDate.split(' ')[1];
            var timeParts = dispatchTime.split(':');
            var time = new Date();
            time.setHours(timeParts[0], timeParts[1], timeParts[2]);
            widget.dispatchTime1.set("value", time);

            //widget.status.set("value", widget.data.status);

        },
        postCreate: function () {
            var widget = this;
            this.inherited(arguments);
            widget.closeCarrierWODlg.show();
            if (widget.data) {
                widget.status.set("store", this.statusStore.getWOStatusStore(widget.data.workOrderType));
                widget.populateData(widget.data);
            }

            on(widget.cancelCarrierBtn, "click", function () {
                widget.closeCarrierWODlg.destroyRecursive();
            });

            on(widget.submitBtn, "click", function () {
                if (!widget.closeCarrierWOForm.isValid()) {
                    widget.closeCarrierWOForm.validate();
                    return;
                }
                var info = dojo.clone(widget.data);
                widget.getInfo(info);
                var callback = function (obj) {
                    if (obj.response.code == 200) {
                        widget.closeCarrierWODlg.destroyRecursive();
                        widget.ctrl.showSuccessMessage(obj);
                    }
                };
                widget.ctrl.updateWorkOrder(info, callback);
            });
        },
        getInfo: function (info) {
            var widget = this;

            info.statusId = 0;
            widget.getWidgetvalues(info, widget.closeCarrierWOTable.domNode);
            var date1 = widget.dispatchDate1.get("displayedValue") + " " + widget.dispatchTime1.get("displayedValue");
            //console.log(date1);

            var dt = new Date(date1);
            info.dispatchDate = widget.formatDate(dt, "YYYY-MM-DD H24:MI:SS");

            // info.dispatchDate = widget.formatDate(new Date(widget.dispatchDate1.get("displayedValue") + " " + widget.dispatchTime1.get("value")), "YYYY-MM-DD H24:MI:SS");
            console.log(info.dispatchDate);
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});
