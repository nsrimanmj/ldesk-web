define(["dojo/_base/declare",
	"dojo/store/Memory",
	"dojo/topic",
	"dojo/_base/lang"
], function (declare, Memory, topic, lang) {
	return declare(null, {
		constructor: function () {
			this.store = new Memory({
				idProperty: "userId",
				data: this.data
			});

			this.handle = topic.subscribe("lingoController/agentListLoaded", lang.hitch(this, function (info) {
				this.setData(info);
			}));

		},
		setData: function (data) {
			this.store.setData(data);
		},
		getStore: function () {
			return this.store;
		},
		getAgentsByGroup: function (groupName) {
			var data = this.store.data.filter(user => {
				if (user.groups) {
					var groups = user.groups.filter(group => { return group.groupName == groupName });
					return groups.length > 0
				}
			});

			var store = new Memory({
				idProperty: "userId",
				data: data
			});

			return store;
		},
		getAgentsByQueue: function (queueName) {
			var data = this.store.data.filter(user => {
				if (user.queues) {
					var queues = user.queues.filter(queue => { return queue.queueName == queueName });
					return queues.length > 0
				}
			});

			var store = new Memory({
				idProperty: "userId",
				data: data
			});

			return store;
		},

		getCombinedAgentsByGroups: function (groupNames) {
			var combinedData = [];
			groupNames.forEach(groupName => {
				var groupStore = this.getAgentsByGroup(groupName);
				combinedData = combinedData.concat(groupStore.data);
			});

			// Remove duplicates
			var uniqueData = combinedData.filter((value, index, self) =>
				index == self.findIndex((t) => (
					t.userId == value.userId
				))
			);

			return new Memory({
				idProperty: "userId",
				data: uniqueData
			});
		}

	});
});
