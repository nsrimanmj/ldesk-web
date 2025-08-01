define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/registry",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-style",
	"dojo/on",
	"dojo/dom-construct",
	"dojo/topic",
	"dojo/date",
	"dstore/Memory",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/Selector",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	"app/view/summaryRow",
	"app/view/messageWindow",
	"app/view/ValidationTextarea",
	"dijit/popup",
	"dijit/layout/ContentPane",
	"dijit/TitlePane",
	"dijit/form/Button",
	"app/model/WOStatus",
	"app/widgets/chargeItemizations",
	"app/widgets/addWoNotes",
	"app/widgets/woCancelReschedule",
	"app/widgets/woCompleteCancel",
	"app/widgets/closeWorkOrder",
	"app/widgets/closeCarrierWO",
	"app/widgets/createWorkOrder",
	"dojo/text!app/widgets/templates/view_work_order.html",
	"dijit/ConfirmDialog",
	"app/widgets/cancelWorkOrder",
	"app/widgets/woManualBilling",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, lang, array, domStyle, on, domConstruct, topic, date, Memory, OnDemandGrid, Selection, Selector, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, messageWindow, ValidationTextarea, popup, ContentPane, TitlePane, Button, WOStatusStore, ChargeItemizations, AddWONotes, WOCancelReschedule, WOCompleteCancel, CloseWorkOrder,
	CloseCarrierWO, CreateWorkOrder, template, ConfirmDialog, CancelWorkOrder, WoManualBilling) {
	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], {
		templateString: template,
		widgetsInTemplate: true,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			widget.data = widget.info;
			widget.caseData = widget.data.caseDetails;
			widget.recordType = widget.data.workOrderType;
			if (!widget.recordType) {
				widget.recordType = "";
			}

			widget.statusStore = new WOStatusStore();
			//to refresh billingInformation 
			this.handle1 = topic.subscribe("/workOrder/ItemizedChargeUpdated-" + widget.info.id, lang.hitch(this, function (obj) {
				widget.refresh(true);
			}));
			//to refresh case details
			this.handle2 = topic.subscribe("lingoController/caseUpdated-" + widget.info.caseId, lang.hitch(this, function (obj) {
				widget.caseData = obj.data;
				widget.setWidgetValues(widget.caseData, widget.caseMgmtTable.domNode);
			}));

			//to refresh details 
			this.handle3 = topic.subscribe("lingoController/woUpdated-" + widget.info.id, lang.hitch(this, function (obj) {
				widget.refresh(true);
			}));

			this.handle4 = topic.subscribe("workorder/notes_added/" + widget.info.id, lang.hitch(this, function (obj) {
				widget.getNotes();
			}));


			widget.dispatchTypeStore = widget.ctrl.getDispatchTypeStore(widget.data.workOrderType);
			widget.itemizedCharges = new Memory({
				idProperty: "ciId",
				data: []
			});

			widget.notesStore = new Memory({
				idProperty: "noteId",
				data: []
			});


			widget.woHistoryStore = new Memory({
				idProperty: "entryId",
				data: []
			});

			widget.agentGroups = JSON.parse(window.localStorage.getItem("groups"));
			widget.foundInc = widget.agentGroups.hasOwnProperty('Incident');
			widget.foundFldOps = widget.agentGroups.hasOwnProperty('Field Ops');

			widget.agentStore = widget.ctrl.getAgentStore();
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.viewWOTabContainer.resize();
		},
		init: function () { },
		initWOChargeInfo: function () {
			var widget = this;
			widget.getItemizedCharges();
		},
		initWONotes: function () {
			var widget = this;
			widget.getNotes();
		},
		initWORelated: function () {
			var widget = this;
			widget.getWoHistory();
		},
		getNotes: function () {
			var widget = this;
			if (widget.data) {
				var info = { "woId": widget.data.id };
				var callBack = function (obj) {
					widget.notesStore.setData(obj.data);
					//widget.chargeItemizationsGrid.set("collection", widget.itemizedCharges);
					widget.notesGrid.refresh();
					widget.notesGrid.resize();
				};
				widget.ctrl.getAPI("woNotes", info, callBack);
			}
		},
		getWoHistory: function () {
			var widget = this;
			if (widget.data) {
				var info = { "woId": widget.data.id };
				var callBack = function (obj) {
					widget.woHistoryStore.setData(obj.data);
					widget.historyGrid.refresh();
					widget.historyGrid.resize();
				};
				widget.ctrl.getAPI("getWoHistory", info, callBack);
			}
		},
		getItemizedCharges: function () {
			var widget = this;
			if (widget.data) {
				var info = { "workOrderNumber": widget.data.workOrderNo };
				var callBack = function (obj) {
					widget.itemizedCharges.setData(obj.data);
					widget.chargeItemizationsGrid.set("collection", widget.itemizedCharges);
					widget.chargeItemizationsGrid.refresh();
					widget.chargeItemizationsGrid.resize();
				};
				widget.ctrl.getAPI("getItemizedChargesList", info, callBack);
			}

		},
		refreshData: function (data) {
			var widget = this;
			widget.currentDateTime = widget.getFormattedDateTimeInET(new Date(), "YYYY-MM-DD H24:MI:SS");
			widget.lastModifiedDate = data.modifiedOn;
			widget.disableData(data);
			widget.showSpecificActions(data);
			if ((widget.data.caseDetails.billingSystem == "Lingo-ICE" || widget.data.caseDetails.billingSystem == "Lingo-ION") && widget.data.subStatus == "Pending Manual Billing") {
				domStyle.set(widget.WOBillingBtn.domNode, "display", "block");
			} else {
				domStyle.set(widget.WOBillingBtn.domNode, "display", "none");
			}
			if (!widget.isWOEditable()) {
				widget.WOEditBtn.set("disabled", true);
				widget.woActionBtn.set("disabled", true);
			} else {
				widget.WOEditBtn.set("disabled", false);
				widget.woActionBtn.set("disabled", false);
			}
			widget.populateData(data);
		},
		disableData: function (data) {
			var widget = this;

			widget.disableWidgets(widget.caseMgmtTable.domNode);
			widget.disableWidgets(widget.WOcontactInfoTable.domNode);
			widget.disableWidgets(widget.ccsWOMgmntTable.domNode);
			widget.disableWidgets(widget.fnWOMgmntTable.domNode);
			widget.disableWidgets(widget.carrierWOMgmntTable.domNode);
			widget.disableWidgets(widget.repairUpdatesTable.domNode);
			widget.disableWidgets(widget.locMgmntTable.domNode);
			// widget.disableWidgets(widget.FNDispatchTable.domNode);
			widget.disableWidgets(widget.payDetailsTable.domNode);
			widget.disableWidgets(widget.WOExpensesTable.domNode);
			widget.disableWidgets(widget.fieldTechInfoTable.domNode);
			widget.disableWidgets(widget.billingInfoTable.domNode);
			widget.disableWidgets(widget.WOEventInfoTable.domNode);
			widget.ccsaccessHours.set("disabled", true);
			widget.scopeOfWork.set("disabled", true);
			widget.resDescr.set("disabled", true);

			if (data.workOrderType == "Repair Field Nation Dispatch") {
				widget.fndispatchType.set("store", widget.dispatchTypeStore);
				widget.fnownerId.set("store", widget.agentStore.getAgentsByGroup("Field Ops"));
				domStyle.set(widget.FNSpecificDiv, "display", "block");
				domStyle.set(widget.fnWOMgmntTable.domNode, "display", "block");
			} else if (data.workOrderType == "Repair CCS Dispatch") {
				widget.ccsDispatchDate1.set("disabled", true);
				widget.ccsDispatchTime1.set("disabled", true);
				widget.ccsdispatchType.set("store", widget.dispatchTypeStore);
				widget.ccsownerId.set("store", widget.agentStore.getCombinedAgentsByGroups(["Field Ops", "Incident"]));
				domStyle.set(widget.ccsWOMgmntTable.domNode, "display", "block");
			} else if (data.workOrderType == "Carrier Dispatch") {
				widget.carrierDispatchDate1.set("disabled", true);
				widget.carrierDispatchTime1.set("disabled", true);
				widget.carrierdispatchType.set("store", widget.dispatchTypeStore);
				widget.carrierownerId.set("store", widget.agentStore.getAgentsByGroup("Incident"));
				widget.carrierstatus.set("store", this.statusStore.getWOStatusStore(widget.data.workOrderType));
				domStyle.set(widget.carrierWOMgmntTable.domNode, "display", "block");
			}

		},
		populateData: function (data) {
			var widget = this;
			widget.WONumSpan.innerHTML = data.workOrderNo;

			widget.setWidgetValues(widget.caseData, widget.caseMgmtTable.domNode);
			widget.setWidgetValues(data, widget.WOcontactInfoTable.domNode);
			widget.setWidgetValues(data, widget.repairUpdatesTable.domNode);
			widget.setWidgetValues(data, widget.billingInfoTable.domNode);
			widget.setWidgetValues(data, widget.WOEventInfoTable.domNode);
			widget.setWidgetValues(data, widget.locMgmntTable.domNode);
			widget.scopeOfWork.set("value", data.scopeOfWork);
			widget.resDescr.set("value", data.resDescr);
			widget.ccsaccessHours.set("value", data.accessHours);
			if (data.workOrderType == "Repair Field Nation Dispatch") {
				widget.setWidgetValues(data, widget.fnWOMgmntTable.domNode);
				widget.setWidgetValues(data, widget.fieldTechInfoTable.domNode);
				widget.setWidgetValues(data, widget.WOExpensesTable.domNode);
				widget.setFNInfo(data);
				// widget.setWidgetValues(data, widget.FNDispatchTable.domNode);
				widget.setWidgetValues(data, widget.payDetailsTable.domNode);
				if (widget.data.externalTktNum) {
					domStyle.set(widget.openFNBtn.domNode, "display", "block");
				}
				if (data.isEscalation == 1) {
					this.escalationEnabledDiv.innerHTML = "Escalated";
					domStyle.set(this.escalationEnabledDiv, "display", "flex");
				} else {
					domStyle.set(this.escalationEnabledDiv, "display", "none");
				}
				//button will be displayed if status is error
				if (data.status == "Error" && widget.isActionAllowed("wo-create", data.workOrderType)) {
					domStyle.set(widget.resendFNBtn.domNode, "display", "block");
				} else {
					domStyle.set(widget.resendFNBtn.domNode, "display", "none");
				}
			} else if (data.workOrderType == "Repair CCS Dispatch") {
				widget.setWidgetValues(data, widget.ccsWOMgmntTable.domNode);
				widget.setCCSInfo(data);
			} else if (data.workOrderType == "Carrier Dispatch") {
				widget.setWidgetValues(data, widget.carrierWOMgmntTable.domNode);
				widget.setCarrierInfo(data);
			}

			if (data.status == "Error") {
				if (data.errorMsg) {
					this.errorDiv.innerHTML = data.errorMsg;
					domStyle.set(this.errorDiv, "display", "flex");
				}
			} else {
				domStyle.set(this.errorDiv, "display", "none");
			}
		},
		enableDetails: function () {
			var widget = this;
			var foundInc = widget.foundInc;
			var foundFldOps = widget.foundFldOps;
			widget.resetButtons(1); //mode:1 edit mode
			if (!foundFldOps && !foundInc) {
				new messageWindow({
					title: 'NOTE',
					message: 'You are not an intended person to edit this work order. You must be under Field Ops or Repair group\n --THANK YOU--'
				});
				widget.resetButtons(0);
			}
			if (widget.data.workOrderType == "Repair Field Nation Dispatch") {
				if (foundInc || foundFldOps) {
					widget.openCode.set("disabled", false);
					widget.closeCode.set("disabled", false);
					widget.resDescr.set("disabled", false);
					widget.waiveDispatchFee.set("disabled", false);
					widget.isEscalation.set("disabled", false);
				}
				if (foundFldOps) {
					widget.fnownerId.set("disabled", false);
					widget.woCost.set("disabled", false);
				}

			} else if (widget.data.workOrderType == "Repair CCS Dispatch") {
				if (foundInc || foundFldOps) {
					widget.ccsdispatchType.set("disabled", false);
					widget.ccsexternalTktNum.set("disabled", false);
					//widget.ccsdispatchDate.set("disabled", false);
					widget.ccsDatePane.set("disabled", false);
					widget.ccsDispatchDate1.set("disabled", false);
					widget.ccsDispatchTime1.set("disabled", false);
					widget.ccsaccessHours.set("disabled", false);
					widget.waiveDispatchFee.set("disabled", false);
					widget.openCode.set("disabled", false);
					widget.closeCode.set("disabled", false);
					widget.resDescr.set("disabled", false);
					widget.scopeOfWork.set("disabled", false);
				}
				if (foundFldOps) {
					widget.ccsownerId.set("disabled", false);
					widget.woCost.set("disabled", false);
					widget.dispatchConName.set("disabled", false);
					widget.dispatchConNo.set("disabled", false);
					widget.dispatchEmail.set("disabled", false);
				}
			} else if (widget.data.workOrderType == "Carrier Dispatch") {
				if (foundInc) {
					widget.enableWidgets(widget.carrierWOMgmntTable.domNode);
					widget.carrierDispatchDate1.set("disabled", false);
					widget.carrierDispatchTime1.set("disabled", false);
					widget.resDescr.set("disabled", false);
					widget.carrierworkOrderType.set("disabled", true);
				}
			}
		},
		setFNInfo: function (data) {
			var widget = this;
			widget.fnworkOrderType.set("value", data.workOrderType);
			widget.fnqueueName.set("value", data.queueName);
			if (data.ownerId != 0)
				widget.fnownerId.set("value", data.ownerId);
			else
				widget.fnownerId.set("displayedValue", "");
			widget.fndispatchType.set("value", data.dispatchType);
			widget.fnexternalTktNum.set("value", data.externalTktNum);
			widget.fnstatus.set("value", data.status);
			widget.fnsubStatus.set("value", data.subStatus);
			widget.fnscheduleType.set("value", data.scheduleType);
			widget.fndispatchStart.set("value", data.dispatchStart);
			widget.fndispatchEnd.set("value", data.dispatchEnd);
			widget.fnhardStart.set("value", data.hardStart);
			widget.expwoCost.set("value", data.woCost);

			if (!widget.fnownerId.get('value') && data.ownerName != null) {
				widget.fnownerId.set('displayedValue', data.ownerName);
			}
		},
		setCCSInfo: function (data) {
			var widget = this;
			widget.workOrderType.set("value", data.workOrderType);
			widget.ccsqueueName.set("value", data.queueName);
			if (data.ownerId != 0)
				widget.ccsownerId.set("value", data.ownerId);
			else
				widget.ccsownerId.set("displayedValue", "");
			widget.ccsdispatchType.set("value", data.dispatchType);
			//widget.ccsdispatchDate.set("value", data.dispatchDate);
			if (data.dispatchDate) {
				var date = new Date(data.dispatchDate);
				widget.ccsDispatchDate1.set("value", date);
				// Set the time value
				var dTime = data.dispatchDate.split(' ')[1];
				var timeParts = dTime.split(':');
				var time = new Date();
				time.setHours(timeParts[0], timeParts[1], timeParts[2]);
				widget.ccsDispatchTime1.set("value", time);
			}
			widget.ccsexternalTktNum.set("value", data.externalTktNum);
			widget.ccsstatus.set("value", data.status);
			widget.ccssubStatus.set("value", data.subStatus);
			widget.ccsappId.set("value", data.appId);
			widget.ccsaccount.set("value", data.account);
			widget.ccsaccessHours.set("value", data.accessHours);

			if (!widget.ccsownerId.get('value') && data.ownerName != null) {
				widget.ccsownerId.set('displayedValue', data.ownerName);
			}
		},
		setCarrierInfo: function (data) {
			var widget = this;
			widget.carrierworkOrderType.set("value", data.workOrderType);
			widget.carrierqueueName.set("value", data.queueName);
			if (data.ownerId != 0)
				widget.carrierownerId.set("value", data.ownerId);
			else
				widget.carrierownerId.set("displayedValue", "");
			widget.carrierdispatchType.set("value", data.dispatchType);
			//widget.carrierdispatchDate.set("value", data.dispatchDate);
			if (data.dispatchDate) {
				var date = new Date(data.dispatchDate);
				widget.carrierDispatchDate1.set("value", date);
				// Set the time value
				var dTime = data.dispatchDate.split(' ')[1];
				var timeParts = dTime.split(':');
				var time = new Date();
				time.setHours(timeParts[0], timeParts[1], timeParts[2]);
				widget.carrierDispatchTime1.set("value", time);
			}
			widget.carrierName.set("value", data.carrierName);
			widget.carrierContactName.set("value", data.carrierContactName);
			widget.carrierexternalTktNum.set("value", data.externalTktNum);
			widget.carrierstatus.set("value", data.status);
			//widget.carriersubStatus.set("value", data.subStatus);
			widget.carrierSpclInstructions.set("value", data.specialInstructions);

			if (!widget.carrierownerId.get('value') && data.ownerName != null) {
				widget.carrierownerId.set('displayedValue', data.ownerName);
			}

		},
		isWOEditable: function () {
			var widget = this;
			//var canEdit = true;
			if (widget.data.status == "Closed" || widget.data.status == "Canceled" || widget.data.status == 'Error') {
				return false;
			}

			/* var foundInc = widget.foundInc;
			//console.log(foundInc);
			var foundFldOps = widget.foundFldOps;
			if (foundInc || foundFldOps) {
				canEdit = true;
			} */
			return true;
		},
		resetButtons: function (mode) {
			var widget = this;
			if (mode == 1) { //mode:1 edit mode
				widget.woActionBtn.set("disabled", true);
				widget.refreshBtn.set("disabled", true);
				domStyle.set(widget.WOEditBtn.domNode, "display", "none");
				domStyle.set(widget.WOSaveBtn.domNode, "display", "block");
				domStyle.set(widget.WODiscardBtn.domNode, "display", "block");
			} else if (mode == 0) { //mode:0 save mode
				widget.woActionBtn.set("disabled", false);
				widget.refreshBtn.set("disabled", false);
				domStyle.set(widget.WOEditBtn.domNode, "display", "block");
				domStyle.set(widget.WOSaveBtn.domNode, "display", "none");
				domStyle.set(widget.WODiscardBtn.domNode, "display", "none");
			}
		},
		postCreate: function () {
			var widget = this;
			if (widget.data) {
				widget.refreshData(widget.data);
			}

			if (widget.data.workOrderType != "Carrier Dispatch") {
				widget.billingSystem.set("value", widget.data.caseDetails.billingSystem);
			}

			setTimeout(function () {

				var actionMenu = widget.woActionMenu;
				var childItems = actionMenu.getChildren();
				var count = 0;

				childItems.forEach(element => {
					if (element.domNode.style.getPropertyValue("display") == "none") {
						count++;
					}
				});

				if (count == childItems.length) {
					domStyle.set(widget.woActionBtn.domNode, "display", "none");
				}
			}, 10);

			var Grid = declare([OnDemandGrid, Selection, Selector, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow]);
			var chargesLayout = [
				{ label: "Charge Type", field: "chargeType", width: 50 },
				{ label: "Sub Type", field: "subType", width: 50 },
				{ label: "Sub Total", field: "subTotal", width: 50 },
				{ label: "Client Charge", field: "clientCharge", width: 50 },
				{ label: "Description", field: "description", width: 90 },
				{ id: "action", label: 'Actions', field: 'action', width: 50, renderCell: lang.hitch(this, this.renderCIActions) }
			];

			widget.chargeItemizationsGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Items to Display!!",
				collection: widget.itemizedCharges,
				className: 'lingogrid',
				columns: chargesLayout,
				allowTextSelection: true,
				selectionMode: "single",
				rowSelector: '20px',
			}, widget.woChargeItemizationsDiv);

			widget.chargeItemizationsGrid.startup();
			widget.chargeItemizationsGrid.refresh();

			if (!widget.isActionAllowed("wo-delete-charge-item", widget.recordType)) {
				widget.chargeItemizationsGrid.toggleColumnHiddenState("action", true);
			}

			var notesLayout = [
				{ label: "Created ON", field: "createdDate", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Created By", field: "createdBy", width: 90 },
				{ label: "Created By Team", field: "createdByTeam", width: 90 },
				{ label: "Subject", field: "subject", width: 90 },
				{ label: "Comments", field: "noteText", width: 250 }
			];

			widget.notesGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Items to Display!!",
				collection: widget.notesStore,
				className: 'lingogrid',
				columns: notesLayout,
				allowTextSelection: true,
				selectionMode: "single",
				rowSelector: '20px',
			}, widget.woNotesDiv);


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
				collection: widget.woHistoryStore,
				className: 'lingogrid',
				columns: historyLayout,
				allowTextSelection: true,
				selectionMode: "single",
				rowSelector: '20px',
			}, widget.wohistoryDiv);


			var height = screen.height - 500;
			if (height < 200) {
				height = 200;
			}
			domStyle.set(widget.woNotesDiv, "height", height + "px")

			widget.notesGrid.startup();
			widget.notesGrid.refresh();

			on(widget.WOCloseBtn, "click", function () {
				widget.closeWindow();
			});

			on(widget.createICBtn, "click", function () {
				new ChargeItemizations({
					'lingoController': widget.ctrl,
					'info': widget.data
				});
			});

			/* on(widget.woAddChargesBtn, "click", function () {
				new ChargeItemizations({
					'lingoController': widget.ctrl,
					'info': widget.data
				});
			}); */


			on(widget.newNotesBtn, "click", function () {
				new AddWONotes({
					'lingoController': widget.ctrl,
					'info': widget.data
				});
			});


			/* on(widget.woAddNotesBtn, "click", function () {
				new AddWONotes({
					'lingoController': widget.ctrl,
					'info': widget.data
				});
			}); */

			on(widget.rescheduleBtn, "click", function () {
				new WOCancelReschedule({
					'lingoController': widget.ctrl,
					'info': widget.data,
					'actionName': "Reschedule"
				});
			});

			on(widget.completeWOBtn, "click", function () {
				new WOCompleteCancel({
					'lingoController': widget.ctrl,
					'info': widget.data,
					'actionName': "Complete"
				});
			});

			on(widget.closeWOBtn, "click", function () {
				if (widget.data.workOrderType == "Carrier Dispatch") {
					new CloseCarrierWO({
						'lingoController': widget.ctrl,
						'info': widget.data
					});
				} else {
					new CloseWorkOrder({
						'lingoController': widget.ctrl,
						'info': widget.data
					});
				}
			});

			on(widget.requestCancelWOBtn, "click", function () {
				if (widget.data.workOrderType == "Repair Field Nation Dispatch") {
					new WOCancelReschedule({
						'lingoController': widget.ctrl,
						'info': widget.data,
						'actionName': "Cancel"
					});
				}

			});

			on(widget.cancelWOBtn, "click", function () {
				if (widget.data.workOrderType == "Repair Field Nation Dispatch") {
					new CancelWorkOrder({
						'lingoController': widget.ctrl,
						'info': widget.data
					});
				} else if (widget.data.workOrderType == "Repair CCS Dispatch") {
					new WOCompleteCancel({
						'lingoController': widget.ctrl,
						'info': widget.data,
						'actionName': "Cancel"
					});
				}
			});

			on(widget.woChargesReloadBtn, "click", function () {
				widget.getItemizedCharges();
			});

			on(widget.woNotesReloadBtn, "click", function () {
				widget.getNotes();
			});

			on(widget.WOEditBtn, "click", function () {
				if (widget.WODetails.selected == false) {
					registry.byId(widget.viewWOTabContainer).selectChild(registry.byId(widget.WODetails));
				}
				widget.enableDetails();

			});

			on(widget.WODiscardBtn, "click", function () {
				//widget.disableDetails();
				widget.closeWindow();
				widget.viewWODetails(widget.data.workOrderNo, widget.ctrl, widget.data, widget.caseData);
			});

			on(widget.WOSaveBtn, "click", function () {

				widget.refresh(false);

				// setTimeout(function () {
				// 	widget.updateWO();
				// }, 2500);
			});
			on(widget.refreshBtn, "click", function () {
				var modifyView = true;
				widget.refresh(modifyView);
			})

			on(widget.openFNBtn, "click", function () {
				widget.openInFN();
			})

			on(widget.viewCaseBtn, "click", function () {
				widget.viewCaseDetails(widget.caseData.caseNumber, widget.ctrl, widget.caseData);
			});

			on(widget.resendFNBtn, "click", function () {
				new CreateWorkOrder({
					'lingoController': widget.ctrl,
					'info': widget.caseData,
					'woData': widget.data
				});
			});

			on(widget.WOBillingBtn, "click", function () {
				new WoManualBilling({
					'lingoController': widget.ctrl,
					'info': widget.caseData,
					'woData': widget.data
				});
			});

		},
		openInFN: function () {
			var fnURL = environment.fnURL + "/" + this.data.externalTktNum;
			window.open(fnURL);
		},
		refresh: function (modifyView) {
			var widget = this;
			var callback = function (obj) {
				if (modifyView == true) {
					widget.data = obj.data;
					widget.refreshData(obj.data);
				} else {
					widget.lastModifiedDate = obj.data.modifiedOn;
					widget.updateWO();
				}

			};
			widget.ctrl.getWorkOrderDetails(widget.info.id, callback);
		},
		getInfoToUpdate: function (info) {
			var widget = this;
			info.statusId = 0;
			info.subStatusId = 0;

			if (widget.data.workOrderType == "Repair Field Nation Dispatch") {
				widget.getFNInfo(info);
			} else if (widget.data.workOrderType == "Repair CCS Dispatch") {
				widget.getCCSInfo(info);
			} else if (widget.data.workOrderType == "Carrier Dispatch") {
				info.resDescr = widget.resDescr.get("value");
				widget.getCarrierInfo(info);
			}
		},
		getFNInfo: function (info) {
			var widget = this;

			info.openCode = widget.openCode.get("value");
			info.closeCode = widget.closeCode.get("value");
			info.resDescr = widget.resDescr.get("value");
			info.waiveDispatchFee = widget.waiveDispatchFee.checked == true ? 1 : 0;
			info.isEscalation = widget.isEscalation.checked == true ? 1 : 0;
			info.woCost = widget.woCost.get("value");
			info.ownerId = widget.fnownerId.get("value");
		},
		getCCSInfo: function (info) {
			var widget = this;

			info.dispatchType = widget.ccsdispatchType.get("value");
			info.externalTktNum = widget.ccsexternalTktNum.get("value");
			//info.dispatchDate = widget.ccsdispatchDate.get("value");
			if (widget.ccsDispatchDate1.get("displayedValue") && widget.ccsDispatchDate1.get("displayedValue") != "") {
				var date1 = widget.ccsDispatchDate1.get("displayedValue") + " " + widget.ccsDispatchTime1.get("displayedValue");
				var dt = new Date(date1);
				info.dispatchDate = widget.formatDate(dt, "YYYY-MM-DD H24:MI:SS");
				console.log(info.dispatchDate);
			}
			info.accessHours = widget.ccsaccessHours.get("value").trim();
			info.waiveDispatchFee = widget.waiveDispatchFee.checked == true ? 1 : 0;
			info.openCode = widget.openCode.get("value");
			info.closeCode = widget.closeCode.get("value");
			info.resDescr = widget.resDescr.get("value").trim();
			info.scopeOfWork = widget.scopeOfWork.get("value");

			info.ownerId = widget.ccsownerId.get("value");
			info.woCost = widget.woCost.get("value");
			info.dispatchConName = widget.dispatchConName.get("value");
			info.dispatchConNo = widget.dispatchConNo.get("value");
			info.dispatchEmail = widget.dispatchEmail.get("value");

			if (info.dispatchType) {
				info.dispatchTypeId = widget.ccsdispatchType.item.id;
			}
		},
		getCarrierInfo: function (info) {
			var widget = this;
			info.workOrderType = widget.carrierworkOrderType.get("value");
			info.queueName = widget.carrierqueueName.get("value");
			info.ownerId = widget.carrierownerId.get("value");
			info.dispatchType = widget.carrierdispatchType.get("value");
			if (info.dispatchType) {
				info.dispatchTypeId = widget.carrierdispatchType.item.id;
			}
			//info.dispatchDate = widget.carrierdispatchDate.get("value");
			if (widget.carrierDispatchDate1.get("displayedValue") && widget.carrierDispatchDate1.get("displayedValue") != "") {
				var date1 = widget.carrierDispatchDate1.get("displayedValue") + " " + widget.carrierDispatchTime1.get("displayedValue");
				var dt = new Date(date1);
				info.dispatchDate = widget.formatDate(dt, "YYYY-MM-DD H24:MI:SS");
				console.log(info.dispatchDate);
			}
			info.carrierName = widget.carrierName.get("value");
			info.carrierContactName = widget.carrierContactName.get("value");
			info.externalTktNum = widget.carrierexternalTktNum.get("value");
			info.status = widget.carrierstatus.get("value");
			info.specialInstructions = widget.carrierSpclInstructions.get("value").trim();
		},
		updateWO: function () {
			var widget = this;

			var diffInMs = date.difference(new Date(widget.lastModifiedDate), new Date(widget.currentDateTime), "millisecond");
			var diffInSec = diffInMs / (1000);

			if (diffInSec <= 0) {
				widget.resetButtons(0);
				widget.refresh(true);
				new messageWindow({
					title: "NOTE",
					message: "This work order was updated a while ago, refreshing the data... Please try again"
				});
				return;
			}
			var updateInfo = dojo.clone(widget.data);
			widget.getInfoToUpdate(updateInfo);
			//console.log(updateInfo);
			var callback = function (obj) {
				widget.ctrl.showSuccessMessage(obj);
				if (obj.response.code == 200) {
					widget.resetButtons(0);
				}
			}
			widget.ctrl.updateWorkOrder(updateInfo, lang.hitch(this, callback));
		},
		closeWindow: function () {
			var requestContentPane = registry.byId("wo_contentPane_" + this.data.workOrderNo);
			var caseNumber = this.formatCaseNumber(this.caseData.caseId);
			this.viewCaseDetails(caseNumber, this.ctrl, this.caseData);
			registry.byId("appTabContainer").removeChild(requestContentPane);
			requestContentPane.destroyRecursive();
			registry.byId("appTabContainer").startup();
		},
		showSpecificActions: function (data) {
			var widget = this;
			var type = data.workOrderType;
			if (type == "Carrier Dispatch") {
				domStyle.set(widget.billingInfoPanel.domNode, "display", "none");//billingInfo not required
				//Following actions are not required for Carrier
				domStyle.set(widget.createICBtn.domNode, "display", "none");
				domStyle.set(widget.newNotesBtn.domNode, "display", "none");//new notes
				domStyle.set(widget.rescheduleBtn.domNode, "display", "none");//reschcedule
				domStyle.set(widget.requestCancelWOBtn.domNode, "display", "none");//request for cancel wo 
				domStyle.set(widget.completeWOBtn.domNode, "display", "none"); //complete
				domStyle.set(widget.cancelWOBtn.domNode, "display", "none"); //cancel
				//Hiding Charge Itemizations and Notes tab 
				/* if (widget.woChargeItemizations.controlButton)
					domStyle.set(widget.woChargeItemizations.controlButton.domNode, "dispaly", "none");
				if (widget.woNotes.controlButton)
					domStyle.set(widget.woNotes.controlButton.domNode, "dispaly", "none"); */
				widget.woChargeItemizations.set("disabled", true);
				widget.woNotes.set("disabled", true);
			} else if (type == "Repair CCS Dispatch") {
				domStyle.set(widget.locMgmntPanel.domNode, "display", "none");//locationInfo not required
				//Following actions are not required for Carrier
				domStyle.set(widget.requestCancelWOBtn.domNode, "display", "none");//request for cancel wo
				domStyle.set(widget.rescheduleBtn.domNode, "display", "none");//reschedule
				if (data.status == "Awaiting Field Coordinator") {
					domStyle.set(widget.completeWOBtn.domNode, "display", "none");
					domStyle.set(widget.cancelWOBtn.domNode, "display", "none");
				}
			} else if (type == "Repair Field Nation Dispatch") {
				domStyle.set(widget.completeWOBtn.domNode, "display", "none");//complete
				if (data.status == "Awaiting Field Coordinator") {
					domStyle.set(widget.rescheduleBtn.domNode, "display", "none");
					domStyle.set(widget.requestCancelWOBtn.domNode, "display", "none");
				}
			}
			//Cancel / Reschedule(Field Nation Only) This button is only available for ARC Repair (Incident group)
			//Cancel Work Order (Field Nation Only): This button is only available to Field Ops
			//Complete/Cancel (CCS ONLY) Repair is the only profiles who has this option.

		},
		renderCIActions: function (data, value, cell) {
			var widget = this;
			var w = new Button({
				label: "Delete",
				action: "wo-delete-charge-item",
				recordType: widget.recordType,
				onClick: function () {
					var info = { "chargeItemizationId": data.ciId };
					var callback = function (obj) {
						if (obj.response.code == 200) {
							topic.publish("/workOrder/ItemizedChargeUpdated-" + widget.data.id, obj);
							new messageWindow({
								title: "Success",
								message: "Successfully deleted an Itemized Charge"
							});
							widget.itemizedCharges.removeSync(data.ciId);
							widget.chargeItemizationsGrid.set("collection", widget.itemizedCharges);
							widget.chargeItemizationsGrid.refresh();
							widget.chargeItemizationsGrid.resize();
						} else {
							new messageWindow({
								title: "Error",
								message: obj.response.message
							});
						}
					};
					var myDialog = new ConfirmDialog({
						title: "Delete the Itemized Charge ",
						content: "Do you really want to delete the charge?",
						style: "width: 300px",
						onExecute: function () {
							widget.ctrl.deleteAPI("deleteItemizedCharges", info, callback);
						}
					});
					myDialog.show();
				}
			}, cell.appendChild(document.createElement("div")));
			w._destroyOnRemove = true;
			return w;
		},
		handleOnClose: function () {
			var widget = this;
			if (widget.refreshBtn.disabled == true) {
				if (registry.byId("wo_contentPane_" + widget.data.workOrderNo)) {
					registry.byId("appTabContainer").selectChild("wo_contentPane_" + widget.data.workOrderNo);
				}
				var myDialog = new ConfirmDialog({
					title: "Closing Work Order Tab - " + widget.data.workOrderNo,
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
			if (this.handle3)
				this.handle3.remove();
			if (this.handle4)
				this.handle4.remove();
		}
	});

});

