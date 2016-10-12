var popupUrl = chrome.extension.getURL("index.html");

var oldLocation;
var pages = 15;
var counter = 0;
var popupOption = "random";
var duration = 3;
var notId = "";

chrome.storage.local.get("popupOption",function(result){
    if(result.popupOption != null){
        popupOption = result.popupOption;
    }
});

chrome.storage.local.get("duration",function(result){
    if(result.duration != null){
        duration = result.duration;
    }
});

chrome.storage.onChanged.addListener(function(changes) {
    if(changes.popupOption != null) {
        popupOption = changes.popupOption.newValue;
    }

    if(changes.duration != null){
        duration = changes.duration.newValue;
    }

});

chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        oldLocation = tabs[0].url;
    }
);

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

    if(tab.url != oldLocation && tab.url.indexOf("about:") == -1 && changeInfo.status == "complete" && !(oldLocation.indexOf(".google.") != -1 && tab.url.indexOf(".google.") != -1)){
        oldLocation = tab.url;
        counter++;
        if(((popupOption == "random" && counter == pages) || popupOption == "everyPage") ){
            chrome.notifications.getAll(function (notifications){
                if (notifications.hasOwnProperty(notId)) {
                    chrome.notifications.clear(notId);
                }
                chrome.notifications.create({
                    type: "basic",
                    title: "GiveScores",
                    message: "Rate this page by clicking here!",
                    iconUrl: "images/icon128.png"
                },function(id){
                    notId = id;
                    timer = setTimeout(function(){chrome.notifications.clear(id);}, duration*1000);
                });
            });


            counter = 0;

        }
    }

});


chrome.notifications.onClicked.addListener(function(notificationId){
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
        if (tabs[0].url.indexOf("about:") == -1 && !(oldLocation.indexOf(".google.") != -1 && tab.url.indexOf(".google.") != -1)) {
            chrome.storage.local.set({'lastUrl': tabs[0].url},function(){
                var left = (screen.width/2)-(330/2);
                var top = (screen.height/2)-(260/2);
                browser.windows.create({url:popupUrl,left:left,top:top,type:"popup",width:330,height:280});
            });

        }
    });

});

chrome.notifications.onButtonClicked.addListener(function(notificationId,buttonIndex){
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
        if (tabs[0].url.indexOf("about:") == -1 && !(oldLocation.indexOf(".google.") != -1 && tab.url.indexOf(".google.") != -1)) {
            chrome.storage.local.set({'lastUrl': tabs[0].url},function(){
                var left = (screen.width/2)-(330/2);
                var top = (screen.height/2)-(260/2);
                browser.windows.create({url:popupUrl,left:left,top:top,type:"popup",width:330,height:280});
            });

        }
    });

});

