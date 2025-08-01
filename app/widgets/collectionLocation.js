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
    "dojo/text!app/widgets/templates/collection_location_info.html",
    "dgrid/Selector",
    'dgrid/CellSelection',
    "app/widgets/accParentInfo",
    "dojo/keys",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, lang, domStyle, topic, ConfirmDialog, Dialog, OnDemandGrid, EnhancedGrid, Selection, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, Memory, arrayUtil, json, on, date, locale, domConstruct, template, Selector, CellSelection,
    accParentInfo, keys
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], {
        templateString: template,
        widgetsInTemplate: true,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;
            widget.data = widget.info;
            widget.ctrl = widget.lingoController;
            widget.accountStore = new Memory({
                idProperty: "accountId",
                data: []
            });


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
            widget.setWidgetValues(widget.collectionData, widget.colLocFormTable.domNode);
            widget.accountId.set("value", widget.collectionData.accountId);



        },
        getInfo: function (info) {
            var widget = this;
            info.accountId = widget.accountId.get("value");
        },

        getCollectionInfo: function (info) {
            var widget = this;
            info.accountId = widget.accountId.get("value");
            widget.getWidgetvalues(info, widget.colLocFormTable.domNode);
        },
        disableFields: function () {
            var widget = this;
            widget.showSearchButton.set("disabled", false);
        },

        searchAccount: function (searchKey, searchVal) {
            var widget = this;
            this.accountStore.setData([]);
            var callback = function (obj) {
                widget.accountStore.setData(obj.data);
                widget.searchGrid.refresh();
            }

            var req = {
                "searchKey": searchKey,
                "searchValue": widget.ctrl.encodeSearchValue(searchVal),
                "regExpFlag": true,
                "activeOnlyFlag": false
            }

            this.ctrl.getAPI("search", req, callback);
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

                    widget.accountName.set("value", obj.data[0].companyName == undefined ? "" : obj.data[0].companyName);


                    widget.topParAppId.set("value", obj.data[0].topParentAccountId == undefined ? "" : obj.data[0].topParentAccountId);
                    topic.publish("collectionCase/accountInfo" + widget.data.caseId, obj.data[0]);


                    widget.topParentAccountName.set("value", obj.data[0].parentCompanyName == undefined ? "" : obj.data[0].parentCompanyName);

                    widget.accountType.set("value", obj.data[0].accountType == undefined ? "" : obj.data[0].accountType);


                    widget.salesRepId.set("value", obj.data[0].salesRepId == undefined ? "" : obj.data[0].salesRepId);

                    widget.accManager.set("value", obj.data[0].accountManager == undefined ? "" : obj.data[0].accountManager);

                    widget.crmUser.set("value", obj.data[0].crmName == undefined ? "" : obj.data[0].crmName);

                    widget.billCycle.set("value", obj.data[0].billCycle == undefined ? "" : obj.data[0].billCycle);


                    widget.payType.set("value", obj.data[0].payType == undefined ? "" : obj.data[0].payType);

                    widget.payByAppId.set("value", obj.data[0].payByAppId == undefined ? "" : obj.data[0].payByAppId);



                }

            }
            widget.ctrl.getAPI("search", requestObj, callback, false, false);
        },
        disableViewFields: function () {
            var widget = this;
            widget.showSearchButton.set("disabled", true);
        },
        postCreate: function () {
            var widget = this;
            if (widget.data.groupName != "Collections") {
                return;
            }
            widget.disableWidgets(widget.colLocFormTable.domNode);
            widget.disableViewFields();

            if (widget.data) {


                widget.populateData(widget.data);
            }


            on(widget.showSearchButton, "click", function () {
                widget.searchName.reset();
                widget.cp_searchText.set("value", "");
                widget.accountStore.setData([]);
                widget.searchGrid.refresh();
                widget.searchAccDlg.show();
            });

            on(widget.addBtn, "click", function () {
                widget.accountId.set("value", widget.selAccountId.get("value"));
                widget.searchAccDlg.hide();
            });

            on(widget.cancelSearchBtn, "click", function () {
                widget.searchAccDlg.hide();
            });
            on(widget.searchName, 'change', function (value) {
                if (value == "App ID") {
                    widget.searchlabel.innerHTML = "App ID";
                    widget.cp_searchText.set("value", "");
                }
                else if (value == "Customer Name") {
                    widget.searchlabel.innerHTML = "Customer Name";
                    widget.cp_searchText.set("value", "");
                }
            });
            var appId = widget.accountId;
            if (appId !== undefined) {
                on(appId, 'change', function (value) {
                    if (value !== undefined) {
                        widget.editAccountDetails('AppID', appId.value);
                    }
                });

            }

            var Grid = declare([OnDemandGrid, ColumnResizer, ColumnReorder, ColumnHider, DijitRegistry, SummaryRow, CellSelection]);
            var accountLayout = [
                { label: "Account Name", field: "companyName", width: 130 },
                { label: "App Id", field: "accountId", width: 100, allowSelect: true },
                { label: "Parent Account Id", field: "parentAccountId", width: 90, allowSelect: true },
                { label: "Top Parent Account Id", field: "topParentAccountId", width: 90, allowSelect: true },
                { label: "Created", field: "created", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
                { label: "Status", field: "status", width: 80 },
                { label: "Location Address", field: "locationAddress", width: 200 },
                { label: "Billing System", field: "billingSystem", width: 90, hidden: true }
            ];

            widget.searchGrid = new Grid({
                loadingMessage: "Search is loading",
                noDataMessage: "No account Found!!",
                collection: widget.accountStore,
                className: 'lingogrid',
                keepScrollPosition: false,
                columns: accountLayout,
                selectionMode: "single",
                rowSelector: '20px',
                allowSelectAll: false,
                allowTextSelection: true,
                height: "100%",
                allowSelect: lang.hitch(this, this.allowCellSelect),
            }, widget.searchResDiv);

            on(widget.searchBtn, "click", function () {
                var searchKey = widget.searchName.get("value");
                var searchValue = widget.cp_searchText.get("value");
                widget.searchAccount(searchKey, searchValue);
            });

            widget.searchGrid.on('dgrid-select', function (event) {
                // Get the rows that were just selected
                var grid = widget.searchGrid;
                var cell = event.cells[0];
                var accountType = cell.column.field;//accountId
                if (cell.row.data[accountType]) {
                    widget.addBtn.set("disabled", false);
                }
                if (cell.row.data)
                    widget.selectedAccountData = cell.row.data;
                widget.selAccountType.set("value", accountType);
                widget.selAccountId.set("value", cell.row.data[accountType]);
            });

            widget.searchGrid.on('dgrid-deselect', function (event) {
                widget.selAccountType.set("value", " ");
                widget.selAccountId.set("value", "");
                widget.selectedAccountData = {};
                widget.addBtn.set("disabled", true);
            });

            on(widget.searchName, "keypress", function (event) {
                if (event.keyCode === keys.ENTER) {
                    var searchKey = widget.searchName.get("value");
                    var searchValue = widget.cp_searchText.get("value");
                    widget.searchAccount(searchKey, searchValue);
                }
            });

        },

        allowCellSelect: function (row) {
            //console.log(row);
            if (!row.column) return true;
            if (row.column && row.column.allowSelect) {
                return true;
            }
            return false;
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });


});