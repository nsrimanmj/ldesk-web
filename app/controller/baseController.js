define(["dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/request",
	"dojo/dom",
	"dojo/dom-style",
	"dojo/topic",
	"dojo/json",
	"dojo/on",
	"dojo/date/locale",
	"dijit/registry",
	"dgrid/OnDemandGrid",
	"dojo/_base/array",
	"dstore/legacy/DstoreAdapter",
	"dstore/Memory",
	"dojo/aspect",
	"dojo/dom-attr",
],
	function (declare, lang, request, dom, domStyle, topic, json, on, locale, registry, OnDemandGrid, arrayUtil, DstoreAdapter, Memory, aspect, domAttr) {
		var logonEventHandle = null;
		var asyncRequests = [];
		var eventSource;
		var retryCnt = 0;

		return declare('baseController', null, {
			constructor: function () {
				var ctrl = this;

				this.groupMap = {
					"A": "LDeskAdmin",
					"P": "Password Admin",
					"I": "Incident",
					"Q": "Inquiry",
					"F": "Finance",
					"E": "Equipment",
					"N": "Network",
					"U": "Queue Admin",
					"C": "Collections"
				};


				this.profile = JSON.parse(window.localStorage.getItem("profile"));
				//console.log(this.profile);
				if (this.profile) {
					this.profileExists = true;
					this.controls = this.profile.controls;
				}
				aspect.after(this, "postCreate", function (evt) {
					ctrl.accessCheck();
					var grids = ctrl.findGrids();
					dojo.forEach(grids, function (grid) {
						if (grid) {
							grid.on("dgrid-refresh-complete", function () {
								ctrl.accessCheck();
							});
						}
					});
				});

				this.agentId = JSON.parse(window.localStorage.getItem("agentId"));
			},
			destroy: function () {
				this.inherited(arguments);

				if (this.handelx) {
					this.handlex.remove();
				}
			},
			sendRequest: function (action, requestPayload, callBack, customErrorMessage, method, timeout) {
				var url = environment.ldeskApiServer + action;
				if (environment.useHostName) {
					// url = location.protocol + '//' + location.host+"/api/v1.0/" + action;
				}
				//url = "http://localhost:8080/api/v1.0/" + action;
				if (method === undefined || method === null) {
					method = "post";
				}
				if (timeout === undefined || timeout === null) {
					timeout = 60000;
				}

				if (logonEventHandle !== null && asyncRequests.length == 0) {
					logonEventHandle.remove();
					logonEventHandle = null;
				}

				var options = {
					headers: {
						'X-Requested-With': null,
						'X-LDesk-Version': window.version,
						'Content-Type': "application/json",
						'X-Auth-Token': window.localStorage.getItem("X-Auth-Token"),
						'X-Session-Id': window.localStorage.getItem("X-Session-Id")
					},
					//withCredentials: true,
					handleAs: "json",
					timeout: timeout,
					method: method,
					preventCache: true
				};

				if (action == "downloadFile") {
					options.handleAs = "blob";
				}
				if (requestPayload instanceof FormData) {
					delete options.headers['Content-Type'];
					options.contentType = false;
					options.processData = false;
					options.data = requestPayload;
				} else if (method !== "get" && method !== "delete") {
					options.data = requestPayload;
				} else {
					if (requestPayload && requestPayload != "") {
						var params = json.parse(requestPayload);
						url += '?';
						for (var key in params) {
							if (params[key]) {
								url += key + "=" + params[key] + "&";
							}
						}
					}
				}

				if (action == "getNetworkEvents") {
					if (window.localStorage.getItem("X-Session-Id") !== undefined && window.localStorage.getItem("X-Session-Id") != null) {
						url += "?sessionId=" + window.localStorage.getItem("X-Session-Id");
					}
					this.startSseConnection(url, lang.hitch(this, callBack));
				} else {
					var promise = request(url, options);
					// the return value could be 'undefined' for POST. And the following
					// checks for both null and undefined. And yes, its a ==, not ===, and
					// its not the same as (promise != null) because that doesn't check for
					// 'undefined'
					if (!(promise == null) && lang.exists("response", promise)) {
						// we are running in a browser or node
						promise = promise.response;
					} else {
						// we are running in phantomjs
					}

					var ctrl = this;
					promise.then(function (response) {
						if (lang.exists("getHeader", response) && lang.isFunction(response.getHeader)) {
							//For validateToken 'X-Auth-Token' will not be returned in Header
							if (response.getHeader("X-Auth-Token") !== undefined && response.getHeader("X-Auth-Token") != null) {
								window.localStorage.setItem("X-Auth-Token", response.getHeader("X-Auth-Token"));
							}
							if (response.getHeader("X-Session-Id") !== undefined && response.getHeader("X-Session-Id") != null) {
								window.localStorage.setItem("X-Session-Id", response.getHeader("X-Session-Id"));
							}
							// As per docs, response must be an object with at least a 'data' field
							// TODO: If dojo provides an assert function, use it here      

							callBack(response.data);
							if (!/get/i.test(method)) {
							}

						} else {
							// Running in phantomjs. Response is a blob and not an object
							callBack(response);
						}
					}, function (error) {
						if (error.response.getHeader("X-Auth-Token") !== undefined && error.response.getHeader("X-Auth-Token") != null) {
							window.localStorage.setItem("X-Auth-Token", error.response.getHeader("X-Auth-Token"));
						}
						if (/^4/.test(error.response.status) || (/^5/.test(error.response.status) && error.response.status != 502)) {
							if (error.response.data.response.code != 1001) {
								var errorObj = error.response.data;
								Object.keys(error.response.data.response).forEach(function (key, index) {
									errorObj[key] = error.response.data.response[key];
								});
								if (!errorObj.message || !errorObj.response.message) {
									errorObj.message = customErrorMessage;
									errorObj.response.message = customErrorMessage;
								}
								callBack(errorObj);
							} else {
								asyncRequests.push({
									action: action,
									requestPayload: requestPayload,
									callBack: callBack,
									customErrorMessage: customErrorMessage,
									method: method,
									timeout: timeout
								});
								if (logonEventHandle == null) {
									logonEventHandle = topic.subscribe("loginSuccessAfterSessionTimeout", function (event) {
										var requestSender = new baseController();
										asyncRequests.forEach(function (req) {
											requestSender.sendRequest(req.action, req.requestPayload, req.callBack, req.customErrorMessage, req.method, req.timeout);
										});
										asyncRequests = [];
									});
								}

								loginDialog.show();
								domStyle.set(dom.byId("loading_icon"), "display", "none");
							}
						} else {
							var errorObj = {
								response: {
									status: "Failure",
									code: error.response.status,
									message: customErrorMessage
								},
								status: "Failure",
								code: error.response.status,
								message: customErrorMessage,
								error: customErrorMessage // This one for web api calls
							};
							if (error.response && error.response.text) {
								errorObj.response.message = error.response.text;
								errorObj.message = error.response.text;
								errorObj.error = error.response.text; //This one for web api calls
							}
							callBack(errorObj);
						}
						// if (!/get/i.test(method)) {
						// 	if (ctrl.addAutoWorklog) {
						// 		ctrl.addAutoWorklog(requestPayload, error.response.data)
						// 	}
						// }
					});
				}
			},
			clearLocalStorage: function () {
				Object.keys(localStorage)
					.forEach(function (key) {
						if (!key.match("_fontsize") && !key.match("_theme") && !key.match("_searches")) {
							localStorage.removeItem(key);
						}
					});
			},
			phoneNumberFormatter: function (value, data) {
				return this.formatPhoneNumber(value);
			},
			formatPhoneNumber: function (phoneNumberString, type) {
				if (type == 'M') {
					return "*" + phoneNumberString + "*";
				}
				var cleaned = ('' + phoneNumberString).replace(/\D/g, '');
				var match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
				if (match) {
					var intlCode = (match[1] ? '+1 ' : '');
					return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('')
				}
				var len = cleaned.length;
				if (len > 10) {
					return cleaned.substring(0, len - 10) + "-" + cleaned.substring(len - 10, len - 7) + "-" + cleaned.substring(len - 7, len - 4) + "-" + cleaned.substring(len - 4, len);
				}

				return phoneNumberString;
			},
			dateFormatter: function (value, data) {
				return this.formatDateStr(value, "MM-DD-YYYY H24:MI:SS");
			},
			formatDateEpoch: function (value, format) {
				var timestamp = value;

				if (value == null) return "";
				if (value == 0) return value;
				var date = new Date(timestamp * 1000);
				return this.formatDate(date, format);
			},
			formatDate: function (date, format) {
				date.toLocaleString('en-US', {
					timeZone: 'America/New_York'
				})

				var year = date.getFullYear();
				var month = date.getMonth() + 1;
				var day = date.getDate();
				var hours = date.getHours();
				var minutes = date.getMinutes();
				var seconds = date.getSeconds();

				if (day < 10) {
					day = '0' + day;
				}
				if (month < 10) {
					month = '0' + month;
				}
				if (hours < 10) {
					hours = '0' + hours;
				}
				if (minutes < 10) {
					minutes = '0' + minutes;
				}
				if (seconds < 10) {
					seconds = '0' + seconds;
				}

				if (format == "YYYY-MM-DD") {
					return year + "-" + month + "-" + day;
				}

				if (format == "YYYY-MM-DD H24:MI:SS") {
					return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
				}

				if (format == "MM/DD/YYYY H24:MI:SS") {
					return month + "/" + day + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
				}

				if (format == "MM-DD-YYYY H24:MI:SS") {
					return month + "-" + day + "-" + year + " " + hours + ":" + minutes + ":" + seconds;
				}

				if (format == "MM-DD-YYYY") {
					return month + "-" + day + "-" + year;
				}

				return month + "/" + day + "/" + year;
			},
			getFormattedDateTime: function (date) {
				if (date == null) {
					return;
				}
				var formattedDateTime = locale.format(date, {
					selector: "datetime",
					datePattern: "yyyy-MM-dd",
					timePattern: "HH:mm:ss"
				});
				console.log(formattedDateTime);
				return this.formatDate(new Date(formattedDateTime), "YYYY-MM-DD H24:MI:SS");
			},
			getFormattedDateTimeInET: function (date, format) {
				date = new Date(date.toLocaleString('en-US', {
					timeZone: 'America/New_York',
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hour12: false
				}));
				//console.log(date);
				//console.log(new Date(date));
				var year = date.getFullYear();
				var month = date.getMonth() + 1;
				var day = date.getDate();
				var hours = date.getHours();
				var minutes = date.getMinutes();
				var seconds = date.getSeconds();

				if (day < 10) {
					day = '0' + day;
				}
				if (month < 10) {
					month = '0' + month;
				}
				if (hours < 10) {
					hours = '0' + hours;
				}
				if (minutes < 10) {
					minutes = '0' + minutes;
				}
				if (seconds < 10) {
					seconds = '0' + seconds;
				}

				if (format == "YYYY-MM-DD") {
					return year + "-" + month + "-" + day;
				}

				if (format == "YYYY-MM-DD H24:MI:SS") {
					return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
				}

				if (format == "MM/DD/YYYY H24:MI:SS") {
					return month + "/" + day + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
				}

				if (format == "MM-DD-YYYY") {
					return month + "-" + day + "-" + year;
				}


				return month + "/" + day + "/" + year;
			},
			formatDateStr: function (value, format) {
				if (value == null) return "";
				if (value == 0) return value;
				var date = new Date(value);
				if (date == null) return "";
				return this.formatDate(date, format);
			},
			formatDateToStr: function (datetimeStr, format) {

				var isoStr = datetimeStr.replace(" ", "T");
				var date = new Date(isoStr);
				var formatted;
				if (format == "MMMM d, yyyy") {
					formatted = locale.format(date, {
						selector: "date",
						datePattern: "MMMM d, yyyy"
					});
				}
				return formatted;
			},
			formatAmount: function (amount) {

				const usdFormatter = new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'USD',
					currencySign: 'accounting', // This will use parentheses for negative values
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				});

				if (amount == null || isNaN(amount)) return usdFormatter.format(0);
				return usdFormatter.format(amount);

				/*
				//amount = dojo.number.parse(amount);
				if (amount == null) {
					return "";
				}
				if (isNaN(amount)) {
					if (typeof amount == 'string' || amount instanceof String) {
						amount = amount.replace("$", "");
					} else {
						amount = 0;
					}
				}
				var amt = parseFloat(amount);
				amt = Math.round(amt * 100) / 100

				if (amt < 0) {
					amt = amt * -1;
					return "($" + amt.toFixed(2) + ")";
				} else {
					return "$" + amt.toFixed(2);
				}
				*/
			},
			formatTotalAmount: function (amount) {
				//amount = dojo.number.parse(amount);
				if (amount == null) {
					return "";
				}
				if (isNaN(amount)) {
					if (typeof amount == 'string' || amount instanceof String) {
						amount = amount.replace("$", "");
					} else {
						amount = 0;
					}
				}
				var amt = parseFloat(amount);
				amt = Math.round(amt * 100) / 100
				return "$" + amt.toFixed(2);

			},
			formatAmountToDouble: function (amountStr) {
				// Parse the string to a float (can handle negative values as well)
				var amount = parseFloat(amountStr);
				return isNaN(amount) ? 0 : amount; // Return 0 if it's not a valid number
			},

			dec2hex: function (dec) {
				return ('0' + dec.toString(16)).substr(-2)
			},
			generatePassword: function () {
				var arr = new Uint8Array(10);
				window.crypto.getRandomValues(arr);
				var password = Array.from(arr, this.dec2hex).join('')
				//console.log(password);
				return password;
			},
			checkAccessList: function (accessList, hideClosed) {
				var show = true;
				var ctrl = this;
				if (hideClosed != false) {
					hideClosed = true;
				}
				var agentGroups = JSON.parse(window.localStorage.getItem("groups"));
				if (accessList) {

					if (accessList == "hide") {
						return false;
					} else {
						return true;
					}
					show = false;
					//console.log(accessList);
					accessList.split(",").forEach(function (access) {
						access.trim();
						var group_x = access.charAt(0);
						var group = this.groupMap[group_x];
						var level = access.charAt(1);
						if (agentGroups.hasOwnProperty(group)) {
							// var isValidAgentGroup = ctrl.getAgentGroup(group);
							// if (isValidAgentGroup) {
							// 	show = true;
							// }
							var agentLevel = ctrl.getAgentGroupLevel(group);
							if (agentLevel >= level) {
								show = true;
							}
						}
					});
				}
				return show;
			},
			accessCheckNode: function (node) {
				if (!node) {
					return;
				}

				if (node.nodeName && node.nodeName == 'FORM') return;

				var action = node.action;
				var recordType = node.recordtype;

				if (!action && node.nodeType == 1) {
					action = node.getAttribute("action");
					recordType = node.getAttribute("recordtype");
				}

				if (action && typeof action === 'string') {
					var show = this.isActionAllowed(action, recordType);
					if (!show) {
						if (node.controlButton) {
							domStyle.set(node.controlButton.domNode, "display", "none");
						} else if (node.nodeType == 1) {
							domStyle.set(node, "display", "none");
						} else if (node.type != 'text') {
							domStyle.set(node.domNode, "display", "none");
						} else {
							node.set("disabled", true);
						}
					}
				}
			},
			isActionAllowed: function (action, recordType) {
				var found = false;
				if (!this.controls) return false;
				if (recordType) {
					found = this.controls.find((item) => item.recordType == recordType && item.actionName == action);
				} else {
					found = this.controls.find((item) => item.actionName == action);
				}

				return found ? true : false;

			},
			accessCheck: function () {
				var ctrl = this;

				//var widgets = this.findNestedWidgets();
				for (property in ctrl) {
					var item = ctrl[property];
					if (!item) {
						continue;
					}
					this.accessCheckNode(item);
				}
				var grids = ctrl.findGrids();
				dojo.forEach(grids, function (grid) {
					if (grid) {
						dojo.query("[widgetid]", grid.domNode)
							.map(dijit.byNode)
							.filter(function (wid) {
								if (wid.action != null) {
									ctrl.accessCheckNode(wid);
								}
							})
					}
				});

			},
			findNestedWidgets: function () {
				return registry.toArray().filter(function (wid) {
					return wid.action != null;
				});
				/*
				return dojo.query("[widgetid]", this.domNode)
					.map(dijit.byNode)
					.filter(function(wid){ 
						console.log(wid);
						return wid.access != null;}) //filter invalid widget ids that yielded undefined
				*/

			},
			findGrids: function () {

				var obj = this;
				var grids = [];
				Object.keys(obj).forEach(function (key) {
					var item = obj[key];
					if (item && item.domNode) {
						var role = domAttr.get(item.domNode, "role");
						if (role == 'grid') {
							grids.push(item);
						}
					}
				});
				return grids;
			},
			getAgentGroup: function (group) {
				var groups = json.parse(window.localStorage.groups);
				var group = groups[group];
				return group ? true : false;
			},
			getAgentGroupLevel: function (group) {
				var groups = json.parse(window.localStorage.groups);
				var group = groups[group];
				return group ? group.skillLevel : 0;
			},
			capitalize: function (s) {
				if (typeof s !== 'string') return '';
				return s.charAt(0).toUpperCase() + s.slice(1);
			},
			dateDiff: function (date1, date2) {
				var d1 = new Date(date1);
				var d2 = new Date(date2);

				if (d1 && d2) {
					var diff = (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
					diff = Math.abs(diff);
					return diff;
				} else {
					return 0;
				}
			},
			viewAccountDetails: function (accountId, ctrl, data) {


				if (registry.byId(accountId + "_contentPane")) {
					registry.byId("appTabContainer").selectChild(accountId + "_contentPane");
					return;
				}

				require(["app/widgets/accountViewDetails", "dijit/layout/ContentPane", "dojo/dom-construct"], function (AccountDetails, ContentPane, domConstruct) {

					var accountContentPane = new ContentPane({
						title: "A-" + accountId,
						id: accountId + "_contentPane",
						closable: "true",
						onClose: function () {
							accountDetails.closeWindow();
						}
					});

					var accountDetails = new AccountDetails({
						'info': data,
						'accountId': accountId,
						'ctrl': ctrl
					});

					accountContentPane.addChild(accountDetails);
					registry.byId("appTabContainer").addChild(accountContentPane);
					registry.byId("appTabContainer").selectChild(accountContentPane);
					registry.byId("appTabContainer").startup();
					accountDetails.init();
				});
			},
			viewReportDetails: function (data, ctrl) {
				var widget = this;
				var reportId = this.formatId(data.id);
				var divId = "report_contentPane_" + data.id;

				if (registry.byId(divId)) {
					registry.byId("appTabContainer").selectChild(divId);
					return;
				}

				require(["app/widgets/viewReport", "dijit/layout/ContentPane", "dojo/dom-construct"], function (ViewReport, ContentPane, domConstruct) {

					var reportContentPane = new ContentPane({
						title: "R-" + widget.formatId(reportId),
						id: divId,
						style: "overflow-y: auto",
						closable: "true",
						onClose: function () {
							reportView.closeWindow();
						}
					});

					var reportView = new ViewReport({
						'ctrl': ctrl,
						'info': data
					});
					reportContentPane.addChild(reportView);
					registry.byId("appTabContainer").addChild(reportContentPane);
					registry.byId("appTabContainer").selectChild(reportContentPane);
					registry.byId("appTabContainer").startup();
				});
			},
			viewReportEmail: function (data, ctrl) {
				var widget = this;
				var reportId = this.formatId(data.id);
				var divId = "report_email_" + data.id;

				if (registry.byId(divId)) {
					registry.byId("appTabContainer").selectChild(divId);
					return;
				}

				require(["app/widgets/reportEmail", "dijit/layout/ContentPane", "dojo/dom-construct"], function (ReportEmail, ContentPane, domConstruct) {

					var reportContentPane = new ContentPane({
						title: "RE-" + widget.formatId(reportId),
						id: divId,
						style: "overflow-y: auto",
						closable: "true",
						onClose: function () {
							reportView.closeWindow();
						}
					});

					var reportView = new ReportEmail({
						'ctrl': ctrl,
						'info': data
					});
					reportContentPane.addChild(reportView);
					registry.byId("appTabContainer").addChild(reportContentPane);
					registry.byId("appTabContainer").selectChild(reportContentPane);
					registry.byId("appTabContainer").startup();
				});
			},
			viewDashboardEmail: function (data, ctrl) {
				var widget = this;
				var reportId = this.formatId(data.id);
				var divId = "dashboard_email_" + data.id;

				if (registry.byId(divId)) {
					registry.byId("appTabContainer").selectChild(divId);
					return;
				}

				require(["app/widgets/dashboardEmail", "dijit/layout/ContentPane", "dojo/dom-construct"], function (DashboardEmail, ContentPane, domConstruct) {

					var dashContentPane = new ContentPane({
						title: "DE-" + widget.formatId(reportId),
						id: divId,
						style: "overflow-y: auto",
						closable: "true",
						onClose: function () {
							dashView.closeWindow();
						}
					});

					var dashView = new DashboardEmail({
						'ctrl': ctrl,
						'info': data
					});
					dashContentPane.addChild(dashView);
					registry.byId("appTabContainer").addChild(dashContentPane);
					registry.byId("appTabContainer").selectChild(dashContentPane);
					registry.byId("appTabContainer").startup();
				});
			},
			viewDashboardDetails: function (data, ctrl) {
				var widget = this;
				var dbId = this.formatId(data.id);

				if (registry.byId("dashboard_contentPane_" + data.id)) {
					registry.byId("appTabContainer").selectChild("dashboard_contentPane_" + data.id);
					return;
				}

				require(["app/widgets/viewDashboard", "dijit/layout/ContentPane"], function (ViewDashboard, ContentPane) {

					var reportContentPane = new ContentPane({
						title: "D-" + widget.formatId(dbId),
						id: "dashboard_contentPane_" + data.id,
						style: "overflow-y: auto",
						closable: "true",
						onClose: function () {
							reportView.handleOnClose();
						}
					});

					var reportView = new ViewDashboard({
						'ctrl': ctrl,
						'info': data
					});
					reportContentPane.addChild(reportView);
					registry.byId("appTabContainer").addChild(reportContentPane);
					registry.byId("appTabContainer").selectChild(reportContentPane);
					registry.byId("appTabContainer").startup();
				});
			},
			viewCaseDetails: function (caseId, ctrl, data) {
				var widget = this;
				var existingTab = registry.byId("case_contentPane_" + caseId);

				if (existingTab) {
					registry.byId("appTabContainer").selectChild(existingTab);

					// Try to refresh case view if it exists
					var caseView = existingTab.getChildren()[0]; // assumes only 1 child
					if (caseView && typeof caseView.refreshDetails === "function") {
						caseView.refreshDetails(data); // reapply latest data
					}

					return;
				}

				require(["app/widgets/viewCase", "dijit/layout/ContentPane", "dojo/dom-construct"], function (ViewCase, ContentPane, domConstruct) {
					var caseContentPane = new ContentPane({
						title: "C-" + widget.formatCaseNumber(caseId),
						id: "case_contentPane_" + caseId,
						closable: true,
						onClose: function () {
							caseView.handleOnClose();
						}
					});

					var caseView = new ViewCase({
						'lingoController': ctrl,
						'info': data
					});

					caseContentPane.addChild(caseView);
					registry.byId("appTabContainer").addChild(caseContentPane);
					registry.byId("appTabContainer").selectChild(caseContentPane);
					registry.byId("appTabContainer").startup();
					caseView.init();
				});
			},

			viewWODetails: function (woId, ctrl, data) {
				var widget = this;
				if (registry.byId("wo_contentPane_" + woId)) {
					registry.byId("appTabContainer").selectChild("wo_contentPane_" + woId);
					return;
				}

				require(["app/widgets/viewWorkOrder", "dijit/layout/ContentPane", "dojo/dom-construct"], function (ViewWorkOrder, ContentPane, domConstruct) {
					var woContentPane = new ContentPane({
						title: woId,
						id: "wo_contentPane_" + woId,
						closable: "true",
						onClose: function () {
							woView.handleOnClose();
						}
					});

					var woView = new ViewWorkOrder({
						'lingoController': ctrl,
						'info': data,
					});

					var caseId = widget.formatCaseNumber(data.caseId);
					var tc = registry.byId("appTabContainer");
					var caseTabId = "case_contentPane_" + caseId;
					var children = tc.getChildren();
					var position = null;
					children.forEach(function (tab, index) {
						if (tab.id == caseTabId) {
							position = index + 1;
						}
					})

					woContentPane.addChild(woView);
					registry.byId("appTabContainer").addChild(woContentPane, position);
					registry.byId("appTabContainer").selectChild(woContentPane);
					registry.byId("appTabContainer").startup();
					woView.init();
				});
			},
			viewUserDetails: function (userId, ctrl) {
				var widget = this;
				if (registry.byId("user_contentPane_" + userId)) {
					registry.byId("appTabContainer").selectChild("user_contentPane_" + userId);
					return;
				}

				require(["app/widgets/userDetails", "dijit/layout/ContentPane", "dojo/dom-construct"], function (UserDetails, ContentPane, domConstruct) {

					var id = String(userId).padStart(4, '0');

					var userContentPane = new ContentPane({
						title: "User-" + id,
						id: "user_contentPane_" + userId,
						closable: "true",
						onClose: function () {
							userView.handleOnClose();
						}
					});

					var tc = registry.byId("appTabContainer");
					var children = tc.getChildren();
					var tabId = "controlPanelContentPane";
					children.forEach(function (tab, index) {
						if (tab.selected) {
							tabId = tab.id;
						}
					})

					var userView = new UserDetails({
						'lingoController': ctrl,
						"userId": userId,
						"tab": tabId
					});

					userContentPane.addChild(userView);
					registry.byId("appTabContainer").addChild(userContentPane);
					registry.byId("appTabContainer").selectChild(userContentPane);
					registry.byId("appTabContainer").startup();
					userView.init();
				});
			},
			viewTaskDetails: function (taskId, ctrl, data) {
				var widget = this;
				if (registry.byId("task_contentPane_" + taskId)) {
					registry.byId("appTabContainer").selectChild("task_contentPane_" + taskId);
					return;
				}

				require(["app/widgets/viewTask", "dijit/layout/ContentPane", "dojo/dom-construct"], function (ViewTask, ContentPane, domConstruct) {
					var taskContentPane = new ContentPane({
						title: taskId,
						id: "task_contentPane_" + taskId,
						closable: "true",
						onClose: function () {
							taskView.handleOnClose();
						}
					});

					var taskView = new ViewTask({
						'lingoController': ctrl,
						'info': data,
					});

					var caseId = widget.formatCaseNumber(data.caseId);
					var tc = registry.byId("appTabContainer");
					var caseTabId = "case_contentPane_" + caseId;
					var children = tc.getChildren();
					var position = null;
					children.forEach(function (tab, index) {
						if (tab.id == caseTabId) {
							position = index + 1;
						}
					})

					taskContentPane.addChild(taskView);
					registry.byId("appTabContainer").addChild(taskContentPane, position);
					registry.byId("appTabContainer").selectChild(taskContentPane);
					registry.byId("appTabContainer").startup();
					taskView.init();
				});
			},
			formatCaseNumber: function (value, data) {
				return String(value).padStart(8, '0');
			},
			formatId: function (value, data) {
				return String(value).padStart(8, '0');
			},
			disableWidgets: function (domNode) {
				var widgets = registry.findWidgets(domNode);
				dojo.forEach(widgets, function (item, index) {
					item.set("disabled", true);
				});
			},
			enableWidgets: function (domNode) {
				var widgets = registry.findWidgets(domNode);
				dojo.forEach(widgets, function (item, index) {
					item.set("disabled", false);
				});
			},
			setWidgetValues: function (data, domNode) {
				var widgets = registry.findWidgets(domNode);

				dojo.forEach(widgets, function (item, index) {
					var attachPoint = item.dojoAttachPoint;
					item.set("value", data[attachPoint]);
				});
			},
			getWidgetvalues: function (data, domNode) {
				var widgets = registry.findWidgets(domNode);
				var widget = this;

				dojo.forEach(widgets, function (item, index) {
					var attachPoint = item.dojoAttachPoint;
					var val = item.get("value");
					if (val != "" && val != null && (attachPoint != "followUpDate" && attachPoint != "createdFrom" && attachPoint != "createdTo" && attachPoint != "closedFrom" && attachPoint != "closedTo"
						&& attachPoint != "denyDate" && attachPoint != "lastPaymentDate" && attachPoint != "disconnectDate" && attachPoint != "promiseToPayDate" && attachPoint != "finalDemandDate"
					))
						data[attachPoint] = item.get("value").trim();
					// else if (attachPoint == "followUpDate" && item.get("displayedValue"))
					// 	data[attachPoint] = widget.formatDate(new Date(item.get("displayedValue")), "YYYY-MM-DD H24:MI:SS");
					else if (val != "" && val != null)
						data[attachPoint] = item.get("value");
				});
			},
			getAgentLevelForGroup: function (group) {
				var widget = this;
				var agentGroups = JSON.parse(window.localStorage.getItem("groups"));

				if (agentGroups[group]) {
					return agentGroups[group].skillLevel;
				}
				return null;
			},
			checkReportPermission: function (report, type) {
				var agentId = this.agentId;
				var agent = window.localStorage.getItem("agent");
				var agentGroups = JSON.parse(window.localStorage.getItem("groups"));

				if (agent == 'report') {
					return true;
				}

				var action = "dashboard-view";
				if (type == "report") {
					action = "reports-view";
				}

				if (!this.isActionAllowed(action)) {
					return false;
				}

				var group = report.folderGroup;

				if (group == 'Public') {
					return true;
				}

				if (group == 'Private' && report.createdBy == agentId) {
					return true;
				}

				if (agentGroups.hasOwnProperty(group)) {
					return true;
				}

				return false;
			},
			setServiceStore: function (response, groupName) {
				var widget = this;
				var tmpArry = [];
				var responseData = [];
				var serviceStore = new DstoreAdapter(new Memory({
					idProperty: 'name',
					data: []
				}));
				if (response == null || response.length == 0) {
					tmpArry.push({
						'label': '0',
						'name': '0',
						'id': '0',
						'srvAddress': '0',
						'billingType': '0',
						'address': '0',
						'city': '0',
						'state': '0',
						'country': '0',
						'zipCode': '0'
					});
					serviceStore.store.setData(tmpArry);
					return serviceStore;
				}
				if (groupName === "Incident") {
					responseData = arrayUtil.filter(response, function (item) {
						return item.status !== "Inactive";
					});
				}
				else {
					responseData = response;
				}

				arrayUtil.forEach(responseData, function (item) {
					tmpArry.push({
						'label': item.serviceNo,
						'name': item.serviceNo,
						'id': item.srvId,
						'srvAddress': item.srvAddress,
						'billingType': item.billingType,
						'address': item.address,
						'city': item.city,
						'state': item.state,
						'country': item.country,
						'zipCode': item.zipCode
					});

				});
				tmpArry.sort((a, b) => {
					if (a.label < b.label) return -1;
					if (a.label > b.label) return 1;
					return 0;
				});
				serviceStore.store.setData(tmpArry);
				return serviceStore;

			},
			startSseConnection: function (url, callBack) {
				// Open the connection to the SSE endpoint
				if (eventSource)
					eventSource.close();

				eventSource = new EventSource(url);

				eventSource.onopen = function () {
					retryCnt = 0;
					console.log("SSE connection established.");
				};

				eventSource.addEventListener('NewNetworkEvent', function (event) {
					callBack(event.data);
				});

				eventSource.addEventListener('heartbeat', function (event) {

				});

				eventSource.onerror = function (event) {
					console.error("SSE connection error:", event);
					// If the connection is lost or encounters an error, attempt to reconnect
					eventSource.close(); // Close the current connection

					if (retryCnt <= 3) {
						retryCnt++;
						setTimeout(this.startSseConnection, 5000); // Attempt to reconnect after the specified interval
					}
				};
			},
			updateFieldVisibility: function (type, container) {
				var widget = this;
				var tableContainer = container;
				var children = tableContainer.getChildren();
				children.forEach(function (child) {
					if (child.allowedtypes) {
						var fieldTypes = child.allowedtypes.split(",");
						var fieldValues = fieldTypes.map(function (x) {
							return widget.groupMap[x];
						});
						if (!fieldValues.includes(type)) {
							tableContainer.removeChild(child);
						}
					}
				});
				tableContainer.startup();
				tableContainer.resize();
			},
			closeSseConnection() {
				if (eventSource)
					eventSource.close();
			}

		});
	});
