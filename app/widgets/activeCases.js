define([
	"dojo/_base/declare",
	"dojo/parser",
	"dojo/aspect",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/registry",
	"dijit/layout/ContentPane",
	"dijit/layout/BorderContainer",
	"dijit/Tree",
	"dijit/tree/ObjectStoreModel",
	"dojo/store/Memory",
	"dstore/Memory",
	"dojo/store/Observable",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dijit/Dialog",
	"dojox/widget/TitleGroup",
	"dijit/TitlePane",
	"app/model/Status",
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
	"app/widgets/bulkEdit",
	"dojo/text!app/widgets/templates/active_cases.html",
	"dojo/domReady!"
], function (declare, parser, aspect, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, ContentPane, BorderContainer, Tree, ObjectStoreModel,
	Memory, StoreMemory, Observable, lang, domStyle, on, Dialog, TitleGroup, TitlePane, StatusStore, OnDemandGrid, Selection, Selector, DijitRegistry, ColumnResizer,
	ColumnReorder, ColumnHider, Keyboard, SummaryRow, Button, topic, BulkEdit, template) { // jshint ignore:line

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
					{ id: 'unassigned', name: 'Unassigned', type: 'group', parent: 'root' },
					{ id: 'unworked', name: 'Unworked', type: 'group', parent: 'root' },
					{ id: 'awaiting', name: 'Awaiting Lingo', type: 'group', parent: 'root' }
				],
				getChildren: function (object) {
					return this.query({ parent: object.id });
				}
			});


			this.agentStore = this.ctrl.getAgentStore();

			this.activeCaseStore = Observable(new Memory({
				data: [],
				idProperty: "caseId"
			}));

			this.caseStore = Observable(new StoreMemory({
				data: [],
				idProperty: "caseId"
			}));

			aspect.around(widget.queueList, "put", function (originalPut) {
				return function (obj, options) {
					if (options && options.parent) {
						obj.parent = options.parent.id;
					}
					return originalPut.call(widget.queueList, obj, options);
				}
			});

			// Create the model
			this.queueList = new Observable(this.queueList);
			this.groups = JSON.parse(window.localStorage.getItem("groups"));
			this.userQueueList = [];
			this.queueModel = new ObjectStoreModel({
				store: this.queueList,
				query: { id: 'root' },
				getLabel: function (item) {
					var name = item.name;
					if (item.caseCount > 0) {
						name = "<b>" + name + " (" + item.caseCount + ") <b>";
					}

					if (item.type == "group") {
						if (widget.groups.hasOwnProperty(item.name)) {
							name = "<font color=\"green\">" + name + "</font>";
						}
					}

					if (item.type == "queue") {
						var queue = widget.userQueueList.find(queue => { return queue.queueName == item.name });

						if (queue) {
							name = "<font color=\"green\">" + name + "</font>";
						}
					}

					if (item.id == "unassigned") {
						name = "<font color=\"red\">" + name + "</font>";
					}
					return name;
				}
			});

			this.handle = topic.subscribe("/lingoController/activeCaseLoaded", function (data) {
				widget.setFolderList(data);
			});
			this.getUserQueueList();
		},
		init: function () {
			const widget = this;
			const groups = JSON.parse(window.localStorage.getItem("groups") || "{}");
			const queues = widget.ctrl.availableQueues || [];

			Object.keys(groups).forEach(function (groupName) {
				const group = widget.ctrl.getGroupByName(groupName);

				if (!group || (group.groupName && group.groupName.includes('Admin'))) return;

				widget.queueList.put({
					id: "group-" + group.groupID,
					name: group.groupName,
					type: "group",
					parent: "root",
					groupId: group.groupID,
					groupName: group.groupName
				});
			});

			queues.forEach(function (queue) {

				const group = widget.ctrl.getGroupById(queue.groupId);
				const groupName = group && group.groupName || "None";

				widget.queueList.put({
					id: "queue-" + queue.queueID,
					name: queue.queueName,
					type: "queue",
					parent: "group-" + queue.groupId,
					queueId: queue.queueID,
					groupId: queue.groupId,
					groupName: groupName
				});
			});

			if (!widget.queueLoaded) {
				widget.getUserQueueList();
			}
			widget.getActiveCases();
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
		getActiveCases: function () {
			var widget = this;
			var callback = function (obj) {
				widget.activeCaseStore.setData(obj.data);
				widget.setCaseCount();

				var folder = widget.selectedFolder;
				if (!folder) {
					widget.tree.set('paths', [['root', 'assigned']]);
					widget.onFolderSelect({ id: "assigned", name: "Assigned To Me", type: "group" });
				} else {
					widget.tree.set('paths', [['root', folder.groupName, folder.id]]);
					widget.onFolderSelect(folder);
				}

				if (widget.bulkEditWidget) {
					widget.bulkEditWidget.updateStore(widget.caseStore.data);
				}
			}
			this.ctrl.getAPI("activeCases", null, callback);
		},
		getCaseList: function (item) {
			var widget = this;

			if (item.id == "assigned") {
				widget.caseStore.setData(widget.activeCaseStore.query({ ownerId: widget.agentId }));
				widget.caseListPane.set("title", "<b>Cases <i>Assigned to Me (" + widget.caseStore.data.length + ")</i></b>");
			} else if (item.id == "unassigned") {
				widget.caseStore.setData(widget.activeCaseStore.query({ ownerId: 0 }));
				widget.caseListPane.set("title", "<b>Unassigned Cases <i>(" + widget.caseStore.data.length + ")</i></b>");
			} else if (item.id == "unworked") {
				widget.caseStore.setData(widget.activeCaseStore.query(function (item) { return item.status == "New" || item.status == "Acknowledged" }));
				widget.caseListPane.set("title", "<b>Unworked Cases <i>(" + widget.caseStore.data.length + ")</i></b>");
			} else if (item.id == "awaiting") {
				widget.caseStore.setData(widget.activeCaseStore.query({ subStatus: "Awaiting Lingo Response" }));
				widget.caseListPane.set("title", "<b>Awaiting Lingo Response Cases <i>(" + widget.caseStore.data.length + ")</i></b>");
			} else if (item.type == "group") {
				widget.caseStore.setData(widget.activeCaseStore.query({ groupId: item.groupId }));
				widget.caseListPane.set("title", "<b>Cases in Group: <i>" + item.name + " (" + widget.caseStore.data.length + ")</i ></b > ");
			} else {
				widget.caseStore.setData(widget.activeCaseStore.query({ queueId: item.queueId }));
				widget.caseListPane.set("title", "<b>Cases in Queue: <i>" + item.name + " (" + widget.caseStore.data.length + ")</i ></b > ");
			}

			widget.caseGrid.refresh();
			widget.caseGrid.resize();
		},
		setCaseCount: function () {
			var widget = this;

			this.queueList.query().forEach(function (item) {

				var data = [];
				if (item.id == "assigned") {
					data = widget.activeCaseStore.query({ ownerId: widget.agentId });
				} else if (item.id == "unassigned") {
					data = widget.activeCaseStore.query({ ownerId: 0 });
				} else if (item.id == "unworked") {
					data = widget.activeCaseStore.query(function (item) { return item.status == "New" || item.status == "Acknowledged" });
				} else if (item.id == "awaiting") {
					data = widget.activeCaseStore.query({ subStatus: "Awaiting Lingo Response" });
				} else if (item.type == "group") {
					data = widget.activeCaseStore.query({ groupId: item.groupId });
				} else if (item.type == "queue") {
					data = widget.activeCaseStore.query({ queueId: item.queueId });
				}

				if (data.length > 0) {
					item.caseCount = data.length;
				}

				widget.queueList.put(item);

			});
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.caseGrid.resize();
		},
		renderAccountId: function (data, value, cell) {
			if (!value) {
				return;
			}
			var widget = this;

			var div = cell.appendChild(document.createElement("div"));
			if (value != 0) {
				var linkNode = dojo.create("a", { href: "javascript:void(null);", title: value, innerHTML: value }, div);

				on(linkNode, "click", lang.hitch(this, function () {
					this.viewAccountDetails(value, widget.ctrl);
				}));
			} else {
				dojo.create('span', {
					innerHTML: value, style: 'color: blue'
				}, div);
			}
			return;
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
		renderAgentName: function (data, value, cell) {
			var widget = this;
			var agentData = widget.agentStore.getStore();
			var data1 = agentData.data.filter(dataRow => { return dataRow.userId == value });
			var agentName = value;
			if (data1.length > 0) {
				agentName = data1[0].fullName;
			} else {
				agentName = "";
			}
			var div = cell.appendChild(document.createElement("div"));
			dojo.create("label", {
				innerHTML: agentName
				//style: "padding-top:5px;padding-bottom:5px;text-align: center"
			}, div);

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
			this.tree.placeAt(this.queueTreeDiv);
			this.tree.startup();

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow, Selector]);

			var caseLayout = [
				{ label: "Create Date", field: "createdDate", width: 130, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Case Number", field: "caseId", width: 90, renderCell: lang.hitch(this, this.renderCaseId) },
				{ label: "Case Type", field: "groupName", width: 80 },
				{ label: "App Id", field: "accountId", width: 90, renderCell: lang.hitch(this, this.renderAccountId) },
				{ label: "Contact Name", field: "contactName", width: 150 },
				{ label: "Contact Email", field: "contactEmail", width: 160 },
				{ label: "Status", field: "status", width: 90 },
				{ label: "Category", field: "categoryName", width: 120 },
				{ label: "Type", field: "type", width: 120, hidden: true },
				{ label: "Sub Type", field: "subType", width: 100, hidden: true },
				{ label: "Queue", field: "queueName", width: 100 },
				{ label: "Account Name", field: "accountName", width: 150 },
				{ label: "Service Number", field: "serviceNumber", width: 90 },
				{ label: "Service Priority", field: "servicePriority", width: 90, hidden: true },
				{ label: "Sub Status", field: "subStatus", width: 120 },
				{ label: "Provider", field: "provider", width: 60, hidden: true },
				{ label: "Submitted By", field: "createdBy", width: 120, renderCell: lang.hitch(this, this.renderAgentName) },
				{ label: "Assignee", field: "ownerName", width: 120 },
				{ label: "FollowUp Date", field: "followUpDate", width: 120, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Last Modified Date", field: "modifiedDate", width: 120, formatter: lang.hitch(this, this.dateFormatter) }
			];

			widget.caseGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Case Found!!",
				collection: widget.caseStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: caseLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowSelectAll: true,
				allowTextSelection: true,
				height: "100%"
			}, widget.caseGridDiv);

			var height = screen.height - 380;
			domStyle.set(this.caseGridDiv, "height", height + "px")

			on(widget.reloadBtn, "click", function () {
				widget.getActiveCases();
			})

			on(widget.bulkEditBtn, "click", function () {
				widget.bulkEditWidget = new BulkEdit({
					ctrl: widget.ctrl,
					data: widget.caseStore,
					groupName: widget.selectedFolder.name,
					groupId: widget.selectedFolder.groupId,
					onBulkEdit: function () {
						widget.getActiveCases();
					},
					onClose: lang.hitch(this, function () {
						// Called when child dialog closes
						widget.bulkEditWidget.destroyRecursive(); // destroy the widget
						widget.bulkEditWidget = null; // clear reference
					})
				});
			})

		},
		onFolderSelect: function (folder) {
			this.selectedFolder = folder;
			this.getCaseList(folder);
			const recordType = folder.groupName || "None";
			const isAllowed = this.isActionAllowed("case-bulk-edit", recordType);
			domStyle.set(this.bulkEditBtn.domNode, "display", isAllowed ? "block" : "none");

		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
