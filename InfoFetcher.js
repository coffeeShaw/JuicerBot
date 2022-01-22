const axios = require('axios');
const he = require('he'); // decode html entities
const { YoutubeID_1, YoutubeID_2, YoutubeID_3, YoutubeID_4, YoutubeID_5, YoutubeID_6, Spotify_Token, Spotify_ID} = require('./config.json');  // FROM GITHUB <-- IF YOU'RE SOURCING THIS CODE SUPPLY YOUR OWN
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
        else if(searchQuery.includes('open.spotify.com/playlist')){
            var itr = searchQuery.indexOf("/playlist") + 10; 
            var sItr = searchQuery.indexOf("?"); 
            var sq = "";
            if(sItr !== -1)
                sq = searchQuery.substring(itr, sItr);
            else
                sq = searchQuery.substring(itr);
            console.log(sq);
           return await this.getPlaylistDataSpotify(sq);
        }
        else{
            return await this.getPlayDataYT(searchQuery);
        }
    }

    async getPlayDataYT(searchQuery){   
        var vidID, vidName;
        var playObj = {};
        // if a single video
        await axios.get("https://www.googleapis.com/youtube/v3/search", {
            params: {
                part: "snippet",
                maxResults: 1,
                key: YoutubeID_6,
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

    // we can't actually pull generated mixes from youtube, but we can create our own with a couple custom params
    async getYTmixPlayData(searchQuery){
        var mixID, mixTitle;
        var sourceObj;
        var playObjs = [];
        await axios.get("https://www.googleapis.com/youtube/v3/search", {
            params: {
                part: "snippet",
                maxResults: 1,
                key: YoutubeID_1,
                q: searchQuery,
                type: "video",
            }
        })
        .then(function (response) {
            mixID = response.data.items[0].id.videoId;
            mixTitle = response.data.items[0].snippet.title;
            mixTitle = he.decode(mixTitle);
            const playObj = {
                'url': 'https://www.youtube.com/watch?v=' + mixID,
                'title': mixTitle
            }
            playObjs.push(playObj);
        })
        
        await axios.get("https://www.googleapis.com/youtube/v3/search", {
            params: {
                part: "snippet",
                maxResults: 25,
                key: YoutubeID_1,
                relatedToVideoId: mixID,
                type: "video",
            }
        })
        .then(function(response){
            // HANDLE exception where videos have been deleted or aren't available
            console.log(response.data.items.length);
            for(var i=0; i<response.data.items.length; i++){
                // HANDLE exception where videos have been deleted or aren't available
                var item = response.data.items[i];
                if(typeof(item.snippet) !== "undefined"){
                    var vidID = response.data.items[i].id.videoId;
                    var vidName = response.data.items[i].snippet.title;
                    vidName = he.decode(vidName);
                    const playObj = {
                        'url': 'https://www.youtube.com/watch?v=' + vidID,
                        'title': vidName
                    }
                    playObjs.push(playObj);
                }
            }
            for(var i=0; i<response.data.items.length; i++){
                console.log(playObjs[i]);
            }
        })
        return playObjs;
    }

    async getPlaylistDataSpotify(searchQuery){
        var AccessToken = "";
        var songData = [];
        var dataRes = [];
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
            console.log(AccessToken);
        })
        await axios.get('https://api.spotify.com/v1/playlists/' + searchQuery ,{
            headers: {
                'Authorization' : 'Bearer ' + AccessToken,
                'Content-Type': 'application/json' 
            },
        })
        .then(res =>{
           dataRes = res.data.tracks.items;
        })
        console.log(dataRes.length);
        for(var i=0; i<dataRes.length; i++){
            console.log(i);
            console.log(dataRes[i].track.name);
            console.log(dataRes[i].track.artists[0].name);
            var vidID, vidName;
            await axios.get("https://www.googleapis.com/youtube/v3/search", {
                params: {
                    part: "snippet",
                    maxResults: 1,
                    key: YoutubeID_3,
                    q: dataRes[i].track.name + " " + dataRes[i].track.artists[0].name,
                    type: "video",
                },
            })
            .then(function (response) {
                vidID = response.data.items[0].id.videoId;
                vidName = response.data.items[0].snippet.title;
                vidName = he.decode(vidName);
                songData.push({
                    'url': 'https://www.youtube.com/watch?v=' + vidID,
                    'title': vidName
                })
            })
        }
        return songData;
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