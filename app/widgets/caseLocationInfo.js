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
    "app/model/miniStores",
    "dojo/text!app/widgets/templates/case_location_info.html",
    "app/model/States",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, Memory, lang, domStyle, on, Form, TableContainer, TextBox, Textarea, Select, MiniStores, template, States) { // jshint ignore:line

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
            widget.miniStores = new MiniStores();
            widget.statesModel = new States();
            this.reqLabel = "<req>";
            if (widget.data.groupName == "Inquiry") {
                this.reqLabel = "";
            }
        },
        buildRendering: function () {
            this.inherited(arguments);
        },
        resize: function () {
            this.inherited(arguments);
        },
        init: function () {

        },
        getInfo: function (info) {
            var widget = this;
            widget.getWidgetvalues(info, widget.caseLocationTable.domNode);
            if (info.serviceNumber == undefined) {
                info.serviceAddress = "";
                info.addressLine1 = "";
                info.addressLine2 = "";
                info.city = "";
                info.country = "";
                info.state = "";
                info.zipCode = "";
            } else {
                info.addressLine1 = widget.addressLine1.value;
                info.addressLine2 = widget.addressLine2.value;
            }
            if (widget.wkndAccess.checked == false)
                info.wkndAccess = 0;
            else
                info.wkndAccess = 1;
            if (widget.dispatchPolicy.checked == false)
                info.dispatchPolicy = 0;
            else
                info.dispatchPolicy = 1;
        },
        populateData: function (data) {
            var widget = this;
            widget.data = data;
            this.setWidgetValues(data, widget.caseLocationTable.domNode);
            widget.addressLine1.set("value", widget.data.addressLine1);
            widget.addressLine2.set("value", widget.data.addressLine2);
            if (widget.data.country != undefined && widget.data.country != "") {
                if (widget.data.state != undefined && widget.data.state != "") {
                    var con = widget.statesModel.checkValidState(widget.data.state);
                    if (con != widget.data.country) {
                        widget.country.set("value", con);
                        widget.state.set("value", widget.data.state);
                        widget.data.country = con;
                    } else {
                        widget.country.set("value", widget.data.country);
                        widget.state.set("value", widget.data.state);
                    }
                } else {
                    widget.country.set("value", widget.data.country);
                    widget.state.set("value", "");
                    widget.data.state = "";
                }
            }
            else {
                if (widget.data.state != undefined && widget.data.state != "") {
                    var con = widget.statesModel.checkValidState(widget.data.state);
                    if (con == null) {
                        widget.state.set("value", "");
                        widget.data.state = "";
                    } else {
                        widget.country.set("value", con);
                        widget.state.set("value", widget.data.state);
                        widget.data.country = con;
                    }

                }
                else {
                    widget.country.set("value", "US");
                    widget.state.set("value", "");
                }
            }
            if (data.wkndAccess == 0)
                widget.wkndAccess.checked = false;
            else
                widget.wkndAccess.checked = true;
            if (data.dispatchPolicy == 0)
                widget.dispatchPolicy.checked = false;
            else
                widget.dispatchPolicy.checked = true;

        },
        postCreate: function () {
            var widget = this;
            this.disableWidgets(widget.caseLocationTable.domNode);
            widget.timeZone.set('store', widget.miniStores.getTimeZoneStore());
            widget.state.set("store", widget.statesModel.getStates());
            if (widget.data)
                widget.populateData(widget.data);
            widget.addressLine1.value = widget.addressLine1.get("value");
            widget.addressLine2.value = widget.addressLine2.get("value");
            widget.city.value = widget.city.get("value");
            widget.state.value = widget.state.get("value");
            widget.country.value = widget.country.get("value");
            widget.zipCode.value = widget.zipCode.get("value");
            var st = widget.state.value;
            on(widget.country, "change", function (val) {
                widget.state.reset();
                if (widget.data.state && widget.country.disabled == true) {
                    widget.state.set("value", widget.data.state);
                }
                if (val == "US") {
                    widget.state.set("store", widget.statesModel.getStates());
                } else if (val == "CA") {
                    widget.state.set("store", widget.statesModel.getProvince());

                } else {
                    widget.state.set("store", widget.statesModel.getDataStore());
                }

                widget.state.set("value", widget.data.state);

            });
            if (widget.data.groupName == 'Incident') {
                if (widget.addressLine1.value != undefined) {
                    on(widget.addressLine1, 'change', function (value) {
                        //var addressLine1 = widget.addressLine1.get("value");
                        //widget.serviceAddress.get("value");
                        if (value != undefined) {
                            var servAdd = widget.serviceAddress.get("value");
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
                                widget.serviceAddress.set("value", upServAdd);
                            else {
                                widget.serviceAddress.set("value", servAdd);
                            }
                        }


                    });
                }

                if (widget.addressLine2.value != undefined) {
                    on(widget.addressLine2, 'change', function (value) {
                        //var addressLine1 = widget.addressLine1.get("value");
                        if (value != undefined) {
                            var servAdd = widget.serviceAddress.get("value");
                            var upServAdd = "";
                            if (widget.addressLine1.value != undefined && widget.addressLine1.value != "") {
                                upServAdd = upServAdd + widget.addressLine1.value + ",";
                            }

                            if (value != "") {
                                upServAdd = upServAdd + widget.addressLine2.value + ",";
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
                                widget.serviceAddress.set("value", upServAdd);
                            else {
                                widget.serviceAddress.set("value", servAdd);
                            }
                        }
                    });
                }
                if (widget.city.value != undefined) {
                    on(widget.city, 'change', function (value) {
                        //var city = widget.city.get("value");
                        if (value != undefined) {
                            var servAdd = widget.serviceAddress.get("value");
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
                                widget.serviceAddress.set("value", upServAdd);
                            else {
                                widget.serviceAddress.set("value", servAdd);
                            }
                        }
                    });
                }
                if (widget.state.value != undefined) {
                    on(widget.state, 'change', function (value) {
                        //var state = widget.stateProvince.get("value");
                        if (value != undefined) {
                            var servAdd = widget.serviceAddress.get("value");
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
                                widget.serviceAddress.set("value", upServAdd);
                            else {
                                widget.serviceAddress.set("value", servAdd);
                            }
                        }

                    });
                }
                if (widget.zipCode.value != undefined) {
                    on(widget.zipCode, 'change', function (value) {
                        //var zip = widget.zipCode.get("value");
                        if (value != undefined) {
                            var servAdd = widget.serviceAddress.get("value");
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
                                widget.serviceAddress.set("value", upServAdd);
                            else {
                                widget.serviceAddress.set("value", servAdd);
                            }

                        }

                    });
                }
            }
        },
        setAccessHrs: function (event) {
            var widget = this;
            var locAccHrs = widget.accessHrs.get("value");
            if (widget.data.groupName == "Incident") {
                widget.accessHrs.set("required", true);
            } else {
                widget.accessHrs.set("required", false);
            }
        },
        setServAdd: function (event) {
            var widget = this;
            if (widget.data.groupName == "Incident") {
                widget.serviceAddress.set("required", true);

            } else {
                widget.serviceAddress.set("required", false);
            }
        },
        disableFields: function (event) {
            var widget = this;
            widget.serviceAddress.set("disabled", true);
            widget.accountName.set("disabled", true);
            if (widget.data.groupName == "Incident") {
                widget.addressLine1.set("disabled", false);
                widget.addressLine2.set("disabled", false);
                widget.city.set("disabled", false);
                widget.state.set("disabled", false);
                widget.country.set("disabled", false);
                widget.zipCode.set("disabled", false);
            }
            else {

                widget.addressLine1.set("disabled", true);
                widget.addressLine2.set("disabled", true);
                widget.city.set("disabled", true);
                widget.state.set("disabled", true);
                widget.country.set("disabled", true);
                widget.zipCode.set("disabled", true);
            }
        },
        activateFields: function () {
            var widget = this;
            if (widget.data.groupName == "Incident") {
                widget.addressLine1.set("required", true);
                widget.city.set("required", true);
                widget.state.set("required", true);
                widget.zipCode.set("required", true);

            } else {
                widget.addressLine1.set("required", false);
                widget.city.set("required", false);
                widget.state.set("required", false);
                widget.zipCode.set("required", false);
            }
        },
        disableAllFields: function (event) {
            var widget = this;
            widget.addressLine1.set("disabled", true);
            widget.addressLine2.set("disabled", true);
        },
        setDispatchAuthBy: function (event) {
            var widget = this;
            if (widget.data.groupName == "Incident") {
                if (widget.dispatchPolicy.checked) {
                    widget.dispatchAuthBy.set("required", true);
                } else {
                    widget.dispatchAuthBy.set("required", false);
                }
            }
        },
        trimCommas: function (input) {
            // Regular expression to match commas between empty words or between an empty word and a non-empty word
            input = input.replace(/^,+|,+$/g, '');
            input = input.replace(/\s*,\s*/g, ',');
            return input;
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});