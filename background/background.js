console.log("Runmning");

chrome.runtime.onMessage.addListener(function (request, sender, callback) {

    if(!request.url) return;

    request.options.complete = function (data) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            var tabID = tabs[0].id;

            chrome.tabs.sendMessage(tabID, {
                event: "bytext",
                data: data
            })
        });
    };

    $.ajax(request.url, request.options);

});
