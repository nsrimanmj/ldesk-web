define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/_base/lang",
    "dojo/dom-style",
    "dojo/on",
    "dijit/form/Button",
    "dijit/DropDownMenu",
    "dijit/MenuItem",
    "dojox/encoding/base64",
    "app/widgets/sendEmail",
    "dojo/text!app/widgets/templates/case_email_data.html",
    "dojo/domReady!"
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, domStyle, on, Button, DropDownMenu, MenuItem, base64, SendEmail, template) { // jshint ignore:line

    var widget = null;

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
        templateString: template,
        widgetsInTemplate: true,
        info: null,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;
            widget.ctrl = widget.lingoController;
            widget.recordType = this.caseDetails.groupName;
            widget.attachmentsData = [];
        },
        buildRendering: function () {
            this.inherited(arguments);
            this.populateAttachments();
        },
        resize: function () {
            this.inherited(arguments);
        },
        init: function () {

        },
        uint8ArrayToBase64: function (u8a) {
            const CHUNK_SIZE = 0x8000; // arbitrary number
            const chunks = [];
            for (let i = 0; i < u8a.length; i += CHUNK_SIZE) {
                chunks.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SIZE)));
            }
            return btoa(chunks.join(''));
        },

        populateAttachments: function () {
            const widget = this;
            const attachments = widget.info.attachments;


            if (!attachments || attachments.length === 0) {
                widget.attachmentMenuDropdown.innerHTML = "";
                return;
            }

            const imagesContainer = document.querySelector('[data-dojo-attach-point="images"]');
            imagesContainer.innerHTML = "";

            attachments.forEach(attachment => {

                const menuItem = new MenuItem({
                    label: attachment.generatedFileName || attachment.fileName,
                    onClick: function () {
                        const blob = new Blob([attachment.content], { type: attachment.contentType });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = attachment.fileName || attachment.generatedFileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url); // Clean up
                    }
                });
                this.attachmentMenu.addChild(menuItem);
                if (attachment.contentType.startsWith("image/")) {
                    // If attachment is an image, append it to the images container
                    const base64Image = `data:${attachment.contentType};base64,${widget.uint8ArrayToBase64(attachment.content)}`;
                    const imgElement = document.createElement('img');
                    imgElement.style.maxHeight = "300px";
                    imgElement.style.maxWidth = "300px";
                    imgElement.src = base64Image;
                    imgElement.alt = attachment.fileName;

                    imagesContainer.appendChild(imgElement);
                }

            });

        },

        postCreate: function () {
            var widget = this;

            widget.caseEmailDataDlg.set('title', "Message Id: " + widget.info.headers.xjmid);
            widget.subject.set('content', "<html>" + widget.info.headers.headerText + "</html>");
            // widget.body.set('content', "<html>" + widget.info.body + "</html>");
            widget.body.srcdoc = "<html><style>pre {white-space: pre-wrap;word-break: break-word}</style>" + widget.info.body + "</html>";

            if (widget.info.isLatestEmail) {
                domStyle.set(widget.submitBtn.domNode, "display", "inline-block");
            } else {
                domStyle.set(widget.submitBtn.domNode, "display", "none");
            }

            widget.cancelBtn.on("click", lang.hitch(this, function () {
                widget.caseEmailDataDlg.hide();
            }));

            on(widget.caseEmailDataDlg, "hide", lang.hitch(this, function () {
                widget.caseEmailDataDlg.destroyRecursive();
                this.destroy();
            }));

            on(widget.caseEmailDataDlg, "close", lang.hitch(this, function () {
                widget.caseEmailDataDlg.destroyRecursive();
                this.destroy();
            }));


            on(widget.submitBtn, "click", function () {
                new SendEmail({
                    lingoController: widget.lingoController, info: widget.info.headers, body: widget.info.body, emailData: widget.emailData, caseId: widget.info.caseId,
                    finalSub: widget.finalSub, caseDetails: widget.caseDetails
                });
            });

            widget.caseEmailDataDlg.show();


        },
        destroy: function () {
            this.attachmentMenu.destroyRecursive();
            this.inherited(arguments);
        }
    });

});
