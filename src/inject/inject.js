var host = "http://castle.dev";

console.log("RUNNMING");

$(document).ready(function () {
    setTimeout(function() {
        var answerText = $('#answertext').html();
        var question = $('#questionDiv').html();

        if (answerText) {
            var answer = parseInt(answerText.substr(0, 1));

            console.log(answer);
            if (!isNaN(answer)) {
                chrome.runtime.sendMessage({
                    url: host + "/question/add",
                    options: {
                        method: "POST",

                        data: {
                            answer: answer,
                            question: question
                        },
                    }
                })
            }
        }

        chrome.runtime.sendMessage({
            url: host + "/question/bytext",

            options: {
                method: "POST",

                data: {
                    question: question
                }
            }
        })

    }, 2000);

    chrome.runtime.onMessage.addListener(function (request, sender, callback) {

        if(request.event === "bytext") {
            data = request.data.responseJSON;
            alert(data.agreements + " people got the answer : " + data.answer);
        }

    });

});
