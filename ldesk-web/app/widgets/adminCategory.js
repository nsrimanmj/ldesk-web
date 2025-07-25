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
	"dijit/form/ComboBox",
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
	"dojo/dom-construct",
	"dijit/form/TextBox",
	"dijit/form/Select",
	"dijit/form/FilteringSelect",
	"dojox/form/CheckedMultiSelect",
	"dstore/legacy/DstoreAdapter",
	"dojo/text!app/widgets/templates/admin_category.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, lang, domStyle, topic, TitleGroup, TitlePane, ConfirmDialog, Dialog, ContentPane, Fieldset, Form, ComboBox, RadioButton, Button, OnDemandGrid, EnhancedGrid, Selection, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, Memory, arrayUtil, json, on, domConstruct, TextBox, Select, FilteringSelect, CheckedMultiSelect, DstoreAdapter, template) { // jshint ignore:line

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

			widget.categorySearchRes = new Memory({
				idProperty: 'categoryId',
				data: []
			});

			widget.groupList = new DstoreAdapter(new Memory({
				idProperty: 'id',
				data: []
			}));

			this.handle = topic.subscribe("lingoController/loadGrouplist", function (data) {
				widget.setGrouplist(data);
				widget.newGroupSelect.set('store', widget.groupList);
			});

			this.handle2 = topic.subscribe("lingoController/groupUpdated", function (data) {
				widget.setGrouplist(data);
				widget.newGroupSelect.set('store', widget.groupList);
			});

			this.handle3 = topic.subscribe("lingoController/groupCreated", function (data) {
				widget.setGrouplist(data);
				widget.newGroupSelect.set('store', widget.groupList);
			});

		},

		buildRendering: function () {
			this.inherited(arguments);
		},

		resize: function () {
			this.inherited(arguments);
		},
		init: function () {
			this.newCategoryForm.reset();
		},

		reset: function () {
			this.init();
			this.updateCategory.setDisabled(true);
			this.newCategoryBtn.setDisabled(false);
			this.newCat_createdDate.set("value", this.ctrl.getDate());
			this.newCat_modifiedDate.set("value", this.ctrl.getDate());
		},



		setGrouplist: function (data) {
			var widget = this;
			var list = [];
			var activeGroupList = [];
			//var data = widget.ctrl.getGroupStore();
			arrayUtil.forEach(data, function (group) {
				if (group.status == 'Active') {
					var tempObj = {};
					tempObj.id = group.groupName;
					tempObj.name = group.groupName;
					tempObj.label = group.groupName;
					list.push(tempObj);
				}

				//widget.groupList.add(tempObj);
			});



			widget.groupList.store.setData(list);
		},

		getCategoryInfo: function () {
			var widget = this;
			var status = "";
			if (widget.newstatus_active.checked) {
				status = widget.newstatus_active.get("value");
			} else {
				status = widget.newstatus_inactive.get("value");
			}

			//            var availability = widget.newAvailability.get("value");
			//            if (availability == "All") {
			//                availability = "";
			//            }
			//console.log(widget.lineMultiSelect.get("value"));
			var catInfo = {
				"categoryName": widget.new_category.get("value"),
				"groupName": widget.newGroupSelect.get("value"),
				"type": widget.new_type.get("value"),
				"supportLevel": widget.newSupportSelect.get("value"),
				"status": status,
				"partnerLine": "",
				"createDate": widget.newCat_createdDate.get("value"),
				"createdBy": widget.newCat_createdBy.get("value"),
				"modifiedBy": widget.newCat_modifiedBy.get("value"),
				"modifiedDate": widget.newCat_modifiedDate.get("value"),
				"comments": widget.categoryComment.get("value"),
				"subType": widget.new_subtype.get("value")
				//                "availability": availability
			};

			return catInfo;
		},

		getCategoryInfoToSearch: function () {
			var widget = this;
			var catInfo = {};
			var status = "";
			if (widget.newstatus_active.checked) {
				status = widget.newstatus_active.get("value");
			}
			if (widget.newstatus_inactive.checked) {
				status = widget.newstatus_inactive.get("value");
			}
			if (status != "") {
				catInfo.status = status;
			}
			var categoryName = widget.new_category.get("value");
			if (categoryName) {
				catInfo.categoryName = categoryName;
			}
			var groupName = widget.newGroupSelect.get("value");
			if (groupName) {
				catInfo.groupName = groupName;
			}
			var type = widget.new_type.get("value");
			if (type) {
				catInfo.type = type;
			}
			var subType = widget.new_subtype.get("value");
			if (subType) {
				catInfo.subType = subType;
			}

			//catInfo = JSON.stringify(catInfo);

			return catInfo;

		},

		populateSearchResults: function (obj) {
			var data = obj.data;
			var widget = this;
			var results = [];

			/*  arrayUtil.forEach(data, function(category){
				  results.push(category);
			  });*/

			widget.categorySearchRes.setData(data);
			widget.searchResultsGrid.set("collection", widget.categorySearchRes);
			//  widget.searchResultsGrid.set('collection', widget.categorySearchRes);
			widget.searchResultsGrid.set('summary', "Total :" + widget.categorySearchRes.data.length + " Entries");

			widget.searchResultsGrid.refresh();
		},

		populateRowData: function (data) {
			var widget = this;

			if (data.status == "Active") {
				widget.newstatus_active.set('checked', true);
			}
			if (data.status == "Inactive") {
				widget.newstatus_inactive.set('checked', true);
			}
			//            if (data.availability != null) {
			//                widget.newAvailability.set("value", data.availability);
			//            } else {
			//                widget.newAvailability.set("value", "All");
			//            }
			widget.newCat_createdDate.set("value", data.createDate);
			widget.newCat_modifiedDate.set("value", data.modifiedDate);
			widget.new_category.set("value", data.categoryName);
			widget.newGroupSelect.set("value", data.groupName);
			widget.new_type.set("value", data.type);
			widget.new_subtype.set("value", data.subType);
			widget.newSupportSelect.set("value", data.supportLevel);
			widget.newCat_createdBy.set("value", data.createdBy);
			widget.newCat_modifiedBy.set("value", data.modifiedBy);
			widget.categoryComment.set("value", data.comments);
		},


		postCreate: function () {
			var widget = this;

			widget.newGroupSelect.set('store', widget.groupList);
			var catInfo = {};

			on(this.resetCategoryBtn, "click", lang.hitch(this, function () {
				widget.reset();
			}));

			widget.newCategoryBtn.on("click", function () {
				catInfo = widget.getCategoryInfo();
				var callback = function () {

				};

				widget.ctrl.createCategory(catInfo, callback);

			});

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow]);

			var layout = [
				{
					label: "Category",
					field: "categoryName",
					width: 50
				},
				{
					label: "Type",
					field: "type",
					width: 60
				},
				{
					label: "Sub Type",
					field: "subType",
					width: 50
				},
				{
					label: "Group",
					field: "groupName",
					width: 60
				},
				{
					label: "Status",
					field: "status",
					width: 50
				}
			];

			widget.searchResultsGrid = new Grid({
				id: "searchResultsGrid",
				loadingMessage: "Grid is loading",
				noDataMessage: "No results found for given search criteria!!",
				//collection: widget.categorySearchRes,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: layout,
				selectionMode: 'single',
				rowSelector: '20px'
			}, widget.categorySearchDiv);

			widget.searchResultsGrid.startup();
			widget.searchResultsGrid.refresh();

			on(this.searchCategoryBtn, "click", lang.hitch(this, function () {
				catInfo = widget.getCategoryInfoToSearch();
				widget.ctrl.searchCategory(catInfo, lang.hitch(this, widget.populateSearchResults));
			}));

			widget.searchResultsGrid.on('dgrid-select', function (event) {
				widget.newCategoryForm.reset();
				widget.updateCategory.setDisabled(false);
				widget.newCategoryBtn.setDisabled(true);
				widget.selectedRowData = event.rows[0].data;
				//console.log(widget.selectedRowData);
				widget.populateRowData(widget.selectedRowData);

			});

			widget.searchResultsGrid.on('dgrid-deselect', function (event) {
				widget.reset();
			});

			on(this.updateCategory, "click", lang.hitch(this, function () {
				catInfo = widget.getCategoryInfo();
				catInfo.categoryId = widget.selectedRowData.categoryId;
				catInfo.modifiedDate = widget.ctrl.getDate();
				catInfo.modifiedBy = widget.loginName;
				var callback = function (obj) {
					widget.updateCategoryDetails(catInfo);
					widget.searchResultsGrid.refresh();
					new messageWindow({
						message: obj.response.message,
						title: "Success"
					});
				};

				widget.ctrl.updateCategory(catInfo, callback);
			}));

		},
		updateCategoryDetails: function (catInfo) {
			var widget = this;
			var callback = function (obj) {
				if (obj.response.code == 200) {
					var categoryUpdateRes = new Memory({
						idProperty: 'groupID',
						data: obj.data
					});
					widget.searchResultsGrid.set("collection", categoryUpdateRes);
					widget.searchResultsGrid.refresh();
				}

			}

			widget.ctrl.getAPI("admin/category", catInfo, callback);
		},
		destroy: function () {
			this.inherited(arguments);
			if (this.handle) {
				this.handle.remove();
			}
			if (this.handle2) {
				this.handle2.remove();
			}
			if (this.handle3) {
				this.handle3.remove();
			}

		}
	});

});



