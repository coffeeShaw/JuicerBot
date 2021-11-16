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
                {name: ')playback', value: 'Plays song that most recently ended, adds to front of queue.'},
                {name: ')playback [num]', value: 'Plays song that was played \'num\' songs ago, adds to front of queue.'},
                {name: ')skip', value: 'Skips current song in the queue.'},
                {name: '\u200b', value: '-'},
                {name: 'List commands', value: 'for listing'},
                {name: ')viewqueue', value: 'Displays all songs in the queue, including the song currently playing.'},
                {name: ')viewhistory', value: 'Displays up to previous 10 songs played'},
                {name: '\u200b', value: '-'},
                {name: 'Other commands', value: 'for other things'},
                {name: ')commands', value: 'Well, I mean, you probably figured this one out.'},
                {name: ')syfing', value:'???'}
            )
        return CmdEmbed;
    }
}


module.exports.EmbedMessages = EmbedMessages;