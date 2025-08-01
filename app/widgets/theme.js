define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/form/TextBox",
	"dijit/form/Button",
	"dijit/Dialog",
	"dijit/registry",
	"dojo/text!./templates/theme.html",
	"dojo/dom-class",
	"dojo/dom-style",
	"dojox/widget/ColorPicker",
	"dijit/form/DropDownButton",
	"dojo/dom",
	"dojo/on",
	"dijit/ConfirmDialog"
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, TextBox, Button, Dialog, registry, template, domClass, domStyle, ColorPicker, DropDownButton, dom, on, ConfirmDialog) {

	var defaultMap = {
		'Default': {
			'--main-bg-color': '#ffffff',
			'--hover-bg-color': '#8cc0f2',
			'--main-border-color': '#759dc0',
			'--button-bg-color': '#bcd8f4',
			'--button-hover-color': '#8cc0f2',
			'--title-bg-color': '#abd6ff',
			'--main-text-color': '#000000',
			'--elem-text-color': '#000000'
		},
		'Light Blue': {
			'--main-bg-color': '#dbeef4',
			'--hover-bg-color': '#8cc0f2',
			'--main-border-color': '#759dc0',
			'--button-bg-color': '#bcd8f4',
			'--button-hover-color': '#8cc0f2',
			'--title-bg-color': '#bcd8f4',
			'--main-text-color': '#000000',
			'--elem-text-color': '#000000'
		},
		'Light Green': {
			'--main-bg-color': '#f1fff0',
			'--hover-bg-color': '#7def72',
			'--main-border-color': '#75c077',
			'--button-bg-color': '#7ec58a',
			'--button-hover-color': '#7def72',
			'--title-bg-color': '#7ec58a',
			'--main-text-color': '#000000',
			'--elem-text-color': '#000000'
		},
		'Dark': {
			'--main-bg-color': '#191919',
			'--hover-bg-color': '#4d4d4d',
			'--main-border-color': '#000000',
			'--button-bg-color': '#ffffff',
			'--button-hover-color': '#dcd4d4;',
			'--title-bg-color': '#6b6969',
			'--main-text-color': '#ffffff',
			'--elem-text-color': '#000000'
		}
	}
	var themeMap = {};

	function shadeColor(color, percent) {
		var f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
		return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
	}
	return declare("extendedTextBox", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
		templateString: template,
		currentTheme: null,
		agentName: null,
		customTheme: null,
		customCount: 0,
		constructor: function () {
			var existing = registry.byId("themeDialog");
			if (existing && !existing._destroyed) {
				existing.destroyRecursive();
			}
			this.agentName = window.localStorage.getItem('agent');
			var customTheme = window.localStorage.getItem(this.agentName + "_theme");
			if (customTheme) {
				try {
					this.customTheme = JSON.parse(customTheme);
				} catch (e) {
					console.log(e);
				}
			}

			if (this.customTheme) {
				themeMap = Object.assign({}, defaultMap, this.customTheme.themeMap);
				this.applyTheme('main', this.customTheme.selectedTheme);
			} else {
				themeMap = defaultMap;
			}
		},

		buildRendering: function () {
			this.inherited(arguments);
		},
		addOptions: function () {
			this.selectTheme.removeOption(this.selectTheme.getOptions());
			for (var key in defaultMap) {
				var option = { 'value': key, 'label': key, selected: false };
				this.selectTheme.addOption([option]); // add all options at once as an array
			}

			var option = { 'type': 'separator' };
			this.selectTheme.addOption([option]); // add all options at once as an array

			this.customCount = 0;
			if (this.customTheme && this.customTheme.themeMap) {
				for (var key in this.customTheme.themeMap) {
					var option = { 'value': key, 'label': key, selected: false };
					this.selectTheme.addOption([option]); // add all options at once as an array
					this.customCount++;
				}

				var option = { 'type': 'separator' };
				this.selectTheme.addOption([option]); // add all options at once as an array
				// console.log(this.customCount);
			}

			//option = {'value': 'Create', 'label': 'Create'};
			//this.selectTheme.addOption([option]); // add all options at once as an array
		},
		showCreate: function (type) {

			if (type == 'edit') {
				this.createName.set('value', this.selectTheme.value);
				this.createName.set('disabled', true);
				this.createFS.set('title', 'Edit');
				this.btnAddTheme.set('label', 'Update');
			} else {
				this.createName.set('value', 'Custom-' + (this.customCount + 1));
				this.createName.set('disabled', false);
				this.createFS.set('title', 'Create');
				this.btnAddTheme.set('label', 'Add');
			}

			domStyle.set(this.createDiv, 'display', 'block');
			var theme = this.currentTheme;
			if (!theme) {
				theme = "Default";
			}
			var map = themeMap[theme];
			this.createMap = dojo.clone(map);
			this.changeBgColor.value = map['--main-bg-color'];
			this.changeDlgColor.value = map['--title-bg-color'];
			this.changeBorderColor.value = map['--main-border-color'];
			this.changeBtnColor.value = map['--button-bg-color'];
			this.changeTextColor.value = map['--main-text-color'];

			return
		},
		confirmRemove: function () {
			var widget = this;
			var confirmDialog = new ConfirmDialog({
				title: "Remove Theme: " + this.selectTheme.value,
				content: "<p style=\"text-align:center;\">Do you really want to remove this theme?</p>",
				closable: false,
				onExecute: function () {
					widget.removeTheme();
				}
			});
			confirmDialog.set("buttonOk", "Yes");
			confirmDialog.set("buttonCancel", "No");
			confirmDialog.startup();
			confirmDialog.show();
		},
		removeTheme: function () {
			var theme = this.selectTheme.value;
			delete this.customTheme.themeMap[theme];
			this.addOptions();
			this.selectTheme.set('value', this.currentTheme);
		},
		cancelCreate: function () {
			domStyle.set(this.createDiv, 'display', 'none');
			this.selectTheme.set('value', this.currentTheme);
		},
		applyColor: function (elm, property) {
			var dlg = document.getElementById('themeDialog');
			domClass.remove(dlg, "myTheme");
			domClass.add(dlg, "myTheme");
			var color = elm.value;
			dlg.style.setProperty(property, color);
			var hoverColor = shadeColor(color, 1);
			this.createMap[property] = color;

			if (property === '--title-bg-color') {
				dlg.style.setProperty('--hover-bg--color', hoverColor);
				this.createMap['--hover-bg-color'] = color;
			}

			if (property == '--button-bg-color') {
				dlg.style.setProperty('--button-hover-color', hoverColor);
				this.createMap['--button-hover-color'] = color;
			}
		},
		addTheme: function () {
			var name = this.createName.value;
			if (!this.customTheme) {
				this.customTheme = {};
			}

			if (!this.customTheme.themeMap) {
				this.customTheme.themeMap = {};
			}
			this.customTheme.themeMap[name] = this.createMap;
			themeMap = Object.assign({}, defaultMap, this.customTheme.themeMap);
			this.addOptions();
			this.selectTheme.set('value', name);
			//this.customCount++;
			domStyle.set(this.createDiv, 'display', 'none');
		},
		postCreate: function () {
			var widget = this;
			this.btnThemeCancel.on('click', function () {
				widget.themeDialog.hide();
			});

			this.themeDialog.on('hide', function () {
				// widget.themeDialog.destroyRecursive();
			});

			this.addOptions();

			on(this.changeBgColor, 'change', function () {
				widget.applyColor(widget.changeBgColor, '--main-bg-color');
			});

			on(this.changeDlgColor, 'change', function () {
				widget.applyColor(widget.changeDlgColor, '--title-bg-color');
			});
			on(this.changeBtnColor, 'change', function () {
				widget.applyColor(widget.changeBtnColor, '--button-bg-color');
			});

			on(this.changeTextColor, 'change', function () {
				widget.applyColor(widget.changeTextColor, '--main-text-color');
			});

			on(this.changeBorderColor, 'change', function () {
				widget.applyColor(widget.changeBorderColor, '--main-border-color');
			});

			this.btnCancelTheme.on('click', function () {
				widget.cancelCreate();
			});

			this.btnAddTheme.on('click', function () {
				widget.addTheme();
			});

			this.btnRemove.on('click', function () {
				widget.confirmRemove();
			});

			this.btnEdit.on('click', function () {
				widget.showCreate('edit');
			});

			this.selectTheme.on('change', function (oldVal, newVal) {
				var value = widget.selectTheme.value;
				domStyle.set(widget.buttonDiv, 'display', 'block');
				domStyle.set(widget.createDiv, 'display', 'none');
				if (defaultMap[value] || value == 'Create') {
					domStyle.set(widget.buttonDiv, 'display', 'none');
				}

				if (value == 'Create') {
					widget.showCreate();
					return;
				}

				widget.applyTheme('preview');
			});

			this.btnThemeApply.on('click', function () {
				widget.applyTheme('main');
				widget.themeDialog.hide();
			});
			if (this.currentTheme) {
				this.selectTheme.set('value', this.currentTheme);
			}
		},
		showDialog: function () {
			var theme = this.themeDialog;
			theme.show();
		},
		applyTheme: function (type, theme) {
			var elm = document.getElementById('themeDialog');
			if (type != 'preview') {
				elm = document.body;
			}

			if (!theme) {
				theme = this.selectTheme.get('value');
			}
			if (this.currentTheme) {
				var map = themeMap[this.currentTheme];
				if (map) {
					for (var key in map) {
						elm.style.removeProperty(key);
					}
				}
				//domClass.add('themeDialog', "myTheme");
				domClass.remove(elm, "myTheme");
			}

			this.currentTheme = theme;
			var map = themeMap[theme];
			if (map) {
				if (type == 'main' && theme == 'Default') {

				} else {
					for (var key in map) {
						var value = map[key];
						elm.style.setProperty(key, value);
					};
				}
				//domClass.add('themeDialog', "myTheme");
				domClass.add(elm, "myTheme");
				if (type == 'main' && theme == 'Default') {
					domClass.remove(document.body, "myTheme");
				}
				if (!this.customTheme) {
					this.customTheme = {};
				}
				this.customTheme.selectedTheme = theme;
				if (type != 'preview') {
					window.localStorage.setItem(this.agentName + "_theme", JSON.stringify(this.customTheme));
				}

			}
		}
	});
});