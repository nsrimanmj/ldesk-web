define([
    "dojo/_base/declare",
    "dojo/parser",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/registry",
    "dstore/Memory",
    "dojo/_base/lang",
    "dojo/_base/array",
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
    "dojo/text!app/widgets/templates/convert_to_incident.html",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, Memory, lang, arrayUtil, domStyle, on, Form, TableContainer, TextBox, Textarea, Select, ObjectStore, DstoreAdapter, topic, PostMortemStore, MiniStores, template) { // jshint ignore:line

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
            //set categories under Incident group
            widget.categoryStore = widget.ctrl.getCategoryStore("Incident")
        },
        buildRendering: function () {
            this.inherited(arguments);
        },
        resize: function () {
            this.inherited(arguments);
        },
        init: function () {

        },
        getServiceInfo: function (accountId) {

            var widget = this;
            var callback = function (obj) {
                if (obj.response.code == "200") {

                    widget.serviceInfo = widget.setServiceStore(obj.data, "Incident");
                    widget.service_number.set("store", widget.serviceInfo);
                    widget.service_number.set("value", widget.data.serviceNumber);
                }

            }

            widget.ctrl.getServiceDetails(widget.data.accountId, callback);

        },

        submit: function (data) {
            var widget = this;
            var callback = function (obj) {
                if (obj.response.code == 200) {
                    widget.convertIncDialog.destroyRecursive();
                    new messageWindow({
                        message: "Converted to Incident Successfully",
                        title: "Success"
                    });
                }
            };

            widget.ctrl.updateCase(data, lang.hitch(this, callback));
        },


        postCreate: function () {
            var widget = this;
            this.inherited(arguments);
            if (widget.data.accountId != "") {

                widget.getServiceInfo(widget.data.accountId);
            }
            widget.categoryStore.remove("DefaultEmail")
            widget.category.set("store", widget.categoryStore);

            on(widget.category, "change", function (value) {
                widget.type.reset();
                widget.type.set("placeHolder", "Select a Type");
                widget.type.set("store", widget.ctrl.getTypeStore(value));

            });
            on(widget.type, "change", function (value) {
                widget.subType.reset();
                widget.subType.set("placeHolder", "Select a subType");
                widget.subType.set("store", widget.ctrl.getSubTypeStore(widget.category.get("value"), value));
            });
            if (widget.service_number !== undefined && widget.service_number !== "") {
                on(widget.service_number, 'change', function (value) {
                    if (value !== undefined && value !== '') {
                        if (value != widget.data.serviceNumber) {
                            var srvInfo = widget.serviceInfo.get(value);
                            widget.data.serviceAddress = srvInfo.srvAddress
                            widget.data.addressLine1 = srvInfo.address;
                            widget.data.addressLine2 = "";
                            widget.data.city = srvInfo.city;
                            widget.data.state = srvInfo.state;
                            widget.data.country = srvInfo.country;
                            widget.data.zipCode = srvInfo.zipCode;
                        }
                    }
                });
            }
            widget.submitBtn.on("click", lang.hitch(this, function () {
                widget.data.categoryName = widget.category.get("value");
                widget.data.type = widget.type.get("value");
                widget.data.subType = widget.subType.get("value");
                widget.data.serviceNumber = widget.service_number.get("value");
                widget.data.groupId = 3;
                widget.data.groupName = "Incident";
                widget.data.categoryId = 0;
                if (!widget.validate()) {
                    new messageWindow({
                        message: "Please enter required(*) values!!",
                        title: "NOTE"
                    });
                    return;
                } else {
                    widget.submit(widget.data);
                }

            }));
            on(widget.closeBtn, "click", function () {
                widget.convertIncDialog.hide();
            });

            widget.convertIncDialog.show();

        },

        validate: function () {
            var widget = this;
            if (!widget.convertformInc.isValid()) {
                widget.convertformInc.validate();
                return false;
            }

            return true;

        },


        destroy: function () {
            this.inherited(arguments);
        }
    });

});
