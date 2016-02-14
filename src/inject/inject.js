console.log("Running Castle Crowd");
var host = "http://castle.dev";
//var host = "http://castle.bezcode.com";

var questionURL = "https://www.castlelearning.com/Review/CLO/Student/Assignment/Question";

var assignmentID = 0;
var questionCount = 0;
var currentQuestion = {};

var noop = function() {};

function sendRequest(request, callback) {
    chrome.runtime.sendMessage({
        event: "request",
        request: request
    }, callback);
}

function getAnswerFromServer(id, callback) {
    sendRequest({
        url: host + "/question/" + id,

        options: {
            method: "GET"
        }
    }, callback)
}

function getQuestionData(number, callback) {
    sendRequest({
        url: questionURL,

        options: {
            method: "POST",
            data: {
                quesIndex: number,
                assignmentID: assignmentID,
                html5Audio: true
            }
        }
    }, callback);
}

function questionChangedFrom(oldID, callback) {
    var interval = setInterval(function () {
        var thisID = parseInt(retrieveWindowVariable("Castle.Student.Questions.questionId"));

        if (thisID !== oldID) {
            window.clearInterval(interval);

            getQuestionData(getCurrentNumber(), function (data) {
                questionLoaded(data);

                if(callback) callback(data);
            });
        }
    }, 100);
}

function getCurrentNumber() {
    return $("#qNum").val();
}

function goToQuestion(question, callback) {
    var oldID = currentQuestion.QuestionId;

    executeGlobalFunction("Castle.Student.Questions.getQuestion(" + question + ")");
    questionChangedFrom(oldID, function (data) {
        callback(data);
    });
}

function executeGlobalFunction(func) {
    window.location.href = "JavaScript:" + func;
}

function imSoTriggeredRightNow(event) {
    questionChangedFrom(currentQuestion.QuestionId);
}

function questionSubmitted(event) {
    promiseQuestionWillBeDone(function () {
        //Setup Event Listener for that dumb fucking next button which appears out of nowhere
        $('#nextQuestion2').off('click').click(imSoTriggeredRightNow);
        getQuestionData(getCurrentNumber(), questionLoaded);
    });
}

function setupEventListeners() {
    $("#nextQuestion-bott, #prevQuestion-bott, #nextQuestion, #prevQuestion").click(imSoTriggeredRightNow);
    $("#qNum").change(imSoTriggeredRightNow);

    $("#submitBtn").click(questionSubmitted);
}

function setupButtons() {
    var button = document.createElement('a');
    button.style.cursor = "pointer";
    button.className = "ui-btn ui-corner-all ui-last-child";
    button.innerHTML = "<p>Auto Answer All</p>";

    $('#scoring').last().append(button);
    $(button).click(autoAnswerAll);
}

function setupProgressBar() {
    $('.full-page-div').hide();
}

function init() {
    assignmentID = getParameterByName('assignmentID');
    questionCount = parseInt(retrieveWindowVariable('Castle.Student.Questions.count'));

    getQuestionData(getCurrentNumber(), function (data) {
        questionLoaded(data);
        setupEventListeners();
        setupButtons();
    });

    $.get(chrome.extension.getURL('/src/inject/inject.html'), function(data) {
        $(data).appendTo('body');
        setupProgressBar();
    });
}

function questionLoaded(data) {
    console.info("Loaded Question", data.QuestionId);
    currentQuestion = data;

    if(isQuestionDone(data)) {
        //Fuck this trigger man
        console.log("Im triggered rightn ow");

        $('#nextQuestion2').off('click').click(imSoTriggeredRightNow);

        var answer = parseInt($("input[name=answers]:checked").val());

        sendRequest({
            url: host + "/question/add",

            options: {
                method: "POST",
                data: {
                    question: data.QuestionId,
                    answer: answer
                }
            }
        }, noop)
    }
}

function isStatusDone(Status) {
    return Status === "STATUS_CORRECT" || Status === "STATUS_CORRECTONRETRY" || Status === "STATUS_INCORRECTONRETRY" || Status === "STATUS_INCORRECT";
}

function isQuestionDone(q) {
    return isStatusDone(q.Status);
}

function promiseQuestionWillBeDone(callback) {
    var answer = parseInt($("input[name=answers]:checked").val());

    if(answer) {
        console.log("There was an answer");
        var interval = setInterval(function () {
            var status = retrieveWindowVariable("Castle.Student.Questions.qStatus");
            console.log(status);
            if (isStatusDone(status)) {
                window.clearInterval(interval);

                callback();
            }
        }, 20);
    }
}

function answerQuestionWithAnswer(number, answer) {
    sendRequest({
        url: "https://www.castlelearning.com/Review/CLO/Student/Assignment/SubmitMC",

        options: {
            method: "POST",
            data: {answer: answer, quesIndex: number, assignmentID: assignmentID, html5Audio: true}
        }
    }, noop);
}

function autoAnswerAll() {
    $('.full-page-div').show();

    autoAnswerAndNext(1, function () {
        $('.full-page-div').hide();
    });
}

function autoAnswerAndNext(number, done) {
    getQuestionData(number, function (data) {
        getAnswerFromServer(data.QuestionId, function (answer) {
            var percentage = parseInt((parseFloat(number) / questionCount * 100)) + '%';
            $('.loader').width(percentage).text(percentage);

            if (answer) {
                answerQuestionWithAnswer(number, answer.answer);
            }

            if (number < questionCount) {
                autoAnswerAndNext(number + 1, done);
            } else done();
        });
    })
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function retrieveWindowVariable(variable) {
    return retrieveWindowVariables([variable])[variable];
}

function retrieveWindowVariables(variables) {
    var ret = {};

    var scriptContent = "";
    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        scriptContent += "if (typeof " + currVariable + " !== 'undefined') $('body').attr('tmp_" + currVariable + "', " + currVariable + ");\n"
    }

    var script = document.createElement('script');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        ret[currVariable] = $("body").attr("tmp_" + currVariable);
        $("body").removeAttr("tmp_" + currVariable);
    }

    $("#tmpScript").remove();

    return ret;
}

$(document).ready(init);
