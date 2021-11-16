
// Require the necessary discord.js classes
const discord = require('discord.js')
//const CmdEmbed = require('./CmdEmbed.js')
const { Client, Intents, GuildAuditLogs, InteractionCollector } = require('discord.js');
const { token, clientID, appID} = require('./config.json');  // FROM GITHUB <-- IF YOU'RE SOURCING THIS CODE SUPPLY YOUR OWN
// multiple yids for double quota limit
const YID = 'AIzaSyDVsDvSM9_I1pP6fhuEZPkFTVodvzUyS3A'
//const YID = 'AIzaSyAtRbbaV9DPG1Gqto87QEoTcwdb-le5kNI'
const play = require('play-dl'); // alternative to ytdl bc aborting
const axios = require('axios');
var he = require('he'); // decode html entities
const { MessageEmbed } = require('discord.js');
const {
	AudioPlayerStatus,
	StreamType,
    demuxProbe,
	createAudioPlayer,
	createAudioResource,
	joinVoiceChannel,
	AudioPlayer,
    NoSubscriberBehavior,
    VoiceConnectionStatus,
    getVoiceConnection,
} = require('@discordjs/voice');
const { DiscQueue } = require('./DiscQueue.js');
const { InfoFetcher } = require('./InfoFetcher.js');
const { EmbedMessages } = require('./EmbedMessages.js');
// Create a new client instance
var searchQuery;
const myIntents = new Intents();
var infoFetcher = new InfoFetcher();
myIntents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.DIRECT_MESSAGE_TYPING, Intents.FLAGS.GUILD_MESSAGES,Intents.FLAGS.GUILD_MESSAGE_TYPING);
//myIntents.add(8);
//myIntents.add(1024);
const client = new Client({ intents: myIntents, partials : ['CHANNEL', 'MESSAGE']});

var connection = {};

// holds content
var cmdChannel; 
var Boombox = {};   // object that holds all music players across servers
// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});
client.login(token);

client.on('messageCreate', async message => {
    var cmdItr = message.content.indexOf(" ");          //  get command itr
    var cmdStr = message.content.substring(0, cmdItr);  //  get command
    var guildID = message.guildId;
    var guild = message.guild;
    if(cmdItr === -1){
        cmdStr = message.content;
    }

    // commands for playing an item
    if(cmdStr === ')play' || cmdStr === ')playnow'){
        cmdChannel = message.channel;
        searchQuery = message.content.substring(cmdItr+1);
        console.log(searchQuery)
        var channelID = message.member.voice.channelId;
        // if connection bugs, restate to connection[guildID]
		connection = joinVoiceChannel({
			selfDeaf: false,
			selfMute: false,
			channelId: channelID,
			guildId: guildID,
			adapterCreator: guild.voiceAdapterCreator,
		});
        var vidItem = await infoFetcher.getPlayData(searchQuery);
        console.log('START VID ITEM')
        console.log(vidItem)
        console.log('END VID ITEM')
        if(cmdStr === ')play'){
            Boombox[guildID] = Boombox[guildID] || new DiscQueue();
            Boombox[guildID].handleQueuePush(vidItem, cmdChannel, connection)
        }
        else if(cmdStr === ')playnow'){
            Boombox[guildID] = Boombox[guildID] || new DiscQueue();
            Boombox[guildID].handleQueueFrontInsertInit(vidItem, cmdChannel, connection)
        }   
    }

    if(cmdStr === ')syfing'){
        var channelID = message.member.voice.channelId;
		connection[guildID] = joinVoiceChannel({
			selfDeaf: false,
			selfMute: false,
			channelId: channelID,
			guildId: guildID,
			adapterCreator: guild.voiceAdapterCreator,
		});

        message.channel.send("IT'S HIGH NUN COL CESSIDY");
        const playItem = {
        'playStr' : 'https://www.youtube.com/watch?v=L78yVFeyvRo',
        'songName' : 'Down With The Sickness - Disturbed'
        }
        Boombox[guildID].handleQueueFrontInsertInit(playItem, cmdChannel, connection);
    }
    
    if(cmdStr === ')skip'){
        // handleQueuePop(guildID);
        Boombox[guildID] = Boombox[guildID] || new DiscQueue();
        Boombox[guildID].handleQueuePop(cmdChannel);
    }

    if(cmdStr === ')2fast2furious'){
        Boombox[guildID] = Boombox[guildID] || new DiscQueue();
        cmdChannel = message.channel;
        var channelID = message.member.voice.channelId;
		connection = joinVoiceChannel({
			selfDeaf: false,
			selfMute: false,
			channelId: channelID,
			guildId: guildID,
			adapterCreator: guild.voiceAdapterCreator,
		});
        const playItem = {
            'playStr' : 'https://www.youtube.com/watch?v=aGmMyeq9c34',
            'songName' : 'Speedy slubbies'
        }
        Boombox[guildID].handleQueueFrontInsertInit(playItem, cmdChannel, connection);
    }

    // play item from history. optional addition of index specifier in array (1 based)
    if(cmdStr === ')playback'){
        cmdChannel = message.channel;
        Boombox[guildID] = Boombox[guildID] || new DiscQueue();
        message.channel.send("Rewinding the clock...");
        if(message.content === cmdStr){
            Boombox[guildID].playFromHistory(0, cmdChannel);
        }
        else{
            searchQuery = Number(message.content.substring(cmdItr+1));
            console.log("search query is: " + searchQuery)
            Boombox[guildID].playFromHistory(searchQuery-1, cmdChannel);
        }
    }

    if(cmdStr === ')viewhistory'){
        Boombox[guildID] = Boombox[guildID] || new DiscQueue()
        console.log("view history")
        if(Boombox[guildID].getHistSize() === 0)
            message.channel.send("Nothing played recently");
        else
            message.channel.send({embeds: [Boombox[guildID].displayHistory()]});
    }

    if(cmdStr === ')viewqueue'){
        Boombox[guildID] = Boombox[guildID] || new DiscQueue()
        console.log("view queue");
        if(Boombox[guildID].getQueueSize() === 0)
            message.channel.send("Queue is empty");
        else
            message.channel.send({embeds: [Boombox[guildID].displayQueue()]});
    }

    if(cmdStr === ')commands'){
        message.channel.send({embeds: [EmbedMessages.getCommandEmbed()]});
    }
})

// join link: https://discord.com/api/oauth2/authorize?client_id=908440093193285632&permissions=294258990657&scope=bot%20applications.commands