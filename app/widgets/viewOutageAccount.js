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
    "dojo/text!app/widgets/templates/view_outage_account.html",
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

            //console.log(this.info);
            widget.outageStore = new Memory({
                idProperty: 'id',
                data: this.info
            });
            //widget.userStore.setData(this.info);

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
            var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow, Selector]);

            var layout = [
                { label: "Account Id", field: "accountId", width: 50 },
                { label: "Phone", field: "phone", width: 90, formatter: lang.hitch(this, this.phoneNumberFormatter) },
                { label: "Email Address", field: "emailAddr", width: 90 },
                { label: "Email Status", field: "emailStatusName", width: 50 },
                { label: "Sms Status", field: "smsStatusName", width: 50 }
            ];

            widget.accOutageGrid = new Grid({
                loadingMessage: "Grid is loading",
                noDataMessage: "No Account Found!!",
                collection: widget.outageStore,
                className: 'lingogrid',
                keepScrollPosition: false,
                columns: layout,
                selectionMode: "single",
                rowSelector: '20px',
                allowSelectAll: true,
                allowTextSelection: true,
                height: "100%",
                minRowsPerPage: 500
            }, widget.showOutAccDialogDiv);



            widget.accOutageGrid.set('summary', "Total :" + widget.outageStore.data.length + " Entries");

            widget.accOutageGrid.startup();
            widget.accOutageGrid.refresh();

            widget.showOutAccDialog.show();

            on(widget.showOutAccDialog, "hide", lang.hitch(this, function () {
                widget.showOutAccDialog.destroyRecursive();
                this.destroy();
            }));

            on(widget.closeBtn, "click", lang.hitch(this, function () {
                widget.showOutAccDialog.hide();
            }));
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });


});