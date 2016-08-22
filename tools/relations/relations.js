var accessToken = null;
var count = 0;
var rCount = 0; //length of relatedList
var aCount = 0; //length of artistList
var artistList = {}; //list of saved artist ids and their frequencies
var relatedList = {}; //list of related artist ids and their frequencies
var idNames = {}; //index is artist ID, value is artist name as a string
var relOrder = []; //sortable version of relatedList
var artOrder = []; //sortable version of artistList
var numRel = 5; //number of related artists per saved artist to use
var numToShow = 10; //number of related artists to display
var eachArtistOnce = true; //if true, if there are multiple saved tracks by one artist, it will only add their related artists once
var removeSavedArtists = false; //if true removes any related artists that are also a saved artist

function error(msg) {
    info(msg);
}

function info(msg) {
    $("#info").text(msg);
}

function authorizeUser() {
    var client_id = '3792a5d756f443fd9aaeee46523168a5';
    var redirect_uri = 'http://localhost:8000/MySavedTracks';

    var url = 'https://accounts.spotify.com/authorize?client_id=' + client_id +
        '&response_type=token' +
        '&scope=user-library-read' +
        '&redirect_uri=' + encodeURIComponent(redirect_uri);
    document.location = url;
}

function parseArgs() {
    var hash = location.hash.replace(/#/g, '');
    var all = hash.split('&');
    var args = {};
    _.each(all, function(keyvalue) {
        var kv = keyvalue.split('=');
        var key = kv[0];
        var val = kv[1];
        args[key] = val;
    });
    return args;
}

function fetchCurrentUserProfile(callback) {
    var url = 'https://api.spotify.com/v1/me';
    callSpotify(url, null, callback);
}

function fetchSavedTracks(callback) {
    var url = 'https://api.spotify.com/v1/me/tracks';
    callSpotify(url, {}, callback);
}

function fetchRelatedArtists(artistId, callback) {
    var url = 'https://api.spotify.com/v1/artists/' + artistId + '/related-artists';
    callSpotify(url, {}, callback);
}

function callSpotify(url, data, callback) {
    $.ajax({
        url: url,
        dataType: 'json',
        data: data,
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        success: function(r) {
            callback(r);
        },
        statusCode: {
            429: function(r) {
                console.log("hi");
                var retryAfter = r.getResponseHeader('Retry-After');
                console.log("TMR, Retry-After: " + retryAfter);
                retryAfter = parseInt(retryAfter);
                if(retryAfter >= 0) {
                    console.log("RA " + retryAfter);
                }
            },
            502: function(r) {
                console.log("five oh two");
                callback(r);
            }
        }
    });
}

function getArtists(tracks) {
    // var list = $("#item-list");

    if(tracks == null) {
        console.log("tmr tracks");
    }

    // if (tracks.offset == 0) {
    //     $("#main").show();
    //     $("#intro").hide();
    //     $("#item-list").empty();
    //     info("");
    // }

    //iterate through each saved track
    _.each(tracks.items, function(item) {

        var id = item.track.artists[0].id; //artist ID

        if(artistList[id] != null) { //artist prev found, increment freq
            artistList[id] += 1;
        } else { //new artist, add id to artist list, add name to id list
            aCount++;
            idNames[id] = item.track.artists[0].name;
            console.log(item.track.artists[0].name);
            artistList[id] = 1;
            artOrder.push(id);
            addRelated(id); //add artist's related artists to relList
        }

        // var artistName = item.track.artists[0].name;
        // var itemElement = $("<div>").text(item.track.name + ' - ' + artistName);
        // list.append(itemElement);
    });

    if (tracks.next) {
        callSpotify(tracks.next, {}, function(tracks) {
            getArtists(tracks);
        });
    } else {
        console.log("done getting tracks");
        removeSavedFromRelated();
    }
    // var len = 0;
    // var x;

    // for (x in relatedList) {
    //     console.log("x: " + x);
    //     if (relatedList.hasOwnProperty(x)) {
    //         len++;
    //     }
    // }
    // console.log(len);
}

function removeSavedFromRelated() {
    //for each related artist
    //check if id is also in artistList
    //if so, remove it from relatedList
    console.log("rsfr");
    if(rCount == 0) {
        return;
    }
    for(var index in relatedList) {
        if (relatedList.hasOwnProperty(index)) {
            if(artistList[index] != null) {
                delete relatedList[index];
            }
            var attr = relatedList[index];
            // console.log(index);
            // console.log(attr);
        }
    }
    displayLists();
}
function addRelated(id) {
    count++;
    //console.log(count);

    fetchRelatedArtists(id, function(rels) {
        if(rels == null) {
            console.log("tmr related");
            //check Retry-After header
        }
        var idVal = artistList[id];

        for(var i = 0; i < numRel; i++) {

            var j = 0;
            if(eachArtistOnce)
                idVal = 1;

            for(; j < idVal; j++) {
                var rID = rels.artists[i].id;

                if(relatedList[rID] != null) {
                    relatedList[rID] += 1;
                } else {
                    rCount++;
                    idNames[rID] = rels.artists[i].name;
                    relatedList[rID] = 1;
                    relOrder.push(rID);
                }
            }
        }
    });
}

function displayLists() {
    //calculate top X related artists
    //display artist names and frequencies
    relOrder.sort(function(a, b) {
        //console.log("r[" + a + "] = " + relatedList[a] + "- r[" + b + "] = " + relatedList[b]);
        return relatedList[b] - relatedList[a];
    });
    artOrder.sort(function(a, b) {
        return artistList[b] - artistList[a];
    });

    var Rlist = $("#related-list");
    var Alist = $("#artist-list");
    $("#main").show();
    $("#intro").hide();
    $("#artist-list").empty();
    info("");

    for(var i = 0; i < artOrder.length; i++) {
        var id = artOrder[i];
        var name = idNames[id];
        var freq = artistList[id];
        // console.log("ID: " + id + " Name: " + name + " Count: " + freq);
        if(freq != null && freq > 1) {
            var itemElement = $("<div>").text(name + " - " + freq);
            Alist.append(itemElement);
        }
    }

    $("#related-list").empty();
    info("");

    for(var i = 0; i < relOrder.length; i++) {
        var id = relOrder[i];
        var name = idNames[id];
        var freq = relatedList[id];
        //console.log("ID: " + id + " Name: " + name);
        if(freq != null && freq > 1) {
            var itemElement = $("<div>").text(name + " - " + freq);
            Rlist.append(itemElement);
        }
    }
}



$(document).ready(
    function() {
        var args = parseArgs();

        if ('access_token' in args) {
            accessToken = args['access_token'];
            $("#go").hide();
            info('Getting your user profile');
            fetchCurrentUserProfile(function(user) {
                if (user) {
                    $("#who").text(user.id);
                    info('Getting your saved tracks');
                    fetchSavedTracks(function(data) {
                        if (data) {
                            getArtists(data);
                        } else {
                            error("Trouble getting your saved tracks");
                        }
                    });
                } else {
                    error("Trouble getting the user profile");
                }
            });
        } else {
            $("#go").show();
            $("#go").on('click', function() {
                authorizeUser();
            });
        }
    }
);