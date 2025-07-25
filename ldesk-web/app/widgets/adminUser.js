define([
	"dojo/_base/declare",
	"dojo/parser",
	"dojo/on",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojox/widget/TitleGroup",
	"dijit/TitlePane",
	"dijit/Fieldset",
	"dijit/ConfirmDialog",
	"dijit/form/RadioButton",
	"dgrid/OnDemandGrid",
	"dojox/grid/EnhancedGrid",
	"dgrid/Selection",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	"app/view/summaryRow",
	"dstore/Memory",
	"dojo/_base/array",
	"dojo/json",
	"dojo/topic",
	"app/view/messageWindow",
	"app/widgets/adminAddUser",
	"app/widgets/adminEditUser",
	"app/widgets/adminEditGroup",
	"app/widgets/adminResetPassword",
	"app/widgets/lingoChangeHistory",
	"dijit/form/FilteringSelect",
	"dstore/legacy/DstoreAdapter",
	"dojo/text!app/widgets/templates/admin_user.html",
	"dojo/domReady!"
], function (declare, parser, on, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, domStyle, TitleGroup, TitlePane, Fieldset, ConfirmDialog, RadioButton, OnDemandGrid, EnhancedGrid, Selection, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, Memory, arrayUtil, json, topic, messageWindow, AddUser, EditUser, EditGroup, AdminResetPassword, lingoChangeHistory, FilteringSelect, DstoreAdapter, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			widget.agentLevel = 1;
			widget.escalationDuty = 'No';
			widget.users = new Memory({
				idProperty: 'loginName',
				data: []
			});

			widget.availableGroups = new Memory({
				idProperty: 'groupName',
				data: []
			});

			widget.selectedGroups = new Memory({
				idProperty: 'groupName',
				data: []
			});

			widget.availableQueues = new Memory({
				idProperty: 'queueID',
				data: []
			});

			widget.selectedQueues = new Memory({
				idProperty: 'queueID',
				data: []
			});

			widget.groupSelectList = new DstoreAdapter(new Memory({
				idProperty: 'groupName',
				data: []
			}));

			this.handle1 = topic.subscribe("lingoController/EditUser", lang.hitch(this, function (obj) {
				this.updateAvailableUsers(obj);
			}));

			this.handle2 = topic.subscribe("lingoController/updateGroup", lang.hitch(this, function (obj) {
				this.updateGroup(obj);
			}));

			this.handle3 = topic.subscribe("lingoController/addUser", lang.hitch(this, function (obj) {
				this.getUsers(obj.users);
			}));

		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {

		},
		getUsers: function (data) {
			var widget = this;
			var activeOnly = this.filterActiveOnly.get("value");
			if (data) {
				var info = {
					loginName: data[0].loginName
				}
			} else {
				if (!widget.findUser.value)
					return;
				var info = {
					loginName: widget.findUser.get("value").trim(),
					activeOnly : activeOnly
				}
			}
			widget.ctrl.getUsers(info, lang.hitch(this, widget.populateUsers));
			return;
		},
		getAllUsers: function () {
			var widget = this;
			var info = {activeOnly : this.filterActiveOnly.get("value")};
			widget.ctrl.getUsers(info, lang.hitch(this, widget.populateUsers));
			return;
		},
		populateUsers: function (data, action) {
			var widget = this;
			var resultData = [];

			widget.users.setData(data);

			widget.availableUsersGrid.set('summary', "Total :" + widget.users.data.length + " Entries");

			widget.availableUsersGrid.refresh();

		},
		deleteUser: function () {
			var widget = this;
			if (!widget.availableUsersGrid.selection) {
				return;
			}
			var callback = function () {
				widget.users.remove(widget.selectedRowData.loginName);
				widget.availableUsersGrid.refresh();
			}
			var myDialog = new ConfirmDialog({
				title: "Delete: " + widget.selectedRowData.loginName,
				content: "Do you really want to delete this user?",
				style: "width: 300px",
				onExecute: function () {
					widget.ctrl.deleteUser(widget.selectedRowData.loginName, lang.hitch(this, callback));
				}
			});
			myDialog.show();
		},
		resetPassword: function () {
			var widget = this;

			new AdminResetPassword({
				userInfo: widget.selectedRowData,
				lingoController: widget.ctrl
			});

		},
		updateAvailableUsers: function (obj) {
			var widget = this;
			widget.users.put(obj, {
				overwrite: true
			});
			widget.availableUsersGrid.refresh();
		},
		getUserData: function (loginName) {
			var widget = this;
			var item = arrayUtil.filter(widget.users.data, function (item) {
				return item.loginName == loginName;
			});
			return item[0];
		},
		getAvailableGroupData: function (groupName) {
			var widget = this;
			var item = arrayUtil.filter(widget.availableGroups.data, function (item) {
				return item.groupName == groupName;
			});
			return item[0];
		},
		getSelectedGroupData: function (groupName) {
			var widget = this;
			var item = arrayUtil.filter(widget.selectedGroups.data, function (item) {
				return item.groupName == groupName;
			});
			return item[0];
		},
		getAvailableQueueData: function (queueID) {
			var widget = this;
			var item = arrayUtil.filter(widget.availableQueues.data, function (item) {
				return item.queueID == queueID;
			});
			return item[0];
		},
		getSelectedQueueData: function (queueID) {
			var widget = this;
			var item = arrayUtil.filter(widget.selectedQueues.data, function (item) {
				return item.queueID == queueID;
			});
			return item[0];
		},
		addGroup: function (groupName) {
			var widget = this;
			if (widget.getSelectedGroupData(groupName) != null) {
				new messageWindow({
					title: "Warning",
					message: "Group Already added!!"
				});

				return;
			}
			var groupData = widget.getAvailableGroupData(groupName);
			var group = {};
			group.groupName = groupData.groupName;
			group.businessUnit = groupData.businessUnit;
			group.agentLevel = widget.agentLevel;
			group.escalationDuty = widget.escalationDuty;
			group.action = 'add';

			var g = {};
			g.groups = [];
			g.loginName = widget.selectedRowData.loginName;
			g.groups.push(group);

			var callback = function () {
				group.createdBy = window.localStorage.getItem('agent');
				group.createDate = widget.formatDate(new Date(), "MM/DD/YYYY H24:MI:SS");
				group.modifiedBy = window.localStorage.getItem('agent');
				group.modifiedDate = widget.formatDate(new Date(), "MM/DD/YYYY H24:MI:SS");

				arrayUtil.filter(widget.users.data, function (item) {
					if (item.loginName == widget.selectedRowData.loginName) {
						if (!item.groups)
							item.groups = [];
						item.groups.push(group);
						return;
					}
				});

				widget.selectedGroupsGrid.set('summary', "Total :" + widget.selectedGroups.data.length + " Entries");
				widget.selectedGroupsGrid.refresh();
				widget.selectedGroupsGrid.resize();

				widget.groupSelectList.store.setData(widget.selectedGroups.data);
				widget.availableGroupSelect.set('store', widget.groupSelectList);
				if (widget.selectedGroups.data.length > 0) {
					widget.availableGroupSelect.set("value", widget.groupSelectList.store.data[0].groupName);
				}
				else {
					widget.availableGroupSelect.set("value", "");
				}
			}
			widget.ctrl.addGroup(g, lang.hitch(this, callback));

		},
		removeGroup: function (groupName) {
			var widget = this;

			var groupData = widget.getSelectedGroupData(groupName);
			var group = {};
			group.groupName = groupData.groupName;
			group.agentLevel = groupData.agentLevel;
			group.escalationDuty = groupData.escalationDuty;
			group.action = 'remove';

			var g = {};
			g.groups = [];
			g.loginName = widget.selectedRowData.loginName;
			g.groups.push(group);

			var callback = function () {
				arrayUtil.filter(widget.users.data, function (item) {
					if (item.loginName == widget.selectedRowData.loginName) {
						widget.ctrl.removeItem(item.groups, "groupName", groupData.groupName);
						return;
					}
				});

				widget.selectedGroupsGrid.set('summary', "Total :" + widget.selectedGroups.data.length + " Entries");
				widget.selectedGroupsGrid.refresh();
				widget.selectedGroupsGrid.resize();

				widget.groupSelectList.store.setData(widget.selectedGroups.data);
				widget.availableGroupSelect.set('store', widget.groupSelectList);
				if (widget.selectedGroups.data.length > 0) {
					widget.availableGroupSelect.set("value", widget.groupSelectList.store.data[0].groupName);
				}
				else {
					widget.availableGroupSelect.set("value", "");
				}
			}

			widget.ctrl.removeGroup(g, lang.hitch(this, callback));

		},
		updateGroup: function (group) {
			var widget = this;

			arrayUtil.filter(widget.users.data, function (item) {
				if (item.loginName == group.loginName) {
					arrayUtil.filter(item.groups, function (groups) {
						if (groups.groupName == group.groups[0].groupName) {
							groups.agentLevel = group.groups[0].agentLevel;
							groups.escalationDuty = group.groups[0].escalationDuty;
							return;
						}
					});
					//setting the above changes in localStorage
					var modifiedGroups = {};
					item.groups.forEach(function (obj) {
						modifiedGroups[obj.groupName] = {
							skillLevel: obj.agentLevel,
							businessUnit: obj.businessUnit
						};
					});
					window.localStorage.setItem("groups", json.stringify(modifiedGroups));
				}
			});

			console.log("users sata is" + widget.users.data);
			widget.selectedGroupsGrid.refresh();
			widget.selectedGroupsGrid.resize();

			widget.groupSelectList.store.setData(widget.selectedGroups.data);
			widget.availableGroupSelect.set('store', widget.groupSelectList);
			if (widget.selectedGroups.data.length > 0) {
				widget.availableGroupSelect.set("value", widget.groupSelectList.store.data[0].groupName);
			}
			else {
				widget.availableGroupSelect.set("value", "");
			}
		},
		addQueue: function (queueID) {
			var widget = this;
			if (widget.getSelectedQueueData(queueID) != null) {
				new messageWindow({
					title: "Warning",
					message: "Queue Already added!!"
				});

				return;
			}
			var queueData = widget.getAvailableQueueData(queueID);
			var queue = {};
			queue.queueID = queueData.queueID;
			queue.queueName = queueData.queueName;
			queue.action = 'add';


			var g = {};
			g.queues = [];
			g.loginName = widget.selectedRowData.loginName;
			g.queues.push(queue);

			var callback = function () {
				queue.createdBy = window.localStorage.getItem('agent');
				queue.createDate = widget.formatDate(new Date(), "MM/DD/YYYY H24:MI:SS");
				queue.modifiedBy = window.localStorage.getItem('agent');
				queue.modifiedDate = widget.formatDate(new Date(), "MM/DD/YYYY H24:MI:SS");


				arrayUtil.filter(widget.users.data, function (item) {
					if (item.loginName == widget.selectedRowData.loginName) {
						if (!item.queues)
							item.queues = [];
						item.queues.push(queue);
						return;
					}

				});

				/* widget.selectedQueuesGrid.set('summary', "Total :" + widget.selectedQueues.data.length + " Entries");
				 widget.selectedQueuesGrid.refresh();
				 widget.selectedQueuesGrid.resize();*/
				widget.populateSelectedQueues(widget.availableGroupSelect.get('value'));

			}
			widget.ctrl.addQueue(g, lang.hitch(this, callback));

		},
		removeQueue: function (queueID) {
			var widget = this;

			var queueData = widget.getSelectedQueueData(queueID);
			var queue = {};
			queue.queueID = queueData.queueID;
			queue.queueName = queueData.queueName;
			queue.action = 'remove';

			var g = {};
			g.queues = [];
			g.loginName = widget.selectedRowData.loginName;
			g.queues.push(queue);

			var callback = function () {

				arrayUtil.filter(widget.users.data, function (item) {
					if (item.loginName == widget.selectedRowData.loginName) {
						widget.ctrl.removeItem(item.queues, "queueName", queueData.queueName);
						return;
					}
				});

				widget.populateSelectedQueues(widget.availableGroupSelect.get('value'));
				/*widget.selectedQueuesGrid.set('summary', "Total :" + widget.selectedQueues.data.length + " Entries");
				widget.selectedQueuesGrid.refresh();
				widget.selectedQueuesGrid.resize();*/
			}

			widget.ctrl.removeQueue(g, lang.hitch(this, callback));

		},

		populateAvailableGroups: function () {
			var widget = this;
			var groupData = widget.ctrl.availableGroups;
			widget.availableGroups.setData(groupData);
			widget.availableGroupsGrid.set('collection', widget.availableGroups);
			widget.availableGroupsGrid.set('summary', "Total :" + widget.availableGroups.data.length + " Entries");
			widget.availableGroupsGrid.refresh();
		},
		populateSelectedGroups: function () {
			var widget = this;
			var groupData = arrayUtil.filter(widget.users.data, function (group) {
				return (widget.selectedRowData.loginName == group.loginName);
			});
			if (groupData.length > 0 && groupData[0].groups)
				widget.selectedGroups.setData(groupData[0].groups);
			widget.selectedGroupsGrid.set('collection', widget.selectedGroups);
			widget.selectedGroupsGrid.set('summary', "Total :" + widget.selectedGroups.data.length + " Entries");
			widget.selectedGroupsGrid.refresh();

			widget.groupSelectList.store.setData(widget.selectedGroups.data);
			widget.availableGroupSelect.set('store', widget.groupSelectList);
			if (widget.selectedGroups.data.length > 0) {
				widget.availableGroupSelect.set("value", widget.groupSelectList.store.data[0].groupName);
			}
			else {
				widget.availableGroupSelect.set("value", "");
			}
		},
		selectAgentLevel: function (evt) {
			var widget = this;
			widget.agentLevel = evt.target.value;
		},
		selectEsclation: function (evt) {
			var widget = this;
			widget.escalationDuty = evt.target.value;
		},
		populateAvailableQueues: function (selectedGroup) {
			var widget = this;
			var queueData = [];
			var groupData = arrayUtil.filter(widget.availableGroups.data, function (group) {
				return (selectedGroup == group.groupName);
			});
			if (groupData.length > 0 && groupData[0].groupID) {
				queueData = arrayUtil.filter(widget.ctrl.availableQueues, function (queue) {
					return (groupData[0].groupID == queue.groupId);
				});
			}
			widget.availableQueues.setData(queueData);
			widget.availableQueuesGrid.set('collection', widget.availableQueues);
			widget.availableQueuesGrid.set('summary', "Total :" + widget.availableQueues.data.length + " Entries");
			widget.availableQueuesGrid.refresh();
		},
		populateSelectedQueues: function (selectedGroup) {
			var widget = this;
			var groupData = arrayUtil.filter(widget.availableGroups.data, function (group) {
				return (selectedGroup == group.groupName);
			});
			queueData = arrayUtil.filter(widget.users.data, function (queue) {
				return (widget.selectedRowData.loginName == queue.loginName);
			});

			if (queueData.length > 0 && queueData[0].queues) {
				var queues = [];

				if (groupData.length > 0 && groupData[0].groupID) {
					queues = queueData[0].queues.filter(selectedQueue =>
						widget.availableQueues.data.some(availableQueue => availableQueue.queueID === selectedQueue.queueID)
					);
				}
				widget.selectedQueues.setData(queues);
			}
			widget.selectedQueuesGrid.set('collection', widget.selectedQueues);
			widget.selectedQueuesGrid.set('summary', "Total :" + widget.selectedQueues.data.length + " Entries");
			widget.selectedQueuesGrid.refresh();
		},
		resetAvailableQueues: function () {
			var widget = this;

			widget.availableQueues.setData([]);
			widget.availableQueuesGrid.set('collection', widget.availableQueues);
			widget.availableQueuesGrid.set('summary', "Total :" + widget.availableQueues.data.length + " Entries");
			widget.availableQueuesGrid.refresh();
		},
		resetSelectedQueues: function () {
			var widget = this;
			widget.selectedQueues.setData([]);
			widget.selectedQueuesGrid.set('collection', widget.selectedQueues);
			widget.selectedQueuesGrid.set('summary', "Total :" + widget.selectedQueues.data.length + " Entries");
			widget.selectedQueuesGrid.refresh();
		},
		populateUserHistory: function () {
			var widget = this;

			if (widget.selectedRowData)
				topic.publish("lingoController/userChangeHistory", widget.selectedRowData);
		},
		populateGroupHistory: function () {
			var widget = this;

			if (widget.selectedGroupRow)
				topic.publish("lingoController/groupChangeHistory", widget.getSelectedGroupData(widget.selectedGroupRow));;
		},
		postCreate: function () {
			var widget = this;
			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow]);

			var layout = [
				{ label: "User Name", field: "loginName", width: 100 },
				{ label: "Full Name", field: "fullName", width: 250 },
				{ label: "Office", field: "office", width: 150 },
				{ label: "Email Address", field: "emailAddress", width: 250 },
				{ label: "Profile", field: "profileName", width: 100 },
				{ label: "Status", field: "status", width: 100 },
				{ label: "Shift Group", field: "shiftGroup", width: 100 },
				{ label: "Profile Id", field: "profileId", width: 50, hidden: true },
				{ label: "Business Units", field: "businessUnit", width: 105, hidden: true },
				{ label: "Phone Extension", field: "phoneExtension", width: 250, hidden: true },
				{ label: "FieldNation User Id", field: "fnUserId", width: 250, hidden: true },
				{ label: "Telcare User Id", field: "tcUserId", width: 250, hidden: true }
			];

			var availableGroupsLayout = [
				{ label: "Group", field: "groupName", width: 80 },
				{ label: "Business Unit", field: "businessUnit", width: 80 }
			];

			var selectedGroupsLayout = [
				{ label: "Group", field: "groupName", width: 80 },
				{ label: "Business Unit", field: "businessUnit", width: 30 },
				{ label: "Esclation", field: "escalationDuty", width: 50 },
				{ label: "Level", field: "agentLevel", width: 20 }
			];

			var availableQueuesLayout = [
				{ label: "Queue ID", field: "queueID", width: 80 },
				{ label: "Name", field: "queueName", width: 80 }
			];

			var selectedQueuesLayout = [
				{ label: "Queue ID", field: "queueID", width: 80 },
				{ label: "Name", field: "queueName", width: 80 }
			];

			widget.availableUsersGrid = new Grid({
				id: "availableUsersGrid",
				loadingMessage: "Grid is loading",
				noDataMessage: "No data",
				collection: widget.users,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: layout,
				selectionMode: "single",
				rowSelector: '20px'
			}, widget.availableUsersDiv);

			widget.availableUsersGrid.startup();
			widget.availableUsersGrid.refresh();

			widget.availableGroupsGrid = new Grid({
				id: "availableGroupsGrid",
				loadingMessage: "Grid is loading",
				noDataMessage: "No data",
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: availableGroupsLayout,
				selectionMode: "single",
				rowSelector: '20px'
			}, widget.availableGroupsDiv);

			widget.availableGroupsGrid.startup();
			widget.availableGroupsGrid.refresh();

			widget.selectedGroupsGrid = new Grid({
				id: "selectedGroupsGrid",
				loadingMessage: "Grid is loading",
				noDataMessage: "No data",
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: selectedGroupsLayout,
				selectionMode: "single",
				rowSelector: '20px'
			}, widget.selectedGroupsDiv);

			widget.selectedGroupsGrid.startup();
			widget.selectedGroupsGrid.refresh();

			widget.availableQueuesGrid = new Grid({
				id: "availableQueuesGrid",
				loadingMessage: "Grid is loading",
				noDataMessage: "No data",
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: availableQueuesLayout,
				selectionMode: "single",
				rowSelector: '20px'
			}, widget.availableQueuesDiv);

			widget.availableQueuesGrid.startup();
			widget.availableQueuesGrid.refresh();

			widget.selectedQueuesGrid = new Grid({
				id: "selectedQueuesGrid",
				loadingMessage: "Grid is loading",
				noDataMessage: "No data",
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: selectedQueuesLayout,
				selectionMode: "single",
				rowSelector: '20px'
			}, widget.selectedQueuesDiv);

			widget.selectedQueuesGrid.startup();
			widget.selectedQueuesGrid.refresh();

			widget.findUserBtn.on("click", function () {
				var info = {
					loginName: widget.findUser.get("value").trim()
				}
				widget.getUsers();
			});

			on(widget.findUser, "keyPress", lang.hitch(this, function (event) {
				if (widget.findUser.get("value").trim() !== "") {
					if (event.keyCode == 13) {
						var info = {
							loginName: widget.findUser.get("value").trim()
						}
						widget.getUsers();
					}
				}
			}));

			widget.listAllUsersBtn.on("click", function () {
				widget.getAllUsers();
			});

			widget.availableGroupSelect.on('change', function (value) {
				widget.populateAvailableQueues(value);
				widget.populateSelectedQueues(value);
			});

			widget.availableUsersGrid.on('dgrid-select', function (event) {
				widget.editUser.set("disabled", false);
				widget.changePassword.set("disabled", false);
				widget.selectedRowData = widget.getUserData(event.rows[0].data.loginName);
				if (!widget.selectedRowData.phoneExtension)
					widget.selectedRowData.phoneExtension = "";
				if (!widget.selectedRowData.emailAddress)
					widget.selectedRowData.emailAddress = "";
				if(widget.selectedRowData.status === "Active")
					widget.inactivateUser.set("disabled", false);
				if(widget.selectedRowData.status === "Inactive")
				{
					widget.editUser.set("disabled",true);
					widget.changePassword.set("disabled",true);
				}

				//Availble Groups
				widget.populateAvailableGroups();
				//Selected Groups
				widget.populateSelectedGroups();
				//Available Queues
				widget.populateAvailableQueues(widget.availableGroupSelect.get('value'));
				//Selected Queues
				widget.populateSelectedQueues(widget.availableGroupSelect.get('value'));
				//Change History
				widget.populateUserHistory();
			});

			widget.availableUsersGrid.on('dgrid-deselect', function (event) {
				widget.editUser.set("disabled", true);
				widget.inactivateUser.set("disabled", true);
				widget.changePassword.set("disabled", true);

				widget.availableGroups.setData([]);
				widget.availableGroupsGrid.set('summary', "");
				widget.availableGroupsGrid.refresh();

				widget.selectedGroups.setData([]);
				widget.selectedGroupsGrid.set('summary', "");
				widget.selectedGroupsGrid.refresh();

				widget.availableQueues.setData([]);
				widget.availableQueuesGrid.set('summary', "");
				widget.availableQueuesGrid.refresh();

				widget.selectedQueues.setData([]);
				widget.selectedQueuesGrid.set('summary', "");
				widget.selectedQueuesGrid.refresh();

				widget.groupSelectList.store.setData(widget.selectedGroups.data);
				widget.availableGroupSelect.set('store', widget.groupSelectList);
				if (widget.selectedGroups.data.length > 0) {
					widget.availableGroupSelect.set("value", widget.groupSelectList.store.data[0].groupName);
				}
				else {
					widget.availableGroupSelect.set("value", "");
				}
				topic.publish("lingoController/clearChangeHistory", ["User", "Group"]);
			});

			widget.availableGroupsGrid.on('dgrid-select', function (event) {
				widget.selectedAvailableGroup = event.rows[0].data.groupName;
				widget.addGroupBtn.set("disabled", false);
				widget.selectedGroupsGrid.refresh();
				widget.availableQueuesGrid.refresh();
				widget.selectedQueuesGrid.refresh();

			});

			widget.availableGroupsGrid.on('dgrid-deselect', function (event) {
				widget.addGroupBtn.set("disabled", true);
			});

			widget.selectedGroupsGrid.on('dgrid-select', function (event) {
				widget.removeGroupBtn.set("disabled", false);
				widget.editGroupBtn.set("disabled", false);
				widget.selectedGroupRow = event.rows[0].data.groupName;
				widget.availableGroupsGrid.refresh();
				widget.populateGroupHistory();
			});

			widget.selectedGroupsGrid.on('dgrid-deselect', function (event) {
				widget.removeGroupBtn.set("disabled", true);
				widget.editGroupBtn.set("disabled", true);

				topic.publish("lingoController/clearChangeHistory", ["Group"]);

			});

			widget.availableQueuesGrid.on('dgrid-select', function (event) {
				widget.selectedAvailableQueue = event.rows[0].data.queueID;
				widget.selectedQueuesGrid.refresh();
				widget.addQueueBtn.set("disabled", false);

			});

			widget.availableQueuesGrid.on('dgrid-deselect', function (event) {
				widget.addQueueBtn.set("disabled", true);

			});

			widget.selectedQueuesGrid.on('dgrid-select', function (event) {
				widget.removeQueueBtn.set("disabled", false);
				widget.availableQueuesGrid.refresh();
				widget.selectedQueueRow = event.rows[0].data.queueID;
			});

			widget.selectedQueuesGrid.on('dgrid-deselect', function (event) {
				widget.removeQueueBtn.set("disabled", true);
			});

			widget.addNewUser.on("click", function () {

				new AddUser({
					lingoController: widget.ctrl
				});
			});

			widget.editUser.on("click", function () {
				if (!widget.availableUsersGrid.selection) {
					return;
				}
				var editUser = new EditUser({
					userInfo: widget.selectedRowData,
					lingoController: widget.ctrl
				});
			});

			widget.editGroupBtn.on("click", function () {
				if (!widget.selectedGroupsGrid.selection) {
					return;
				}
				var groupInfo = widget.getSelectedGroupData(widget.selectedGroupRow);
				groupInfo.loginName = widget.selectedRowData.loginName;

				var editGroup = new EditGroup({
					groupInfo: groupInfo,
					lingoController: widget.ctrl
				});
			});

			widget.inactivateUser.on("click", function () {
				widget.deleteUser();
			});

			widget.changePassword.on("click", function () {
				widget.resetPassword();
			});

			widget.addGroupBtn.on("click", function () {
				widget.addGroup(widget.selectedAvailableGroup);
			});

			widget.removeGroupBtn.on("click", function () {
				widget.removeGroup(widget.selectedGroupRow);
			});

			widget.addQueueBtn.on("click", function () {
				if (!widget.checkAccessList("U1", false)) {
					new messageWindow({
						title: "Warning",
						message: "Insufficient privileges for an agent to add a queue!!"
					});

					return;
				}
				widget.addQueue(widget.selectedAvailableQueue);
			});

			widget.removeQueueBtn.on("click", function () {
				if (!widget.checkAccessList("U1", false)) {
					new messageWindow({
						title: "Warning",
						message: "Insufficient privileges for an agent to remove a queue!!"
					});

					return;
				}
				widget.removeQueue(widget.selectedQueueRow);
			});

		},
		destroy: function () {
			this.inherited(arguments);
			this.handle1.remove();
			this.handle2.remove();
			this.handle3.remove();
		}
	});

});
