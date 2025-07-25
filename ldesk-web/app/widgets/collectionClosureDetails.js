define([
    "dojo/_base/declare",
    "dojo/parser",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/registry",
    "dojo/_base/lang",
    "dojo/dom-style",
    "dojo/topic",
    "dijit/ConfirmDialog",
    "dijit/Dialog",
    "dgrid/OnDemandGrid",
    "dojox/grid/EnhancedGrid",
    "dgrid/Selection",
    "dgrid/extensions/DijitRegistry",
    "dgrid/extensions/ColumnResizer",
    "dgrid/extensions/ColumnReorder",
    "dgrid/extensions/ColumnHider",
    "dgrid/Keyboard",
    "app/view/summaryRow",
    "dstore/Memory",
    "dojo/_base/array",
    "dojo/json",
    "dojo/on",
    "dojo/date",
    "dojo/date/locale",
    "dojo/dom-construct",
    "dojo/text!app/widgets/templates/collection_closure_details.html",
    "dgrid/Selector",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, lang, domStyle, topic, ConfirmDialog, Dialog, OnDemandGrid, EnhancedGrid, Selection, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, Memory, arrayUtil, json, on, date, locale, domConstruct, template, Selector) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], {
        templateString: template,
        widgetsInTemplate: true,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;
            widget.ctrl = widget.lingoController;
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
            widget.data = data;
            widget.collectionData = widget.data.collectionInfo;
            widget.setWidgetValues(widget.collectionData, widget.colClosureFormTable.domNode);
              if (widget.collectionData.endDate) {
                var endDate = new Date(widget.collectionData.endDate);
                widget.endDate.set("value", endDate);
            }

        },

        postCreate: function () {
            var widget = this;

            widget.disableWidgets(widget.colClosureFormTable.domNode);

            if (widget.data) {


                widget.populateData(widget.data);
            }

        },
        destroy: function () {
            this.inherited(arguments);
        }
    });


});