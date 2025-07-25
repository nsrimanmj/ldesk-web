define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/registry",
	"dijit/layout/ContentPane",
	"dojo/store/Memory",
	"dstore/Memory",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-style",
	"dojo/on",
	"dijit/Dialog",
	"dojox/widget/TitleGroup",
	"dijit/TitlePane",
	"app/model/Status",
	"app/model/Origin",
	"app/widgets/viewReport",
	"app/view/messageWindow",
	"dojo/query",
	"dojo/dom",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/Selector",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	'dgrid/CellSelection',
	"app/view/summaryRow",
	"dojox/form/CheckedMultiSelect",
	"dojo/keys",
	"dstore/legacy/DstoreAdapter",
	"dojo/topic",
	"app/model/States",
	"app/model/miniStores",
	"app/model/WOStatus",
	"dojo/text!app/widgets/templates/create_report.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, ContentPane, Memory, StoreMemory, lang, arrayUtil, domStyle, on, Dialog, TitleGroup, TitlePane,
	StatusStore, OriginStore, ViewReport, messageWindow, query, dom, OnDemandGrid, Selection, Selector, DijitRegistry, ColumnResizer,
	ColumnReorder, ColumnHider, Keyboard, CellSelection, SummaryRow, CheckedMultiSelect, keys, DstoreAdapter, topic, States, MiniStores, WOStatusStore, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.statusStore = new StatusStore();
			var originStore = new OriginStore();
			widget.miniStores = new MiniStores();
			widget.woStatusStore = new WOStatusStore();
			var originData = dojo.clone(originStore.getOriginData());
			widget.originStore = new Memory({
				idProperty: "name",
				data: originData
			});
			this.ctrl = this.lingoController;
			widget.reportData = [];
			this.reportId = this.info.id;
			if (this.reportId == null) {
				this.reportId = "new";
			}

			this.folderStore = new Memory({
				data: []
			});

			this.categoryStore = new Memory({
				data: []
			});


			this.folderList = this.ctrl.folderList;
			if (!this.folderList) {
				this.ctrl.getFolderList();
			}
			this.folderGroupList = this.ctrl.folderGroupList;

			this.accountStore = new StoreMemory({
				idProperty: "accountId",
				data: []
			});

			widget.profileStore = new Memory({
				idProperty: 'name',
				data: []
			});

		},
		setValueToAny: function (widget, value) {
			if (!value) {
				widget.set("value", "Any");
			}
		},
		setQueueStore: function (groupName) {
			var widget = this;
			var response = widget.ctrl.availableQueues;
			/* if (groupName == 'Incident') {
				groupId = 3;
			}
			else if (groupName == 'Inquiry') {
				groupId = 4;
			}
			else if (groupName == 'Network') {
				groupId = 7;
			}
			else if (groupName == 'Field Ops') {
				groupId = 24;
			} 
			var queueList = [];
			queueList = response.filter(function (response) {
				return response.groupId == groupId;
			});*/

			return response;
		},
		setUpdateData: function () {
			var widget = this;
			var reportInfo = this.info;
			var reportConfig = reportInfo.config;
			var reportData = reportInfo.data;
			var filter = {};
			var type = reportConfig.type;

			if (!type) {
				type = "Case";
			}

			if (type) {
				this.reportType.set("value", type);
				this.reportType.set("disabled", true);
			}

			if (reportConfig.filterConfig) {
				filter = JSON.parse(reportConfig.filterConfig);
				this.filter = filter;
			}

			if (type == "Case") {
				if (filter.recordType && !filter.recordTypeList) {
					filter.recordTypeList = [filter.recordType];
				}

				if (filter.category && !filter.categoryList) {
					filter.categoryList = [filter.category];
				}

				if (filter.queue && !filter.queueList) {
					filter.queueList = [filter.queue];
				}

				if (filter.status && !filter.statusList) {
					filter.statusList = [filter.status];
				}

				if (filter.subStatus && !filter.subStatusList) {
					filter.subStatusList = [filter.subStatus];
				}

				if (filter.origin && !filter.originList) {
					filter.originList = [filter.origin];
				}

				this.recordTypeList.set("value", filter.recordTypeList);
				this.categoryList.set("value", filter.categoryList);
				this.queueList.set("value", filter.queueList);
				this.statusList.set("value", filter.statusList);
				this.subStatusList.set("value", filter.subStatusList);
				this.srvStateList.set("value", filter.srvStateList);
				this.accountType.set("value", filter.accountType);
				this.createdDateType.set("value", filter.createdDateType);
				this.createdXDays.set("value", filter.createdXDays);
				this.createdFrom.set("value", filter.createdFrom);
				this.createdTo.set("value", filter.createdTo);
				this.accountId.set("value", filter.accountId);
				this.closedDateType.set("value", filter.closedDateType);
				this.closedXDays.set("value", filter.closedXDays);
				this.closedFrom.set("value", filter.closedFrom);
				this.closedTo.set("value", filter.closedTo);
				this.originList.set("value", filter.originList);

				//this.setValueToAny(this.status, filterConfig.status);
				//this.setValueToAny(this.recordType, filterConfig.recordType);
				//this.setValueToAny(this.origin, filterConfig.origin);
				//this.setValueToAny(this.category, filterConfig.category);
				this.setValueToAny(this.createdDateType, filter.createdDateType);
				this.setValueToAny(this.closedDateType, filter.closedDateType);
				this.setValueToAny(this.accountType, filter.accountType);
			}

			if (type == "User Activity") {
				this.profileList.set("value", filter.profileList);
				this.dateType.set("value", filter.dateType);
				this.dateXDays.set("value", filter.dateXDays);
				this.dateFrom.set("value", filter.dateFrom);
				this.dateTo.set("value", filter.dateTo);
			}

			if (type == "Work Order" || type == "WO Charge Itemization") {
				if (filter.recordType && !filter.recordTypeList) {
					filter.recordTypeList = [filter.recordType];
				}

				if (filter.dispatchType && !filter.dispatchTypeList) {
					filter.dispatchTypeList = [filter.dispatchType];
				}

				if (filter.status && !filter.statusList) {
					filter.statusList = [filter.status];
				}

				if (filter.subStatus && !filter.subStatusList) {
					filter.subStatusList = [filter.subStatus];
				}

				if (filter.billingSystem && !filter.billingSystemList) {
					filter.billingSystemList = [filter.billingSystem];
				}

				this.recordList.set("value", filter.recordTypeList);
				this.dispatchList.set("value", filter.dispatchTypeList);
				this.woStatusList.set("value", filter.statusList);
				this.woSubStatusList.set("value", filter.subStatusList);
				this.billingSystem.set("value", filter.billingSystemList);
				this.createdwoDateType.set("value", filter.createdDateType);
				this.createdwoXDays.set("value", filter.createdXDays);
				this.woCreatedFrom.set("value", filter.createdFrom);
				this.woCreatedTo.set("value", filter.createdTo);
				this.accountId1.set("value", filter.accountId);
				this.closedwoDateType.set("value", filter.closedDateType);
				this.closedwoXDays.set("value", filter.closedXDays);
				this.woClosedFrom.set("value", filter.closedFrom);
				this.woClosedTo.set("value", filter.closedTo);
				this.disCreatedWoDateType.set("value", filter.dispatchDateType);
				this.dispatchWoXDays.set("value", filter.dispatchXDays);
				this.disWoCreatedFrom.set("value", filter.dispatchFrom);
				this.disWoCreatedTo.set("value", filter.dispatchTo);

				this.setValueToAny(this.createdwoDateType, filter.createdDateType);
				this.setValueToAny(this.closedwoDateType, filter.closedDateType);
				this.setValueToAny(this.disCreatedWoDateType, filter.dispatchDateType);
			}

			if (type == "Task") {
				if (filter.category && !filter.categoryList) {
					filter.categoryList = [filter.category];
				}

				if (filter.status && !filter.statusList) {
					filter.statusList = [filter.status];
				}

				if (filter.queue && !filter.queueList) {
					filter.queueList = [filter.queue];
				}

				this.categoryList.set("value", filter.categoryList);
				this.statusList.set("value", filter.statusList);
				this.queueList.set("value", filter.queueList);
				this.taskCreatedDateType.set("value", filter.createdDateType);
				this.taskCreatedXDays.set("value", filter.createdXDays);
				this.taskCreatedFrom.set("value", filter.createdFrom);
				this.taskCreatedTo.set("value", filter.createdTo);
				this.accountId2.set("value", filter.accountId);
				this.taskClosedDateType.set("value", filter.closedDateType);
				this.taskClosedXDays.set("value", filter.closedXDays);
				this.taskClosedFrom.set("value", filter.closedFrom);
				this.taskClosedTo.set("value", filter.closedTo);

				this.setValueToAny(this.taskCreatedDateType, filter.createdDateType);
				this.setValueToAny(this.taskClosedDateType, filter.closedDateType);

			}
			this.summaryConfig = {};
			if (reportConfig.summaryConfig) {
				this.summaryConfig = JSON.parse(reportConfig.summaryConfig);
				this.includeSummary.set("value", this.summaryConfig.include)
			}

			this.chartConfig = {};
			if (reportConfig.chartConfig) {
				this.chartConfig = JSON.parse(reportConfig.chartConfig);
				this.includeChart.set("value", this.chartConfig.include)
			}

			this.detailsConfig = {};
			if (reportConfig.detailsConfig) {
				this.detailsConfig = JSON.parse(reportConfig.detailsConfig);
				this.includeDetails.set("value", this.detailsConfig.include)
			}

			if (!this.isClone) {
				this.reportName.set("value", reportConfig.name);
			}

			domStyle.set(widget.previewDiv.domNode, "display", "block");
			domStyle.set(widget.filterPane.domNode, "display", "none");
			//domStyle.set(widget.buttonDiv, "display", "block");
			widget.saveBtn.set("disabled", false);

			if (this.isClone) {
				this.reportTitleSpan.innerHTML = "Clone Report";
			} else {
				this.reportTitleSpan.innerHTML = "Edit Report";
			}

			this.reportNameSpan.innerHTML = reportConfig.name;
			this.reportIdSpan.innerHTML = this.formatId(this.info.id);
			widget.reportData = dojo.clone(reportData);
			this.filter = filter;
			widget.setReportData();
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {

		},
		getProfileList: function () {

			var widget = this;
			var callback = function (obj) {
				widget.profileStore.setData(obj.data);
				widget.profileList.set("store", widget.profileStore);

				if (widget.isUpdate && widget.filter) {
					widget.profileList.set("value", widget.filter.profileList);
				}
			}

			this.ctrl.getAPI("profileList", {}, callback);

		},
		clearTableContainer: function (tableContainerAttachPoint) {
			var tableContainer = tableContainerAttachPoint;
			if (tableContainer) {
				tableContainer.getChildren().forEach(function (widget) {
					if (widget.declaredClass === "dojox.form.CheckedMultiSelect") {
						query("input[type=checkbox]", widget.containerNode).forEach(function (checkbox) {
							checkbox.checked = false;
						});
						// Update the widget's value
						widget._updateSelection();
					}

				});
			}
		},
		postCreate: function () {
			var widget = this;
			this.inherited(arguments);

			widget.saveBtn.set("disabled", true);

			var statusStore = dojo.clone(this.statusStore.getStatusStore());
			widget.statusList.set("store", statusStore);

			var taskStore = dojo.clone(this.statusStore.getTaskStatusStore());
			widget.taskstatusList.set("store", taskStore);

			widget.originList.set("store", widget.originStore);

			widget.profileList.set("store", widget.profileStore);
			widget.recordList.set("store", widget.miniStores.getWORecordType());
			widget.billingSystem.set("store", widget.miniStores.getBillingSystem());
			widget.taskcategoryList.set("store", widget.miniStores.getCategory());
			widget.taskqueueList.set("store", widget.miniStores.getQueue());
			widget.getProfileList();

			var agentData = this.ctrl.agentStore.getStore();
			var data = agentData.data.filter(dataRow => { return dataRow.loginName == window.localStorage.getItem("agent") });

			if (data.length > 0) {
				groupData = data[0].groups;
			}
			var groupStore = new Memory({
				data: []
			});

			if (groupData && groupData.length > 0) {
				groupData.forEach(function (group) {
					if (group.groupName.includes('Admin')) return;
					groupStore.add({ id: group.groupName, name: group.groupName });
				});
			}
			widget.recordTypeList.set("store", groupStore);
			widget.categoryList.set("store", widget.categoryStore);

			if (widget.info) {
				var reportInfo = widget.info;
				var reportConfig = reportInfo.config;
				var filter = {};
				if (reportConfig && reportConfig.filterConfig) {
					filter = JSON.parse(reportConfig.filterConfig);
					if (filter.category && !filter.categoryList) {
						filter.categoryList = [filter.category];
					}

					if (filter.queue && !filter.queueList) {
						filter.queueList = [filter.queue];
					}

					if (filter.status && !filter.statusList) {
						filter.statusList = [filter.status];
					}
					widget.taskcategoryList.set("value", filter.categoryList);
					widget.taskqueueList.set("value", filter.queueList);
					widget.taskstatusList.set("value", filter.statusList);
				}
			}


			on(widget.closeWindowBtn, "click", function () {
				//registry.byId("appTabContainer").selectChild(registry.byId("controlPanelContentPane"));
				registry.byId("appTabContainer").selectChild(registry.byId("reportsTab"));
				registry.byId("appTabContainer").removeChild(widget.contentPane);
				widget.contentPane.destroyRecursive();

				if (widget.isUpdate || widget.isClone) {
					widget.viewReportDetails({ id: widget.reportId }, widget.ctrl)
				}
			})

			on(widget.previewBtn, "click", function () {
				widget.getPreviewData();
			})

			on(widget.showFilterBtn, "click", function () {
				domStyle.set(widget.previewDiv.domNode, "display", "none");
				domStyle.set(widget.filterPane.domNode, "display", "block");
				//domStyle.set(widget.buttonDiv, "display", "none");
				widget.saveBtn.set("disabled", true);
			})

			var agentId = JSON.parse(window.localStorage.getItem("agentId"));

			on(widget.folderGroup, "change", function () {
				var group = widget.folderGroup.get("value");
				widget.folderList = widget.ctrl.folderList;
				var folderList = widget.folderList.filter(function (item) {
					if (item.groupName != group) {
						return false;
					}
					if (group == "Private" && item.createdBy != agentId) {
						return false;
					}
					return true;
				})

				widget.folderStore.setData(folderList);
				widget.folderName.set("value", "");
			});
			on(widget.saveBtn, "click", function () {

				widget.folderGroup.set("store", widget.folderGroupList);
				widget.folderName.set("store", widget.folderStore);
				var reportInfo = widget.info;
				var reportConfig = reportInfo.config;

				if (widget.isUpdate) {
					widget.folderGroup.set("value", reportConfig.folderGroup);
					setTimeout(function () {
						widget.folderName.set("value", reportConfig.folderId);
					}, 50)
				} else {
					widget.saveReportForm.reset();
					widget.folderGroup.set("value", "Private");
					if (widget.info.groupName) {
						widget.folderGroup.set("value", widget.info.groupName);
					}

					setTimeout(function () {
						if (widget.info.folderId) {
							widget.folderName.set("value", widget.info.folderId);
						}
					}, 50)

				}

				widget.saveReportDlg.show();

			});

			on(widget.cancelSaveBtn, "click", function () {
				widget.saveReportDlg.hide();
			});

			on(widget.submitBtn, "click", function () {
				widget.saveReport();
			})

			on(widget.showSearchBtn, "click", function () {
				widget.searchName.reset();
				widget.accountStore.setData([]);
				widget.searchGrid.refresh();
				widget.searchAccountDlg.show();
			})

			on(widget.showSearchBtn1, "click", function () {
				widget.searchName.reset();
				widget.accountStore.setData([]);
				widget.searchGrid.refresh();
				widget.searchAccountDlg.show();
			})

			on(widget.showSearchBtn2, "click", function () {
				widget.searchName.reset();
				widget.accountStore.setData([]);
				widget.searchGrid.refresh();
				widget.searchAccountDlg.show();
			})

			on(widget.addBtn, "click", function () {
				widget.accountType.set("value", widget.selAccountType.get("value"));
				widget.accountId.set("value", widget.selAccountId.get("value"));
				widget.searchAccountDlg.hide();
			})

			on(widget.accountId, "change, paste", function () {
				var accountType = widget.accountType.get("value");
				if (accountType == "Any") {
					widget.accountType.set("value", "accountId");
				}

				var val = widget.accountId.get("value");
				if (val == "") {
					widget.accountType.set("value", "Any");
				}
			});

			on(widget.addBtn, "click", function () {
				widget.accountId1.set("value", widget.selAccountId.get("value"));
				widget.searchAccountDlg.hide();
			})
			on(widget.accountId1, "change, paste", function () {
				var val = widget.accountId1.get("value");
				widget.accountId1.set("value", val);

			});
			on(widget.addBtn, "click", function () {
				widget.accountId2.set("value", widget.selAccountId.get("value"));
				widget.searchAccountDlg.hide();
			})
			on(widget.accountId2, "change, paste", function () {
				var val = widget.accountId2.get("value");
				widget.accountId2.set("value", val);

			});
			on(widget.searchBtn, "click", function () {
				widget.searchAccount();
			})

			on(widget.cancelSearchBtn, "click", function () {
				widget.searchAccountDlg.hide();
			});

			on(widget.createdDateType, "change", function () {
				var value = widget.createdDateType.get("value");

				if (value != "xDays") {
					widget.createdXDays.set("value", "");
					widget.createdXDays.set("disabled", true);
				}
				if (value != "range") {
					widget.createdFrom.set("value", null);
					widget.createdTo.set("value", null);
					widget.createdFrom.set("disabled", true);
					widget.createdTo.set("disabled", true);
				}
				if (value == "xDays") {
					widget.createdXDays.set("disabled", false);
					widget.createdXDays.focus();
				}

				if (value == "range") {
					widget.createdFrom.set("disabled", false);
					widget.createdFrom.focus();
					widget.createdTo.set("disabled", false);
				}
			});

			on(widget.closedDateType, "change", function () {
				var value = widget.closedDateType.get("value");
				if (value != "xDays") {
					widget.closedXDays.set("value", "");
					widget.closedXDays.set("disabled", true);
				}
				if (value != "range") {
					widget.closedFrom.set("value", null);
					widget.closedTo.set("value", null);
					widget.closedFrom.set("disabled", true);
					widget.closedTo.set("disabled", true);
				}
				if (value == "xDays") {
					widget.closedXDays.set("disabled", false);
					widget.closedXDays.focus();
				}

				if (value == "range") {
					widget.closedFrom.set("disabled", false);
					widget.closedFrom.focus();
					widget.closedTo.set("disabled", false);
				}
			});
			on(widget.createdwoDateType, "change", function () {
				var value = widget.createdwoDateType.get("value");

				if (value != "xDays") {
					widget.createdwoXDays.set("value", "");
					widget.createdwoXDays.set("disabled", true);
				}
				if (value != "range") {
					widget.woCreatedFrom.set("value", null);
					widget.woCreatedTo.set("value", null);
					widget.woCreatedFrom.set("disabled", true);
					widget.woCreatedTo.set("disabled", true);
				}
				if (value == "xDays") {
					widget.createdwoXDays.set("disabled", false);
					widget.createdwoXDays.focus();
				}

				if (value == "range") {
					widget.woCreatedFrom.set("disabled", false);
					widget.woCreatedFrom.focus();
					widget.woCreatedTo.set("disabled", false);
				}
			});

			on(widget.closedwoDateType, "change", function () {
				var value = widget.closedwoDateType.get("value");
				if (value != "xDays") {
					widget.closedwoXDays.set("value", "");
					widget.closedwoXDays.set("disabled", true);
				}
				if (value != "range") {
					widget.woClosedFrom.set("value", null);
					widget.woClosedTo.set("value", null);
					widget.woClosedFrom.set("disabled", true);
					widget.woClosedTo.set("disabled", true);
				}
				if (value == "xDays") {
					widget.closedwoXDays.set("disabled", false);
					widget.closedwoXDays.focus();
				}

				if (value == "range") {
					widget.woClosedFrom.set("disabled", false);
					widget.woClosedFrom.focus();
					widget.woClosedTo.set("disabled", false);
				}
			});
			on(widget.disCreatedWoDateType, "change", function () {
				var value = widget.disCreatedWoDateType.get("value");
				if (value != "xDays") {
					widget.dispatchWoXDays.set("value", "");
					widget.dispatchWoXDays.set("disabled", true);
				}
				if (value != "range") {
					widget.disWoCreatedFrom.set("value", null);
					widget.disWoCreatedTo.set("value", null);
					widget.disWoCreatedFrom.set("disabled", true);
					widget.disWoCreatedTo.set("disabled", true);
				}
				if (value == "xDays") {
					widget.dispatchWoXDays.set("disabled", false);
					widget.dispatchWoXDays.focus();
				}

				if (value == "range") {
					widget.disWoCreatedFrom.set("disabled", false);
					widget.disWoCreatedFrom.focus();
					widget.disWoCreatedTo.set("disabled", false);
				}
			});
			on(widget.taskCreatedDateType, "change", function () {
				var value = widget.taskCreatedDateType.get("value");

				if (value != "xDays") {
					widget.taskCreatedXDays.set("value", "");
					widget.taskCreatedXDays.set("disabled", true);
				}
				if (value != "range") {
					widget.taskCreatedFrom.set("value", null);
					widget.taskCreatedTo.set("value", null);
					widget.taskCreatedFrom.set("disabled", true);
					widget.taskCreatedTo.set("disabled", true);
				}
				if (value == "xDays") {
					widget.taskCreatedXDays.set("disabled", false);
					widget.taskCreatedXDays.focus();
				}

				if (value == "range") {
					widget.taskCreatedFrom.set("disabled", false);
					widget.taskCreatedFrom.focus();
					widget.taskCreatedTo.set("disabled", false);
				}
			});

			on(widget.taskClosedDateType, "change", function () {
				var value = widget.taskClosedDateType.get("value");
				if (value != "xDays") {
					widget.taskClosedXDays.set("value", "");
					widget.taskClosedXDays.set("disabled", true);
				}
				if (value != "range") {
					widget.taskClosedFrom.set("value", null);
					widget.taskClosedTo.set("value", null);
					widget.taskClosedFrom.set("disabled", true);
					widget.taskClosedTo.set("disabled", true);
				}
				if (value == "xDays") {
					widget.taskClosedXDays.set("disabled", false);
					widget.taskClosedXDays.focus();
				}

				if (value == "range") {
					widget.taskClosedFrom.set("disabled", false);
					widget.taskClosedFrom.focus();
					widget.taskClosedTo.set("disabled", false);
				}
			});
			on(widget.chartSettingsBtn, "click", function () {
				var nl = $("#createGchart");
				if (nl) {
					nl.trigger("dblclick");
				}
			});

			on(widget.cancelDetailsBtn, "click", function () {
				widget.detailsDlg.hide();
			});

			on(widget.statusList, "change", function () {
				var statusList = widget.statusList.get("value");
				var store = new Memory({
					idProperty: "name",
					data: []
				});

				var data = [];

				if (statusList) {
					statusList.forEach(status => {
						var id = widget.statusStore.getStatusIdByName(status);
						var inStore = dojo.clone(widget.statusStore.getSubStatusStore(id));
						var inData = inStore.data;
						data = data.concat(inData);
					})
				}

				data = data.filter((obj, index, self) =>
					index === self.findIndex((o) => o.id === obj.id)
				);

				store.setData(data);

				if (store.data.length == 0) {
					widget.subStatusList.set("value", []);
					widget.subStatusList.set("disabled", true);
				} else {
					widget.subStatusList.set("disabled", false);
				}
				widget.subStatusList.set("store", store);

				//set the values to subStatus list if there is data in filter
				if (widget.info) {
					var reportInfo = widget.info;
					var reportConfig = reportInfo.config;
					var filter = {};
					if (reportConfig && reportConfig.filterConfig) {
						filter = JSON.parse(reportConfig.filterConfig);

						if (filter.subStatus && !filter.subStatusList) {
							filter.subStatusList = [filter.subStatus];
						}
						widget.subStatusList.set("value", filter.subStatusList);
					}
				}
			});

			//widget.category.set("disabled", true);
			on(widget.recordTypeList, "change", function () {
				var recordTypeList = widget.recordTypeList.get("value");
				var catStore = new Memory({
					'idProperty': 'categoryName',
					'data': []
				});
				var queStore = new Memory({
					'idProperty': 'queueName',
					'data': []
				});

				var data = [];
				var queData = [];
				if (recordTypeList) {
					recordTypeList.forEach(item => {
						var store = dojo.clone(widget.ctrl.getCategoryStore(item));
						var queStore = widget.setQueueStore(item);
						var inData = store.data;
						data = data.concat(inData);
						queData = queData.concat(queStore);
					})
				}

				data = data.filter((obj, index, self) =>
					index === self.findIndex((o) => o.id === obj.id)
				);

				queData = queData.filter((obj, index, self) =>
					index === self.findIndex((o) => o.queueName === obj.queueName)
				);

				catStore.setData(data);
				queStore.setData(queData);
				if (catStore.data.length == 0) {
					widget.categoryList.set("value", "");
					widget.categoryList.set("disabled", true);
				} else {
					widget.categoryList.set("disabled", false);
				}
				if (queStore.data.length == 0) {
					widget.queueList.set("value", "");
					widget.queueList.set("disabled", true);
				} else {
					widget.queueList.set("disabled", false);
				}
				widget.categoryList.set("store", catStore);
				widget.queueList.set("store", queStore);
				//set the values to category and queue lists if there is data in filter
				if (widget.info) {
					var reportInfo = widget.info;
					var reportConfig = reportInfo.config;
					var filter = {};
					if (reportConfig && reportConfig.filterConfig) {
						filter = JSON.parse(reportConfig.filterConfig);
						if (filter.category && !filter.categoryList) {
							filter.categoryList = [filter.category];
						}

						if (filter.queue && !filter.queueList) {
							filter.queueList = [filter.queue];
						}
						widget.categoryList.set("value", filter.categoryList);
						widget.queueList.set("value", filter.queueList);
					}
				}
			});
			var recordList;
			on(widget.recordList, "change", function () {
				recordList = widget.recordList.get("value");
				var dispatchData = widget.ctrl.dispatchTypeInfo;
				var dispatchDataList = [];
				var dispatchFilterData = [];
				var woStatusList = [];
				var woStatusData = [];
				var dispatchStore = new Memory({
					'idProperty': 'dispatchType',
					'data': []
				});
				var woTypeStatusStore = new Memory({
					'idProperty': 'name',
					'data': []
				});
				if (recordList) {
					recordList.forEach(item => {
						var dispatchTypeList = dojo.clone(dispatchData);
						dispatchFilterData = dispatchTypeList.filter(function (dispatchTypeList) {
							return dispatchTypeList.workOrderType == item;
						});
						dispatchDataList = dispatchDataList.concat(dispatchFilterData);
						woStatusList = widget.woStatusStore.data.status;
						woStatusList = woStatusList.filter(function (woStatusList) {
							return woStatusList.woType == item;
						});

						woStatusData = woStatusData.concat(woStatusList);

					});
				}
				dispatchDataList = dispatchDataList.filter((obj, index, self) =>
					index === self.findIndex((o) => o.dispatchType === obj.dispatchType)
				);
				woStatusData = woStatusData.filter((obj, index, self) =>
					index === self.findIndex((o) => o.name === obj.name)
				);
				dispatchStore.setData(dispatchDataList);
				widget.dispatchList.set("store", dispatchStore);
				woTypeStatusStore.setData(woStatusData);
				widget.woStatusList.set("store", woTypeStatusStore);
				if (widget.info) {
					var reportInfo = widget.info;
					var reportConfig = reportInfo.config;
					var filter = {};
					if (reportConfig && reportConfig.filterConfig) {
						filter = JSON.parse(reportConfig.filterConfig);
						if (filter.dispatchType && !filter.dispatchTypeList) {
							filter.dispatchTypeList = [filter.dispatchType];
						}

						if (filter.status && !filter.statusList) {
							filter.statusList = [filter.status];
						}
						widget.dispatchList.set("value", filter.dispatchTypeList);
						widget.woStatusList.set("value", filter.statusList);
					}
				}

				if (recordList != null && recordList.length > 0) {
					widget.disCreatedWoDateType.set("disabled", false);
				}

			});

			on(widget.woStatusList, "change", function () {
				var woStatusList = widget.woStatusList.get("value");
				var woSubStatusList = [];
				var woSubStatusData = [];
				var woSubStatusStore = new Memory({
					'idProperty': 'name',
					'data': []
				});
				if (recordList) {
					recordList.forEach(item1 => {
						if (woStatusList) {
							woStatusList.forEach(item => {
								woSubStatusList = widget.woStatusStore.data.subStatus;
								var statusId = widget.woStatusStore.getWoStatusIdByName(item, item1);
								woSubStatusList = woSubStatusList.filter(function (woSubStatusList) {
									return woSubStatusList.statusId == statusId;
								});
								woSubStatusData = woSubStatusData.concat(woSubStatusList);

							});
						}
					});
				}
				woSubStatusData = woSubStatusData.filter((obj, index, self) =>
					index === self.findIndex((o) => o.name === obj.name)
				);
				woSubStatusStore.setData(woSubStatusData);
				widget.woSubStatusList.set("store", woSubStatusStore);
				if (widget.info) {
					var reportInfo = widget.info;
					var reportConfig = reportInfo.config;
					var filter = {};
					if (reportConfig && reportConfig.filterConfig) {
						filter = JSON.parse(reportConfig.filterConfig);

						if (filter.subStatus && !filter.subStatusList) {
							filter.subStatusList = [filter.subStatus];
						}
						widget.woSubStatusList.set("value", filter.subStatusList);
					}
				}
			});



			on(widget.reportType, "change", function () {
				var type = widget.reportType.get("value");

				if (type == "Case") {
					domStyle.set(widget.caseFilterDiv, "display", "block");
					domStyle.set(widget.userFilterDiv, "display", "none");
					domStyle.set(widget.woFilterDiv, "display", "none");
					domStyle.set(widget.taskFilterDiv, "display", "none");
					if (widget.reportType.get("disabled") == false) {
						widget.caseReportForm.reset();
						widget.clearTableContainer(widget.filterDiv1);
						widget.accountId.set("value", "");
					}


				}

				if (type == "User Activity") {
					domStyle.set(widget.caseFilterDiv, "display", "none");
					domStyle.set(widget.userFilterDiv, "display", "block");
					domStyle.set(widget.woFilterDiv, "display", "none");
					domStyle.set(widget.taskFilterDiv, "display", "none");
					if (widget.reportType.get("disabled") == false) {
						widget.userReportForm.reset();
						widget.clearTableContainer(widget.filterDiv2);
					}


				}
				if (type == "Work Order" || type == "WO Charge Itemization") {
					domStyle.set(widget.caseFilterDiv, "display", "none");
					domStyle.set(widget.userFilterDiv, "display", "none");
					domStyle.set(widget.woFilterDiv, "display", "block");
					domStyle.set(widget.taskFilterDiv, "display", "none");
					if (widget.reportType.get("disabled") == false) {
						widget.woReportForm.reset();
						widget.clearTableContainer(widget.filterDiv3);
						widget.accountId1.set("value", "");
					}

				}
				if (type == "Task") {
					domStyle.set(widget.caseFilterDiv, "display", "none");
					domStyle.set(widget.userFilterDiv, "display", "none");
					domStyle.set(widget.woFilterDiv, "display", "none");
					domStyle.set(widget.taskFilterDiv, "display", "block");
					if (widget.reportType.get("disabled") == false) {
						widget.taskReportForm.reset();
						widget.clearTableContainer(widget.filterDiv4);
					}

				}
			});

			on(widget.dateType, "change", function () {
				var value = widget.dateType.get("value");
				if (value != "xDays") {
					widget.dateXDays.set("value", "");
					widget.dateXDays.set("disabled", true);
				}
				if (value != "range") {
					widget.dateFrom.set("value", null);
					widget.dateTo.set("value", null);
					widget.dateFrom.set("disabled", true);
					widget.dateTo.set("disabled", true);
				}
				if (value == "xDays") {
					widget.dateXDays.set("disabled", false);
					widget.dateXDays.focus();
				}

				if (value == "range") {
					widget.dateFrom.set("disabled", false);
					widget.dateFrom.focus();
					widget.dateTo.set("disabled", false);
				}
			});

			if (this.isUpdate) {
				setTimeout(function () {
					widget.setUpdateData();
				}, 10)
			}
			on(widget.createdFrom, "change", function (value) {
				widget.createdTo.set("constraints", {
					min: value
				});
			});
			on(widget.closedFrom, "change", function (value) {
				widget.closedTo.set("constraints", {
					min: value
				});
			});
			on(widget.dateFrom, "change", function (value) {
				widget.dateTo.set("constraints", {
					min: value
				});
			});
			on(widget.woCreatedFrom, "change", function (value) {
				widget.woCreatedTo.set("constraints", {
					min: value
				});
			});
			on(widget.woClosedFrom, "change", function (value) {
				widget.woClosedTo.set("constraints", {
					min: value
				});
			});
			on(widget.disWoCreatedFrom, "change", function (value) {
				widget.disWoCreatedTo.set("constraints", {
					min: value
				});
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
			}, widget.searchResultDiv);

			widget.searchGrid.on('dgrid-select', function (event) {
				// Get the rows that were just selected
				var grid = widget.searchGrid;
				var cell = event.cells[0];
				var accountType = cell.column.field;
				if (cell.row.data[accountType]) {
					widget.addBtn.set("disabled", false);
				}
				widget.selAccountType.set("value", accountType);
				widget.selAccountId.set("value", cell.row.data[accountType]);
			});
			widget.searchGrid.on('dgrid-deselect', function (event) {
				widget.selAccountType.set("value", " ");
				widget.selAccountId.set("value", "");
				widget.addBtn.set("disabled", true);
			});

			on(widget.searchName, "keypress", function (event) {
				if (event.keyCode === keys.ENTER) {
					widget.searchAccount();
				}
			})

			var statesModel = new States();
			var statesStore = statesModel.getStates();
			statesStore.remove(" ");
			widget.srvStateList.set("store", statesStore);

		},
		allowCellSelect: function (row) {
			//console.log(row);
			if (!row.column) return true;
			if (row.column && row.column.allowSelect) {
				return true;
			}
			return false;
		},
		searchAccount: function () {
			var widget = this;

			this.accountStore.setData([]);

			var callback = function (obj) {
				widget.accountStore.setData(obj.data);
				widget.searchGrid.refresh();
			}

			var accountName = this.searchName.get("value");
			if (accountName == "") {
				widget.searchName.focus();
				return;
			}

			if (!this.searchName.isValid()) {
				widget.searchName.focus();
				return;
			}

			var req = {
				"searchKey": 'customerName',
				"searchValue": widget.ctrl.encodeSearchValue(accountName),
				"regExpFlag": true,
				"activeOnlyFlag": true
			}

			this.ctrl.getAPI("search", req, callback);
		},
		saveReport: function () {
			var widget = this;
			if (!this.saveReportForm.validate()) return;

			var reportConfig = this.pivot.getReport();

			delete reportConfig.dataSource.data;
			var chartConfig = this.pivot.getOptions().chart;

			var rows = [];
			if (reportConfig.slice && reportConfig.slice.row) {
				reportConfig.slice.rows.forEach(element => {
					rows.push(element.uniqueName);
				});
			}

			var summaryConfig = reportConfig;
			summaryConfig.include = widget.includeSummary.get("value") ? true : false;

			chartConfig.include = widget.includeChart.get("value") ? true : false;

			var detailsConfig = {};
			detailsConfig.groupBy = rows;
			detailsConfig.include = widget.includeDetails.get("value") ? true : false;

			var filterConfig = {};
			filterConfig = this.filter;
			var agentId = JSON.parse(window.localStorage.getItem("agentId"));
			var req = {
				name: this.reportName.get("value"),
				type: this.reportType.get("value"),
				folderId: this.folderName.get("value"),
				createdBy: agentId,
				modifiedBy: agentId,
				summaryConfig: JSON.stringify(summaryConfig),
				chartConfig: JSON.stringify(chartConfig),
				detailsConfig: JSON.stringify(detailsConfig),
				filterConfig: JSON.stringify(filterConfig)
			}
			var callback = function (obj) {
				widget.ctrl.showSuccessMessage(obj);
				widget.saveReportDlg.hide();
				//registry.byId("appTabContainer").selectChild(registry.byId("controlPanelContentPane"));
				registry.byId("appTabContainer").selectChild(registry.byId("reportsTab"));
				registry.byId("appTabContainer").removeChild(widget.contentPane);
				widget.contentPane.destroyRecursive();
				var id = obj.data.id;
				if (widget.isUpdate) {
					id = widget.info.id;
				}
				widget.ctrl.getFolderList();
				widget.viewReportDetails({ id: id }, widget.ctrl);
				if (widget.isClone) {
					widget.viewReportDetails({ id: obj.data.id }, widget.ctrl);
				}
			}

			if (widget.isUpdate && !widget.isClone) {
				req.id = this.info.id;
				this.ctrl.putAPI("report", req, callback);
			} else {
				this.ctrl.postAPI("report", req, callback);
			}

		},
		setReportData: function () {

			var widget = this;

			var defaultConfig = {
				formats: [
					{
						thousandsSeparator: ","
					}
				],
				options: {
					configuratorButton: true,
					showDefaultSlice: false,
					showHeaders: true,
					drillThrough: true,
					defaultDateType: "date",
					grid: {
						type: "classic"
					},
					chart: {
						position: "right"
					}

				},
				slice: {
					"rows": [
						{ uniqueName: "recordType" }
					],
					"columns": [

					],
					"measures": [
						{
							"uniqueName": "Total Records",
							"formula": "count(\"caseNumber\") ",
							"caption": "Total Records"
						}
					],
					expandAll: true
				}
			}

			var fmConfig = defaultConfig;

			var type = widget.reportType.get('value');
			if (type == "User Activity") {
				fmConfig.slice.rows = [
					{ uniqueName: "userName" }
				]

				fmConfig.slice.measures = [
					{
						"uniqueName": "caseOpenCount",
						"grandTotalCaption": "Case Open Count"
					},
					{
						"uniqueName": "caseCloseCount",
						"grandTotalCaption": "Case Close Count"
					},
					{
						"uniqueName": "intNoteCount",
						"grandTotalCaption": "Internal Note Count"
					},
					{
						"uniqueName": "pubNoteCount",
						"grandTotalCaption": "Public Note Count"
					},
					{
						"uniqueName": "emailCount",
						"grandTotalCaption": "Email Count"
					},
					{
						"uniqueName": "woOpenCount",
						"grandTotalCaption": "Work Order Count"
					}

				]

				fmConfig.mapping = {
					"activityDate": {
						type: "date string"
					}
				};

				fmConfig.options.datePattern = "yyyy-MM-dd"

			}
			if (type == "Work Order") {
				fmConfig.slice.rows = [
					{ uniqueName: "workOrderType" }
				]
				fmConfig.slice.measures = [
					{
						"uniqueName": "Total Work Orders",
						"formula": "count(\"workOrderNo\") ",
						"caption": "Total Work Orders"
					}
				]

			}
			if (type == "WO Charge Itemization") {
				fmConfig.slice.rows = [
					{ uniqueName: "workOrderType" }
				]
				fmConfig.slice.measures = [
					{
						"uniqueName": "Total Charge Itemizations",
						"formula": "count(\"workOrderNo\") ",
						"caption": "Total Charge Types"
					}
				]

			}
			if (type === "Task") {

				fmConfig.slice = {
					rows: [
						{ uniqueName: "category" },
						{ uniqueName: "taskId" },
						{ uniqueName: "accountId" },
						{ uniqueName: "caseNumber" }
					],
					measures: [
						{
							uniqueName: "Total Tasks",
							formula: 'count("taskNumber")',
							caption: "Total Tasks"
						}
					]
				};


				fmConfig.mapping = {
					taskId: {
						type: "number",
						aggregation: "none"
					},
					caseNumber: {
						type: "number",
						aggregation: "none"
					},
					accountId: {
						type: "String",
						aggregation: "none"
					},
					taskNumber: {
						type: "string"
					},
					category: {
						type: "string"
					}
				};
			}
			else if (type == "User Activity") {
				fmConfig.mapping = {
					"createdDate": {
						type: "date"
					},
					"closedDate": {
						type: "date"
					}
				};
			}


			if (this.summaryConfig) {
				fmConfig = this.summaryConfig;

			}



			fmConfig.options.chart.showDataLabels = false;
			fmConfig.options.chart.showLegend = false;

			fmConfig.dataSource = {
				data: widget.reportData
			}

			var height = screen.height - 480;
			widget.pivot = new Flexmonster({
				container: "#pivotReport_" + this.reportId,
				componentFolder: "external/flexmonster/",
				toolbar: true,
				height: height,
				beforetoolbarcreated: lang.hitch(this, customizeToolbar),
				report: fmConfig,
				licenseKey: environment.fmKey
			});

			function customizeToolbar(toolbar) {
				var widget = this;
				// Get all tabs from the Toolbar
				let tabs = toolbar.getTabs();
				toolbar.getTabs = function () {
					// Delete the Connect tab
					tabs = tabs.filter(tab => tab.id !== "fm-tab-connect");
					tabs = tabs.filter(tab => tab.id !== "fm-tab-save");
					tabs = tabs.filter(tab => tab.id !== "fm-tab-open");
					tabs = tabs.filter(tab => tab.id !== "fm-tab-export");

					// Add a new tab
					tabs.splice(8, 0, {
						// An attribute that is used for CSS styling
						id: "fm-tab-details",
						// The tab’s label
						title: "Details",
						// A  function that handles clicks on this tab
						handler: lang.hitch(widget, detailsHandler),
						// An HTML element with a tab icon
						// You can choose an icon defined in flexmonster.toolbar.js
						icon: "<img src='images/view_details_icon.png' style='padding: 10px;width: 50px;height: 50px;' alt='View Details'/>"
					});

					return tabs;
				}

			}

			function detailsHandler() {
				//widget.detailsTable.setData(widget.reportData);
				var type = this.reportType.get("value");
				if (type == "Case") {
					this.detailsTable.setColumns(this.caseColumns)
				}

				if (type == "User Activity") {
					this.detailsTable.setColumns(this.userColumns)
				}

				if (type == "Work Order") {
					this.detailsTable.setColumns(this.workOrderColumns)
				}

				if (type == "WO Charge Itemization") {
					this.detailsTable.setColumns(this.woChargeItemColumns)
				}

				if (type == "Task") {
					this.detailsTable.setColumns(this.taskColumns);
				}

				widget.detailsDlg.show();
			}

			var filterStr = this.getFilterStr(this.filter);
			this.filterStrDiv.innerHTML = filterStr;

			var groupBy = [];

			if (this.detailsConfig && this.detailsConfig.hasOwnProperty("groupBy")) {
				groupBy = this.detailsConfig.groupBy;
			}

			this.caseColumns = [
				{ title: "Created Date", field: "createdDate", width: 150, responsive: 0 },
				{ title: "Case Number", field: "caseNumber", width: 150, responsive: 0 },
				{ title: "Account Id", field: "accountId", width: 150, responsive: 0 },
				{ title: "Record Type", field: "recordType", width: 150, responsive: 0 },
				{ title: "Queue", field: "queue", width: 150, responsive: 1 },
				{ title: "Category", field: "category", width: 150, responsive: 1 },
				{ title: "Type", field: "type", width: 150, responsive: 1 },
				{ title: "Subtype", field: "subtype", width: 150, responsive: 1 },
				{ title: "Status", field: "status", width: 150, responsive: 2 },
				{ title: "Sub Status", field: "subStatus", width: 150, responsive: 2 },
				{ title: "Case Origin", field: "origin", width: 150, responsive: 2 },
				{ title: "Service Number", field: "serviceNumber", width: 150, responsive: 3 },
				{ title: "Closed Date", field: "closedDate", width: 150, responsive: 2 },
				{ title: "Subject", field: "subject", width: 200, responsive: 3 },
				{ title: "Owner", field: "ownerName", width: 150, responsive: 3 },
				{ title: "Shift Group", field: "shiftGroup", width: 200, responsive: 3 },
				{ title: "Contact Name", field: "contactName", width: 150, responsive: 3 },
				{ title: "Contact Email", field: "contactEmail", width: 150, responsive: 3 },
				{ title: "Contact Phone", field: "contactPhone", width: 150, responsive: 3 },
				{ title: "Source", field: "source", width: 150, responsive: 3 },
				{ title: "First Call Resolution ", field: "fcr", width: 200, responsive: 3 },
				{ title: "Total Open Time", field: "totalOpenTime", width: 150, responsive: 3 },
				{ title: "Closed By", field: "closedBy", width: 200, responsive: 3 },
				{ title: "Account Name", field: "accountName", width: 150, responsive: 3 },
				{ title: "Resolution Tier 1", field: "resolutionTier1", width: 150, responsive: 3 },
				{ title: "Resolution Tier 2", field: "resolutionTier2", width: 150, responsive: 3 },
				{ title: "Post Mortem", field: "postMortem", width: 150, responsive: 3 },
				{ title: "Account State", field: "accountState", width: 150, responsive: 3 },
				{ title: "Service Number Billing Type", field: "servBillingType", width: 150, responsive: 3 },
				{ title: "Service State", field: "serviceState", width: 150, responsive: 3 },
				{ title: "Service Priority", field: "servicePriority", width: 150, responsive: 3 }
			];

			this.userColumns = [
				{
					title: "Activity Date", field: "activityDate", width: 150, responsive: 0, formatter: function (cell, formatterParams, onRendered) {
						return widget.formatDateStr(cell.getValue(), "YYYY-MM-DD");
					}
				},
				{ title: "User Id", field: "userId", width: 150, responsive: 0 },
				{ title: "User Name", field: "userName", width: 150, responsive: 0 },
				{ title: "Shift Group", field: "shiftGroup", width: 150, responsive: 0 },
				{ title: "Profile Name", field: "profileName", width: 150, responsive: 0 },
				{ title: "Record Type", field: "recordType", width: 150, responsive: 0 },
				{ title: "Case Open Count", field: "caseOpenCount", width: 150, responsive: 1 },
				{ title: "Case Close Count", field: "caseCloseCount", width: 150, responsive: 1 },
				{ title: "Internal Note Count", field: "intNoteCount", width: 150, responsive: 1 },
				{ title: "Public Note Count", field: "pubNoteCount", width: 150, responsive: 1 },
				{ title: "Email Count", field: "emailCount", width: 150, responsive: 1 },
				{ title: "Work Order Count", field: "woOpenCount", width: 150, responsive: 1 }
			];

			this.workOrderColumns = [
				{ title: "Work Order Record Type", field: "workOrderType", width: 150, responsive: 0 },
				{ title: "Case Service Number", field: "serviceNumber", width: 150, responsive: 0 },
				{ title: "Account Name", field: "account", width: 150, responsive: 0 },
				{ title: "Account : Migration Source", field: "billingSystem", width: 150, responsive: 0 },
				{ title: "Work Order Number", field: "workOrderNo", width: 150, responsive: 1 },
				{ title: "Waive Dispatch Fee", field: "waiveDispatchFee", width: 150, responsive: 1 },
				{ title: "Apply Charges to Billing", field: "applyCharges2Billing", width: 150, responsive: 1 },
				{ title: "Charges Applied to Billing", field: "billing", width: 150, responsive: 1 },
				{ title: "Client Charge", field: "clientCharge", width: 150, responsive: 2 },
				{ title: "Time Log Hours", field: "timeLogHours", width: 150, responsive: 2 },
				{ title: "Labor Total", field: "laborTotal", width: 150, responsive: 2 },
				{ title: "Materials Total", field: "materialsTotal", width: 150, responsive: 3 },
				{ title: "Penalties / Fees total", field: "penalties", width: 150, responsive: 2 },
				{ title: "Billing Charge Note", field: "billChargeNote", width: 200, responsive: 3 },
				{ title: "Sub-Status", field: "subStatus", width: 150, responsive: 3 },
				{ title: "Status", field: "status", width: 200, responsive: 3 },
				{ title: "Dispatch Type", field: "dispatchType", width: 150, responsive: 3 },
				{ title: "External Ticket Number", field: "externalTktNum", width: 150, responsive: 3 },
				{ title: "Dispatch Date/ETR", field: "dispatchDate", width: 150, responsive: 3 },
				{ title: "Dispatch Start Date", field: "dispatchStart", width: 150, responsive: 3 },
				{ title: "Dispatch End Date ", field: "dispatchEnd", width: 200, responsive: 3 },
				{ title: "Service Address", field: "serviceAddress", width: 150, responsive: 3 },
				{ title: "Queue", field: "queueName", width: 200, responsive: 3 },
				{ title: "Work Order Owner", field: "ownerName", width: 150, responsive: 3 },
				{ title: "Primary Dispatch Contact Name", field: "dispatchConName", width: 150, responsive: 3 },
				{ title: "Primary Dispatch Contact #", field: "dispatchConNo", width: 150, responsive: 3 },
				{ title: "Primary Dispatch Contact Email", field: "dispatchEmail", width: 150, responsive: 3 },
				{ title: "Open Code", field: "openCode", width: 150, responsive: 3 },
				{ title: "Close Code", field: "closeCode", width: 150, responsive: 3 },
				{ title: "Resolution Description", field: "resDescr", width: 150, responsive: 3 },
				{ title: "Created By", field: "createdUser", width: 150, responsive: 3 },
				{ title: "Created Date", field: "createdOn", width: 150, responsive: 3 },
				{ title: "Closed By", field: "closedUser", width: 150, responsive: 3 },
				{ title: "Closed Date", field: "closedOn", width: 150, responsive: 3 },
				{ title: "Pay Type", field: "payType", width: 150, responsive: 3 },
				{ title: "Work Order Cost", field: "woCost", width: 150, responsive: 3 },
				{ title: "Total Billed to Site", field: "totalBill", width: 150, responsive: 3 },
				{ title: "Itemized Total", field: "itemizedTotal", width: 150, responsive: 3 },
				{ title: "Rate", field: "rate", width: 150, responsive: 3 },
				{ title: "FN Labor Cost", field: "fnLaborCost", width: 150, responsive: 3 },
				{ title: "Expenses", field: "expenses", width: 150, responsive: 3 },
			];

			this.woChargeItemColumns = [
				{ title: "Work Order Record Type", field: "workOrderType", width: 150, responsive: 0 },
				{ title: "Work Order Number", field: "workOrderNo", width: 150, responsive: 0 },
				{ title: "Wo-Charge Itemization Name", field: "chargeItemName", width: 150, responsive: 0 },
				{ title: "Apply Charges to Client", field: "applyCharges2Client", width: 150, responsive: 0 },
				{ title: "Charge Type", field: "chargeType", width: 150, responsive: 1 },
				{ title: "Sub-Type", field: "subType", width: 150, responsive: 1 },
				{ title: "1/2 Hour Rate", field: "halfHourRate", width: 150, responsive: 1 },
				{ title: "1st Hour Rate", field: "firstHourRate", width: 150, responsive: 1 },
				{ title: "Client Charge", field: "clientCharge", width: 150, responsive: 1 },
				{ title: "Created By : Full Name", field: "createdBy", width: 150, responsive: 1 },
				{ title: "Created Date", field: "createdDate", width: 150, responsive: 0 },
				{ title: "Item Description", field: "description", width: 150, responsive: 0 },
				{ title: "Labor Hours Quoted", field: "laborHrsQuoted", width: 150, responsive: 0 },
				{ title: "Markup", field: "markup", width: 150, responsive: 0 },
				{ title: "Material Cost", field: "materialCost", width: 150, responsive: 1 },
				{ title: "Quoted Amount", field: "quotedAmount", width: 150, responsive: 1 },
				{ title: "Subtotal", field: "subTotal", width: 150, responsive: 1 },
				{ title: "Total Labor Hours", field: "totalLaborHrs", width: 150, responsive: 1 },
				{ title: "Account", field: "accountName", width: 150, responsive: 1 },
				{ title: "Account : Migration Source", field: "billingSystem", width: 150, responsive: 1 },
				{ title: "Case Number", field: "caseId", width: 150, responsive: 0 },
				{ title: "Case Service Number", field: "serviceNumber", width: 150, responsive: 1 },
				{ title: "Status", field: "status", width: 150, responsive: 1 },
				{ title: "Sub-Status", field: "subStatus", width: 150, responsive: 1 },
				{ title: "Dispatch Type", field: "dispatchType", width: 150, responsive: 1 },
				{ title: "Closed Date", field: "closedOn", width: 150, responsive: 1 },
				{ title: "Closed By : Full Name", field: "closedUser", width: 150, responsive: 1 },
				{ title: "External Ticket Number", field: "externalTktNum", width: 150, responsive: 1 },
				{ title: "Apply Charges to Billing", field: "applyCharges2Billing", width: 150, responsive: 1 },
				{ title: "Charges Applied to Billing", field: "billing", width: 150, responsive: 1 },
				{ title: "Waive Dispatch Fee", field: "waiveDispatchFee", width: 150, responsive: 1 },
				{ title: "Work Order Owner", field: "ownerName", width: 150, responsive: 1 }

			];

			this.taskColumns = [
				{ title: "Task Number", field: "taskNumber", width: 150, responsive: 0 },
				{ title: "Category", field: "category", width: 150, responsive: 0 },
				{ title: "Type", field: "type", width: 150, responsive: 0 },
				{ title: "Queue", field: "queue", width: 150, responsive: 0 },
				{ title: "Owner", field: "owner", width: 150, responsive: 1 },
				{ title: "Status", field: "status", width: 150, responsive: 1 },
				{ title: "Description", field: "description", width: 150, responsive: 1 },
				{ title: "Resolution", field: "resolution", width: 150, responsive: 1 },
				{ title: "Created By", field: "createdBy", width: 150, responsive: 2 },
				{ title: "Created Date", field: "createdDate", width: 150, responsive: 2 },
				{ title: "Closed By", field: "closedBy", width: 150, responsive: 2 },
				{ title: "Closed Date", field: "closedDate", width: 150, responsive: 3 },
				{ title: "Case Number", field: "caseNumber", width: 200, responsive: 3 },
				{ title: "Case Category", field: "caseCategory", width: 150, responsive: 3 },
				{ title: "Case Sub-Type", field: "caseSubType", width: 200, responsive: 3 },
				{ title: "Case Account Name", field: "caseAccountName", width: 150, responsive: 3 },
				{ title: "Case Account ID", field: "accountId", width: 150, responsive: 3 }
			];
			widget.detailsTable = new Tabulator("#detailsTable_" + this.reportId, {
				height: "650px",
				data: widget.reportData,
				layout: "fitColumns",
				downloadRowRange: "all",
				groupBy: groupBy,
				columns: widget.caseColumns
			});

		},
		getPreviewData: function () {
			var widget = this;

			if (!this.reportPreviewForm.validate()) {
				return
			};

			var callback = function (obj) {

				if (obj.data == null || obj.data.length == 0) {
					new messageWindow({
						message: "No Data found!",
						title: "Note"
					});
					return;
				}
				domStyle.set(widget.previewDiv.domNode, "display", "block");
				domStyle.set(widget.filterPane.domNode, "display", "none");
				widget.saveBtn.set("disabled", false);
				widget.reportData = dojo.clone(obj.data);
				widget.setReportData();

			}
			var type = this.reportType.get("value");
			var filter = {};
			var api = "previewReport"
			if (type == "Case") {
				filter.recordTypeList = this.recordTypeList.get("value");
				filter.queueList = this.queueList.get("value");
				filter.categoryList = this.categoryList.get("value");
				filter.statusList = this.statusList.get("value");
				filter.subStatusList = this.subStatusList.get("value");
				filter.srvStateList = this.srvStateList.get("value");
				filter.accountType = this.accountType.get("value");
				filter.createdDateType = this.createdDateType.get("value");
				filter.createdXDays = this.createdXDays.get("value");
				filter.createdFrom = this.createdFrom.get("value");
				filter.createdTo = this.createdTo.get("value");
				filter.accountId = this.accountId.get("value");
				filter.closedDateType = this.closedDateType.get("value");
				filter.closedXDays = this.closedXDays.get("value");
				filter.closedFrom = this.closedFrom.get("value");
				filter.closedTo = this.closedTo.get("value");
				filter.originList = this.originList.get("value");
			}

			if (type == "User Activity") {
				filter.profileList = this.profileList.get("value");
				filter.dateType = this.dateType.get("value");
				filter.dateFrom = this.dateFrom.get("value");
				filter.dateTo = this.dateTo.get("value");
				filter.dateXDays = this.dateXDays.get("value");
				api = "previewUserActivityReport"
			}

			if (type == "Work Order" || type == "WO Charge Itemization") {
				if (type == "Work Order") {
					api = "previewWorkOrderReport";
				}
				if (type == "WO Charge Itemization") {
					api = "previewWoChargeReport";
				}
				filter.recordTypeList = this.recordList.get("value");
				filter.dispatchTypeList = this.dispatchList.get("value");
				filter.statusList = this.woStatusList.get("value");
				filter.subStatusList = this.woSubStatusList.get("value");
				filter.billingSystemList = this.billingSystem.get("value");
				filter.accountId = this.accountId1.get("value");
				filter.createdDateType = this.createdwoDateType.get("value");
				filter.closedDateType = this.closedwoDateType.get("value");
				filter.createdXDays = this.createdwoXDays.get("value");
				filter.closedXDays = this.closedwoXDays.get("value");
				filter.createdFrom = this.woCreatedFrom.get("value");
				filter.createdTo = this.woCreatedTo.get("value");
				filter.closedFrom = this.woClosedFrom.get("value");
				filter.closedTo = this.woClosedTo.get("value");
				filter.dispatchDateType = this.disCreatedWoDateType.get("value");
				filter.dispatchXDays = this.dispatchWoXDays.get("value");
				filter.dispatchFrom = this.disWoCreatedFrom.get("value");
				filter.dispatchTo = this.disWoCreatedTo.get("value");
				var isFn = arrayUtil.indexOf(filter.recordTypeList, "Repair Field Nation Dispatch");
				var isCCS = arrayUtil.indexOf(filter.recordTypeList, "Repair CCS Dispatch");
				var isCarrier = arrayUtil.indexOf(filter.recordTypeList, "Carrier Dispatch");
				var isOnlyFn;
				var isFnInc;
				var isCarrierCCS;
				if ((isFn !== -1) && (isCCS !== -1 || isCarrier !== -1)) {
					filter.isFnInc = "true";
				}
				if ((isFn !== -1) && (isCCS == -1 && isCarrier == -1)) {
					filter.isOnlyFn = "true";
				}
				if ((isFn == -1) && (isCCS !== -1 || isCarrier !== -1)) {
					filter.isCarrierCCS = "true";
				}

			}

			if (type == "Task") {
				api = "previewTaskReport"

				filter.categoryList = this.taskcategoryList.get("value");
				filter.statusList = this.taskstatusList.get("value");
				filter.queueList = this.taskqueueList.get("value");
				filter.createdDateType = this.taskCreatedDateType.get("value");
				filter.createdFrom = this.taskCreatedFrom.get("value");
				filter.createdTo = this.taskCreatedTo.get("value");
				filter.createdXDays = this.taskCreatedXDays.get("value");
				filter.closedDateType = this.taskClosedDateType.get("value");
				filter.closedFrom = this.taskClosedFrom.get("value");
				filter.closedTo = this.taskClosedTo.get("value");
				filter.closedXDays = this.taskClosedXDays.get("value");
				filter.accountId = this.accountId2.get("value");
			}



			this.filter = filter;

			for (var key in filter) {
				if (filter.hasOwnProperty(key)) {
					var value = filter[key];
					if (value == "" || value == "-1" || value == "All" || value == "Any") {
						filter[key] = null;
					}
				}
			}

			this.ctrl.postAPI(api, filter, callback);
		},
		getFilterStr: function (filterConfig) {
			var values = [];
			for (const key in filterConfig) {
				if (filterConfig[key] != null) {
					values.push(key + "=" + filterConfig[key]);
				}
			}
			return values.join(', ');
		},
		destroy: function () {
			this.saveReportDlg.destroyRecursive();
			this.searchAccountDlg.destroyRecursive();
			this.detailsDlg.destroyRecursive();
			this.inherited(arguments);

			//this.pivot.dispose();

		}
	});

});
