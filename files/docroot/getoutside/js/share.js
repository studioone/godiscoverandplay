var Share = {

	window: null,

	toTwitter: function(content) {
		var url = 'https://twitter.com/intent/tweet?text=' + content;
		
		this.openWindow( encodeURI(url) );

		this.window.addEventListener('loadstart', function(e) { 
			if (e.url.match('latest_status_id'))
				self.window.close();
		});
	},

	toFacebook: function(details) {

		var params =[
			'name=' + details.name, 
			'caption=' + details.content,
			'description=' + details.description,
			'picture=' + details.picture,
			'app_id=' + details.appId,
			'link=' + details.url,
			'redirect_uri=' + details.redirectUri,
			'display=popup'
		];

		var url = 'https://www.facebook.com/dialog/feed?' + params.join('&');

		this.openWindow( encodeURI(url) );

		this.window.addEventListener('loadstart', function(e) { 
			if (!e.url.match('facebook'))
				self.window.close();
		});
	},

	openWindow: function(url) {
		var self = this;

		this.window = window.open(url, '_blank', 'location=no');

		this.window.addEventListener('exit', function(e) { 
			self.window = null;
		});
	},

};