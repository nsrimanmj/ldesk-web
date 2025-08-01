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
	"dijit/form/FilteringSelect",
	"dijit/form/CheckBox",
	"dojo/dom-construct",
	"dijit/Fieldset",
	"dojo/text!app/widgets/templates/admin_profile.html",
	"dojo/domReady!"
], function (declare, parser, aspect, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, ContentPane, BorderContainer,
	Memory, StoreMemory, Observable, lang, domStyle, on, Dialog, TitleGroup, TitlePane, OnDemandGrid, Selection, Selector, DijitRegistry, ColumnResizer,
	ColumnReorder, ColumnHider, Keyboard, SummaryRow, Button, topic, FilteringSelect, CheckBox, domConstruct, Fieldset, template) { // jshint ignore:line

	var widget = null;

	return declare([BorderContainer, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		constructor: function (args) {
			lang.mixin(this, args);
			this.ctrl = this.lingoController;
			var widget = this;
			this.agentId = JSON.parse(window.localStorage.getItem("agentId"));

			this.profileListStore = Observable(new StoreMemory({
				data: [],
				idProperty: "id"
			}));

			this.userStore = Observable(new StoreMemory({
				data: [],
				idProperty: "userId"
			}));
		},
		init: function () {
			var widget = this;
			widget.getProfileList();
			widget.getProfileConfig();

		},
		getProfileList: function () {
			var widget = this;
			var callback = function (obj) {
				widget.profileListStore.setData(obj.data);
				widget.profileListGrid.set('summary', "Total Profiles: " + obj.data.length);
				widget.profileListGrid.refresh();
				widget.profileListGrid.resize();
				var selectedId = widget.selectedRowId;
				if (!selectedId) {
					selectedId = 1;
				}
				widget.profileListGrid.select(widget.profileListGrid.row(selectedId));

			}

			this.ctrl.getAPI("profileList", null, callback)
		},
		getProfileConfig: function () {
			var widget = this;
			var callback = function (obj) {
				widget.addActionList(obj.data);
			}

			this.ctrl.getAPI("profileConfig", null, callback, false, false)
		},
		getProfileDetails: function (profileId) {
			var widget = this;
			var callback = function (obj) {
				widget.setProfileData(obj.data);
			}

			var req = {
				"id": profileId
			}

			this.ctrl.getAPI("profile", req, callback);
		},
		setProfileData: function (data) {
			var widget = this;
			this.clearChecked();
			widget.profileName.set("value", data.name);
			widget.profileDescr.set("value", data.description);
			widget.profileData = data;
			var controls = data.controls;

			if (controls) {
				controls.forEach(function (item) {
					var cbk = registry.byId("access-cbk-" + item.actionId);
					cbk.set("checked", true);
				})
			}
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.profileListGrid.resize();
		},
		postCreate: function () {
			var widget = this;
			this.inherited(arguments);

			var height = screen.height - 420;
			if (height < 200) {
				height = 200;
			}

			domStyle.set(widget.ProfileListDiv, "height", height + "px");
			domStyle.set(widget.addActionsDiv, "height", height + "px");


			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow, Selector]);

			var profileListLayout = [
				{ label: "Id", field: "id", width: 30, hidden: true },
				{ label: "Name", field: "name", width: 60 },
				{ label: "Description", field: "description", width: 90, hidden: true }
			];

			widget.profileListGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Profile Found!!",
				collection: widget.profileListStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: profileListLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowSelectAll: true,
				allowTextSelection: true,
				height: "100%"
			}, widget.ProfileListDiv);
			widget.profileListGrid.startup();


			widget.profileListGrid.on('dgrid-select', function (event) {
				var profileId = event.rows[0].data.id;
				widget.selectedRowId = event.rows[0].data.id;
				widget.disableEdit();
				widget.getProfileDetails(profileId);
			});

			var userLayout = [
				{ label: "User Id", field: "userId", width: 30 },
				{ label: "Login Name", field: "loginName", width: 60 },
				{ label: "Name", field: "fullName", width: 90 },
				{ label: "Shift Group", field: "shiftGroup", width: 90 }
			];

			widget.userGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No User Found!!",
				collection: widget.userStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: userLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowSelectAll: true,
				allowTextSelection: true,
				height: "100%"
			}, widget.userGridDiv);

			on(widget.showUsersBtn, "click", function () {
				widget.getUserList();
				widget.showUserDlg.show();
			})

			on(widget.closeUserDlgBtn, "click", function () {
				widget.showUserDlg.hide();
			});

			on(widget.createProfileBtn, "click", function () {
				widget.profileDetailsPane.set("title", "<b>Create New Profile</b>");
				widget.profileName.set("value", "");
				widget.profileDescr.set("value", "");
				widget.enableEdit();
				widget.clearChecked();
				widget.isCreate = true;
				widget.isEdit = false;
			});

			on(widget.editBtn, "click", function () {
				widget.enableEdit();
				widget.isEdit = true;
				widget.isCreate = false;
			});

			on(widget.resetBtn, "click", function () {
				widget.disableEdit();
				widget.setProfileData(widget.profileData);

			});

			on(widget.saveBtn, "click", function () {
				widget.saveProfile();
			})

			widget.disableEdit();
		},
		toggleDisable: function (disabled) {
			dojo.query("[widgetid^=\"access-cbk\"]", "access-action-pane").forEach(function (node) {
				var wid = registry.byNode(node);
				wid.set("disabled", disabled);
			});
		},
		clearChecked: function () {
			dojo.query("[widgetid^=\"access-cbk\"]", "access-action-pane").forEach(function (node) {
				var wid = registry.byNode(node);
				wid.set("checked", false);
			});
		},
		disableEdit: function () {
			var widget = this;
			domStyle.set(widget.showUsersBtn.domNode, "display", "inline");
			domStyle.set(widget.editBtn.domNode, "display", "inline");
			domStyle.set(widget.saveBtn.domNode, "display", "none");
			domStyle.set(widget.resetBtn.domNode, "display", "none");
			widget.profileName.set("disabled", true);
			widget.profileDescr.set("disabled", true);
			widget.toggleDisable(true);
		},
		enableEdit: function () {
			var widget = this;
			domStyle.set(widget.saveBtn.domNode, "display", "inline");
			domStyle.set(widget.resetBtn.domNode, "display", "inline");
			domStyle.set(widget.editBtn.domNode, "display", "none");
			domStyle.set(widget.showUsersBtn.domNode, "display", "none");
			widget.profileName.set("disabled", false);
			widget.profileDescr.set("disabled", false);
			widget.toggleDisable(false);
		},
		getUserList: function () {

			var widget = this;
			var req = {
				"profileId": widget.profileData.id
			}

			var callback = function (obj) {
				widget.showUserDlg.show();
				widget.userStore.setData(obj.data);
				widget.userGrid.refresh();

			}

			widget.ctrl.getAPI("profileUsers", req, callback);
		},
		addActionList: function (data) {

			var widget = this;
			var actionsPane = this.actionsPane;
			var modules = data.modules;
			var recordTypes = data.recordTypes;
			var actions = data.actions;

			modules.forEach(function (module) {
				var recordList = recordTypes.filter(function (record) {
					return record.moduleId == module.id;
				});

				var actionList = actions.filter(function (item) {
					return item.moduleId == module.id;
				});

				tp = new TitlePane({ title: module.name });
				actionsPane.addChild(tp);

				if (recordList.length > 0) {
					recordList.forEach(function (record) {

						var actionList = actions.filter(function (action) {
							return action.moduleId == module.id && action.recordTypeId == record.id;
						});

						if (actionList.length > 0) {
							var fs = new Fieldset({ title: record.name, style: "margin-top: 5px;width:98%", toggleable: false });
							widget.addCheckboxs(actionList, module, record, fs)
							tp.addChild(fs);
						}
					})
				} else {
					widget.addCheckboxs(actionList, module, {}, tp)

				}
			});
		},
		addCheckboxs: function (list, module, record, tp) {
			if (list.length > 0) {
				list.forEach(function (item) {

					var cbkDiv = domConstruct.create("div", {
						class: "access-checkbox"
					}, tp.containerNode);

					var moduleId = module.id;
					var recordId = 0;
					if (record) {
						recordId = record.id;
					}
					var actionId = item.actionId;

					var cbkId = "access-cbk-" + actionId;
					var checkbox = new CheckBox({
						name: item.actionName,
						value: item.actionId,
						actionId: item.actionId,
						id: cbkId,
						checked: false,
						disabled: true
					}).placeAt(cbkDiv);

					domConstruct.create("label", {
						'for': cbkId,
						style: "padding-left:5px;margin-right:10px;display:inline!important;",
						innerHTML: item.actionDescription
					}, cbkDiv);

					checkbox.startup();
					//tp.addChild(cbkDiv);

				});
			}

		},
		saveProfile: function () {

			var widget = this;

			var isCreate = widget.isCreate;
			var isEdit = widget.isEdit;

			if (!widget.saveForm.validate()) {
				return;
			}


			var name = widget.profileName.get("value");
			var descr = widget.profileDescr.get("value");
			var req = {};
			req.name = name;
			req.description = descr;

			if (isEdit) {
				req.id = widget.profileData.id;
			}

			req.controls = [];

			dojo.query("[widgetid^=\"access-cbk\"]", "access-action-pane").forEach(function (node) {
				var wid = registry.byNode(node);
				var isChecked = wid.get("checked");
				var actionId = wid.get("actionId");
				var action = {};
				if (isEdit) {
					var matchingControl = widget.profileData.controls.filter(function (item) {
						return item.actionId == actionId;
					})

					if (matchingControl.length > 0) {
						if (isChecked == false) {
							action.id = matchingControl[0].id;
							action.actionId = actionId;
							action.updateAction = "DELETE";
							req.controls.push(action);
						}
					} else {
						if (isChecked == true) {
							action.allow = true;
							action.actionId = actionId;
							action.updateAction = "ADD";
							req.controls.push(action);
						}

					}
				} else {
					if (isChecked) {
						action.allow = true;
						action.actionId = actionId;
						req.controls.push(action);
					}
				}
			});

			var callback = function (obj) {
				widget.ctrl.showSuccessMessage(obj);
				widget.disableEdit();
				widget.getProfileList();
				if (isCreate) {
					widget.selectedRowId = obj.data.id;
				}
			}

			if (isCreate) {
				widget.ctrl.postAPI("profile", req, callback);
			} else {
				widget.ctrl.putAPI("profile", req, callback);
			}

		},
		destroy: function () {
			this.showUserDlg.destroyRecursive();
			this.inherited(arguments);
		}
	});

});
