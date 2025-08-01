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
    "dojo/text!app/widgets/templates/add_notes.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on,Dialog,TitleGroup, TitlePane, template) { // jshint ignore:line

    var widget = null;

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
        templateString: template,
        widgetsInTemplate: true,
        info: null,
        constructor: function (args) {
            lang.mixin(this, args);
		    var widget = this;
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
            this.inherited(arguments);  
            widget.notesDialog.show();
            on(widget.cancelBtn, "click", function () {
		   widget.notesDialog.hide();
		   });
          
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});
