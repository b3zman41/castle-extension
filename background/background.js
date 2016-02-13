console.log("Runmning");

chrome.runtime.onMessage.addListener(function (message, sender, callback) {

    if (message.event && message.event === "request") {
        message.request.options.complete =  function (response) {
            callback(response.responseJSON);
        };
        $.ajax(message.request.url, message.request.options);
    }

    return true;
});
