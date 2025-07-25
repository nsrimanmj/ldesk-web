define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/store/Memory",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/on",
	"dojox/widget/TitleGroup",
	"dijit/TitlePane",
	"dijit/ConfirmDialog",
	"dijit/Dialog",
	"dijit/layout/ContentPane",
	"dijit/form/DateTextBox",
	"dojo/date",
	"dijit/registry",
	"app/model/States",
	"app/model/Status",
	"app/model/Origin",
	"app/model/miniStores",
	"dojo/text!app/widgets/templates/create_network_event.html",
	"dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, TitleGroup, TitlePane, ConfirmDialog, Dialog, ContentPane, DateTextBox, Date, registry, States, StatusStore, OriginStore, MiniStores, template) { // jshint ignore:line

	var widget = null;

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
		templateString: template,
		widgetsInTemplate: true,
		info: null,
		constructor: function (args) {
			lang.mixin(this, args);
			var widget = this;
			widget.ctrl = widget.lingoController;

			widget.statusStore = new StatusStore();
			widget.originStore = new OriginStore();
			widget.miniStores = new MiniStores();
			widget.providerStore = widget.ctrl.getProviderStore();
			widget.subTypeStore = widget.ctrl.getSubTypeStore();
			widget.loginName = window.localStorage.getItem("agentName");
		},
		buildRendering: function () {
			this.inherited(arguments);
		},
		resize: function () {
			this.inherited(arguments);
		},
		init: function () {

		},
		postCreate: function () {
			var widget = this;
			widget.networkEventDialog.show();

			widget.caseStatus.set("store", widget.statusStore.getStatusStore());
			//widget.caseOrigin.set("store", widget.originStore.getOriginStore());
			widget.servicePriority.set('store', widget.miniStores.getServicePriorityStore());
			//widget.casePriority.set('store', widget.miniStores.getPriorityStore());

			on(widget.cancelBtn, "click", function () {
				widget.networkEventDialog.hide();
			});

			var statesModel = new States();
			var statesStore = statesModel.getStates();
			statesStore.remove(" ");
			widget.statesSelect.set("store", statesStore);

			on(widget.statesSelect, "change", function () {
				var selectedValues = widget.statesSelect.get("value");
				var selectedStates = [];
				selectedValues.forEach(element => {
					selectedStates.push(statesStore.get(element).name);
				});

				widget.selectedStates.set("value", selectedStates.join(','));
			})

			widget.subtype.set("store", widget.ctrl.getSubTypeStore(widget.category.value, widget.type.value));
			widget.provider.set("store", widget.providerStore);
			on(widget.submitBtn, "click", function () {
				if (!widget.createForm.validate()) {
					return;
				}
				widget.createNetworkEvent();

			})

			widget.caseStatus.set("value", "New");
		},
		createNetworkEvent: function () {
			var widget = this;
			var data = {};
			data.groupName = "Network";
			data.serviceNumber = 0;
			data.accountId = 0;

			var categoryName = widget.category.get("value");
			var type = widget.type.get("value");
			var subType = widget.subtype.get("value");
			//getting categoryId based on group, category, type and subtype
			data.categoryId = widget.ctrl.getCategoryId(data.groupName, categoryName, type, subType);
			data.subject = widget.subject.get("value").trim();
			data.description = widget.description.get("value").trim();
			data.notificationMsg = widget.notificationMsg.get("value").trim();
			data.servicePriority = widget.servicePriority.get("value");
			data.status = widget.caseStatus.get("value");
			if (widget.provider.get("value")) {
				data.providerId = widget.provider.item.id;
			}
			data.isDisplayMsg = widget.displayPortalMsg.get("value");
			//data.origin = widget.caseOrigin.get("value");
			/*if (widget.casePriority.get("value")) {
				data.priorityId = widget.casePriority.item.id;
			}*/
			data.statesAffected = widget.selectedStates.get("value");

			var callback = function (obj) {
				if (obj.response.code == "200") {
					if (widget.callback) {
						widget.callback(obj);
					}
					widget.networkEventDialog.destroyRecursive();
					widget.destroy;
				}
			}
			widget.ctrl.createCase(data, callback);
		},
		destroy: function () {
			this.inherited(arguments);
		}
	});

});
