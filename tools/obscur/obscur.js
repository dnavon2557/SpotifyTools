var accessToken = null;
var refreshToken = null;
var args = null;
var artistLimit = 50;
var mostObscure = {name: "", popularity: 100}; //contains highest popularity artist value and name
var leastObscure = {name: "", popularity: 0}; //contains lowest popularity artist value and name
var totalObscurity = 0; //total popularity points of all top artists
var artistCount = 0; //total number of top artists avaiable/found
var term = "medium_term";
var dat;

function error(msg) {
    info(msg);
}

function info(msg) {
    $("#info").text(msg);
}

function authorizeUser() {
    var client_id = '7fc1ac4a76fe46fbb0d8b2791512daf2';
    var redirect_uri = 'http://localhost:8000/SpotifyTools/tools/obscur/obscur.html';

    var url = 'https://accounts.spotify.com/authorize?client_id=' + client_id +
        '&response_type=token' +
        '&scope=user-top-read' +
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

function fetchTopArtists(limit, time_range, callback) {
    var url = 'https://api.spotify.com/v1/me/top/artists' +
    '?time_range=' + time_range + '&limit=' + limit;
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
                var retryAfter = r.getResponseHeader('Retry-After');
                retryAfter = parseInt(retryAfter, 10);
                console.log("TMR, Retry-After: " + retryAfter);
                if(!retryAfter) { 
                    retryAfter = 5;
                    console.log("retrying");
                }
                setTimeout(callSpotify(url, data, callback), retryAfter * 1000);
            },
            502: function(r) {
                console.log("five oh two");
                setTimeout(callSpotify(url, data, callback), 2000);
            }
        }
    });
}

function getAverage(data) {
    if(!data) {
        console.log("no data");
    }

    dat = data;

    _.each(data.items, function(item) {
        var name = item.name;
        var popularity = item.popularity;
        totalObscurity += popularity;
        artistCount++;

        console.log(name + ": " + popularity);

        if (popularity > leastObscure['popularity']) {
            console.log("least");
            leastObscure.popularity = popularity;
            leastObscure.name = name;
        }
        if (popularity < mostObscure['popularity']) {
            console.log("most");
            mostObscure.popularity = popularity;
            mostObscure.name = name;
        }
    });

    if (data.next) {
        callSpotify(data.next, {}, function(data) {
            getAverage(data);
        });
    } else {
        console.log("done getting data");
    }

    var rank = totalObscurity/artistCount;
    rank = Math.round(rank*10)/10;

    console.log(totalObscurity + " / " + artistCount);
    console.log(rank);

    $("#main").show();
    $("#intro-text").hide();
    $("#ranking").empty();
    $("#ranking").append($("<h1>").text(rank));
    $("#ranking").append($("<div>").text("Most obscure: " + 
                                        mostObscure.name + ": " + 
                                        mostObscure.popularity ));
    $("#ranking").append($("<div>").text("Least obscure: " + 
                                        leastObscure.name + ": " + 
                                        leastObscure.popularity));
    info("");
    reset();
}

function reset() {

    totalObscurity = 0;
    artistCount = 0;

    mostObscure = {name: "", popularity: 100};
    leastObscure = {name: "", popularity: 0};
}

$(document).ready(
    function() {
        args = parseArgs();
        if ('access_token' in args) {
            accessToken = args['access_token'];
            //refreshToken = args['refresh_token'];
            $("#authorize-button").hide();
            $(":button").on('click', function(event) {
                term = event.toElement.id;
                console.log(term);
                $("#short_term").show();
                $("#medium_term").show();
                $("#long_term").show();
                $("#" + term).hide();
                fetchCurrentUserProfile(function(user) {
                    if (user) {
                        $("#who").text(user.id);
                        info('Getting your ' + term.replace('_', ' ') +  ' rating');
                        fetchTopArtists(artistLimit, term, function(data) {
                            if (data) {
                                getAverage(data);
                            } else {
                                error("Trouble getting your top artists");
                            }
                        });
                    } else {
                        error("Trouble getting the user profile");
                    }
                });
            });
        } else {
            $("#short_term").show();
            $("#short_term").on('click', function() {
                term = "short_term";
                $("#authorize-button").hide();
                authorizeUser();
            });
            $("#medium_term").show();
            $("#medium_term").on('click', function() {
                term = "medium_term";
                $("#authorize-button").hide();
                authorizeUser();
            });
            $("#long_term").show();
            $("#long_term").on('click', function() {
                term = "long_term";
                $("#authorize-button").hide();
                authorizeUser();
            });
            $("#authorize-button").on('click', function() {
                authorizeUser();
                $("#authorize-button").hide();
            });
        }
    }
);