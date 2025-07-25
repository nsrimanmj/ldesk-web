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
	"dijit/form/Button",
	"app/widgets/sendEmail",
	"app/widgets/caseEmailData",
	"dojo/dom-class",
	"dojo/text!app/widgets/templates/case_emails.html",
	"dojo/domReady!"
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, domStyle, lang, on, topic, OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, DijitRegistry, SummaryRow, Button, SendEmail, CaseEmailData, domClass, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			widget.muaEmails = new Memory({
				idProperty: function (obj) {
					return obj.message_id;
				},
				data: []
			});

			widget.muaFilteredEmails = new Memory({
				idProperty: function (obj) {
					return obj.message_id;
				},
				data: []
			});

			widget.recordType = this.info.groupName;
			widget.isLoaded = false;
			widget.mua_mail_index = -1;
			widget.subject = "";
			widget.threadId = "";
			widget.body = "";
			widget.isSolarwindEmail = 0;
			widget.solarwindIndex = 0;
			widget.handle1 = topic.subscribe("lingoController/Case-" + widget.info.caseId + "muaEmailsLoaded", lang.hitch(this, function (info) {
				widget.loadEmails(info);
				widget.updateMUAIndex();
			}));
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		init: function (data) {
			var widget = this;
			widget.mua_mail_index = -1;
			widget.isLoaded = false;
			widget.latestEmail = 0;
			widget.message_id = 0;
			if (data) {
				widget.info = data;
			}
			widget.ctrl.getMUAEmails(widget.info);
		},
		parseTimeIn: function (timeIn) {
			const [datePart, timePart] = timeIn.split(' ');
			const [year, month, day] = [datePart.slice(0, 4), datePart.slice(4, 6), datePart.slice(6, 8)];
			const [hours, minutes, seconds] = timePart.split(':');

			// Create and return a Date object
			return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
		},
		loadEmails: function (info) {
			var widget = this;
			widget.isSolarwindEmail = 0;
			widget.solarwindIndex = 0;
			widget.subject = info.subject;
			widget.threadId = info.threadId;
			var data = info.emails;
			if (!this.isLoaded) {
				data.forEach(item => {
					if (item.mail_in_mua === 1) {
						const convertedTime = widget.convertISTtoEDT(item.TIME_IN);
						item.TIME_IN = convertedTime; // Update the TIME_IN field
					}
				});
				const finalData = data.sort((a, b) => {
					const timeA = widget.parseTimeIn(a.TIME_IN);
					const timeB = widget.parseTimeIn(b.TIME_IN);
					return timeB - timeA; // Sort in descending order
				});

				widget.muaEmails.setData(finalData);

				this.isLoaded = true;
			}

			if (this.isActionAllowed("case-send-email", this.recordType)) {
				if (widget.muaEmails.data.length == 0 && widget.info.groupName != "Network") {
					domStyle.set(widget.sendMailBtn.domNode, "display", "inline-block");
				} else if (widget.muaEmails.data.length == 1 && widget.info.groupName != "Network" && widget.muaEmails.data[0].from_address == "fms@bullseyetelecom.com") {
					domStyle.set(widget.sendMailBtn.domNode, "display", "inline-block");
				} else {
					domStyle.set(widget.sendMailBtn.domNode, "display", "none");
				}
			}

			widget.emailsGrid.refresh();
			widget.emailsGrid.resize();

		},
		updateMUAIndex: function () {
			var widget = this;
			var matchingRecMailInMua = [];
			var matchingRecMessageIdNotNew = [];

			widget.muaEmails.data.forEach(function (record) {

				if (record.mail_in_mua === 1) {
					matchingRecMailInMua.push(record);

					if (record.from_address === "fms@bullseyetelecom.com") {
						widget.isSolarwindEmail = 1;
					}
				}

				if (record.agentName !== "MARCOM") {
					matchingRecMessageIdNotNew.push(record);
				}
			});

			//This flag is set to know whether there any emails from Customer for Solarwind emails - If there are emails then 
			//provide reply button for customer email - instead of marcom
			if (widget.isSolarwindEmail == 1 && matchingRecMailInMua.length == 1) {
				widget.solarwindIndex = 1;
			}

			widget.muaFilteredEmails.setData(matchingRecMessageIdNotNew);
			// Get the row number of the first matching record
			var rowNumber = (matchingRecMailInMua.length > 0) ? widget.muaEmails.data.indexOf(matchingRecMailInMua[0]) : -1;
			widget.mua_mail_index = rowNumber;

			if (widget.muaFilteredEmails.data.length == 0 || widget.solarwindIndex == 1) {
				widget.emailFilter.set("value", 1);
			} else {
				widget.getFilteredEmails();
			}
		},
		renderMessageId: function (data, value, cell) {
			var widget = this;

			var w = new Button({
				label: "View",
				onClick: function () {
					var rowIndex = widget.muaEmails.data.indexOf(data);
					widget.getMessageDetails(data, rowIndex);
				}
			}, cell.appendChild(document.createElement("div")));
			w._destroyOnRemove = true;
			return w;
		},
		renderDesc: function (data, value, cell) {
			var widget = this;

			var desc = "";
			if (!data.invalidStatus) {
				desc = "";
			} else if (data.invalidStatus == -1) {
				desc = "NO VALID EMAILS";
			} else if (data.invalidStatus == 2) {
				desc = "SOME INVALID EMAILS";
			}
			var div = cell.appendChild(document.createElement("div"));
			dojo.create("label", {
				innerHTML: desc
			}, div);

		},

		getMessageDetails: function (data, rowIndex) {
			var widget = this;
			var time = data.TIME_IN.split(" ");
			var info = {};


			info.messageId = data.message_id;
			info.actionType = data.action_type_name;
			info.queuePath = environment.mailQueuePath;
			info.timeAction = time[0];

			var callback = function (data1) {

				var info = {};
				info.headers = widget.updateHeaderArea(data1);
				info.body = widget.updateBodyArea(data1);
				info.attachments = data1.attachments;
				var isLatestEmail = 0;

				if (widget.info.statusId != 4 && widget.info.statusId != 3) {
					isLatestEmail = 1;
				}

				info.isLatestEmail = isLatestEmail;
				info.caseId = widget.info.caseId;

				new CaseEmailData({ lingoController: widget.ctrl, info: info, emailData: data, finalSub: widget.subject, caseDetails: widget.info });

			};
			if (data.mail_in_mua)
				widget.ctrl.getMUAMessage(info, lang.hitch(this, callback));
			else
				widget.ctrl.getContentByMailId(data.message_id, lang.hitch(this, callback));

		},
		formatTime: function (value, object) {
			var time = value.split(" ")[0];
			return time.substr(4, 2) + "/" + time.substr(6, 2) + "/" + time.substr(0, 4) + " " + value.split(" ")[1];
		},
		postCreate: function () {
			var widget = this;

			var Grid = declare([OnDemandGrid, Selection, ColumnResizer, ColumnReorder, ColumnHider, DijitRegistry, SummaryRow]);

			var layout = [
				{ label: '', field: 'action', width: 70, renderCell: lang.hitch(this, this.renderMessageId) },
				{ label: "Email", field: "from_address", width: 200 },
				{ label: "Time In", field: "TIME_IN", width: 150, formatter: lang.hitch(this, widget.formatTime) },
				{ label: "Subject", field: "subject" },
				{ label: "Sent By", field: "agentName", width: 200 },
				{ label: "Invalid Emails", field: "comments", width: 200 },
				{ label: "Comments", field: "desc", width: 200, renderCell: lang.hitch(this, this.renderDesc) }

			];

			var renderRowColor = function () {
				var row = this.inherited(arguments);
				var data = arguments[0];

				if (!data.invalidStatus)
					return row;

				if (data.invalidStatus == -1) {
					domClass.add(row, "bg-red");
				} else if (data.invalidStatus == 2) {
					domClass.add(row, "bg-yellow");
				}

				return row;
			}

			widget.emailsGrid = new Grid({
				loadingMessage: "Grid is loading",
				noDataMessage: "No Data!",
				columns: layout,
				className: "lingogrid",
				keepScrollPosition: true,
				selectionMode: 'none',
				height: "100%",
				autoWidth: true,
				rowSelector: '20px',
				renderRow: renderRowColor,
				sort: [{ "property": "TIME_IN", descending: true }]
			}, widget.muaEmailsDiv);



			widget.emailsGrid.startup();
			widget.emailsGrid.refresh();
			widget.emailsGrid.resize();

			var emailData = {
				"from_address": widget.info.contactEmail
			}

			var info = widget.info;
			info.isNewEmail = 1;

			on(widget.sendMailBtn, "click", function () {
				new SendEmail({ lingoController: widget.ctrl, info: info, emailData: emailData, finalSub: widget.subject, caseDetails: widget.info, caseId: widget.info.caseId });
			});

			on(widget.mailReloadBtn, "click", function () {
				widget.init(widget.info, true);
				widget.emailsGrid.refresh();
				widget.emailsGrid.resize();
			});

			on(widget.emailFilter, "change", function () {
				widget.getFilteredEmails();
			});

		},
		updateHeaderArea: function (mailObject) {
			var widget = this;

			var headerText = "";

			var info = {};
			var fromHeaderValue = widget.extractEmailAddresses(mailObject.headers.from);
			var toHeaderValue = widget.extractEmailAddresses(mailObject.headers.to);
			var ccHeaderValue = widget.extractEmailAddresses(mailObject.headers.cc);
			var dateHeaderValue = mailObject.headers.date;
			var subjectHeaderValue = mailObject.headers.subject;
			var xjmidHeaderValue = mailObject.headers["x-juno-message-id"];

			if ((fromHeaderValue != null) && (fromHeaderValue.length != 0)) {
				headerText = headerText + "<b>From: </b>" + fromHeaderValue + "<br>";
				info.from = fromHeaderValue;
			}
			if ((toHeaderValue != null) && (toHeaderValue.trim().length != 0)) {
				headerText = headerText + "<b>To: </b>" + toHeaderValue + "<br>";
				info.to = toHeaderValue;
			}
			if ((ccHeaderValue != null) && (ccHeaderValue.trim().length != 0)) {
				headerText = headerText + "<b>Cc: </b>" + ccHeaderValue + "<br>";
				info.cc = ccHeaderValue;
			}
			if ((dateHeaderValue != null) && (dateHeaderValue.trim().length != 0)) {
				headerText = headerText + "<b>Date: </b>" + dateHeaderValue + "<br>";
				info.date = dateHeaderValue;
			}
			if ((subjectHeaderValue != null) && (subjectHeaderValue.trim().length != 0)) {
				headerText = headerText + "<b>Subject: </b>" + subjectHeaderValue + "<br>";
				info.subject = subjectHeaderValue;
			}
			if ((xjmidHeaderValue != null) && (xjmidHeaderValue.trim().length != 0)) {
				// headerText = headerText + "<b>X-Juno-Message-Id: </b>" + xjmidHeaderValue + "<br>";
				info.xjmid = xjmidHeaderValue;
			}

			info.headerText = headerText;
			return info;

		},
		updateBodyArea: function (mailObject) {
			var widget = this;
			var plainTextContent = mailObject.text;
			var htmlContent = mailObject.html;

			if (htmlContent != null) {
				if (htmlContent.indexOf("<style") != -1) {
					var textBeforeStyleTag = htmlContent.substring(0, htmlContent.indexOf('<style>'));
					var textAfterStyleTag = htmlContent.substring(htmlContent.indexOf('</style>') + 8);
					htmlContent = "";
					htmlContent = htmlContent.concat(textBeforeStyleTag);
					htmlContent = htmlContent.concat(textAfterStyleTag);
				}
				htmlContent = this.preprocessHtml(htmlContent);

				return htmlContent;
			}


			if (plainTextContent != null) {
				plainTextContent = widget.renderNonHtmlTags(plainTextContent);
				plainTextContent = plainTextContent.replace(/(?:\r\n|\r|\n)/g, '<br />');
				return plainTextContent;
			}

			return "";

		},
		preprocessHtml: function (htmlContent) {
			if (this.regexVector == null)
				this.initializeRegexVector();
			for (var i = 0; i < this.regexVector.length; i++) {
				htmlContent = htmlContent.replace(new RegExp(this.regexVector[i], "g"), "");
			}
			return htmlContent;
		},
		initializeRegexVector: function () {
			this.regexVector = [];

			var regexbackgroundImage = "background(-image)?\\s*(=|:\\s*url)?\\s*(\'|\"|\\(){0,3}(\\s*https?(://)?(([-\\w\\.]+)+(:\\d+)?(/([\\w/_\\-\\.~$+!*]*(\\?\\S+)?)?)?)?)(\'|\"|\\)){0,3}"; //regex for background images
			var regexLink = "<link.*>"; //regex to remove the external links
			var regexImage = "<img[^>]*>";
			var regexAttachment = "<div class=\"mailparser-attachment\">.*?<\\/div>";
			var regexOP = "<o:p>.*?<\\/o:p>";
			this.regexVector.push(regexbackgroundImage);
			this.regexVector.push(regexLink);
			this.regexVector.push(regexImage);
			this.regexVector.push(regexAttachment);
			this.regexVector.push(regexOP);
		},
		renderNonHtmlTags: function (content) {
			var leftArrowfindStr = "<"; //replace email-address
			var leftArrowRegexFind = new RegExp(leftArrowfindStr, "g");
			var leftArrowReplaceStr = "&lt;"; //escape tags
			var rightArrowfindStr = ">"; //replace email-address
			var rightArrowRegexFind = new RegExp(rightArrowfindStr, "g");
			var rightArrowReplaceStr = "&gt;"; //escape tags
			content = content.replace(leftArrowRegexFind, leftArrowReplaceStr);
			content = content.replace(rightArrowRegexFind, rightArrowReplaceStr);
			return content;
		},
		extractEmailAddresses1: function (emailString) {
			const regex = /<?([^<>@]+@[^<>]+)>?/g;
			let result = [];
			let match;

			// Loop through all matches
			while ((match = regex.exec(emailString)) !== null) {
				result.push(match[1]); // Get only the email address
			}
			return result.join(', ');
		},
		extractEmailAddresses: function (emailString) {
			if (!emailString) {
				return ''; // Return an empty string if input is null or empty
			}

			const entries = emailString.split(','); // Split the input by commas
			const result = [];

			entries.forEach(entry => {
				const regex = /<([^<>@]+@[^<>]+)>/; // Match email inside angle brackets
				const match = regex.exec(entry.trim()); // Trim whitespace and check for match

				if (match) {
					result.push(match[1]); // If found, push the email from brackets
				} else {
					// If no brackets, extract the email from the entry
					const fallbackMatch = /([^<>@]+@[^<>]+)/.exec(entry.trim());
					if (fallbackMatch) {
						result.push(fallbackMatch[1]); // Push the email found
					}
				}
			});

			return result.join(', '); // Join results with commas
		},
		convertISTtoEDT: function (istDateTime) {
			var widget = this;

			// Parse the input string in yyyymmdd HH:mm:ss format
			const [datePart, timePart] = istDateTime.split(' ');
			const [year, month, day] = [datePart.slice(0, 4), datePart.slice(4, 6), datePart.slice(6, 8)];
			const [hours, minutes, seconds] = timePart.split(':');

			// Create a Date object for the IST time
			const istDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));

			// Convert IST to UTC by subtracting 5 hours and 30 minutes
			const utcTime = istDate.getTime() - (5.5 * 60 * 60 * 1000); // Subtract 5.5 hours

			// Create a UTC date object
			const utcDate = new Date(utcTime);

			// Determine the DST transition dates for the given year
			const startDST = widget.getSecondSundayInMarch(year);
			const endDST = widget.getFirstSundayInNovember(year);

			// Determine if the date is in DST (Eastern Time)
			const monthInET = utcDate.getUTCMonth() + 1; // Months are 0-indexed in JS
			const dayInET = utcDate.getUTCDate();
			const yearInET = utcDate.getUTCFullYear();

			let isDST = false;

			// Check for DST
			if (utcDate >= startDST && utcDate < endDST) {
				isDST = true;
			}

			// ET offset in milliseconds
			const etOffset = isDST ? -4 * 60 * 60 * 1000 : -5 * 60 * 60 * 1000; // -4 hours for EDT, -5 hours for EST
			const edtTime = new Date(utcTime + etOffset); // Convert UTC to ET

			// Format the ET time as a string in yyyymmdd HH:mm:ss format
			const edtYear = edtTime.getUTCFullYear();
			const edtMonth = String(edtTime.getUTCMonth() + 1).padStart(2, '0');
			const edtDay = String(edtTime.getUTCDate()).padStart(2, '0');
			const edtHours = String(edtTime.getUTCHours()).padStart(2, '0');
			const edtMinutes = String(edtTime.getUTCMinutes()).padStart(2, '0');
			const edtSeconds = String(edtTime.getUTCSeconds()).padStart(2, '0');

			return `${edtYear}${edtMonth}${edtDay} ${edtHours}:${edtMinutes}:${edtSeconds}`;
		},
		getSecondSundayInMarch: function (year) {
			const date = new Date(Date.UTC(year, 2, 1));
			const firstSunday = 1 + (7 - date.getUTCDay()) % 7;
			return new Date(Date.UTC(year, 2, firstSunday + 7, 2, 0, 0));
		},


		getFirstSundayInNovember: function (year) {
			const date = new Date(Date.UTC(year, 10, 1));
			const firstSunday = 1 + (7 - date.getUTCDay()) % 7;
			return new Date(Date.UTC(year, 10, firstSunday, 2, 0, 0));
		},

		getFilteredEmails: function () {
			var widget = this;

			var checked = widget.emailFilter.checked;

			if (checked) {
				widget.emailsGrid.set("collection", widget.muaEmails);
			} else {
				widget.emailsGrid.set("collection", widget.muaFilteredEmails);
			}

			//widget.emailsGrid.refresh();
			//widget.emailsGrid.resize();
			//widget.emailsGrid.startup();
			this.updateGridSettings(widget.emailsGrid, widget.muaEmails, "lingogrid", 30);

		},
		setGridRowHeight: function (gridClass, rowHeight) {
			const styleId = 'dynamic-dgrid-row-height-style';

			// Remove old style if exists
			const oldStyle = document.getElementById(styleId);
			if (oldStyle) {
				oldStyle.remove();
			}

			// Create new style
			const style = document.createElement('style');
			style.id = styleId;
			style.innerHTML = `
        .${gridClass} .dgrid-row,
        .${gridClass} .dgrid-row td {
          height: ${rowHeight}px !important;
        }
      `;
			document.head.appendChild(style);
		},

		// Method to update minRowsPerPage based on store length and apply row height
		updateGridSettings: function (grid, store, gridClass, desiredRowHeight, maxRowsCap) {
			maxRowsCap = maxRowsCap || 300; // default cap if not provided

			// Set the CSS for row height
			this.setGridRowHeight(gridClass, desiredRowHeight);

			// Get total rows from the Memory store
			const totalRows = store.data.length;

			// Calculate minRowsPerPage (capped for performance)
			const minRows = Math.max(totalRows, maxRowsCap);

			// Update grid properties
			grid.minRowsPerPage = minRows;
			grid.maxRowsPerPage = minRows + 50;  // optional
			grid.bufferRows = 50;                 // optional

			// Refresh & resize the grid to apply changes
			grid.refresh().then(() => {
				grid.resize();
			});
		},


		destroy: function () {
			this.inherited(arguments);
			this.handle1.remove();
		}
	});

});