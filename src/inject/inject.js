console.log("Running Castle Crowd");
var host = "http://castle.dev:8000";
//var host = "http://castle.bezcode.com";

var questionURL = "https://www.castlelearning.com/Review/CLO/Student/Assignment/Question";

var assignmentID = 0;
var currentQuestion = {};

var noop = function() {};

function sendRequest(request, callback) {
    chrome.runtime.sendMessage({
        event: "request",
        request: request
    }, callback);
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
    questionChangedFrom(oldID, callback);
}

function executeGlobalFunction(func) {
    window.location.href = "JavaScript:" + func;
}

function imSoTriggeredRightNow(event) {
    questionChangedFrom(currentQuestion.QuestionId);
}

function questionSubmitted(event) {
    getQuestionData(getCurrentNumber(), questionLoaded);
}

function setupEventListeners() {
    $("#nextQuestion-bott, #prevQuestion-bott, #nextQuestion, #prevQuestion, #submitBtn").click(imSoTriggeredRightNow);
    $("#qNum").change(questionSubmitted);
}

function init() {
    assignmentID = getParameterByName('assignmentID');

    getQuestionData(getCurrentNumber(), function (data) {
        questionLoaded(data);
        setupEventListeners();
    });
}

function questionLoaded(data) {
    console.info("Loaded Question", data.QuestionId);
    currentQuestion = data;
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
