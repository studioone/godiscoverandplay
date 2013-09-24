/**
 * Application Object
 */
var App = Backbone.View.extend({

	router: null,

	activities: null,

	cities: null,

	tips: null,

	initialize: function() {
		this.router = new AppRouter();
		Backbone.history.start();
		this.activities = new Activities();
		this.cities = new Cities();
		this.tipes = new Tips();
	},

});

/**
 * 
 */
var AppRouter = Backbone.Router.extend({
	
	routes: {
		"cities": "cities",
	},

	cities: function() {
		console.log(1)
	},
});

/**
 * Singleton for getting the application object
 * @return App
 */
App.getApplication = function() {
	if (!window._app) {
		window._app = new App();
	}
	return window._app;
};


/**
 * Every page on the app should extend this object
 */
var Page = Backbone.View.extend({
	
	title: '',

	initialize: function() {
		this.renderHeader();
		this.renderFooter();
		this.initializeHeaderButtons();
	},

	/**
	 * 
	 */
	renderHeader: function() {
		// cached tpl
		if (!window.appDefaultHeader) {
			window.appDefaultHeader = $('#default-header').html();
		}

		var $header = this.$el.children('*[data-role="header"]');
		var content = $header.html();

		// dont render if there is a specified header
		if ( content.trim() ) return;

		$header.html( _.template(window.appDefaultHeader, {title: this.title}));
	},

	/**
	 * 
	 */
	renderFooter: function() {
		// cached tpl
		if (!window.appDefaultFooter) {
			window.appDefaultFooter = $('#default-footer').html();
		}
		var $footer = this.$('*[data-role="footer"]');
		var content = $footer.html();
		// dont render if there is a specified footer
		if ( content.trim() ) return;

		$footer.html( _.template(window.appDefaultFooter, {}) );
	},

	/**
	 * 
	 */
	initializeHeaderButtons: function() {

		var self = this;

		// 
		this.$('.back-btn').on('tap', function() {

			if (self.backToPage === undefined) return;
			$.mobile.changePage(self.backToPage);
		});

		// 
		this.$('.home-btn').on('tap', function() {
			$.mobile.changePage('');
		});
	},
});

