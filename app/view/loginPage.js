/*global define*/
define(["dojo/_base/declare",
        "dijit/Dialog",
        "dojo/dom-construct",
        "dijit/form/Button",
        "dijit/form/TextBox",
        "dijit/form/Form",
        "dojo/_base/window",
        "dijit/registry",
        "dojo/dom-style",
        "dojo/dom",
        "dojo/domReady!"
        ],
    function (declare, Dialog, domConstruct, Button, TextBox, Myform, window, registry, domStyle, dom) {
        var dialog = null;
        return declare(null, {
            show: function () {
                if (dialog !== null) {
                    dialog.show();
                }
            },
            hide: function () {
                if (dialog !== null) {
                    dialog.hide();
                }
            },
            buildUI: function (controller) {

                var loginDiv = domConstruct.create("div", {
                    id: "loginDiv"
                }, window.body());

                var form = new Myform({}, "myform").placeAt(loginDiv);

                dialog = new Dialog({
                    title: "LDesk Login",
                    closable: false,
                    draggable: false,
                    id: 'loginPage_Dialog',
                    style: "width:40% !important",
                    'class': "claro"
                });


                domConstruct.create("img", {
                    src: "images/lingo_logo_small.png",
                    height: "60px",
                }, dialog.containerNode);



                var fieldSetDiv = domConstruct.create("div", {
                    style: "text-align:center"
                }, dialog.containerNode);
                var fieldSet = domConstruct.create("fieldset", {}, fieldSetDiv);
                var legendary = domConstruct.create("legend", {}, fieldSetDiv);

                var div5 = domConstruct.create("div", {
                    style: "padding-top: 5px"
                });

                var mLabel = domConstruct.create("span", {
                    innerHTML: "<Strong> LDesk Login</Strong>",
                    style: "text-align:center"
                });
                var lLogin = domConstruct.create("span", {
                    innerHTML: "Login"
                });
                var lPasswd = domConstruct.create("span", {
                    innerHTML: "Password"
                });


                var memberLogin = new TextBox({
                    placeHolder: '',
                    name: 'agentId',
                    lowercase: true,
                    id: 'loginPage_agentId'
                }, "Login");

                var memberPass = new TextBox({
                    placeHolder: '',
                    name: 'password',
                    id: 'loginPage_password',
                    type: 'password'
                });


                var btnLogin = new Button({
                    label: "  Login   ",
                    id: "loginPage_loginBtn"
                });

                //var synMessage = controller.getSyncAlertMessage();
                var synMessage = null;
                //environment.syncMessage = message;
                var syncDiv = domConstruct.create("div", {
                    id: "syncAlertDiv",
                    'class': "alertMessage"
                });

                var message = "";
                domConstruct.create("span", {
                    innerHTML: "<Strong>" + message + "</Strong>",
                    style: "text-align:center;color:red"
                }, syncDiv);

                var dialogDiv = domConstruct.create("div", {
                    id: "dialogDiv"
                });

                //var message = "LDesk is compatible with Chrome Version 55 and above";
                //var versionDiv = domConstruct.create("div", {
                //    id: "versionAlertDiv",
                //    'class': "versionMessage"
                //});

                //domConstruct.create("span", {
                //  innerHTML: "<Strong>" + message + "</Strong>",
                //    style: "align:center;color:grey"
                //}, versionDiv);


                if (synMessage)
                    form.domNode.appendChild(syncDiv);
                form.domNode.appendChild(dialogDiv);
                dialogDiv.appendChild(dialog.domNode);
                dialog.containerNode.appendChild(div5);
                var table = domConstruct.create("table", {
                    style: "width: 100%"
                });
                var tr = domConstruct.create("tr", {}, table);
                var td = domConstruct.create("td", {
                    style: "width: 34%;text-align:right;padding-right: 10px"
                }, tr);
                td.appendChild(lLogin);
                td = domConstruct.create("td", {
                    style: "text-align:left;"
                }, tr);
                td.appendChild(memberLogin.domNode);
                tr = domConstruct.create("tr", {}, table);
                td = domConstruct.create("td", {
                    style: "width: 35%;text-align:right;padding-right: 10px"
                }, tr);
                td.appendChild(lPasswd);
                td = domConstruct.create("td", {
                    style: "text-align:left;"
                }, tr);
                td.appendChild(memberPass.domNode);


                fieldSet.appendChild(table);
                fieldSet.appendChild(div5);

                div5.appendChild(btnLogin.domNode);

                //dialog.containerNode.appendChild(versionDiv);

                var div6 = domConstruct.create("div", {
                    style: "padding-top: 10px;text-align: center"
                });

                var link = "<a id=\"loginPage_oktaBtn\" href=\"javascript:void(null);\" style=\"color: blue;font-size: 14px;font-weight: bold;\">Sign In with OKTA</a>";

                var label = dojo.create("label", {
                    innerHTML: link
                }, div6);
                dialog.containerNode.appendChild(div6);


                dialog.startup();

                /*global loginDialog:true*/
                loginDialog = dialog;

                //form.domNode.appendChild(versionDiv);
            }
        });

    });
