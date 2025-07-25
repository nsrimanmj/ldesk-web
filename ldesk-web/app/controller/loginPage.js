/*global define*/
define([
	"dojo/_base/declare",
	"dojo/request",
	"dojo/json",
	"dojo/dom",
	"dijit/registry",
	"app/controller/baseController",
	"app/view/messageWindow",
	"app/view/loginPage",
	"dojo/_base/lang",
	"dojo/on",
	"app/widgets/loaderAnimation",
	"app/view/mainWindow",
	"app/widgets/changePassword",
	"dojo/topic",
	"dijit/ConfirmDialog",
	"dojo/dom-construct",
	"dojo/_base/window",
	"dojo/Deferred",
	"dojo/domReady!"
], function (declare, request, json, dom, registry, baseController, messageWindow, View, lang, on, Animation, MainWindow, ChangePassword, topic, ConfirmDialog, domConstruct, win, Deferred) {
	'use strict';
	var view = null,
		loginCtrl = null,
		animation = null,
		authClient = null;

	return declare([baseController], {
		constructor: function () {
			view = new View();
			animation = new Animation('loading_icon');
			loginCtrl = this;

			var issuer = environment.oktaIssuer;
			var clientId = environment.oktaClientId;
			var redirectUri = environment.oktaRedirectUri
			var config = {
				issuer: issuer,
				clientId: clientId,
				redirectUri: redirectUri
			};

			authClient = new OktaAuth(config);
			authClient.start();

		},
		buildUI: function () {
			view.buildUI(this);
			on(registry.byId("loginPage_password"), "keyPress", lang.hitch(this, function (event) {
				if (event.keyCode === 13) {
					this.doLogin(registry.byId("loginPage_agentId").get("value"), registry.byId("loginPage_password").get("value"));
				}
			}));
			on(registry.byId("loginPage_loginBtn"), "click", lang.hitch(this, function () {
				this.doLogin(registry.byId("loginPage_agentId").get("value"), registry.byId("loginPage_password").get("value"));
			}));

			on(dom.byId("loginPage_oktaBtn"), "click", lang.hitch(this, function () {
				this.oktaLogin();
			}));

			//view.show();
			//this.isUserLoggedIn();
			try {
				var widget = this;
				var queryString = window.location.search;
				if (/iss=/i.test(queryString)) {
					this.oktaLogin();
					return;
				}

				if (/forceLogin/i.test(queryString)) {
					this.forceLogin = true;
				}

				if (authClient.isLoginRedirect()) {
					if (!this.checkOktaSupport()) {
						return;
					}
					try {
						authClient.handleRedirect().then(function (response) {
							console.log("Okta Redirect.Validating with LDesk");
							// Retrieve the stored tokens from the Token Manager
							authClient.tokenManager.get('accessToken').then(function (response) {
								var accessToken = response.accessToken;
								var email = response.claims.sub;
								widget.handleOktaLogin(accessToken, email);
							}).catch(err => {
								new messageWindow({
									message: "Authentication Faild: " + err,
									title: "ERROR"
								});
							});;
							//this.isUserLoggedIn();
						}).catch(err => {
							new messageWindow({
								message: "Authentication Faild: " + err,
								title: "ERROR"
							});
						});;
					} catch (e) {
						// log or display error details
						console.log(e);
						this.isUserLoggedIn();
					}
				} else {
					this.isUserLoggedIn();
				}
			} catch (e) {
				console.log(e);
				this.isUserLoggedIn();
			}

			//this.oktaLogin();
		},

		doLogin: function (agent, password, forceLogin) {
			var dataobj = {
				username: agent.trim(),
				password: password
			};
			if (forceLogin || this.forceLogin) {
				dataobj.forceLogin = true;
			}
			dataobj = json.stringify(dataobj);

			var callBack = function (responseJson) {
				animation.hide();
				var showPasswordForm = function () {
					var changePassword = new ChangePassword();
					view.hide();
				};

				if (responseJson.response.code === 200) {
					/*global window*/
					window.localStorage.setItem("agent", agent);
					//window.localStorage.setItem("agentStatus", agentStatus);
					window.localStorage.setItem("X-Auth-Source", "LDESK");
					if (responseJson.data.forcePasswordChangeOnLogin === true) {
						showPasswordForm();
					} else {
						this.showMainWindow(responseJson.data);
						this.getEventData();
					}

				} else {
					if (responseJson.response.code === 1101) {
						new messageWindow({
							message: responseJson.response.message,
							title: "Warning",
							onOK: lang.hitch(this, this.showMainWindow, responseJson.data)
						});
					} else if (responseJson.response.code === 1102) {
						window.localStorage.setItem("agent", agent);
						//window.localStorage.setItem("agentStatus", agent);
						new messageWindow({
							message: responseJson.response.message,
							title: "Note",
							onOK: showPasswordForm
						});
					} else if (responseJson.response.code === 1104) {
						new ConfirmDialog({
							title: "Note",
							content: "There is a session for the agent \'" + agent + "\' which is valid. Do you want to override it",
							buttonOk: "Yes",
							buttonCancel: "No",
							closable: false,
							onExecute: lang.hitch(this, this.doLogin, agent, password, true)
						}).show();
					} else {
						dom.byId('loginPage_agentId').value = "";
                    	dom.byId('loginPage_password').value = "";
						new messageWindow({
							message: responseJson.response.message,
							title: "ERROR"
						});
					}
				}
			};
			animation.show();
			this.sendRequest('login', dataobj, lang.hitch(this, callBack), "Error while logging into " + environment.appName + " Please Report this to " + environment.appName + "-Dev immediately", "post", 60000);
		},
		handleOktaLogin: function (token, email, forceLogin) {
			var dataobj = {
				accessToken: token,
				email: email
			};
			if (forceLogin) {
				dataobj.forceLogin = true;
			}
			dataobj = json.stringify(dataobj);

			var callBack = function (responseJson) {
				animation.hide();

				if (responseJson.response.code === 200) {
					/*global window*/
					window.localStorage.setItem("agent", responseJson.data.loginName);
					window.localStorage.setItem("X-Auth-Source", "OKTA");
					this.showMainWindow(responseJson.data);
					this.getEventData();
				} else {
					if (responseJson.response.code === 1101) {
						new messageWindow({
							message: responseJson.response.message,
							title: "Warning",
							onOK: lang.hitch(this, this.showMainWindow, responseJson.data)
						});
					} else if (responseJson.response.code === 1104) {
						new ConfirmDialog({
							title: "Note",
							content: "There is a session for the agent \'" + email + "\' which is valid. Do you want to override it",
							buttonOk: "Yes",
							buttonCancel: "No",
							closable: false,
							onExecute: lang.hitch(this, this.handleOktaLogin, token, email, true)
						}).show();
					} else {
						new messageWindow({
							message: responseJson.response.message,
							title: "ERROR"
						});
					}
				}
			};
			animation.show();
			this.sendRequest('oktaLogin', dataobj, lang.hitch(this, callBack), "Error while logging into " + environment.appName + " Please Report this to " + environment.appName + "-Dev immediately", "post", 60000);
		},
		isUserLoggedIn: function () {
			var ctrl = this;

			if (window.localStorage.getItem("X-Auth-Token") == null) {
				this.clearLocalStorage();
				view.show();
			} else {
				var dataObj = {
					authToken: window.localStorage.getItem("X-Auth-Token"),
				};
				dataObj = json.stringify(dataObj);
				var callBack = function (obj) {
					if (obj.response.code === 200 && obj.data) { //data will be true/false based on token(valid/invalid)
						new MainWindow({ id: "mainWindow" });
						view.hide();
					} else {
						//window.localStorage.clear();
						//loginCtrl.clearLocalStorage();
						view.show();
					}
				};
				this.sendRequest("validateToken", dataObj, callBack, "Token validattion Failure", "post", 60000);
			}
		},
		showMainWindow: function (responseData) {
			dom.byId('loginPage_agentId').value = "";
			dom.byId('loginPage_password').value = "";
			if ("groups" in responseData) {
				var groups = {};
				responseData.groups.forEach(function (obj) {
					groups[obj.groupName] = {
						skillLevel: obj.agentLevel,
						businessUnit: obj.businessUnit
					};
				});
				var agent = responseData.loginName;
				window.localStorage.setItem("agent", agent);

				if (responseData.hasOwnProperty("fullName")) {
					window.localStorage.setItem("agentName", responseData.fullName);
				}

				if (responseData.hasOwnProperty("businessUnit")) {
					window.localStorage.setItem("agentBu", responseData.businessUnit);
				}

				if (responseData.hasOwnProperty("userId")) {
					window.localStorage.setItem("agentId", responseData.userId);
				}

				if (responseData.hasOwnProperty("busyStatus")) {
					window.localStorage.setItem("agentStatus", responseData.busyStatus);
				}

				if (responseData.hasOwnProperty("profile")) {
					window.localStorage.setItem("profile", json.stringify(responseData.profile));
				}

				window.localStorage.setItem("groups", json.stringify(groups));
				window.localStorage.setItem("userInfo", json.stringify(responseData));

				if (!dom.byId("mainContainer")) {
					new MainWindow({ id: "mainWindow" });
				}

				var onOK = function () {
					dom.byId("appDiv").style.display = "block";
					registry.byId("appTabContainer").startup();
					registry.byId("appTabContainer").resize();
					view.hide();
				};

				onOK.apply(this);
				animation.show();
				topic.publish("loginSuccessAfterSessionTimeout", {});
			} else {
				new messageWindow({
					message: "Error while getting Agent Information Please report this to " + environment.appName + " Dev Immediately",
					title: "ERROR"
				});
			}

		},
		getOktaInfo: async function () {
			var deferred = new Deferred();
			const token = await authClient.getAccessToken();
			const userInfo = await authClient.token.getUserInfo();

			deferred.resolve({
				token: token,
				email: userInfo.email
			});

			return deferred.promise;
		},
		getSyncAlertMessage: function () {
			var message;
			request.get(environment.syncMessagePath, {
				sync: true,
				handleAs: "json",
				preventCache: true
			}).then(function (response) {
				if (response.message) {
					message = response.message;
				}
			},
				function (error) {
					//Do nothing
					/* new messageWindow({
						 title: "Error",
						 message: "Failure while getting sync message"
					 });
					 */
				}
			);
			return message;
		},
		oktaLogin: function () {
			var widget = this;

			if (!this.checkOktaSupport()) {
				return;
			}


			authClient.isAuthenticated().then(function (response) {

				if (response == false) {

					console.log("Not authenticated!! " + response);
					authClient.signInWithRedirect().then(function (transaction) {
						console.log("Successfully authenticated");
						console.log(transaction);
						// The user has been authenticated
						// Get the user's ID token
						//const idToken = transaction.tokens.idToken;

						// Get the user's access token
						//const accessToken = transaction.tokens.accessToken;


					}).catch(err => {
						new messageWindow({
							message: "Authentication Faild: " + err,
							title: "ERROR"
						});
					});
				} else {
					console.log("Already Authenticated!! Validating ");
					widget.getOktaInfo().then(function (response) {
						var token = response.token;
						var email = response.email;

						widget.handleOktaLogin(token, email, false);
					})
				}

			}, function (fail) {
				console.log("Not authenticated!! " + fail);
			}).catch(err => {
				new messageWindow({
					message: "Authentication Faild: " + err,
					title: "ERROR"
				});
			});;

		},
		checkOktaSupport: function () {
			if (!authClient.features.isPKCESupported()) {
				new messageWindow({
					message: "Okta Authentication requires a modern browser with encryption support running in a secure context (https)!!",
					title: "ERROR"
				});
				return false;
			}
			return true;
		},
		getEventData: function () {
			this.closeSseConnection();
			var callBack = function (message) {

				if (message != null) {
					registry.byId("notification_div").setMessage(message);
				}
			}
			this.sendRequest("getNetworkEvents", null, lang.hitch(this, callBack), "Error while getting Data", "get");
		}


	});

});
