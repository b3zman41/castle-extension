console.log("Runmning");

chrome.runtime.onMessage.addListener(function (message, sender, callback) {

    if (message.event && message.event === "request") {
        message.request.options.complete =  function (response) {
            console.log(response);

            callback(response.responseJSON, response);
        };
        $.ajax(message.request.url, message.request.options);
    }

    return true;
});
