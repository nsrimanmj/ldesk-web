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
	"dojo/text!app/widgets/templates/active_work_orders.html",
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
					{ id: 'unassigned', name: 'Unassigned', type: 'group', parent: 'root' },
					{ id: 'Pending Manual Billing', name: 'Pending Manual Billing', type: 'billing', parent: 'root' }
				],
				getChildren: function (object) {
					return this.query({ parent: object.id });
				}
			});

			this.activeWoStore = Observable(new Memory({
				data: [],
				idProperty: "id"
			}));

			this.woStore = Observable(new StoreMemory({
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
					if (item.woCount > 0) {
						name = "<b>" + name + " (" + item.woCount + ") <b>";
					}

					if (item.id == "unassigned") {
						name = "<font color=\"red\">" + name + "</font>";
					}
					if (item.type == "wotype") {
						name = "<font color=\"green\">" + name + "</font>";
					}
					if (item.type == "billing") {
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
			widget.getWorkOrders();
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
		getWorkOrders: function () {
			var widget = this;
			var callback = function (obj) {
				widget.activeWoStore.setData(obj.data);
				widget.setWoCount(obj.data);

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
			this.ctrl.getAPI("getWorkOrders", req, callback)
		},
		getWoList: function (item) {
			var widget = this;

			if (item.id == "assigned") {
				widget.woStore.setData(widget.activeWoStore.query({ ownerId: widget.agentId }));
				widget.woListPane.set("title", "<b>Cases <i>Assigned to Me (" + widget.woStore.data.length + ")</i></b>");
			} else if (item.id == "unassigned") {
				widget.woStore.setData(widget.activeWoStore.query({ ownerId: 0 }));
				widget.woListPane.set("title", "<b>Unassigned Work Orders <i>(" + widget.woStore.data.length + ")</i></b>");
			} else if (item.type == "wotype") {
				widget.woStore.setData(widget.activeWoStore.query({ workOrderTypeId: item.typeId }));
				widget.woListPane.set("title", "<b>Work Orders in: <i>" + item.name + " (" + widget.woStore.data.length + ")</i ></b > ");
			} else if (item.type == "queue") {
				widget.woStore.setData(widget.activeWoStore.query({ queueId: item.queueId, workOrderTypeId: item.typeid }));
				widget.woListPane.set("title", "<b>Work Orders in: <i>" + "<b>" + item.name + "<b>" + " (" + widget.woStore.data.length + ")</i ></b > ");
			} else if (item.type == "billing") {
				widget.woStore.setData(widget.activeWoStore.query({ subStatus: "Pending Manual Billing" }));
				widget.woListPane.set("title", "<b>Work Orders in: <i>" + "<b>" + item.name + "<b>" + " (" + widget.woStore.data.length + ")</i ></b > ");
			}

			widget.woGrid.refresh();
			widget.woGrid.resize();
		},
		setWoCount: function (data) {
			var widget = this;

			data.forEach(function (record) {
				var obj = {};
				obj.name = record.workOrderType;
				obj.id = record.workOrderTypeId;
				obj.type = 'group';
				obj.parent = 'root';
				if (!widget.queueList.get(obj.id)) {
					widget.queueList.put({ id: "workOrderType" + obj.id, name: record.workOrderType, type: 'wotype', typeId: obj.id, parent: 'root' });
					if (record.queueId != null && record.queueId != 0)
						widget.queueList.put({ id: "queue-" + record.queueId + obj.id, name: record.queueName, type: 'queue', parent: 'workOrderType' + obj.id, typeid: obj.id, queueId: record.queueId });
					//widget.queueList.put(obj);
				}
			});

			this.queueList.query().forEach(function (item) {
				if (item.id == "assigned") {
					data = widget.activeWoStore.query({ ownerId: widget.agentId });
				} else if (item.id == "unassigned") {
					data = widget.activeWoStore.query({ ownerId: 0 });
				} else if (item.type == "wotype") {
					data = widget.activeWoStore.query({ workOrderTypeId: item.typeId });
				} else if (item.type == "queue") {
					data = widget.activeWoStore.query({ queueId: item.queueId, workOrderTypeId: item.typeid });
				} else if (item.type == "billing") {
					data = widget.activeWoStore.query({ subStatus: "Pending Manual Billing" });
				}

				if (data.length > 0) {
					item.woCount = data.length;
				}

				widget.queueList.put(item);

			});
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
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
		renderWoId: function (data, value, cell) {
			if (!value) {
				return;
			}
			var woId = value;
			var woNumber = data.workOrderNo;
			var widget = this;
			var div = cell.appendChild(document.createElement("div"));
			var linkNode = dojo.create("a", { href: "javascript:void(null);", title: woNumber, innerHTML: woNumber }, div);

			on(linkNode, "click", lang.hitch(this, function () {
				var callback = function (obj) {
					widget.viewWODetails(woNumber, widget.ctrl, obj.data);
				}
				widget.ctrl.getWorkOrderDetails(value, callback);
			}));

			return;
		},
		formatDispatchDate: function (value, data) {
			if (data.workOrderType == "Repair Field Nation Dispatch") {
				return this.dateFormatter(data.dispatchStart)
			} else {
				return this.dateFormatter(data.dispatchDate)
			}
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
			this.tree.placeAt(this.woTreeDiv);
			this.tree.startup();

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow, Selector]);

			var woLayout = [
				{ label: "Created Date", field: "createdOn", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Work Order Number", field: "id", width: 90, renderCell: lang.hitch(this, this.renderWoId) },
				{ label: "External Ticket Number", field: "externalTktNum", width: 60 },
				{ label: "Case Number", field: "caseNumber", width: 60, renderCell: lang.hitch(this, this.renderCaseId) },
				{ label: "Record Type", field: "workOrderType", width: 120 },
				{ label: "Dispatch Type", field: "dispatchType", width: 150 },
				{ label: "Status", field: "status", width: 60 },
				{ label: "Sub Status", field: "subStatus", width: 60 },
				{ label: "Dispatch Date/ETR", field: "dispatchDate", width: 90, formatter: lang.hitch(this, this.formatDispatchDate) },
				{ label: "Created By", field: "createdUser", width: 80 },
				{ label: "Owner", field: "ownerName", width: 80 },
				{ label: "Billing System", field: "billingSystem", width: 80 },
				{ label: "Modified Date", field: "modifiedOn", width: 90, formatter: lang.hitch(this, this.dateFormatter) }
			];

			widget.woGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Work Order Found!!",
				collection: widget.woStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: woLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowSelectAll: true,
				allowTextSelection: true,
				height: "100%"
			}, widget.woGridDiv);

			var height = screen.height - 380;
			domStyle.set(this.woGridDiv, "height", height + "px")

			on(widget.reloadBtn, "click", function () {
				widget.getWorkOrders();
			});

		},
		onFolderSelect: function (folder) {
			var widget = this;
			this.selectedFolder = folder;
			this.getWoList(folder);
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
