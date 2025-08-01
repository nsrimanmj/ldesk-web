define([
    "dojo/_base/declare",
    "dojo/parser",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/registry",
    "dstore/Memory",
    "dojo/_base/lang",
    "dojo/dom-style",
    "dojo/on",
    "dijit/form/Form",
    "dojox/layout/TableContainer",
    "dijit/form/TextBox",
    "dijit/form/Textarea",
    "dijit/form/Select",
    "dojo/data/ObjectStore",
    "dstore/legacy/DstoreAdapter",
    "dojo/topic",
    "app/model/postMortem",
    "app/model/miniStores",
    "dojo/text!app/widgets/templates/close_case.html",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, Memory, lang, domStyle, on, Form, TableContainer, TextBox, Textarea, Select, ObjectStore, DstoreAdapter, topic, PostMortemStore, MiniStores, template) { // jshint ignore:line

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
            widget.groupName = widget.data.groupName;
            widget.postMortemStore = new PostMortemStore();
            widget.miniStores = new MiniStores();
            widget.onChange = false;
        },
        buildRendering: function () {
            this.inherited(arguments);
        },
        resize: function () {
            this.inherited(arguments);
        },
        init: function () {

        },
        selectCloseAction: function (evt) {
            var widget = this;
            widget.actionName = "Manual";
            var boxType = evt.target.value;
            if (boxType == "Manual") {
                widget.manualCloseCB.checked == true ? widget.autoCloseCB.set("checked", false) : widget.autoCloseCB.set("checked", true);
                widget.actionName = "Manual";
            }
            if (boxType == "Auto") {
                widget.autoCloseCB.checked == true ? widget.manualCloseCB.set("checked", false) : widget.manualCloseCB.set("checked", true);
                widget.actionName = "Auto";
            }
        },
        submit: function (data) {
            var widget = this;
            var callback = function (obj) {
                if (obj.response.code == 200) {
                    widget.closeCaseDialog.destroyRecursive();
                    var sucMsg = "Case Closed Successfully";
                    if (widget.actionName == "Auto")
                        sucMsg = "Case is set to close automatically after 24 Hours";

                    new messageWindow({
                        message: sucMsg,
                        title: "Success"
                    });
                } else {
                    new messageWindow({
                        message: obj.response.message,
                        title: "Error"
                    });
                }
                //widget.setCaseDetails();
            };

            widget.ctrl.updateCase(data, lang.hitch(this, callback));
        },

        setCaseDetails: function () {

            var widget = this;
            var callback = function (obj) {
                widget.closeCaseDialog.hide();
                widget.setWidgetValues(obj.data, widget.caseClosureWidget.domNode);
                widget.setWidgetValues(obj.data, widget.caseManagementWidget.domNode);
                widget.setWidgetValues(obj.data, widget.caseEventWidget.domNode);

            }

            widget.ctrl.getCaseDetails(widget.data.caseId, callback);
        },

        postCreate: function () {
            var widget = this;
            this.inherited(arguments);
            if (widget.groupName == "Inquiry" || widget.groupName == "Equipment") {
                domStyle.set(widget.incidentTable.domNode, "display", "none");
                widget.formInq.reset();

            }
            else if (widget.groupName == "Incident" || widget.groupName == "Network") {

                domStyle.set(widget.inquiryTable.domNode, "display", "none");
                widget.formInc.reset();
            }
            if (widget.groupName == 'Network' || widget.groupName == 'Equipment') {
                domStyle.set(widget.optionTable.domNode, "display", "none");
            }

            widget.post_Mortem.set("store", this.postMortemStore.getPostMortemStore());
            widget.resCode.set('store', widget.miniStores.getResolutionCodeStore(widget.groupName));
            widget.resolutionStore1 = widget.ctrl.getResolutionTier1Store();
            widget.resolution_T1.set('store', widget.resolutionStore1);
            if (widget.data.groupName == 'Incident' || widget.data.groupName == 'Network') {
                if (widget.data.resolutionT1 != '') {
                    widget.resolution_T1.set("value", widget.data.resolutionT1);
                }
                if (widget.data.postMortem != '') {
                    widget.post_Mortem.set("value", widget.data.postMortem);
                }
                if (widget.data.resolutionDescription != '') {
                    widget.resDescriptionIncident.set("value", widget.data.resolutionDescription);
                }
                if (widget.data.fcr == 1) {
                    widget.firstcallresolution.set("checked", true);
                } else {
                    widget.firstcallresolution.set("checked", false);
                }
            }
            if (widget.data.groupName == 'Inquiry' || widget.data.groupName == 'Equipment') {
                widget.shipTrackNum.set("disabled", true);
                widget.shipTrackNum.set("required", false);
                widget.resDescriptionInquiry.set("value", widget.data.resolutionDescription);
                widget.resCode.set("value", widget.data.resolutionCode);
                if (widget.data.shippingTrackNum != '') {
                    widget.shipTrackNum.set("value", widget.data.shippingTrackNum);
                }
                if (widget.data.fcr == 1) {
                    widget.firstcallresolutionInq.set("checked", true);
                } else {
                    widget.firstcallresolutionInq.set("checked", false);
                }
            }

            widget.resCode.on('change', function (value) {
                if (widget.onChange == false) {
                    if (widget.data.resolutionCode == 'Shipping Label Request Completed') {
                        widget.shipTrackNum.set("disabled", false);
                        widget.shipTrackNum.set("required", true);
                    }
                    widget.onChange = true;
                    return;
                }
                widget.shipTrackNum.reset();


                if (value == "Shipping Label Request Completed") {
                    widget.shipTrackNum.set("disabled", false);
                    widget.shipTrackNum.set("required", true);
                } else {
                    widget.shipTrackNum.set("disabled", true);
                    widget.shipTrackNum.set("required", false);
                }
            });
            widget.resolution_T1.on('change', function (value) {
                widget.resolution_T2.reset();
                widget.resolution_T2.set("placeHolder", "Select a ResolutionTier2");
                widget.resolution_T2.set("store", widget.ctrl.getResolutionTier2Store(value));
                widget.resolution_T2.set("value", widget.data.resolutionT2);
            });

            widget.resolution_T2.on('change', function (value) {
                widget.resolution_T3.reset();
                widget.resolution_T3.set("placeHolder", "Select a ResolutionTier3");
                widget.resolution_T3.set("store", widget.ctrl.getResolutionTier3Store(widget.resolution_T1.get("value"), value));
                widget.resolution_T3.set("value", widget.data.resolutionT3);
            });

            widget.submitBtn.on("click", lang.hitch(this, function () {
                //validate the form and submit the data
                if (!widget.validate(widget.groupName)) {
                    new messageWindow({
                        message: "Please enter required(*) values!!",
                        title: "NOTE"
                    });
                    return;
                } else {
                    var info = dojo.clone(widget.data);
                    if (widget.groupName == "Incident" || widget.groupName == "Network") {
                        info.postMortem = widget.post_Mortem.get("value");
                        info.resolutionT1 = widget.resolution_T1.get("value");
                        info.resolutionT2 = widget.resolution_T2.get("value");
                        info.resolutionT3 = widget.resolution_T3.get("value");
                        info.resolutionDescription = widget.resDescriptionIncident.get("value");
                        info.fcr = widget.firstcallresolution.checked == true ? 1 : 0;

                    } else if (widget.groupName == "Inquiry" || widget.groupName == "Equipment") {
                        info.resolutionDescription = widget.resDescriptionInquiry.get("value");
                        info.resolutionCode = widget.resCode.get("value");
                        info.fcr = widget.firstcallresolutionInq.checked == true ? 1 : 0;
                        if (widget.groupName == "Equipment")
                            info.shippingTrackNum = widget.shipTrackNum.get("value");
                    }

                    if (widget.actionName == "Auto") {
                        info.status = "On Hold";
                        info.subStatus = "24 Hour Auto Close";
                        info.statusId = 0;
                        info.subStatusId = 0;
                    } else {
                        info.status = "Closed";
                        info.statusId = 4;
                    }
                    widget.submit(info);
                }
            }));


            on(widget.closeBtn, "click", function () {
                widget.closeCaseDialog.hide();
            });

            widget.closeCaseDialog.show();

        },
        validate: function (groupName) {
            var widget = this;
            if ((groupName == "Incident") && !widget.formInc.isValid()) {
                widget.formInc.validate();
                return false;
            }
            if ((groupName == "Inquiry" || groupName == "Equipment") && !widget.formInq.isValid()) {
                widget.formInq.validate();
                return false;
            }
            if ((groupName == "Network") && !widget.formInc.isValid()) {
                widget.formInc.validate();
                return false;
            }


            return true;

        },


        destroy: function () {
            this.inherited(arguments);
        }
    });

});
