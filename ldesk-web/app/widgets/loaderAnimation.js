define( ['dojo/has',
		 'dojo/has!dom?dojo/dom',
		 'dojo/has!dom?dojo/dom-style'
], function( has, dom, domStyle ) {

	var setDisplay = function(selector, val) {
		var elem;
		if ( has("dom") && (elem = dom.byId(selector)) ) {
			domStyle.set( elem, "display", val );
		}
	},
	moduleObject = {
		hide: function() {
			setDisplay(this.selector, "none");
		},
		show: function() {
			setDisplay(this.selector, "block");
		}
	},

	ctor = function(selector) {
		moduleObject.selector = selector;
		return moduleObject;
	};

	return ctor;
});
