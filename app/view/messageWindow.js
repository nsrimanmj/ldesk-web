define(["dojo/_base/declare",
        "dijit/Dialog",
        "dijit/form/Button",
        "dojo/dom-construct",
        "dijit/form/SimpleTextarea",
        "dojo/has!dom?dojo/domReady!"
        ], function (declare, Dialog, Button, domConstruct, Textarea) {
    return declare('messageWindow', null, {
        dialog: null,
        constructor: function (obj) {
            var content = domConstruct.create("div", {});

            var messageDiv = domConstruct.create("div", {
                style: "padding-top:2%"
            }, content);

            new Textarea({
                rows: "4",
                style: "width:95%;padding-top:2%;resize:none;font-family: Verdana, Arial, Helvetica, sans-serif;text-align:center",
                readOnly: true,
                disabled: true,
                value: obj.message
            }).placeAt(messageDiv);

            new Button({
                label: "OKAY",
                style: "padding-left:40%;padding-top:2%",
                onClick: function () {
                    dialog.destroyRecursive();
                    domConstruct.destroy(messageDiv);
                    if (obj.onOK) {
                        obj.onOK();
                    }
                }
            }).placeAt(content);



            var messageDiv = domConstruct.create("div", {
                'class': "messageWindow"
            });


            this.dialog = new Dialog({
                title: obj.title,
                content: content,
                closable: false
            }).placeAt(messageDiv);
            var dialog = this.dialog;

            document.body.appendChild(messageDiv);
            this.dialog.startup();
            this.dialog.show();

        }
    });


})
