define(["dojo/_base/declare",
	"dojo/json",
	"app/view/messageWindow",
	"dojo/dom",
	"dojo/dom-style",
	"dojo/_base/lang",
	"app/widgets/loaderAnimation",
	"app/widgets/theme",
	"dojo/store/Memory",
	"dojo/date/locale",
	"dojo/_base/array",
	"dijit/registry",
	"dojo/dom-construct",
	"app/model/Agents",
	"dojo/topic",
	"dijit/Dialog"
], function (declare, json, messageWindow, dom, domStyle, lang, Animation, Theme, Memory, locale, arrayUtil, registry, domConstruct, AgentStore, topic, Dialog) {

	var animation = new Animation('loading_icon');

	return declare("LingoController", [baseController], {
		constructor: function (info) {
			lang.mixin(this, info);
			var ctrl = this;

			ctrl.availableGroups = [];
			ctrl.availableQueues = [];
			ctrl.searchedAccData = {};
			ctrl.categoryList = null;
			ctrl.resolutionInfo = null;
			ctrl.networkEventsInfo = null;
			ctrl.dispatchTypeInfo = null;
			ctrl.woChargeTypes = [];

			ctrl.providerStore = new Memory({
				idProperty: "provider",
				data: []
			});

			ctrl.agentStore = new AgentStore();
			ctrl.getAllGroups();
			ctrl.getAllCategories();
			ctrl.getResolutionInfo();
			ctrl.getProviderInfo();
			ctrl.getAllAgents();
			ctrl.getAllQueues();
			ctrl.getNetworkEvents();
			ctrl.getAllDispatchTypes();
			ctrl.getWOChargeTypes();
			ctrl.getEventData();

			ctrl.mail_parse = dnp.mail_parse;
		},
		removeItem: function (list, key, value) {
			var found = false;
			list.forEach(function (element, index) {
				if (found == true) {
					return;
				}
				if (element[key] == value) {
					list.splice(index, 1);
					found = true;
				}


			});
		},

		getDate: function () {
			var date = locale.format(new Date(), {
				selector: "date",
				formatLength: "short",
				datePattern: "MM-dd-yyyy hh:mm:ss"
			});
			return date;
		},

		getAvailableGroups: function () {
			var ctrl = this;
			var requestObj = {
				"status": encodeURIComponent("Active")
			};

			requestObj = JSON.stringify(requestObj);
			var callBack = function (obj) {
				animation.hide();
				if (obj.response.code == "200") {
					ctrl.availableGroups = obj.data;
				} else {
					new messageWindow({
						message: obj.response.message,
						title: "Error"
					});
				}
			};
			animation.show();
			this.sendRequest("admin/group", requestObj, callBack, "Error while getting Data", "get");
		},
		getAgentStore: function () {
			return this.agentStore;
		},
		getAllAgents: function () {
			var ctrl = this;

			var callBack = function (obj) {
				animation.hide();
				if (obj.response.code == "200") {
					obj.data.sort(function (a, b) {
						return a.fullName.localeCompare(b.fullName);
					});
					ctrl.agentStore.setData(obj.data);
					topic.publish("lingoController/agentListLoaded", obj.data);
				}
			};
			animation.show();
			this.sendRequest("searchUsers", null, callBack, "Error while getting Data", "get");
		},
		getUsers: function (info, callback) {
			var ctrl = this;
			var requestObj = {};

			if (info.loginName)
				requestObj.loginName = info.loginName;

			if (info.groupID) {
				requestObj.groupId = info.groupID;
			}

			if (info.activeOnly) {
				requestObj.activeOnly = info.activeOnly;
			}

			requestObj = JSON.stringify(requestObj);
			var callBack = function (obj) {
				animation.hide();
				if (obj.response.code == "200") {
					callback(obj.data);
					/*topic.publish("lingoController/loadUserlist", obj.data);  
				  if(callback){
				    
					callback(obj.data);  
				  }*/
				} else {
					new messageWindow({
						message: obj.response.message,
						title: "Error"
					});
				}
			};
			animation.show();
			this.sendRequest("admin/user", requestObj, callBack, "Error while getting Data", "get");
		},
		addUser: function (info, callback) {
			var ctrl = this;
			var requestObj = lang.clone(info);

			requestObj = JSON.stringify(requestObj);
			var callBack = function (obj) {
				animation.hide();
				if (obj.response.code == "200") {
					topic.publish("lingoController/addUser", info);
					callback();
				} else {
					new messageWindow({
						message: obj.response.message,
						title: "Error"
					});
				}
			};
			animation.show();
			this.sendRequest("admin/user", requestObj, callBack, "Error while getting Data", "post");
		},
		updateUser: function (info, callback) {
			var ctrl = this;
			var requestObj = {
				"loginName": info.loginName,
				"fullName": info.fullName,
				"office": info.office,
				"emailAddress": info.emailAddress,
				"phoneExtension": info.phoneExtension,
				"shiftGroup": info.shiftGroup,
				"fnUserId": info.fnUserId,
				"tcUserId": info.tcUserId,
				"businessUnit": info.businessUnit,
				"profileId": info.profileId
			};

			requestObj = JSON.stringify(requestObj);

			var callBack = function (obj) {
				animation.hide();
				if (obj.response.code == "200") {
					callback();
					topic.publish("lingoController/EditUser", info);
					topic.publish("lingoController/userChangeHistory", requestObj);
					new messageWindow({
						title: "NOTE",
						message: "Success"
					});
				} else {
					new messageWindow({
						title: "ERROR",
						message: obj.response.message
					});
				}
			};
			animation.show();
			this.sendRequest("admin/user/account", requestObj, callBack, "Error while getting Data", "put");
		},
		deleteUser: function (userName, status, callback) {
			var ctrl = this;
			var requestObj = {
				"userName": userName,
				"status": status
			};

			requestObj = JSON.stringify(requestObj);
			var callBack = function (obj) {
				animation.hide();
				if (obj.response.code == "200") {
					callback();
				} else {
					new messageWindow({
						message: obj.response.message,
						title: "Error"
					});
				}
			};
			animation.show();
			this.sendRequest("admin/user", requestObj, callBack, "Error while getting Data", "delete");
		},
		resetPassword: function (info, callback) {
			var ctrl = this;
			var requestObj = {
				"loginName": info.userName,
				"newPassword": info.password
			};

			requestObj = JSON.stringify(requestObj);

			var callBack = function (obj) {
				animation.hide();
				if (obj.response.code == "200") {
					callback();
					new messageWindow({
						title: "NOTE",
						message: "Success"
					});
				} else {
					new messageWindow({
						title: "ERROR",
						message: obj.response.message
					});
				}
			};
			animation.show();
			this.sendRequest("admin/password", requestObj, callBack, "Error while getting Data", "put");
		},
		addGroup: function (info, callback) {
			var ctrl = this;
			var callBack = function (obj) {
				if (obj.response.code == "200") {
					callback();
					new messageWindow({
						title: "NOTE",
						message: "Success"
					});
				}
			};
			this.putAPI("admin/user/group", info, callBack);
		},
		updateGroup: function (info, callback) {
			var ctrl = this;

			var callBack = function (obj) {
				if (obj.response.code == "200") {
					if (callback) {
						callback(obj);
					}
					topic.publish("lingoController/updateGroup", info);
					new messageWindow({
						title: "NOTE",
						message: "Success"
					});
				}
			};

			this.putAPI("admin/user/group", info, callBack);
		},
		removeGroup: function (info, callback) {
			var ctrl = this;
			var callBack = function (obj) {
				if (obj.response.code == "200") {
					if (callback) {
						callback();
					}
					new messageWindow({
						title: "NOTE",
						message: "Successfully removed the group"
					});
				} else {
					new messageWindow({
						title: "NOTE",
						message: obj.response.message
					});
				}
			};

			this.putAPI("admin/user/group", info, callBack);
		},

		createCategory: function (info, callback) {
			var ctrl = this;
			var callBack = function (obj) {
				ctrl.showSuccessMessage(obj);
				if (callback) {
					callback(obj);
				}
			};
			this.postAPI("admin/category", info, callBack);
		},
		searchCategory: function (info, callback) {
			this.getAPI("admin/category", info, callback);
		},
		updateCategory: function (info, callback) {
			var ctrl = this;
			var callBack = function (obj) {
				ctrl.showSuccessMessage(obj);
				if (callback) {
					callback(obj);
				}
			}
			animation.show();
			this.putAPI("admin/category", info, callBack);
		},
		getAllGroups: function () {
			var ctrl = this;
			var callBack = function (obj) {
				if (obj.response.code == "200") {
					topic.publish("lingoController/loadGrouplist", obj.data);
					ctrl.availableGroups = arrayUtil.filter(obj.data, function (item) {
						return item.status == "Active";
					});
				}
			};
			this.getAPI("getAllGroups", null, callBack, false);
		},
		getAllCategories: function () {
			var ctrl = this;
			var requestObj = {
				"status": "Active"
			};
			var callBack = function (obj) {
				animation.hide();
				if (obj.response.code == "200") {
					ctrl.categoryList = obj.data;
				}
			};
			this.getAPI("category", requestObj, callBack, false);
		},
		getCategoryId: function (group, category, type, subType) {
			var ctrl = this;

			if (!group) {
				group = undefined;
			}

			if (!category) {
				category = undefined;
			}

			if (!type) {
				type = undefined;
			}
			if (!subType) {
				subType = undefined;
			}

			var dataStore = new Memory({
				'idProperty': 'categoryId',
				'data': ctrl.categoryList
			});
			var filter = dataStore.query({
				'groupName': group,
				'categoryName': category,
				'type': type,
				'subType': subType
			});

			return filter[0].categoryId;
		},

		getProviderInfo: function () {
			var ctrl = this;
			var callBack = function (obj) {
				if (obj.response.code == "200") {
					ctrl.providerStore.setData(obj.data);
				}
			};
			this.getAPI("getAllProviders", null, callBack);
		},

		getProviderStore: function () {
			var ctrl = this;
			var data = this.providerStore.data;
			dojo.forEach(data, function (item) {
				item.name = item.provider;
			});
			this.providerStore.setData(data);
			return this.providerStore;
		},

		getCategoryStore: function (group) {
			var ctrl = this;
			var categoryStore = new Memory({
				idProperty: "categoryName",
				data: []
			});
			categoryStore.data = [];
			if (!group) {
				group = undefined;
			}
			var dataStore = new Memory({
				'idProperty': 'categoryName',
				'data': ctrl.categoryList
			});
			var filter = dataStore.query({
				'groupName': group
			});
			var tmpArry = [];
			var data = [];
			dojo.forEach(filter, function (item) {

				if (tmpArry.indexOf(item.categoryName) == -1) {
					tmpArry.push(item.categoryName);
					data.push({
						'categoryName': item.categoryName,
						'name': item.categoryName,
						'id': item.categoryName
					});
				}
			});
			data.sort(function (a, b) {
				return a.categoryName.localeCompare(b.categoryName);
			});
			categoryStore.setData(data);
			return categoryStore;
		},
		getTypeStore: function (category) {
			var ctrl = this;
			var typeStore = new Memory({
				idProperty: "type",
				data: []
			});
			typeStore.data = [];

			if (!category) {
				category = undefined;
			}

			var dataStore = new Memory({
				'idProperty': 'type',
				'data': ctrl.categoryList
			});
			var filter = dataStore.query({
				'categoryName': category
			});
			var tmpArry = [];
			var data = [];
			dojo.forEach(filter, function (item) {
				if (item.type && tmpArry.indexOf(item.type) == -1) {
					tmpArry.push(item.type);
					data.push({
						'type': item.type,
						'name': item.type,
						'id': item.type
					});
				}
			});
			typeStore.setData(data);
			return typeStore;
		},

		getSubTypeStore: function (category, type) {
			var ctrl = this;
			var subTypeStore = new Memory({
				idProperty: "subType",
				data: []
			});

			subTypeStore.data = [];

			if (!category) {
				category = undefined;
			}

			if (!type) {
				type = undefined;
			}

			var dataStore = new Memory({
				'idProperty': 'subType',
				'data': ctrl.categoryList
			});
			var filter = dataStore.query({
				'categoryName': category,
				'type': type
			});
			var tmpArry = [];
			var data = [];
			dojo.forEach(filter, function (item) {
				//console.log(item);
				if (item.subType && tmpArry.indexOf(item.subType) == -1) {
					tmpArry.push(item.subType);
					data.push({
						'subType': item.subType,
						'name': item.subType,
						'id': item.subType
					});
				}
			});
			subTypeStore.setData(data);
			return subTypeStore;
		},

		getResolutionTier1Store: function () {
			var ctrl = this;
			var resolutionStore1 = new Memory({
				idProperty: "resolutionTier1",
				data: []
			});
			var tmpArry = [];
			var data = [];
			dojo.forEach(ctrl.resolutionInfo, function (item) {
				if (tmpArry.indexOf(item.resolutionTier1) == -1) {
					tmpArry.push(item.resolutionTier1);
					data.push({
						'resolutionTier1': item.resolutionTier1,
						'id': item.resolutionTier1,
						'name': item.resolutionTier1
					});
				}
			});

			resolutionStore1.setData(data);
			return resolutionStore1;

		},

		getResolutionTier2Store: function (resolutionTier1) {
			var ctrl = this;
			var resolutionStore2 = new Memory({
				idProperty: "resolutionTier2",
				data: []
			});
			resolutionStore2.data = [];
			var filter = ctrl.resolutionInfo;
			var store = new Memory({ 'idProperty': 'resolutionTier2', 'data': ctrl.resolutionInfo });
			filter = store.query({ "resolutionTier1": resolutionTier1 });
			var tmpArry = [];
			var data = [];
			dojo.forEach(filter, function (item) {
				if (tmpArry.indexOf(item.resolutionTier2) == -1) {
					tmpArry.push(item.resolutionTier2);

					data.push({
						'resolutionTier2': item.resolutionTier2,
						'id': item.resolutionTier2,
						'name': item.resolutionTier2

					});

				}
			});

			resolutionStore2.setData(data);
			return resolutionStore2;

		},

		getResolutionTier3Store: function (resolutionTier1, resolutionTier2) {
			var ctrl = this;
			var resolutionStore3 = new Memory({
				idProperty: "resolutionTier3",
				data: []
			});
			resolutionStore3.data = [];
			var filter = ctrl.resolutionInfo;
			var store = new Memory({ 'idProperty': 'resolutionTier3', 'data': ctrl.resolutionInfo });
			filter = store.query({ "resolutionTier1": resolutionTier1, "resolutionTier2": resolutionTier2 });
			var tmpArry = [];
			var data = [];
			dojo.forEach(filter, function (item) {
				if (tmpArry.indexOf(item.resolutionTier3) == -1) {
					tmpArry.push(item.resolutionTier3);
					data.push({
						'resolutionTier3': item.resolutionTier3,
						'id': item.resolutionTier3,
						'name': item.resolutionTier3

					});

				}
			});

			resolutionStore3.setData(data);
			return resolutionStore3;
		},


		getServiceDetails: function (appId, callback) {

			var requestObj = {
				"accountId": appId
			};
			this.getAPI("getAllServices", requestObj, callback, true, false);
		},
		getContactDetails: function (appId, callback) {
			var requestObj = {
				"accountId": appId
			};
			this.getAPI("getAllContacts", requestObj, callback, true, false);
		},
		createGroup: function (info, callback) {
			var ctrl = this;
			var callBack = function (obj) {
				if (obj.response.code == 200) {

					var call2 = function (obj2) {
						if (obj2.response.code == "200")
							topic.publish("lingoController/groupCreated", obj2.data);
					}

					ctrl.getAPI("getAllGroups", null, call2, false);
				}

				if (callback) {
					callback(obj);
				}
			}
			this.postAPI("admin/group", info, callBack, true, true);
		},

		searchGroup: function (info, callback) {
			this.getAPI("admin/group", info, callback);
		},
		// getNetworkEvents: function (callback) {
		// 	this.getAPI("getNetworkCases", null, callback);
		// },
		updateAdminGroup: function (info, callback) {
			var ctrl = this;
			var callBack = function (obj) {
				if (obj.response.code == 200) {

					var call2 = function (obj2) {
						if (obj2.response.code == "200")
							topic.publish("lingoController/groupUpdated", obj2.data);
					}

					ctrl.getAPI("getAllGroups", null, call2, false);
				}

				if (callback) {
					callback(obj);
				}
			}
			this.putAPI("admin/group", info, callBack, true, true);
		},
		createCase: function (info, callback) {
			var ctrl = this;
			var callBack = function (obj) {
				if (obj.response.code == "200") {
					topic.publish("lingoController/caseCreated", obj.data);
					var call2 = function (obj2) {
						if (obj2.response.code == "200")
							ctrl.viewCaseDetails(ctrl.formatCaseNumber(obj2.data.caseId), ctrl, obj2.data);
					}
					ctrl.getCaseDetails(obj.data.caseId, call2);

					new messageWindow({
						title: "SUCCESS",
						message: obj.response.message + ". Type - " + obj.data.groupName + " caseId - " + obj.data.caseId
					});
				}
				if (callback) {
					callback(obj);
				}
			}
			this.postAPI("case", info, callBack);
		},
		updateCase: function (info, callback) {
			var ctrl = this;
			var callBack = function (obj) {

				if (obj.response.code == 200) {
					topic.publish("lingoController/caseUpdated", obj);
					if (info.groupName == "Network") {
						topic.publish("lingoController/netWorkEventUpdated", obj);
					}
					var call2 = function (obj2) {
						if (obj2.response.code == "200")
							topic.publish("lingoController/caseUpdated-" + info.caseId, obj2);
					}
					ctrl.getCaseDetails(info.caseId, call2);
				}
				if (callback) {
					callback(obj);
				}
			}
			this.putAPI("case", info, callBack);
		},
		updateWorkOrder: function (info, callback) {
			var ctrl = this;
			var callBack = function (obj) {

				if (obj.response.code == 200) {
					topic.publish("lingoController/woUpdated", obj);
					topic.publish("lingoController/woUpdated-" + info.id, obj);
					// var call2 = function (obj2) {
					// 	if (obj2.response.code == "200")
					// 		topic.publish("lingoController/woUpdated-" + info.id, obj2);
					// }
					// ctrl.getWorkOrderDetails(info.id, call2);
				}
				if (callback) {
					callback(obj);
				}
			}
			this.putAPI("updateWorkOrder", info, callBack);
		},
		doLogout: function () {
			var dataObj = {};
			dataObj = json.stringify(dataObj);
			var callBack = function (data) {
				this.clearLocalStorage();
				registry.byId("mainContainer").destroyRecursive();
				var theme = new Theme();
				theme.applyTheme('main', 'Default');
				registry.byId("themeDialog").destroyRecursive();
				//domConstruct.destroy("mainContainer");
				dom.byId('loginPage_agentId').value = "";
				dom.byId('loginPage_password').value = "";

				/*global loginDialog*/
				loginDialog.show();

				if (data.response.code === 200) {
					console.log("Logout SUccess");
				} else {
					console.log("ERROR: " + data.response.message)
				}
				this.closeSseConnection();
				domStyle.set(dom.byId("loading_icon"), "display", "none");
			};
			domStyle.set(dom.byId("loading_icon"), "display", "block");
			this.sendRequest("logout", dataObj, lang.hitch(this, callBack), "Failure while logging out Please report to LDesk - Dev", "get", 60000);
		},
		searchAccount: function (searchKey, searchValue, regExpFlag, activeOnlyFlag, callback) {
			var ctrl = this;
			var requestObj = {
				"searchKey": searchKey,
				"searchValue": ctrl.encodeSearchValue(searchValue),
				"regExpFlag": regExpFlag,
				"activeOnlyFlag": activeOnlyFlag
			};
			this.getAPI("search", requestObj, callback);
		},

		encodeSearchValue: function (text) {
			var ctrl = this;
			return text
				.replace(/&/g, "%26")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#039;");
		},


		searchCases: function (info, callback, showAnimation = true, showAlert = true) {
			this.getAPI("searchCases", info, callback, showAnimation, showAlert);
		},
		getAPI: function (api, request, callback, showAnimation = true, showAlert = true) {
			this.callAPI(api, request, callback, showAnimation, showAlert, "get");
		},
		postAPI: function (api, request, callback, showAnimation = true, showAlert = true) {
			this.callAPI(api, request, callback, showAnimation, showAlert, "post");
		},
		putAPI: function (api, request, callback, showAnimation = true, showAlert = true) {
			this.callAPI(api, request, callback, showAnimation, showAlert, "put");
		},
		deleteAPI: function (api, request, callback, showAnimation = true, showAlert = true) {
			this.callAPI(api, request, callback, showAnimation, showAlert, "delete");
		},
		callAPI: function (api, request, callback, showAnimation = true, showAlert = true, method = "get") {
			var ctrl = this;
			var requestObj = lang.clone(request);
			requestObj = JSON.stringify(requestObj);

			var callBack = function (obj) {
				animation.hide();
				if (obj.response.code == "200") {
					if (obj.data == null) {
						obj.data = [];
					}
					if (callback) {
						callback(obj);
					}
				} else {
					if (showAlert) {
						new messageWindow({
							message: obj.response.message,
							title: "Error"
						});
					}
				}
			};
			if (showAnimation) {
				animation.show();
			}

			this.sendRequest(api, requestObj, callBack, "Error while getting Data", method);
		},
		showSuccessMessage: function (obj) {
			if (obj.response.code == "200") {
				new messageWindow({
					title: "SUCCESS",
					message: obj.response.message
				});
			}
		},
		sendEmail: function (info, callback) {
			var callBack = function (obj) {
				if (obj.response.code == "200") {
					new messageWindow({
						message: "Email queued Sucessfully!!",
						title: "Success"
					});
					if (callback) {
						callback(obj);
					}
				} else {
					new messageWindow({
						message: obj.response.message,
						title: "Error"
					});
				}
			};

			this.postAPI("sendMUAEmail", info, callBack);
		},
		getMUAEmails: function (info) {
			var requestObj = {
				caseId: info.caseId
			};

			var callback = function (obj) {
				topic.publish("lingoController/Case-" + info.caseId + "muaEmailsLoaded", obj.data);
			};
			this.getAPI("getMUAEmails", requestObj, callback, false);
		},
		getMUAMessage: function (info, callBack) {
			var ctrl = this;
			var requestObj = lang.clone(info);

			var callback = function (obj) {
				var call1 = function (obj1) {
					callBack(obj1);
				};

				ctrl.mail_parse(obj.data, call1);

			};

			this.getAPI("getMUAMessage", requestObj, callback);
		},
		getCaseDetails: function (caseId, callback) {
			var requestObj = {
				"caseId": caseId
			};

			var callback1 = function (obj) {
				callback(obj);
				topic.publish("lingoController/Case-" + caseId + "getCaseDetailsLoaded", obj.data);
			}
			this.getAPI("getCaseDetails", requestObj, callback1);
		},
		getFnWorkOderDetails: function (id, callback) {
			var requestObj = {
				"externalTktNo": id
			};

			this.getAPI("getWorkOrderDetails", requestObj, callback);
		},
		getWorkOrderDetails: function (woId, callback) {
			var requestObj = {
				"woId": woId
			};

			this.getAPI("getWorkOrderDetails", requestObj, callback);
		},
		getNetworkEvents: function (callback) {
			var ctrl = this;
			var callback = function (obj) {
				if (obj.response.code == "200") {

					if (obj.data) {
						topic.publish("lingoController/getNetworkEvents", obj.data);
						ctrl.networkEventsInfo = obj.data;
					}
				}
			}

			this.getAPI("getNetworkCases", null, callback, true, false);
		},
		getResolutionInfo: function () {
			var ctrl = this;
			var callBack = function (obj) {

				if (obj.response.code == "200") {

					ctrl.resolutionInfo = obj.data;
				}

			}
			this.getAPI("getResolutionDetails", null, callBack);

			//this.sendRequest("getResolutionDetails",null, callBack, "Error while getting Data", "get");
		},
		getAllDispatchTypes: function () {
			var ctrl = this;
			var callBack = function (obj) {
				if (obj.response.code == "200") {
					ctrl.dispatchTypeInfo = obj.data;
				}
			};
			this.getAPI("getAllDispatchTypes", null, callBack);
		},
		getDispatchTypeStore: function (woType) {
			var ctrl = this;
			var dispatchTypeStore = new Memory({
				idProperty: "dispatchType",
				data: []
			});
			dispatchTypeStore.data = [];

			if (!woType) {
				woType = "\w*";
			}

			var dataStore = new Memory({
				'idProperty': 'dispatchType',
				'data': ctrl.dispatchTypeInfo
			});
			var filter = dataStore.query({
				'workOrderType': new RegExp(woType)
			});
			var tmpArry = [];
			var data = [];
			dojo.forEach(filter, function (item) {
				if (item.dispatchType && tmpArry.indexOf(item.dispatchType) == -1) {
					tmpArry.push(item.dispatchType);
					data.push({
						"id": item.id,
						"dispatchType": item.dispatchType,
						"workOrderType": item.workOrderType,
						"name": item.dispatchType
					});
				}
			});
			dispatchTypeStore.setData(data);

			return dispatchTypeStore;
		},
		getAllQueues: function () {
			var ctrl = this;
			var callBack = function (obj) {
				if (obj.response.code == "200") {
					ctrl.availableQueues = obj.data;
				}
			};
			this.getAPI("getAllQueues", null, callBack);
		},
		addQueue: function (info, callback) {
			var ctrl = this;
			var callBack = function (obj) {
				if (obj.response.code == "200") {
					callback();
					new messageWindow({
						title: "NOTE",
						message: "Success"
					});
				}
			};
			this.putAPI("admin/user/queue", info, callBack);
		},
		removeQueue: function (info, callback) {
			var ctrl = this;
			var callBack = function (obj) {
				if (obj.response.code == "200") {
					if (callback) {
						callback();
					}
					new messageWindow({
						title: "NOTE",
						message: "Successfully removed the queue"
					});
				}
			};

			this.putAPI("admin/user/queue", info, callBack);
		},
		getFolderList: function () {
			var ctrl = this;

			var callback = function (obj) {
				ctrl.folderList = dojo.clone(obj.data);
				topic.publish("/lingoController/folderLoaded", obj.data);

			}
			this.getAPI("folder", null, callback)
		},

		createWorkOrder: function (info, callback) {
			var callBack = function (obj) {
				if (obj.response.code == "200") {
					topic.publish("/lingoController/WOCreatedForCase-" + info.caseId, obj);
					new messageWindow({
						title: "SUCCESS",
						message: obj.response.message
						// + ". Type - " + obj.data.workOrderType + " Id - " + obj.data.id
					});
				}
				if (callback) {
					callback(obj);
				}
			}
			this.postAPI("createWorkOrder", info, callBack);
		},
		uploadFiles: function (formData, caseId, callback) {
			var ctrl = this;

			var callBack = function (obj) {
				if (callback) {
					callback(obj);
				}
				if (obj.response.code == "200") {
					var failedFiles = obj.data.failedFiles;
					if (failedFiles != null && failedFiles.length > 0) {
						new messageWindow({
							title: "UPLOAD FAILED",
							message: failedFiles.join(', ')
						});
					}
					topic.publish("/lingoController/uploadedFiles/Case-" + caseId, obj.data);
				}
			};
			this.sendRequest("uploadFile", formData, callBack);
		},
		getWOChargeTypes: function () {
			var ctrl = this;
			var callBack = function (obj) {
				if (obj.response.code == 200)
					ctrl.woChargeTypes = obj.data;
			};
			this.getAPI("getWOChargeTypes", null, callBack, false);
		},
		getContentByMailId: function (mailId, callback) {
			var ctrl = this;
			var requestObj = {
				"mailId": mailId
			};
			var callBack = function (obj) {
				if (obj.response.code == 200) {
					var call1 = function (data) {
						if (callback)
							callback(data);
					}
					ctrl.mail_parse(obj.data, call1);
				} else {
					new messageWindow({
						title: "ERROR",
						message: obj.response.message
					});
				}

			};
			this.getAPI("getMailContent", requestObj, callBack);
		},
		getCaseAttachments: function (caseId) {
			var ctrl = this;
			var requestObj = {
				"caseId": caseId
			};
			var callBack = function (obj) {
				if (obj.response.code == 200) {
					topic.publish("lingoController/Case-" + caseId + "attachmentsLoaded", obj.data);
				} else {
					new messageWindow({
						title: "ERROR",
						message: obj.response.message
					});
				}

			};
			this.getAPI("getCaseAttachments", requestObj, callBack);
		},
		downloadFile: function (caseId, filename) {
			var ctrl = this;
			var requestObj = {
				"file": caseId + "/" + filename
			};
			requestObj = JSON.stringify(requestObj);

			var callBack = function (obj) {
				var blob = obj;
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				a.remove();
				window.URL.revokeObjectURL(url);

			}
			this.sendRequest("downloadFile", requestObj, lang.hitch(this, callBack), "Error Processing the request!", "get");
		},
		updateStatus: function (userId, loginName, status, callback) {
			var ctrl = this;
			var info = { "userId": userId, "loginName": loginName, "busyStatus": status };
			var callBack = function (obj) {
				if (callback) {
					callback(obj);
				}
			}
			this.putAPI("updateAgentStatus", info, callBack);
		},

		validateContactEmail: function () {
			const emailRegex = /^[\p{L}0-9.!#$%&'*+/=?^_`{|}~-]+(?:\.[\p{L}0-9.!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/u;
			return emailRegex;
		},
		validateEmails: function () {
			var emailRegex = '[\\p{L}0-9.!#$%&\'*+/=?^_`{|}~-]+(?:\\.[\\p{L}0-9.!#$%&\'*+/=?^_`{|}~-]+)*@[\\p{L}0-9-]+(?:\\.[\\p{L}0-9-]+)*\\.[\\p{L}]{2,}';

			// Separator: comma, optional spaces, and optional newline(s)
			var listSeparator = '\\s*,\\s*\\n*';

			// Combine the email regex with the listSeparator to match multiple emails
			var fullRegex = new RegExp('^(' + emailRegex + '(?:' + listSeparator + emailRegex + ')*)?$', 'u');

			return fullRegex;

		},
		getEventData: function () {
			this.closeSseConnection();
			var callBack = function (message) {

				if (message != null) {
					registry.byId("notification_div").setMessage(message);
				}
			}
			this.sendRequest("getNetworkEvents", null, lang.hitch(this, callBack), "Error while getting Data", "get");
		},
		updateCaseAttachment: function (info) {
			var ctrl = this;
			var callBack = function (obj) {
				if (obj.response.code != 200) {
					new messageWindow({
						title: "ERROR",
						message: obj.response.message
					});
				} else {
					new messageWindow({
						title: "SUCCESS",
						message: "SUCCESS"
					});
					ctrl.getCaseAttachments(info.caseId);
				}
			}
			this.putAPI("updateCaseAttachment", info, callBack);
		},
		createTask: function (info, callback) {
			var callBack = function (obj) {
				if (obj.response.code == "200") {
					topic.publish("/lingoController/TaskCreatedForCase-" + info.caseId, obj);

				}
				if (callback) {
					callback(obj);
				}
			}
			this.postAPI("createTask", info, callBack);
		},
		getTaskDetails: function (taskId, callback) {
			var ctrl = this;
			var requestObj = {
				"taskId": taskId
			};

			this.getAPI("getTask", requestObj, callback);
		},
		updateTask: function (info, callback) {
			var ctrl = this;
			var callBack = function (obj) {

				if (obj.response.code == 200) {
					var call2 = function (obj2) {
						if (obj2.response.code == "200")
							topic.publish("lingoController/taskUpdated-" + info.id, obj2);
					}
					ctrl.getTaskDetails(info.id, call2);
				}
				if (callback) {
					callback(obj);
				}
			}
			this.putAPI("updateTask", info, callBack);
		},
		sendOutageNotice: function (info, callback) {
			var ctrl = this;
			var callBack = function (obj) {
				if (obj.response.code == "200") {

					topic.publish("/lingoController/OutageCreatedForCase-" + info.caseId, obj);

				}

				if (callback) {
					callback(obj);
				}

			}
			this.postAPI("sendOutageNotice", info, callBack);
		},
		getGroupByName: function (groupName) {
			return this.availableGroups.find(item => item.groupName === groupName);
		},
		getGroupById: function (id) {
			return this.availableGroups.find(item => item.groupID === id);
		}


	});
});
