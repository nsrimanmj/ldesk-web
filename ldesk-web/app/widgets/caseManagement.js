define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dstore/Memory",
	"dstore/legacy/DstoreAdapter",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dojo/dom",
	"dojox/widget/TitleGroup",
	"dijit/TitlePane",
	"dijit/form/DateTextBox",
	"dijit/registry",
	"app/model/Status",
	"app/model/Origin",
	"app/model/miniStores",
	"app/view/ValidationTextarea",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/Selector",
	"app/view/diaryEditor",
	"dojo/topic",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	'dgrid/CellSelection',
	"app/view/summaryRow",
	"dojo/keys",
	"dijit/ConfirmDialog",
	"dojo/text!app/widgets/templates/case_management.html",
	"dojo/text!app/widgets/templates/equipment_basic_info.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, DstoreAdapter, lang, domStyle, on, dom, TitleGroup, TitlePane, DateTextBox, registry, StatusStore, OriginStore, MiniStores, ValidationTextarea, OnDemandGrid, Selection, Selector, DiaryEditor, topic, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, CellSelection, SummaryRow, keys, ConfirmDialog, template1, template2) { // jshint ignore:line

	var widget = null;
	var updateDescr = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template1,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			widget.loginName = window.localStorage.getItem("agent");
			widget.data = widget.info;
			widget.recordType = widget.info.groupName;
			if (!widget.recordType) {
				widget.recordType = "";
			}
			this.templateToUse = widget.recordType != "Equipment" ? 1 : 2;
			if (widget.data) {
				widget.categoryStore = widget.ctrl.getCategoryStore(widget.data.groupName);
				if (widget.data.categoryName != "DefaultEmail")
					widget.categoryStore.remove("DefaultEmail");
			}
			widget.statusStore = new StatusStore();
			widget.originStore = new OriginStore();
			widget.miniStores = new MiniStores();
			widget.providerStore = widget.ctrl.getProviderStore();
			widget.agentStore = widget.ctrl.getAgentStore();
			widget.availableQueues = new DstoreAdapter(new Memory({
				idProperty: 'queueName',
				data: []
			}));
			widget.accountStore = new Memory({
				idProperty: "accountId",
				data: []
			});
			this.reqLabel = "<req>";
			this.reqLabel1 = "<req>";
			this.reqLabel2 = "<req>";
			if (widget.data.groupName == "Inquiry" || widget.data.groupName == "Equipment") {
				this.reqLabel = "";
			}
			if (widget.data.queueName == 'ARC') {
				this.reqLabel1 = "";
			}
			if (widget.data.groupName == "Network" || widget.data.origin == "Email") {
				this.reqLabel2 = "";
			}
		},
		buildRendering: function () {
			switch (this.templateToUse) {
				case 2:
					this.templateString = template2;
					break;
				case 1:
					this.templateString = template1;
					break;
				default:
					this.templateString = template1;
			};

			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {

		},
		setQueueStore: function (groupId) {
			var widget = this;
			var response = widget.ctrl.availableQueues;
			response.sort(function (a, b) {
				return a.queueName.localeCompare(b.queueName);
			});
			var queueList = [];
			queueList = response.filter(function (response) {
				return response.groupId == groupId;
			});
			widget.availableQueues.store.setData(queueList);
		},
		setServiceNumberStore: function (data) {
			var widget = this;
			if (widget.data.groupName != 'Equipment') {
				widget.serviceNumber.set('store', data);
				widget.serviceNumber.set('value', widget.data.serviceNumber);
			}
		},
		setMasterCaseId: function (data) {
			var widget = this;
			if (data.groupName != "Equipment")
				widget.masterCaseId.set("value", data.masterCaseId);
			if (widget.isActionAllowed("case-remove-network", widget.recordType)) {
				if (data.masterCaseId > 0) {
					domStyle.set(widget.removeNEBtn.domNode, "display", "inline");
				}
			}
		},
		getInfo: function (info) {
			var widget = this;
			info.groupName = widget.data.groupName;
			widget.getWidgetvalues(info, widget.caseManagementFormTable.domNode);
			if (widget.data.groupName != "Equipment") {
				if (info.provider) {
					info.providerId = widget.provider.item.id;
				}

				var masterCaseId = widget.masterCaseId.get("value");
				if (masterCaseId != 0) {
					info.masterCaseId = masterCaseId;
				}

				info.description = widget.descriptionArea.get("value");
				info.summary = widget.summaryArea.get("value");

				if (widget.notify.checked == false)
					info.notify = 0;
				else
					info.notify = 1;
				if (widget.autoReply.checked == false)
					info.autoReply = 0;
				else
					info.autoReply = 1;
				if (widget.followUpDate1.get("displayedValue") && widget.followUpDate1.get("displayedValue") != "") {
					var date1 = widget.followUpDate1.get("displayedValue") + " " + widget.followUpTime1.get("displayedValue");
					var dt = new Date(date1);
					info.followUpDate = widget.formatDate(dt, "YYYY-MM-DD H24:MI:SS");
					console.log(info.followUpDate);
				}
			} else {
				info.serviceNumber = 0;
				if (widget.selectedAccountData)
					info.accountName = widget.selectedAccountData.companyName;
				info.shippingAddress = widget.shippingAddress.get("value");
				info.additionalInfo = widget.addInfo.get("value");
				info.modelSnQty = widget.modelQty.get("value");
				info.eqStatus = widget.eqStatus.get("value");
			}
		},
		populateData: function (data) {
			var widget = this;
			widget.data = data;
			widget.setWidgetValues(data, widget.caseManagementFormTable.domNode);

			widget.accountId.set("value", data.accountId, false);

			widget.status.set("store", this.statusStore.getStatusStore());
			widget.status.set("value", data.status);

			widget.descriptionArea.set("value", data.description);
			widget.subjectArea.set("value", data.subject);

			widget.setQueueStore(data.groupId);
			widget.queueName.set('value', data.queueName);

			widget.categoryName.set("store", widget.ctrl.getCategoryStore(data.groupName));
			widget.categoryName.set('value', data.categoryName);

			if (data.groupName != "Equipment") {
				widget.serviceNumber.set('value', data.serviceNumber);
				widget.summaryArea.set("value", data.summary);
				widget.type.set('value', data.type);
				widget.subType.set('value', data.subType);
				widget.masterCaseId.set("value", data.masterCaseId);
				if (widget.isActionAllowed("case-remove-network", widget.recordType)) {
					if (data.masterCaseId > 0) {
						domStyle.set(widget.removeNEBtn.domNode, "display", "inline");
					}
				}
				widget.servicePriority.set("value", data.servicePriority);

				if (data.provider == "Brightlink") {
					widget.provider.set("displayedValue", data.provider);
				}

				if (data.followUpDate) {
					//followUpDate1 followUpTime1
					var date = new Date(data.followUpDate);
					widget.followUpDate1.set("value", date);
					// Set the time value
					var followUpTime = data.followUpDate.split(' ')[1];
					var timeParts = followUpTime.split(':');
					var time = new Date();
					time.setHours(timeParts[0], timeParts[1], timeParts[2]);
					widget.followUpTime1.set("value", time);
				}
				if (data.notify == 0)
					widget.notify.checked = false;
				else
					widget.notify.checked = true;
				if (data.autoReply == 0)
					widget.autoReply.checked = false;
				else
					widget.autoReply.checked = true;
			} else {
				widget.eqStatus.set("value", data.eqStatus);
				widget.modelQty.set("value", data.modelSnQty);
				widget.addInfo.set("value", data.additionalInfo);
				widget.shippingAddress.set("value", data.shippingAddress);
			}

			//Owner is not displayed in frontend in case of inactive users - So explicitly setting owner name
			if (!widget.ownerId.get('value') && data.ownerName != null) {
				widget.ownerId.set('displayedValue', data.ownerName);
			}


			if (data.categoryName != null && !widget.categoryName.get('value')) {
				widget.categoryName.set('displayedValue', data.categoryName);
			}
			if (widget.data.groupName != "Equipment") {
				if (data.type != null && !widget.type.get('value')) {
					widget.type.set('displayedValue', data.type);
				}

				if (data.subType != null && !widget.subType.get('value')) {
					widget.subType.set('displayedValue', data.subType);
				}
			}

		},
		disableFields: function () {
			var widget = this;
			//Removing DefaultEmail category from store, while editing
			widget.categoryStore = widget.ctrl.getCategoryStore(widget.data.groupName);
			if (widget.data.categoryName != "DefaultEmail")
				widget.categoryStore.remove("DefaultEmail");
			widget.categoryName.set("store", widget.categoryStore);
			//Fields which are NOT editable for any case			
			widget.subjectArea.set("disabled", true);
			widget.groupName.set("disabled", true);
			//Fields which are editable for any case
			widget.showSearchButton.set("disabled", false);
			widget.descriptionArea.set("disabled", false);
			//Fields which are NOT editable/editable for any case except Equipment
			if (widget.data.groupName != "Equipment") {
				//NOT editable
				widget.createdDate.set("disabled", true);
				widget.billingType.set("disabled", true);
				widget.masterCaseId.set("disabled", true);
				widget.escalationLevel.set("disabled", true);
				widget.origin.set("disabled", true);
				//Editable	
				widget.summaryArea.set("disabled", false);
				widget.followUpDate1.set("disabled", false);
				widget.followUpTime1.set("disabled", false);
			}
			//Disabling and enabling fields based on case type
			if (widget.data.groupName == 'Network') {
				widget.showSearchButton.set("disabled", true);
				widget.accountId.set("disabled", true);
				widget.accountId.set("required", false);
				widget.serviceNumber.set("disabled", true);
				widget.serviceNumber.set("required", false);
			} else if (widget.data.groupName == 'Inquiry') {
				widget.accountId.set("required", true);
				widget.serviceNumber.set("required", false);
				widget.serviceNumber.set("disabled", false);
				widget.servicePriority.set("required", false);
				widget.provider.set("required", false);
			} else if (widget.data.groupName == 'Incident') {
				widget.serviceNumber.set("required", true);
				widget.serviceNumber.set("disabled", false);
				widget.accountId.set("required", true);
			} else if (widget.data.groupName == "Equipment") {
				widget.accountId.set("required", true);
				widget.addInfo.set("disabled", false);
				widget.shippingAddress.set("disabled", false);
				widget.modelQty.set("disabled", false);
				widget.eqStatus.set("disabled", false);
			}
		},
		disableAllFields: function () {
			var widget = this;
			this.disableFields();

			widget.disableWidgets(widget.caseManagementFormTable.domNode);

			widget.showSearchButton.set("disabled", true);
			widget.subjectArea.set("disabled", true);
			this.descriptionArea.set("disabled", true);

			if (widget.data.groupName != "Equipment") {
				widget.masterCaseId.set("disabled", true);
				this.followUpDate1.set("disabled", true);
				this.followUpTime1.set("disabled", true);
				this.serviceNumber.set("disabled", true);
				this.summaryArea.set("disabled", true);
			} else {
				widget.addInfo.set("disabled", true);
				widget.shippingAddress.set("disabled", true);
				widget.modelQty.set("disabled", true);
			}
		},
		//remove closed/cancelled status from dropdown
		modifyStatusStore: function () {
			var widget = this;
			var store = this.statusStore.getEditStatusStore();
			widget.status.set("store", store);
		},
		resetFields: function () {
			var widget = this;
			if (widget.data.groupName != "Equipment") {
				widget.summaryArea.reset();
				widget.followUpDate1.reset();
				widget.followUpTime1.reset();
			}
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

		postCreate: function () {
			var widget = this;

			widget.disableAllFields();

			widget.updateFieldVisibility(widget.data.groupName, widget.caseManagementFormTable);

			widget.setQueueStore(widget.data.groupId);
			if (widget.data) {
				widget.categoryName.set("store", widget.categoryStore);
				widget.status.set("store", this.statusStore.getStatusStore());
				widget.ownerId.set("store", widget.agentStore.getAgentsByGroup(widget.data.groupName));
				widget.queueName.set('store', widget.availableQueues);
				if (widget.data.groupName != "Equipment") {
					widget.origin.set("store", widget.originStore.getOriginStore());
					widget.provider.set("store", widget.providerStore);
					widget.escalationLevel.set("store", widget.miniStores.getEscalationLevelStore());
					widget.servicePriority.set('store', widget.miniStores.getServicePriorityStore());
				} else {
					widget.eqStatus.set("store", widget.miniStores.getEquipmentStatus());
				}
				widget.populateData(widget.data);
			}

			//Owner is not displayed in frontend in case of inactive users - So explicitly setting owner name
			if (!widget.ownerId.get('value') && widget.data.ownerName != null) {
				widget.ownerId.set('displayedValue', widget.data.ownerName);
			}


			on(widget.categoryName, "change", function (value) {
				if (widget.data.groupName != "Equipment") {
					widget.type.reset();
					widget.type.set("store", widget.ctrl.getTypeStore(value));
					if (widget.categoryName.disabled == true) {
						widget.type.set("value", widget.data.type);
						widget.type.set('displayedValue', widget.data.type);
					}
					//disable if type has no data and make it required if it has data
					else { //in edit mode
						widget.categoryStore.remove("DefaultEmail");
						if (widget.type.store.data.length == 0) {
							widget.type.set("disabled", true);
							widget.subType.set("disabled", true);
							widget.type.set("required", false);
						} else if (widget.type.store.data.length == 1) {
							widget.type.set("disabled", false);
							widget.type.set("required", true);
							widget.type.set("value", widget.type.store.data[0].name);
						} else {
							widget.type.set("disabled", false);
							widget.type.set("required", true);
						}
					}
				} else {//in edit mode remove DefaultEmail
					if (widget.categoryName.disabled == false) {
						widget.categoryStore.remove("DefaultEmail");
					}
				}
			});

			if (widget.data.groupName != "Equipment") {
				//Type subtype are not for Equipment
				on(widget.type, "change", function (value) {
					widget.subType.reset();
					widget.subType.set("store", widget.ctrl.getSubTypeStore(widget.categoryName.get("value"), value));
					if (widget.categoryName.disabled == true) {
						widget.subType.set("value", widget.data.subType);
						widget.subType.set('displayedValue', widget.data.subType);
					}
					//disable if type has no data and make it required if it has data
					else { //in edit mode
						if (widget.subType.store.data.length == 0) {
							widget.subType.set("disabled", true);
						} else if (widget.subType.store.data.length == 1) {
							widget.subType.set("disabled", false);
							widget.subType.set("required", true);
							widget.subType.set("value", widget.subType.store.data[0].name);
						} else {
							widget.subType.set("disabled", false);
							widget.subType.set("required", true);
						}
					}
				});
				//Remove Network Event is not meant for Equipment
				on(widget.removeNEBtn, "click", function () {
					var masterCaseId = widget.masterCaseId.get("value");
					var confirmDlg = new ConfirmDialog({
						title: "Remove Network Event",
						content: "Do you really want to remove Network Event <i>" + masterCaseId + "</i>?",
						style: "width: 400px",
						buttonOk: "Remove",
						buttonCancel: "No",
						onExecute: function () { widget.removeMasterCase() }
					});
					confirmDlg.set("buttonOk", "Yes");
					confirmDlg.set("buttonCancel", "No");
					confirmDlg.show();
				});
			}
			on(widget.status, "change", function (value) {
				if (widget.data.groupName != "Equipment") {
					widget.subStatus.reset();
					if (widget.status.item) {
						var statusId = widget.status.item.id;
						var store = widget.statusStore.getSubStatusStore(statusId);
						widget.subStatus.set("store", store);
					}
					widget.subStatus.set("value", widget.data.subStatus);
					if (widget.subStatus.store.data.length == 0) {
						widget.subStatus.set("required", false);
					} else {
						widget.subStatus.set("title", "Sub-Status<req>");
						widget.caseManagementFormTable.startup();
						widget.subStatus.set("required", true);
						widget.subStatus.focus();
					}
					//removing 24 Hour Auto Close from subStatus store
					if (widget.status.disabled == false && widget.status.get("value") == "On Hold") {
						widget.subStatus.store.remove("24 Hour Auto Close");
					}
				}
			});

			on(widget.queueName, 'change', function (value) {
				if (value == 'ARC') {
					widget.ownerId.set("required", false);
				} else {
					widget.ownerId.set("required", true);
				}
			});

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
			})

			on(widget.btnDescrView, "click", function (event) {
				var descriptionValue = widget.descriptionArea.get("value");
				if (descriptionValue) {
					if (widget.status.disabled == true)
						new DiaryEditor("descriptionArea", "Description", false, "", descriptionValue, true);
					else {//in edit mode
						new DiaryEditor("description", "Description", true, widget.data.descriptionArea, descriptionValue, false, "updateDescr");
					}
				} else {
					new DiaryEditor("description", "Description", false, widget.data.descriptionArea, "<<Empty!>>", true);
				}
			});

			widget.diaryHandle = topic.subscribe("updateDescr", function (event) {
				widget.descriptionArea.set("value", event.modified);
			});

			on(widget.btnSubjectView, "click", function (event) {
				var subjectValue = widget.subjectArea.get("value");
				if (subjectValue) {
					new DiaryEditor("subject", "Subject", false, widget.data.subjectArea, subjectValue, true);
				} else {
					new DiaryEditor("subject", "Subject", false, widget.data.subjectArea, "Empty!", true);
				}
			});
		},
		removeMasterCase: function () {
			var widget = this;

			var caseId = widget.data.caseId;
			var masterCaseId = widget.data.masterCaseId;

			var request = {
				"masterCaseId": masterCaseId,
				"caseList": [{ "caseId": caseId }]
			}

			var callback = function (obj) {
				widget.ctrl.showSuccessMessage(obj);
				if (obj.response.code == 200) {
					widget.data.masterCaseId = 0;
					widget.masterCaseId.set("value", "");
					domStyle.set(widget.removeNEBtn.domNode, "display", "none");
				}
			}

			this.ctrl.putAPI("removeMasterCaseId", request, callback)
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
			if (this.diaryHandle)
				this.diaryHandle.remove();
		}
	});

});



