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
    "dojo/on",
    "dijit/form/Form",
    "dojox/layout/TableContainer",
    "dijit/form/ComboBox",
    "dijit/form/SimpleTextarea",
    "dijit/form/Select",
    "dojo/data/ObjectStore",
    "dstore/legacy/DstoreAdapter",
    "dojo/text!app/widgets/templates/case_information.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, Memory, lang, domStyle, on, Form, TableContainer, ComboBox, Textarea, Select, ObjectStore, DstoreAdapter, template) { // jshint ignore:line

    var widget = null;

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
        templateString: template,
        widgetsInTemplate: true,
        info: null,
        constructor: function (args) {
            lang.mixin(this, args);
		    var widget = this;
           // widget.ctrl = widget.lingoController;
        },
           /*buildRendering: function () {
            this.inherited(arguments);
         },*/
        resize: function () {
            this.inherited(arguments);
        },
        init: function () {
           
        },
        
        postCreate: function () {
            var widget = this;
            this.inherited(arguments);            
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});