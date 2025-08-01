define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/on",
	"dojo/topic",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/Selector",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	"app/view/summaryRow",
	"dstore/Memory",
	"dojo/store/Memory",
	"dojo/store/Observable",
	"dijit/form/Button",
	"app/widgets/createNetworkEvent",
	"app/widgets/addtoNetworkEvent",
	"app/widgets/loaderAnimation",
	"dijit/layout/AccordionContainer",
	"dojo/dom-style",
	"dojo/text!app/widgets/templates/active_users.html",
	"dojo/domReady!"
], function (declare, _parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, on, topic, OnDemandGrid, Selection, Selector, DijitRegistry, ColumnResizer,
	ColumnReorder, ColumnHider, Keyboard, SummaryRow, StoreMemory, Memory, Observable, Button, CreateNetworkEvent, AddToNetworkEvent, Animation, _AccordionContainer, domStyle, template) { // jshint ignore:line

	var animation = new Animation('loading_icon');

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			var widget = this;
			lang.mixin(this, args);
			this.ctrl = this.lingoController;

			this.userStore = Observable(new StoreMemory({
				idProperty: 'userId',
				data: []
			}));

		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
			this.userGrid.resize();
		},
		init: function () {
			var widget = this;
			this.getActiveUsers();
		},
		getActiveUsers: function () {
			var widget = this;
			var callback = function (obj) {
				widget.userStore.setData(obj.data);
				var response = obj.data;
				var activeUsersList = [];
				activeUsersList = response.filter(function (response) {
					return response.activeSession == true;
				});
				var busyUsersList = [];
				busyUsersList = response.filter(function (response) {
					return response.busyStatus == true && response.activeSession == true;
				});
				var activeUsers = activeUsersList.length - busyUsersList.length;
				widget.userGrid.set('summary', "Total Users: " + obj.data.length + " " + "Active Users: " + activeUsers + " " + "Busy Users: " + busyUsersList.length);
				widget.userGrid.refresh();
			}

			this.ctrl.getAPI("activeUsers", null, callback);
		},
		renderUserName: function (data, value, cell) {
			if (!value) {
				return;
			}

			var userId = data.userId;
			var widget = this;
			var div = cell.appendChild(document.createElement("div"));
			var linkNode = dojo.create("a", { href: "javascript:void(null);", title: value, innerHTML: value }, div);

			on(linkNode, "click", lang.hitch(this, function () {
				widget.viewUserDetails(userId, widget.ctrl);
			}));
			return;
		},
		renderFullName: function (data, value, cell) {
			if (!value) {
				return;
			}

			var userId = data.userId;
			var widget = this;
			var div = cell.appendChild(document.createElement("div"));
			div.className = 'user-name-div';
			var src = "images/user-default.png";

			var img = dojo.create("img", { src: src, class: 'avatar-icon', style: 'margin-right: 10px' }, div);
			if (data.imageExists) {
				widget.getUserImage(data.userId, img);
			}

			var linkNode = dojo.create("a", { href: "javascript:void(null);", title: value, innerHTML: value }, div);

			on(linkNode, "click", lang.hitch(this, function () {
				widget.viewUserDetails(userId, widget.ctrl);
			}));
			return;
		},
		getUserImage: function (userId, imgDiv) {
			var callback = function (obj) {
				imgDiv.src = obj.data;
			}

			this.ctrl.getAPI("userImage", { userId: userId, type: 'icon' }, callback, false, false);

		},
		renderSessionStatus: function (data, value, cell) {
			var widget = this;

			var statusStr = "<span class='grey-dot'></span><span>Offline </span>";
			if (data.activeSession) {
				if (value) {
					statusStr = "<span class='red-dot'></span><span>Busy </span>";
				} else {
					statusStr = "<span class='green-dot'></span><span> Active </span>";
				}
			}
			var div = cell.appendChild(document.createElement("div"));
			dojo.create("label", { title: value, innerHTML: statusStr }, div);
			return;
		},
		postCreate: function () {
			var widget = this;
			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow, Selector]);

			var userLayout = [
				{ label: "User Id", field: "userId", width: 30 },
				{ label: "Login Name", field: "loginName", width: 80 },
				{ label: "Name", field: "fullName", width: 120, renderCell: lang.hitch(this, this.renderFullName) },
				{ label: "Shift Group", field: "shiftGroup", width: 90 },
				{ label: "Profile", field: "profileName", width: 60 },
				{ label: "Session Status", field: "busyStatus", width: 80, renderCell: lang.hitch(this, this.renderSessionStatus) },
				{ label: "Session Id", field: "sessionId", width: 150 },
				{ label: "Last Login Time", field: "lastLoginTime", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Last Access Time", field: "lastAccessTime", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Logout Time", field: "logoutTime", width: 90, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Logout Reason", field: "logoutReason", width: 60 },
				{ label: "Login IP", field: "ip", width: 60 },
				{ label: "User Agent", field: "userAgent", width: 200 }
			];

			widget.userGrid = new Grid({
				id: "sessionGrid",
				loadingMessage: "Grid is loading",
				noDataMessage: "No Active Users Found!!",
				collection: widget.userStore,
				className: 'lingogrid ldesk-auto-grid',
				keepScrollPosition: false,
				columns: userLayout,
				selectionMode: "single",
				rowSelector: '20px',
				allowTextSelection: true
			}, widget.userDiv);

			var height = screen.height - 420;
			domStyle.set(this.userDiv, "height", height + "px");

			widget.userGrid.startup();
			widget.userGrid.refresh();

			on(widget.reloadBtn, "click", function () {
				widget.getActiveUsers();
			});
		},
		destroy: function () {
			this.inherited(arguments);
		},
		destroyRecursive: function () {
			this.inherited(arguments);
		}

	});

});
