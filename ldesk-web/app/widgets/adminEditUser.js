define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dstore/Memory",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dijit/form/ValidationTextBox",
	"dijit/form/FilteringSelect",
	"dojox/layout/TableContainer",
	"dijit/form/CheckBox",
	"dojo/data/ObjectStore",
	"dstore/legacy/DstoreAdapter",
	"dojo/text!app/widgets/templates/admin_edit_user.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, ValidationTextBox, Select, TableContainer, CheckBox, ObjectStore, DstoreAdapter, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			widget.officeLocations = new DstoreAdapter(new Memory({
				idProperty: 'id',
				data: [
					{ "name": "Hyderabad", "id": "Hyderabad" },
					{ "name": "US", "id": "US" },
					{ name: "Role Account", id: "Role Account" }
				]
			}));
			widget.shiftGroups = new DstoreAdapter(new Memory({
				idProperty: 'id',
				data: [
					{ name: "None", id: "None" },
					{ name: "ARC Tier I", id: "ARC Tier I" },
					{ name: "ARC Tier II", id: "ARC Tier II" },
					{ name: "ARC Tier III", id: "ARC Tier III" },
					{ name: "CRT", id: "CRT" },
					{ name: "CSS Admin", id: "CSS Admin" },
					{ name: "Dev Ops", id: "Dev Ops" },
					{ name: "FER", id: "FER" },
					{ name: "FOPS", id: "FOPS" },
					{ name: "Lead", id: "Lead" },
					{ name: "Lingo Repair", id: "Lingo Repair" },
					{ name: "MGMT", id: "MGMT" },
					{ name: "New Jersey", id: "New Jersey" },
					{ name: "NMC", id: "NMC" },
					{ name: "SR ARC", id: "SR ARC" },
					{ name: "Strategic", id: "Strategic" },
					{ name: "Team Lead", id: "Team Lead" }
				]
			}));

			widget.profileStore = new DstoreAdapter(new Memory({
				idProperty: 'id',
				data: []
			}));

			this.init();
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {
			this.getProfileList();

		},
		getProfileList: function () {

			var widget = this;
			var callback = function (obj) {
				widget.profileStore.store.setData(obj.data);
				if (widget.userInfo.profileId) {
					widget.profileSelect.set('value', widget.userInfo.profileId);
				}
			}

			this.ctrl.getAPI("profileList", {}, callback);

		},
		submit: function () {
			var widget = this;
			if (!widget.validate()) {
				return;
			}
			var callback = function () {
				widget.editUser.hide();
			};

			var info = {
				"businessUnit": "LGO",
				"loginName": widget.loginName.get('value'),
				"fullName": widget.fullName.get('value'),
				"office": widget.officeSelect.get('value'),
				"emailAddress": widget.emailAddress.get('value'),
				"phoneExtension": widget.phone.get('value'),
				"shiftGroup": widget.shiftGroup.get('value'),
				"fnUserId": widget.fnUserId.get('value'),
				"tcUserId": widget.tcUserId.get('value'),
				"modifiedBy": window.localStorage.getItem('agent'),
				"modifiedDate": widget.formatDate(new Date(), "MM/DD/YYYY H24:MI:SS"),
				"profileId": widget.profileSelect.get("value"),
				"profileName": widget.profileSelect.get("displayedValue"),
				"status": widget.status.get('value')
			};
			widget.userInfo.businessUnit = "LGO";
			widget.ctrl.updateUser(info, lang.hitch(this, callback));
		},
		validate: function () {
			var widget = this;
			if (!widget.editUserForm.validate())
				return false;
			else
				return true;

		},
		postCreate: function () {
			var widget = this;
			this.inherited(arguments);
			widget.editUser.show();

			widget.officeSelect.set('store', widget.officeLocations);
			widget.officeSelect.set('value', widget.userInfo.office);

			widget.shiftGroup.set('store', widget.shiftGroups);
			widget.profileSelect.set('store', widget.profileStore);

			if (widget.userInfo.shiftGroup) {
				widget.shiftGroup.set('value', widget.userInfo.shiftGroup);
			}

			if (widget.userInfo.profileId) {
				widget.profileSelect.set('value', widget.userInfo.profileId);
			}

			if (widget.userInfo.office == "Role Account") {
				widget.officeSelect.setDisabled(true);
			} else {
				widget.officeLocations.remove("Role Account");
			}

			widget.officeSelect.set('store', widget.officeLocations);
			widget.officeSelect.set('value', widget.userInfo.office);

			if (widget.userInfo.fnUserId) {
				widget.fnUserId.set('value', widget.userInfo.fnUserId)
			}
			if (widget.userInfo.tcUserId) {
				widget.tcUserId.set('value', widget.userInfo.tcUserId)
			}
			widget.submitBtn.on("click", lang.hitch(this, function () {
				widget.submit();
			}));

			on(widget.editUser, "hide", lang.hitch(this, function () {
				widget.editUser.destroyRecursive();
				this.destroy();
			}));

			widget.cancelButton.on("click", lang.hitch(this, function () {
				widget.editUser.hide();
			}));

		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
