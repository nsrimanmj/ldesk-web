define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom",
	"dojo/on",
	"dojo/dom-construct",
	"dstore/Memory",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/extensions/ColumnResizer",
	"dgrid/extensions/ColumnReorder",
	"dgrid/extensions/ColumnHider",
	"dgrid/extensions/DijitRegistry",
	"app/view/summaryRow",
	"dojo/data/ObjectStore",
	"dijit/form/Button",
	"dojox/form/Uploader",
	"dojox/form/uploader/FileList",
	"app/view/messageWindow",
	"dojo/topic",
	"dojo/text!app/widgets/templates/upload_avatar.html",
	"dojo/domReady!"
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, array, dom, on, domConstruct, Memory,
	OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, DijitRegistry, SummaryRow, ObjectStore, Button, Uploader, FileList,
	messageWindow, topic, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
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

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, DijitRegistry, SummaryRow]);

			on(widget.browseBtn, "click", function () {
				widget.fileUploader.click();
			})
			on(widget.fileUploader, "change", function (event) {
				var file = event.target.files[0];

				if (widget.isImageFile(file)) {
					widget.file = file;
					widget.previewImg.src = URL.createObjectURL(file);
				} else {
					widget.fileUploader.value = '';
					new messageWindow({
						message: "Only .png, .jpg and .gif allowed!",
						title: "ERROR"
					});
					return false;
				}

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
							domConstruct.place('<p>Upload successful!</p>', widget.status, 'only');
							const base64Data = "data:image/png;base64," + obj.data;
							widget.previewImg.src = base64Data;
							topic.publish("/lingoController/uploadAvatar/User-" + widget.userId, base64Data);
						} else
							domConstruct.place('<p>Upload failed!</p>', widget.status, 'only');
					};
					widget.sendRequest("uploadAvatar", formData, callBack);
					domConstruct.place('<p>Uploading...</p>', widget.status, 'only');
				} else {
					domConstruct.place('<p>Please select a file!</p>', widget.status, 'only');
				}
			}));


			widget.cancelBtn.on("click", lang.hitch(this, function () {
				widget.uploadDlg.hide();
			}));


			on(widget.uploadDlg, "hide", lang.hitch(this, function () {
				widget.uploadDlg.destroyRecursive();
				this.destroy();
			}));

			widget.uploadDlg.show();
		},
		isImageFile: function (file) {
			const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']; // Add more if needed
			return allowedTypes.includes(file.type);
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
