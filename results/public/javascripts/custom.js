var companyId;
var jobId;
var QuestionsArray = [];
var globalAverageRating = "";
var globalinterest = "";

var configProperties = settings;

var baseUrl = null;
if (configProperties.listenPort) {	// For IP with PORT
	baseUrl = configProperties.baseUrl + ":" + configProperties.listenPort + "/" + configProperties.applicationName;        
} else { // For Domain Name without PORT
	baseUrl = configProperties.baseUrl + "/" + configProperties.applicationName;        
}

 $(document).ready(function() {
    InitialData();
	$('.Video-area').css({'display':'block'});
    PageResize();
    Jquerydotdotdot();
    FirstQusplay();
    $('.Average-rating').children('.jq-star').css("cursor", "default"); /*Average rating star pointer properties*/
	
	$(document).on('mouseenter', '.LikeIcon', function() {
		$(this).css({"color": "#4CAF50"});
	});

	$(document).on('mouseleave', '.LikeIcon', function() {
		$(this).css("color", "")
	});

	$(document).on('mouseenter', '.unlikeIcon', function() {
		$(this).css({"color": "#FF5252"});
	});

	$(document).on('mouseleave', '.unlikeIcon', function() {
		$(this).css("color", "")
	});
	
 });
 
 $(window).resize(function() {
    PageResize();
    Jquerydotdotdot();
 });

function PageResize() {
    var DocumentHeight = $(window).height();   
    var Topheader=$(".applicantHeader").outerHeight();
    $('.headermainleftpart').css('height', Topheader + 'px');
	var Headerheight = $(".Header-area").height();
    var remainingHeight = "";
    remainingHeight = (DocumentHeight-Headerheight);
    var QusPanelHeight = remainingHeight / 5;
    QusPanelHeight = QusPanelHeight - 3;    
    var NumTitle = 46;
    var NumRateStar = 20;
    var NumStar = 30;
    var QusPanel = NumTitle+NumRateStar+NumStar;
    var PerTitle = NumTitle*100/QusPanel;
    var PerRateStar = NumRateStar*100/QusPanel;
    var perStar = NumRateStar*100/QusPanel;
    var QusTitle = QusPanelHeight * PerTitle / 100;
    var Ratee = QusPanelHeight * PerRateStar / 100;
    var Star = QusPanelHeight * perStar / 100;
    QusTitle = Math.round(QusTitle);
    Ratee = Math.round(Ratee);
    $('.quspanel').css('min-height', (QusPanel) + 'px');
    $('.QustionTitle').css('min-height', (NumTitle) + 'px');
    $('.QustionAnsRateText').css('min-height', (NumRateStar) + 'px');
    $('.QustionAnsRateStart').css('min-height', (NumStar) + 'px');
    var Totalstar = ((QusPanelHeight) - (QusTitle + Ratee));
    if (QusPanelHeight > QusPanel) {
        $('.quspanel').css('height', (QusPanelHeight) + 'px');
    } else {
        $('.quspanel').css('height', (QusPanel) + 'px');
    }
    if (QusTitle > NumTitle) {
        var QusTitlepadding = QusTitle - NumTitle;
        QusTitlepadding = QusTitlepadding / 2;
        $('.QustionTitle').css('height', QusTitle+'px');
        $('.QustionTitle').css('padding-top', QusTitlepadding + 'px');
        $('.QustionTitle').css('padding-bottom', QusTitlepadding + 'px');
    } else {
        $('.QustionTitle').css('height', NumTitle + 'px');
        $('.QustionTitle').css('padding-top', '0px');
        $('.QustionTitle').css('padding-bottom', '0px');
    }
    if (Ratee > NumRateStar) {
        $('.QustionAnsRateText').css('height', Math.round(Ratee) + 'px');
        $('.QustionAnsRateText').css('line-height', Math.round(Ratee) + 'px');
    } else {
        $('.QustionAnsRateText').css('height', NumRateStar + 'px');
        $('.QustionAnsRateText').css('line-height', NumRateStar + 'px');
    }
    
    if (Totalstar > NumStar) {
        $('.QustionAnsRateStart').css('height', Totalstar + 'px');
        $('.QustionAnsRateStart').css('line-height', Totalstar + 'px');
    } else {
        $('.QustionAnsRateStart').css('height', NumStar + 'px');
        $('.QustionAnsRateStart').css('line-height', NumStar + 'px');
    }
    
    $('.Qustion-area').css('height', remainingHeight + 'px');
    $('.Video-area').css('height', remainingHeight + 'px');
    if ($(".qusPanelContent").height() > remainingHeight) {
        $('#qusPanelContent').css('height', (remainingHeight) + 'px');
    } else {
        $('#qusPanelContent').css('height', (remainingHeight) + 'px');
    }
}

