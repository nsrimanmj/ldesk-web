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
	"app/widgets/viewReport",
	"app/widgets/createReport",
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
	"app/widgets/createDashboard",
	"dojo/text!app/widgets/templates/dashboard.html",
	"dojo/domReady!"
], function (declare, parser, aspect, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, ContentPane, BorderContainer, Tree, ObjectStoreModel,
	Memory, StoreMemory, Observable, lang, domStyle, on, Dialog, TitleGroup, TitlePane, StatusStore, ViewReport, CreateReport, OnDemandGrid, Selection, Selector, DijitRegistry, ColumnResizer,
	ColumnReorder, ColumnHider, Keyboard, SummaryRow, Button, topic, CreateDashboard, template) { // jshint ignore:line

	var widget = null;

	return declare([BorderContainer, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			this.ctrl = this.lingoController;
			var widget = this;
			this.agentId = JSON.parse(window.localStorage.getItem("agentId"));
			this.folderList = new Memory({
				data: [
					{ id: 'root', name: 'Folder List', type: 'root' },
					{ id: 'CreatedByMe', name: 'Created By Me', type: 'group', parent: 'root' },
					{ id: 'Private', name: 'Private', type: 'group', parent: 'root' },
					{ id: 'Public', name: 'Public', type: 'group', parent: 'root' }
				],
				getChildren: function (object) {
					return this.query({ parent: object.id });
				}
			});

			this.folderStore = Observable(new StoreMemory({
				data: []
			}));

			this.dashStore = Observable(new StoreMemory({
				data: []
			}));

			aspect.around(widget.folderList, "put", function (originalPut) {
				return function (obj, options) {
					if (options && options.parent) {
						obj.parent = options.parent.id;
					}
					return originalPut.call(widget.folderList, obj, options);
				}
			});

			this.folderGroupList = new Memory({
				data: [
					{ id: 'Private', name: 'Private' },
					{ id: 'Public', name: 'Public' }
				]
			});

			var groups = JSON.parse(window.localStorage.getItem("groups"));

			for (var group in groups) {
				if (group.includes('Admin')) continue;
				this.folderGroupList.put({ id: group, name: group });
				this.folderList.put({ id: group, name: group, type: 'group', parent: 'root', groupName: group });
			}

			this.ctrl.folderGroupList = dojo.clone(this.folderGroupList);
			// Create the model
			this.folderList = new Observable(this.folderList);
			this.folderModel = new ObjectStoreModel({
				store: this.folderList,
				query: { id: 'root' },
				getLabel: function (item) {
					var name = item.name;
					if (item.dashCount > 0) {
						name = "<b>" + name + " (" + item.dashCount + ") <b>";
					}
					return name;
				}
			});
			this.handle = topic.subscribe("/lingoController/folderLoaded", function (data) {
				widget.setFolderList(data);
			});

			this.handle1 = topic.subscribe("/lingoController/dashboardUpdated", function (data) {
				widget.getFolderList();
			});

		},
		getDashboardList: function (req) {
			var widget = this;
			var callback = function (obj) {
				domStyle.set(widget.dashDetailsPane.domNode, "display", "block");
				domStyle.set(widget.folderDetailsPane.domNode, "display", "none");
				widget.dashStore.setData(obj.data);
				widget.dashGrid.refresh();
				widget.dashGrid.resize();
				if (req.hasOwnProperty('createdBy')) {
					widget.dashDetailsPane.set("title", "<b>Dashboard <i>Created By Me (" + obj.data.length + ")</i></b>");
					var folder = widget.folderList.get('CreatedByMe');
					folder.dashCount = obj.data.length;
					widget.folderList.put(folder);
				}
			}

			this.ctrl.getAPI("dashboardList", req, callback);
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.folderGrid.resize();
			this.dashGrid.resize();

		},
		init: function () {
			this.folderStore.setData([]);
			this.folderGrid.refresh();
			if (!this.loaded) {
				this.getFolderList();
			}
		},
		renderFolderActions: function (data, value, cell) {
			var widget = this;

			var div = cell.appendChild(document.createElement("div"));
			var w = new Button({
				label: "Edit",
				showLabel: false,
				iconClass: 'dijitIconEdit',
				onClick: function () {
					widget.showSaveFolderDlg(data);
				}
			}).placeAt(div);

			w._destroyOnRemove = true;
			return
		},
		renderDashActions: function (data, value, cell) {
			var widget = this;

			var div = cell.appendChild(document.createElement("div"));
			var w = new Button({
				label: "Edit",
				showLabel: false,
				iconClass: 'dijitIconEdit',
				onClick: function () {
					widget.showCreateDashboard(data, true);
				}
			}).placeAt(div);

			w._destroyOnRemove = true;
			return
		},
		renderDashId: function (data, value, cell) {
			if (!value) {
				return;
			}

			var dashId = this.formatId(value);
			var widget = this;
			var div = cell.appendChild(document.createElement("div"));
			var linkNode = dojo.create("a", { href: "javascript:void(null);", title: dashId, innerHTML: dashId }, div);

			on(linkNode, "click", lang.hitch(this, function () {
				widget.viewDashboardDetails({ id: value }, widget.ctrl);
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
				model: this.folderModel,
				showRoot: false,
				autoExpand: true,
				onClick: function (item) {
					widget.onFolderSelect(item);
				},
				_createTreeNode: function (args) {
					return new MyTreeNode(args);
				}
			});
			this.tree.placeAt(this.folderTreeDiv);
			this.tree.startup();

			widget.searchBtn.set("disabled", true);
			on(widget.searchInput, "keyup", function () {
				if (widget.searchInput.get("value").trim() !== "") {
					widget.searchBtn.set("disabled", false);
				} else {
					widget.searchBtn.set("disabled", true);
				}
			});

			on(this.createFolderBtn, "click", function () {
				widget.showSaveFolderDlg();
			});

			on(this.createDashBtn, "click", function () {
				widget.showCreateDashboard();
			});

			on(this.cancelFolderBtn, "click", function () {
				widget.saveFolderDlg.hide();
			});

			on(this.submitFolderBtn, "click", function () {
				widget.saveFolder();
			});

			on(this.searchBtn, "click", function () {
				widget.searchDashboard();
			});
			on(widget.searchInput, "keyPress", lang.hitch(this, function (event) {
				if (widget.searchInput.get("value").trim() !== "") {
					if (event.keyCode == 13) {
						widget.searchDashboard();
					}
				}
			}));

			this.folderGroup.set("store", this.folderGroupList);
			this.folderGroup.set("value", "Private");

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow, Selector]);

			var folderLayout = [
				{ label: "Id", field: "id", width: 30 },
				{ label: "Folder Name", field: "name", width: 60 },
				{ label: "groupName", field: "groupName", width: 40 },
				{ label: "Create Date", field: "createdDate", width: 60, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Created By", field: "createdUser", width: 60 },
				{ label: "Modified Date", field: "modifiedDate", width: 60, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Modified By", field: "modifiedUser", width: 60 },
				{ label: "No of Dashboards", field: "dashCount", width: 30 }
			];

			widget.folderGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Folders Found!!",
				collection: widget.folderStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: folderLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowSelectAll: true,
				height: "100%",
				allowTextSelection: true
			}, widget.folderGridDiv);

			var dashLayout = [
				{ label: "Dashboard Number", field: "id", width: 30, renderCell: lang.hitch(this, this.renderDashId) },
				{ label: "Dashboard Name", field: "name", width: 60 },
				{ label: "Folder Name", field: "folderName", width: 40 },
				{ label: "Create Date", field: "createdDate", width: 60, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Created By", field: "createdUser", width: 60 },
				{ label: "Modified Date", field: "modifiedDate", width: 60, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Modified By", field: "modifiedUser", width: 60 }
			];

			widget.dashGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Dashboard Found!!",
				collection: widget.dashStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: dashLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowSelectAll: true,
				allowTextSelection: true
			}, widget.dashGridDiv);

			domStyle.set(this.folderDetailsPane.domNode, "display", "none");

			var height = screen.height - 380;
			domStyle.set(this.dashGridDiv, "height", height + "px");
			domStyle.set(this.folderGridDiv, "height", height + "px");
		},
		onFolderSelect: function (folder) {
			var widget = this;

			this.currentFolder = folder;

			if (folder.id == 'CreatedByMe') {
				this.getDashboardList({ 'createdBy': this.agentId })
				this.dashDetailsPane.set("title", "<b>Reports <i>Created By Me</i></b>");
				return;
			}

			if (folder.type == 'group') {
				var data = this.folderData.filter(function (item) {
					if (item.groupName != folder.name) {
						return false;
					}

					if (folder.name == "Private" && item.createdBy != widget.agentId) {
						return false;
					}

					return true;
				});

				widget.folderStore.setData(data);
				widget.folderGrid.refresh();
				domStyle.set(this.dashDetailsPane.domNode, "display", "none");
				domStyle.set(this.folderDetailsPane.domNode, "display", "block");
				widget.folderGrid.resize();
			} else {
				this.dashDetailsPane.set("title", "<b>Dashboards in Folder: <i>" + folder.name + "</i></b>");
				widget.getDashboardList({ folderId: folder.id });
			}
		},
		getFolderList: function () {
			this.ctrl.getFolderList();
		},
		setFolderList: function (folderList) {
			var widget = this;

			widget.folderData = folderList;
			this.loaded = true;

			folderList.forEach(function (item) {
				if (widget.folderGroupList.get(item.groupName)) {
					if (item.groupName == "Private" && item.createdBy != widget.agentId) {
						return;
					}
					widget.folderList.put({ id: item.id, name: item.name, type: 'folder', parent: item.groupName, dashCount: item.dashCount, groupName: item.groupName });
					if (widget.currentFolder && item.name == widget.currentFolder.name) {
						widget.currentFolder = item;
					}
				}
			})
			var folder = this.currentFolder;
			if (!folder) {
				widget.tree.set('paths', [['root', 'CreatedByMe']]);
				widget.onFolderSelect({ id: "CreatedByMe", name: "Created By Me", type: "group" });
			} else {
				widget.tree.set('paths', [['root', folder.groupName, folder.id]]);
				widget.onFolderSelect(folder);
			}
		},
		showSaveFolderDlg: function (folder) {

			if (folder) {
				this.folderSaveAction = "edit";
				this.saveFolderId = folder.id;
				this.saveFolderDlg.set("title", "Edit: " + folder.name)
				this.folderGroup.set("value", folder.groupName);
				this.folderName.set("value", folder.name);
			} else {
				this.folderSaveAction = "create";
				this.saveFolderForm.reset();
				this.folderGroup.set("value", "Private");
				this.saveFolderDlg.set("title", "Create New Folder")
			}
			this.saveFolderDlg.show();

		},
		showCreateDashboard: function (data, isUpdate) {
			var widget = this;
			if (!data) {
				data = {
					id: 'new',
					groupName: this.currentFolder.groupName,
					folderId: this.currentFolder.id
				};
			}

			var createView = new CreateDashboard({
				'ctrl': widget.ctrl,
				'data': data
			});

			//this.reportPane.addChild(createView);
		},
		saveFolder: function () {
			widget = this;
			if (!this.saveFolderForm.validate()) {
				return
			};

			var groupName = this.folderGroup.get("value");
			var folderName = this.folderName.get("value");

			var request = {
				"groupName": groupName,
				"name": folderName,
				"modifiedBy": widget.agentId
			}

			if (this.folderSaveAction == "create") {
				request.createdBy = widget.agentId;
			} else {
				request.id = widget.saveFolderId;
			}

			var callback = function (obj) {
				widget.currentFolder = request;
				widget.ctrl.showSuccessMessage(obj);
				widget.getFolderList();
				widget.saveFolderDlg.hide();
			}

			if (this.folderSaveAction == "create") {
				this.ctrl.postAPI("folder", request, callback);
			} else {
				this.ctrl.putAPI("folder", request, callback);
			}

		},
		searchDashboard: function () {
			var name = this.searchInput.get("value");
			this.dashDetailsPane.set("title", "<b>Dashboard Search: <i>" + name + "</i></b>");
			this.getDashboardList({ name: name });

		},
		destroy: function () {
			this.saveFolderDlg.destroyRecursive(false);
			this.inherited(arguments);
			if (this.handle) {
				this.handle.remove();
			}

			if (this.handle1) {
				this.handle1.remove();
			}
		}
	});

});
