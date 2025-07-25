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
    "dojo/text!app/widgets/templates/account_parent_info.html",
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
            widget.data = widget.info;
            if (widget.data.groupName == "Collections") {
                this.handle1 = topic.subscribe("collectionCase/accountInfo" + widget.data.caseId, lang.hitch(this, function (obj) {
                    widget.setTopParent(obj);
                }));
            }
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
            widget.setWidgetValues(widget.collectionData, widget.accParFormTable.domNode);
            widget.topParAppId.set("value", widget.collectionData.topParAppId);
        },

        getCollectionInfo: function (info) {
            var widget = this;
            widget.getWidgetvalues(info, widget.accParFormTable.domNode);
        },
        setTopParent: function (data) {
            var widget = this;
            if (data.topParentAccountId == undefined) {
                var wd = widget.accParFormTable.domNode;
                var widgets = registry.findWidgets(wd);

                dojo.forEach(widgets, function (item, index) {
                    var attachPoint = item.dojoAttachPoint;
                    item.set("value", "");
                });
            } else {
                widget.topParAppId.set("value", data.topParentAccountId);
            }
        },
        editAccountDetails: function (searchKey, searchVal) {
            var widget = this;
            var requestObj = {
                "searchKey": searchKey,
                "searchValue": widget.ctrl.encodeSearchValue(searchVal),
                "regExpFlag": false,
                "activeOnlyFlag": false
            };
            var callback = function (obj) {
                if (obj.response.code == "200") {
                    widget.setTopParData(obj.data[0]);




                }

            }
            widget.ctrl.getAPI("search", requestObj, callback, false, false);
        },

        setTopParData: function (info) {
            var widget = this;
            widget.topParentAccountName.set("value", info.companyName == undefined ? "" : info.companyName);



            widget.parTopParAppId.set("value", info.topParentAccountId == undefined ? "" : info.topParentAccountId);

            widget.lev2ParAccountName.set("value", info.parentCompanyName == undefined ? "" : info.parentCompanyName);

            widget.parAccountType.set("value", info.accountType == undefined ? "" : info.accountType);


            widget.parSalesRepId.set("value", info.salesRepId == undefined ? "" : info.salesRepId);

            widget.parAccManager.set("value", info.accountManager == undefined ? "" : info.accountManager);

            widget.parCrmUser.set("value", info.crmName == undefined ? "" : info.crmName);

            widget.parBillCycle.set("value", info.billCycle == undefined ? "" : info.billCycle);


            widget.parPayType.set("value", info.payType == undefined ? "" : info.payType);

            widget.parPayByAppId.set("value", info.payByAppId == undefined ? "" : info.payByAppId);
        },

        postCreate: function () {
            var widget = this;
            if (widget.data.groupName != "Collections") {
                return;
            }
            widget.disableWidgets(widget.accParFormTable.domNode);

            if (widget.data) {


                widget.populateData(widget.data);
            }

            var appId = widget.topParAppId;
            if (appId !== undefined) {
                on(appId, 'change', function (value) {
                    if (value !== undefined) {
                        widget.editAccountDetails('AppID', appId.value);
                    }
                });

            }

        },
        destroy: function () {
            this.inherited(arguments);
        }
    });


});