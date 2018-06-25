process.title = 'FRed'
/**
 * A Bot for Slack!
 */


/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */

function onInstallation(bot, installer) {
    if (installer) {
        bot.startPrivateConversation({user: installer}, function (err, convo) {
            if (err) {
                console.log(err);
            } else {
                convo.say('I am a bot that has just joined your team');
                convo.say('You must now /invite me to a channel so that I can be of use!');
            }
        });
    }
}


/**
 * Configure the persistence options
 */

var config = {};
if (process.env.MONGOLAB_URI) {
    var BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI}),
    };
} else {
    config = {
        json_file_store: ((process.env.TOKEN)?'./db_slack_bot_ci/':'./db_slack_bot_a/'), //use a different name if an app or CI
    };
}

/**
 * Are being run as an app or a custom integration? The initialization will differ, depending
 */

if (process.env.TOKEN || process.env.SLACK_TOKEN) {
    //Treat this as a custom integration
    var customIntegration = require('./lib/custom_integrations');
    var token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TOKEN;
    var controller = customIntegration.configure(token, config, onInstallation);
} else if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.PORT) {
    //Treat this as an app
    var app = require('./lib/apps');
    var controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation);
} else {
    console.log('Error: If this is a custom integration, please specify TOKEN in the environment. If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment');
    process.exit(1);
}


/**
 * A demonstration for how to handle websocket events. In this case, just log when we have and have not
 * been disconnected from the websocket. In the future, it would be super awesome to be able to specify
 * a reconnect policy, and do reconnections automatically. In the meantime, we aren't going to attempt reconnects,
 * WHICH IS A B0RKED WAY TO HANDLE BEING DISCONNECTED. So we need to fix this.
 *
 * TODO: fixed b0rked reconnect behavior
 */
// Handle events related to the websocket connection to Slack
controller.on('rtm_open', function (bot) {
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close', function (bot) {
    console.log('** The RTM api just closed');
    // you may want to attempt to re-open
});


/**
 * Core bot logic goes here!
 */
// BEGIN EDITING HERE!

controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, "I'm here!")
});

controller.hears('hello', 'direct_message', function (bot, message) {
    bot.reply(message, 'Hello!');
});


/**
 * AN example of what could be:
 * Any un-handled direct mention gets a reaction and a pat response!
 */
//controller.on('direct_message,mention,direct_mention', function (bot, message) {
//    bot.api.reactions.add({
//        timestamp: message.ts,
//        channel: message.channel,
//        name: 'robot_face',
//    }, function (err) {
//        if (err) {
//            console.log(err)
//        }
//        bot.reply(message, 'I heard you loud and clear boss.');
//    });
//});

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest

var HttpClient = function() {
    this.get = function(aUrl, aCallback) {
	var anHttpRequest = new XMLHttpRequest();
	anHttpRequest.onreadystatechange = function() { 
	    if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
		aCallback(anHttpRequest.responseText);
	}

	anHttpRequest.open( "GET", aUrl, true );            
	anHttpRequest.send( null );
    }
}


/*

var client = new HttpClient();
client.get('https://slack.com/api/users.list?token=xoxp-381215295269-380531089249-380542544096-a40fa70ac814805b02d6b6ca1352c02d&pretty=1', function(response) {
	parsedJSON = JSON.parse(response)
	userIds = parsedJSON.members
	everything(userIds)
}); */

