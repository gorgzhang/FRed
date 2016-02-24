/**
 * A Bot for Slack!
 */

if (!process.env.PORT) {
    console.log('Error: Please specify PORT in the environment');
    process.exit(1);
}


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

if (process.env.TOKEN) {
    //Treat this as a custom integration
    var customIntegration = require('./lib/custom_integrations');
    var controller = customIntegration.configure(process.env.PORT, process.env.TOKEN, config, onInstallation);
} else if (process.env.CLIENTID && process.env.CLIENTSECRET) {
    //Treat this as an app
    var app = require('./lib/apps');
    var controller = app.configure(process.env.PORT, process.env.CLIENTID, process.env.CLIENTSECRET, config, onInstallation);
} else {
    console.log('Error: Please specify either one of: TOKEN or both CLIENTID and CLIENTSECRET in the environment');
    process.exit(1);
}

//if (!beepBoop) {
//    var controller = Botkit.slackbot(config).configureSlackApp(
//        {
//            clientId: process.env.clientId,
//            clientSecret: process.env.clientSecret,
//            scopes: ['bot'],
//        }
//    );
//    controller.setupWebserver(process.env.PORT, function (err, webserver) {
//        controller.createWebhookEndpoints(controller.webserver);
//
//        controller.createOauthEndpoints(controller.webserver, function (err, req, res) {
//            if (err) {
//                res.status(500).send('ERROR: ' + err);
//            } else {
//                res.send('Success!');
//            }
//        });
//    });
//
//    controller.on('create_bot', function (bot, config) {
//
//        if (_bots[bot.config.token]) {
//            // already online! do nothing.
//        } else {
//
//            if (!err) {
//                trackBot(bot);
//            }
//
//            bot.startRTM(function (err, bot, payload) {
//
//
//                bot.startPrivateConversation({user: config.createdBy}, function (err, convo) {
//                    if (err) {
//                        console.log(err);
//                    } else {
//                        convo.say('I am a bot that has just joined your team');
//                        convo.say('You must now /invite me to a channel so that I can be of use!');
//                    }
//                });
//
//            });
//        }
//    });
//
//}


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

controller.hears('^stop', 'direct_message', function (bot, message) {
    bot.reply(message, 'Goodbye');
    bot.rtm.close();
});

controller.on('direct_message,mention,direct_mention', function (bot, message) {
    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    }, function (err) {
        if (err) {
            console.log(err)
        }
        bot.reply(message, 'I heard you loud and clear boss.');
    });
});

//if (!beepBoop) {
//    controller.storage.teams.all(function (err, teams) {
//
//        if (err) {
//            throw new Error(err);
//        }
//
//        // connect all teams with bots up to slack!
//        for (var t  in teams) {
//            if (teams[t].bot) {
//                var bot = controller.spawn(teams[t]).startRTM(function (err) {
//                    if (err) {
//                        console.log('Error connecting bot to Slack:', err);
//                    } else {
//                        trackBot(bot);
//                    }
//                });
//            }
//        }
//
//    })
//}


