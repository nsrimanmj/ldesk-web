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
	"dijit/form/CheckBox",
	"dojo/text!app/widgets/templates/upload_file.html",
	"dojo/domReady!"
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, array, dom, on, domConstruct, Memory, OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, DijitRegistry, SummaryRow, ObjectStore, Button, Uploader, FileList, CheckBox, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;

			widget.fileStore = new Memory({
				data: [],
				idProperty: "name"
			});

			widget.privateFilesList = [];
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {

		},
		renderButton: function (data, value, cell) {
			var widget = this;

			var w = new Button({
				label: "Remove",
				onClick: function () {
					widget.fileStore.removeSync(data.name);
					widget.uploadFilesGrid.refresh();
					widget.uploadFilesGrid.resize();
					widget.fileUploader.reset();
				}
			}, cell.appendChild(document.createElement("div")));
			w._destroyOnRemove = true;
			return w;
		},
		renderPrivateFlag: function (data, value, cell) {
			var widget = this;

			var w = new CheckBox({
			}, cell.appendChild(document.createElement("div")));
			w._destroyOnRemove = true;

			w.onClick = function () {
				widget.updatePrivateFlag(this, data.name);
			}
			return w;
		},
		postCreate: function () {
			var widget = this;

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, DijitRegistry, SummaryRow]);

			if (widget.manualAttachment) {
				var layout = [

					{ label: "File Name", field: "name", width: "40%" },
					{ label: "File Type", field: "type", width: "30%" },
					{
						label: "File Size", field: "size", width: "30%", formatter: function (size) {
							return (size / 1024).toFixed(2);
						}
					},
					{ label: 'Action', field: 'action', width: 70, renderCell: lang.hitch(this, this.renderButton) },
					{ label: 'Is Private', field: 'privateFlag', width: 70, renderCell: lang.hitch(this, this.renderPrivateFlag) }
				];
			} else {
				var layout = [

					{ label: "File Name", field: "name", width: "40%" },
					{ label: "File Type", field: "type", width: "30%" },
					{
						label: "File Size", field: "size", width: "30%", formatter: function (size) {
							return (size / 1024).toFixed(2);
						}
					},
					{ label: 'Action', field: 'action', width: 70, renderCell: lang.hitch(this, this.renderButton) }
				];
			}
			widget.uploadFilesGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Files Uploaded!",
				columns: layout,
				className: "lingogrid",
				keepScrollPosition: true,
				selectionMode: 'none',
				height: "100%",
				autoWidth: true,
				rowSelector: '20px'
			}, widget.fileList);

			widget.uploadFilesGrid.startup();
			widget.uploadFilesGrid.refresh();
			widget.uploadFilesGrid.resize();

			on(widget.fileUploader, "change", function (files) {
				var files = widget.uploadForm.querySelectorAll('input[type="file"]');

				files.forEach(function (fileInput) {
					Array.from(fileInput.files).forEach(function (file) {
						widget.fileStore.put({
							name: file.name,
							type: file.type || 'N/A',
							size: file.size,
							fileData: file
						});
						widget.uploadFilesGrid.set('collection', widget.fileStore);
						widget.uploadFilesGrid.refresh();
						widget.uploadFilesGrid.resize();
					})
				});

			});

			widget.uploadButton.on("click", lang.hitch(this, function (event) {
				var filesPresent = 0;
				if (widget.fileUploader.getFileList().length > 0) {
					event.preventDefault();
					var form = widget.uploadForm;
					var formData = new FormData();
					var flagMap = {};
					widget.fileStore.forEach(function (file) {
						if (file.size !== 0 && file.name !== "") {
							filesPresent = 1;
							formData.append('file', file.fileData);
							if (widget.manualAttachment) {
								var fileName = file.name;
								flagMap[fileName] = widget.privateFilesList.indexOf(fileName) == -1 ? "false" : "true";
							}
						}
					});

					if (filesPresent == 0) {
						domConstruct.place('<p>Please select a file!</p>', widget.status, 'only');
						return;
					}

					if (widget.manualAttachment) {
						formData.append('isPrivateFlags', JSON.stringify(flagMap));
					}
					formData.append('caseId', parseInt(widget.caseId));
					formData.append('source', "LDesk");
					formData.append('addedBy', window.localStorage.getItem("agentName"));

					var callBack = function (obj) {
						if (obj.response.code == "200" && (obj.data.failedFiles == null || obj.data.failedFiles.length == 0))
							domConstruct.place('<p>Upload successful!</p>', widget.status, 'only');
						else if (obj.response.code == "200" && (obj.data.failedFiles != null && obj.data.failedFiles.length > 0) &&
							(obj.data.uploadedFiles != null && obj.data.uploadedFiles.length > 0))
							domConstruct.place('<p>Upload failed for some files!</p>', widget.status, 'only');
						else
							domConstruct.place('<p>Upload failed!</p>', widget.status, 'only');
					};

					widget.ctrl.uploadFiles(formData, widget.caseId, lang.hitch(this, callBack));
					domConstruct.place('<p>Uploading...</p>', widget.status, 'only');
				} else {
					domConstruct.place('<p>Please select a file!</p>', widget.status, 'only');
				}
			}));


			widget.cancelBtn.on("click", lang.hitch(this, function () {
				widget.addFileDlg.hide();
			}));


			on(widget.addFileDlg, "hide", lang.hitch(this, function () {
				widget.addFileDlg.destroyRecursive();
				this.destroy();
			}));

			widget.addFileDlg.show();
		},
		updatePrivateFlag: function (item, fileName) {
			var widget = this;
			var status = item.checked;
			if (status) {
				widget.privateFilesList.push(fileName);
			} else {
				var index = widget.privateFilesList.indexOf(fileName);
				if (index !== -1) {
					widget.privateFilesList.splice(index, 1);
				}
			}
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
