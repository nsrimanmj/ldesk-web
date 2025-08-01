define(["dojo/_base/declare",
        "dijit/form/SimpleTextarea",
        "dijit/form/Button",
        "dijit/Dialog",
        "dojo/dom-construct",
        "dojo/topic",
        "dijit/registry",
		"dojo/dom-style",
		"dojo/dom"
       ], function (declare, Textarea, Button, Dialog, domConstruct, topic, registry, domStyle, dom) {

	   var agent = null;
	   var fontSize = 12;

	   var saveFontSize = function() {
	   	window.localStorage.setItem(agent+"_fontsize", fontSize);
	   }

	var resetFontSize = function(id) {
		fontSize = 12;
		changeFontSize(id);
	   	window.localStorage.removeItem(agent+"_fontsize");
	}

	   var changeFontSize = function(id, type) {

			if (!fontSize) {
	   			fontSize = parseInt(domStyle.get(dom.byId(id+"diaryEditor_editor"), "font-size"));
			}

	   		if (type == "plus") {
			   fontSize = fontSize+2;
	   		}

			if (type == "minus") {
			   fontSize = fontSize-2;
			}

	   		if (fontSize < 10) {
				fontSize = 10;
			}

			if (dom.byId(id+"diaryEditor_editor")) {
					domStyle.set(dom.byId(id+"diaryEditor_editor"), "font-size", fontSize+"px");
			}

            /*
			if (dom.byId(id+"diaryEditor_history")) {
					domStyle.set(dom.byId(id+"diaryEditor_history"), "font-size", fontSize+"px");
			}
            */
	   }

    return declare(null, {
        constructor: function (id, title, isHistorySent, history, content, isReadOnly, eventToPublish, eventToSubscribe) {

			//var fontSize = getFontSize();
		agent = window.localStorage.getItem("agent");
		fontSize = parseInt(window.localStorage.getItem(agent+"_fontsize"));

		if (!fontSize) {
			fontSize = 12;
		}

            var dialogDiv = domConstruct.create("div", {
                'class': "diaryEditor",
                id: id + "diaryEditor"
            }, document.body);

            var contentChangeHandle;
            var dialog = new Dialog({
                title: title,
                closable: true,
		onHide: function () {
		    dialog.destroyRecursive();
                    if (typeof eventToSubscribe != "undefined" && eventToSubscribe !== null) {
                        contentChangeHandle.remove();
                    }
                    domConstruct.destroy(id + "diaryEditor");
                },
                autofocus: false
            }).placeAt(dialogDiv);

		var zoomDiv =  domConstruct.create("div", {
				style: "height:0px;"
            }, dialog.containerNode);	

		var zoomInBtn = new Button({
			iconClass: "zoomInIcon",
			showLabel: false,
			'class': "right",
			title: "Font-size: "+(fontSize+2)+"px",
			style: "margin-left:1px !important;",
			onClick: function () {
				changeFontSize(id, "plus");
				zoomInBtn.set("title", "Font-size: "+(fontSize+2)+"px");
				zoomOutBtn.set("title", "Font-size: "+(fontSize-2)+"px");
			}
	    }).placeAt(zoomDiv);

	var zoomOutBtn = new Button({
            iconClass: "zoomOutIcon",
            showLabel: false,
            'class': "right",
	    title: "Font-size: "+(fontSize-2)+"px",
	    style: "margin-left:1px !important;",
            onClick: function () {
		changeFontSize(id, "minus");
		zoomInBtn.set("title", "Font-size: "+(fontSize+2)+"px");
		zoomOutBtn.set("title", "Font-size: "+(fontSize-2)+"px");
            }
        }).placeAt(zoomDiv);

	var saveBtn = new Button({
            iconClass: "saveIcon",
            showLabel: false,
            'class': "right",
            title: "Save current Font-size",
	    style: "margin-left:1px !important;",
            onClick: function () {
		saveFontSize();
            }
        }).placeAt(zoomDiv);

	var restBtn = new Button({
            iconClass: "resetIcon",
            showLabel: false,
            'class': "right",
            title: "Reset Font-size to Normal",
            onClick: function () {
		resetFontSize(id);
            }
        }).placeAt(zoomDiv);
            /*
            if (isHistorySent) {
                domConstruct.create("label", {
                    'for': id + "diaryEditor_history",
		    style: "padding-top:2%;",
                    innerHTML: "Diary History:"
                }, dialog.containerNode);

		console.log(history);
                var historyEditor = new Textarea({
                    id: id + "diaryEditor_history",
                    rows: 12,
                    cols: 75,
                    value: history,
		    style: "width:500px;height:200px",
                    readOnly: true,
                    disabled: true
                }).placeAt(dialog.containerNode);
            }
            */
            /* domConstruct.create("label", {
                'for': "diaryEditor_history",
                innerHTML: "Diary History:"
            }, dialog.containerNode);

            new Textarea({
                id: "diaryEditor_history",
                rows: 8,
                value: history,
                readOnly: true,
                style: "resize:none"
            }).placeAt(dialog.containerNode);*/

            domConstruct.create("label", {
                'for': id + "diaryEditor_editor",
                innerHTML: "Diary Editor:",
                style: "padding-top:2%;"
            }, dialog.containerNode);

            new Textarea({
                id: id + "diaryEditor_editor",
                rows: 12,
                cols: 75,
                value: content,
				style: "width:900px;height:400px",
                readOnly: isReadOnly,
		disabled: isReadOnly
            }).placeAt(dialog.containerNode);

            var contentChangeHandle;
            if (typeof eventToSubscribe != "undefined" && eventToSubscribe !== null) {
                contentChangeHandle = topic.subscribe(eventToSubscribe, function (data) {
                    registry.byId(id + "diaryEditor_editor").set("value", data.content);
                });
            }

            if (!isHistorySent)
                registry.byId(id + "diaryEditor_editor").set("rows", 16);
            var buttonsDiv = domConstruct.create("div", {
                align: "right",
                style: "padding-top:2%;"
            }, dialog.containerNode);

            var okButton = new Button({
                label: "OK",
                style: "padding-right:2%;",
                onClick: function () {
                    if (!isReadOnly && typeof eventToPublish != "undefined" && eventToPublish !== null) {
                        topic.publish(eventToPublish, {
                            modified: registry.byId(id + "diaryEditor_editor").get("value")
                        });
                    }
                    dialog.destroyRecursive();
                    if (typeof eventToSubscribe != "undefined" && eventToSubscribe !== null) {
                        contentChangeHandle.remove();
                    }
                    domConstruct.destroy(id + "diaryEditor");
                }
            }).placeAt(buttonsDiv);

            new Button({
                label: "Cancel",
                style: "padding-right:2%;",
                onClick: function () {
                    dialog.destroyRecursive();
                    if (typeof eventToSubscribe != "undefined" && eventToSubscribe !== null) {
                        contentChangeHandle.remove();
                    }
                    domConstruct.destroy(id + "diaryEditor");
                }
            }).placeAt(buttonsDiv);

            dialog.startup();
            dialog.show();
            okButton.focus();
			
	    changeFontSize(id);
        }
    });
});
