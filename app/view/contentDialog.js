define(["dojo/_base/declare",
        "dijit/Dialog",
        "dijit/form/SimpleTextarea",
        "dijit/form/Button",
        "dojo/dom-construct"
       ], function (declare, Dialog, TextArea, Button, domConstruct) {
    return declare(null, {
        constructor: function (info) {

            var dialogDiv = domConstruct.create("div", {
                'class': "contentDialog",
                id: "contentDialog"
            }, document.body);

            this.dialog = new Dialog({
                title: info.title,
                closable: false
            }).placeAt(dialogDiv);

            var dialog = this.dialog;

            var content = new TextArea({
                style: "resize:none;",
                rows: 11,
                value: info.content,
                readOnly: info.readOnly,
                onChange: function () {
                    info.content = content.get("value");
                }
            }).placeAt(dialog.containerNode);

            this.divNode = domConstruct.create("div", {
                align: "center",
                style: {
                    'padding-top': "2%"
                }
            }, dialog.containerNode);


            var okButton = new Button({
                label: "OK",
                style: {
                    'padding-right': "4%"
                },
                onClick: function () {
                    dialog.destroyRecursive();
                    domConstruct.destroy("contentDialog");
                }
            }).placeAt(this.divNode);

            if (info.readOnly) {
                okButton.set("disabled", true);
            }



            new Button({
                label: "Cancel",
                onClick: function () {
                    dialog.destroyRecursive();
                    domConstruct.destroy("contentDialog");
                }
            }).placeAt(this.divNode);

            this.dialog.startup();
            this.dialog.show();

        }
    });
});
