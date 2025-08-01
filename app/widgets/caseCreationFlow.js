define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dstore/Memory",
	"dstore/legacy/DstoreAdapter",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-style",
	"dojo/on",
	"dijit/registry",
	"dojox/validate/regexp",
	"app/view/messageWindow",
	"app/model/miniStores",
	"dojo/text!app/widgets/templates/case_creation_flow.html",
	"app/view/ValidationTextarea",
	"app/model/States",
	"dojo/domReady!"
], function (declare, _parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, DstoreAdapter, lang, arrayUtil, domStyle, on, registry, regexp, messageWindow, MiniStores, template, _ValidationTextarea, States) { // jshint ignore:line

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.caseName = widget.data.type;
			widget.accountId = registry.byId("app_id").get("value");
			widget.userInfo = window.localStorage.getItem("userInfo");

			widget.ctrl = widget.lingoController;
			widget.categoryStore = widget.ctrl.getCategoryStore(widget.caseName);
			widget.categoryStore.remove("DefaultEmail");
			this.reqLabel = "<req>";
			if (widget.caseName == "Inquiry" || widget.caseName == "Equipment") {
				this.reqLabel = "";
			}

			widget.miniStores = new MiniStores();
			widget.statesModel = new States();
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
		getInfo: function () {
			var widget = this;

			var accountName = widget.ctrl.searchedAccData.companyName;
			var category = widget.caseCategory.get("value");
			var type = widget.caseSubCategory.get("value");
			var subType = widget.caseSubType.get("value");
			var wknd = 0;
			if (widget.weekendAccess.checked == true)
				wknd = 1;
			var dispatchPolicy = 0;
			if (widget.dispatchPolicy.checked == true)
				dispatchPolicy = 1;
			var internalTktNum = widget.internalTktNum.get("value");
			//var smsNumber = widget.smsNumber.get("value");
			var caseInfo = {
				"groupName": widget.caseName,
				"serviceNumber": widget.srvNumber.displayedValue ? widget.srvNumber.displayedValue : 0,
				"categoryId": widget.ctrl.getCategoryId(widget.caseName, category, type, subType),
				"description": widget.caseDescription.get("value"),
				"accountId": widget.accountId,
				"contactName": widget.contactName.get("value"),
				"contactPhone": widget.contactNum.get("value"),
				"contactEmail": widget.contactMail.get("value"),
				"localContactName": widget.locContactName.get("value"),
				"localContactNum": widget.locContactNum.get("value"),
				"contactMethod": widget.contactMethod.get("value"),
				"serviceAddress": widget.srvAddress.get("value"),
				"addressLine1": widget.addressLine1.value,
				"addressLine2": widget.addressLine2.value,
				"city": widget.city.value,
				"state": widget.state.value,
				"country": widget.country.value,
				"zipCode": widget.zipCode.value,
				"accessHrs": widget.locHr.get("value"),
				"timeZone": widget.timeZone.get("value"),
				"additionalEmail": widget.caseAddEmail.get("value"),
				"wkndAccess": wknd,
				"dispatchPolicy": dispatchPolicy,
				"dispatchAuthBy": widget.dispatchAuthBy.get("value"),
				"accountName": accountName,
				//data related to equipment case creation
				"shippingAddress": widget.shippingAddress.get("value"),
				"additionalInfo": widget.addInfo.get("value"),
				"modelSnQty": widget.modelQty.get("value"),
				"clientContactName": widget.clientContactName.get("value"),
				"clientContactPh": widget.clientContactNum.get("value"),
				"clientContactEmail": widget.eqClientContactMail.get("value"),
				"eqStatus": widget.eqStatus.get("value")
			};
			if (widget.caseName == "Equipment") {
				caseInfo["contactName"] = widget.eqContactName.get("value");
				caseInfo["contactPhone"] = widget.eqContactNum.get("value");
				caseInfo["contactEmail"] = widget.eqContactMail.get("value");
			}
			if (internalTktNum != "") {
				caseInfo["intTicketNum"] = internalTktNum;
			}

			return caseInfo;

		},
		postCreate: function () {
			var widget = this;
			var srvInfo;
			if (widget.accountId == "") {
				new messageWindow({
					title: "ERROR",
					message: "Please search with an AppId!!"
				});
				return;
			} else {
				if (widget.caseName != "Equipment") {
					var callback = function (obj) {
						widget.serviceStore = widget.setServiceStore(obj.data, widget.caseName);
						widget.srvNumber.set('store', widget.serviceStore);
						if (widget.serviceStore.store.data.length == 1)
							widget.srvNumber.set("value", widget.serviceStore.store.data[0].name);
					};
					widget.ctrl.getServiceDetails(widget.accountId, callback);
				} else {
					widget.srvNumber.set('disabled', true);
					widget.caseSubCategory.set('disabled', true);
					widget.caseSubType.set('disabled', true);
					//default contact name and contact email - running user name and mail
					var userInfoJsonObj = JSON.parse(widget.userInfo);
					console.log(userInfoJsonObj);
					widget.eqContactName.set("value", userInfoJsonObj.fullName);
					widget.eqContactMail.set("value", userInfoJsonObj.emailAddress);
				}
			}

			var title = widget.caseName + " Management";
			widget.createCaseDialog.set("title", title);
			widget.createCaseDialog.show();

			widget.timeZone.set("store", widget.miniStores.getTimeZoneStore());
			widget.contactMethod.set('store', widget.miniStores.getContactMethodStore());
			widget.eqStatus.set('store', widget.miniStores.getEquipmentStatus());
			widget.caseCategory.set('store', widget.categoryStore);
			widget.state.set("store", widget.statesModel.getStates());
			if (widget.caseCategory.store.data.length == 1) {
				widget.caseCategory.set("value", widget.caseCategory.store.data[0].name);
			}

			widget.caseCategory.on('change', function (value) {
				widget.caseSubCategory.reset();
				widget.caseSubType.reset();
				widget.caseSubCategory.set("required", false);
				widget.caseSubCategory.set("disabled", false);
				widget.caseSubCategory.set("placeHolder", "select a Type");
				widget.caseSubCategory.set("store", widget.ctrl.getTypeStore(value));
				//disable if type has no data and make it required if it has data
				if (widget.caseSubCategory.store.data.length == 0) {
					widget.caseSubCategory.set("disabled", true);
					widget.caseSubType.set("disabled", true);
					widget.caseSubCategory.set("required", false);
				} else if (widget.caseSubCategory.store.data.length == 1) {
					widget.caseSubCategory.set("disabled", false);
					widget.caseSubCategory.set("required", true);
					widget.caseSubCategory.set("value", widget.caseSubCategory.store.data[0].name);
				} else {
					widget.caseSubCategory.set("disabled", false);
					widget.caseSubCategory.set("required", true);
				}
			});

			var subTypeCB = widget.caseSubType;
			widget.caseSubCategory.on('change', function () {
				if (widget.caseName == "Inquiry") {
					subTypeCB.set("required", false);
					subTypeCB.set("disabled", true);
					return;
				}
				subTypeCB.reset();
				subTypeCB.set("required", false);
				subTypeCB.set("disabled", false);
				subTypeCB.set("placeHolder", "Select a SubType");
				subTypeCB.set("store", widget.ctrl.getSubTypeStore(widget.caseCategory.value, widget.caseSubCategory.value));
				//disable if type has no data and make it required if it has data
				if (subTypeCB.store.data.length == 0) {
					subTypeCB.set("disabled", true);
				} else if (subTypeCB.store.data.length == 1) {
					subTypeCB.set("disabled", false);
					subTypeCB.set("required", true);
					subTypeCB.set("value", subTypeCB.store.data[0].name);
				} else {
					subTypeCB.set("disabled", false);
					subTypeCB.set("required", true);
				}
			});
			widget.srvNumber.on('change', function (value) {
				if (!value) {
					widget.srvAddress.set("value", "");
					widget.addressLine1.value = "";
					widget.addressLine2.value = "";
					widget.city.value = "";
					widget.state.value = "";
					widget.country.value = "";
					widget.zipCode.value = "";
					return;
				}
				srvInfo = widget.serviceStore.get(value);
				widget.srvAddress.set("value", srvInfo.srvAddress);
				widget.addressLine1.set("value", srvInfo.address);
				widget.addressLine2.set("value", "");
				widget.city.set("value", srvInfo.city);
				widget.country.set("value", srvInfo.country);
				widget.state.set("value", srvInfo.state);
				widget.zipCode.set("value", srvInfo.zipCode);
				widget.addressLine1.value = widget.addressLine1.get("value");
				widget.addressLine2.value = widget.addressLine2.get("value");
				widget.city.value = widget.city.get("value");
				widget.state.value = widget.state.get("value");
				widget.country.value = widget.country.get("value");
				widget.zipCode.value = widget.zipCode.get("value");
				widget.setStCon(widget.country.value, widget.state.value);


			});

			on(widget.country, "change", function (val) {
				widget.state.reset();
				if (val == "US") {
					widget.state.set("store", widget.statesModel.getStates());
				} else if (val == "CA") {
					widget.state.set("store", widget.statesModel.getProvince());

				} else {
					widget.state.set("store", widget.statesModel.getDataStore());
				}
				if (srvInfo.state != undefined && srvInfo.state != "") {
					widget.state.set("value", srvInfo.state);
				}
			});

			//replace the servAdd if any of the below fields is changed


			on(widget.addressLine1, 'change', function (value) {
				//var addressLine1 = widget.addressLine1.get("value");
				if (value != undefined) {
					var servAdd = widget.srvAddress.get("value");
					var upServAdd = "";
					if (value != "") {
						upServAdd = value + ",";
					}
					if (widget.addressLine2.value != undefined && widget.addressLine2.value != "") {
						upServAdd = upServAdd + widget.addressLine2.value + ",";
					}

					if (widget.city.value != undefined && widget.city.value != "") {
						upServAdd = upServAdd + widget.city.value + ",";
					}

					if (widget.state.value != undefined && widget.state.value != "") {
						upServAdd = upServAdd + widget.state.value + ",";
					}
					if (widget.zipCode.value != undefined && widget.zipCode.value != "") {
						upServAdd = upServAdd + "," + widget.zipCode.value;
					}

					upServAdd = widget.trimCommas(upServAdd);

					if (upServAdd !== undefined && upServAdd !=
						"")
						widget.srvAddress.set("value", upServAdd);
					else {
						widget.srvAddress.set("value", servAdd);
					}

				}


			});
			on(widget.addressLine2, 'change', function (value) {
				//var addressLine1 = widget.addressLine1.get("value");
				if (value != undefined) {

					var servAdd = widget.srvAddress.get("value");
					var upServAdd = "";
					if (widget.addressLine1.value != undefined && widget.addressLine1.value != "") {
						upServAdd = upServAdd + widget.addressLine1.value + ",";
					}

					if (value != "") {
						upServAdd = upServAdd + value + ",";
					}

					if (widget.city.value != undefined && widget.city.value != "") {
						upServAdd = upServAdd + widget.city.value + ",";
					}

					if (widget.state.value != undefined && widget.state.value != "") {
						upServAdd = upServAdd + widget.state.value + ",";
					}
					if (widget.zipCode.value != undefined && widget.zipCode.value != "") {
						upServAdd = upServAdd + widget.zipCode.value + ",";
					}

					upServAdd = widget.trimCommas(upServAdd);
					if (upServAdd !== undefined && upServAdd !=
						"")
						widget.srvAddress.set("value", upServAdd);
					else {
						widget.srvAddress.set("value", servAdd);
					}
				}

			});
			on(widget.city, 'change', function (value) {
				//var city = widget.city.get("value");
				if (value != undefined) {
					var servAdd = widget.srvAddress.get("value");
					var upServAdd = "";
					if (widget.addressLine1.value != undefined && widget.addressLine1.value != "") {
						upServAdd = upServAdd + widget.addressLine1.value + ",";
					}
					if (widget.addressLine2.value != undefined && widget.addressLine2.value != "") {
						upServAdd = upServAdd + widget.addressLine2.value + ",";
					}

					if (value != "") {
						upServAdd = upServAdd + value + ",";
					}

					if (widget.state.value != undefined && widget.state.value != "") {
						upServAdd = upServAdd + widget.state.value + ",";
					}
					if (widget.zipCode.value != undefined && widget.zipCode.value != "") {
						upServAdd = upServAdd + widget.zipCode.value;
					}

					upServAdd = widget.trimCommas(upServAdd);
					if (upServAdd !== undefined && upServAdd !=
						"")
						widget.srvAddress.set("value", upServAdd);
					else {
						widget.srvAddress.set("value", servAdd);
					}
				}

			});
			on(widget.state, 'change', function (value) {
				//var state = widget.stateProvince.get("value");
				if (value != undefined) {
					var servAdd = widget.srvAddress.get("value");
					var upServAdd = "";
					if (widget.addressLine1.value != undefined && widget.addressLine1.value != "") {
						upServAdd = upServAdd + widget.addressLine1.value + ",";
					}
					if (widget.addressLine2.value != undefined && widget.addressLine2.value != "") {
						upServAdd = upServAdd + widget.addressLine2.value + ",";
					}
					if (widget.city.value != undefined && widget.city.value != "") {
						upServAdd = upServAdd + widget.city.value + ",";
					}
					if (value != "") {
						upServAdd = upServAdd + value + ",";

					}
					if (widget.zipCode.value != undefined && widget.zipCode.value != "") {
						upServAdd = upServAdd + widget.zipCode.value;
					}

					upServAdd = widget.trimCommas(upServAdd);
					if (upServAdd !== undefined && upServAdd !=
						"")
						widget.srvAddress.set("value", upServAdd);
					else {
						widget.srvAddress.set("value", servAdd);
					}
				}

			});
			on(widget.zipCode, 'change', function (value) {
				//var zip = widget.zipCode.get("value");
				if (value != undefined) {
					var servAdd = widget.srvAddress.get("value");
					var upServAdd = "";
					if (widget.addressLine1.value != undefined && widget.addressLine1.value != "") {
						upServAdd = upServAdd + widget.addressLine1.value + ",";
					}
					if (widget.addressLine2.value != undefined && widget.addressLine2.value != "") {
						upServAdd = upServAdd + widget.addressLine2.value + ",";
					}
					if (widget.city.value != undefined && widget.city.value != "") {
						upServAdd = upServAdd + widget.city.value + ",";
					}

					if (widget.state.value != undefined && widget.state.value != "") {
						upServAdd = upServAdd + widget.state.value + ",";
					}

					if (value != "") {
						upServAdd = upServAdd + value;
					}

					upServAdd = widget.trimCommas(upServAdd);
					if (upServAdd !== undefined && upServAdd !=
						"")
						widget.srvAddress.set("value", upServAdd);
					else {
						widget.srvAddress.set("value", servAdd);
					}
				}


			});

			if (widget.caseName == "Inquiry") {
				domStyle.set(widget.caseDispatchDiv.domNode, "display", "none");

				subTypeCB.set("required", false);
				subTypeCB.set("disabled", true);
				widget.locContactName.set("required", false);
				widget.locContactNum.set("required", false);
				widget.locHr.set("required", false);
				widget.locHr.set("regExp", new RegExp("(.|[\r\n])*"));

			} else if (widget.caseName == "Incident") {
				domStyle.set(widget.caseDispatchDiv.domNode, "display", "block");
				widget.locHr.set("required", true);
				widget.locHr.set("regExp", new RegExp("(.|[\r\n])+"));
			} else if (widget.caseName == "Equipment") {
				domStyle.set(widget.caseEquipmentDiv.domNode, "display", "block");
				domStyle.set(widget.caseDispatchDiv.domNode, "display", "none");
				domStyle.set(widget.caseLocDiv.domNode, "display", "none");
				domStyle.set(widget.caseContactDiv.domNode, "display", "none");
			}

			on(widget.caseContactDiv.domNode, "click", function () {
				widget.openTitlePane(widget.caseContactDiv);
			});

			on(widget.caseMgmtDiv.domNode, "click", function () {
				widget.openTitlePane(widget.caseMgmtDiv);
				if (widget.caseName == "Incident") {
					widget.srvNumber.set("required", true);
				} else {
					widget.srvNumber.set("required", false);
				}
			});

			on(widget.caseLocDiv.domNode, "click", function () {
				widget.openTitlePane(widget.caseLocDiv);
				if (widget.caseName == "Incident") {
					widget.locHr.set("required", true);
					widget.addressLine1.set("required", true);
					widget.city.set("required", true);
					widget.state.set("required", true);
					widget.zipCode.set("required", true);
				} else {
					widget.locHr.set("required", false);
					widget.addressLine1.set("required", false);
					widget.city.set("required", false);
					widget.state.set("required", false);
					widget.zipCode.set("required", false);
				}

			});

			on(widget.caseDispatchDiv.domNode, "click", function () {
				widget.openTitlePane(widget.caseDispatchDiv);
				if (widget.caseName == "Incident") {
					if (widget.dispatchPolicy.checked) {
						widget.dispatchAuthBy.set("required", true);
					} else {
						widget.dispatchAuthBy.set("required", false);
					}
				}

			});

			on(widget.caseEquipmentDiv.domNode, "click", function () {
				widget.openTitlePane(widget.caseEquipmentDiv);
			});

			on(widget.closeBtn, 'click', function () {
				widget.createCaseDialog.destroyRecursive();
				widget.destroy;
			});
			on(widget.submitBtn, 'click', function () {

				if (!widget.validate()) {
					return;
				} else {
					caseInfo = widget.getInfo();
					var callback = function (obj) {
						if (obj.response.code == "200") {
							widget.createCaseDialog.destroyRecursive();
							widget.destroy;
						}
					};
					widget.ctrl.createCase(caseInfo, callback);
				}
			});

		},
		validate: function () {
			var widget = this;
			if (widget.caseName != "Equipment") {
				if (!widget.form1.isValid()) {
					this.openTitlePane(widget.caseMgmtDiv);
					widget.form1.validate();
					return false;
				}

				if (!widget.form2.isValid()) {
					this.openTitlePane(widget.caseContactDiv);
					widget.form2.validate();
					return false;
				}

				if (!widget.form3.isValid()) {
					this.openTitlePane(widget.caseLocDiv);
					widget.form3.validate();
					return false;
				}

				if (!widget.form4.isValid()) {
					this.openTitlePane(widget.caseDispatchDiv);
					widget.form4.validate();
					return false;
				}
			} else { //need to validate vasic_info and equipment_info panes for Equipment
				if (!widget.form1.isValid()) {
					this.openTitlePane(widget.caseMgmtDiv);
					widget.form1.validate();
					return false;
				}
				if (!widget.form5.isValid()) {
					this.openTitlePane(widget.caseEquipmentDiv);
					widget.form5.validate();
					return false;
				}
			}

			return true;

		},
		setStCon: function (country, state) {
			var widget = this;
			if (country != undefined && country != "") {
				if (state != undefined && state != "") {
					var con = widget.statesModel.checkValidState(state);
					if (con != country) {
						widget.country.set("value", con);
						widget.state.set("value", state);
					} else {
						widget.country.set("value", country);
						widget.state.set("value", state);
					}
				} else {
					widget.state.set("value", "");
				}
			}
			else {
				if (state != undefined && state != "") {
					var con = widget.statesModel.checkValidState(state);
					if (con == null) {
						widget.state.set("value", "");
					} else {
						widget.country.set("value", con);
						widget.state.set("value", state);
					}

				} else {
					widget.country.set("value", "US");
					widget.state.set("value", "");
				}

			}

		},

		trimCommas: function (input) {
			// Regular expression to match commas between empty words or between an empty word and a non-empty word
			input = input.replace(/^,+|,+$/g, '');
			input = input.replace(/\s*,\s*/g, ',');
			return input;
		},

		openTitlePane: function (pane) {
			var widget = this;
			widget.caseMgmtDiv.set('open', false);
			widget.caseLocDiv.set('open', false);
			widget.caseDispatchDiv.set('open', false);
			widget.caseContactDiv.set('open', false);
			widget.caseEquipmentDiv.set('open', false);
			pane.set('open', true);
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