function Jquerydotdotdot() {
    $(".QustionTitle").dotdotdot({
        watch: "true",
        after: ".read-more",
        callback: function(isTruncated, orgContent) {
            if (isTruncated) {
                $('.read-more', this).show();
            }
        }
    });
}

function InitialData() {
    companyId=$('#postedvalues').find('company').text();
    jobId=$('#postedvalues').find('job').text();
    var headerRequest = { "companyid": companyId };
    
    getAppProperties(headerRequest);
    
    var questionRequest = { "companyid": companyId, "jobid": jobId};
    collectQuestions(questionRequest);    
}

$(document).on('click', '.QustionTitle', function() {
    var Quesdata = $(this).attr('data-href');    
    $('.QustionTitle').css({"background-color": ""});
    $(this).css({"background-color": "#eee"});
    var SplitQuesData = Quesdata.split('$$');
    var Questionsrc = SplitQuesData[1];
    var QuestionSubmitDate = SplitQuesData[2];
    if (QuestionSubmitDate) {
        $(".footer").text("Submitted video " + QuestionSubmitDate);
    }
    var video = document.getElementById('video');
    video.src = Questionsrc;
    video.play();
});

$(document).on('mouseenter', '.QustionTitle', function() {
    if ($(this).triggerHandler("isTruncated") == true) {
        var Quesdata = $(this).attr('data-href');
        var SplitQuesData = Quesdata.split('$$');
        var QuestionTitle = SplitQuesData[0];
        $(this).prop('title', QuestionTitle);
    }
    else
    {
     $(this).removeAttr("title");
    }
});

$(document).on('click', '.qus-rating', function() {
    var currentRating = $(this).starRating('getRating');
    var questionId = $(this).attr('data-href');
    var JsonUpdateRating = {"jobid": jobId,
        "companyid": companyId,
        "questionid": questionId,
        "rating": currentRating
    };
	updateRating(JsonUpdateRating);
    /* var getUpdatedRatingdata = updateRating(JsonUpdateRating);
    var RatingUpdatedobj = getUpdatedRatingdata;
    var parsedRatingUpdated = RatingUpdatedobj.data;
    if ((RatingUpdatedobj.status == "OK") && (RatingUpdatedobj.statuscode == 200)) {
        $('.Average-rating').starRating('setRating', parsedRatingUpdated.average_rating, false);
    } */
});

$(".LikeIcon").on("click", function() {
    $('.likefont').css('color', '#4CAF50');
    $('.LikeIcon').css({
        "border-color": "#DDDDDD ",
        "border-weight": "1px",
        "border-style": "solid"
    });
    $('.unlikefont').css('color', '');
    $('.unlikeIcon').css({
        "border-color": "#CCC ",
        "border-weight": "1px",
        "border-style": "solid"
    });
    var updateInterestStatus = 1;
    var JsonUpdateInterest = {
        "jobid": jobId,
        "companyid": companyId,
        "interest": updateInterestStatus
    };
    updateInterest(JsonUpdateInterest);   
});

$(".unlikeIcon").on("click", function() {
    $('.unlikefont').css('color', '#FF5252');
    $('.unLikeIcon').css({
        "border-color": "#DDDDDD ",
        "border-weight": "1px",
        "border-style": "solid"
    });
    $('.likefont').css('color', '');
    $('.likeIcon').css({
        "border-color": "#CCC ",
        "border-weight": "1px",
        "border-style": "solid"
    });
    var updateInterestStatus = 2;
    var JsonUpdateInterest = {
        "jobid": jobId,
        "companyid": companyId,
        "interest": updateInterestStatus
    };
    updateInterest(JsonUpdateInterest);   
});
 
