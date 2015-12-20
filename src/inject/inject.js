var host = "http://castle.bezcode.com";
var commonQuestionNumberClass = "[id^='index']";
var numberOfQuestions = 0;

var autoAnswerMode = false;
var loggingMode = false;
var answeringFromQueue = false;
var gettingAnswers = false;

var answerQueue = [];

$(document).ready(function () {
    var firstQuestion = {};
    while(!firstQuestion.hasOwnProperty("number")) {
        firstQuestion = getCurrentData();
    }

    numberOfQuestions = $(commonQuestionNumberClass).length;

    chrome.runtime.onMessage.addListener(function (request, sender, callback) {

        if(request.event === "bytext") {
            if(request.data.responseJSON) {
                var data = request.data.responseJSON;

                if (autoAnswerMode) {
                    answerQueue.push(data);

                    if (!gettingAnswers) {
                        autoAnswerFromQueue();
                    }
                }
            }
        }

    });

    setupButtons();

});

function setupButtons() {
    var logButton = document.createElement("a");
    logButton.className = "navbtn";
    logButton.innerHTML = "Log All Questions";

    logButton.onclick = logAllQuestionsToServer;

    var autoAnswerButton = document.createElement("a");
    autoAnswerButton.className = "navbtn";
    autoAnswerButton.innerHTML = "Auto Answer All";

    autoAnswerButton.onclick = autoAnswerAllQuestions;

    $('#ctl00_headerButtonsUpdatePanel').prepend(logButton).prepend(autoAnswerButton);
}

function getCurrentData() {
    var answerText = $('#answertext').html();
    var question = $('#questionDiv').html();

    var number = 0;

    $('div.sectionbar').each(function () {
        if ($(this).text().indexOf('Question') > -1) {
            number = $(this).text().split(' ')[1];
            number = parseInt(number);
        }
    });

    var returnObj = {
        question: question,
        number: number
    };

    if (answerText) {
        var answer = parseInt(answerText.substr(0, 1));

        if (!isNaN(answer)) {
            returnObj.answer = answer;
        }
    }

    return returnObj;
}

function nextQuestion(callback) {
    var currentQuestion = getCurrentData();

    $("#ctl00_NextButton").click();

    questionChangedFrom(currentQuestion.number, callback);
}

function goToQuestion(number, callback) {
    var currentQuestion = getCurrentData();

    location.href = "Javascript:OnGoto(" + number + ")";

    questionChangedFrom(currentQuestion.number, callback);
}

function logQuestion(data) {
    console.info("Logging Question: ", data.number, data.answer);

    chrome.runtime.sendMessage({
        url: host + "/question/add",

        options: {
            method: "POST",

            data: data
        }
    });
}

function logAllQuestionsToServer() {
    loggingMode = true;
    location.href = "Javascript:OnGoto(1)";

    setTimeout(function () {
        logAndNext(getCurrentData());
    }, 1000);
}

function autoAnswerAllQuestions() {
    autoAnswerMode = true;
    location.href = "Javascript:OnGoto(1)";
    gettingAnswers = true;

    setTimeout(function () {
        getAnswerAndNext(getCurrentData());
    }, 1000);
}

function logAndNext(data) {
    if (data.number < numberOfQuestions) {
        logQuestion(data);
        nextQuestion(logAndNext);
    } else {
        logQuestion(data);
        doneLoggingQuestions();
    }
}

function getAnswerAndNext(data) {
    if (data.number < numberOfQuestions) {
        chrome.runtime.sendMessage({
            url: host + "/question/bytext",

            options: {
                method: "POST",

                data: data
            }
        });

        nextQuestion(getAnswerAndNext);
    } else {
        chrome.runtime.sendMessage({
            url: host + "/question/bytext",

            options: {
                method: "POST",

                data: data
            }
        });

        gettingAnswers = false;
        autoAnswerFromQueue();
    }
}

function autoAnswerAndNext(question) {
    if (answerQueue.length > 0) {
        $('#mcAnswerList_' + question.answer).click();
        $('#acceptMCInput').click();

        console.info("Answering number ", question.number, question.answer);

        setTimeout(function () {
            var next = answerQueue.shift();

            goToQuestion(next.number, function (data) {
                autoAnswerAndNext(next);
            });
        }, 200);
    } else {
        autoAnswerMode = false;
        answeringFromQueue = false;
    }
}

function autoAnswerFromQueue() {
    console.log(answerQueue);
    if (!answeringFromQueue) {
        answeringFromQueue = true;
        var answer = answerQueue.shift();

        goToQuestion(answer.number, function () {
            autoAnswerAndNext(answer);
        })
    }
}
// EVENTS ----------------------------------------------------


function questionChangedFrom(currentNumber, callback) {
    console.info("Question changed from", currentNumber);

    var interval = setInterval(function () {
        var thisNumber = getCurrentData().number;

        if (thisNumber !== currentNumber) {
            window.clearInterval(interval);
            callback(getCurrentData());
        }
    }, 200);
}

function questionLoaded(data) {
    if (loggingMode) {
        logQuestion(data);
    } else if($(commonQuestionNumberClass).length == numberOfQuestinonsLogged) {
        doneLoggingQuestions();
    }
}

function doneLoggingQuestions() {
    loggingMode = false;

    console.log("Done Logging Questions");
}
