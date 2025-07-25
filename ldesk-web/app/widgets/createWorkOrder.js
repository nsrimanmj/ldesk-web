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
    "dojo/dom",
    "dojo/dom-style",
    "dojo/on",
    "dijit/registry",
    "app/view/messageWindow",
    "app/model/miniStores",
    "dojo/text!app/widgets/templates/create_work_order.html",
    "app/view/ValidationTextarea",
    "dijit/form/TimeTextBox",
    "dojox/form/Uploader",
    "app/model/States",
    "dojo/domReady!"
], function (declare, _parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, DstoreAdapter, lang, arrayUtil, dom, domStyle, on, registry, messageWindow, MiniStores, template, _ValidationTextarea, TimeTextBox, Uploader, States) { // jshint ignore:line

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
        templateString: template,
        widgetsInTemplate: true,
        info: null,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;
            widget.data = widget.info;
            widget.caseNumber = widget.data.caseNumber;
            widget.accountId = widget.data.accountId;
            widget.ctrl = this.lingoController;

            widget.setFNContactInfo(widget.data);

            widget.miniStores = new MiniStores();
            widget.statesModel = new States();
            //var statesStore = statesModel.getStates();
        },
        buildRendering: function () {
            this.inherited(arguments);
        },
        resize: function () {
            this.inherited(arguments);
        },
        init: function () {

        },
        setFNContactInfo: function (data) {
            var widget = this;
            widget.dispatchContactName = "";
            widget.dispatchContactph = "";
            widget.dispatchContactEmail = "";
            if (data.localContactName) {
                widget.dispatchContactName = data.localContactName;
            }
            if (data.localContactNum) {
                widget.dispatchContactph = data.localContactNum;
            }
            if (data.contactEmail) {
                widget.dispatchContactEmail = data.contactEmail;
            }
        },
        selectType: function (evt) {
            var widget = this;
            widget.workOrderType = evt.target.value;
            widget.nextBtn.set("disabled", false);
            widget.dispatchTypeStore = widget.ctrl.getDispatchTypeStore(widget.workOrderType);
        },
        scheduleTypeSelection: function (evt) {
            var widget = this;
            var type = evt.target.value;
            widget.scheduleType = type;
            if (widget.validationErrMsg2.innerHTML != "")
                widget.validationErrMsg2.innerHTML = "";
            domStyle.set(dom.byId(widget.dispatchStartDiv), "display", "block");
            if (type == "exact") {
                domStyle.set(dom.byId(widget.dispatchEndDiv), "display", "none");
                widget.dispatchEndDate.set("required", false);
                widget.dispatchEndTime.set("required", false);
            } else if (type == "hours") {
                domStyle.set(dom.byId(widget.dispatchEndDiv), "display", "block");
                widget.dispatchEndDate.set("required", true);
                widget.dispatchEndTime.set("required", true);
            }
        },
        COISelection: function (evt) {
            var widget = this;
            widget.coiType = evt.target.value;
            if (widget.validationErrMsg.innerHTML != "")
                widget.validationErrMsg.innerHTML = "";
            if (widget.coiType == "Custom") {
                widget.coiCustom.set("disabled", false);
                widget.coiCustom.set("required", true);
                widget.coiCustom.focus();
            } else {
                widget.coiCustom.set("disabled", true);
            }
        },
        displaySpecifiedForms: function (type) {
            var widget = this;
            domStyle.set(dom.byId(widget.typeSelectDiv), "display", "none");
            domStyle.set(dom.byId(widget.dialogActionbar), "display", "block");
            widget.submitBtn.set("disabled", false);
            widget.createWorkOrderDialog.set("title", "Work Order - " + widget.workOrderType);
            if (type == "Repair CCS Dispatch") {
                domStyle.set(dom.byId(widget.ccsDispatchDiv), "display", "block");
                widget.dispatchType.set("store", widget.dispatchTypeStore);
            } else if (type == "Repair Field Nation Dispatch") {
                domStyle.set(dom.byId(widget.fnDispatchDiv), "display", "block");
                widget.dispatchType2.set("store", widget.dispatchTypeStore);
                widget.timeZone.set('value', widget.data.timeZone);
                widget.stateProvince.set("store", widget.statesModel.getStates());
                // auto populate the address information from case data
                if (!widget.data.serviceNumber) {
                    widget.createWorkOrderDialog.destroyRecursive();
                    new messageWindow({
                        title: "NOTE",
                        message: "Please set service number for a case#" + widget.data.caseNumber + " and try again!!"
                    });
                }
                if (widget.addressLine1.value != undefined) {
                    on(widget.addressLine1, 'change', function (value) {
                        //var addressLine1 = widget.addressLine1.get("value");
                        //widget.serviceAddress.get("value");
                        if (value != undefined) {
                            var servAdd = widget.srvAddress.get("value");
                            widget.upServAdd = value + " " + (widget.addressLine2.value == undefined ? "" : widget.addressLine2.value) + " " + (widget.city.value == undefined ? "" : widget.city.value) + " " +
                                (widget.stateProvince.value == undefined ? "" : widget.stateProvince.value) + " " + (widget.zipCode.value == undefined ? "" : widget.zipCode.value);
                            widget.addressLine1.value = value;
                            //widget.addressLine1.set("value", value);
                        }


                    });
                }
                if (widget.addressLine2.value != undefined) {
                    on(widget.addressLine2, 'change', function (value) {
                        //var addressLine1 = widget.addressLine1.get("value");
                        if (value != undefined) {
                            var compAddress = (widget.addressLine1.value == undefined ? "" : widget.addressLine1.value) + " " + value;
                            widget.servAdd = widget.srvAddress.get("value");
                            widget.upServAdd = compAddress + " " + (widget.city.value == undefined ? "" : widget.city.value) + " " +
                                (widget.stateProvince.value == undefined ? "" : widget.stateProvince.value) + " " + (widget.zipCode.value == undefined ? "" : widget.zipCode.value);
                            widget.addressLine2.value = value;
                        }
                    });

                }
                if (widget.city.value != undefined) {
                    on(widget.city, 'change', function (value) {
                        //var city = widget.city.get("value");
                        if (value != undefined) {
                            var servAdd = widget.srvAddress.get("value");
                            widget.upServAdd = (widget.addressLine1.value == undefined ? "" : widget.addressLine1.value) + " " +
                                (widget.addressLine2.value == undefined ? "" : widget.addressLine2.value) + " " + value + " " +
                                (widget.stateProvince.value == undefined ? "" : widget.stateProvince.value) + " " + (widget.zipCode.value == undefined ? "" : widget.zipCode.value);
                            //widget.city.set("value", value);
                            widget.city.value = value;
                        }
                    });
                }
                if (widget.stateProvince.value != undefined) {
                    on(widget.stateProvince, 'change', function (value) {
                        //var state = widget.stateProvince.get("value");
                        if (value != undefined) {
                            var servAdd = widget.srvAddress.get("value");
                            widget.upServAdd = (widget.addressLine1.value == undefined ? "" : widget.addressLine1.value) + " " +
                                (widget.addressLine2.value == undefined ? "" : widget.addressLine2.value) + " " + (widget.city.value == undefined ? "" : widget.city.value) + " " + value + " " + (widget.zipCode.value == undefined ? "" : widget.zipCode.value);
                            //widget.stateProvince.set("value", value);
                            widget.stateProvince.value = value;
                        }

                    });
                }
                if (widget.zipCode.value != undefined) {
                    on(widget.zipCode, 'change', function (value) {
                        //var zip = widget.zipCode.get("value");
                        if (value != undefined) {
                            var servAdd = widget.srvAddress.get("value");
                            widget.upServAdd = (widget.addressLine1.value == undefined ? "" : widget.addressLine1.value) + " " +
                                (widget.addressLine2.value == undefined ? "" : widget.addressLine2.value) + " " + (widget.city.value == undefined ? "" : widget.city.value) + " " + (widget.stateProvince.value == undefined ? "" : widget.stateProvince.value) + " " + value;
                        }

                    });
                }
                widget.addressLine1.set("value", widget.data.addressLine1);
                widget.addressLine2.set("value", widget.data.addressLine2);
                widget.city.set("value", widget.data.city);
                widget.stateProvince.set("value", widget.data.state);
                widget.country.set("value", widget.data.country);
                widget.zipCode.set("value", widget.data.zipCode);
                widget.srvAddress.set("value", widget.data.serviceAddress);
                widget.locationAccessHrs.set("value", widget.data.accessHrs);
                //set appId and accountName
                widget.locationAppId.set("value", widget.data.accountId);
                widget.accountName.set("value", widget.data.accountName);

            } else if (type == "Carrier Dispatch") {
                domStyle.set(dom.byId(widget.carrierDispatchDiv), "display", "block");
                widget.dispatchType3.set("store", widget.dispatchTypeStore);
                //widget.escalationLevel.set("store", widget.miniStores.getEscalationLevelStore());
            }
        },
        postCreate: function () {
            var widget = this;
            widget.createWorkOrderDialog.show();

            if (widget.woData) {
                widget.populateData(widget.woData);
            }

            on(widget.nextBtn, "click", function () {
                widget.displaySpecifiedForms(widget.workOrderType);
            });

            on(widget.country, "change", function (val) {
                widget.stateProvince.reset();
                if (val == "US") {
                    widget.stateProvince.set("store", widget.statesModel.getStates());
                } else if (val == "CA") {
                    widget.stateProvince.set("store", widget.statesModel.getProvince());
                }
            });

            on(widget.basicInfoDiv.domNode, "click", function () {
                widget.openTitlePane(widget.basicInfoDiv);
            });
            on(widget.scheduleInfoDiv.domNode, "click", function () {
                widget.openTitlePane(widget.scheduleInfoDiv);
            });
            on(widget.addressInfoDiv.domNode, "click", function () {
                widget.openTitlePane(widget.addressInfoDiv);
            });
            on(widget.contactInfoDiv.domNode, "click", function () {
                widget.openTitlePane(widget.contactInfoDiv);
            });

            on(widget.closeBtn, "click", function () {
                widget.createWorkOrderDialog.destroyRecursive();
            });

            on(widget.closeBtn1, "click", function () {
                widget.createWorkOrderDialog.destroyRecursive();
            });

            on(widget.submitBtn, "click", function () {
                if (!widget.validateInputs()) {
                    return;
                }
                if (!widget.coiType && widget.workOrderType == "Repair Field Nation Dispatch") {
                    widget.validationErrMsg.innerHTML = "COI must be selected";
                    widget.openTitlePane(widget.addressInfoDiv);
                    return;
                }
                var info = widget.getInfoToCreate();
                // console.log(info);

                var callback = function (obj) {
                    if (obj.response.code == 200) {
                        widget.createWorkOrderDialog.destroyRecursive();
                    }
                };
                if (widget.woData)
                    widget.ctrl.updateWorkOrder(info, callback);
                else
                    widget.ctrl.createWorkOrder(info, callback);
            });

            //dispatch start and end date changes
            on(widget.dispatchStartDate, "change", function (value) {
                var now = new Date();
                if (value.toDateString() == now.toDateString()) {
                    widget.dispatchStartTime.constraints.min = now;
                } else {
                    widget.dispatchStartTime.constraints.min = null;
                }
                widget.dispatchStartTime.validate();
            });
            on(widget.dispatchEndDate, "change", function (value) {
                var now = new Date();
                if (value.toDateString() == now.toDateString()) {
                    widget.dispatchEndTime.constraints.min = now;
                } else {
                    widget.dispatchEndTime.constraints.min = null;
                }
                widget.dispatchEndTime.validate();
            });

        },
        getInfoToCreate: function () {
            var widget = this;
            var info = {};
            if (widget.woData) {
                info = dojo.clone(widget.woData);
            }
            info.caseId = widget.data.caseId;
            info.workOrderType = widget.workOrderType;
            info.account = widget.data.accountName;
            info.appId = widget.data.accountId;
            if (widget.upServAdd != "") {
                info.serviceAddress = widget.upServAdd;
            }
            else {

                info.serviceAddress = widget.srvAddress.get("value");
            }
            info.retryCount = 0;
            if (widget.workOrderType == "Repair CCS Dispatch") {
                if (widget.dispatchType.get("value")) {
                    info.dispatchTypeId = widget.dispatchType.item.id;
                }
                info.externalTktNum = widget.ccsWONumber.get("value");
                info.scopeOfWork = widget.scopeOfWork.get("value");
                info.waiveDispatchFee = widget.dispatchFeeCheck.checked ? 1 : 0;
                info.dispatchDate = widget.getFormattedDate(widget.dispatchDate.get("displayedValue"), widget.dispatchTime.get("displayedValue"));
                //woTypeId, statusId are fixed while creating
                info.workOrderTypeId = 3;
                info.statusId = 11;
                //passing queue and owner similar to case
                info.queueName = widget.data.queueName;
                info.ownerId = widget.data.ownerId;

            } else if (widget.workOrderType == "Repair Field Nation Dispatch") {
                if (widget.dispatchType2.get("value")) {
                    info.dispatchTypeId = widget.dispatchType2.item.id;
                }
                info.scopeOfWork = widget.scopeOfWork2.get("value");
                info.confidentialInfo = widget.confInfo.get("value");
                info.waiveDispatchFee = widget.dispatchFeeCheck2.checked ? 1 : 0;
                info.isEscalation = widget.isEscalation.checked ? 1 : 0;
                info.scheduleType = widget.scheduleType;
                info.dispatchStart = widget.getFormattedDate(widget.dispatchStartDate.get("displayedValue"), widget.dispatchStartTime.get("displayedValue"));
                info.dispatchEnd = widget.getFormattedDate(widget.dispatchEndDate.get("displayedValue"), widget.dispatchEndTime.get("displayedValue"));
                info.dba = widget.dba.get("value");
                info.locationType = widget.locationType.get("value");
                info.accessHours = widget.locationAccessHrs.get("value");
                info.covid19 = widget.cv19Check.checked ? 1 : 0;
                info.coi = widget.coiType == "Custom" ? widget.coiCustom.get("value") : widget.coiType;
                info.addressLine1 = widget.addressLine1.get("value");
                info.addressLine2 = widget.addressLine2.get("value");
                info.city = widget.city.get("value");
                info.state = widget.stateProvince.get("value");
                info.country = widget.country.get("value");
                info.zipCode = widget.zipCode.get("value");
                info.dispatchConName = widget.contactName.get("value");
                info.dispatchConNo = widget.contactNum.get("value");
                info.dispatchEmail = widget.contactEmail.get("value");
                //woTypeId, statusId are fixed while creating
                info.workOrderTypeId = 4;
                info.statusId = 22;
                //Field Nation Dispatch is assigned to the “Field Ops” queue on create
                info.queueName = "Field Ops";
                //set fnUserId - caseOwner.fnUserId
                var agentStore = widget.ctrl.agentStore.getStore();
                var user = agentStore.get(widget.data.ownerId);
                if (user)
                    info.fnUserId = user.fnUserId;

            } else if (widget.workOrderType == "Carrier Dispatch") {
                if (widget.dispatchType3.get("value")) {
                    info.dispatchTypeId = widget.dispatchType3.item.id;
                }
                info.carrierName = widget.carrierName.get("value");
                info.carrierContactName = widget.carrierContactName.get("value");
                info.externalTktNum = widget.carrierTktNum.get("value");
                //info.escalationLevel = widget.escalationLevel.get("value");
                info.scopeOfWork = widget.scopeOfWork3.get("value");
                info.dispatchDate = widget.getFormattedDate(widget.dispatchDate3.get("displayedValue"), widget.dispatchTime3.get("displayedValue"));
                //woTypeId, statusId are fixed while creating
                info.workOrderTypeId = 1;
                info.statusId = 6;
                //passing queue similar to case
                info.queueName = widget.data.queueName;
                info.ownerId = widget.data.ownerId;
            }
            return info;
        },
        getFormattedDate: function (date, time) {
            if (!date)
                return;
            var date1 = date + " " + time;
            //console.log(date1);

            var dt = new Date(date1);
            return this.getFormattedDateTime(dt);
        },
        openTitlePane: function (pane) {
            var widget = this;
            widget.basicInfoDiv.set('open', false);
            widget.scheduleInfoDiv.set('open', false);
            widget.addressInfoDiv.set('open', false);
            widget.contactInfoDiv.set('open', false);
            pane.set('open', true);
        },
        validateInputs: function () {
            var widget = this;
            if (widget.workOrderType == "Repair CCS Dispatch") {
                if (!widget.ccsForm.isValid()) {
                    widget.ccsForm.validate();
                    return false;
                }

            } else if (widget.workOrderType == "Repair Field Nation Dispatch") {
                if (!widget.fnForm1.isValid()) {
                    this.openTitlePane(widget.basicInfoDiv);
                    widget.fnForm1.validate();
                    return false;
                }
                if (widget.radioA.get("checked") == false && widget.radioB.get("checked") == false) {
                    this.openTitlePane(widget.scheduleInfoDiv);
                    widget.validationErrMsg2.innerHTML = "Please select schedule type!!";
                    return false;
                }
                if (!widget.fnForm2.isValid()) {
                    this.openTitlePane(widget.scheduleInfoDiv);
                    widget.fnForm2.validate();
                    return false;
                }

                if (!widget.fnForm3.isValid()) {
                    this.openTitlePane(widget.addressInfoDiv);
                    widget.fnForm3.validate();
                    return false;
                }

                if (!widget.fnForm4.isValid()) {
                    this.openTitlePane(widget.contactInfoDiv);
                    widget.fnForm4.validate();
                    return false;
                }

            } else if (widget.workOrderType == "Carrier Dispatch") {
                if (!widget.carrierForm.isValid()) {
                    widget.carrierForm.validate();
                    return false;
                }
            }
            return true;

        },
        populateData: function (data) {
            var widget = this;
            if (data.status == "Error") {
                if (data.errorMsg) {
                    widget.fnErrorDiv.innerHTML = data.errorMsg;
                    domStyle.set(widget.fnErrorDiv, "display", "flex");
                }
                widget.workOrderType = data.workOrderType;
                widget.dispatchTypeStore = widget.ctrl.getDispatchTypeStore(widget.workOrderType);
                widget.displaySpecifiedForms(widget.workOrderType);
                //setting the data
                widget.dispatchType2.set("value", data.dispatchType);
                widget.scopeOfWork2.set("value", data.scopeOfWork);
                widget.confInfo.set("value", data.confidentialInfo);
                data.waiveDispatchFee == 0 ? widget.dispatchFeeCheck2.set("checked", false) : widget.dispatchFeeCheck2.set("checked", true);
                data.isEscalation == 0 ? widget.isEscalation.set("checked", false) : widget.isEscalation.set("checked", true);
                widget.scheduleType = data.scheduleType;
                if (data.scheduleType == "exact")
                    widget.radioA.set("checked", true);
                else
                    widget.radioB.set("checked", true);
                if (data.dispatchStart) {
                    domStyle.set(dom.byId(widget.dispatchStartDiv), "display", "block");
                    var date = new Date(data.dispatchStart);
                    widget.dispatchStartDate.set("value", date);
                    var followUpTime = data.dispatchStart.split(' ')[1];
                    var timeParts = followUpTime.split(':');
                    var time = new Date();
                    time.setHours(timeParts[0], timeParts[1], timeParts[2]);
                    widget.dispatchStartTime.set("value", time);
                }
                if (data.dispatchEnd) {
                    domStyle.set(dom.byId(widget.dispatchEndDiv), "display", "block");
                    var date1 = new Date(data.dispatchEnd);
                    widget.dispatchEndDate.set("value", date1);
                    var followUpTime1 = data.dispatchEnd.split(' ')[1];
                    var timeParts1 = followUpTime1.split(':');
                    var time1 = new Date();
                    time1.setHours(timeParts1[0], timeParts1[1], timeParts1[2]);
                    widget.dispatchEndTime.set("value", time1);
                }

                widget.srvAddress.set("value", data.serviceAddress);
                widget.dba.set("value", data.dba);
                widget.locationType.set("value", data.locationType);
                widget.locationAccessHrs.set("value", data.accessHours);
                data.covid19 == 0 ? widget.cv19Check.set("checked", false) : widget.cv19Check.set("checked", true);
                widget.coiType = data.coi;
                if (!data.coi == "None" && !data.coi == "Standard") {
                    widget.coiType = "Custom";
                    widget.coiCustom.set("value", data.coi);
                    widget.customRadio.set("checked", true);
                } else if (data.coi == "Standard") {
                    widget.coiType = "Standard";
                    widget.standardRadio.set("checked", true);
                }
                else {
                    widget.coiType = "None";
                    widget.radioNone.set("checked", true);
                }
                widget.contactName.set("value", data.dispatchConName);
                widget.contactNum.set("value", data.dispatchConNo);
                widget.contactEmail.set("value", data.dispatchEmail);

                widget.openTitlePane(widget.addressInfoDiv);
            }
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});
