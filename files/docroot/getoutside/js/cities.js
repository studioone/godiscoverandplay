/**
 *
 */
var Cities = Page.extend({

	el: '#cities',

	title: 'Choose Your City',

	$map: null,

	initialize: function() {
		var self = this;

		// call parent
		Page.prototype.initialize.call(this, arguments);
		this.$map = this.$el.find('.map');

		this.$el.on('tap', '.city', function(e) {
			self.$el.find('.city').removeClass('select');
			$(this).addClass('select');
		});

		this.$el.on('tap', '.next-btn', _.bind(this.gotoSliderPage, this) );

	},

	gotoSliderPage: function() {
		var city = this.$el.find('.select').data('name');

		if (!city) return;

		localStorage['city'] = city;
		$.mobile.changePage('#activities');
	},

	getCurrentCity: function() {
		return localStorage['city'];
	},

	add: function(cities) {
		// if single item
		if ( !(cities instanceof Array) ) 
			cities = [cities];

		_.each(cities, _.bind(this._appendCity, this) );
	},

	_appendCity: function(rawCity) {
		var city = new City(rawCity),
			cityRing = new CityRing({ model: city });

		this.$map.append( cityRing.render().$el );
	}

});

/**
 *
 */
var City = Backbone.Model.extend({});

/**
 *
 */
var CityRing = Backbone.View.extend({

	className: 'city',

	template: '<div class="city-label <%= position %>"><%= label %></div>',

	render: function() {
		
		this.$el.css({
			left: this.model.get('x'),
			top: this.model.get('y')
		});

		var $label = $(_.template(this.template, {
			'label': this.model.get('label'),
			'position': this.model.get('labelPosition') || 'left'
		}));

		if (this.model.get('label').length == 3) {
			$label.addClass('l3');
		}
		
		if(this.model.get('label') == "CIN"){
			$label.addClass('cin-custom-pos');
		}
		
		if(this.model.get('label') == "HOU"){
			$label.addClass('hou-custom-pos');
		}
		
		this.$el.append($label);

		this.$el.data('name', this.model.get('name'));

		return this;
	}

});