function getAppProperties(headerRequest) {      
    $.ajax({
       async: false,
       type: "GET",
       url: baseUrl + "/getAppProperties?companyid=" + headerRequest.companyid,
       success: function(getHeaderdata) 
       {
           console.log("getHeaderdata", getHeaderdata);
           var Headerobj = getHeaderdata;
           var parsedResponse = Headerobj.data;
           if ((Headerobj.status == "OK") && (Headerobj.statuscode == 200)) 
           {
               var logo=parsedResponse.app_customer_logo;
               var HeadeBackgroundColor=parsedResponse.app_bg_color;
               var BorderColor=parsedResponse.app_ac_color;
               $('.logoimg').prop({ src: logo });
               $('.TopDefultheade').css('background-color', HeadeBackgroundColor);
               $('.TopDefultheadeChild').css('background-color', BorderColor);
           }                 
       }
    });
 } 
 
 function collectQuestions(params) {      
 $.ajax({
    async: false,
    type: "GET",
    url: baseUrl + "/collectQuestions?companyid=" + params.companyid + "&jobid=" + params.jobid,
    success: function(getQuestiondata) 
        {
            console.log("collectQuestions",getQuestiondata);
            var questionobj = getQuestiondata;
            var parsedResponsedata = questionobj.data;
            var QuestionsContent = "";
            if ((questionobj.status == "OK") && (questionobj.statuscode == 200)) {
                var globalAverageRating = parsedResponsedata.average_rating;
                var globalinterest = parsedResponsedata.interest;
                $(".HeaderApplicantName").text(parsedResponsedata.name);
                $(".position").text(parsedResponsedata.position)
                QuestionsArray = parsedResponsedata.questions;
                for (var i = 0; i < QuestionsArray.length; i++) {
                    QuestionsContent = '<div class="col-sm-12 col-md-12 col-xs-12 col-lg-12 quspanel">';
                    QuestionsContent += '<div class="col-sm-12 col-md-12 col-xs-12 col-lg-12 QustionTitle" data-href="' + QuestionsArray[i].title + "$$" + QuestionsArray[i].url + "$$" + QuestionsArray[i].submittedon + '">' + QuestionsArray[i].title + '</div>';
                    QuestionsContent += '<div class="col-sm-12 col-md-12 col-xs-12 col-lg-12 QustionAnsRateText">Rate the answer:</div>';
                    QuestionsContent += '<div class="col-sm-12 col-md-12 col-xs-12 col-lg-12 QustionAnsRateStart">';
                    QuestionsContent += '<div data-href="' + QuestionsArray[i].title + '" class="qus-rating"></div>';
                    QuestionsContent += '</div>';
                    QuestionsContent += '</div>';
                    $('#qusPanelContent').append(QuestionsContent);
                    $("div.qus-rating").starRating({
                        initialRating: QuestionsArray[i].rating,
                        activeColor: 'orange',
                        hoverColor: 'orange',
                        strokeColor: 'orange',
                        strokeWidth: 0,
                        starSize: 25,
                        disableAfterRate: false,
                        useGradient: false
                    });
                }
                $(".Average-rating").starRating({
                    initialRating: globalAverageRating,
                    activeColor: 'orange',
                    hoverColor: 'orange',
                    strokeColor: 'orange',
                    strokeWidth: 0,
                    starSize: 30,
                    useGradient: false,
                    disableAfterRate: true,
                    readOnly: true,
                    useFullStars: false
                });
                if (globalinterest == 1) {
                    $('.likefont').css('color', '#4CAF50');
                    $('.LikeIcon').css({
                        "border-color": "#DDDDDD ",
                        "border-weight": "1px",
                        "border-style": "solid"
                    });
                } else if (globalinterest == 2) {
                    $('.unlikefont').css('color', '#FF5252');
                    $('.unLikeIcon').css({
                        "border-color": "#DDDDDD ",
                        "border-weight": "1px",
                        "border-style": "solid"
                    });
                } else {

                }
            }              
        }
    });
 } 
 
 function updateRating(params) {      
 $.ajax({
    async: false,
    type: "POST",
    url: baseUrl + "/updateRating", 
    data: {"companyid":params.companyid,"jobid":params.jobid,"questionid":params.questionid,"rating":params.rating},
    success: function(getUpdatedRatingdata) 
        {
            var RatingUpdatedobj = getUpdatedRatingdata;
            var parsedRatingUpdated = RatingUpdatedobj.data;
            if ((RatingUpdatedobj.status == "OK") && (RatingUpdatedobj.statuscode == 200)) {
                $('.Average-rating').starRating('setRating', parsedRatingUpdated.average_rating, false);
            }            
        }
    });
 } 

function updateInterest(params) {      
 $.ajax({
    async: true,
    type: "POST",
    url: baseUrl + "/updateInterest",
    data: {"companyid":params.companyid,"jobid":params.jobid,"interest":params.interest},
    success: function(JsonUpdateInterest) 
        {
            if ((JsonUpdateInterest.status == "OK") && (JsonUpdateInterest.statuscode == 200)) {
                console.log("Interest Updated Successfully");
            } else {
                console.error("Interest Update Failure");
            }
        }
    });
 }
 
 function FirstQusplay(){
  var Quesdata=$("div.QustionTitle:first").attr('data-href');   
    $("div.QustionTitle:first").css({"background-color": "#eee"});
    var SplitQuesData = Quesdata.split('$$');
    var Questionsrc = SplitQuesData[1];
    var QuestionSubmitDate = SplitQuesData[2];
    $(".footer").text("Submitted video " + QuestionSubmitDate);
    var video = document.getElementById('video');
    video.src = Questionsrc;
    video.play();
}
 