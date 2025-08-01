
define([
	"dojo/_base/declare",
	'dstore/Tree',
	"dstore/Memory",
], function (declare, TreeStoreMixin, MemoryStore) {
	return declare(null, {

		constructor: function (args) {

			this.treeStore = new (MemoryStore.createSubclass([TreeStoreMixin]))({
				idProperty: 'accountId',

				data: []
			});

			// Override getRootCollection to check for undefined parentId rather than null
			this.treeStore.getRootCollection = function () {
				return this.root.filter({ parentAccountId: undefined });
			};

			this.treeStore.getChildren = function (object) {
				return this.root.filter({ parentAccountId: this.getIdentity(object) });
			}

		},
		getStore: function () {
			return this.treeStore;
		},
		setData: function (data, currentAppId) {
			if (data != null && data.length > 0) {
				this.setChildCount(data);
				this.expandToCurrent(data, currentAppId);
				this.setCurrent(data, currentAppId);
				this.treeStore.setData(data);
			} else {

				this.treeStore.setData([]);
			}

		},
		setCurrent: function (data, currentAppId) {
			var currentAccount = data.filter(account => { return account.accountId == currentAppId })[0];
			if (currentAccount) {
				currentAccount.isCurrent = true;
			}

		},
		expandToCurrent: function (data, currentAppId) {
			if (!data)
				return;

			data.forEach(account => {
				if (account.parentAccountId == undefined) {
					account.expand = true;
				}

				if (account.accountId == currentAppId) {
					account.expand = true;
					this.expandToCurrent(data, account.parentAccountId);
				}

			});
		},
		setChildCount: function (data) {
			for (var i = 0; i < data.length; ++i) {
				var accountId = data[i].accountId;
				var childCount = data.filter(account => { return account.parentAccountId == accountId }).length;
				data[i].childCount = childCount;
				if (childCount == 0) {
					data[i].hasChildren = false;
				}
			}
		},
		getRootCollection: function () {
			return this.treeStore.getRootCollection();
		},
		clear: function () {
			this.treeStore.setData([]);
		}
	});
});