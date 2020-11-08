const applianceInits = [
	{
		type : 'fridge',
		watts1 : 200,
		watts2 : 25, 
		min: false,
		max: false,
		motive: 'hunger',
		alwaysOn: true,
	},
	{
		type : 'microwave',
		watts1 : 1000,
		watts2 : 100,
		min: 5,
		max: 5,
		motive: 'hunger',
	},
	{
		type : 'oven',
		watts1 : 2000,
		watts2 : 100,
		min: 10,
		max: 60,
		motive: 'hunger',
	},
	{
		type : 'stove',
		watts1 : 1250,
		watts2 : 150,
		min: 10,
		max: 60,
		motive: 'hunger',
	},
	{
		type : 'toaster',
		watts1 : 1400,
		watts2 : 200,
		min: 1,
		max: 5,
		motive: 'hunger',
	},
	{
		type : 'kettle',
		watts1 : 1500,
		watts2 : 250,
		min: 5,
		max: 10,
		motive: 'hunger',
	},
	{
		type : 'coffeemaker',
		watts1 : 900,
		watts2 : 250,
		min: 5,
		max: 10,
		motive: 'hunger',
	},
	{
		type : 'dishwasher',
		watts1 : 1500,
		watts2 : 200,
		min: 30,
		max: 120,
		motive: 'cleanliness'
	},
	{
		type : 'light',
		watts1 : 100,
		watts2 : 5,
		min: 1,
		max: 1440,
		motive: 'light'
	},
	{
		type : 'tv',
		watts1 : 270,
		watts2 : 5,
		min: 15,
		max: 360,
		motive: 'boredom'
	},
	{
		type : 'xbox',
		watts1 : 185,
		watts2 : 20,
		min: 15,
		max: 360,
		motive: 'boredom'
	},	
	{
		type : 'dvd',
		watts1 : 35,
		watts2 : 5,
		min: 15,
		max: 360,
		motive: 'boredom'
	},	
	{
		type : 'fan',
		watts1 : 75,
		watts2 : 5,
		min: 5,
		max: 360,
		motive: 'comfort'
	},	
	{
		type : 'computer',
		watts1 : 200,
		watts2 : 5,
		min: 30,
		max: 360,
		motive: 'boredom'
	},	
	{
		type : 'washingmachine',
		watts1 : 1900,
		watts2 : 300,
		min: 60,
		max: 120,
		motive: 'cleanliness'
	},
	{
		type : 'dryer',
		watts1 : 4800,
		watts2 : 100,
		min: 60,
		max: 120,
		motive: 'cleanliness'
	},		
	{
		type : 'airconditioner',
		watts1 : 3500,
		watts2 : 100,
		min: 10,
		max: 1440,
		motive: 'comfort'
	},
	{
		type : 'hairdryer',
		watts1 : 1000,
		watts2 : 5,
		min: 5,
		max: 10,
		motive: 'hygiene'
	},					
];

module.exports = applianceInits;