var cities = [
	{
		x: 355,
		y: 66,
		name: 'Boston',
		label: 'BOS'
	},	
	{
		x: 240,
		y: 100,
		name: 'Chicago',
		label: 'CHI'
	},	
	{
		x: 326,
		y: 118,
		name: 'Washington DC',
		label: 'DC'
	},	
	{
		x: 329,
		y: 103,
		name: 'Philadelphia',
		label: 'PHI'
	},	
	{
		x: 344,
		y: 80,
		name: 'New York City',
		label: 'NYC'
	},	
	{
		x: 7,
		y: 114,
		name: 'San Francisco',
		label: 'SF',
		labelPosition: 'right'
	},	
	{
		x: 23,
		y: 147,
		name: 'Los Angeles',
		label: 'LA',
		labelPosition: 'right'
	},	
	{
		x: 179,
		y: 186,
		name: 'Dallas',
		label: 'DAL'
	},	
	{
		x: 192,
		y: 214,
		name: 'Houston',
		label: 'HOU'
	},	
	{
		x: 279,
		y: 170,
		name: 'Atlanta',
		label: 'ATL'
	},
	{
		x: 319,
		y: 236,
		name: 'Miami',
		label: 'MIA'
	},
	{
		x: 277,
		y: 111,
		name: 'Cincinnati',
		label: 'CIN'
	}
];

var initialize = function() {
	App.getApplication().cities.add(cities);
};

if (BROWSER_MODE) {
	$(initialize);
} else {
	document.addEventListener('deviceready', initialize);
}