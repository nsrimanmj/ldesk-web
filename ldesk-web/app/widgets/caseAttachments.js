define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dstore/Memory",
    "dojo/dom-style",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/topic",
    "dgrid/OnDemandGrid",
    "dgrid/Selection",
    "dgrid/extensions/ColumnResizer",
    "dgrid/extensions/ColumnReorder",
    "dgrid/extensions/ColumnHider",
    "dgrid/extensions/DijitRegistry",
    "app/view/summaryRow",
    "app/widgets/uploadFile",
    "dijit/form/CheckBox",
    "dijit/ConfirmDialog",
    "dojo/text!app/widgets/templates/case_attachments.html",
    "dojo/domReady!"
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, domStyle, lang, on, topic, OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, DijitRegistry, SummaryRow, UploadFile, CheckBox, ConfirmDialog, template) { // jshint ignore:line

    var widget = null;

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
        templateString: template,
        widgetsInTemplate: true,
        info: null,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;
            widget.ctrl = widget.lingoController;
            widget.attachments = new Memory({
                idProperty: 'id',
                data: []
            });

            widget.isLoaded = false;

            widget.recordType = widget.info.groupName;

            widget.handle1 = topic.subscribe("lingoController/Case-" + widget.info.caseId + "attachmentsLoaded", lang.hitch(this, function (info) {
                widget.loadAttachments(info);
            }));

            widget.handle2 = topic.subscribe("/lingoController/uploadedFiles/Case-" + widget.info.caseId, lang.hitch(this, function (info) {
                widget.init(widget.info.caseId);
            }));

            widget.handle3 = topic.subscribe("lingoController/Case-" + widget.info.caseId + "getCaseDetailsLoaded", lang.hitch(this, function (info) {
                widget.info = info;
                widget.checkAttachmentAccess(info);
            }));
        },
        buildRendering: function () {
            this.inherited(arguments);
        },
        init: function (caseId) {
            var widget = this;
            widget.isLoaded = false;
            widget.ctrl.getCaseAttachments(caseId);
        },
        loadAttachments: function (data) {
            var widget = this;
            widget.attachments.setData(data);

            widget.attachmentsGrid.set('collection', widget.attachments);
            widget.attachmentsGrid.resize();
            widget.attachmentsGrid.refresh();
        },
        renderFileName: function (data, value, cell) {
            var widget = this;
            if (!value)
                return;

            var link = "<a href=\"javascript:void(null);\"> " + value + "</a>";
            var div = cell.appendChild(document.createElement("div"));

            dojo.create("label", { innerHTML: link }, div);
            on(cell, "click", lang.hitch(this, function () {
                widget.ctrl.downloadFile(data.case_id, value);
            }));
            return;

        },
        renderInternalFlag: function (data, value, cell) {
            var widget = this;

            var w = new CheckBox({
                checked: value,
                disabled: true
            }, cell.appendChild(document.createElement("div")));
            w._destroyOnRemove = true;
            if (widget.isActionAllowed("case-edit", widget.recordType) && widget.info.statusId !== 4 && widget.info.statusId !== 3) {
                w.set("disabled", false);
            }
            w.onClick = function () {
                widget.updateInternalFlag(this, data);
            }
            return w;
        },
        postCreate: function () {
            var widget = this;

            var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, DijitRegistry, SummaryRow]);

            var layout = [

                { label: "File Name", field: "file_name", renderCell: lang.hitch(this, this.renderFileName) },
                { label: "File Type", field: "file_type" },
                { label: "Source", field: "source" },
                { label: "Added Date", field: "added_date", formatter: lang.hitch(this, this.dateFormatter) },
                { label: "Is Private", field: "is_private", renderCell: lang.hitch(this, this.renderInternalFlag) },
                { label: "Path", field: "path", "hidden": true },
                { label: "Added By", field: "added_by", "hidden": true }


            ];

            widget.attachmentsGrid = new Grid({
                loadingMessage: "Grid is loading",
                noDataMessage: "No Data!",
                columns: layout,
                className: "lingogrid",
                keepScrollPosition: true,
                selectionMode: 'none',
                height: "100%",
                autoWidth: true,
                rowSelector: '20px'
            }, widget.caseAttachmentsDiv);

            widget.attachmentsGrid.startup();
            widget.attachmentsGrid.refresh();
            widget.attachmentsGrid.resize();

            widget.checkAttachmentAccess(widget.info);

            widget.attachFileBtn.on("click", lang.hitch(this, function () {
                new UploadFile({ lingoController: widget.ctrl, caseId: widget.info.caseId, manualAttachment: 1 });
            }));

            on(widget.mailReloadBtn, "click", function () {
                widget.init(widget.info.caseId, true);
                widget.attachmentsGrid.refresh();
                widget.attachmentsGrid.resize();
            });
        },
        checkAttachmentAccess: function (info) {
            var widget = this;

            if (widget.isActionAllowed("case-add-attachment", widget.recordType)) {
                if (info.statusId == 4 || info.statusId == 3 || info.groupName == "Network") {
                    domStyle.set(widget.attachFileBtn.domNode, "display", "none");
                } else {
                    domStyle.set(widget.attachFileBtn.domNode, "display", "inline-block");
                }
            }
            widget.attachmentsGrid.refresh();

        },
        updateInternalFlag: function (item, data) {
            var widget = this;
            var status = item.checked;
            var msg = "";
            console.log(" id is" + data.id);
            if (status == true) {
                msg = "Do you really want to mark the attachement as private?";
            } else {
                msg = "Do you really want to mark the attachement as Public?";
            }
            var info = {
                "id": data.id,
                "isPrivate": status,
                "caseId": data.case_id
            }
            var myDialog = new ConfirmDialog({
                title: "Attachment: " + data.file_name,
                content: msg,
                style: "width: 500px",
                onExecute: function () {
                    widget.ctrl.updateCaseAttachment(info);
                },
                onCancel: function () {
                    widget.attachmentsGrid.refresh();
                }
            });
            myDialog.show();
        },
        destroy: function () {
            this.inherited(arguments);
            this.handle1.remove();
            this.handle2.remove();
            this.handle3.remove();
        }
    });

}); 