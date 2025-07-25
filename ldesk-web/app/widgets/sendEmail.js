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
	"dojo/text!app/widgets/templates/send_email.html",
	"dojo/domReady!"
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, domStyle, on, Button, base64, topic, messageWindow, UploadFile, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			widget.uploadedFileNames = [];
			widget.handle1 = topic.subscribe("/lingoController/uploadedFiles/Case-" + widget.caseId, lang.hitch(this, function (info) {
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
		postCreate: function () {
			var widget = this;

			if (widget.finalSub) {
				widget.emailSub.set('value', widget.finalSub);
			} else {
				widget.emailSub.set('disabled', false);
			}
			widget.emailFrom.set('value', environment.allowedFromAddress);
			widget.emailReplyTo.set('value', environment.allowedFromAddress);

			if (widget.emailData.mail_in_mua == 0) {
				widget.emailTo.set('value', widget.info.to);
			} else {
				widget.emailTo.set('value', widget.info.from);
			}

			if (!widget.emailTo.get('value') || widget.emailTo.get('value') == "") {
				if (widget.caseDetails.contactEmail) {
					widget.emailTo.set('value', widget.caseDetails.contactEmail);
				}
			}

			widget.emailCc.set('value', widget.info.cc);
			//For customer emails check if mail is sent to any support addresses
			if (widget.emailData.mail_in_mua == 1) {
				if (widget.containsAny(widget.info.to, environment.allowedReplyAddress)) {
					var filteredToAddreses = widget.removeMatchedEmails(widget.info.to);
					widget.emailReplyTo.set('value', filteredToAddreses.matchedAddresses);
					var ccInfo = "";
					if (widget.info.cc != null && widget.info.cc.trim().length > 0 &&
						filteredToAddreses.filteredString != null && filteredToAddreses.filteredString.trim().length > 0) {
						ccInfo = widget.info.cc + "," + filteredToAddreses.filteredString;
					} else {
						ccInfo = filteredToAddreses.filteredString;
					}
					widget.emailCc.set('value', ccInfo);
				} else if (widget.containsAny(widget.info.cc, environment.allowedReplyAddress)) {
					var filteredCcAddreses = widget.removeMatchedEmails(widget.info.cc);
					widget.emailReplyTo.set('value', filteredCcAddreses.matchedAddresses);
					var filteredToAddreses = widget.removeMatchedEmails(widget.info.to);
					var ccInfo = "";
					if (filteredCcAddreses.filteredString != null && filteredCcAddreses.filteredString.trim().length > 0
						&& filteredToAddreses.filteredString != null && filteredToAddreses.filteredString.trim().length > 0) {
						ccInfo = filteredCcAddreses.filteredString + "," + filteredToAddreses.filteredString;
					} else {
						ccInfo = filteredToAddreses.filteredString;
					}
					widget.emailCc.set('value', ccInfo);
				}
			}

			if (widget.caseDetails.additionalEmail) {
				if (widget.emailCc.get('value')) {
					widget.emailCc.set('value', widget.removeDuplicateEmails(widget.emailCc.get('value') + ", " + widget.caseDetails.additionalEmail));
				} else {
					widget.emailCc.set('value', widget.caseDetails.additionalEmail);
				}
			}

			//Including contact email in To address if it is not present in To/CC while sending mail
			if (!widget.emailTo.get('value') || widget.emailTo.get('value') == "") {
				if (widget.caseDetails.contactEmail) {
					widget.emailTo.set('value', widget.caseDetails.contactEmail);
				}
			} else {
				if (widget.caseDetails.contactEmail && (widget.emailTo.get('value').toLowerCase() !== widget.caseDetails.contactEmail.toLowerCase()) && (
					!widget.emailCc.get('value') || !widget.emailCc.get('value').toLowerCase().includes(widget.caseDetails.contactEmail.toLowerCase()))) {
					widget.emailTo.set('value', widget.emailTo.get('value') + "," + widget.caseDetails.contactEmail);
				}
			}

			if (widget.uploadedFileNames.length > 0)
				widget.uploadedFileNamesPane.set('content', widget.uploadedFileNames.toString());
			else
				widget.uploadedFileNamesPane.set('content', "None");

			var lineSeparator = '<hr style="border: 1px solid #ccc; margin: 20px 0;">'

			if (widget.info.headerText && widget.body) {
				// widget.previousEmailBody.set('content', widget.info.headerText + "\n" + widget.body);
				widget.previousEmailBody.srcdoc = "<html><style>pre {white-space: pre-wrap;word-break: break-word}</style>" + widget.info.headerText + "\n" + widget.body + "</html>";
			}
			var emailBody = widget.emailBody;

			var signature = "";
			var billingSystem = widget.caseDetails.billingSystem;

			var queueName = widget.caseDetails.queueName;

			if (queueName && queueName == "Premier Lingo Support") {
				signature = `\n\nThank you,\n\n` + `Premier Commercial Support Team\n800-466-9919\n`;
			} else if (queueName && queueName == "ION Premier Lingo") {
				signature = `\n\nThank you,\n\n` + `Premier Commercial Support Team\n800-466-9919\n`;
			} else if (queueName && queueName == "CSS Admin") {
				signature = `\n\nThank you,\n\n` + `Client Support Team\n877-438-2855\n`;
			} else if (queueName && queueName == "CRT") {
				signature = `\n\nThank you,\n\n` + `CRT Code Red Team\n248.784.2589\n`;
			} else if (billingSystem != null && billingSystem.includes("Lingo")) {
				signature = `\n\nThank you,\n\n` + `The Lingo ARC Repair Team\n866.405.4646\n`;
			} else {
				signature = `\n\nThank you,\n\n` + `The Lingo ARC Repair Team\n877.438.2855\n`;
			}

			if (signature.length > 0)
				emailBody.set('value', signature);


			emailBody.focus();
			var textareaNode = emailBody.textarea;

			if (textareaNode) {
				textareaNode.selectionStart = 0;
				textareaNode.selectionEnd = 0;
			}

			widget.submitBtn.on("click", function () {

				if (!widget.validate()) {
					return;
				}
				var subject = widget.emailSub.get('value').trim();
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
					"from": widget.emailFrom.get('value'),
					"replyTo": widget.emailReplyTo.get('value'),
					"to": toEmails,
					"cc": ccEmails,
					"subject": widget.emailSub.get('value').trim(),
					"body": widget.convertToHtml(widget.emailBody.get('value').trim()),
					"url": widget.info.xjmid
				}

				if (widget.includeOrgEmail.checked) {
					info.body += "\n" + headerText + emailBody
				}

				if (widget.caseId) {
					info.caseId = widget.caseId;
				}
				if (widget.info.isNewEmail) {
					info.isNewEmail = 1;
					info.url = "NEW";
				}
				info.files = widget.uploadedFileNames;
				info.agentName = window.localStorage.getItem("agentName");

				var callback = function () {
					widget.sendEmailDlg.hide();
				}
				widget.ctrl.sendEmail(info, lang.hitch(this, callback));
			});

			widget.cancelBtn.on("click", lang.hitch(this, function () {
				widget.sendEmailDlg.hide();
			}));

			on(widget.sendEmailDlg, "hide", lang.hitch(this, function () {
				widget.sendEmailDlg.destroyRecursive();
				this.destroy();
			}));

			widget.uploadFileBtn.on("click", lang.hitch(this, function () {
				new UploadFile({ lingoController: widget.ctrl, caseId: widget.caseId, manualAttachment: 0 });
			}));

			widget.sendEmailDlg.show();

		},
		validateEmails: function (emailString) {
			var emails = emailString.split(',').map(function (email) {
				return email.trim();
			});

			var emailPattern = /^[^\s@\n\;]+@[^\s@\n\;.]+(\.[^\s@\n\;]+)+$/;

			return emails.every(function (email) {
				return emailPattern.test(email);
			});
		},
		validate: function () {
			var widget = this;
			if (!widget.sendEmailForm.validate())
				return false;
			else
				return true;

		},
		escapeHtml: function (text) {
			return text
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;');
		},
		convertToHtml: function (plainText) {
			var widget = this;

			// Escape HTML characters
			let html = widget.escapeHtml(plainText);

			// Replace newlines with <br>
			html = html.replace(/\n/g, '<br>');

			return html;
		},
		findEmailInString: function (inputString) {

			if (inputString == null || inputString.length == 0)
				return null;
			const lowerCaseInput = inputString.toLowerCase();
			const emailList = environment.allowedReplyAddress;
			// Loop through each email in the list
			for (const email of emailList) {
				// Check if the lowercased input string contains the lowercased email
				if (lowerCaseInput.includes(email)) {
					return email; // Return the first matching email
				}
			}
			return null; // Return null if no match is found
		},
		removeMatchedEmails: function (inputString) {
			if (!inputString || inputString.length === 0) {
				return { filteredString: inputString, matchedAddresses: [] }; // Return original string and empty matched array if input is empty
			}

			const emailList = environment.allowedReplyAddress; // Assuming this is an array of emails

			// Split the input string into an array of strings
			const inputArray = inputString.split(',').map(item => item.trim());

			// Create arrays to hold matched and unmatched addresses
			const matchedAddresses = [];

			// Filter the input array to remove any strings found in the allowedReplyAddress
			const resultArray = inputArray.filter(input => {
				input = input.toLowerCase();
				if (emailList.includes(input)) {
					matchedAddresses.push(input); // Add matched address to the matchedAddresses array
					return false; // Exclude this address from the result
				}
				return true; // Keep this address in the result
			});

			// Join the resulting array back into a comma-separated string
			const filteredString = resultArray.join(', ');

			// Return both the filtered string and the matched addresses
			return {
				filteredString: filteredString,
				matchedAddresses: matchedAddresses
			};
		},
		containsAny: function (array1String, array2) {
			if (!array1String)
				return 0;
			// Check if array2 is an array
			if (!Array.isArray(array2)) {
				throw new TypeError('The second input must be an array.');
			}

			// Split the comma-separated string into an array and trim whitespace
			const array1 = array1String.split(',').map(item => item.trim());

			return array1.some(item1 =>
				array2.some(item2 =>
					item1.toLowerCase().includes(item2.toLowerCase())
				)
			);
		},
		removeDuplicateEmails: function (emailString) {
			let emailArray = emailString.split(',').map(email => email.trim());

			let uniqueEmails = [...new Set(emailArray)];

			return uniqueEmails.join(', ');
		},
		destroy: function () {
			this.inherited(arguments);
			this.handle1.remove();
		}
	});

});
