define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/registry",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/topic",
	"dojox/widget/TitleGroup",
	"dijit/TitlePane",
	"dijit/ConfirmDialog",
	"dijit/Dialog",
	"dijit/layout/ContentPane",
	"dijit/Fieldset",
	"dijit/form/Form",
	"dijit/form/RadioButton",
	"dijit/form/Button",
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
	"dojo/on",
	"dojo/date",
	"dojo/date/locale",
	"dojo/dom-construct",
	"app/widgets/showMemberInfo",
	"dijit/form/TextBox",
	"dijit/form/Select",
	"dijit/form/FilteringSelect",
	"dstore/legacy/DstoreAdapter",
	"dojo/text!app/widgets/templates/admin_group.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, lang, domStyle, topic, TitleGroup, TitlePane, ConfirmDialog, Dialog, ContentPane, Fieldset, Form, RadioButton, Button, OnDemandGrid, EnhancedGrid, Selection, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, Memory, arrayUtil, json, on, date, locale, domConstruct, ShowMemberInfo, TextBox, Select, FilteringSelect, DstoreAdapter, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;

			this.loginName = window.localStorage.getItem("agent");
			this.current_time = this.ctrl.getDate();

			widget.groupSearchRes = new Memory({
				idProperty: 'groupID',
				data: []
			});

		},

		buildRendering: function () {
			this.inherited(arguments);
		},

		resize: function () {
			this.inherited(arguments);
		},
		init: function () {
			this.newGroupForm.reset();
		},

		reset: function () {
			this.init();
			this.updateGroupBtn.setDisabled(true);
			this.newGroupBtn.setDisabled(false);
			this.grp_createdDate.set("value", this.ctrl.getDate());
			this.grp_modifiedDate.set("value", this.ctrl.getDate());
		},

		buttonRender: function (data, value, cell) {
			var widget = this;
			var w = new Button({
				label: "Show Members",
				onClick: function () {
					widget.showMembersDialog(data);
					//widget.ctrl.getUsers(data);
				}
			}, cell.appendChild(document.createElement("div")));
			w._destroyOnRemove = true;
			return w;
		},

		showMembersDialog: function (data) {
			var widget = this;
			var grp_id = data.groupID;
			var callback = function (d) {
				var memberInfo = new ShowMemberInfo({
					'lingoController': widget.lingoController,
					'info': d,
					'groupId': grp_id
				});
				//                console.log(d);
				//                widget.userStore.setData(d);
			};

			widget.ctrl.getUsers(data, lang.hitch(this, callback));

		},

		getGroupInfo: function () {
			var widget = this;
			var status = "";
			if (widget.groupstatus_active.checked) {
				status = widget.groupstatus_active.get("value");
			} else {
				status = widget.groupstatus_inactive.get("value");
			}
			var grpInfo = {

				"groupName": widget.newGroupName.get("value"),
				"longGroupName": widget.longGroupName.get("value"),
				"status": status,
				"createDate": widget.grp_createdDate.get("value"),
				"createdBy": widget.grp_createdBy.get("value"),
				"modifiedBy": widget.grp_modifiedBy.get("value"),
				"modifiedDate": widget.grp_modifiedDate.get("value"),
				"comments": widget.groupComment.get("value"),
				"businessUnit": "LGO"
			};

			return grpInfo;
		},

		getGroupInfoToSearch: function () {
			var widget = this;
			var grpInfo = {};
			var status = "";
			if (widget.groupstatus_active.checked) {
				status = widget.groupstatus_active.get("value");
			}
			if (widget.groupstatus_inactive.checked) {
				status = widget.groupstatus_inactive.get("value");
			}
			if (status != "") {
				grpInfo.status = status;
			}
			var groupName = widget.newGroupName.get("value");
			if (groupName) {
				grpInfo.groupName = groupName;
			}
			grpInfo.businessUnit = "LGO";


			//grpInfo = JSON.stringify(grpInfo);

			return grpInfo;

		},

		populateSearchResults: function (obj) {
			var data = obj.data;
			var widget = this;
			widget.groupSearchRes.setData(data);
			widget.groupSearchResultsGrid.set("collection", widget.groupSearchRes);
			//  widget.searchResultsGrid.set('collection', widget.categorySearchRes);
			widget.groupSearchResultsGrid.set('summary', "Total :" + widget.groupSearchRes.data.length + " Entries");

			widget.groupSearchResultsGrid.refresh();


		},

		populateRowData: function (data) {
			var widget = this;

			if (data.status == "Active") {
				widget.groupstatus_active.set('checked', true);
			}
			if (data.status == "Inactive") {
				widget.groupstatus_inactive.set('checked', true);
			}
			widget.grp_createdDate.set("value", data.createDate);
			widget.grp_modifiedDate.set("value", data.modifiedDate);
			widget.newGroupName.set("value", data.groupName);
			widget.longGroupName.set("value", data.longGroupName);
			widget.grp_createdBy.set("value", data.createdBy);
			widget.grp_modifiedBy.set("value", data.modifiedBy);
			widget.groupComment.set("value", data.comments);

		},

		postCreate: function () {
			var widget = this;
			var grpInfo = {};

			on(this.resetGroupBtn, "click", lang.hitch(this, function () {
				widget.reset();
			}));

			widget.newGroupBtn.on("click", function () {
				grpInfo = widget.getGroupInfo();
				if (grpInfo.groupName.toLowerCase() == 'public' || grpInfo.groupName.toLowerCase() == 'private') {
					new messageWindow({
						message: "Public/Private Groups are restricted.",
						title: "Error"
					});
					return;
				}
				var callback = function (obj) {
					if (obj.response.code == 200) {
						new messageWindow({
							message: obj.response.message,
							title: "Success"
						});
					}
				};

				widget.ctrl.createGroup(grpInfo, callback);

			});

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow]);

			var layout = [
				{
					label: '',
					field: 'action',
					width: 60,
					renderCell: lang.hitch(this, this.buttonRender)
				},
				{
					label: "Name",
					field: "groupName",
					width: 50
				},
				{
					label: "Long Name",
					field: "longGroupName",
					width: 60
				},
				{
					label: "Busines Unit",
					field: "businessUnit",
					width: 50
				},
				{
					label: "Status",
					field: "status",
					width: 50
				},
				{
					label: "Group ID",
					field: "groupID",
					width: 50,
					"hidden": true
				}
			];

			widget.groupSearchResultsGrid = new Grid({
				id: "groupSearchResultsGrid",
				loadingMessage: "Grid is loading",
				noDataMessage: "No results found for given search criteria!!",
				//collection: widget.groupSearchRes,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: layout,
				selectionMode: 'single',
				rowSelector: '20px'
			}, widget.groupSearchDiv);

			widget.groupSearchResultsGrid.startup();
			widget.groupSearchResultsGrid.refresh();

			on(this.searchGroupBtn, "click", lang.hitch(this, function () {
				grpInfo = widget.getGroupInfoToSearch();
				widget.ctrl.searchGroup(grpInfo, lang.hitch(this, widget.populateSearchResults));
			}));

			widget.groupSearchResultsGrid.on('dgrid-select', function (event) {
				widget.newGroupForm.reset();
				//                domStyle.set(widget.updateCategory.domNode, "display", "inline-block");
				widget.updateGroupBtn.setDisabled(false);
				widget.newGroupBtn.setDisabled(true);
				widget.selectedRowData = event.rows[0].data;

				widget.populateRowData(widget.selectedRowData);
				//                widget.groupSearchResultsGrid.refresh();
			});

			widget.groupSearchResultsGrid.on('dgrid-deselect', function (event) {
				widget.reset();
			});

			on(this.updateGroupBtn, "click", lang.hitch(this, function () {
				grpInfo = widget.getGroupInfo();
				grpInfo.groupID = widget.selectedRowData.groupID;
				grpInfo.modifiedDate = widget.ctrl.getDate();
				grpInfo.modifiedBy = widget.loginName;
				var callback = function (obj) {
					if (obj.response.code == 200) {
						widget.updateGroupDetails(grpInfo);
						widget.groupSearchResultsGrid.refresh();
						new messageWindow({
							message: obj.response.message,
							title: "Success"
						});
					}
				};
				widget.ctrl.updateAdminGroup(grpInfo, callback);
			}));

		},
		updateGroupDetails: function (grpInfo) {
			var widget = this;
			var callback = function (obj) {
				if (obj.response.code == 200) {
					var groupUpdateRes = new Memory({
						idProperty: 'groupID',
						data: obj.data
					});
					widget.groupSearchResultsGrid.set("collection", groupUpdateRes);
					widget.groupSearchResultsGrid.refresh();
				}

			}

			widget.ctrl.getAPI("admin/group", grpInfo, callback);
		},

		destroy: function () {
			this.inherited(arguments);
			// this.handle.remove();
		}
	});

});
