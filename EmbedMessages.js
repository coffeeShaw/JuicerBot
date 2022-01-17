const { MessageEmbed } = require('discord.js');


class EmbedMessages{
    static getCommandEmbed = () =>{
        const CmdEmbed = new MessageEmbed()
            .setTitle('Command List')
            .setDescription('This is how Juicer juices')
            .addFields(
                {name: '\u200b', value: '-'},
                {name: 'Player commands', value: 'for juicing'},
                {name: ')play [keywords/url]', value: 'Adds a song to the current queue. Plays song immediately if queue is empty.'},
                {name: ')playnow [keywords/url]', value: 'Plays song immediately, pushing every other song back in the queue.'},
                {name: ')makemix [keywords]', value: 'Searches for songs related to the input param and builds a mix. Pushes to queue.'},
                {name: ')playback', value: 'Plays song that most recently ended, adds to front of queue.'},
                {name: ')playback [num]', value: 'Plays song that was played \'num\' songs ago, adds to front of queue.'},
                {name: ')skip', value: 'Skips current song in the queue.'},
                {name: ')pause', value: 'Pauses track that is currently playing.'},
                {name: ')resume', value: 'Resumes track that was playing before pause.'},
                {name: ')shuffle', value: 'Plays tracks in the queue in random order, toggles on/off'},
                {name: '\u200b', value: '-'},
                {name: 'List commands', value: 'for listing'},
                {name: ')queue', value: 'Displays all songs in the queue, including the song currently playing.'},
                {name: ')history', value: 'Displays up to previous 10 songs played'},
                {name: '\u200b', value: '-'},
                {name: 'Other commands', value: 'for other things'},
                {name: ')commands', value: 'Well, I mean, you probably figured this one out.'},
                {name: ')faq', value: 'If you have questions about why Juicer works in certain ways, or other things.'}
            )
        return CmdEmbed;
    }

    static getFaqEmbed = () =>{
        const FaqEmbed = new MessageEmbed()
            .setTitle('Frequently asked questions')
            .setDescription('This is why Juicer juices the way that it does')
            .addFields(
                {name: 'I put in a link from spotify but it didn\'t work. How come?', 
                 value: 'Due to how Spotify works, it isn\'t actually possible play songs from Spotify due to the encryption they ' +
                 'use. What Juicer and most other bots actually do is get the artist and song information from spotify, then search it from ' +
                 'other sources like Youtube. If a song doesn\'t show up properly, it\'s the result of a song being on Spotify but not Youtube'},
                {name: '\u200b', value: '-'},
                {name: 'Why can\'t I copy the url for a mix/playlist from youtube to play all the songs in said mix/playlist?', 
                 value: 'First, we have to distinguish between mixes and playlists because Youtube does this. As of current, there' +
                 'there is no way to directly pull a mix from Youtube into a music bot, and Juicer attempts to solve this with the )makemix command' +
                 'that builds custom mixes from user input. As for playlists... Well, yeah dev is just kinda lazy. There will most likely be functionality soon.'},
                {name: '\u200b', value: '-'},
                {name: 'Why do certain songs just outright not work on Juicer?', 
                 value: 'There can be a plethora of reasons. Because of how Discord bots link to Youtube, sometimes there are gaps ' +
                 'in what we can do. One of the biggest issues is age restriction. If a video is age restricted, a bot cannot play it due to not having an account ' +
                 'to log into. Other reasons can range from a video being removed/privated to being unavailable in a certain region.'},
                {name: '\u200b', value: '-'},
                {name: 'What\'s the deal with Juicer\'s profile pic?', 
                 value: 'Dev spent several minutes sweating away in MS paint to build the most accurate and welcoming depiction of a lemon possible. ' +
                 'Please appreciate it, he needs the confidence boost in his art skills.'}
            )
        return FaqEmbed;
    }
}

module.exports.EmbedMessages = EmbedMessages;