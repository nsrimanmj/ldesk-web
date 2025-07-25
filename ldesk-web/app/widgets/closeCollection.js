define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dojo/text!app/widgets/templates/close_collection.html",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/registry",
	"dijit/Dialog"
], function (declare, lang, domStyle, on, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, Dialog) {
	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], {
		templateString: template,
		widgetsInTemplate: true,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.data = widget.info;
			widget.ctrl = widget.lingoController;
			widget.dispositionType = "Paid";
		},
		buildRendering: function () {
			this.inherited(arguments);
		},

		resize: function () {
			this.inherited(arguments);
		},
		init: function () {
		},

		selectDispositionType: function (evt) {
			var selectedType = evt.target.value;

			// Hide all
			domStyle.set(this.sectionPaid, "display", "none");
			domStyle.set(this.sectionDisCon, "display", "none");

			// Clear previous required flags
			this.paidDate.set("required", false);
			this.paidAmt.set("required", false);
			this.disconnectDate.set("required", false);
			this.disconnectOrderId.set("required", false);

			if (selectedType === "Paid") {
				domStyle.set(this.sectionPaid, "display", "block");
				this.paidDate.set("required", true);
				this.paidAmt.set("required", true);
			} else if (selectedType === "Disconnected") {
				domStyle.set(this.sectionDisCon, "display", "block");
				this.disconnectDate.set("required", true);
				this.disconnectOrderId.set("required", true);
			}

			this.dispositionType = selectedType;
		},
		postCreate: function () {
			var widget = this;

			widget.submitBtn.on("click", lang.hitch(this, this._submit));

			on(widget.closeBtn, "click", function () {
				widget.closeCollectionDialog.hide();
			});

			widget.closeCollectionDialog.show();

		},
		_submit: function () {
			var widget = this;

			if (!this.closeCollectionForm.validate()) {
				return false;
			}

			var info = dojo.clone(widget.data);
			info.collectionInfo.closeReason = widget.dispositionType;

			if (widget.dispositionType == "Paid") {
				info.collectionInfo.endDate = widget.getFormattedDateTime(widget.paidDate.get("value"));
				info.collectionInfo.paidAmt = widget.formatAmountToDouble(widget.paidAmt.get("value"));
			} else if (widget.dispositionType == "Disconnected") {
				info.collectionInfo.endDate = widget.getFormattedDateTime(widget.disconnectDate.get("value"));
				info.collectionInfo.disconnectOrderId = widget.disconnectOrderId.get("value");
			}

			var resolutionDesc = widget.resDescription.get("value") || "";
			info.collectionInfo.resolutionDesc = resolutionDesc;
			info.resolutionDescription = resolutionDesc;

			info.status = "Closed";
			info.statusId = 4;

			var callback = function (obj) {
				if (obj.response.code == 200) {
					widget.closeCollectionDialog.destroyRecursive();
					new messageWindow({
						message: "Case Closed Successfully",
						title: "Success"
					});
				} else {
					new messageWindow({
						message: obj.response.message,
						title: "Error"
					});
				}
			};

			this.ctrl.updateCase(info, lang.hitch(this, callback));
		},
		_validate: function (dispositionType) {

			if (!this.closeCollectionForm.validate()) {
				return false;
			}

			return true;
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});


});