const { Client, Intents, GuildAuditLogs, InteractionCollector } = require('discord.js');
const { token, clientID, appID} = require('./config.json');  // FROM GITHUB <-- IF YOU'RE SOURCING THIS CODE SUPPLY YOUR OWN
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
const client = new Client({ intents: myIntents, partials : ['CHANNEL', 'MESSAGE']});

var connection = {};
// juicer

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
    var channelID = message.member.voice.channelId;
    var guild = message.guild;
    if(cmdItr === -1){
        cmdStr = message.content;
    }
    if(message.content.includes('juice') && message.author.id !== '908440093193285632'){ // hehe
        cmdChannel = message.channel;
        message.reply("You mention the juice? Good stuff homie.")
        //message.reply("I take a dump on yo shit lil wally boi dont be messin with the juice word like that")
    }

    CustomIndexOf = (str, comp, minItr) =>{
        var itr = str.indexOf(comp, minItr)
        // override Index of here for the case I need
        if(itr == -1)
            return str.length+1
        return itr;
    }
    
    if(cmdStr === ')bMode'){       
        console.log(message.reference);
        if(message.reference !== null){
            var vowelSet = new Set();
            vowelSet.add('a');
            vowelSet.add('e');
            vowelSet.add('i');
            vowelSet.add('o');
            vowelSet.add('u');
            vowelSet.add('A');
            vowelSet.add('E');
            vowelSet.add('I');
            vowelSet.add('O');
            vowelSet.add('U');
            var bString = "";
            message.channel.messages.fetch(message.reference.messageId)
            .then(message =>{
                bString = message.content;
            })
            .then(function(){
                console.log(bString);               
                for(var i=0; i<bString.length-1; i++){
                    if(((bString[i] >= 'A' && bString[i] <= 'Z') || (bString[i] >= 'a' && bString[i] <= 'z')) && vowelSet.has(bString[i+1])){
                        bString = bString.substring(0, i) + "B" + bString.substring(i+1); // all this dynamic stuff and strings are immutable???
                    }
                    // iterate to first element of every word
                    var itr = Math.min(CustomIndexOf(bString, " ", i), CustomIndexOf(bString, "-", i), CustomIndexOf(bString, ",", i),
                                       CustomIndexOf(bString, "#", i), CustomIndexOf(bString, "&", i), CustomIndexOf(bString, "(", i),
                                       CustomIndexOf(bString, ":", i), CustomIndexOf(bString, "_", i), CustomIndexOf(bString, "@", i));
                    console.log(itr);
                    if(itr >= bString.length+1)
                        break;
                    i = itr;
                }
                console.log(bString);
            })
            .then(function(){
                message.channel.send(bString);
            })
        }
    }
   
    cmdStr = cmdStr.toLowerCase();
    // commands for playing an item
    if(cmdStr === ')play' || cmdStr === ')playnow'){

        connection = joinVoiceChannel({
            selfDeaf: false,
            selfMute: false,
            channelId: channelID,
            guildId: guildID,
            adapterCreator: guild.voiceAdapterCreator,
        });

        cmdChannel = message.channel;
        searchQuery = message.content.substring(cmdItr+1);
        console.log(searchQuery)
        var channelID = message.member.voice.channelId;
        // if connection bugs, restate to connection[guildID]
        var vidItem = await infoFetcher.getPlayData(searchQuery);
        Boombox[guildID] = Boombox[guildID] || new DiscQueue();
        if(vidItem instanceof Array){
            console.log("array")
            Boombox[guildID].handleMassQueuePush(vidItem, cmdChannel, connection, searchQuery) ;
        }
        else{
            console.log("not array")
            cmdStr === ')play' ? Boombox[guildID].handleQueuePush(vidItem, cmdChannel, connection) : 
                                 Boombox[guildID].handleQueueFrontInsertInit(vidItem, cmdChannel, connection);
        }
    }
    
    if(cmdStr === ')makemix'){
        connection = joinVoiceChannel({
            selfDeaf: false,
            selfMute: false,
            channelId: channelID,
            guildId: guildID,
            adapterCreator: guild.voiceAdapterCreator,
        });
        cmdChannel = message.channel;
        searchQuery = message.content.substring(cmdItr+1);
        var channelID = message.member.voice.channelId;
        var vidItem = await infoFetcher.getYTmixPlayData(searchQuery);
        Boombox[guildID] = Boombox[guildID] || new DiscQueue();
        Boombox[guildID].handleMassQueuePush(vidItem, cmdChannel, connection, searchQuery) ;
    }

    if(cmdStr === ')pause'){
        Boombox[guildID].pausePlayer();
    }

    if(cmdStr === ')resume'){
        Boombox[guildID].resumePlayer();
    }
    
    if(cmdStr === ')skip'){
        Boombox[guildID] = Boombox[guildID] || new DiscQueue();
        Boombox[guildID].handleQueuePop(cmdChannel);
    }

    if(cmdStr === ')clear'){
        Boombox[guildID] = Boombox[guildID] || new DiscQueue();
        Boombox[guildID].handleQueueClear(cmdChannel);
    }

    if(cmdStr === ')2fast2furious'){
        Boombox[guildID] = Boombox[guildID] || new DiscQueue();
        cmdChannel = message.channel;
        var channelID = message.member.voice.channelId;
        const playItem = {
            'url' : 'https://www.youtube.com/watch?v=aGmMyeq9c34',
            'title' : 'SLOBBY SLUBBIES'
        }

        connection = joinVoiceChannel({
            selfDeaf: false,
            selfMute: false,
            channelId: channelID,
            guildId: guildID,
            adapterCreator: guild.voiceAdapterCreator,
        });

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

    if(cmdStr === ')shuffle'){
        Boombox[guildID] = Boombox[guildID] || new DiscQueue()
        var isShuffled = Boombox[guildID].shuffleQueue();
        if(isShuffled)
            message.channel.send("Shuffle is Enabled");
        else
            message.channel.send("Shuffle is Disabled");
    }
    
    if(cmdStr === ')history'){
        Boombox[guildID] = Boombox[guildID] || new DiscQueue()
        console.log("view history")
        if(Boombox[guildID].getHistSize() === 0)
            message.channel.send("Nothing played recently");
        else
            message.channel.send({embeds: [Boombox[guildID].displayHistory()]});
    }

    if(cmdStr === ')queue'){
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

    if(cmdStr === ')faq'){
        message.channel.send({embeds: [EmbedMessages.getFaqEmbed()]});
    }
})

// join link: https://discord.com/api/oauth2/authorize?client_id=908440093193285632&permissions=294258990657&scope=bot%20applications.commands