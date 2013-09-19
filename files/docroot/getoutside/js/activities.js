/**
 * Handles Activities Page
 */
var Activities = Page.extend({

	el: '#activities',

	title: 'Choose Your Activities',

	/**
	 * 
	 */
	initialize: function() {

		// call parent
		Page.prototype.initialize.call(this, arguments);

		this.$('.activity').on('tap', function(e) {
			$(this).toggleClass('select');
		});

		this.$('.next-btn').on('tap', _.bind(this.gotoCitiesPage, this));

		this.$('.activity').each(function(index, el) {
			var $el = $(el),
				activity = $el.data('activity'),
				label = Activities.LABELS[activity];

			if (!label) return;

			$el.find('.name').text(label);
		});

	},

	/**
	 * 
	 */
	gotoCitiesPage:function() {

		var activities = this.getSelectedActivities();
		
		if (activities.length === 0)
			return;

		this.storeActivities(activities);
		window.location.href = "#tips";
	},

	/**
	 * @return array
	 */
	getSelectedActivities: function() {

		var selected = [];

		this.$('.select').each(function(index, el) {
			selected.push( $(el).data('activity') );
		});

		return selected;
	},

	/**
	 *
	 */
	storeActivities: function(activities) {
		localStorage['selected_activities'] = activities;
	},

	/**
	 *
	 */
	getCurrentActivities: function() {
		var activities = localStorage['selected_activities'];
		return activities.split(',');
	}

});

Activities.LABELS = {
	'cardio': 'Heart Pumping',
	'strength': 'Muscle Up'
};