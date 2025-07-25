define(["dojo/_base/declare",
	"dojo/json",
	"dojo/dom-style",
	"dojo/dom",
	"app/view/messageWindow",
	"app/controller/baseController",
	"dojo/store/Memory",
	"dojo/store/Observable",
	"dojo/DeferredList",
	"dojo/_base/Deferred"
], function(declare, json, domStyle, dom, messageWindow, baseController, Memory, Observable, DeferredList, Deferred) {

	var model = null;
	var categoryList = null;
	var lineList = null;
	var ticketsCount = 0;
	var groupStore = new Observable(Memory({
		idProperty: "groupName"
	}));

	var typeStore = new Observable(Memory({
		idProperty: "type"
	}));
	var subTypeStore = new Observable(Memory({
		idProperty: "subType"
	}));

	var populateGroupStore = function() {
		var tmpArry = [];
		var data = [];
		dojo.forEach(categoryList, function(item) {
			if (tmpArry.indexOf(item.groupName) == -1) {
				tmpArry.push(item.groupName);
				data.push({ 'groupName': item.groupName });
			}
		});

		groupStore.data = data;
	}

	populateCaseStore = function(data) {
		var caseData = [];
		dojo.forEach(data, function(item) {
		});
	}

	removeDuplicate = function() {

		var seenTickets = {};

		caseStore.data = caseStore.data.filter(function(currentObject) {
			if (currentObject.request in seenTickets) {
				return false;
			} else {
				seenTickets[currentObject.request] = true;
				return true;
			}
		});
	}


	return declare([baseController], {
		constructor: function() {
			//console.log("searchCases ctrl");
			//model = new Model();
		},
		loadData: function(callback) {
			var d1 = this.fetchCategoryList();
			var dl = new DeferredList([d1, d2, d3]);

			dl.then(function(result) {
				// "result" will be an array of results
				//	domStyle.set(dom.byId("loading_icon"), "display", "none");
				//console.log(result);
				callback();
			});
		},
		loadGroupCategory: function(group, callback) {
			var d1 = this.fetchCategoryList(null, group);
			var dl = new DeferredList([d1]);
			dl.then(function(result) {
				callback();
			});
		},

		fetchCategoryList: function(availability, group) {
			var d = new Deferred();
			var requestObj = {
				"status": "Active"
			};

			if (availability) {
				requestObj.availability = availability;
			}

			if (group) {
				requestObj.groupName = group;
			}
			requestObj = JSON.stringify(requestObj);
			var callBack = function(obj) {
				d.resolve(obj);
				if (obj.response.status == "Success") {
					categoryList = obj.data;
					populateGroupStore();
				} else {
					if (!/Error/i.test(obj.response.message) && !/FAiled/i.test(obj.response.message)) {
						new messageWindow({
							message: obj.response.message,
							title: "Note"
						});
					} else {
						new messageWindow({
							message: obj.response.message,
							title: "Error"
						});
					}
				}
				//domStyle.set(dom.byId("loading_icon"), "display", "none");
			};
			//domStyle.set(dom.byId("loading_icon"), "display", "block");
			// this.sendRequest("category", requestObj, callBack, "Error while getting Category List", "get");
			return d;
		},

		getGroupStore: function() {
			return groupStore;
		},

		getCategoryStore: function(group) {
			categoryStore.data = [];
			var filter = categoryList;
			if (!group) {
				group = "\w*";
			}

			var store = new Memory({ 'idProperty': 'categoryName', 'data': categoryList });
			filter = store.query({ "groupName": new RegExp(group) });
			var tmpArry = [];
			var data = [];
			dojo.forEach(filter, function(item) {
				if (tmpArry.indexOf(item.categoryName) == -1) {
					tmpArry.push(item.categoryName);
					data.push({ 'categoryName': item.categoryName });
				}
			});

			categoryStore.data = data;
			return categoryStore;
		},

		getTypeStore: function(group, category) {
			typeStore.data = [];

			if (!group) {
				group = "\w*";
			}

			if (!category) {
				category = "\w*";
			}

			var dataStore = new Memory({ 'idProperty': 'type', 'data': categoryList });
			var filter = dataStore.query({ 'groupName': new RegExp(group), 'categoryName': new RegExp(category) });
			var tmpArry = [];
			var data = [];
			dojo.forEach(filter, function(item) {
				if (item.type && tmpArry.indexOf(item.type) == -1) {
					tmpArry.push(item.type);
					data.push({ 'type': item.type });
				}
			});
			typeStore.data = data;
			return typeStore;
		},

		getSubTypeStore: function(group, category, type) {

			subTypeStore.data = [];
			//console.log(group, category, type);
			if (!group) {
				group = "\w*";
			}

			if (!category) {
				category = "\w*";
			}

			if (!type) {
				type = "\w*";
			}

			var dataStore = new Memory({ 'idProperty': 'subType', 'data': categoryList });
			var filter = dataStore.query({ 'groupName': new RegExp(group), 'categoryName': new RegExp(category), 'type': new RegExp(type) });
			var tmpArry = [];
			var data = [];
			dojo.forEach(filter, function(item) {
				//console.log(item);
				if (item.subType && tmpArry.indexOf(item.subType) == -1) {
					tmpArry.push(item.subType);
					data.push({ 'subType': item.subType });
				}
			});
			subTypeStore.data = data;
			return subTypeStore;
		},

		searchCases: function(requestObj, callback) {

			requestObj = JSON.stringify(requestObj);
			var data = {
				"priority": "Medium",
				"create_date": "2024-09-14",
				"request": "211820",
				"status": "New",
				"group": "Incident",
				"category": null,
				"type": null,
				"subType": null,
				"assignee": "qal4",
				"last_modified_date": "09-15-2024",
				"agentWorklog": "test",
				"autoWorklog": "test",
				"email_address": "test@lingo.com"
			};
			populateCaseStore(data);
			callback();
			//domStyle.set(dom.byId("loading_icon"), "display", "block");
			//this.sendRequest("searchCases", requestObj, processResponse, "Error while searching tickets", "get");
		},
		getCases: function() {
			
			var data = {
				"priority": "Medium",
				"create_date": "2024-09-14",
				"caseNumber": "211820",
				"status": "New",
				"caseType": "Incident",
				"accountName":"Miller Corp",
				"type": null,
				"subType": null,
				"assignee": "qal4",
				"last_modified_date": "09-15-2024",
				"agentWorklog": "test",
				"autoWorklog": "test",
				"email_address": "test@lingo.com"
			};
			var casesStore =  new Memory({
                idProperty: 'caseNumber',
                data : []
            });
            var cases= [];
            cases.push(data);
            console.log(cases);
            casesStore.setData(cases);
            console.log(casesStore)
			return casesStore;
		},
		getDownloadData: function() {

			var i, len;
			var data = {
				identifier: 'id',
				label: 'id',
				items: []
			};

			for (i = 0, len = caseStore.data.length; i < len; ++i) {
				data.items.push(dojo.mixin({ 'id': i + 1 }, caseStore.data[i % len]));
			}

			var store = new dojo.data.ItemFileWriteStore({ data: data });
			return store;
		},
		getCasesCount: function() {
			return caseStore.data.length;
		}
	});
});
