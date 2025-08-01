define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/form/Button",
	"dojo/_base/lang",
	"dojo/date",
	"dojo/date/locale",
	"app/widgets/changePassword",
	"app/widgets/theme",
	"dijit/DropDownMenu",
	"dijit/MenuItem",
	"dijit/form/DropDownButton",
	"dojo/dom-construct",
	"dojo/on",
	"app/widgets/uploadAvatar",
	"dojo/topic",
	"dojo/text!app/widgets/templates/header.html",
	"dojo/domReady!"
], function (declare, _parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Button, lang, dojoDate, locale, ChangePassword, Theme, 
	DropDownMenu, MenuItem, DropDownButton, domConstruct, on, UploadAvatar, topic, template) { // jshint ignore:line

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		constructor: function (args) {
			lang.mixin(this, args);
			this.userId = window.localStorage.getItem("agentId");
			var widget = this;
			this.ctrl = this.lingoController;
			this.handle = topic.subscribe("/lingoController/uploadAvatar/User-" + this.userId, lang.hitch(this, function (data) {
				widget.avatarImg.src = data;
			}));
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {

		},
		getDate: function () {
			var zone = dojoDate.getTimezoneName(new Date());
			if (zone.length > 3) {
				zone = zone.match(/\b\w/g).join("").toUpperCase();
			}
			var date = locale.format(new Date(), {
				selector: "date",
				formatLength: "short",
				datePattern: "MM/dd/yyyy hh:mm:ss a"
			});
			return date + " (" + zone + ")";
		},
		getUserImage: function () {
			var widget = this;

			var callback = function (obj) {
				widget.avatarImg.src = obj.data;
			}

			this.ctrl.getAPI("userImage", { userId: this.userId }, callback, false, false);
		},
		postCreate: function () {
			this.inherited(arguments);
			var widget = this;

			widget.titleDiv.innerHTML = "LDesk - Lingo Customer Support System";
			widget.versionDiv.innerHTML = "Version: " + window.version;
			//widget.renderStatusButton();

			/*var w = new Button({
				label: "Active",
				iconClass: 'active-class',
				onClick: function () {
					//widget.showSaveFolderDlg(data);
				}
			},widget.statusDiv);
*/
			var date = widget.getDate();
			widget.timeDiv.innerHTML = date;

			widget.dateRefreshId = setInterval(function () {
				var date = widget.getDate();
				widget.timeDiv.innerHTML = date
			}, 1000);

			widget.renderStatusButton(window.localStorage.getItem("agentStatus"));
			widget.dropdownButton.set('label', window.localStorage.getItem("agentName"));
			widget.dropdownButton.startup();

			widget.logoutButton.on("click", function () {
				widget.lingoController.doLogout();
			});

			widget.changePasswordBtn.on("click", function () {
				new ChangePassword({ lingoController: widget.lingoController });
			});

			var theme = new Theme();
			widget.changeThemeBtn.on("click", function() {				
				theme.showDialog();
			});

			on(widget.avatarImg, "click", function () {
				widget.viewUserDetails(widget.userId, widget.lingoController);
			})

			on(widget.viewProfileBtn, "click", function () {
				widget.viewUserDetails(widget.userId, widget.lingoController);
			})

			this.getUserImage();

		},
		renderStatusButton: function (status) {

			var widget = this;
			domConstruct.empty(widget.statusDiv);
			var menu = new DropDownMenu({ style: "display: none;" });

			var menuItem1 = new MenuItem({
				label: "<span class='green-dot'></span><span> Active </span>",
				onClick: function () { widget.updateAgentStatus("false"); }
			});

			var menuItem2 = new MenuItem({
				label: "<span class='red-dot'></span><span> Busy </span>",
				onClick: function () {
					widget.updateAgentStatus("true");
				}
			});

			var statusLabel = "<span class='grey-dot'></span><span>Offline </span>";
			if (status == "true") {
				statusLabel = "<span class='red-dot'></span><span>Busy </span>";
				menu.addChild(menuItem1);
			} else if (status == "false") {
				statusLabel = "<span class='green-dot'></span><span>Active </span>";
				menu.addChild(menuItem2);
			} else {
				menu.addChild(menuItem1);
				menu.addChild(menuItem2);
			}

			widget.statusDropdownButton = new DropDownButton({
				label: statusLabel,
				dropDown: menu
			});

			widget.statusDiv.appendChild(widget.statusDropdownButton.domNode);

		},
		updateAgentStatus: function (status) {
			var callback = function (obj) {
				if (obj.response.code == 200) {
					this.renderStatusButton(status);
					window.localStorage.setItem("agentStatus", status);
				} else {
					new messageWindow({
						message: obj.response.message,
						title: "Error"
					});
				}
			};
			this.lingoController.updateStatus(window.localStorage.getItem("agentId"), window.localStorage.getItem("agent"), status, lang.hitch(this, callback));
		},
		destroy: function () {
			clearInterval(this.dateRefreshId);
			this.inherited(arguments);
			if (this.handle)
				this.handle.remove();
			console.log("Header Destroyed!!");
		}
	});

});
