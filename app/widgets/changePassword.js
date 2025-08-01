define([
	"dojo/_base/declare",
    "dojo/parser",
    "dojo/json",
    "dojo/dom",
    "dijit/registry",
    "dojo/dom-construct",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
    "dstore/Memory",
    "dojo/_base/lang",
    "dojo/dom-style",
    "dojo/on",
    "dijit/form/ValidationTextBox",
    "dijit/form/FilteringSelect",
    "dojox/layout/TableContainer",
    "dijit/form/CheckBox",
    "dojo/data/ObjectStore",
    "dstore/legacy/DstoreAdapter",
    "app/view/messageWindow",
    "app/widgets/theme",
    "app/widgets/loaderAnimation",
    "dojo/text!app/widgets/templates/change_password.html",
	"dojo/domReady!"
], function (declare, parser, json, dom, registry, domConstruct, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, domStyle, on, ValidationTextBox, Select, TableContainer, CheckBox, ObjectStore, DstoreAdapter, messageWindow, Theme, Animation, template) { // jshint ignore:line

    var widget = null,
        validationMessages = ["success", "New passwords entered do not match", "Password should not match your username", "Please enter a new password that is atleast 8 characters ", "Please include an upper case, a lower case and a special character in the password.", "Current Password cannot be empty", "Passowrd should not contain +, *, ?"],
        count = 0,
        animation = null;

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
        templateString: template,
        widgetsInTemplate: true,
        info: null,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;
            count = 0;
            animation = new Animation('loading_icon');
            widget.ctrl = widget.lingoController;
        },
        resize: function () {
            this.inherited(arguments);
        },
        init: function () {

        },
        submit: function () {
            var onSuccess = lang.hitch(this, function (returned) {
                count++;
                var thisObj = this;
                if (returned == "success") {
                    new messageWindow({
                        message: "Password successfully changed ",
                        title: "Note",
                        onOK: function () {
                            widget.changePasswordDlg.hide();
                            thisObj.doLogout();
                        }
                    });
                } else if ( returned == "failure") {
                    widget.currentPassword.set('value', '');
                    widget.newPassword.set('value', '');
                    widget.confirmNewPassword.set('value', '');
                }
            });
            var widget = this;

            var agentID = window.localStorage.getItem("agent");

            var currentPwd = widget.currentPassword.get('value').trim();
            var newPwd = widget.newPassword.get('value').trim();
            var confirmNewPwd = widget.confirmNewPassword.get('value').trim();

            var isValid = this.checkPasswordValidation(newPwd, confirmNewPwd, currentPwd, agentID);

            if (isValid !== 0) {
                new messageWindow({
                    message: validationMessages[isValid],
                    title: "ERROR"
                });
                onSuccess("failure");
                return;
            }
  
            this.changePassword(agentID, currentPwd, newPwd, count, onSuccess);

        },
        changePassword: function (agentId, currentPwd, newPassword, count, callback) {

            var requestObj = {
                "loginName": agentId,
                "password": currentPwd,
                "newPassword": newPassword
                //"passwordAttempt": count.toString()
            };

            requestObj = json.stringify(requestObj);

            var processData = function (data) {
                if (data.response.code === 200) {
                    callback("success");
                } else {
                    new messageWindow({
                        message: data.response.message,
                        title: "ERROR"
                    });
                    callback("failure");
                }
                animation.hide();
            };
            animation.show();
            this.sendRequest("password", requestObj, processData, "Error while updating password, Please report to " + environment.appName + " Dev immediately", "put", 60000);

        },
        doLogout: function () {
            var dataObj = {};
            dataObj = json.stringify(dataObj);
            var callBack = function (data) {
                if (data.response.code === 200 || data.response.code === 1201) {
                    //window.localStorage.clear();
                    this.clearLocalStorage();
                    if (dom.byId("controlPanelDiv")) {
						registry.byId("mainContainer").destroyRecursive();
					}
                    var theme = new Theme();
                    theme.applyTheme('main', 'Default');
                    if (registry.byId("themeDialog")){
                        registry.byId("themeDialog").destroyRecursive();
                    }
                    dom.byId('loginPage_agentId').value = "";
                    dom.byId('loginPage_password').value = "";

                    /*global loginDialog*/
                    loginDialog.show();

                    if (dom.byId("controlPanelDiv")) {
                        registry.byId("appTabContainer").destroyRecursive();
                        domConstruct.destroy("appDiv");
                    }
                } else {
                    new messageWindow({
                        title: "ERROR",
                        message: data.response.message
                    });
                }
                domStyle.set(dom.byId("loading_icon"), "display", "none");
            };
            domStyle.set(dom.byId("loading_icon"), "display", "block");
            this.sendRequest("logout", dataObj, lang.hitch(this, callBack), "Failure while logging out Please report to LDesk - Dev", "get", 60000);
        },
        checkPasswordValidation: function (newPassword, confirmPassword, currentPwd, agentId) {

            if (!currentPwd) {
                return 5;
            } else if (newPassword.length < 8) {
                return 3;
            } else if (newPassword.toLowerCase().includes(agentId)) {
                return 2;
            } else if (newPassword != confirmPassword) {
                return 1;
            } else if (/[+*?]/.test(newPassword)) {
                return 6;
            } else if (!(/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && /[^A-Za-z0-9_]/.test(newPassword))) {
                return 4;
            }
            return 0;
        },

        postCreate: function () {
            var widget = this;
            this.inherited(arguments);
            widget.changePasswordDlg.show();

            widget.userName.set('value', window.localStorage.getItem("agent"));
            widget.submitBtn.on("click", lang.hitch(this, function () {
                widget.submit();
            }));

            on(widget.changePasswordDlg, "hide", lang.hitch(this, function () {
                widget.changePasswordDlg.destroyRecursive();
                this.destroy();
            }));

        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});