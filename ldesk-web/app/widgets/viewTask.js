define([
    "dojo/_base/declare",
    "dojo/parser",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dstore/Memory",
    "dijit/registry",
    "dojo/_base/lang",
    "dojo/dom-style",
    "dojo/topic",
    "dojo/on",
    "dijit/Dialog",
    "dojox/widget/TitleGroup",
    "dijit/TitlePane",
    "dojo/text!app/widgets/templates/view_task.html",
    "app/model/Status",
    "app/widgets/closeTask",
    "app/widgets/cancelTask",
    "dijit/ConfirmDialog",
    "dijit/layout/ContentPane",
    "app/widgets/viewCase",
    "dgrid/OnDemandGrid",
    "dgrid/Selection",
    "dgrid/Selector",
    "dgrid/extensions/DijitRegistry",
    "dgrid/extensions/ColumnResizer",
    "dgrid/extensions/ColumnReorder",
    "dgrid/extensions/ColumnHider",
    "dgrid/Keyboard",
    "app/view/summaryRow",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, registry, lang, domStyle, topic, on, Dialog, TitleGroup, TitlePane, template, StatusStore, CloseTask, CancelTask, ConfirmDialog, ContentPane, ViewCase
    , OnDemandGrid, Selection, Selector, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow
) { // jshint ignore:line

    var widget = null;

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
        templateString: template,
        widgetsInTemplate: true,
        info: null,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;
            widget.ctrl = widget.lingoController;
            widget.data = widget.info;
            widget.caseData = widget.data.caseDetails;
            widget.agentStore = widget.ctrl.getAgentStore();
            widget.statusStore = new StatusStore();
            //to refresh case details
            this.handle1 = topic.subscribe("lingoController/caseUpdated-" + widget.info.caseId, lang.hitch(this, function (obj) {
                widget.caseData = obj.data;
                widget.setWidgetValues(widget.caseData, widget.caseMgmtTable.domNode);
            }));

            //to refresh details 
            this.handle2 = topic.subscribe("lingoController/taskUpdated-" + widget.info.id, lang.hitch(this, function (obj) {
                widget.refreshData(obj.data);
            }));

            this.handle = topic.subscribe("lingoController/agentListLoaded", lang.hitch(this, function (info) {
                widget.setOwnerInfo();
            }));
            widget.taskHistoryStore = new Memory({
                idProperty: "entryId",
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
        initTaskRelated: function () {
            var widget = this;
            widget.getTaskHistory();
        },
        resetForms: function () {
            var widget = this;
            widget.caseMgmntForm.reset();
            widget.TaskMgmntForm.reset();
            widget.TaskEventInfoForm.reset();

        },
        setOwnerInfo: function () {
            var widget = this;
            widget.ownerId.set("store", widget.agentStore.getAgentsByQueue("Engineering"));
            widget.ownerId.set("value", widget.data.ownerId);

        },
        refreshData: function (data) {
            var widget = this;
            widget.data = data;
            widget.disableData(data);
            widget.resetForms();
            if (!widget.isTaskEditable()) {
                widget.TaskEditBtn.set("disabled", true);
                widget.taskActionBtn.set("disabled", true);
            } else {
                widget.TaskEditBtn.set("disabled", false);
                widget.taskActionBtn.set("disabled", false);
            }
            widget.populateData(data);
        },
        disableData: function (data) {
            var widget = this;

            widget.disableWidgets(widget.caseMgmtTable.domNode);
            widget.disableWidgets(widget.TaskMgmntTable.domNode);
            widget.disableWidgets(widget.TaskEventInfoTable.domNode);


        },
        populateData: function (data) {
            var widget = this;
            widget.TaskNumSpan.innerHTML = data.taskNumber;
            widget.status.set("store", this.statusStore.getTaskStatusStore());
            widget.setWidgetValues(widget.caseData, widget.caseMgmtTable.domNode);
            widget.setWidgetValues(data, widget.TaskMgmntTable.domNode);
            widget.setWidgetValues(data, widget.TaskEventInfoTable.domNode);
        },
        refresh: function () {

            var widget = this;
            var taskId = widget.data.id;
            var callback = function (obj) {
                widget.data = obj.data;
                widget.refreshData(obj.data)
            }
            this.ctrl.getTaskDetails(taskId, callback);
        },
        isTaskEditable: function () {
            var widget = this;
            if (widget.data.status == "Closed" || widget.data.status == "Cancelled") {
                return false;
            }


            return true;
        },
        getTaskHistory: function () {
            var widget = this;
            if (widget.data) {
                var info = { "taskId": widget.data.id };
                var callBack = function (obj) {
                    widget.taskHistoryStore.setData(obj.data);
                    widget.historyGrid.refresh();
                    widget.historyGrid.resize();
                };
                widget.ctrl.getAPI("getTaskHistory", info, callBack);
            }
        },
        postCreate: function () {
            var widget = this;
            widget.ownerId.set("store", widget.agentStore.getAgentsByQueue("Engineering"));
            widget.status.set("store", this.statusStore.getTaskStatusStore());

            if (widget.data) {
                widget.refreshData(widget.data);
            }

            var Grid = declare([OnDemandGrid, Selection, Selector, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow]);


            var historyLayout = [
                { label: "Date", field: "modifiedDate", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
                { label: "Field", field: "field", width: 90 },
                { label: "User", field: "modifiedUser", width: 80 },
                { label: "Original Value", field: "oldValue", width: 90 },
                { label: "New Value", field: "newValue", width: 90 },
                { label: "Description", field: "description", width: 110, hidden: true }
            ];

            widget.historyGrid = new Grid({
                loadingMessage: "Grid is loading",
                noDataMessage: "No Items to Display!!",
                collection: widget.taskHistoryStore,
                className: 'lingogrid',
                columns: historyLayout,
                allowTextSelection: true,
                selectionMode: "single",
                rowSelector: '20px',
            }, widget.taskHistoryDiv);


            on(widget.TaskEditBtn, "click", function () {
                widget.enableDetails();

            });
            on(widget.TaskSaveBtn, "click", function () {
                var updateInfo = {};
                if (!widget.TaskMgmntForm.isValid()) {
                    new messageWindow({
                        message: "Please enter required(*) values!!",
                        title: "NOTE"
                    });
                    return;
                }

                else {

                    updateInfo.id = widget.info.id;
                    updateInfo.category = widget.category.get("value");
                    updateInfo.queueName = widget.queueName.get("value");
                    updateInfo.ownerId = widget.ownerId.get("value");
                    updateInfo.status = widget.status.get("value");
                    updateInfo.description = widget.description.get("value");
                    updateInfo.resolution = widget.resolution.get("value");
                    updateInfo.caseId = widget.caseNumber.get("value");
                    //console.log(updateInfo);
                    var callback = function (obj) {
                        widget.ctrl.showSuccessMessage(obj);
                        if (obj.response.code == 200) {
                            widget.disableData();
                            widget.resetButtons(0);
                        }
                    }
                    widget.ctrl.updateTask(updateInfo, lang.hitch(this, callback));
                }
            });

            on(widget.refreshBtn, "click", function () {
                widget.refresh();
            });

            on(widget.TaskCloseBtn, "click", function () {
                widget.closeWindow();
            });

            on(widget.closeTaskBtn, "click", function () {
                new CloseTask({
                    'lingoController': widget.ctrl,
                    'info': widget.data,
                });
            });

            on(widget.cancelTaskBtn, "click", function () {
                new CancelTask({
                    'lingoController': widget.ctrl,
                    'info': widget.data,
                });
            });


            on(widget.TaskDiscardBtn, "click", function () {
                widget.disableData();
                widget.refreshData(widget.data);
                widget.resetButtons(0);
            });
            on(widget.viewCaseBtn, "click", function () {
                widget.viewCaseDetails(widget.caseData.caseNumber, widget.ctrl, widget.caseData);
            });
        },
        enableDetails: function () {
            var widget = this;
            widget.resetButtons(1);
            widget.enableWidgets(widget.TaskMgmntTable.domNode);
            widget.disableFields();
            widget.status.set("store", this.statusStore.getTaskEditStatusStore());
        },
        disableFields: function () {
            var widget = this;
            widget.resolution.set("disabled", true);
            widget.taskNumber.set("disabled", true);
        },
        resetButtons: function (mode) {
            var widget = this;
            if (mode == 1) { //mode:1 edit mode
                widget.taskActionBtn.set("disabled", true);
                widget.refreshBtn.set("disabled", true);
                domStyle.set(widget.TaskEditBtn.domNode, "display", "none");
                domStyle.set(widget.TaskSaveBtn.domNode, "display", "block");
                domStyle.set(widget.TaskDiscardBtn.domNode, "display", "block");
            } else if (mode == 0) { //mode:0 save mode
                widget.taskActionBtn.set("disabled", false);
                widget.refreshBtn.set("disabled", false);
                domStyle.set(widget.TaskEditBtn.domNode, "display", "block");
                domStyle.set(widget.TaskSaveBtn.domNode, "display", "none");
                domStyle.set(widget.TaskDiscardBtn.domNode, "display", "none");
            }
        },
        closeWindow: function () {
            var requestContentPane = registry.byId("task_contentPane_" + this.data.taskNumber);
            var caseNumber = this.formatCaseNumber(this.data.caseId);
            this.viewCaseDetails(caseNumber, this.ctrl, this.caseData);
            registry.byId("appTabContainer").removeChild(requestContentPane);
            requestContentPane.destroyRecursive();
            registry.byId("appTabContainer").startup();
        },
        handleOnClose: function () {
            var widget = this;
            if (widget.refreshBtn.disabled == true) {
                if (registry.byId("task_contentPane_" + widget.data.taskNumber)) {
                    registry.byId("appTabContainer").selectChild("task_contentPane_" + widget.data.taskNumber);
                }
                var myDialog = new ConfirmDialog({
                    title: "Closing Task Tab - " + widget.data.taskNumber,
                    content: "You cannot close this tab due to unsaved changes. Do You really want to close?",
                    style: "width: 500px",
                    onExecute: function () {
                        widget.closeWindow();
                    }
                });
                myDialog.show();
                return false;
            }
            widget.closeWindow();
        },
        destroy: function () {
            this.inherited(arguments);
            if (this.handle1)
                this.handle1.remove();
            if (this.handle2)
                this.handle2.remove();

        }
    });

});
