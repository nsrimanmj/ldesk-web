define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dijit/Dialog",
	"dojo/text!app/widgets/templates/collection_send_notice.html",
	"app/widgets/sendCollectionMail",
	"dojo/domReady!"
], function (declare, _parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, domStyle, on, _Dialog, template, SendCollectionMail) { // jshint ignore:line

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;
			widget.data = widget.info;
			widget.collectionData = widget.data.collectionInfo;
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {

		},
		setNoticeValues: function () {
			const widget = this;
			const data = widget.collectionData;

			//check for an exception
			if (!data.denyDate || !data.disconnectDate || !data.contactEmail) {
				domStyle.set(widget.exceptionDiv, "display", "inline-block");
				domStyle.set(widget.noticeBtnDiv, "display", "none");
			}


			// Utility for setting innerHTML if value exists
			const setHTML = (element, value, format = false) => {
				if (value !== undefined && element) {
					element.innerHTML = format ? widget.formatDateToStr(value, "MMMM d, yyyy") : value;
				}
			};

			setHTML(widget.caseId, data.caseId);
			setHTML(widget.accountNameSpan, data.accountName);
			setHTML(widget.appIdSpan, data.accountId);
			setHTML(widget.denyDate, data.denyDate, true);
			setHTML(widget.disConDate, data.disconnectDate, true);
			setHTML(widget.treatStatus, data.treatmentStatus);
			setHTML(widget.remSent, data.remainderDate, true);
			setHTML(widget.susNotDate, data.suspendNoticeDate, true);
			setHTML(widget.disConNotDate, data.disconnectNoticeDate, true);
			setHTML(widget.finalDemDate, data.finalDemandNoticeDate, true);

			// Button logic
			widget.remBtn.set("disabled", !(data.suspendNoticeDate === undefined &&
				data.disconnectNoticeDate === undefined &&
				data.remainderDate === undefined &&
				data.finalDemandNoticeDate === undefined));

			widget.suspendBtn.set("disabled", !(data.suspendNoticeDate === undefined &&
				data.disconnectNoticeDate === undefined &&
				data.finalDemandNoticeDate === undefined));

			widget.disConBtn.set("disabled", !(data.disconnectNoticeDate === undefined &&
				data.finalDemandNoticeDate === undefined));

			widget.finDemBtn.set("disabled", data.finalDemandNoticeDate !== undefined);
		},
		postCreate: function () {
			const widget = this;

			widget.setNoticeValues();

			// Utility function for setting notice date section and type flags
			const handleNoticeClick = function (typeLabel, typeKey) {


				if (typeKey == "finDem") {
					domStyle.set(widget.noticeBtnDiv, "display", "none");
					domStyle.set(widget.actionBtnDiv, "display", "inline");
					domStyle.set(widget.noticeDateDiv, "display", "block");
					widget.noticeDateText.innerHTML = typeLabel;
					widget.noticeDate.focus();
					widget.noticeDate.required = true;
				} else {
					widget.sendNoticeMail();
				}
				// Reset all flags
				widget.data.isRem = "false";
				widget.data.isSus = "false";
				widget.data.disCon = "false";
				widget.data.finDem = "false";

				// Set the current flag
				widget.data[typeKey] = "true";
			};

			on(widget.remBtn, 'click', () => handleNoticeClick("Reminder Notice", "isRem"));
			on(widget.suspendBtn, 'click', () => handleNoticeClick("Suspension Notice", "isSus"));
			on(widget.disConBtn, 'click', () => handleNoticeClick("Disconnection Notice", "disCon"));
			on(widget.finDemBtn, 'click', () => handleNoticeClick("Final Demand Notice Date", "finDem"));

			on(widget.prevBtn, 'click', function () {
				widget.noticeDate.set('value', '');       // Clear the value
				widget.noticeDate.reset();
				domStyle.set(widget.noticeDateDiv, "display", "none");
				domStyle.set(widget.noticeBtnDiv, "display", "inline");
				domStyle.set(widget.actionBtnDiv, "display", "none");
			});

			on(widget.nextBtn, 'click', function () {
				if (!widget.noticeDate.validate()) {
					widget.noticeDate.focus();
					return;
				}
				widget.data.noticeDate = widget.noticeDate.get("value");
				widget.sendNoticeMail();
			});

			on(widget.closeBtn, 'click', function () {
				widget.sendNoticeDialog.destroyRecursive();
				widget.destroy();
			});
			widget.sendNoticeDialog.show();
		},
		sendNoticeMail: function () {
			var widget = this;

			new SendCollectionMail({
				lingoController: widget.lingoController,
				info: widget.data,
				prevDlg: widget.sendNoticeDialog
			});
			widget.sendNoticeDialog.hide();
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
