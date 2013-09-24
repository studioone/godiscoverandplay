/**
 *
 */
var Tips = Page.extend({
	el: '#tips',

	tips: null,

	backToPage: '#activities',

	slider: null,

	$tipsContainer: null,

	initialize: function(options) {
		var self = this;

		// call parent
		Page.prototype.initialize.call(this, arguments);

		this.slider = new TipSlider();

		this.tips = new TipCollection();
		this.tips.fetch();

		this.$('.share').on('tap', _.bind(this._share, this));

		$(document).on('pagebeforeshow', '#tips', _.bind(this._renderTips, this));
	},

	_share: function(event) {
		var $el = $(event.target),
			share = $el.data('share'),
			tip = this.slider.getCurrentItem().data('backboneview').model;

		if (share == 'facebook') {
			Share.toFacebook({
				name: 'Go Vibrant',
				appId: FB_APP_ID,
				content: tip.get('content'),
				picture: SITE_URL + '/images/logo.png',
				redirectUri: SITE_URL + '/close-window.html',
				description: 'Making Healthy Living Easier',
				url: SITE_URL
			});
		} else if (share == 'twitter') {
			Share.toTwitter(tip.get('content'));
		}

	},

	_renderTips: function() {

		var app = App.getApplication();

		this.$('.title').text( app.cities.getCurrentCity() );

		var criteria = {
			city: app.cities.getCurrentCity(),
			activities: app.activities.getCurrentActivities()
		};

		var results = this.tips.filterByCriteria(criteria);

		var views = [];

		_.each(results, function(model) {
			var newTip = new TipItem({model: model});
			views.push( newTip.render().$el );
		});

		this.slider.render(views);
	}

});

/**
 *
 */
var TipSlider = Backbone.View.extend({

	el: '#tips-slider',

	render: function(tips) {
		// reset
		this.$el.data('plugin_slidesjs', null);
		this.$el.html('');

		console.log('Slider items count: ', tips.length);

		var self = this;

		_.each(tips, function(tip) {
			self.$el.append(tip);
		});

		this.$el.slidesjs();
		
		// remove next/prev text
		this.$el.find('.slidesjs-next, .slidesjs-previous').html('');
	},

	getCurrentItem: function() {
		var plugin = this.$el.data('plugin_slidesjs');
		return this.$('*[slidesjs-index="' + plugin.data.current + '"]');
	}
});

/**
 * 
 */
var TipModel = Backbone.Model.extend({});


/**
 *
 */
var TipCollection = Backbone.Collection.extend({
	
	model: TipModel,

	url: 'content.json',

	/**
	 *
	 */
	filterByCriteria: function(criteria) {

		console.log(criteria)

		return this.filter(function(model) {
			return model.get('city') == criteria.city 
				&& $.inArray(model.get('activity').toLowerCase(), criteria.activities) != -1;
		});
	}

});

/**
 *
 */
var TipItem = Backbone.View.extend({

	className: 'tip',

	template: null,

	initialize: function() {
		this.template = $('#tip-template').html();
	},

	/**
	 * Content with links
	 */
	getContent: function() {
		var self = this;

		var content = this.model.get('content');

		_.each(this.model.get('urls'), function(url) {
			content = self.replaceWithLink(content, url.text, url.url);
		});

		return content;

	},

	replaceWithLink: function(text, textToReplace, link) {
		return text.replace(textToReplace, '<a href="' + link + '" target="_BLANK">' + textToReplace + '</a>');
	},

	render: function() {

		this.$el.html( _.template(this.template, {
			content: this.getContent(),
			image: this.model.get('image')
		}) );

		this.$el.addClass( this.model.get('activity').toLowerCase() );

		var activity = this.model.get('activity'),
			label =  Activities.LABELS[ activity.toLowerCase() ] || activity;

		this.$('.tip-header').text( label );

		this.$el.data('backboneview', this);

		return this;
	}

});