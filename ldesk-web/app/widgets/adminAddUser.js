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
	"dijit/form/Select",
	"dojox/layout/TableContainer",
	"dijit/form/CheckBox",
	"dojo/data/ObjectStore",
	"dstore/legacy/DstoreAdapter",
	"dojo/text!app/widgets/templates/admin_add_user.html",
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
			widget.authSource = "LDesk";
			widget.officeLocations = new DstoreAdapter(new Memory({
				idProperty: 'id',
				data: [
					{ name: "Hyderabad", id: "Hyderabad" },
					{ name: "US", id: "US" },
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
			}

			this.ctrl.getAPI("profileList", {}, callback);

		},
		submit: function () {
			var widget = this;
			if (!widget.validate()) {
				return;
			}
			var middleName;
			if (!widget.firstName.get('value'))
				middleName = '';
			else
				middleName = widget.middleName.get('value');

			var info = {
				"businessUnit": 'LGO',
				"loginName": widget.userName.get('value').toLowerCase(),
				"fullName": widget.firstName.get('value') + ' ' + middleName + ' ' + widget.lastName.get('value'),
				"office": widget.officeSelect.get('value'),
				"emailAddress": widget.emailAddress.get('value'),
				"phoneExtension": widget.phone.get('value'),
				"shiftGroup": widget.shiftGroup.get('value'),
				"fnUserId": widget.fnUserId.get('value'),
				"tcUserId": widget.tcUserId.get('value'),
				"authSource": widget.authSource,
				"profileId": widget.profileSelect.get("value")
			};

			var agentCreate = {};

			agentCreate.users = [];
			agentCreate.users.push(info);
			agentCreate.groups = [];

			var callback = function () {
				widget.addUser.hide();
			};

			widget.ctrl.addUser(agentCreate, lang.hitch(this, callback));
		},
		selectAuthSource: function (evt) {
			var widget = this;
			widget.authSource = evt.target.value;
		},
		validate: function () {
			var widget = this;
			if (!widget.addUserForm.validate())
				return false;
			else
				return true;

		},
		postCreate: function () {
			var widget = this;
			this.inherited(arguments);
			widget.addUser.show();

			widget.officeSelect.set('store', widget.officeLocations);

			widget.shiftGroup.set('store', widget.shiftGroups);
			widget.profileSelect.set('store', widget.profileStore);

			widget.submitBtn.on("click", lang.hitch(this, function () {
				widget.submit();
			}));

			on(widget.addUser, "hide", lang.hitch(this, function () {
				widget.addUser.destroyRecursive();
				this.destroy();
			}));

			widget.cancelButton.on("click", lang.hitch(this, function () {
				widget.addUser.hide();
			}));

		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
