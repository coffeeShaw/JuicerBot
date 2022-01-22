const he = require('he'); // decode html entities
const play = require('play-dl'); // alternative to ytdl bc aborting
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

class DiscQueue{

    constructor(){
        this.MAX_QUEUE_SIZE = 40;
        this.MAX_HISTORY_SIZE = 10;
        this.playQueue = [];
        this.histQueue = [];
        this.stream = -1;
        this.resource = -1;
        this.player = -1;
        this.connection = -1;
        this.ShuffleEnabled = false;
        this.IndexCurrentlyPlaying = 0; // only necessary when shuffling
    }
    
    async playVid (vid, cmdChannel, conn){
        const playEmbed = new MessageEmbed()
        .setTitle('Now playing')
        .setColor('YELLOW')
        .setDescription('[' + vid.title + '](' + vid.url + ')');
        cmdChannel.send({embeds: [playEmbed]});
        console.log("playing " + vid.url);
        this.stream = await play.stream(vid.url)
        this.resource = createAudioResource(this.stream.stream, { inputType: this.stream.type });
        console.log("resource built");
        console.log(typeof(this.player))
        if(typeof(this.player) !== "object" ){
            console.log('creating player')
            this.player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play
                }
            });
            var self = this;    // need reference to this for listener
            this.player.on(AudioPlayerStatus.Idle, function(){self.handleQueuePop(cmdChannel)});
            this.player.setMaxListeners(1);
        }
        this.player.play(this.resource);
        console.log("playing");
        this.connection = conn;
        this.connection.subscribe(this.player);
        console.log("connected");
    }

    pausePlayer = () =>{
        if(typeof(this.player) === "object" )
            this.player.pause()
    }

    resumePlayer = () =>{
        if(typeof(this.player) === "object" )
            this.player.unpause()
    }

    // toggle shuffle mode, return state so we can send message to channel
    shuffleQueue = () =>{
        this.shuffleEnabled = !this.shuffleEnabled;
        return this.shuffleEnabled;
    }

    // returns size of playQueue
    getQueueSize = () =>{
        return this.playQueue.length;
    }

    // returns size of histQueue
    getHistSize = () =>{
        return this.histQueue.length;
    }

    // pushes new playback object to back of queue, plays object if it is in the front of the queue
    handleQueuePush = (vidItem, cmdChannel, conn) => {
        console.log("pushing item")
        this.playQueue.push(vidItem);
        console.log('checking play')
        //return playQueue[0]; 
        if(this.playQueue.length === 1){
            this.playVid(this.playQueue[0], cmdChannel, conn);
        }
        else{
            const pushEmbed = new MessageEmbed()
            .setTitle('Added To Queue')
            .setDescription('[' + vidItem.title + '](' + vidItem.url + ')')
            .setColor('YELLOW');
            cmdChannel.send({embeds: [pushEmbed]});
        } 
    }

    handleMassQueuePush  = (vidItems, cmdChannel, conn) => {
        var validItems = 0;
        var firstValid = -1; // edge case for where 0 is not a valid index in vidItems
        for(var i=0; i<vidItems.length; i++){
            if(typeof(vidItems[i]) !== "undefined"){
                this.playQueue.push(vidItems[i]);
                validItems++;
                if(firstValid == -1)
                    firstValid = i;
            }
        }
        if(this.playQueue.length == validItems)
            this.playVid(this.playQueue[firstValid], cmdChannel, conn);
        const mixEmbed = new MessageEmbed()
        .setTitle('Mix Added to Queue')
        .setDescription('Mix Source: ' + '[' + vidItems[0].title + '](' + vidItems[0].url + ')')
        .setColor('YELLOW');
        cmdChannel.send({embeds: [mixEmbed]});
    }

    // pushes new playback object to front of queue, returns object in front of queue
    handleQueueFrontInsert = (vidItem, cmdChannel) => {
        if(this.playQueue.length === 0){
            this.playQueue.push(vidItem);
        }
        else{
            this.playQueue.unshift(vidItem)
        }
        this.playVid(this.playQueue[0], cmdChannel, this.connection);
    }

    // pushes new playback object to front of queue, returns object in front of queue, sets new connection (in case called before normal push)
    handleQueueFrontInsertInit = (vidItem, cmdChannel, conn) => {
        if(this.playQueue.length === 0){
            this.playQueue.push(vidItem);
        }
        else{
            this.playQueue.unshift(vidItem)
        }
        this.playVid(this.playQueue[0], cmdChannel, conn);
    }

    handlePlayHistory = (vidItem) => {
        console.log(vidItem);
        if(this.histQueue.length >= this.MAX_HISTORY_SIZE){
            this.histQueue.shift();
        }
        this.histQueue.push(vidItem);
    }
    
    //plays song from history (indexes are inverted, so index 0 passed will be last element in the queue)
    playFromHistory = (index, cmdChannel) =>{
        if(this.histQueue.length-index >= 0 && index < this.histQueue.length){
            if(this.histQueue.length > 0){
                this.handleQueueFrontInsert(this.histQueue[this.histQueue.length-index-1], cmdChannel)
            }
        }
        else{
            cmdChannel.send('Nothing to play this far back in the history queue!');
        }
    }
    
    // removes object in front of queue, then returns new front of queue
    handleQueuePop = (cmdChannel) =>{
        console.log(this.playQueue.length)
        if(this.playQueue.length > 0){
            if(!this.shuffleEnabled){
                if(this.IndexCurrentlyPlaying != 0){
                    this.handlePlayHistory(this.playQueue[this.IndexCurrentlyPlaying]);
                    this.playQueue.splice(this.IndexCurrentlyPlaying, 1);
                }
                else{
                    this.handlePlayHistory(this.playQueue[0]);
                    this.playQueue.shift();
                }
                this.IndexCurrentlyPlaying = 0;
                if(this.playQueue.length > 0)
                    this.playVid(this.playQueue[0], cmdChannel, this.connection);
            }
            else{
                this.handlePlayHistory(this.playQueue[this.IndexCurrentlyPlaying]);
                this.playQueue.splice(this.IndexCurrentlyPlaying, 1);
                if(this.playQueue.length > 0){
                    this.IndexCurrentlyPlaying = Math.floor(Math.random() * this.playQueue.length);
                    this.playVid(this.playQueue[this.IndexCurrentlyPlaying], cmdChannel, this.connection);
                }
            }
        }
        if(this.playQueue.length === 0){
            console.log(this.player)
            if(typeof(this.player) !== "object" ){  // base case we have no player yet (skip called before play), init player
                console.log('creating player')
                this.player = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Play
                    }
                });
                var self = this;    // need reference to this for listener
                this.player.on(AudioPlayerStatus.Idle, function(){self.handleQueuePop(cmdChannel)});
                this.player.setMaxListeners(1);
            }
            this.player.pause();
        }
    }

    handleQueueClear = (cmdChannel) =>{
        while(this.playQueue.length > 1){
            this.playQueue.pop();
        }
        cmdChannel.send('Nuking the juice.');        
    }

    displayHistory = () =>{
        this.histQueue = this.histQueue || []
        const histEmbed = new MessageEmbed()
        var curr = "";
        for(var i = this.histQueue.length-1; i >= 0; i--){
            console.log(this.histQueue[i]);
            curr += this.histQueue.length-i + ": " + '[' + this.histQueue[i].title + '](' + this.histQueue[i].url + ')' + "\n"
        }
        histEmbed.setTitle('Play History');
        histEmbed.setDescription(curr);
        histEmbed.setColor('YELLOW')
        return histEmbed;
    }
    
    displayQueue = () =>{
        this.playQueue = this.playQueue || []
        const queueEmbed = new MessageEmbed()
        var curr = "";
        queueEmbed.setTitle('Current Queue');
        if(!this.shuffleEnabled){
            var shuffleOffset = 0;
            curr += '*Now Playing:*  ' + '[' + this.playQueue[this.IndexCurrentlyPlaying].title + '](' + this.playQueue[this.IndexCurrentlyPlaying].url + ')' + '\n\n'
            for(var i = 0; i < this.playQueue.length; i++){
                console.log(this.playQueue[i]);
                if(i != this.IndexCurrentlyPlaying){
                    if(i === 0)
                        shuffleOffset++;
                    curr += (i+shuffleOffset) + ': ' + '[' + this.playQueue[i].title + '](' + this.playQueue[i].url + ')' + '\n'
                }
                else if(i !== 0)
                    shuffleOffset--;
            }
        }
        else if(this.playQueue.length > 0){
            curr += '(*Shuffle Is Enabled. These are all songs currently enqueued*)\n\n'
            curr += '*Now Playing:* ' + '[' + this.playQueue[this.IndexCurrentlyPlaying].title + '](' + this.playQueue[this.IndexCurrentlyPlaying].url + ')' + '\n\n'
            for(var i = 0; i < this.playQueue.length; i++){
                curr += '[' + this.playQueue[i].title + '](' + this.playQueue[i].url + ')' + '\n'
            }
        }
        queueEmbed.setDescription(curr);
        queueEmbed.setColor('YELLOW')
        return queueEmbed;
    }
}
module.exports.DiscQueue = DiscQueue;