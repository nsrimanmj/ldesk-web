define([
    "dojo/_base/declare",
    "dojo/parser",
    "dojo/aspect",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/registry",
    "dijit/layout/ContentPane",
    "dojo/store/Memory",
    "dstore/Memory",
    "dojo/store/Observable",
    "dojo/_base/lang",
    "dojo/dom-style",
    "dojo/on",
    "dijit/Dialog",
    "dojox/widget/TitleGroup",
    "dijit/TitlePane",
    "dgrid/OnDemandGrid",
    "dgrid/Selection",
    "dgrid/Selector",
    "dgrid/extensions/DijitRegistry",
    "dgrid/extensions/ColumnResizer",
    "dgrid/extensions/ColumnReorder",
    "dgrid/extensions/ColumnHider",
    "dgrid/Keyboard",
    "app/view/summaryRow",
    "dijit/form/Button",
    "dojo/topic",
    "dijit/layout/BorderContainer",
    "dijit/Tree",
    "dijit/tree/ObjectStoreModel",
    "dojo/text!app/widgets/templates/active_tasks.html",
    "dojo/domReady!"
], function (declare, parser, aspect, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, ContentPane,
    Memory, StoreMemory, Observable, lang, domStyle, on, Dialog, TitleGroup, TitlePane, OnDemandGrid, Selection, Selector, DijitRegistry, ColumnResizer,
    ColumnReorder, ColumnHider, Keyboard, SummaryRow, Button, topic, BorderContainer, Tree, ObjectStoreModel, template) { // jshint ignore:line

    var widget = null;

    return declare([BorderContainer, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
        templateString: template,
        widgetsInTemplate: true,
        constructor: function (args) {
            lang.mixin(this, args);
            this.ctrl = this.lingoController;
            var widget = this;
            this.agentId = JSON.parse(window.localStorage.getItem("agentId"));
            this.queueList = new Memory({
                data: [
                    { id: 'root', name: 'Folder List', type: 'root' },
                    { id: 'assigned', name: 'Assigned To Me', type: 'group', parent: 'root' },
                    { id: 'unassigned', name: 'Unassigned', type: 'group', parent: 'root' }
                ],
                getChildren: function (object) {
                    return this.query({ parent: object.id });
                }
            });

            this.activeTaskStore = Observable(new Memory({
                data: [],
                idProperty: "id"
            }));

            this.taskStore = Observable(new StoreMemory({
                data: [],
                idProperty: "id"
            }));

            aspect.around(widget.queueList, "put", function (originalPut) {
                return function (obj, options) {
                    if (options && options.parent) {
                        obj.parent = options.parent.id;
                    }
                    return originalPut.call(widget.queueList, obj, options);
                }
            });

            this.queueList = new Observable(this.queueList);
            this.queueModel = new ObjectStoreModel({
                store: this.queueList,
                query: { id: 'root' },
                getLabel: function (item) {
                    var name = item.name;
                    if (item.taskCount > 0) {
                        name = "<b>" + name + " (" + item.taskCount + ") <b>";
                    }

                    if (item.id == "unassigned") {
                        name = "<font color=\"red\">" + name + "</font>";
                    }
                    if (item.type == "group") {
                        name = "<font color=\"green\">" + name + "</font>";
                    }
                    if (item.type == "queue") {
                        var queue = widget.userQueueList.find(queue => { return queue.queueName == item.name });

                        if (queue) {
                            name = "<font color=\"green\">" + name + "</font>";
                        }
                    }
                    return name;
                }
            });
            this.getUserQueueList();
        },
        init: function () {
            var widget = this;
            widget.getTasks();
        },

        buildRendering: function () {
            this.inherited(arguments);
        },
        resize: function () {
            this.inherited(arguments);
        },
        getTasks: function () {
            var widget = this;
            var callback = function (obj) {
                widget.activeTaskStore.setData(obj.data);
                widget.setTaskCount(obj.data);
                var folder = widget.selectedFolder;
                if (!folder) {
                    widget.tree.set('paths', [['root', 'assigned']]);
                    widget.onFolderSelect({ id: "assigned", name: "Assigned To Me", type: "group" });
                } else {
                    widget.tree.set('paths', [['root', folder.groupName, folder.id]]);
                    widget.onFolderSelect(folder);
                }
            }

            var req = {
                "activeOnly": true
            }
            this.ctrl.getAPI("getCaseTask", req, callback)
        },
        getUserQueueList: function () {

            var widget = this;
            var loginName = window.localStorage.getItem("agent");

            var req = {
                loginName: loginName
            }

            var callback = function (obj) {
                widget.userQueueList = obj.data;
                widget.queueLoaded = true;
            }

            this.ctrl.getAPI("userQueueList", req, callback, false, false)
        },
        setTaskCount: function (data) {
            var widget = this;
            data.forEach(function (record) {
                var obj = {};
                obj.name = record.queueName;
                obj.id = record.queueId;
                obj.type = 'queue';
                obj.parent = 'root';
                if (!widget.queueList.get(obj.id)) {
                    widget.queueList.put({ id: "queue-" + obj.id, name: record.queueName, type: 'queue', typeId: obj.id, parent: 'root' });
                }
            });
            this.queueList.query().forEach(function (item) {
                if (item.id == "assigned") {
                    data = widget.activeTaskStore.query({ ownerId: widget.agentId });
                } else if (item.id == "unassigned") {
                    data = widget.activeTaskStore.query({ ownerId: 0 });
                } else if (item.type == "queue") {
                    data = widget.activeTaskStore.query({ queueId: item.typeId });
                }

                if (data.length > 0) {
                    item.taskCount = data.length;
                }

                widget.queueList.put(item);

            });
        },
        getTaskList: function (item) {
            var widget = this;

            if (item.id == "assigned") {
                widget.taskStore.setData(widget.activeTaskStore.query({ ownerId: widget.agentId }));
                widget.taskListPane.set("title", "<b>Tasks <i>Assigned to Me (" + widget.taskStore.data.length + ")</i></b>");
            } else if (item.id == "unassigned") {
                widget.taskStore.setData(widget.activeTaskStore.query({ ownerId: 0 }));
                widget.taskListPane.set("title", "<b>Unassigned Tasks <i>(" + widget.taskStore.data.length + ")</i></b>");
            } else if (item.type == "queue") {
                widget.taskStore.setData(widget.activeTaskStore.query({ queueId: item.typeId }));
                widget.taskListPane.set("title", "<b>Tasks in: <i>" + "<b>" + item.name + "<b>" + " (" + widget.taskStore.data.length + ")</i ></b > ");
            }

            widget.taskGrid.refresh();
            widget.taskGrid.resize();
        },
        renderCaseId: function (data, value, cell) {
            if (!value) {
                return;
            }

            var caseId = this.formatCaseNumber(value);
            var widget = this;
            var div = cell.appendChild(document.createElement("div"));
            var linkNode = dojo.create("a", { href: "javascript:void(null);", title: caseId, innerHTML: caseId }, div);

            on(linkNode, "click", lang.hitch(this, function () {
                var callback = function (obj) {
                    widget.viewCaseDetails(caseId, widget.ctrl, obj.data);
                }
                widget.ctrl.getCaseDetails(value, callback);
            }));
            return;
        },

        renderTaskId: function (data, value, cell) {
            if (!value || !data) {
                return;
            }
            //console.log(data);
            var widget = this;
            var div = cell.appendChild(document.createElement("div"));
            var linkNode = dojo.create("a", { href: "javascript:void(null);", title: value, innerHTML: value }, div);

            on(linkNode, "click", lang.hitch(this, function () {
                var callback = function (obj) {
                    widget.viewTaskDetails(value, widget.ctrl, obj.data);

                }
                widget.ctrl.getTaskDetails(data.id, callback);
            }));
            return;
        },

        postCreate: function () {
            var widget = this;
            this.inherited(arguments);

            // Custom TreeNode class (based on dijit.TreeNode) that allows rich text labels
            var MyTreeNode = declare(Tree._TreeNode, {
                _setLabelAttr: { node: "labelNode", type: "innerHTML" }
            });

            this.tree = new Tree({
                model: this.queueModel,
                showRoot: false,
                autoExpand: true,
                onClick: function (item) {
                    widget.onFolderSelect(item);
                },
                _createTreeNode: function (args) {
                    return new MyTreeNode(args);
                }
            });
            this.tree.placeAt(this.taskTreeDiv);
            this.tree.startup();

            var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow, Selector]);

            var taskLayout = [
                { label: "Created On", field: "createdDate", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
                { label: "Task Number", field: "taskNumber", width: 110, renderCell: lang.hitch(this, this.renderTaskId) },
                { label: "Case Number", field: "caseId", width: 110, renderCell: lang.hitch(this, this.renderCaseId) },
                { label: "Queue", field: "queueName", width: 80 },
                { label: "Task Category", field: "category", width: 80 },
                { label: "Owner", field: "ownerName", width: 80 },
                { label: "Status", field: "status", width: 70 },
                { label: "Task Description", field: "description", width: 110 },
                { label: "Case Record Type", field: "caseRecordType", width: 80 },
                { label: "Case Sub Type", field: "caseSubType", width: 80 },
                { label: "Case Service Priority", field: "servicePriority", width: 80 },
                { label: "Account Name", field: "accountName", width: 70 }
            ];

            widget.taskGrid = new Grid({
                loadingMessage: "Grid is loading",
                noDataMessage: "No Tasks Found!!",
                collection: widget.taskStore,
                className: 'lingogrid',
                keepScrollPosition: false,
                columns: taskLayout,
                selectionMode: "single",
                rowSelector: '20px',
                allowSelectAll: true,
                allowTextSelection: true,
                height: "100%"
            }, widget.taskGridDiv);

            var height = screen.height - 380;
            domStyle.set(this.taskGridDiv, "height", height + "px")

            on(widget.reloadBtn, "click", function () {
                widget.getTasks();
            });


        },

        onFolderSelect: function (folder) {
            var widget = this;
            this.selectedFolder = folder;
            this.getTaskList(folder);
        },

        destroy: function () {
            this.inherited(arguments);
        }
    });

});
