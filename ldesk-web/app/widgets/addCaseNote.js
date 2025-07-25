define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dstore/Memory",
	"dstore/legacy/DstoreAdapter",
	"dojo/_base/lang",
	"dojo/on",
	"dojo/text!app/widgets/templates/add_case_note.html",
	"dijit/ConfirmDialog",
	"dojo/domReady!"
], function (
	declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, DstoreAdapter, lang, on, template, ConfirmDialog
) {

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], {
		templateString: template,
		widgetsInTemplate: true,
		info: null,

		constructor: function (args) {
			lang.mixin(this, args);
			const widget = this;

			widget.data = widget.info;
			widget.ctrl = widget.lingoController;
			widget.recordType = widget.data.groupName;
			widget.loginName = window.localStorage.getItem("agent");

			// Stores
			widget.notesStore = new Memory({ idProperty: "noteId", data: [] });

			widget.noteTypes = new DstoreAdapter(new Memory({
				idProperty: 'id',
				data: [
					{ name: "Internal Notes", id: "Internal Notes" },
					{ name: "Public Notes", id: "Public Notes" },
					{ name: "All", id: "All" }
				]
			}));

			widget.noteTypesToAdd = new DstoreAdapter(new Memory({
				idProperty: 'id',
				data: [
					{ name: "Internal Notes", id: "Internal Notes" },
					{ name: "Public Notes", id: "Public Notes" }
				]
			}));

			widget.noteTypesForEq = new DstoreAdapter(new Memory({
				idProperty: 'id',
				data: [
					{ name: "Internal Notes", id: "Internal Notes" }
				]
			}));

			widget.noteSubTypes = new DstoreAdapter(new Memory({
				idProperty: 'id',
				data: [
					{ name: "None", id: "None" },
					{ name: "ARC Case Hand-Off", id: "ARC Case Hand-Off" },
					{ name: "Carrier", id: "Carrier" },
					{ name: "Escalation Notes", id: "Escalation Notes" },
					{ name: "MLT", id: "MLT" },
					{ name: "Important", id: "Important" }
				]
			}));

			widget.noteSubTypesEq = new DstoreAdapter(new Memory({
				idProperty: 'id',
				data: [
					{ name: "Internal", id: "Internal" }
				]
			}));

			widget.networkNoteType = new DstoreAdapter(new Memory({
				idProperty: 'id',
				data: [
					{ name: "Network Event", id: "Network Event" }
				]
			}));

			widget.networkNoteSubType = new DstoreAdapter(new Memory({
				idProperty: 'id',
				data: [
					{ name: "Network Public", id: "Network Public" },
					{ name: "Network Internal", id: "Network Internal" }
				]
			}));

			widget.emptyStore = new DstoreAdapter(new Memory({
				idProperty: 'id',
				data: []
			}));
		},

		_setSubTypeStore: function (noteType) {
			const group = this.data.groupName;
			this.noteSubTypeSelect.reset();

			if (group === "Network") {
				this.noteSubTypeSelect.set("disabled", false);
				const store = noteType === "" ? this.emptyStore : this.networkNoteSubType;
				this.noteSubTypeSelect.set("store", store);
			} else if (noteType === "Internal Notes") {
				this.noteSubTypeSelect.set("disabled", false);
				const store = group === "Equipment" ? this.noteSubTypesEq : this.noteSubTypes;
				this.noteSubTypeSelect.set("store", store);
			} else {
				this.noteSubTypeSelect.set("disabled", true);
			}
		},

		addNotes: function (data) {
			const widget = this;

			const reqObj = {
				caseId: data.caseId,
				accountId: data.accountId,
				caseList: data.caseList,
				groupId: data.groupId,
				noteType: widget.noteTypeSelect.get("value"),
				noteText: widget.noteText.get("value"),
				noteSubType: widget.noteSubTypeSelect.get("value"),
				createdBy: widget.loginName
			};

			const callback = function (obj) {
				widget.ctrl.showSuccessMessage(obj);
				widget.addNotesDialog.hide();
				if (typeof widget.onNoteAdded === "function") {
					widget.onNoteAdded(obj); // Call the parent's callback
				}
			};

			let warnMsg = null;
			if (reqObj.noteSubType === "Network Public") {
				warnMsg = "Adding a note will notify all the related incident cases";
			} else if (reqObj.noteSubType === "Network Internal") {
				warnMsg = "An email will be sent notifying internal leadership of a new case note";
			}

			if (warnMsg) {
				new ConfirmDialog({
					title: "WARNING",
					content: warnMsg,
					style: "width: 300px",
					onExecute: function () {
						if (widget.isBulk) {
							widget.ctrl.postAPI("addBulkNotes", reqObj, callback);
						} else { 
							widget.ctrl.postAPI("addNotes", reqObj, callback);
						}
					}
				}).show();
			} else {
				if (widget.isBulk) {
						widget.ctrl.postAPI("addBulkNotes", reqObj, callback);
				} else { 
						widget.ctrl.postAPI("addNotes", reqObj, callback);
					}
			}
		},

		postCreate: function () {
			const widget = this;
			this.inherited(arguments);

			const group = widget.data.groupName;

			const title = this.caseId ? this.formatCaseNumber(this.data.caseId) : " Bulk"

			this.addNotesDialog.set("title", "Add Notes - " + title);
			// Initial setup
			if (group === "Equipment") {
				widget.noteTypeSelect.set("store", widget.noteTypesForEq);
			} else if (group === "Network") {
				widget.noteTypeSelect.set("store", widget.networkNoteType);
				widget.noteSubTypeSelect.set("disabled", false);
				const noteTypeValue = widget.noteTypeSelect.get("value");
				const subTypeStore = noteTypeValue === "" ? widget.emptyStore : widget.networkNoteSubType;
				widget.noteSubTypeSelect.set("store", subTypeStore);
			} else {
				widget.noteTypeSelect.set("store", widget.noteTypesToAdd);
			}

			on(widget.closeBtn, "click", function () {
				widget.addNotesDialog.hide();
			});

			on(widget.submitBtn, "click", function () {
				if (!widget.addNotesForm.isValid()) {
					widget.addNotesForm.validate();
					return;
				}
				widget.addNotes(widget.data);
			});

			on(widget.noteTypeSelect, "change", function (value) {
				widget._setSubTypeStore(value);
			});

			widget.addNotesDialog.show();
		},
		onNoteAdded: function (noteData) {
			// To be overridden by parent widget
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});
});
