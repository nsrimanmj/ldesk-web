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
    "dijit/form/RadioButton",
    "dojox/layout/TableContainer",
    "dojo/data/ObjectStore",
    "dstore/legacy/DstoreAdapter",
    "dojo/text!app/widgets/templates/admin_edit_group.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, Memory, lang, domStyle, on, RadioButton, TableContainer, ObjectStore, DstoreAdapter, template) { // jshint ignore:line

    var widget = null;

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
        templateString: template,
        widgetsInTemplate: true,
        info: null,
        constructor: function (args) {
            lang.mixin(this, args);
		    var widget = this;
            widget.ctrl = widget.lingoController;
            widget.agentLevel = widget.groupInfo.agentLevel;
            widget.escalationDuty = widget.groupInfo.escalationDuty;
        },
           buildRendering: function () {
            this.inherited(arguments);
         },
        resize: function () {
            this.inherited(arguments);
        },
        init: function () {
           
        },
        selectAgentLevel : function(evt) {
		    var widget = this;
            widget.agentLevel = evt.target.value;
        },
         selectEsclation : function(evt) {
		    var widget = this;
            widget.escalationDuty = evt.target.value;
        },
        submit : function() {
            var widget = this;
             var callback =  function(){
                    widget.editGroup.hide();
                };
            
            var group = {};
            group.groupName = widget.groupInfo.groupName;
            group.agentLevel = widget.agentLevel;
            group.escalationDuty = widget.escalationDuty;
            group.action = 'update';

            var request = {};
            request.groups = [];
            request.loginName = widget.groupInfo.userName;
            request.groups.push(group);
 
            widget.ctrl.updateGroup(request, lang.hitch(this, callback));
        },
        postCreate: function () {
            var widget = this;
            this.inherited(arguments);
             widget.editGroup.show();
          
            
            registry.byId("editGroup_agentLevel" + widget.groupInfo.agentLevel).set('checked', true);
            registry.byId("editGroup_esclationDuty" + widget.groupInfo.escalationDuty).set('checked', true);
            
            
            widget.submitBtn.on("click", lang.hitch(this, function () {
                widget.submit();
            }));
            
              on(widget.editGroup, "hide", lang.hitch(this, function () {
                widget.editGroup.destroyRecursive();
		          this.destroy();
            }));
            
            widget.cancelButton.on("click", lang.hitch(this, function () {
                widget.editGroup.hide();
            }));
            
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});