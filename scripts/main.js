(function () {
    //'use strict';
    // Address of backend API
    var dataBaseApi = "http://45.55.193.78/api";
    // Google API Key
    var googleApiKey = 'AIzaSyBZg_6uYBHzANuJRkTBpdKshQgnP3K4diw';

    var $ = jQuery;
    var vote = $('.vote');
    var feedback = $('.feedback');
    var userVote = 0;
    var overalScore = 2.5;
    var siteUrl = "", storedEmail, storedOption, storedDuration, storedLang, showLogin = true;
    var left = (screen.width/2)-(330/2);
    var top = (screen.height/2)-(260/2);

    var quote = {
        text: "\"The smallest act of kindness is worth more than the grandest intention he smallest act of kindness is worth more\"",
        author: "Quote Author"
    };

    // Check if Login screen needs to be shown
    chrome.storage.local.get('showLogin', function (result) {
        if (result.showLogin == true || result.showLogin == null) {
            showLogin = true;
        } else {
            showLogin = false;
            $(".loggedout").hide();
        }
    });

    // Check if user is logged in and show appropriate interface if current URL is already rated by user
    chrome.storage.local.get('userEmail', function (result) {
        if (result.userEmail != null && result.userEmail != "") {
            storedEmail = result.userEmail;
            vote.hide();
            getStatsAndShowFeedbackForCurrentUrl();

        } else if (showLogin) {
            storedEmail = "";
            // restore email to email field that user started inputting before closing popup window
            chrome.storage.local.get('tempMail', function (res) {
                $(".loggedout").siblings().hide();
                $(".loggedout").show();
                $("#loginEmail").val(res.tempMail.toString());
            });
        } else {
            storedEmail = "";
            $('.loader').show();
            chrome.storage.local.get('url', function (result) {
                browser.tabs.query(
                    {active: true},
                    function (tabs) {
                        tab = tabs[0];
                    if (result.url == tab.url) {
                        chrome.storage.local.get('userVote', function (result2) {
                            siteUrl = tab.url;
                            $.post(dataBaseApi + '/overallScore', {
                                url: siteUrl
                            }, function (res) {
                                if (res != "There are no votes for requested url") {
                                    userVote = result2.userVote;
                                    chrome.storage.local.get('quote', function (result3) {
                                        if (result3.quote) {
                                            $('.loader').hide();
                                            $('.vote').hide();
                                            showFeedback(res, result3.quote);
                                        }
                                    });
                                }
                            });
                        });

                    } else {
                        $(".vote").siblings().hide();
                        $(".vote").show();
                    }
                });
            });
        }
    });

    // Set language, default to UK (other possibilities: gr,de,fr,es)
    chrome.storage.local.get('lang', function (result) {
        if (result.lang != null) {
            storedLang = result.lang;
            $(".flag").removeClass("flagActive");
            $("#" + storedLang.toString()).addClass("flagActive");
            translateInterface(storedLang);
        } else {
            storedLang = "uk";
        }
    });

    // Set popup duration in seconds, default to 3
    chrome.storage.local.get('duration', function (result) {
        if (result.duration != null) {
            storedDuration = result.duration;
            $("#seconds").val(storedDuration);
        } else {
            storedDuration = 3;
            $("#seconds").val("3");
        }
    });

    // Set popup display option, default to random
    chrome.storage.local.get('popupOption', function (result) {
        if (result.popupOption != null) {
            storedOption = result.popupOption;
            $("input[name=popupOption][value=" + storedOption + "]").prop("checked", true);
        } else {
            $("input[name=popupOption][value=random]").prop("checked", true);
        }
    });

    // When "Vote" button on Thanks screen is clicked
    $('.thanks .voteButton').click(function () {
        $('.thanks').hide();
        vote.show();
    })

    // When "Not now" button on Login screen is clicked, set showLogin to false and go to Vote panel
    $('.notNowButton1').click(function () {
        $('.loggedout').hide();
        chrome.storage.local.set({'showLogin': false});
        showLogin = false;
        vote.show();
    });

    // When "Not now" button on Register screen is clicked, set showLogin to false and go to Vote panel
    $('.notNowButton2').click(function () {
        $('.register').hide();
        chrome.storage.local.set({'showLogin': false});
        showLogin = false;
        vote.show();
    });

    // Show Register screen
    $(".showRegisterMenu").click(function () {
        $('.loggedout').hide();
        $('.register').show();
        $('#regsubheader').removeClass("error2");
        $('#regsubheader').addClass("subheader");
        $('#regsubheader').text(langs[storedLang].tRegNow);
        $('#regsubheader').show();
    });

    // Logging In
    $(".loginButton").click(function () {
        var userEmail = $('#loginEmail').val();
        var password = $('#loginPass').val();

        if (userEmail != "" && password != "") {
            $.post(dataBaseApi + '/login', {
                email: userEmail,
                password: password
            }).done(
                function (data) {
                    if (data === 'ok') {
                        chrome.storage.local.set({'userEmail': userEmail});
                        storedEmail = userEmail;
                        $('#logsubheader').removeClass("error2");
                        $('#logsubheader').addClass("subheader");
                        $(".loggedout").hide();
                        $("#logsubheader").text(langs[storedLang].tLoginIf);
                        $('#loginEmail').val("");
                        $('#loginPass').val("");

                        getStatsAndShowFeedbackForCurrentUrl();

                    } else {
                        $("#logsubheader").text(langs[storedLang].tUserNotFound);
                        $('#logsubheader').removeClass("subheader");
                        $('#logsubheader').addClass("error2");
                    }

                }).fail(function (xhr, status, error) {
                $("#logsubheader").text(langs[storedLang].tSomething);
                $('#logsubheader').removeClass("subheader");
                $('#logsubheader').addClass("error2");
            });

        }
    });


    // User registration
    $('.registerButton').click(function (e) {
        if (validateEmail($('#registerEmail').val())) {
            var userEmail = $('#registerEmail').val();
            var password = $('#registerPass').val();
            if (userEmail != "" && password != "") {
                $.post(dataBaseApi + '/register', {
                    email: userEmail,
                    password: password
                }).done(
                    function (data) {
                        if (data.message === 'User successfuly registered') {
                            chrome.storage.local.set({'userEmail': userEmail});
                            storedEmail = userEmail;
                            $('#regsubheader').removeClass("error2");
                            $('#regsubheader').addClass("subheader");
                            $(".register").hide();
                            $('.inputDiv').text(userEmail);
                            $('.thanks').show();
                            $('#registerEmail').val("");
                            $('#registerPass').val("");
                        } else {
                            $("#regsubheader").text(langs[storedLang].tSomething);
                            $('#regsubheader').removeClass("subheader");
                            $('#regsubheader').addClass("error2");
                        }

                    }).fail(function (xhr, status, error) {
                    $("#regsubheader").text(langs[storedLang].tSomething);
                    $('#regsubheader').removeClass("subheader");
                    $('#regsubheader').addClass("error2");
                });
            } else {
                $("#regsubheader").text(langs[storedLang].tNope);
                $('#regsubheader').removeClass("subheader");
                $('#regsubheader').addClass("error2");
            }
        } else {
            $("#regsubheader").text(langs[storedLang].tNope);
            $("#regsubheader").text("Nope, email adress is not valid :( please try again");
            $('#regsubheader').removeClass("subheader");
            $('#regsubheader').addClass("error2");
        }

    });

    // Voting
    $('.voteInput').on('change', function () {
        userVote = $('.voteInput:checked').val();
        $(".overalScore").empty();
        vote.hide();
        $('.feedback').hide();
        $('.loader').show();


        browser.tabs.query(
            {active: true},
            function (tabs) {
                tab = tabs[0];
            siteUrl = tab.url;
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
                        showFeedback(data.overalScore,data.quote);
                    }


                });

        });


    });

    // Show feedback
    function showFeedback(dataOveralScore, dataQuote) {
        var fullStarsNumber = Math.floor(userVote);
        var halfStarsNumber = (userVote - Math.floor(userVote) ) / 0.5;

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
        $('.quote .quoteText').text("\"" + quote.text + "\"");
        $('.quote .quoteAuthor').text(quote.author);
        $('.loader').hide();
        $('.feedback').show();

        var totalHeight = $('.feedback').height() + 15;
        $('body').height(totalHeight + "px");
        $('html').height(totalHeight + "px");

    }

    // Show user panel
    $('.userButton').on('click', function () {
        if (storedEmail != "") {
            $('.user').siblings().hide();
            $('.userEmail').text(storedEmail);

            /*var totalHeight = $('.user').height() + 80;
            $('body').height(totalHeight + "px");
            $('html').height(totalHeight + "px");*/
            $('.user').show();

        } else {
            $('.loggedout').siblings().hide();
            $("#logsubheader").text(langs[storedLang].tLoginIf);
            $('#logsubheader').removeClass("error2");
            $('#logsubheader').addClass("subheader");
            $('.loggedout').show();
            /*var totalHeight = $('.loggedout').height() + 10;
            $('body').height(totalHeight + "px");
            $('html').height(totalHeight + "px");*/

        }


    });

    // Logout
    $(".logoutButton").on('click', function () {
        chrome.storage.local.set({'userEmail': "", 'url': "", 'userVote': ""}, function () {
            storedEmail = "";
            $('.loggedout').siblings().hide();
            $("#logsubheader").text(langs[storedLang].tLoginIf);
            $('#logsubheader').removeClass("error2");
            $('#logsubheader').addClass("subheader");
            $('.loggedout').show();
        });
    });

    // Show invite panel
    $('.vote .inviteButton').click(function () {
        $('.vote').hide();
        $('.invite').show();
    });

    // Submit mails for invitation
    $('.invite .submitFriendsButton').click(function () {
        $.post(dataBaseApi + '/invite', {
            friends: $('#inviteMails').val()
        }, function (res) {
            $('.invite').hide();
            $('.vote').show();
        });
    });


    // Back from user and login panels
    $("#backFromUser, #nn1").click(function () {
        if (storedEmail == "" || storedEmail == null) {
            chrome.storage.local.get('url', function (result) {
                browser.tabs.query(
                    {active: true},
                    function (tabs) {
                        tab = tabs[0];
                    if (result.url == tab.url) {

                        chrome.storage.local.get('userVote', function (result2) {
                            if (result2.userVote) {
                                chrome.storage.local.get('quote', function (result3) {
                                    if (result3.quote) {
                                        $('.feedback').siblings().hide();
                                        $(".feedback").hide();
                                        showFeedback(result2.userVote, result3.quote);
                                    }
                                });
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
            });
        } else {

            if (userVote != 0) {
                chrome.storage.local.get('quote', function (rez) {
                    $('.feedback').siblings().hide();
                    $(".feedback").hide();
                    showFeedback(overalScore, rez.quote);
                });
            } else {
                $(".vote").siblings().hide();
                $(".vote").show();
            }
        }
    });

    // Back from Invite panel
    $(".backFromInvite").click(function () {
        $("#inviteMails").val('');
        $(".vote").siblings().hide();
        $('.vote').show();
    });

    // Back from Change Password panel
    $("#backFromChange").click(function () {
        $("#changeError").html('&nbsp;');
        $(".user").siblings().hide();
        $('.user').show();
    });

    // Back from Forgot Password panel
    $("#backFromForgot").click(function () {
        $("#forgotError").html('&nbsp;');
        $(".loggedout").siblings().hide();
        $('.loggedout').show();
    });

    // Social media sharing
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

    // Facebook sharing
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

                browser.windows.create({url:'https://www.facebook.com/sharer/sharer.php?u=' + shortUrl,left:left,top:top,type:"popup",width:550,height:350});
            }
        });

    }

    // Twitter sharing
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
                if (userVote == 1) {
                    status = userVote + ' star to ' + shortUrl + ', rate anything with GiveScores.com';
                } else {
                    status = userVote + ' stars to ' + shortUrl + ', rate anything with GiveScores.com';
                }

                browser.windows.create({url:'http://twitter.com/intent/tweet?status=' + status,left:left,top:top,type:"popup",width:550,height:350});
            }
        });
    }

    // Google+ sharing
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
                browser.windows.create({url:sharelink,left:left,top:top,type:"popup",width:550,height:350});
            }
        });
    }


    // LinkedIn sharing
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
                if (userVote == 1) {
                    summary = userVote + ' star to ' + shortUrl + ', rate anything with GiveScores.com';
                } else {
                    summary = userVote + ' stars to ' + shortUrl + ', rate anything with GiveScores.com';
                }
                var sharelink = "https://www.linkedin.com/shareArticle?mini=true&url=" + shortUrl + "&summary=" + summary;
                browser.windows.create({url:sharelink,left:left,top:top,type:"popup",width:550,height:350});

            }
        });
    }


    // Show settings panel
    $(".settingsButton").click(function () {
        $("#settings").show();
        $("#settings").siblings().hide();
        //$("body").height("290px");
    });

    // Apply settings
    $("#done").click(function () {
        var language = $(".flagActive").prop("id");
        chrome.storage.local.set({'lang': language});
        translateInterface(language);
        storedLang = language;

        var option = $('input[name=popupOption]:checked').val();
        chrome.storage.local.set({'popupOption': option});
        storedOption = option;

        var duration = $('#seconds').val();
        chrome.storage.local.set({'duration': duration});
        storedDuration = duration;

        $("#settings").hide();
        $("#settings").siblings().show();
        //$("body").height("203px");
    });

    // Change language
    $(".flag").click(function () {
        $(this).siblings().removeClass("flagActive");
        $(this).addClass("flagActive");
        var language = $(".flagActive").prop("id");
        chrome.storage.local.set({'lang': language});
        translateInterface(language);
        storedLang = language;
    });


    // Show Change Password panel
    $("#changePass").click(function (e) {
        e.preventDefault();
        $(".changeDiv").siblings().hide();
        $('#newPass1').val("");
        $('#newPass2').val("");
        $('#oldPass').val("");
        $(".changeDiv").show();
    });

    // Change Password
    $(".changePassButton").click(function (e) {
        var newPass1 = $('#newPass1').val();
        var newPass2 = $('#newPass2').val();
        var oldPass = $('#oldPass').val();

        if (oldPass == "") {
            $("#changeError").text(langs[storedLang].tEnterOld);
        }
        else if (newPass1 != newPass2 || newPass1 == "") {
            $("#changeError").text(langs[storedLang].tRetype);
        } else {
            $.post(dataBaseApi + '/changePassword', {
                userEmail: storedEmail,
                oldPass: oldPass,
                newPass: newPass1
            }).done(
                function (data) {
                    if (data == "ok") {
                        $("#changeError").html('&nbsp;');
                        $(".successDiv").siblings().hide();
                        $("#success").text(langs[storedLang].tPassSuccess);
                        $(".successDiv").show();
                        setTimeout(function () {
                            $(".vote").siblings().hide();
                            $('.vote').show();
                            $("#success").text("");
                        }, 2000);

                    } else {
                        $("#changeError").text(langs[storedLang].tOld);
                    }
                }).fail(function (xhr, status, error) {
                $("#changeError").text(langs[storedLang].tSomething);
            });
        }
    });

    // Show Forgotten Pass panel
    $(".forgotPass").click(function (e) {
        e.preventDefault();
        $(".forgot").siblings().hide();
        $("#forgottenPassMail").val("");
        $(".forgot").show();
    });

    // Submitting email for forgotten password
    $("#submitForgotenPassMail").click(function (e) {
        var email = $("#forgottenPassMail").val();
        $.post(dataBaseApi + '/forgotPassword', {
            email: email
        }).done(
            function (data) {
                if (data == "ok") {
                    $("#forgotError").html('&nbsp;');
                    $(".successDiv").siblings().hide();
                    $("#success").text(langs[storedLang].tPassSent);
                    $(".successDiv").show();
                    setTimeout(function () {
                        $(".loggedout").siblings().hide();
                        $('.loggedout').show();
                        $("#success").text("");
                    }, 2000);

                } else {
                    $("#forgotError").text(langs[storedLang].tMailNotFound);
                }
            }).fail(function (xhr, status, error) {
            $("#forgotError").text(langs[storedLang].tSomething);
        });
    });

    // Simulate button click when Enter is pressed
    $(document).keypress(function (e) {
        if (e.which == 13) {
            if ($(".loggedout").is(":visible")) {
                $(".loginButton").click();
            } else if ($(".register").is(":visible")) {
                $(".registerButton").click();
            } else if ($(".invite").is(":visible")) {
                $(".submitFriendsButton").click();
            } else if ($(".changeDiv").is(":visible")) {
                $(".changePassButton").click();
            } else if ($(".forgot").is(":visible")) {
                $("#submitForgotenPassMail").click();
            } else if ($("#settings").is(":visible")) {
                $(".doneButton").click();
            }
        }
    });

    //Save email when popup is closed
    $("#loginEmail").keyup(function (e) {
        chrome.storage.local.set({'tempMail': $("#loginEmail").val()});
        chrome.storage.local.set({'showLogin': true});

    });

    //Seconds field validation if number
    $("#seconds").keyup(function () {
        $("#seconds").val(this.value.match(/[0-9]*/));
    });


    // Translate interface
    function translateInterface(lang) {
        $(".tRegister").text(langs[lang].tRegister);
        $(".tProvidedBy").text(langs[lang].tProvidedBy);
        $(".tRate").text(langs[lang].tRate);
        $(".tBecause").text(langs[lang].tBecause);
        $(".tInvite").text(langs[lang].tInvite);
        $(".tOverall").text(langs[lang].tOverall);
        $(".tNotNow").text(langs[lang].tNotNow);
        $(".tWelcome").text(langs[lang].tWelcome);
        $(".tThankYou").text(langs[lang].tThankYou);
        $(".tVote").text(langs[lang].tVote);
        $(".tSpread").text(langs[lang].tSpread);
        $(".tInviteAsMany").text(langs[lang].tInviteAsMany);
        $(".tSubmit").text(langs[lang].tSubmit);
        $(".tRegTo").text(langs[lang].tRegTo);
        $(".tLanguages").text(langs[lang].tLanguages);
        $(".tPopup").text(langs[lang].tPopup);
        $(".tEvery").text(langs[lang].tEvery);
        $(".tRandom").text(langs[lang].tRandom);
        $(".tOnClick").text(langs[lang].tOnClick);
        $(".tOnScreen").text(langs[lang].tOnScreen);
        $(".tSeconds").text(langs[lang].tSeconds);
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
        $(".tLoginIf").text(langs[lang].tLoginIf);
        $("#loginEmail").attr("placeholder", langs[lang].pEmail);
        $("#registerEmail").attr("placeholder", langs[lang].pEmail);
        $("#inviteMails").attr("placeholder", langs[lang].pEmail);
        $("#forgottenPassMail").attr("placeholder", langs[lang].pEmail);
        $("#loginPass").attr("placeholder", langs[lang].pPassword);
        $("#registerPass").attr("placeholder", langs[lang].pPassword);
        $(".tForgotPass").text(langs[lang].tForgot);
        $(".tRegNow").text(langs[lang].tRegNow);
        $(".tBack").text(langs[lang].tBack);
        $(".tChangePass").text(langs[lang].tChangePass);
        $(".tLogout").text(langs[lang].tLogout);
        $("#oldPass").attr("placeholder", langs[lang].pOldPass);
        $("#newPass1").attr("placeholder", langs[lang].pNewPass1);
        $("#newPass2").attr("placeholder", langs[lang].pNewPass2);
        $(".tEnterEmail").text(langs[lang].tEnterEmail);
        $(".tUserNotFound").text(langs[lang].tUserNotFound);
        $(".tSomething").text(langs[lang].tSomething);
        $(".tNope").text(langs[lang].tNope);
        $(".tEnterOld").text(langs[lang].tEnterOld);
        $(".tRetype").text(langs[lang].tRetype);
        $(".tPassSuccess").text(langs[lang].tPassSuccess);
        $(".tOld").text(langs[lang].tOld);
        $(".tPassSent").text(langs[lang].tPassSent);
        $(".tMailNotFound").text(langs[lang].tMailNotFound);


        // Because of Logout button being too big when translated to french, some CSS rules need to be overriden by next few lines
        if (lang == "fr") {
            $("#backFromUser").css('float', "").css('margin-left', "");
            $(".logoutButton").css('float', "").css('margin-right', "");
        } else {
            $("#backFromUser").css('float', 'left').css('margin-left', '8%');
            $(".logoutButton").css('float', 'right').css('margin-right', '8%');
        }

    }

    // Helper function for email validation
    function validateEmail(email) {
        var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
        return emailReg.test(email);
    };

    // Opens givescores.com when link is clicked
    $('.gs-link').click(function () {
        window.open('http://givescores.com');
    });

    function getStatsAndShowFeedbackForCurrentUrl(){
        $('.loader').show();
        browser.tabs.query(
            {active: true},
            function (tabs) {
            tab = tabs[0];
            siteUrl = tab.url;
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
                        chrome.storage.local.set({'quote': res.quote});
                        showFeedback(res.overalScore, res.quote);
                    } else {
                        vote.show();
                    }
                }
            });

        });
    };


})
();
