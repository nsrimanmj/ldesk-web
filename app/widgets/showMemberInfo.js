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
    "dojo/text!app/widgets/templates/show_member_info.html",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, lang, domStyle, topic, ConfirmDialog, Dialog, OnDemandGrid, EnhancedGrid, Selection, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, Memory, arrayUtil, json, on, date, locale, domConstruct, template) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], {
        templateString: template,
        widgetsInTemplate: true,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;
            widget.ctrl = widget.lingoController;

            //console.log(this.info);
            widget.userStore = new Memory({
                idProperty: 'userId',
                data: this.info
            });
            //widget.userStore.setData(this.info);

        },
        /*       buildRendering: function () {
                   this.inherited(arguments);
                },
                 */
        resize: function () {
            this.inherited(arguments);
        },
        init: function () {
        },

        postCreate: function () {
            var widget = this;

            var Grid = declare([OnDemandGrid, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, Selection, DijitRegistry, SummaryRow]);

            var layout = [
                { label: "Login Name", field: "loginName", width: 50 },
                { label: "Full Name", field: "fullName", width: 60 },
                { label: "Email Address", field: "emailAddress", width: 90 },
                { label: "Status", field: "status", width: 50 },
                { label: "Create Date", field: "createDate", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
                { label: "Created By", field: "createdBy", width: 50 },
                { label: "Modified Date", field: "modifiedDate", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
                { label: "Modified By", field: "modifiedBy", width: 50 },
                { label: "User ID", field: "userId", width: 50, "hidden": true }
            ];

            widget.memberListGrid = new Grid({
                id: "memberListGrid" + this.groupId,
                collection: widget.userStore,
                keepScrollPosition: true,
                columns: layout,
                className: 'lingogrid'
                //       selectionMode: "single"
                //     rowSelector: '20px'
            }, widget.showMembersDialogDiv);

            widget.memberListGrid.set('summary', "Total :" + widget.userStore.data.length + " Entries");

            widget.memberListGrid.startup();
            widget.memberListGrid.refresh();

            widget.showMembersDialog.show();

            on(widget.showMembersDialog, "hide", lang.hitch(this, function () {
                widget.showMembersDialog.destroyRecursive();
                this.destroy();
            }));

            on(widget.closeBtn, "click", lang.hitch(this, function () {
                widget.showMembersDialog.hide();
            }));
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });


});