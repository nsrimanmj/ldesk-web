define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/on",
	"dojo/text!app/widgets/templates/account_hierarchy.html",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	"app/view/summaryRow",
	"dijit/registry",
	"app/widgets/myTree",
	"dgrid/Tree",
	"app/model/accountHierarchyStore",
	"app/widgets/loaderAnimation",
	"dojo/dom-class",
	"dojo/window",
	"dijit/layout/ContentPane",
	"dojo/dom-construct",
	"app/widgets/accountViewDetails",
	"dojo/domReady!"
], function (declare, _parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, on, template, OnDemandGrid, Selection, DijitRegistry
	, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, registry, MyTree, Tree, AccountHierarchyStore, Animation, domClass, win, ContentPane, domConstruct, AccountDetails) { // jshint ignore:line

	var animation = new Animation('loading_icon');

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			widget.accountStore = new AccountHierarchyStore();
			widget.isLoaded = false;
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.hierarchyGrid.resize();
		},
		init: function (accountId, topParentAccountId) {
			this.hierarchyGrid.resize();
			this.hierarchyGrid.refresh();
			this.accountId = accountId;
			this.topParentAccountId = topParentAccountId;
			if (this.isLoaded == false) {
				this.filterActiveOnly.set("value", true)
				this.getHierarchy();
			}
		},
		postCreate: function () {
			var widget = this;
			this.inherited(arguments);


			var renderRowColor = function () {
				var row = this.inherited(arguments);
				var data = arguments[0];

				if (data.isCurrent == true) {
					domClass.add(row, "bg-lightgreen");

					setTimeout(function () {
						row.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' })
						window.scrollTo(0, 0);
					}, 10);

				}

				if (data.status == 'Inactive') {
					if (row.style) {
						row.style.color = "red";
					}
				}

				return row;
			}
			var hierarchyLayout = [
				{ label: "Account Name", field: "companyName", width: 150, renderExpando: true, formatter: this.formatName },
				{ label: "Child Count", field: "childCount", width: 50, hidden: true },
				{ label: "App ID", field: "accountId", width: 80, renderCell: lang.hitch(this, this.renderAccountId) },
				{ label: "Parent App ID", field: "parentAccountId", width: 80, renderCell: lang.hitch(this, this.renderAccountId) },
				{ label: "Top Parent App ID", field: "topParentAccountId", width: 80, renderCell: lang.hitch(this, this.renderAccountId) },
				{ label: "Status", field: "status", width: 80, formatter: lang.hitch(this, this.formatStatus) },
				{ label: "Created Date", field: "created", width: 100, formatter: lang.hitch(this, this.dateFormatter) }
			];

			var TreeGrid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Selection, DijitRegistry, SummaryRow, MyTree]);
			this.hierarchyGrid = new TreeGrid({
				noDataMessage: "No Account Hierarchy Found!!",
				className: "hierarchy-grid",
				keepScrollPosition: true,
				columns: hierarchyLayout,
				selectionMode: "single",
				allowTextSelection: true,
				autoHeight: true,
				height: "100%",
				minRowsPerPage: 10000,
				rowsPerPage: 10000,
				collection: this.accountStore.getRootCollection(),
				renderRow: renderRowColor
			}, this.accountHierarchyDetailsDiv);
			//this.accountHierarchyDetailsDiv.startup();
			//this.accountHierarchyDetailsDiv.addChild(this.hierarchyGrid);

			this.hierarchyGrid.startup();

			on(widget.filterActiveOnly, "change", function () {

				widget.getHierarchy();
			})

		},
		formatStatus: function (value, data) {
			if (value == "Inactive") {
				return { html: "<span style='color: red'>" + value + "</span>" };
			}
			return value;
		},
		dateFormatter: function (value, data) {
			var widget = this;
			return widget.formatDateStr(value, "MM/DD/YYYY H24:MI:SS");
		},
		renderAccountId: function (data, value, cell) {
			if (!value) {
				return;
			}
			var widget = this;
			var div = cell.appendChild(document.createElement("div"));
			var linkNode = dojo.create("a", { href: "javascript:void(null);", title: value, innerHTML: value }, div);

			on(linkNode, "click", lang.hitch(this, function () {
				this.viewAccountDetails(value, widget.ctrl);
			}));
			return;

		},
		formatName: function (value, data) {
			if (data.isCurrent == true) {
				return { html: value + "<span class='current-badge'>current</span>" };
			} else {
				return value;
			}
		},
		getHierarchy: function () {
			var widget = this;
			var accountId = widget.accountId;
			if (accountId == null || accountId == "") {
				return;
			}

			var topParentAccountId = widget.topParentAccountId;
			if (topParentAccountId == "" || topParentAccountId == null) {
				topParentAccountId = accountId;
			}

			var activeOnly = this.filterActiveOnly.get("value");
			var request = {
				"appId": topParentAccountId,
				"activeOnly": activeOnly
			}

			var requestStr = JSON.stringify(request);

			var callBack = function (obj) {
				animation.hide();
				if (obj.response.code == "200") {
					if (obj.data && obj.data.length > 0) {
						widget.isLoaded = true;
						widget.accountStore.setData(obj.data, accountId);
						widget.hierarchyGrid.set("collection", widget.accountStore.getRootCollection());
						widget.hierarchyGrid.refresh();
						setTimeout(function () {
							var row = widget.hierarchyGrid.row(accountId);
							if (row) {
								widget.hierarchyGrid.select(row);
								//row.element.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' })
								//window.scrollTo(0, 0);
							}
						}, 50);

					}
					else {

						if (obj.data == null) {
							widget.accountStore.setData(obj.data, accountId);
							widget.hierarchyGrid.set("collection", widget.accountStore.getRootCollection());
							widget.hierarchyGrid.refresh();
						}

					}

				} else {
					new messageWindow({
						message: obj.response.message,
						title: "Error"
					});
				}
			};
			animation.show();
			this.sendRequest("accountHierarchy", requestStr, callBack, "Error while getting Data", "get");
		},
		destroy: function () {
			this.inherited(arguments);
		},
		clear: function () {
			this.accountStore.clear();
			this.hierarchyGrid.refresh();
			this.isLoaded = false;
			this.filterActiveOnly.set("value", true);
		}
	});

});



