const axios = require('axios');
const he = require('he'); // decode html entities
const { YoutubeID_1, YoutubeID_2, Spotify_Token, Spotify_ID} = require('./config.json');  // FROM GITHUB <-- IF YOU'RE SOURCING THIS CODE SUPPLY YOUR OWN
class InfoFetcher{
    constructor(){
        
    }

    async getPlayData(searchQuery){
        // search for spotify
        if(searchQuery.includes('open.spotify.com/track')){
            var itr = searchQuery.indexOf("/track") + 7; 
            var sItr = searchQuery.indexOf("?"); 
            var sq = "";
            if(sItr !== -1)
                sq = searchQuery.substring(itr, sItr);
            else
                sq = searchQuery.substring(itr);
            console.log(sq);
           return await this.getPlayDataSpotify(sq);
        }
        else{
            return await this.getPlayDataYT(searchQuery);
        }
    }

    async getPlayDataYT(searchQuery){   
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
            console.log(response.data);
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

    // discord can't actually play directly from spotify, get artist info from link and play song from youtube
    async getPlayDataSpotify(searchQuery){   
        var AccessToken = "";
        var songData = {}
        await axios({
            url: 'https://accounts.spotify.com/api/token',
            method: 'post',
            params: {
                grant_type: 'client_credentials'
            },
            headers: {
                'Accept':'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            auth: {
                username: Spotify_ID,
                password: Spotify_Token
            }
          })
        .then(function(response) {
                AccessToken = response.data.access_token;
        })
        await axios.get('https://api.spotify.com/v1/tracks/' + searchQuery ,{
            headers: {
                'Authorization' : 'Bearer ' + AccessToken,
                'Content-Type': 'application/json' 
            },
            params: {
                q: "Green Grass"
            }
        })
        .then(res =>{
           songData = res.data;
        }) 
        .then(function(){
            songData = songData.artists[0].name + " " + songData.name;    
            console.log(songData);
        })

        var vidID, vidName;
        var playObj = {};
        await axios.get("https://www.googleapis.com/youtube/v3/search", {
            params: {
                part: "snippet",
                maxResults: 1,
                key: YoutubeID_2,
                q: songData,
            },
        })
        .then(function (response) {
            vidID = response.data.items[0].id.videoId;
            vidName = response.data.items[0].snippet.title;
            vidName = he.decode(vidName);
            songData = {
                'url': 'https://www.youtube.com/watch?v=' + vidID,
                'title': vidName
            }
        })
        console.log(songData + " second")
        return songData;
    } 
}
module.exports.InfoFetcher = InfoFetcher;