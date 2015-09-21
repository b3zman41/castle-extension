var host = "http://castle.bezcode.com";

console.log("RUNNMING");

$(document).ready(function () {
    runQuestion();

    chrome.runtime.onMessage.addListener(function (request, sender, callback) {

        if(request.event === "bytext") {
            if(request.data.responseJSON) {
                var data = request.data.responseJSON;

                alert("The highest rated answer is : " + data.answer);
            }
        }

    });

});

function rebind() {
    console.log("Rebinding");
    setTimeout(function () {
        $('.navbtn.rs_skip').click(function () {
            runQuestion();
        });

        $('#acceptMCInput').unbind('click');
        $('#acceptMCInput').click(function (event) {
            runQuestion();
        });

        $('[id^="index"] a').unbind('click');
        $('[id^="index"] a').click(function (event) {
            runQuestion();
        })
    }, 1000);

}
function runQuestion() {
    console.log("Running question");
    setTimeout(function() {
        var answerText = $('#answertext').html();
        var question = $('#questionDiv').html();

        console.log(answerText);
        console.log(question);

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

        rebind();

    }, 1000);

}
