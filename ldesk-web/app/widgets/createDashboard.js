define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dijit/form/Button",
	"dojo/store/Memory",
	"dojo/text!app/widgets/templates/create_dashboard.html",
	"dojo/domReady!"
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, domStyle, on, Button, Memory, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;

			this.folderStore = new Memory({
				data: []
			});

			this.folderList = this.ctrl.folderList;
			this.folderGroupList = this.ctrl.folderGroupList;
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {

		},
		postCreate: function () {
			var widget = this;

			on(widget.submitBtn, "click", function () {
				widget.saveDashboard();
			});

			on(widget.cancelBtn, "click", function () {
				widget.saveDlg.destroyRecursive();
				this.destroy();
			});

			widget.folderGroup.set("store", widget.folderGroupList);
			widget.folderName.set("store", widget.folderStore);

			if (!widget.isUpdate) {
				widget.saveDashForm.reset();
				widget.folderGroup.set("value", "Private");
			}

			on(widget.folderGroup, "change", function () {
				var group = widget.folderGroup.get("value");
				widget.folderList = widget.ctrl.folderList;
				var folderList = widget.folderList.filter(function (item) {
					if (item.groupName != group) {
						return false;
					}
					if (group == "Private" && item.createdBy != widget.agentId) {
						return false;
					}
					return true;
				})

				widget.folderStore.setData(folderList);
				widget.folderName.set("value", "");
			});

			if (widget.data.groupName) {
				widget.folderGroup.set("value", widget.data.groupName);
			}

			setTimeout(function () {
				if (widget.data.folderId) {
					widget.folderName.set("value", widget.data.folderId);
				}
			}, 50)

			if (this.isUpdate) {
				this.saveDlg.set("title", "Update: " + this.data.name);
				this.dashName.set("value", this.data.name);
				this.folderGroup.set("value", this.data.folderGroup);
				setTimeout(lang.hitch(this, function () {
					this.folderName.set("value", this.data.folderId);
				}), 10);

			}

			if (this.isClone) {
				this.saveDlg.set("title", "Clone: " + this.data.name);
				this.folderGroup.set("value", this.data.folderGroup);
				setTimeout(lang.hitch(this, function () {
					this.folderName.set("value", this.data.folderId);
				}), 10);

			}

			widget.saveDlg.show();

		},
		saveDashboard: function () {
			var widget = this;
			if (!this.saveDashForm.validate()) {
				return
			};

			var dashName = this.dashName.get("value");
			var folderId = this.folderName.get("value");
			var folderGroup = this.folderGroup.get("value");

			var req = {
				name: dashName,
				folderId: folderId,
				folderGroup: folderGroup,
				createdBy: this.agentId,
				modifiedBy: this.agentId
			}


			if (this.isUpdate) {
				req.id = this.data.id;
				req.items = this.data.items;
			}

			if (this.isClone) {
				req.cloneId = this.data.id;
			}

			var callback = function (obj) {
				widget.ctrl.showSuccessMessage(obj);
				var id = obj.data.id;
				if (widget.isUpdate) {
					id = widget.data.id;
					widget.updateCallback(req);
				} else {
					widget.viewDashboardDetails({ id: id }, widget.ctrl);
					widget.ctrl.getFolderList();
				}
				widget.saveDlg.destroyRecursive();
				widget.destroy();
			}

			if (this.isUpdate) {
				this.ctrl.putAPI("dashboard", req, callback);
			} else {
				this.ctrl.postAPI("dashboard", req, callback)
			}
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
