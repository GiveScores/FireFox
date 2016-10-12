(function () {
    //'use strict';
    var $ = jQuery;
    var vote = $('.vote');
    var feedback = $('.feedback');
    var userVote = 0;

    var overalScore = 2.5;

    var quote = {
        text: "\"The smallest act of kindness is worth more than the grandest intention he smallest act of kindness is worth more\"",
        author: "ko bi drugi"
    };

    var dataBaseApi = "http://45.55.193.78/api";
    var googleApiKey = 'AIzaSyBZg_6uYBHzANuJRkTBpdKshQgnP3K4diw';
    var siteUrl = "";

    function validateEmail(email) {
        var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
        return emailReg.test(email);
    }

    $('.gs-link').click(function () {
        window.open('http://givescores.com');
    });


    var storedEmail, storedOption, storedDuration, storedLang, showLogin = true;

    $(".vote").show();

    chrome.storage.local.get('lastUrl', function (result) {
        if (result.lastUrl != null) {
            siteUrl = result.lastUrl;
        }
    });

    chrome.storage.local.get('userEmail', function (result) {
        if (result.userEmail != null && result.userEmail != "") {
            storedEmail = result.userEmail;
            vote.hide();
            $('.loader').show();

            $.post(dataBaseApi + '/stats', {
                url: siteUrl,
                userEmail: storedEmail
            }, function (res) {
                $('.loader').hide();
                if ('error' in res) {
                    $('.error .error-text').text(res.error);
                    $('.loader').hide();
                    $('.error').show();
                } else {
                    userVote = res.vote;
                    if (res.vote) {
                        showFeedback(res.overalScore, res.quote);
                    } else {
                        vote.show();
                    }
                }
            });

        }  else {
            storedEmail = "";
            chrome.storage.local.get('url', function (result) {

                if (result.url == siteUrl) {

                    chrome.storage.local.get('userVote', function (result2) {
                        if (result2.userVote) {
                            $(".vote").siblings().hide();
                            $(".vote").show();
                            var fullStarsNumber = Math.floor(result2.userVote);
                            var halfStarsNumber = (result2.userVote - Math.floor(result2.userVote) ) / 0.5;

                            //here i need to set score based on vote
                            if (fullStarsNumber === 0) fullStarsNumber = '';
                            if (halfStarsNumber === 0) halfStarsNumber = '';
                            else halfStarsNumber = 'half';
                            $("#star" + fullStarsNumber + halfStarsNumber).prop('checked', true);
                        } else {
                            $(".vote").siblings().hide();
                            $(".vote").show();
                        }
                    });
                } else {
                    $(".vote").siblings().hide();
                    $(".vote").show();
                }

            });
        }
    });


    chrome.storage.local.get('lang', function (result) {
        if (result.lang != null) {
            storedLang = result.lang;
            translateInterface(storedLang);
        } else {
            storedLang = "uk";
        }
    });

    $('.thanks .voteButton').click(function () {
        $('.thanks').hide();
        vote.show();
    })


    $('.voteInput').on('change', function () {
        userVote = $('.voteInput:checked').val();
        $(".overalScore").empty();
        vote.hide();
        $('.feedback').hide();
        $('.loader').show();

        var fullStarsNumber = Math.floor(userVote);
        var halfStarsNumber = ( userVote - Math.floor(userVote) ) / 0.5;

        var i;
        //here i need to set score based on vote
        if (fullStarsNumber === 0) fullStarsNumber = '';
        if (halfStarsNumber === 0) halfStarsNumber = '';
        else halfStarsNumber = 'half';
        $("#fb_star" + fullStarsNumber + halfStarsNumber).prop('checked', true);


        chrome.storage.local.set({'userVote': userVote, 'url': siteUrl});
        $.post(dataBaseApi + '/scores', {
                url: siteUrl,
                language: storedLang,
                score: userVote,
                userEmail: storedEmail,
                browser: "chrome"
            },
            function (data, status) {
                if ('error' in data) {
                    $('.error .error-text').text(data.error);
                    $('.loader').hide();
                    $('.error').show();
                } else {
                    var overalScore = (Math.round(data.overalScore * 2) / 2).toFixed(1);
                    $(".overalScore").empty();
                    var fullStarsNumber = Math.floor(overalScore);
                    var halfStarsNumber = ( overalScore - Math.floor(overalScore) ) / 0.5;
                    var baseStarsNumber = 5 - Math.round(overalScore);
                    quote = data.quote;
                    var i = 0;
                    for (i = 0; i < fullStarsNumber; i++) {
                        $(".overalScore").append("<span class='fa-stack'><i class='fa fa-fw fa-lg fa-star star-active  fa-stack-1x'></i></span>");
                    }
                    for (i = 0; i < halfStarsNumber; i++) {
                        $(".overalScore").append("<span class='fa-stack '><i class='fa fa-fw fa-lg fa-star star-base  fa-stack-1x'></i><i class='fa fa-fw fa-lg fa-star-half fa-stack-1x'></i></span>");
                    }

                    for (i = 0; i < baseStarsNumber; i++) {
                        $(".overalScore").append("<span class='fa-stack '><i class='fa fa-fw fa-lg fa-star star-base  fa-stack-1x'></i></span>");
                    }
                    $('.quote .quoteText').html("\"" + quote.text + "\"");
                    $('.quote .quoteAuthor').html(quote.author);
                    $('.loader').hide();
                    feedback.show();
                    var quotePosition = $('.feedback .quote').offset(),
                        quoteHeight = $('.quote').height();
                    $('body').height(quotePosition.top + quoteHeight);
                }


            });

    });

    function showFeedback(dataOveralScore, dataQuote) {
        var fullStarsNumber = Math.floor(userVote);
        var halfStarsNumber = ( userVote - Math.floor(userVote) ) / 0.5;


        var i;
        //here i need to set score based on vote
        if (fullStarsNumber === 0) fullStarsNumber = '';
        if (halfStarsNumber === 0) halfStarsNumber = '';
        else halfStarsNumber = 'half';

        $("#fb_star" + fullStarsNumber + halfStarsNumber).prop('checked', true);


        var overalScore = (Math.round(dataOveralScore * 2) / 2).toFixed(1);
        $(".overalScore").empty();
        fullStarsNumber = Math.floor(overalScore);
        halfStarsNumber = ( overalScore - Math.floor(overalScore) ) / 0.5;
        baseStarsNumber = 5 - Math.round(overalScore);
        var quote = dataQuote;

        var i = 0;
        for (i = 0; i < fullStarsNumber; i++) {
            $(".overalScore").append("<span class='fa-stack'><i class='fa fa-fw fa-lg fa-star star-active  fa-stack-1x'></i></span>");
        }
        for (i = 0; i < halfStarsNumber; i++) {
            $(".overalScore").append("<span class='fa-stack '><i class='fa fa-fw fa-lg fa-star star-base  fa-stack-1x'></i><i class='fa fa-fw fa-lg fa-star-half fa-stack-1x'></i></span>");
        }

        for (i = 0; i < baseStarsNumber; i++) {
            $(".overalScore").append("<span class='fa-stack '><i class='fa fa-fw fa-lg fa-star star-base  fa-stack-1x'></i></span>");
        }
        $('.quote .quoteText').html("\"" + quote.text + "\"");
        $('.quote .quoteAuthor').html(quote.author);
        $('.loader').hide();
        feedback.show();
        var quotePosition = $('.feedback .quote').offset(),
            quoteHeight = $('.quote').height();
        $('body').height(quotePosition.top + quoteHeight);
    }

    function fbShare() {
        $.post(dataBaseApi + '/social', {
            network: 'fb'
        });
        var shortUrl = '';

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: 'https://www.googleapis.com/urlshortener/v1/url?shortUrl=http://goo.gl/fbsS&key=' + googleApiKey,
            data: '{ longUrl: "' + siteUrl + '" }',
            dataType: "json",
            success: function (res) {
                shortUrl = res.id;
                var status;
                if(userVote == 1){
                    status = userVote + ' star to ' + shortUrl + ', rate anything with GiveScores.com';
                }else{
                    status = userVote + ' stars to ' + shortUrl + ', rate anything with GiveScores.com';
                }
                window.open('https://www.facebook.com/dialog/feed?link=givescores.com&amp;message=' + status + '&amp;app_id=179150165472010&amp;', 'sharer', 'top=200,left=200,toolbar=0,status=0,width=550,height=350');
            }
        });

    }

    function twShare() {
        $.post(dataBaseApi + '/social', {
            network: 'tw'
        });
        var shortUrl = '';

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: 'https://www.googleapis.com/urlshortener/v1/url?shortUrl=http://goo.gl/fbsS&key=' + googleApiKey,
            data: '{ longUrl: "' + siteUrl + '" }',
            dataType: "json",
            success: function (res) {
                shortUrl = res.id;
                var status;
                if(userVote == 1){
                    status = userVote + ' star to ' + shortUrl + ', rate anything with GiveScores.com';
                }else{
                    status = userVote + ' stars to ' + shortUrl + ', rate anything with GiveScores.com';
                }
                window.open('http://twitter.com/intent/tweet?status=' + status, 'sharer', 'top=200,left=200,toolbar=0,status=0,width=550,height=350');

            }
        });
    }

    function gpShare() {
        $.post(dataBaseApi + '/social', {
            network: 'gp'
        });
        var shortUrl = '';

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: 'https://www.googleapis.com/urlshortener/v1/url?shortUrl=http://goo.gl/fbsS&key=' + googleApiKey,
            data: '{ longUrl: "' + siteUrl + '" }',
            dataType: "json",
            success: function (res) {
                shortUrl = res.id;
                var sharelink = "https://plus.google.com/share?url=" + shortUrl;
                window.open(sharelink, 'sharer', 'top=200,left=200,toolbar=0,status=0,width=550,height=350');

            }
        });
    }

    function liShare() {
        $.post(dataBaseApi + '/social', {
            network: 'li'
        });

        var shortUrl = '';

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: 'https://www.googleapis.com/urlshortener/v1/url?shortUrl=http://goo.gl/fbsS&key=' + googleApiKey,
            data: '{ longUrl: "' + siteUrl + '" }',
            dataType: "json",
            success: function (res) {
                shortUrl = res.id;
                var summary;
                if(userVote == 1){
                    summary = userVote + ' star to ' + shortUrl + ', rate anything with GiveScores.com';
                }else{
                    summary = userVote + ' stars to ' + shortUrl + ', rate anything with GiveScores.com';
                }
                var sharelink = "https://www.linkedin.com/shareArticle?mini=true&url=" + shortUrl + "&summary=" + summary;
                window.open(sharelink, 'sharer', 'top=200,left=200,toolbar=0,status=0,width=550,height=350');

            }
        });
    }

    function translateInterface(lang) {
        $(".tRegister").text(langs[lang].tRegister);
        $(".tProvidedBy").text(langs[lang].tProvidedBy);
        $(".tRate").text(langs[lang].tRate);
        $(".tBecause").text(langs[lang].tBecause);
        $(".tInvite").text(langs[lang].tInvite);
        $(".tOverall").text(langs[lang].tOverall);
        $(".tInviteAsMany").text(langs[lang].tInviteAsMany);
        $("#inviteMails").attr("placeholder",langs[lang].pEmail);
        $(".tWelcome").text(langs[lang].tWelcome);
        $(".tThankYou").text(langs[lang].tThankYou);
        $(".tVote").text(langs[lang].tVote);

        $(".full[for=star5]").prop("title", langs[lang].s5);
        $(".half[for=star4half]").prop("title", langs[lang].s45);
        $(".full[for=star4]").prop("title", langs[lang].s4);
        $(".half[for=star3half]").prop("title", langs[lang].s35);
        $(".full[for=star3]").prop("title", langs[lang].s3);
        $(".half[for=star2half]").prop("title", langs[lang].s25);
        $(".full[for=star2]").prop("title", langs[lang].s2);
        $(".half[for=star1half]").prop("title", langs[lang].s15);
        $(".full[for=star1]").prop("title", langs[lang].s1);
        $(".half[for=starhalf]").prop("title", langs[lang].s05);


    }

    $('.feedback .fb').click(function () {
        fbShare();
    });

    $('.feedback .tw').click(function () {
        twShare();
    });

    $('.feedback .gp').click(function () {
        gpShare();
    });

    $('.feedback .lin').click(function () {
        liShare();
    });

    $('.vote .inviteButton').click(function () {
        $('.vote').hide();
        $('.invite').show();
    });

    $('.invite .submitFriendsButton').click(function () {
        $.post(dataBaseApi + '/invite', {
            friends: $('#inviteMails').val()
        }, function (res) {
            $('.invite').hide();
            $('.vote').show();
        });
    });



})
();
