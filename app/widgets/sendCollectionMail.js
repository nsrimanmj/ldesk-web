define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dijit/form/Button",
	"dojox/encoding/base64",
	"dojo/topic",
	"app/view/messageWindow",
	"app/widgets/uploadFile",
	"app/widgets/collectionSendNotice",
	"dojo/text!app/widgets/templates/send_collection_mail.html",
	"dojo/query",
	"dojo/domReady!"
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, domStyle, on, Button, base64, topic, messageWindow, UploadFile, CollectionSendNotice, template, query) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			widget.data = widget.info;
			widget.collectionData = widget.info.collectionInfo;
			widget.uploadedFileNames = [];

			widget.handle1 = topic.subscribe("/lingoController/uploadedFiles/Case-" + widget.data.caseId, lang.hitch(this, function (info) {
				if (info.uploadedFiles != null && info.uploadedFiles.length > 0)
					widget.uploadedFileNames = [...new Set([...widget.uploadedFileNames, ...info.uploadedFiles])];
				if (widget.uploadedFileNames.length > 0)
					widget.uploadedFileNamesPane.set('content', widget.uploadedFileNames.toString());
				else
					widget.uploadedFileNamesPane.set('content', "None");
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
		setDetails: function () {
			var widget = this;
			widget.treatmentStatus = widget.collectionData.treatmentStatus;
			widget.remainderDate = widget.collectionData.remainderDate;
			widget.suspendNoticeDate = widget.collectionData.suspendNoticeDate;
			widget.disconnectNoticeDate = widget.collectionData.disconnectNoticeDate;
			widget.finalDemandNoticeDate = widget.collectionData.finalDemandNoticeDate;

			widget.emailTo.set("value", widget.collectionData.contactEmail);
			widget.emailCc.set("value", "collections@lingo.com");
			widget.emailFrom.set("value", "collectionsteam@lingo.com");
			//setting email body
			var subject, noticeHeader, noticeText, plaindata;
			var detailHtml = "\nCase Location Name: " + widget.collectionData.accountName +
				"\nCase Account ID: " + widget.data.accountId +
				"\nTotal Balance: " + widget.collectionData.totalBalance +
				"\nBalance Over 30 Days Past Due: " + widget.collectionData.dueAmount30Days;
			var noticeFooter = "\n\nYou can contact us at 1-800-877-9228 to make a payment by phone or to set up payment arrangements. Agents are available Monday through Friday from 8:00 AM to 5:00 PM ET. \nYou can also make payments online at(www.mybullseyeaccount.com)My BullsEye Account.If payment has already been made, please disregard this message.\n\nThank you, \nLingo Collections\n\nPlease note that Lingo will never ask you for your banking information via email.Always refer to the remittance address on your most recent invoice or contact us using the customer service number listed on your invoice.";

			if (widget.data.isRem == "true") {
				widget.sendNoticeDlg.set("title", widget.sendNoticeDlg.get("title") + " - Remainder Notice");
				widget.treatmentStatus = "Reminder Notice Sent";
				widget.remainderDate = widget.formatDate(new Date(), "YYYY-MM-DD H24:MI:SS");
				subject = "Important Message Regarding your Lingo/Bullseye Account - " + widget.data.accountId;
				noticeHeader = "---Past Due Account Notification---\n";
				noticeText = "\n\nAccording to our records, your account balance is more than 30 days past due.To avoid future collection activity, please remit payment for the past due amount. ";
			} else if (widget.data.isSus == "true") {
				widget.sendNoticeDlg.set("title", widget.sendNoticeDlg.get("title") + " - Suspend Notice");
				widget.treatmentStatus = "Suspend Notice Sent";
				widget.suspendNoticeDate = widget.formatDate(new Date(), "YYYY-MM-DD H24:MI:SS");
				subject = "Suspension Notice - " + widget.data.accountId;
				noticeHeader = "---Suspension Notice - " + widget.data.accountId + "---\n";
				noticeText = "\n\nAccording to our records, your account balance is more than 30 days past due. To avoid an interruption in service, please remit payment for the past due amount no later than " + widget.collectionData.denyDate + ". Please know that if service is suspended, it can take up to five business days to restore, depending on the type of service you have.";
			} else if (widget.data.disCon == "true") {
				widget.sendNoticeDlg.set("title", widget.sendNoticeDlg.get("title") + " - Disconnect Notice");
				widget.treatmentStatus = "Disconnect Notice Sent";
				widget.disconnectNoticeDate = widget.formatDate(new Date(), "YYYY-MM-DD H24:MI:SS");
				subject = "Disconnection Notice - " + widget.data.accountId;
				noticeHeader = "---Disconnection Notice - " + widget.data.accountId + "---\n";
				noticeText = "\n\nAccording to our records, your account balance is more than 30 days past due. To avoid having your services fully disconnected, please remit payment for the past due amount no later than " + widget.collectionData.disconnectDate +
					"\n\nPlease know that if your services are disconnected, it can take up to five business days to reinstate voice services and 60 or more days to reinstate data services. Installation fees will apply.";
			} else if (widget.data.finDem == "true") {
				widget.sendNoticeDlg.set("title", widget.sendNoticeDlg.get("title") + " -  Final Demand Notice");
				widget.treatmentStatus = "Final Demand Notice Sent";
				widget.finalDemandNoticeDate = widget.formatDate(new Date(), "YYYY-MM-DD H24:MI:SS");
				subject = "Lingo Collections Notice - Final Demand - " + widget.data.accountId;
				noticeHeader = "---Final Demand Notice - " + widget.data.accountId + "---\n";
				noticeText = "\n\nOur previous attempts to contact you have been unsuccessful. This is our last attempt and FINAL WARNING to collect your unpaid balance. \n\nAs of the date of this letter, there is an outstanding balance on your account in the amount of " + widget.collectionData.totalBalance +
					"Failure to remit payment by " + widget.collectionData.finalDemandDate + "may result in - \n ---Assignment of your account to a Collection Agency \n ---Legal action \n ---Reporting your payment history to a credit reporting company ";
			}
			//widget.emailBody.startup(); if emailBody is of type ContentPane
			// widget.noticeText.innerHTML = noticeHeader + detailHtml + noticeText + noticeFooter;
			// widget.emailBody.set("value", widget.noticeText.innerText || widget.noticeText.textContent);
			plaindata = noticeHeader + detailHtml + noticeText + noticeFooter;
			widget.emailBody.set("value", plaindata);
			widget.emailSub.set("value", subject);
		},

		postCreate: function () {
			var widget = this;
			widget.sendNoticeDlg.show();
			widget.setDetails();

			widget.submitBtn.on("click", function () {

				if (!widget.validate()) {
					return;
				}
				var subject = widget.emailSub.get('value').trim();
				if (widget.collectionData.threadId) {
					subject = subject + "--> Ref #" + widget.collectionData.threadId;
				}
				var body = widget.emailBody.get('value').trim();
				var toEmails = widget.emailTo.get('value').trim();
				var ccEmails = widget.emailCc.get('value').trim();

				if (body == "" || subject == "") {
					return;
				}

				var headerText = "";
				if (widget.info.headerText) {
					headerText = lineSeparator + "\n" + widget.info.headerText + "\n";
				}
				var emailBody = "";
				if (widget.body) {
					emailBody = widget.body;
				}
				var info = {
					"to": toEmails,
					"cc": ccEmails,
					"subject": subject,
					"body": widget.convertToHtml(widget.emailBody.get('value').trim()),
					"isCollectionNotice": true
				}
				info.isNewEmail = 1;
				info.url = "NEW";

				if (widget.data.caseId) {
					info.caseId = widget.data.caseId;
				}

				info.files = widget.uploadedFileNames;
				info.agentName = window.localStorage.getItem("agentName");

				var callback = function (obj) {
					if (obj.response.code == "200") {
						console.log(widget.data);
						widget.collectionData.treatmentStatus = widget.treatmentStatus;
						widget.collectionData.remainderDate = widget.remainderDate;
						widget.collectionData.suspendNoticeDate = widget.suspendNoticeDate;
						widget.collectionData.disconnectNoticeDate = widget.disconnectNoticeDate;
						widget.collectionData.finalDemandNoticeDate = widget.finalDemandNoticeDate;

						widget.ctrl.updateCase(widget.data, null);
					}
					widget.sendNoticeDlg.hide();
				}
				widget.ctrl.sendEmail(info, lang.hitch(this, callback));
			});

			widget.cancelBtn.on("click", lang.hitch(this, function () {
				widget.sendNoticeDlg.hide();
			}));

			on(widget.sendNoticeDlg, "hide", lang.hitch(this, function () {
				widget.sendNoticeDlg.destroyRecursive();
				this.destroy();
			}));

			on(widget.prevBtn, "click", lang.hitch(this, function () {
				widget.sendNoticeDlg.hide();
				widget.prevDlg.show();
			}));

			widget.uploadFileBtn.on("click", lang.hitch(this, function () {
				new UploadFile({ lingoController: widget.ctrl, caseId: widget.data.caseId, manualAttachment: 0 });
			}));

		},
		convertToHtml: function (plainText) {
			var widget = this;

			// Escape HTML characters
			let html = widget.escapeHtml(plainText);

			// Replace newlines with <br>
			html = html.replace(/\n/g, '<br>');

			return html;
		},
		escapeHtml: function (text) {
			return text
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;');
		},

		validate: function () {
			var widget = this;
			if (!widget.sendEmailForm.validate())
				return false;
			else
				return true;

		},

		destroy: function () {
			this.inherited(arguments);
			this.handle1.remove();
		}
	});

});
