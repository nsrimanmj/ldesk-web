define([
	"dojo/_base/declare",
	"dojo/parser",
	"dojo/dom",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dstore/Memory",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dojo/query",
	"dojo/dom-construct",
	"dojox/widget/TitleGroup",
	"dijit/TitlePane",
	"dijit/layout/ContentPane",
	"dijit/registry",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	"app/view/summaryRow",
	"dojo/text!app/widgets/templates/account_due.html",
	"app/view/messageWindow",
	"dojo/domReady!"
], function (declare, parser, dom, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, query, domConstruct, TitleGroup, TitlePane, ContentPane,
	registry, OnDemandGrid, Selection, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard,
	SummaryRow, template, messageWindow) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			 widget.accountStore = new Memory({
				idProperty: "accountId",
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
			 var widget = this;
            widget.getAccountDue();
		},
		getAccountDue:function(){
			var widget = this;
			var callback = function(obj){
				if(obj.response.code == "200"){
					widget.accountStore.setData(obj.data);
					widget.agingGrid.refresh();
					widget.agingGrid.resize();
				}
			}
			
			 var req = {
                
            }
            this.ctrl.getAPI("getAccAgingDueDetails", req, callback)
		},
		
		postCreate: function () {

			var widget = this;

			on(widget.accountDueButton, "click", function () {
				widget.getAccountDue();
			});

			var Grid = declare([OnDemandGrid, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, Selection, DijitRegistry, SummaryRow]);
			var agingLayout = [
				{ label: "App Id", field: "accountId", width: 100,renderCell: lang.hitch(this, this.renderAccountId) },
				{ label: "Account Name", field: "accountName", width: 130 },
				{ label: "Top Parent Account Id", field: "topParentAccountId", width: 90,renderCell: lang.hitch(this, this.renderAccountId) },
				{ label: "Total Amount", field: "totalAmount", width: 130,formatter: lang.hitch(this, this.formatAmount) },
				{ label: "Last Payment Date", field: "lastPaymentDate", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Created Date", field: "createdDate", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Updated Date", field: "updatedDate", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Past Due 30 Amount", field: "pastDue30daysAmount", width: 80 ,formatter: lang.hitch(this, this.formatAmount)},
				{ label: "Past Due 60 Amount", field: "pastDue60daysAmount", width: 200 ,formatter: lang.hitch(this, this.formatAmount)},
				{ label: "Last Payment Amount", field: "lastPaymentAmount", width: 90 ,formatter: lang.hitch(this, this.formatAmount)},
				{ label: "Order Type", field: "orderType", width: 80 },
				{ label: "Bill Cycle", field: "billCycle", width: 200 },
				{ label: "Billing System", field: "billingSystem", width: 90 },
				{ label: "Case Number", field: "caseNumber", width: 90, renderCell: lang.hitch(this, this.renderCaseId) }
			];

			widget.agingGrid = new Grid({
				columns: agingLayout,
				className: "lingogrid",
				keepScrollPosition: true,
				selectionMode: "single",
				autoWidth: true,
				collection: widget.accountStore,
				rowSelector: '20px',

			}, widget.agingGridDiv);

			widget.agingGrid.startup();
			widget.agingGrid.refresh();
			widget.agingGrid.resize();
			

			
		},
		
		renderAccountId: function (data, value, cell) {
			if (!value) {
				return;
			}
			var widget = this;

			var div = cell.appendChild(document.createElement("div"));
			if (value != 0) {
				var linkNode = dojo.create("a", { href: "javascript:void(null);", title: value, innerHTML: value }, div);

				on(linkNode, "click", lang.hitch(this, function () {
					this.viewAccountDetails(value, widget.ctrl);
				}));
			} else {
				dojo.create('span', {
					innerHTML: value, style: 'color: blue'
				}, div);
			}
			return;
		},

		renderCaseId: function (data, value, cell) {
			if (!value) {
				return;
			}

			var caseId = this.formatCaseNumber(value);
			var widget = this;
			var div = cell.appendChild(document.createElement("div"));
			var linkNode = dojo.create("a", { href: "javascript:void(null);", title: caseId, innerHTML: caseId }, div);

			on(linkNode, "click", lang.hitch(this, function () {
				var callback = function (obj) {
					widget.viewCaseDetails(caseId, widget.ctrl, obj.data);
				}
				widget.ctrl.getCaseDetails(value, callback);
			}));
			return;
		},

		
				
		destroy: function () {
			
		}
	});

});




