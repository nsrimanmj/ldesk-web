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
    "dojo/text!app/widgets/templates/case_event_details.html",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, TitleGroup, TitlePane, template) { // jshint ignore:line

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
            widget.loginName = window.localStorage.getItem("agent");
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
            this.setWidgetValues(data, widget.caseEventDetailsTable.domNode);
        },
        postCreate: function () {
            var widget = this;
            this.inherited(arguments);
            this.disableWidgets(widget.caseEventDetailsTable.domNode);
            widget.updateFieldVisibility(widget.data.groupName, widget.caseEventDetailsTable);
            if (widget.data) {
                widget.populateData(widget.data);
            }
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});
