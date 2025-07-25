define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
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
	"dstore/legacy/DstoreAdapter",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"app/widgets/addCaseNote",
	"dojo/text!app/widgets/templates/case_notes.html",
	"dijit/ConfirmDialog",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, OnDemandGrid, EnhancedGrid, Selection, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow,
	Memory, DstoreAdapter, lang, domStyle, on, AddCaseNote, template, ConfirmDialog) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.data = widget.info;
			widget.ctrl = widget.lingoController;
			widget.recordType = widget.data.groupName;
			widget.loginName = window.localStorage.getItem("agent");
			widget.notesStore = new Memory({
				idProperty: "noteId",
				data: []
			});
			widget.noteTypes = new DstoreAdapter(new Memory({
				idProperty: 'id',
				data: [
					{ name: "Internal Notes", id: "Internal Notes" },
					{ name: "Public Notes", id: "Public Notes" },
					{ name: "All", id: "All" }
				]
			}));

			widget.networkNoteType = new DstoreAdapter(new Memory({
				idProperty: 'id',
				data: [
					{ name: "Network Event", id: "Network Event" }
				]
			}));
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.caseNotesGrid.resize();
		},
		init: function (data) {
			this.getNotes();
		},
		getNotes: function () {
			var widget = this;
			var data = this.data;
			var reqObj = {};
			if (data.caseId)
				reqObj.caseId = data.caseId;
			if (data.accountId)
				reqObj.accountId = data.accountId;
			if (data.noteType)
				reqObj.noteType = data.noteType;
			var callback = function (obj) {
				widget.notesStore.setData(obj.data);
				widget.caseNotesGrid.set("collection", widget.notesStore);
				//widget.caseNotesGrid.startup();
				widget.caseNotesGrid.refresh();
				widget.caseNotesGrid.resize();
			};
			widget.ctrl.getAPI("getNotes", reqObj, callback);
		},
		getFilteredNotes: function (noteType) {
			var widget = this;
			if (noteType == "All") {
				widget.caseNotesGrid.set("collection", widget.notesStore);
			} else {
				var data = widget.notesStore.data.filter((data) => { return data.noteType == noteType });
				var store = new Memory({
					idProperty: "noteId",
					data: data
				});
				widget.caseNotesGrid.set("collection", store);
			}
			//widget.caseNotesGrid.startup();
			widget.caseNotesGrid.refresh();
			widget.caseNotesGrid.resize();

		},
		postCreate: function () {
			var widget = this;
			this.inherited(arguments);
			widget.noteTypeFilter.set('store', widget.noteTypes);
			if (widget.data.groupName == "Network") {

				widget.noteTypeFilter.set("store", widget.networkNoteType);
				widget.noteTypeFilter.set("value", "Network Event");
			}
			if (widget.data.groupName != "Network") {
				widget.noteTypeFilter.set('value', "All");
			}

			//widget.getNotes(widget.data);

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Selection, DijitRegistry, SummaryRow]);

			var notesLayout = [
				{ label: "Created Date", field: "createdDate", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Created By", field: "createdBy", width: 80 },
				{ label: "Notes Type", field: "noteType", width: 90 },
				{ label: "Notes Sub Type", field: "noteSubType", width: 90 },
				{ label: "Notes Text", field: "noteText", width: 110, "hidden": true },
				{ label: "Note Id", field: "noteId", width: 50, "hidden": true }
			];
			widget.caseNotesGrid = new Grid({
				columns: notesLayout,
				className: "lingogrid",
				noDataMessage: "No Data found",
				loadingMessage: "Grid is loading",
				keepScrollPosition: true,
				// autoWidth: true,
				selectionMode: "single",
				rowSelector: '20px'
			}, widget.caseNotesdiv);
			widget.caseNotesGrid.startup();

			widget.caseNotesGrid.refresh();
			//widget.caseNotesGrid.resize();

			on(widget.caseNotesGrid, "dgrid-select", function (event) {
				widget.selectedNotesData = event.rows[0].data;
				if (widget.selectedNotesData.noteText)
					widget.notesText.innerHTML = "<h3>" + widget.selectedNotesData.noteText + "</h3>";
				else
					widget.notesText.innerHTML = "";
			});

			on(widget.caseNotesGrid, "dgrid-deselect", function (event) {
				widget.notesText.innerHTML = "";
			});

			on(widget.notesReloadBtn, "click", function () {
				widget.init(widget.data);
				widget.caseNotesGrid.refresh();
				widget.caseNotesGrid.resize();
			});

			on(widget.addNotesBtn, "click", function () {

				new AddCaseNote({
					info: widget.data,
					isBulk : false,
					lingoController: widget.lingoController,
					onNoteAdded: function (responseData) {
						widget.getNotes();
					}

				});
			});

			on(widget.noteTypeFilter, "change", function (value) {
				widget.getFilteredNotes(value);
			});

		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
