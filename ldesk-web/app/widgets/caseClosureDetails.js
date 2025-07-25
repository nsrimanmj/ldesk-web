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
    "app/model/postMortem",
    "app/model/miniStores",
    "dojo/text!app/widgets/templates/case_closure_details.html",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, Memory, lang, domStyle, on, Form, TableContainer, TextBox, Textarea, Select, ObjectStore, DstoreAdapter, PostMortemStore, MiniStores, template) { // jshint ignore:line

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
            if (widget.data) {
                widget.postMortemStore = new PostMortemStore();
                widget.miniStores = new MiniStores();
                widget.resolutionStore1 = widget.ctrl.getResolutionTier1Store();
            }
            widget.agentGroups = JSON.parse(window.localStorage.getItem("groups"));
            widget.foundInc = widget.agentGroups.hasOwnProperty('Incident');
            widget.foundInq = widget.agentGroups.hasOwnProperty('Inquiry');
            widget.onChange = true;
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
            widget.getWidgetvalues(info, widget.caseClosureTable.domNode);
            if (widget.fcr.checked == false)
                info.fcr = 0;
            else
                info.fcr = 1;
        },
        populateData: function (data) {
            var widget = this;
            widget.data = data;
            widget.onChange = false;
            this.setWidgetValues(data, widget.caseClosureTable.domNode);
            if (data.fcr == 0)
                widget.fcr.checked = false;
            else
                widget.fcr.checked = true;
        },
        postCreate: function () {
            var widget = this;
            this.disableWidgets(widget.caseClosureTable.domNode);
            // if (!widget.foundInq) {
            //     widget.caseClosureTable.removeChild(widget.resolutionCode);
            //     widget.caseClosureTable.startup();
            //     widget.caseClosureTable.resize();
            // }

            widget.updateFieldVisibility(widget.data.groupName, widget.caseClosureTable);


            if (widget.data) {
                widget.postMortem.set("store", widget.postMortemStore.getPostMortemStore());
                widget.resolutionT1.set("store", widget.resolutionStore1);
                widget.resolutionCode.set('store', widget.miniStores.getResolutionCodeStore(widget.data.groupName));
                widget.populateData(widget.data);
            }

            widget.resolutionT1.on('change', function (value) {
                widget.resolutionT2.reset();
                widget.resolutionT2.set("store", widget.ctrl.getResolutionTier2Store(value));
                widget.resolutionT2.set("value", widget.data.resolutionT2);
            });

            widget.resolutionT2.on('change', function (value) {
                widget.resolutionT3.reset();
                widget.resolutionT3.set("store", widget.ctrl.getResolutionTier3Store(widget.resolutionT1.get("value"), value));
                widget.resolutionT3.set("value", widget.data.resolutionT3);
            });

            widget.resolutionCode.on("change", function (value) {
                if (widget.onChange == false) {
                    return;
                }
                widget.shippingTrackNum.reset();
                if (value == "Shipping Label Request Completed") {
                    widget.shippingTrackNum.set("disabled", false);
                } else {
                    widget.shippingTrackNum.set("disabled", true);
                }

            });


            this.inherited(arguments);
        },
        disableFields: function () {
            var widget = this;
            widget.shippingTrackNum.set("disabled", true);
            widget.onChange = true;
            if (widget.data.resolutionCode == "Shipping Label Request Completed") {
                widget.shippingTrackNum.set("disabled", false);
            }
            if (widget.data.groupName == 'Inquiry' || widget.data.groupName == 'Equipment') {
                widget.postMortem.set("disabled", true);
                widget.resolutionT1.set("disabled", true);
                widget.resolutionT2.set("disabled", true);
                widget.resolutionT3.set("disabled", true);
                widget.fcr.set("disabled", false);
                widget.resolutionCode.set("disabled", false);
                widget.resolutionDescription.set("disabled", false);
            } else {

                widget.postMortem.set("disabled", false);
                widget.resolutionT1.set("disabled", false);
                widget.resolutionT2.set("disabled", false);
                widget.resolutionT3.set("disabled", false);
                widget.fcr.set("disabled", false);
                widget.resolutionCode.set("disabled", true);
                widget.resolutionDescription.set("disabled", false);

            }

        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});