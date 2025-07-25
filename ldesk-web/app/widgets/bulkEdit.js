define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
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
	"app/widgets/addCaseNote",
	"dojo/text!app/widgets/templates/bulk_edit.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, StoreMemory, Observable, lang, domStyle, on, Dialog, TitleGroup, TitlePane, StatusStore,
	OnDemandGrid, Selection, Selector, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, AddCaseNote, template) { // jshint ignore:line

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			this.ctrl = this.ctrl;
			this.activeCaseStore = this.data;
			const widget = this;
			widget.editStatusStore = new StatusStore();
			this.agentStore = this.ctrl.getAgentStore();

			this.caseStore = Observable(new StoreMemory({
				data: [],
				idProperty: "caseId"
			}));

			this.caseStore.setData(this.activeCaseStore.data);

			this.queueStore = new Memory({
				data: []
			});

			this.statusStore = new Memory({
				data: []
			});

			this.assigneeStore = new Memory({
				data: []
			});

			this._setQueueStore();
			this._setStatusStore();
			this._setAssigneeStore();
		},
		_setQueueStore: function () {
			const widget = this;

			widget.queueStore.add({ 'id': 0, 'name': 'All' });

			const allData = this.activeCaseStore.data;
			allData.sort((a, b) => a.queueName && a.queueName.localeCompare(b.queueName)).forEach(element => {
				const item = {};
				item.id = element.queueId;
				item.name = element.queueName;
				if (item.id && item.name) {
					widget.queueStore.put(item);
				}
			});
		},
		_setStatusStore: function () {
			const widget = this;

			widget.statusStore.add({ 'id': 0, 'name': 'All' });
			widget.statusStore.add({ 'id': "unworked", 'name': 'Unworked' });
			widget.statusStore.add({ 'id': "awaiting", 'name': 'Awaiting Lingo' });

			const allData = this.activeCaseStore.data;
			allData.sort((a, b) => a.status && a.status.localeCompare(b.status)).forEach(element => {
				const item = {};
				item.id = element.status;
				item.name = element.status;
				if (item.id && item.name) {
					widget.statusStore.put(item);
				}
			});
		},
		_setAssigneeStore: function () {
			const widget = this;
			widget.assigneeStore.add({ 'id': 'All', 'name': 'All' });
			widget.assigneeStore.add({ 'id': 0, 'name': 'Unassigned' });

			const allData = this.activeCaseStore.data;
			allData.sort((a, b) => a.ownerName && a.ownerName.localeCompare(b.ownerName)).forEach(element => {
				const item = {};
				item.id = element.ownerId;
				item.name = element.ownerName;
				if (item.id && item.name) {
					widget.assigneeStore.put(item);
				}
			});
		},
		_renderAccountId: function (data, value, cell) {
			if (!value && value !== 0) {
				return;
			}

			const widget = this;
			const div = document.createElement("div");
			cell.appendChild(div);

			if (value !== 0) {
				const linkNode = dojo.create("a", {
					href: "javascript:void(0);",
					title: "View account details: " + value,
					innerHTML: value,
					style: "cursor: pointer; color: blue; text-decoration: underline;"
				}, div);

				on(linkNode, "click", function () {
					widget._closeDlg();
					widget.viewAccountDetails(value, widget.ctrl);
				});
			} else {
				dojo.create("span", {
					innerHTML: value,
					style: "color: blue"
				}, div);
			}

			return;
		},
		_renderCaseId: function (data, value, cell) {
			if (!value) {
				return;
			}

			const widget = this;
			const caseId = this.formatCaseNumber(value);
			const div = document.createElement("div");
			cell.appendChild(div);

			const linkNode = dojo.create("a", {
				href: "javascript:void(0);",
				title: "View case details:  " + caseId,
				innerHTML: caseId,
				style: "cursor: pointer; color: blue; text-decoration: underline;"
			}, div);

			on(linkNode, "click", function () {
				widget.ctrl.getCaseDetails(value, function (obj) {
					widget._closeDlg();
					widget.viewCaseDetails(caseId, widget.ctrl, obj.data);
				});
			});

			return;
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.caseGrid.resize();
		},
		init: function () {

		},
		postCreate: function () {
			const widget = this;
			this.inherited(arguments);

			widget.bulkEditDlg.show();

			on(this.closeBtn, "click", lang.hitch(this, "_closeDlg"));

			this._setupGrid();
			this._setupFilter();
			this._setupUpdateActions();
			this._setupUpdateDlg();
		},
		_closeDlg: function () {
			this.bulkEditDlg.destroyRecursive();
			if (typeof this.onClose === "function") {
				this.onClose(); // Notify parent
			}
			this.destroyRecursive();
		},
		_setupUpdateDlg: function () {

			const widget = this;

			widget.caseStatus.set("store", this.editStatusStore.getEditStatusStore());
			widget.caseAssignee.set("store", this.agentStore.getAgentsByGroup(widget.groupName))

			on(widget.caseStatus, "change", function () {
				const statusId = widget.caseStatus.item.id;
				const store = widget.editStatusStore.getSubStatusStore(statusId);
				if (store.data.length == 0) {
					widget.caseSubStatus.set("value", "");
					widget.caseSubStatus.set("disabled", true);
				} else {
					widget.caseSubStatus.set("disabled", false);
				}
				widget.caseSubStatus.set("store", store);
			});

			on(widget.updateBtn, "click", function () {
				widget._update();
			})
		},
		_setupUpdateActions: function () {
			this.assignBtn.on("click", lang.hitch(this, function () {
				this._openActionDialog("assign");
			}));

			this.statusChangeBtn.on("click", lang.hitch(this, function () {
				this._openActionDialog("statusChange");
			}));

			this.addNoteBtn.on("click", lang.hitch(this, function () {
				this._openActionDialog("addNote");
			}));
		},
		_setupFilter: function () {
			const widget = this;
			widget.queueFilter.set("store", this.queueStore);
			widget.queueFilter.set("value", 0);

			widget.statusFilter.set("store", this.statusStore);
			widget.statusFilter.set("value", 0);

			widget.assigneeFilter.set("store", this.assigneeStore);
			widget.assigneeFilter.set("value", "All");

			on(widget.queueFilter, "change", () => widget._filterGrid());
			on(widget.statusFilter, "change", () => widget._filterGrid());
			on(widget.assigneeFilter, "change", () => widget._filterGrid());
		},
		_setupGrid: function () {
			var widget = this;
			const Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow, Selector]);

			const caseLayout = [
				{ label: "Create Date", field: "createdDate", width: 130, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Case Number", field: "caseId", width: 90, renderCell: lang.hitch(this, this._renderCaseId) },
				{ label: "App Id", field: "accountId", width: 90, renderCell: lang.hitch(this, this._renderAccountId) },
				{ label: "Case Type", field: "groupName", width: 80 },
				{ label: "Queue", field: "queueName", width: 100 },
				{ label: "Status", field: "status", width: 90 },
				{ label: "Sub Status", field: "subStatus", width: 120, hidden: true },
				{ label: "Category", field: "categoryName", width: 120 },
				{ label: "Type", field: "type", width: 120, hidden: true },
				{ label: "Sub Type", field: "subType", width: 100, hidden: true },
				{ label: "Assignee", field: "ownerName", width: 120 },
				{ label: "Last Modified Date", field: "modifiedDate", width: 120, formatter: lang.hitch(this, this.dateFormatter), hidden: true },
				{ id: "select", label: "Select", field: "", width: 30, selector: 'checkbox' }
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

			widget.caseGrid.refresh();
			widget.caseGrid.resize();
			widget.caseGrid.set('summary', "Total Cases: " + widget.caseStore.data.length);

			this.caseGrid.on("dgrid-select", lang.hitch(this, function (event) {
				this._updateCaseListTitle();
			}));

			this.caseGrid.on("dgrid-deselect", lang.hitch(this, function (event) {
				this._updateCaseListTitle();
			}));
		},
		_openActionDialog: function (action) {
			var selectedCount = Object.keys(this.caseGrid.selection).length;
			var label = selectedCount + " Case" + (selectedCount === 1 ? "" : "s") + " Selected";
			this.selCountDiv.innerHTML = label;
			this.bulkAction = action;
			// Update dialog title and show the right pane
			switch (action) {
				case "assign":
					this.actionDialog.set("title", "Bulk Assign Cases");
					this.actionStack.selectChild(this.assignPane);
					break;

				case "statusChange":
					this.actionDialog.set("title", "Bulk Change Status");
					this.actionStack.selectChild(this.statusPane);
					break;

				case "addNote":
					const widget = this;

					const caseList = Object.keys(widget.caseGrid.selection).map(function (caseId) {
						const data = widget.caseStore.getSync(caseId);
						return {
							caseId: data.caseId,
							accountId: data.accountId
						};
					});

					const data = {
						caseList: caseList,
						groupName: this.groupName,
						groupId: this.groupId,
						action: "bulkNotes"
					};

					new AddCaseNote({
						info: data,
						isBulk : true,
						lingoController: this.ctrl,
						onNoteAdded: function (response) {
							//widget._loadGrid(); 
						}
					});

					break;

			}
			this._resetActionDlg();
			this.actionDialog.show();
		},
		_onDialogClose: function () {
			this.actionDialog.hide();
		},
		_updateCaseListTitle: function () {
			var selectedCount = Object.keys(this.caseGrid.selection).length;
			var title = "Case List";
			if (selectedCount > 0) {
				title += " (" + selectedCount + " selected)";
			}
			this.caseGridPane.set("title", title);

			// Enable/disable action buttons
			var enable = selectedCount > 0;
			this.assignBtn.set("disabled", !enable);
			this.statusChangeBtn.set("disabled", !enable);
			this.addNoteBtn.set("disabled", !enable);
		},
		// Function to filter the grid based on selected filters
		_filterGrid: function () {
			const widget = this;
			const queueVal = this.queueFilter.get("value");
			const statusVal = this.statusFilter.get("value");
			const assigneeVal = this.assigneeFilter.get("value");

			let filtered = widget.activeCaseStore.data;

			if (queueVal != 0) {
				filtered = filtered.filter(item => item.queueId == queueVal);
			}

			if (statusVal === "unworked") {
				filtered = filtered.filter(item =>
					item.status === "New" || item.status === "Acknowledged"
				);
			} else if (statusVal === "awaiting") {
				filtered = filtered.filter(item =>
					item.subStatus === "Awaiting Lingo Response"
				);
			} else if (statusVal != 0) {
				filtered = filtered.filter(item => item.status == statusVal);
			}

			if (assigneeVal !== 'All') {
				filtered = filtered.filter(item => item.ownerId == assigneeVal);
			}

			widget.caseStore.setData(filtered);
			widget.caseGrid.refresh();
			widget.caseGrid.set('summary', "Total Cases: " + filtered.length);
		},
		// Function to update the selected cases based on the action
		_update: function () {

			const widget = this;
			const action = this.bulkAction;

			function isFieldValid(field) {
				if (!field || field.get("disabled")) {
					return true;
				}

				if (typeof field.validate === "function") {
					const valid = field.validate();
					if (!valid && typeof field.focus === "function") {
						field.focus();
					}
					return valid;
				}

				return true;
			}

			if (action === "assign" && !isFieldValid(widget.caseAssignee)) return;

			if (action === "statusChange") {
				if (!isFieldValid(widget.caseStatus)) return;
				if (!isFieldValid(widget.caseSubStatus)) return;
			}
			const selectedCases = Object.keys(widget.caseGrid.selection);
			if (selectedCases.length === 0) {
				widget.ctrl.showError("No cases selected.");
				return;
			}

			const statusItem = widget.caseStatus.get("item");
			const statusId = statusItem && statusItem.id;

			const subStatusItem = widget.caseSubStatus.get("item");
			const subStatusId = subStatusItem && subStatusItem.id;

			const payload = {
				caseIds: selectedCases,
				action: action,
				statusId: statusId,
				subStatusId: subStatusId == null ? 0 : subStatusId,
				assigneeId: widget.caseAssignee.get("value") == null ? "0" : widget.caseAssignee.get("value")
			};

			widget.ctrl.postAPI("caseBulkEdit", payload, function (response) {
				widget.actionDialog.hide();
				widget.ctrl.showSuccessMessage(response);
				if (typeof widget.onBulkEdit === "function") {
					widget.onBulkEdit(); // Call the parent's callback
				}
			});

		},
		_resetActionDlg: function () {
			this.caseStatus.set("value", "");
			this.caseSubStatus.set("value", "");
			this.caseAssignee.set("value", "");
		},
		updateStore: function (newData) {
			// Clear and re-populate the store
			this.caseStore.setData(newData);

			// Refresh grid
			if (this.caseGrid) {
				this.caseGrid.refresh();
				this._filterGrid();
			}

		},

		destroy: function () {
			this.inherited(arguments);
		}
	});

});