function everything() {
	var meals = []
	var lowerCaseMeals = []
	var ids = []
	var orders = []
	var claimed = 0


	function arrayToString(arr) {
		var returnString = ""
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] == "CLAIMED") {
				continue;
			}
			returnString = returnString + arr[i].toString() + "\n"
		}
		return returnString
	}

	function getUserName(key) {
		for (var i = 0; i < userIds.length; i++) {
			if( userIds[i].id == key ) {
				 return userIds[i].name;
			}
		}
		return null
	}

	function addOrder(id) {
		var done = false
		/* 
		for (var i = 0; i < orders.length; i++) {
			if (orders[i][0] == id) {
				orders[i][1] += 1
				done = true
			}
		} */
		if (!done) {
			orders.push([id, 1])
		}
		claimed += 1
	}

	function canOrder(id) { 
		for (var i = 0; i < orders.length; i++) {
			if (orders[i][0] == id) {
				if (orders[i][1] >= 1) {
					return false
				} else { 
					return true
				}
			}
		}
		return true
	}

	controller.hears('ufg' , 'direct_message', function (bot, message) {	
		if (message.text.toLowerCase().slice(0,4) == 'ufg ') {	
			var messageStr = message.text;
			meals.push((meals.length + 1).toString() + "." + messageStr.slice(3));
			lowerCaseMeals.push(((meals.length + 1).toString() + "." + messageStr.slice(3)).toLowerCase())
			ids.push(message.user)
			bot.reply(message, "Added " + messageStr.slice(4));
		} else {
			bot.reply(message, "Incorrect input, type 'help' for available commands.")
		}
	});

	controller.hears('list', 'direct_message', function(bot, message) {
		if (meals.length == 0) {
			bot.reply(message, "There is no food up for grabs :(");
		}
		bot.reply(message, arrayToString(meals));
	});

	controller.hears('SELECT *', 'direct_message', function(bot, message) {
                if (meals.length == 0) {
                        bot.reply(message, "There is no food up for grabs :(");
                }
                bot.reply(message, arrayToString(meals));
        });

	controller.hears('ls', 'direct_message', function(bot, message) {
                if (meals.length == 0) {
                        bot.reply(message, "There is no food up for grabs :(");
                }
                bot.reply(message, arrayToString(meals));
        });

	controller.hears('claim', 'direct_message', function(bot, message) {
		if (message.text.toLowerCase().slice(0,5) == 'claim') {
			if (canOrder(message.user)) {		
				var number = parseInt(message.text.toLowerCase().slice(5).replace(/\s/g, ""));
				if (number != 0 && number > meals.length) {
					bot.reply(message, "Error: Order number not available")
				} else {
					if (meals[number-1] == "CLAIMED") {
						bot.reply(message, "This meal has already been claimed.");
						return;
					}
					claimedMeal = meals[number - 1].slice(meals[number - 1].indexOf(' '));
					addOrder(message.user)
					meals[number - 1] = 'CLAIMED';
					lowerCaseMeals[number - 1] = ' '
					bot.reply(message, 'Claimed order' + message.text.slice(5) + ".\nName: <@" + ids[number-1] +  ">\nFood details: " +  claimedMeal);
				}
			} else {
				bot.reply(message, 'You have already ordered today.')
			}
		} else {
			bot.reply(message, "Incorrect input, type 'help' for available commands.")
		}
	});

	controller.hears('search', 'direct_message', function(bot, message) {
		var searchArray = []
		var term = message.text.slice(6).replace(/\s/g, "")
		for (var i = 0; i < meals.length; i++) {
			if (lowerCaseMeals[i].includes(term.toLowerCase())) {
				searchArray.push(meals[i])
			}
		}
		if (searchArray.length == 0) {
			bot.reply(message, "No results found.");
		}
		bot.reply(message, arrayToString(searchArray))
	});

	controller.hears('help', 'direct_message', function(bot, message) {
		bot.reply(message, '‘ufg <food details>’ →  puts your food up for grabs\n' +
				   '‘claim <food number>’ →  claims an item up for grabs\n' +
				   '‘list’ →  lists all the items up for grabs\n' +
				   '‘search <word>’ →  looks for a specific word in the title\n' +
				   '‘stats’ →  shows stats corresponding to claimed food\n' + 
				   '‘orders’ →  sees how many times you’ve ordered this week');
	});

	controller.hears('orders', 'direct_message', function(bot, message) {
		var notSeen = true
		for (var i = 0; i < orders.length; i++) {
			if (orders[i][0] == message.user) {
				bot.reply(message, 'You have claimed ' + orders[i][1].toString() + ' orders this week (2 orders max per week)')
				notSeen = false
			}
		}

		if (notSeen) {
			bot.reply(message, 'You have not claimed any orders this week (2 orders max per week)')
		}
	});

	controller.hears('stats', 'direct_message', function(bot, message) {
		bot.reply(message, (claimed/meals.length * 100).toString() + '% of meals put ufg were claimed.\n' +
				   '$' + (15 * claimed).toString() + ' not gone to waste.'
				   ) 
	});




}

everything() 
