define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/registry",
	"dijit/ConfirmDialog",
	"dojo/_base/lang",
	"dojo/dom",
	"dojo/dom-style",
	"dojo/on",
	"dstore/Memory",
	"dojo/topic",
	"dojo/date",
	"dojo/date/locale",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	"dgrid/Selector",
	"app/view/summaryRow",
	"app/view/messageWindow",
	"app/view/ValidationTextarea",
	"app/widgets/caseManagement",
	"app/widgets/caseInformation",
	"app/widgets/caseLocationInfo",
	"app/widgets/caseRoutingInfo",
	"app/widgets/caseContactInfo",
	"app/widgets/caseClosureDetails",
	"app/widgets/closeCase",
	"app/widgets/caseEmails",
	"app/widgets/caseAttachments",
	"app/widgets/caseEventDetails",
	"app/widgets/caseAdditionalInfo",
	"app/widgets/caseNotes",
	"app/widgets/caseRelatedInfo",
	"app/widgets/addNetworkEvent",
	"app/widgets/cancelCase",
	"app/widgets/caseEscalations",
	"app/widgets/createWorkOrder",
	"app/widgets/convertToIncident",
	"app/widgets/createTask",
	"app/widgets/sendOutageNotice",
	"dstore/legacy/DstoreAdapter",
	"dojo/_base/array",
	"app/model/States",
	"dojo/text!app/widgets/templates/viewCase.html",
	"app/widgets/viewOutageAccount",
	"dijit/form/Button",
	"app/widgets/collectionManagement",
	"app/widgets/collectionTreatment",
	"app/widgets/collectionLocation",
	"app/widgets/collectionClosureDetails",
	"app/widgets/accParentInfo",
	"app/widgets/closeCollection",
	"app/widgets/collectionSendNotice",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, ConfirmDialog, lang, dom, domStyle, on, Memory, topic,
	date, locale, OnDemandGrid, Selection, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, Selector, SummaryRow, messageWindow,
	ValidationTextarea, CaseManagement, CaseInformation, CaseLocationInfo, CaseRoutingInfo, CaseContactInfo, CaseClosureDetails,
	caseClose, CaseEmails, CaseAttachments, CaseEventDetails, CaseAdditionalInfo, CaseNotes, CaseRelatedInfo, AddNetworkEvent, cancelCase, Escalation,
	WorkOrder, convertToIncident, CreateTask, SendOutageNotice, DstoreAdapter, arrayUtil, States, template, ViewAccountOutage, Button, CollectionManagement,
	collectionTreatment, collectionLocation, collectionClosureDetails, accParentInfo, closeCollection, CollectionSendNotice) {
	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], {
		templateString: template,
		widgetsInTemplate: true,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			widget.data = widget.info;
			widget.accountId = widget.data.accountId;
			widget.recordType = widget.data.groupName;
			widget.prevServNo = widget.data.serviceNumber;
			widget.statesModel = new States();
			if (!widget.recordType) {
				widget.recordType = "";
			}
			widget.agentName = window.localStorage.getItem("agentName");
			widget.flag = false;

			if (widget.info && widget.info.caseId) {
				widget.info.caseNumber = this.formatCaseNumber(widget.info.caseId);
			}
			widget.workOrderStore = new Memory({
				idProperty: 'id',
				data: []
			});

			widget.taskStore = new Memory({
				idProperty: 'id',
				data: []
			});


			widget.outageNoticeStore = new Memory({
				idProperty: 'id',
				data: []
			});

			//to refresh the view after each update
			this.handle1 = topic.subscribe("lingoController/caseUpdated-" + widget.info.caseId, lang.hitch(this, function (obj) {
				widget.refreshDetails(obj.data);
			}));

			//to refresh work orders grid if any new workorder was created
			this.handle2 = topic.subscribe("/lingoController/WOCreatedForCase-" + widget.info.caseId, lang.hitch(this, function (obj) {
				widget.initWOInfo();
			}));

			this.handle3 = topic.subscribe("/lingoController/TaskCreatedForCase-" + widget.info.caseId, lang.hitch(this, function (obj) {
				widget.initTaskInfo();
			}));

			this.handle3 = topic.subscribe("/lingoController/OutageCreatedForCase-" + widget.info.caseId, lang.hitch(this, function (obj) {
				widget.initOutageInfo();
			}));
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.viewCaseTabContainer.resize();
			this.workOrdersGrid.resize();
		},
		init: function () { },
		initWOInfo: function () {
			var widget = this;
			widget.getWorkOrders(widget.data.caseId);
		},
		initTaskInfo: function () {
			var widget = this;
			widget.getTasks(widget.data.caseId);
		},
		initOutageInfo: function () {
			var widget = this;
			widget.getOutageNotice(widget.data.caseId);
		},
		initCaseEmails: function () {
			var widget = this;
			widget.viewCaseEmails.init(widget.data);
		},

		initRelatedInfo: function () {
			var widget = this;
			widget.viewCaseRelatedInfo.init(widget.data.caseId);
		},
		initCaseNotes: function () {
			var widget = this;
			widget.viewCaseNotes.init(widget.data);
		},

		initCaseAttachments: function () {
			var widget = this;
			widget.viewCaseAttachments.init(widget.data.caseId);
		},
		isCaseEditable: function () { //edit and Action button can be enabled/disabled based on following conditions
			var widget = this;
			//var canEdit = false;
			if (widget.data.status == "Closed" || widget.data.status == "Cancelled") {
				widget.viewCaseNotes.addNotesBtn.set("disabled", true); //disable addNotes if status is cancelled or Closed
				return false;
			}
			return true;
		},

		getServiceInfo: function (appId) {

			var widget = this;
			var requestObj = {
				"accountId": appId
			};

			var requestStr = JSON.stringify(requestObj);

			var callBack = function (obj) {
				if (obj.response.code == "200") {
					widget.serviceInfo = widget.setServiceStore(obj.data, widget.data.groupName);
					widget.viewCaseManagement.setServiceNumberStore(widget.serviceInfo);
				} else {
					if (widget.data.groupName != 'Network' && widget.data.groupName != 'Equipment') {
						var emptyStore = new DstoreAdapter(new Memory({
							idProperty: 'name',
							data: []
						}));
						widget.viewCaseManagement.setServiceNumberStore(emptyStore);
						new messageWindow({
							message: "No services for this Account, Please search for another account",
							title: "NOTE"
						});
					}
				}
			}

			this.sendRequest("getAllServices", requestStr, callBack, "Error while getting Data", "get");

		},

		//edit account and service details related to case
		editCaseRelDetails: function (searchKey, searchVal) {
			var widget = this;
			var requestObj = {
				"searchKey": searchKey,
				"searchValue": widget.ctrl.encodeSearchValue(searchVal),
				"regExpFlag": false,
				"activeOnlyFlag": false
			};
			var callback = function (obj) {
				if (obj.response.code == "200") {
					if (obj.data[0].companyName) {
						widget.accountNameSpan.innerHTML = obj.data[0].companyName;
						widget.viewCaseLocInfo.accountName.set("value", obj.data[0].companyName);
					}
					if (obj.data[0].accountId)
						widget.accountIdSpan.innerHTML = obj.data[0].accountId;
					if (obj.data[0].serviceAddress)
						widget.viewCaseLocInfo.serviceAddress.set("value", obj.data[0].serviceAddress);


				}

			}
			widget.ctrl.getAPI("search", requestObj, callback, false, false);
		},
		refreshDetails: function (data) {

			var widget = this;
			widget.data = data;

			if (!data) {
				return;
			}
			setTimeout(function () {
				var actionMenu = widget.caseActionMenu;
				var childItems = actionMenu.getChildren();
				var count = 0;

				childItems.forEach(element => {
					if (element.domNode.style.getPropertyValue("display") == "none") {
						count++;
					}
				});

				if (count == childItems.length) {
					domStyle.set(widget.caseActionBtn.domNode, "display", "none");
				}
			}, 10);

			if (!widget.isCaseEditable()) {
				widget.caseActionBtn.set("disabled", true);
				widget.caseEditBtn.set("disabled", true);
			}


			if (widget.data.accountName)
				widget.accountNameSpan.innerHTML = widget.data.accountName;

			if (widget.data.accountId)
				widget.accountIdSpan.innerHTML = widget.data.accountId;
			widget.caseNameSpan.innerHTML = widget.info.caseNumber;
			widget.resetForms();
			widget.disableActions(widget.data.groupName);
			//populate data
			if (widget.data.groupName != "Collections") {

				widget.viewPrimaryContactName.set("value", widget.data.outageContact);
				widget.viewPrimaryContactPhone.set("value", widget.data.outageContactPh);
				widget.viewPrimaryContactEmail.set("value", widget.data.outageContactEmail);
				widget.getServiceInfo(widget.data.accountId);
				widget.viewCrctInfo.set("value", widget.data.circuitInfo);
				this.viewCaseManagement.populateData(widget.data);
				this.viewCaseLocInfo.populateData(widget.data);
				this.viewCaseContactInfo.populateData(widget.data);
				this.viewCaseClosureDetails.populateData(widget.data);
				this.viewCaseEventDetails.populateData(widget.data);

				if (widget.isActionAllowed("case-create-task", widget.data.groupName) && widget.data.ownerId != 0) {
					setTimeout(function () {
						domStyle.set(widget.caseActionMenu.domNode, "display", "flex");
						domStyle.set(widget.caseActionMenu.domNode, "align-items", "flex-start");
						domStyle.set(widget.taskBtn.domNode, "display", "block");
					}, 0);

				}
				else {
					domStyle.set(widget.taskBtn.domNode, "display", "none");

				}

				if (widget.isActionAllowed("case-send-outage-notice", widget.data.groupName)) {
					setTimeout(function () {
						domStyle.set(widget.caseActionMenu.domNode, "display", "flex");
						domStyle.set(widget.caseActionMenu.domNode, "align-items", "flex-start");
						domStyle.set(widget.sendOutageBtn.domNode, "display", "block");
					}, 0);

				}
				else {
					domStyle.set(widget.sendOutageBtn.domNode, "display", "none");

				}

				if (widget.data.subStatus == "24 Hour Auto Close") {
					this.autoCloseSetDiv.innerHTML = "This case is schedule to auto close at " + widget.getTimeAfter24Hr();
					domStyle.set(this.autoCloseSetDiv, "display", "flex");
				} else {
					domStyle.set(this.autoCloseSetDiv, "display", "none");
				}

				this.viewCaseManagement.disableAllFields();
				this.viewCaseContactInfo.disableFields();
			} else {

				this.viewCollecManagement.populateData(widget.data);
				this.viewCollecTreatment.populateData(widget.data);
				this.viewCollecLocation.populateData(widget.data);
				this.viewCaseContactInfo.populateData(widget.data);
				this.viewColClosureDetails.populateData(widget.data);
				this.viewCaseEventDetails.populateData(widget.data);
				this.viewAccParent.populateData(widget.data);
			}

			widget.initCaseEmails();
		},
		resetForms: function () {
			var widget = this;
			widget.viewCaseManagement.caseManagementForm.reset();
			widget.viewCaseManagement.resetFields();
			widget.viewCaseLocInfo.caseLocationForm.reset();
			widget.viewCaseContactInfo.caseContactForm.reset();
			widget.viewCaseContactInfo.resetFields();
			widget.viewCaseClosureDetails.caseClosureForm.reset();
			widget.viewCrctInfo.reset();
		},
		buttonRender: function (data, value, cell) {
			var widget = this;
			var w = new Button({
				label: "View Accounts",
				onClick: function () {
					widget.showOutAccDialog(data);
					//widget.ctrl.getUsers(data);
				}
			}, cell.appendChild(document.createElement("div")));
			w._destroyOnRemove = true;
			return w;
		},
		showOutAccDialog: function (data) {
			var widget = this;
			var requestObj = {
				"outageId": data.id
			};
			var callback = function (d) {
				var accOutage = new ViewAccountOutage({
					'lingoController': widget.lingoController,
					'info': d.data
				});
			};

			widget.ctrl.getAPI("getOutageNoticeById", requestObj, callback);
		},
		displayWidgets: function () {
			var widget = this;
			if (widget.data.groupName == "Collections") {
				domStyle.set(widget.collectionCaseDiv, "display", "block");
				//domStyle.set(widget.colMgmntPanel.domNode, "display", "block");
				//domStyle.set(widget.treatPanel.domNode, "display", "block");
				//domStyle.set(widget.locPanel.domNode, "display", "block");
				//domStyle.set(widget.colClosureDtlPanel.domNode, "display", "block");
				domStyle.set(widget.parPanel.domNode, "display", "block");
				domStyle.set(widget.caseMgmntPanel.domNode, "display", "none");
				domStyle.set(widget.caseLocPanel.domNode, "display", "none");
				domStyle.set(widget.caseCircuitPanel.domNode, "display", "none");
				domStyle.set(widget.casePrimaryContactPanel.domNode, "display", "none");
				domStyle.set(widget.caseClosureDtlPanel.domNode, "display", "none");
			}
		},
		postCreate: function () {
			var widget = this;

			if (widget.data.accountId !== undefined && widget.data.groupName != 'Network' && widget.data.groupName != 'Collections') {
				widget.getServiceInfo(widget.data.accountId);
			}

			widget.displayWidgets();
			if (widget.data) {
				widget.refreshDetails(widget.data);
			}

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow, Selector]);
			//work order grid
			var workOrderLayout = [
				{ label: "Created On", field: "createdOn", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Work Order Number", field: "workOrderNo", width: 110, renderCell: lang.hitch(this, this.renderWorkOrderId) },
				{ label: "External Ticket Number", field: "externalTktNum", width: 80 },
				{ label: "Record Type", field: "workOrderType", width: 80 },
				{ label: "Status", field: "status", width: 70 },
				{ label: "Sub Status", field: "subStatus", width: 70 },
				{ label: "Created By", field: "createdUser", width: 90 },
				{ label: "Owner", field: "ownerName", width: 90 },
				{ label: "Dispatch Type", field: "dispatchType", width: 90 },
				{ label: "Dispatch Date/ETR", field: "dispatchDate", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Dispatch Date/Time", field: "dispatchStart", width: 90, formatter: lang.hitch(this, this.dateFormatter) }
			];
			widget.workOrdersGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Work order Found!!",
				collection: widget.workOrderStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: workOrderLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowSelectAll: true,
				allowTextSelection: true,
				height: "100%",
				minRowsPerPage: 500
			}, widget.caseWorkOrderdiv);
			widget.workOrdersGrid.startup();

			var taskLayout = [
				{ label: "Created On", field: "createdDate", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Task Number", field: "taskNumber", width: 110, renderCell: lang.hitch(this, this.renderTaskId) },
				{ label: "Task Category", field: "category", width: 80 },
				{ label: "Owner", field: "ownerName", width: 80 },
				{ label: "Status", field: "status", width: 70 },
			];
			widget.taskGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Work order Found!!",
				collection: widget.taskStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: taskLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowSelectAll: true,
				allowTextSelection: true,
				height: "100%",
				minRowsPerPage: 500
			}, widget.caseTaskDiv);
			widget.taskGrid.startup();

			var outageNoticeLayout = [
				{ label: "Created Date", field: "createdDate", width: 80, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Outage Number", field: "id", width: 90 },
				{ label: "Message Type", field: "messageType", width: 90 },
				{ label: "Outage Status", field: "statusName", width: 80 },
				{ label: "Outage Notification", field: "message", width: 140 },
				{ label: '', field: 'action', width: 60, renderCell: lang.hitch(this, this.buttonRender) }

			];
			widget.outageNoticeGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Outage Notice Found!!",
				collection: widget.outageNoticeStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: outageNoticeLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowSelectAll: true,
				allowTextSelection: true,
				height: "100%",
				minRowsPerPage: 500
			}, widget.caseOutageDiv);
			widget.outageNoticeGrid.startup();

			//hide create task btn when case ownerId is unset
			on(widget.caseCloseBtn, "click", function () {
				widget.closeWindow();
			});

			on(widget.caseEditBtn, "click", function () {
				if (widget.caseDetails.selected == false) {
					registry.byId(widget.viewCaseTabContainer).selectChild(registry.byId(widget.caseDetails));
				}
				widget.enableDetails();

			});

			//update ServiceNumber when accountId is changed

			var appId = widget.viewCaseManagement.accountId;
			if (widget.data.groupName != 'Network' && widget.data.groupName != 'Equipment' && widget.data.groupName != "Collections") {
				if (appId !== undefined) {
					on(appId, 'change', function (value) {
						if (value !== undefined) {
							widget.viewCaseManagement.serviceNumber.set("value", "");
							widget.getServiceInfo(appId.value);
							widget.editCaseRelDetails('AppID', appId.value);
						}
					});

				}
			}

			var colAppId = widget.viewCollecLocation.accountId;
			if (widget.data.groupName == "Collections") {
				if (colAppId !== undefined) {
					on(colAppId, 'change', function (value) {
						if (value !== undefined) {
							widget.editCaseRelDetails('AppID', colAppId.value);
						}
					});

				}
			}

			if (widget.data.groupName != 'Network' && widget.data.groupName != 'Equipment' && widget.data.groupName != "Collections") {
				var serviceNo = widget.viewCaseManagement.serviceNumber;
				if (serviceNo !== undefined && serviceNo !== "") {
					on(serviceNo, 'change', function (value) {
						if (value !== undefined && value !== "") {
							var srvInfo = widget.serviceInfo.get(value);
							if (widget.prevServNo != value) {
								if (srvInfo.srvAddress)
									widget.viewCaseLocInfo.serviceAddress.set("value", srvInfo.srvAddress);
								widget.viewCaseLocInfo.addressLine1.set("value", srvInfo.address == undefined ? "" : srvInfo.address);
								widget.viewCaseLocInfo.addressLine2.set("value", "");
								widget.viewCaseLocInfo.city.set("value", srvInfo.city == undefined ? "" : srvInfo.city);
								widget.viewCaseLocInfo.country.set("value", srvInfo.country == undefined ? "" : srvInfo.country);
								widget.viewCaseLocInfo.state.set("value", srvInfo.state == undefined ? "" : srvInfo.state);
								widget.viewCaseLocInfo.zipCode.set("value", srvInfo.zipCode == undefined ? "" : srvInfo.zipCode);
								widget.prevServNo = value;
								widget.setStCon(srvInfo.country, srvInfo.state);
							} else {
								var addrLine1 = widget.data.addressLine1 == undefined ? "" : widget.data.addressLine1;
								var addrLine2 = widget.data.addressLine2 == undefined ? "" : widget.data.addressLine2;
								var city = widget.data.city == undefined ? "" : widget.data.city;
								var zip = widget.data.zipCode == undefined ? "" : widget.data.zipCode;
								var servAdd = widget.data.serviceAddress == undefined ? "" : widget.data.serviceAddress;
								widget.setStCon(widget.data.country, widget.data.state);
								var state = widget.data.state == undefined ? "" : widget.data.state;
								var country = widget.data.country == undefined ? "" : widget.data.country;
								widget.viewCaseLocInfo.addressLine1.set("value", addrLine1);
								widget.viewCaseLocInfo.addressLine2.set("value", addrLine2);
								widget.viewCaseLocInfo.city.set("value", city);
								widget.viewCaseLocInfo.country.set("value", country);
								widget.viewCaseLocInfo.state.set("value", state);
								widget.viewCaseLocInfo.zipCode.set("value", zip);
								if (addrLine1 == "" && addrLine2 == "" && city == "" && state == "" && zip == "") {
									widget.viewCaseLocInfo.serviceAddress.set("value", servAdd);
								} else {
									var newServAdd = addrLine1 + "," + addrLine2 + "," + city + "," + state + "," + zip;
									newServAdd = widget.trimCommas(newServAdd);
									widget.viewCaseLocInfo.serviceAddress.set("value", newServAdd);
								}

							}
							if (srvInfo.billingType)
								widget.viewCaseManagement.billingType.set("value", srvInfo.billingType);
							else
								widget.viewCaseManagement.billingType.set("value", "");

							//widget.editCaseRelDetails('ServiceNumber', serviceNo.value);
						}
					});
				}
				if (serviceNo.value == "") {
					var addrLine1 = widget.data.addressLine1 == undefined ? "" : widget.data.addressLine1;
					var addrLine2 = widget.data.addressLine2 == undefined ? "" : widget.data.addressLine2;
					var city = widget.data.city == undefined ? "" : widget.data.city;
					var state = widget.data.state == undefined ? "" : widget.data.state;
					var zip = widget.data.zipCode == undefined ? "" : widget.data.zipCode;
					var newServAdd = addrLine1 + "," + addrLine2 + "," + city + "," + state + "," + zip;
					newServAdd = widget.trimCommas(newServAdd);
					widget.viewCaseLocInfo.addressLine1.set("value", addrLine1);
					widget.viewCaseLocInfo.addressLine2.set("value", addrLine2);
					widget.viewCaseLocInfo.city.set("value", city);
					widget.viewCaseLocInfo.state.set("value", state);
					widget.viewCaseLocInfo.zipCode.set("value", zip);
					widget.viewCaseLocInfo.serviceAddress.set("value", newServAdd);

				}
			}

			on(widget.caseSaveBtn, "click", function () {
				var updateInfo = {};
				var collectionInfo = {};
				updateInfo.accountId = appId.value;
				if (!widget.validate(widget.data.groupName) || ((widget.data.groupName == 'Incident' || widget.data.groupName == 'Inquiry') && (updateInfo.accountId == ""))) {
					new messageWindow({
						message: "Please enter required(*) values!!",
						title: "NOTE"
					});
					return;
				}

				else if (!widget.validateLocAhrs() && widget.flag == true && widget.data.groupName != "Collections") {
					new messageWindow({
						message: "Please Enter Location Access Hours(From-To)",
						title: "NOTE",
						onOK: function () {
							setTimeout(function () {
								widget.viewCaseLocInfo.accessHrs.focus();
							}, 10)
						}
					});
					widget.flag = false;
					return;
				}

				else if (!widget.validateAddLine1() && widget.flag == true && widget.data.groupName != "Collections") {
					new messageWindow({
						message: "Please Enter Address Line 1",
						title: "NOTE",
						onOK: function () {
							setTimeout(function () {
								widget.viewCaseLocInfo.addressLine1.focus();
							}, 10)
						}
					});
					widget.flag = false;
					return;
				}

				else if (!widget.validateDescp() && widget.flag == true && widget.data.groupName != "Collections") {
					new messageWindow({
						message: "Please Enter the Description",
						title: "NOTE",
						onOK: function () {
							setTimeout(function () {
								widget.viewCaseManagement.descriptionArea.focus();
							}, 10)
						}
					});
					widget.flag = false;
					return;
				}

				else {

					widget.getInfoToUpdate(updateInfo);
					if (widget.data.groupName == "Collections") {
						collectionInfo['collectionId'] = widget.data.collectionInfo.collectionId;

						widget.getCollectionInfo(collectionInfo);
						updateInfo['collectionInfo'] = collectionInfo;
					}

					//console.log(updateInfo);
					var callback = function (obj) {
						widget.ctrl.showSuccessMessage(obj);
						if (obj.response.code == 200) {
							widget.disableDetails();
						}
					}
					//Service Number is updated to '0' when the field is Empty
					if (updateInfo.groupName == 'Inquiry' || updateInfo.groupName == 'Network') {
						if (updateInfo.serviceNumber == null) {
							updateInfo.serviceNumber = '0';
						}
					}
					widget.ctrl.updateCase(updateInfo, lang.hitch(this, callback));
				}
			});

			on(widget.caseDiscardBtn, "click", function () {
				widget.disableDetails();
				widget.refreshDetails(widget.data);

				//widget.closeWindow();
				//widget.viewCaseDetails(widget.data.caseNumber, widget.ctrl, widget.data);
			});

			on(widget.closeCaseBtn, "click", function () {
				if (widget.data.groupName != "Collections") {
					if (widget.data.queueName != 'ARC') {
						new caseClose({
							'caseManagementWidget': widget.viewCaseManagement.caseManagementFormTable,
							'caseClosureWidget': widget.viewCaseClosureDetails.caseClosureTable,
							'caseEventWidget': widget.viewCaseEventDetails.caseEventDetailsTable,
							'info': widget.data,
							'lingoController': widget.ctrl
						});
					} else {
						new messageWindow({
							message: "Case doesn't meet the queue criteria",
							title: "Note"
						});
					}
				}
				else {
					new closeCollection({
						'info': widget.data,
						'lingoController': widget.ctrl
					});
				}
			});
			on(widget.addNetworkEventBtn, "click", function () {
				new AddNetworkEvent({
					'caseManagementWidget': widget.viewCaseManagement,
					'info': widget.data,
					'lingoController': widget.ctrl
				});
			});
			on(widget.cancelCaseBtn, "click", function () {
				new cancelCase({
					'caseManagementWidget': widget.viewCaseManagement.caseManagementFormTable,
					'caseClosureWidget': widget.viewCaseClosureDetails.caseClosureTable,
					'caseEventWidget': widget.viewCaseEventDetails.caseEventDetailsTable,
					'info': widget.data,
					'lingoController': widget.ctrl
				});
			});

			on(widget.convertToIncBtn, "click", function () {
				if (widget.data.accountId != '' && widget.data.accountId != undefined) {
					new convertToIncident({
						'info': widget.data,
						'lingoController': widget.ctrl
					});
				} else {
					new messageWindow({
						message: "Please enter a valid Account ID",
						title: "Note"
					});
				}
			});

			on(widget.escalateBtn, "click", function () {
				new Escalation({
					'caseManagementWidget': widget.viewCaseManagement.caseManagementFormTable,
					'info': widget.data,
					'lingoController': widget.ctrl
				});
			});

			on(widget.workOrderBtn, "click", function () {
				new WorkOrder({
					'info': widget.data,
					'lingoController': widget.ctrl
				});
			});
			on(widget.taskBtn, "click", function () {
				new CreateTask({
					'info': widget.data,
					'lingoController': widget.ctrl
				});
			});
			on(widget.sendOutageBtn, "click", function () {
				new SendOutageNotice({
					'info': widget.data,
					'lingoController': widget.ctrl
				});
			});
			on(widget.woReloadBtn, "click", function () {
				widget.initWOInfo();
			});
			on(widget.taskReloadBtn, "click", function () {
				widget.initTaskInfo();
			});
			on(widget.outageReloadBtn, "click", function () {
				widget.initOutageInfo();
			});
			on(widget.refreshBtn, "click", function () {
				widget.refresh();
			});
			on(widget.sendNoticeBtn, "click", function () {
				new CollectionSendNotice({
					'info': widget.data,
					'lingoController': widget.ctrl
				});
			});
		},

		validateDescp: function () {
			var widget = this;
			var descp = widget.viewCaseManagement.descriptionArea.get("value");
			if (descp.length == 0) {
				var regex = new RegExp("(.|[\r\n])+");
				if (!regex.test(descp)) {
					widget.flag = true;
					return false;
				}
			}

			return true;

		},
		validateLocAhrs: function () {
			var widget = this;
			var locAccHrs = widget.viewCaseLocInfo.accessHrs.get("value");
			if (widget.data.groupName == "Incident") {
				var regex = new RegExp("(.|[\r\n])+");
				if (!regex.test(locAccHrs)) {
					widget.flag = true;
					return false;
				}
			}

			if (widget.data.groupName == "Inquiry") {
				var regex = new RegExp("(.|[\r\n])*");
				if (!regex.test(locAccHrs)) {
					widget.flag = true;
					return false;
				}
			}

			return true;

		},

		validateAddLine1: function () {
			var widget = this;
			var addLine1 = widget.viewCaseLocInfo.addressLine1.get("value");
			if (widget.data.groupName == "Incident") {
				var regex = new RegExp("(.|[\r\n])+");
				if (!regex.test(addLine1)) {
					widget.flag = true;
					return false;
				}
			}

			if (widget.data.groupName == "Inquiry") {
				var regex = new RegExp("(.|[\r\n])*");
				if (!regex.test(addLine1)) {
					widget.flag = true;
					return false;
				}
			}

			return true;

		},

		setStCon: function (country, state) {
			var widget = this;
			if (country != undefined && country != "") {
				if (state != undefined && state != "") {
					var con = widget.statesModel.checkValidState(state);
					if (con != country) {
						widget.viewCaseLocInfo.country.set("value", con);
						widget.viewCaseLocInfo.state.set("value", state);
						widget.data.country = con;
						widget.data.state = state;
					} else {
						widget.viewCaseLocInfo.country.set("value", country);
						widget.viewCaseLocInfo.state.set("value", state);
						widget.data.country = country;
						widget.data.state = state;
					}
				} else {
					widget.viewCaseLocInfo.country.set("value", country);
					widget.viewCaseLocInfo.state.set("value", "");
					widget.data.state = "";
					widget.data.country = country;

				}
			}
			else {
				if (state != undefined && state != "") {
					var con = widget.statesModel.checkValidState(state);
					if (con == null) {
						widget.viewCaseLocInfo.country.set("value", "");
						widget.viewCaseLocInfo.state.set("value", "");
						widget.data.state = "";
						widget.data.country = "";
					} else {
						widget.viewCaseLocInfo.country.set("value", con);
						widget.viewCaseLocInfo.state.set("value", state);
						widget.data.country = con;
						widget.data.state = state;
					}

				}
				else {
					widget.viewCaseLocInfo.country.set("value", "US");
					widget.viewCaseLocInfo.state.set("value", "");
					widget.data.country = "US";
					widget.data.state = "";
				}
			}
		},
		refresh: function () {

			var widget = this;
			var caseId = widget.data.caseId;
			var callback = function (obj) {
				widget.data = obj.data;
				widget.refreshDetails(obj.data)
			}
			this.ctrl.getCaseDetails(caseId, callback);
		},
		closeWindow: function () {
			var requestContentPane = registry.byId("case_contentPane_" + this.data.caseNumber);
			registry.byId("appTabContainer").selectChild(registry.byId("controlPanelContentPane"));
			registry.byId("appTabContainer").removeChild(requestContentPane);

			//registry.byId("appTabContainer").startup();
			requestContentPane.destroyRecursive();
		},
		validate: function (groupName) {
			var widget = this;
			if (!widget.viewCaseManagement.caseManagementForm.isValid()) {
				widget.viewCaseManagement.caseManagementForm.validate();
				return false;
			}
			if (groupName == "Incident" || groupName == "Inquiry") {
				if (!widget.viewCaseLocInfo.caseLocationForm.isValid()) {
					widget.viewCaseLocInfo.caseLocationForm.validate();
					return false;
				}

				if (!widget.viewCaseContactInfo.caseContactForm.isValid()) {
					widget.viewCaseContactInfo.caseContactForm.validate();
					return false;
				}
			} else if (groupName == "Equipment") {
				if (!widget.viewCaseContactInfo.caseContactForm.isValid()) {
					widget.viewCaseContactInfo.caseContactForm.validate();
					return false;
				}
			} else if (groupName == "Collections") {
				if (!widget.viewCollecManagement.colManagementForm.isValid()) {
					widget.viewCollecManagement.colManagementForm.validate();
					return false;
				}
				if (!widget.viewCaseContactInfo.caseContactForm.isValid()) {
					widget.viewCaseContactInfo.caseContactForm.validate();
					return false;
				}
			}
			return true;
		},
		disableActions: function (groupName) {
			var widget = this;
			if (groupName == "Network") {
				domStyle.set(widget.caseLocPanel.domNode, "display", "none");
				domStyle.set(widget.caseContactPanel.domNode, "display", "none");
				//Actions dropdown will show related actions only
				domStyle.set(widget.convertToIncBtn.domNode, "display", "none");
				domStyle.set(widget.escalateBtn.domNode, "display", "none");
				domStyle.set(widget.addNetworkEventBtn.domNode, "display", "none");
				domStyle.set(widget.workOrderBtn.domNode, "display", "none");
			} else if (groupName == "Incident") {
				domStyle.set(widget.convertToIncBtn.domNode, "display", "none");
			} else if (groupName == "Inquiry" || groupName == "Equipment") {
				domStyle.set(widget.escalateBtn.domNode, "display", "none");
				domStyle.set(widget.addNetworkEventBtn.domNode, "display", "none");
				domStyle.set(widget.workOrderBtn.domNode, "display", "none");
				if (groupName == "Equipment") {
					domStyle.set(widget.caseLocPanel.domNode, "display", "none");
					domStyle.set(widget.caseCircuitPanel.domNode, "display", "none");
					domStyle.set(widget.casePrimaryContactPanel.domNode, "display", "none");
				}
			}
			else if (groupName == "Collections") {
				domStyle.set(widget.workOrderBtn.domNode, "display", "none");
			}
		},
		enableDetails: function () {
			var widget = this;

			widget.caseActionBtn.set("disabled", true);
			widget.refreshBtn.set("disabled", true);
			if (widget.data.groupName != "Collections") {
				widget.enableWidgets(widget.viewCaseManagement.caseManagementFormTable.domNode);
				widget.enableWidgets(widget.viewCaseLocInfo.caseLocationTable.domNode);
				widget.enableWidgets(widget.viewCaseContactInfo.caseContactInfoTable.domNode);
				widget.enableWidgets(widget.viewCaseClosureDetails.caseClosureTable.domNode);
				widget.viewCaseManagement.disableFields();
				widget.viewCaseManagement.modifyStatusStore();
				widget.viewCaseLocInfo.disableFields();
				widget.viewCaseContactInfo.activateFields();
				widget.viewCaseLocInfo.activateFields();
				widget.viewCaseClosureDetails.disableFields();
				//widget.viewCaseContactInfo.disableFields();
				widget.viewCrctInfo.set("disabled", false);
			} else {
				widget.enableWidgets(widget.viewCollecManagement.colManagementFormTable.domNode);
				widget.enableWidgets(widget.viewCaseContactInfo.caseContactInfoTable.domNode);
				widget.viewCollecManagement.disableFields();
				//widget.viewCollecLocation.disableFields();
				widget.viewCaseContactInfo.activateFields();
				widget.viewCollecManagement.modifyColStatusStore()
			}
			domStyle.set(widget.caseEditBtn.domNode, "display", "none");
			domStyle.set(widget.caseSaveBtn.domNode, "display", "block");
			domStyle.set(widget.caseDiscardBtn.domNode, "display", "block");
		},
		disableDetails: function () {
			var widget = this;

			widget.caseActionBtn.set("disabled", false);
			widget.refreshBtn.set("disabled", false);
			if (widget.data.groupName != "Collections") {
				widget.disableWidgets(widget.viewCaseManagement.caseManagementFormTable.domNode);
				widget.disableWidgets(widget.viewCaseLocInfo.caseLocationTable.domNode);
				widget.disableWidgets(widget.viewCaseContactInfo.caseContactInfoTable.domNode);
				widget.disableWidgets(widget.viewCaseClosureDetails.caseClosureTable.domNode);
				widget.viewCaseManagement.disableFields();
				widget.viewCaseContactInfo.disableFields();
				widget.viewCaseLocInfo.disableAllFields();
				widget.viewCrctInfo.set("disabled", true);
				widget.viewPrimaryContactName.set("disabled", true);
				widget.viewPrimaryContactPhone.set("disabled", true);
				widget.viewPrimaryContactEmail.set("disabled", true);
			} else {
				widget.disableWidgets(widget.viewCollecManagement.colManagementFormTable.domNode);
				widget.disableWidgets(widget.viewCaseContactInfo.caseContactInfoTable.domNode);
				widget.viewCollecManagement.disableViewFields();
				widget.viewCollecLocation.disableViewFields();

			}
			domStyle.set(widget.caseEditBtn.domNode, "display", "block");
			domStyle.set(widget.caseSaveBtn.domNode, "display", "none");
			domStyle.set(widget.caseDiscardBtn.domNode, "display", "none");
		},
		getInfoToUpdate: function (updateInfo) {
			var widget = this;
			//updateInfo = dojo.clone(widget.data);
			updateInfo.caseId = widget.data.caseId;
			if (widget.data.groupName != "Collections") {
				updateInfo.escalationDate = widget.data.escalationDate;
				widget.viewCaseManagement.getInfo(updateInfo);
				widget.viewCaseLocInfo.getInfo(updateInfo);
				widget.viewCaseContactInfo.getInfo(updateInfo);
				widget.viewCaseClosureDetails.getInfo(updateInfo);
				updateInfo.circuitInfo = widget.viewCrctInfo.get("value").trim();
				updateInfo.outageContact = widget.viewPrimaryContactName.get("value").trim();
			} else {
				widget.viewCollecManagement.getInfo(updateInfo);
				widget.viewCollecLocation.getInfo(updateInfo);
			}
		},
		getCollectionInfo: function (collectionInfo) {
			var widget = this;
			widget.viewCollecManagement.getCollectionInfo(collectionInfo);
			widget.viewCollecLocation.getCollectionInfo(collectionInfo);
			widget.viewAccParent.getCollectionInfo(collectionInfo);
			widget.viewCaseContactInfo.getInfo(collectionInfo);
		},
		getTimeAfter24Hr: function () {
			var widget = this;
			var inputDateStr = widget.data.modifiedDate;
			// Parse the input date string in ET
			var inputDate = locale.parse(inputDateStr, {
				selector: "date",
				datePattern: "yyyy-MM-dd HH:mm:ss",
				locale: "en-us",
				timeZone: "America/New_York"
			});

			if (!inputDate) {
				throw new Error("Invalid date format");
			}

			// Add 24 hours to the input date
			var futureDate = date.add(inputDate, "hour", 24);

			// Format the future date back to string in ET
			var futureDateStr = locale.format(futureDate, {
				selector: "date",
				datePattern: "yyyy-MM-dd HH:mm:ss",
				locale: "en-us",
				timeZone: "America/New_York"
			});

			return futureDateStr;
		},
		getWorkOrders: function (caseId) {
			var widget = this
			var requestObj = {
				"caseId": caseId
			};
			var callBack = function (obj) {
				if (obj.response.code == "200") {
					widget.workOrderStore.setData(obj.data);
					widget.workOrdersGrid.set("collection", widget.workOrderStore);
					widget.workOrdersGrid.refresh();
					widget.workOrdersGrid.resize();
				}
			}
			widget.ctrl.getAPI("getWorkOrders", requestObj, callBack);
		},
		getTasks: function (caseId) {
			var widget = this
			var requestObj = {
				"caseId": caseId
			};
			var callBack = function (obj) {
				if (obj.response.code == "200") {
					widget.taskStore.setData(obj.data);
					widget.taskGrid.set("collection", widget.taskStore);
					widget.taskGrid.refresh();
					widget.taskGrid.resize();
				}
			}
			widget.ctrl.getAPI("getCaseTask", requestObj, callBack);
		},
		getOutageNotice: function (caseId) {
			var widget = this
			var requestObj = {
				"caseId": caseId
			};
			var callBack = function (obj) {
				if (obj.response.code == "200") {
					widget.outageNoticeStore.setData(obj.data);
					widget.outageNoticeGrid.set("collection", widget.outageNoticeStore);
					widget.outageNoticeGrid.refresh();
					widget.outageNoticeGrid.resize();
				}
			}
			widget.ctrl.getAPI("getOutageNoticeByCaseId", requestObj, callBack);
		},
		renderWorkOrderId: function (data, value, cell) {
			if (!value || !data) {
				return;
			}
			//console.log(data);
			var widget = this;
			var div = cell.appendChild(document.createElement("div"));
			var linkNode = dojo.create("a", { href: "javascript:void(null);", title: value, innerHTML: value }, div);

			on(linkNode, "click", lang.hitch(this, function () {
				var callback = function (obj) {
					widget.viewWODetails(value, widget.ctrl, obj.data);

				}
				widget.ctrl.getWorkOrderDetails(data.id, callback);
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
		handleOnClose: function () {
			var widget = this;
			if (widget.refreshBtn.disabled == true) {
				if (registry.byId("case_contentPane_" + widget.data.caseNumber)) {
					registry.byId("appTabContainer").selectChild("case_contentPane_" + widget.data.caseNumber);
				}
				var myDialog = new ConfirmDialog({
					title: "Closing Case Tab - " + widget.data.caseNumber,
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

		trimCommas: function (input) {
			// Regular expression to match commas between empty words or between an empty word and a non-empty word
			input = input.replace(/^,+|,+$/g, '');
			input = input.replace(/\s*,\s*/g, ',');
			return input;
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
