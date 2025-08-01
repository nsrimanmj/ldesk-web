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
    "dojox/widget/TitleGroup",
    "dijit/TitlePane",
    "dijit/ConfirmDialog",
	"dijit/Dialog",
	"dijit/layout/ContentPane",
    "dijit/form/DateTextBox",
    "dijit/form/Button",
    "dojo/date",
    "dijit/registry",
    "dojo/text!app/widgets/templates/case_incident.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, TitleGroup, TitlePane, ConfirmDialog, Dialog, ContentPane, DateTextBox, Button, Date, registry, template) { // jshint ignore:line

    var widget = null;

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
        templateString: template,
        widgetsInTemplate: true,
        info: null,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;
            widget.accountId = registry.byId("accountId").get("value");
            widget.ctrl = widget.lingoController;
        },
        buildRendering: function () {
            this.inherited(arguments);
        },
        resize: function () {
            this.inherited(arguments);
        },
        init: function () {
            this.incSubmitBtn.setDisabled(true);

        },
        getInfo: function () {
            var widget = this;
            var caseInfo = {
                "groupName": "Incident",
                "serviceNumber": widget.srv_number.get("value"),
                "categoryId": 1,
                "description": widget.incidentDescription.get("value")
            };
            return caseInfo;

        },
        postCreate: function () {
            var widget = this;
            widget.incidentDialog.show();
            this.incSubmitBtn.setDisabled(true);

            on(widget.incidentMgmtDiv.domNode, "click", function () {
                if (widget.incidentContactDiv.get('open') == true) {
                    widget.incidentContactDiv.set('open', false);
                }
                if (widget.incidentLocDiv.get('open') == true) {
                    widget.incidentLocDiv.set('open', false);
                }
                if (widget.incidentDispatchDiv.get('open') == true) {
                    widget.incidentDispatchDiv.set('open', false);
                }
                if ((widget.incidentContactDiv.get('open') == false) && (widget.incidentLocDiv.get('open') == false) && (widget.incidentDispatchDiv.get('open') == false)) {
                    widget.incidentMgmtDiv.set('open', true);
                }
            });
            on(widget.incidentContactDiv.domNode, "click", function () {
                if (widget.incidentMgmtDiv.get('open') == true) {
                    widget.incidentMgmtDiv.set('open', false);
                }
                if (widget.incidentLocDiv.get('open') == true) {
                    widget.incidentLocDiv.set('open', false);
                }
                if (widget.incidentDispatchDiv.get('open') == true) {
                    widget.incidentDispatchDiv.set('open', false);
                }
                if ((widget.incidentMgmtDiv.get('open') == false) && (widget.incidentLocDiv.get('open') == false) && (widget.incidentDispatchDiv.get('open') == false)) {
                    widget.incidentContactDiv.set('open', true);
                }
            });
            on(widget.incidentLocDiv.domNode, "click", function () {
                if (widget.incidentContactDiv.get('open') == true) {
                    widget.incidentContactDiv.set('open', false);
                }
                if (widget.incidentMgmtDiv.get('open') == true) {
                    widget.incidentMgmtDiv.set('open', false);
                }
                if (widget.incidentDispatchDiv.get('open') == true) {
                    widget.incidentDispatchDiv.set('open', false);
                }
                if ((widget.incidentContactDiv.get('open') == false) && (widget.incidentMgmtDiv.get('open') == false) && (widget.incidentDispatchDiv.get('open') == false)) {
                    widget.incidentLocDiv.set('open', true);
                }
            });
            on(widget.incidentDispatchDiv.domNode, "click", function () {
                if (widget.incidentContactDiv.get('open') == true) {
                    widget.incidentContactDiv.set('open', false);
                }
                if (widget.incidentLocDiv.get('open') == true) {
                    widget.incidentLocDiv.set('open', false);
                }
                if (widget.incidentMgmtDiv.get('open') == true) {
                    widget.incidentMgmtDiv.set('open', false);
                }
                if ((widget.incidentContactDiv.get('open') == false) && (widget.incidentLocDiv.get('open') == false) && (widget.incidentMgmtDiv.get('open') == false)) {
                    widget.incidentDispatchDiv.set('open', true);
                }
                widget.incSubmitBtn.setDisabled(false);
            });
            on(widget.incCloseBtn, 'click', function () {
                widget.incidentDialog.destroyRecursive();
                widget.destroy;
            });
            on(widget.incSubmitBtn, 'click', function () {
                caseInfo = widget.getInfo();
                widget.ctrl.createCase(caseInfo);
                widget.incidentDialog.destroyRecursive();
                widget.destroy;
            });

        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});
