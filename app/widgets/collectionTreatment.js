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
    "dojo/text!app/widgets/templates/collection_treatment_info.html",
    "dgrid/Selector",
    "app/model/miniStores",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, lang, domStyle, topic, ConfirmDialog, Dialog, OnDemandGrid, EnhancedGrid, Selection, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, Memory, arrayUtil, json, on, date, locale, domConstruct, template, Selector
    , MiniStores
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], {
        templateString: template,
        widgetsInTemplate: true,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;
            widget.ctrl = widget.lingoController;
            widget.miniStores = new MiniStores();
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
            //widget.setWidgetValues(widget.data, widget.colTreatFormTable.domNode);
            widget.setWidgetValues(widget.collectionData, widget.colTreatFormTable.domNode);
            widget.remainderDate.set("value", new Date(widget.collectionData.remainderDate));
            widget.suspendNoticeDate.set("value", new Date(widget.collectionData.suspendNoticeDate));
            widget.disconnectNoticeDate.set("value", new Date(widget.collectionData.disconnectNoticeDate));
            widget.finalDemandNoticeDate.set("value", new Date(widget.collectionData.finalDemandNoticeDate));
        },
        postCreate: function () {
            var widget = this;
            widget.disableWidgets(widget.colTreatFormTable.domNode);
            if (widget.data) {
                widget.populateData(widget.data);
            }

            widget.treatmentStatus.set("store", widget.miniStores.getTreatmentStatus());

        },
        destroy: function () {
            this.inherited(arguments);
        }
    });


});