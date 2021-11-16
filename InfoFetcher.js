const YID = 'AIzaSyDVsDvSM9_I1pP6fhuEZPkFTVodvzUyS3A';
//const YID = 'AIzaSyAtRbbaV9DPG1Gqto87QEoTcwdb-le5kNI';
const axios = require('axios');
const he = require('he'); // decode html entities
const { YoutubeID_1, YoutubeID_2} = require('./config.json');  // FROM GITHUB <-- IF YOU'RE SOURCING THIS CODE SUPPLY YOUR OWN
class InfoFetcher{
    constructor(){
        
    }

    async getPlayData(searchQuery){
        var vidID, vidName;
        var playObj = {};
        await axios.get("https://www.googleapis.com/youtube/v3/search", {
            params: {
                part: "snippet",
                maxResults: 1,
                key: YoutubeID_1,
                q: searchQuery,
            },
        })
        .then(function (response) {
            for(var i=0; i<100000; i++){

            }
            vidID = response.data.items[0].id.videoId;
            vidName = response.data.items[0].snippet.title;
            vidName = he.decode(vidName);
            playObj = {
                'url': 'https://www.youtube.com/watch?v=' + vidID,
                'title': vidName
            }
        })
        return playObj;
    }
}
module.exports.InfoFetcher = InfoFetcher;