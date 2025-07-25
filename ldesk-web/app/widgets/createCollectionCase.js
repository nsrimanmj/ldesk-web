define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/_base/lang",
	"dojo/on",
	"dijit/registry",
	"app/view/messageWindow",
	"dojo/text!app/widgets/templates/create_collection_case.html",
	"app/model/States",
	"dojo/domReady!"
], function (
	declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, on, registry, messageWindow, template, States
) {

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], {
		templateString: template,
		widgetsInTemplate: true,
		info: null,

		constructor: function (args) {
			lang.mixin(this, args);
			const widget = this;

			widget.ctrl = widget.lingoController;

			widget.caseName = widget.data.type;
			widget.accountId = registry.byId("app_id").get("value");
			widget.accName = registry.byId("account_name_acc").get("value");
			widget.agentStore = widget.ctrl.getAgentStore();

			this.reqLabel = "<req>";
		},

		buildRendering: function () {
			this.inherited(arguments);
		},

		resize: function () {
			this.inherited(arguments);
		},

		init: function () {
			this.caseMgmtForm.reset();
		},

		postCreate: function () {
			const widget = this;

			if (!widget.accountId) {
				new messageWindow({
					title: "ERROR",
					message: "Please search with an AppId!!"
				});
				return;
			}

			widget._getAgingDetails();
			widget.agentInfo = widget.agentStore.getAgentsByGroup("Collections");
			widget.ownerId.set("store", widget.agentInfo);
			widget.collectionDlg.set("title", widget.caseName + " Management");
			widget.collectionDlg.show();

			on(widget.closeBtn, 'click', function () {
				widget.collectionDlg.destroyRecursive();
				widget.destroy();
			});

			on(widget.submitBtn, 'click', function () {
				widget._createCase();
			});
		},
		_createCase: function () {
			const widget = this;

			if (!widget.createForm.validate()) {
				return;
			}

			const caseInfo = widget._getInfo();
			widget.ctrl.createCase(caseInfo, function (obj) {
				if (obj.response.code === 200) {
					widget.collectionDlg.destroyRecursive();
					widget.destroy();
				}
			});
		},
		_getInfo: function () {
			const widget = this;

			const caseInfo = {
				categoryId: 3,
				serviceNumber: "0",
				originId: 11,
				origin: "LDesk",
				groupName: "Collections",
				description: "test",
				accountId: widget.accountId,
				accountName: widget.accName || "",
				contactName: widget.colContactName?.get("value") || "",
				contactPhone: widget.colContactPhone?.get("value") || "",
				contactEmail: widget.collEmail?.get("value") || "",
				ownerId: widget.ownerId?.get("value") || "",
				status: "New"
			};

			const agingInfo = widget.accountAgingInfo || {};
			const collectionInfo = {
				accountId: widget.accountId,
				accountName: widget.accName || "",
				contactName: widget.colContactName?.get("value") || "",
				contactPhone: widget.colContactPhone?.get("value") || "",
				contactEmail: widget.collEmail?.get("value") || "",
				beginningBal: widget.begBalance?.get("value") || "0",
				denyDate: widget.getFormattedDateTime(widget.denyDate?.get("value")),
				disconnectDate: widget.getFormattedDateTime(widget.disconnectDate?.get("value")),
				finalDemandDate: widget.getFormattedDateTime(widget.finalDemandDate?.get("value")),
				dueAmount30Days: agingInfo.pastDue30DaysAmount || "0",
				dueAmount60Days: agingInfo.pastDue60DaysAmount || "0",
				totalBalance: agingInfo.totalDue || "0",
				lastPaymentDate: agingInfo.lastPaymentDate || null,
				lastPaymentAmt: agingInfo.lastPaymentAmount || "0"
			};

			caseInfo.collectionInfo = collectionInfo;
			return caseInfo;
		},
		_getAgingDetails: function () {
			const widget = this;
			const requestObj = { appId: widget.accountId };

			const callback = function (obj) {
				widget._setAgingInfo(obj);
			};

			widget.ctrl.getAPI("getAccAgingDetails", requestObj, callback, false, false);
		},
		_setAgingInfo: function (obj) {
			const widget = this;
			const data = obj?.data ?? {};

			const updateSpan = (value, span, formatter = v => v) => {
				if (value != null) {
					span.innerHTML = formatter(value);
				}
			};


			updateSpan(data.pastDue30DaysAmount, widget.past30Span, widget.formatAmount);
			//updateSpan(data.appId, widget.appIdSpan);
			updateSpan(data.lastPaymentDate, widget.lastPymtDate, val => widget.formatDateToStr(val, "MMMM d, yyyy"));
			updateSpan(data.lastPaymentAmount, widget.lastPymtAmt, widget.formatAmount);
			updateSpan(data.pastDue60DaysAmount, widget.past60Span, widget.formatAmount);
			updateSpan(data.totalDue, widget.totalBalance, widget.formatAmount);
			//updateSpan(data.customerName, widget.accountNameSpan);
			updateSpan(widget.accountId, widget.appIdSpan);
			updateSpan(widget.accName, widget.accountNameSpan);

			widget.accountAgingInfo = data;
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});
});
