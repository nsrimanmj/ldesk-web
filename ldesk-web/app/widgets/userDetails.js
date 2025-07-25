define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dojox/widget/TitleGroup",
	"dijit/TitlePane",
	"dijit/layout/TabContainer",
	"dijit/layout/LayoutContainer",
	"dijit/layout/ContentPane",
	"dojo/dom-construct",
	"dijit/form/Button",
	"dijit/form/Select",
	"dijit/form/TextBox",
	"dijit/form/RadioButton",
	"dijit/form/SimpleTextarea",
	"dijit/form/NumberTextBox",
	"dijit/form/ComboBox",
	"dijit/Fieldset",
	"dijit/Menu",
	"dijit/MenuItem",
	"dijit/registry",
	"dgrid/OnDemandGrid",
	"dojox/grid/EnhancedGrid",
	"dgrid/Selection",
	"dgrid/extensions/DijitRegistry",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/Keyboard",
	"app/view/summaryRow",
	"app/view/diaryEditor",
	"dojo/store/Memory",
	"dojo/store/Observable",
	"dijit/form/DateTextBox",
	"app/model/Status",
	"app/widgets/quickUpdate",
	"app/widgets/loaderAnimation",
	"dstore/Memory",
	"dojo/topic",
	"dojo/text!app/widgets/templates/user_details.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, domStyle, on, TitleGroup, TitlePane, TabContainer, LayoutContainer,
	ContentPane, domConstruct, Button, Select, TextBox, RadioButton, Textarea, NumberTextBox, ComboBox, Fieldset, Menu, MenuItem, registry,
	OnDemandGrid, EnhancedGrid, Selection, DijitRegistry, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, SummaryRow, diaryEditor,
	Memory, Observable, DateTextBox, StatusStore, _quickUpdate, Animation, StoreMemory, topic, template) { // jshint ignore:line

	var animation = new Animation('loading_icon');

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;

			this.ctrl = this.lingoController;

			this.historyStore = Observable(new StoreMemory({
				idProperty: 'id',
				data: []
			}));

			this.busyStore = Observable(new StoreMemory({
				idProperty: 'id',
				data: []
			}));

			this.activityStore = Observable(new StoreMemory({
				idProperty: 'id',
				data: []
			}));

			this.profileStore = Observable(new StoreMemory({
				idProperty: 'id',
				data: []
			}));

			this.handle = topic.subscribe("/lingoController/uploadAvatar/User-" + this.userId, lang.hitch(this, function (data) {
				widget.userImg.src = data;
			}));

			this.officeLocations = new Memory({
				idProperty: 'id',
				data: [
					{ "name": "Hyderabad", "id": "1" },
					{ "name": "US", "id": "2" },
					{ "name": "Role Account", id: "3" }
				]
			});
		},
		closeWindow: function () {
			var userContentPane = registry.byId("user_contentPane_" + this.userId);

			if (!this.tab) {
				this.tab = "controlPanelContentPane"
			}
			registry.byId("appTabContainer").selectChild(registry.byId(this.tab));
			registry.byId("appTabContainer").removeChild(userContentPane);
			userContentPane.destroyRecursive();
			registry.byId("appTabContainer").startup();
		},
		handleOnClose: function () {
			this.closeWindow();
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {
			this.getUserDetails();
			this.getUserImage();
		},
		getUserImage: function () {
			var widget = this;

			var callback = function (obj) {
				if (obj.data) {
					widget.userImg.src = obj.data;
				}
			}

			this.ctrl.getAPI("userImage", { userId: this.userId }, callback, false, false);
		},
		getUserDetails: function () {

			var widget = this;
			var callback = function (obj) {
				widget.setData(obj.data);
			}

			this.ctrl.getAPI("userDetails", { "userId": this.userId }, callback);
		},
		getGroupName: function (groupId) {
			var result = this.ctrl.availableGroups.filter(item => item.groupID == groupId);
			if (result.length > 0) {
				return result[0].groupName;
			}
			return "";
		},
		setData: function (data) {
			var widget = this;
			widget.userInfo = data.user;
			widget.userNameSpan.innerHTML = widget.userInfo.fullName;
			widget.userIdSpan.innerHTML = widget.userId;
			widget.userIdFld.set("value", widget.userId)
			var office = this.officeLocations.get(widget.userInfo.officeId);
			if (office) {
				widget.office.set("value", office.name);
			}
			widget.setWidgetValues(widget.userInfo, widget.userInfoTbl.domNode)

			var groups = [];
			data.groups.forEach(group => {
				var groupName = this.getGroupName(group.groupId);
				groups.push(groupName);
			});
			widget.groups.set("value", groups.join(","));

			var queues = data.queues.map(queue => queue.queueName).join(", ");
			widget.queues.set("value", queues);

			widget.profile = data.profile;
			if (data.profile) {
				widget.profileStore.setData(widget.profile.controls);
				widget.profileGrid.refresh();
			}

			widget.historyStore.setData(data.history);
			widget.historyGrid.refresh();

			widget.activityStore.setData(data.activity);
			widget.activityGrid.refresh();

			widget.busyStore.setData(data.busyHistory);
			widget.busyGrid.refresh();
		},
		renderDuration: function (data, value, cell) {
			var widget = this;

			var startTime = data.startTime;
			var endTime = data.endTime;

			if (!endTime) {
				endTime = this.getFormattedDateTimeInET(new Date(), "YYYY-MM-DD H24:MI:SS")
			}

			var d1 = new Date(startTime);
			var d2 = new Date(endTime);

			var diff = 0;
			if (d1 && d2) {
				diff = (d2.getTime() - d1.getTime())
			}


			//const diff = this.dateDiff(startTime, endTime);
			//const diff = endTime.getTime() - startTime.getTime();

			const millisecondsPerSecond = 1000;
			const secondsPerMinute = 60;
			const minutesPerHour = 60;
			const hoursPerDay = 24;

			const days = Math.floor(diff / (millisecondsPerSecond * secondsPerMinute * minutesPerHour * hoursPerDay));
			const hours = Math.floor((diff % (millisecondsPerSecond * secondsPerMinute * minutesPerHour * hoursPerDay)) / (millisecondsPerSecond * secondsPerMinute * minutesPerHour));
			const minutes = Math.floor((diff % (millisecondsPerSecond * secondsPerMinute * minutesPerHour)) / (millisecondsPerSecond * secondsPerMinute));
			const seconds = Math.floor((diff % (millisecondsPerSecond * secondsPerMinute)) / millisecondsPerSecond);

			var duration = "";
			duration += days ? days + "d, " : "";
			duration += hours ? hours + "h, " : "";
			duration += minutes ? minutes + "m, " : "";
			duration += seconds ? seconds + "s" : "0s";

			var div = cell.appendChild(document.createElement("div"));
			dojo.create("label", { title: value, innerHTML: duration }, div);
			return;
		},
		postCreate: function () {
			var widget = this;

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, Keyboard, DijitRegistry, SummaryRow]);

			var historyLayout = [
				{ label: "Login Time", field: "loginTime", width: 120, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Session Id", field: "sessionId", width: 150 },
				{ label: "Login IP", field: "loginIp", width: 100 },
				{ label: "User Agent", field: "userAgent", width: 200 },
				{ label: "Last Access Time", field: "lastAccessTime", width: 120, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Logout Time", field: "logoutTime", width: 120, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Logout Reason", field: "logoutReason", width: 80 },
			];

			//domStyle.set(widget.agentCasesDiv, "height", "500px");
			widget.historyGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Login History found !!",
				collection: widget.historyStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: historyLayout,
				allowTextSelection: true,
				selectionMode: "single",
				rowSelector: '20px'
			}, widget.historyDiv);

			widget.historyGrid.startup();
			widget.historyGrid.refresh();
			widget.historyGrid.resize();

			var activityLayout = [
				{ label: "Activity Date", field: "activityDate", width: 130, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Record Type", field: "recordType", width: 90 },
				{ label: "Case Open Count", field: "caseOpenCount", width: 80 },
				{ label: "Case Close Count", field: "caseCloseCount", width: 80 },
				{ label: "Public Notes Count", field: "pubNoteCount", width: 80 },
				{ label: "Int. Notes Count", field: "intNoteCount", width: 80 },
				{ label: "Email Count", field: "emailCount", width: 80 },
				{ label: "Work Order Count", field: "woOpenCount", width: 80 }
			];

			widget.activityGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No User Activity found!!",
				collection: widget.activityStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: activityLayout,
				allowTextSelection: true,
				selectionMode: "single",
				rowSelector: '20px'
			}, widget.activityDiv);

			widget.activityGrid.startup();
			widget.activityGrid.refresh();
			widget.activityGrid.resize();

			var profileLayout = [
				{ label: "Module", field: "moduleName", width: 90 },
				{ label: "Record Type", field: "recordType", width: 90 },
				{ label: "Action", field: "actionName", width: 80 },
				{ label: "Description", field: "actionDescription", width: 120 },
			];

			widget.profileGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No User Profile found!!",
				collection: widget.profileStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: profileLayout,
				allowTextSelection: true,
				selectionMode: "single",
				rowSelector: '20px'
			}, widget.profileDiv);

			widget.profileGrid.startup();
			widget.profileGrid.refresh();
			widget.profileGrid.resize();

			var busyLayout = [
				{ label: "Start Time", field: "startTime", width: 110, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "End Time", field: "endTime", width: 110, formatter: lang.hitch(this, this.dateFormatter) },
				{ label: "Duration", field: "startTime", width: 110, renderCell: lang.hitch(this, this.renderDuration) },
			];

			//domStyle.set(widget.agentCasesDiv, "height", "500px");
			widget.busyGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Busy History found !!",
				collection: widget.busyStore,
				className: 'lingogrid',
				keepScrollPosition: false,
				columns: busyLayout,
				allowTextSelection: true,
				selectionMode: "single",
				rowSelector: '20px'
			}, widget.busyDiv);

			widget.busyGrid.startup();
			widget.busyGrid.refresh();
			widget.busyGrid.resize();

			on(widget.closeWindowBtn, "click", function () {
				widget.closeWindow();
			})


			on(widget.browseBtn, "click", function () {
				widget.fileUploader.click();
			})

			on(widget.fileUploader, "change", function (event) {
				var file = event.target.files[0];


				if (!widget.isImageFile(file)) {
					widget.fileUploader.value = '';
					new messageWindow({
						message: "Only .png, .jpg and .gif allowed!",
						title: "ERROR"
					});
					return false;
				}

				if (!widget.checkFileSize(file)) {
					return false;
				}

				widget.file = file;
				widget.userImg.src = URL.createObjectURL(file);

			});

			widget.uploadButton.on("click", lang.hitch(this, function (event) {
				event.preventDefault();
				if (widget.fileUploader.files.length > 0) {
					event.preventDefault();
					var formData = new FormData();

					formData.append('userId', parseInt(widget.userId));
					formData.append('file', widget.fileUploader.files[0]);

					var callBack = function (obj) {

						if (obj.response.code == "200") {
							domConstruct.place('<p style="color: green;font-weight: bold">Upload successful!</p>', widget.status, 'only');
							const base64Data = "data:image/png;base64," + obj.data;
							widget.userImg.src = base64Data;
							topic.publish("/lingoController/uploadAvatar/User-" + widget.userId, base64Data);
						} else {
							var msg = obj.response.message;
							domConstruct.place('<p style="color: red;font-weight: bold">Upload failed!: ' + msg + '</p>', widget.status, 'only');
						}

						setTimeout(function () {
							domConstruct.place('<p></p>', widget.status, 'only');
						}, 60000);
					};
					widget.sendRequest("uploadAvatar", formData, callBack);
					domConstruct.place('<p style="color: blue;font-weight: bold">Uploading...</p>', widget.status, 'only');
				} else {
					domConstruct.place('<p style="color: red;font-weight: bold">Please select a file!</p>', widget.status, 'only');
					setTimeout(function () {
						domConstruct.place('<p></p>', widget.status, 'only');
					}, 10000);
				}
			}));

			if (widget.userId != this.agentId) {
				domStyle.set(widget.buttonDiv, "display", "none");
			}

		},
		isImageFile: function (file) {
			const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']; // Add more if needed
			return allowedTypes.includes(file.type);
		},
		checkFileSize: function (file) {
			const maxSizeInBytes = 2 * 1024 * 1024; // 2MB

			if (file) {
				const fileSize = file.size;

				if (fileSize > maxSizeInBytes) {
					widget.fileUploader.value = '';
					new messageWindow({
						message: "File size should be less than 2MB (Current Size: " + file.size + ")",
						title: "ERROR"
					});
					return false;
				}
			}

			return true;
		},
		destroy: function () {
			this.inherited(arguments);
			if (this.handle1)
				this.handle1.remove();
		}
	});

});
