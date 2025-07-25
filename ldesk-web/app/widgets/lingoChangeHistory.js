    define([
        "dojo/_base/declare",
        "dojo/parser",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "dojo/text!app/widgets/templates/lingo_change_history.html",
        "dojo/dom-style",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/dom",
        "dojo/_base/lang",
        "dojo/topic",
        "dojox/layout/TableContainer",
        "dojo/domReady!"
    ], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, domStyle, domConstruct, on, dom, lang, topic, TableContainer) { // jshint ignore:line

        return declare("mjChangeHistory", [baseController, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], { //jshint ignore:line
            templateString: template,
            constructor: function (args) {
            this.widget = this;
            lang.mixin(this, args);
            this.handle1 = topic.subscribe("lingoController/userChangeHistory", lang.hitch(this, function(obj) {
                 this.showUserData(obj);
            }));
            this.handle2 = topic.subscribe("lingoController/groupChangeHistory", lang.hitch(this, function(obj) {
                 this.showGroupData(obj);
            }));
            this.handle3 = topic.subscribe("lingoController/clearChangeHistory", lang.hitch(this, function(info) {
                 this.clearHistory(info);
            }));
            },
            buildRendering: function () {
                this.inherited(arguments);
                var widget = this;
            },
            init: function () {},
            resize: function () {
                this.inherited(arguments);
            },
            postCreate: function () {

            },
           showUserData: function(info) {
            if (!info) {
                return;
            }
            if(info.createdBy)
              this.userAdded.set("value", info.createdBy);
            if(info.createDate)
                this.userAddedDate.set("value", info.createDate);
            if(info.modifiedBy)
                this.userModified.set("value", info.modifiedBy);
            if(info.modifiedDate)
                this.userModifiedDate.set("value", info.modifiedDate);

        },
            showGroupData: function(info) {
            if (!info) {
                return;
            }
            if(info.createdBy)
                this.groupAdded.set("value", info.createdBy);
            if(info.createDate)
                this.groupAddedDate.set("value", info.createDate);
            if(info.modifiedBy)
                this.groupModified.set("value", info.modifiedBy);
            if(info.modifiedDate)
            this.groupModifiedDate.set("value", info.modifiedDate);

        },
            clearHistory : function(info) {
                if(info.includes("User")) {
                    this.userAdded.set("value", "");
                    this.userAddedDate.set("value", "");
                    this.userModified.set("value", "");
                    this.userModifiedDate.set("value", "");
                }
                if(info.includes("Group")) {
                    this.groupAdded.set("value", "");
                    this.groupAddedDate.set("value", "");
                    this.groupModified.set("value", "");
                    this.groupModifiedDate.set("value", "");
                }
            },
            destroy: function () {
                this.inherited(arguments);
                this.handle1.remove();
                this.handle2.remove();
                this.handle3.remove();
            }
        });

    });
