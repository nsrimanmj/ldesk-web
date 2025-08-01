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
	"dijit/Dialog",
	"dojox/widget/TitleGroup",
	"dijit/TitlePane",
	"app/widgets/adminUser",
	"app/widgets/adminCategory",
	"app/widgets/adminGroup",
	"app/widgets/adminQueue",
	"app/widgets/adminProfile",
	"app/widgets/activeUsers",
	"dojo/text!app/widgets/templates/admin_panel.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, Dialog, TitleGroup, TitlePane,
	adminUser, adminCategory, adminGroup, adminQueue, adminProfile, activeUsers, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;


		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.adminPanelTabContainer.resize();
		},
		init: function () {

		},
		initAdminQueue: function () {
			this.adminQueue.init();
		},
		initAdminProfile: function () {
			this.adminProfile.init();
		},
		initActiveUsers: function () {
			this.activeUsers.init();
		},
		postCreate: function () {
			var widget = this;
			this.inherited(arguments);

			this.adminPanelTabContainer.startup();
			this.adminPanelTabContainer.resize();

			//Displaying Admin Panel for users with Admin/Password groups
			if (!widget.isActionAllowed("mange-user-view")) {
				widget.adminPanelTabContainer.removeChild(widget.usersTab);
				widget.usersTab.destroyRecursive(false);
			}

			if (!widget.isActionAllowed("category-view")) {
				widget.adminPanelTabContainer.removeChild(widget.categoryTab);
				widget.categoryTab.destroyRecursive(false);
			}

			if (!widget.isActionAllowed("group-view")) {
				widget.adminPanelTabContainer.removeChild(widget.groupsTab);
				widget.groupsTab.destroyRecursive(false);
			}

			if (!widget.isActionAllowed("queue-view")) {
				widget.adminPanelTabContainer.removeChild(widget.queueTab);
				widget.queueTab.destroyRecursive(false);
			}

			if (!widget.isActionAllowed("profile-view")) {
				widget.adminPanelTabContainer.removeChild(widget.profileTab);
			}

			children = widget.adminPanelTabContainer.getChildren();
			if (children.length == 0) {
				dijit.byId("appTabContainer").removeChild(dijit.byId("adminPanelContentPane"));
				//dijit.byId("adminPanelContentPane").destroyRecursive(false);
			}

		},
		destroy: function () {
			this.profileTab.destroyRecursive(false);
			this.inherited(arguments);


		}
	});

});
