/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

// Configuration Settings
var configProperties = applicant_config;

//TokBox Integration
var apiKey = configProperties.apiKey;
var apiSecret = configProperties.apiSecret;

var baseUrl = null;
if (configProperties.listenPort) {	// For IP with PORT
	baseUrl = configProperties.baseUrl + ":" + configProperties.listenPort + "/" + configProperties.applicationName;
} else { // For Domain Name without PORT
	baseUrl = configProperties.baseUrl + "/" + configProperties.applicationName;
}

var token = null,
    sessionId = null,
    session = null,
    publisher = null,
    archiveId = null;
    
var companyId = null;
var jobId = null;
    
var question_start_time = null;
var question_replay_times = 0;
var question_last_handled = null;

var job_time_spent = null;
var browser_name = jQuery.browser.name;
var browser_version = jQuery.browser.fullVersion;
var screen_resolution = screen.width + ' x ' + screen.height;
var job_launched_time = new Date();
var job_completed_time = new Date();

var timer_flash = 7; // In Seconds, to notify the end of recording

window.onresize = function() { 
    heightWidthAdjustment();
};

var localStream = null;

$(document).ready(function() {                
    heightWidthAdjustment();      
    // To Restrict User from right clicking
    $('body').on('dragstart', function(event) { event.preventDefault(); });
         $(document).bind("contextmenu",function(e){
                e.preventDefault();//or return false;
                alert('Right Click is disabled');
                return false;
    });    
});
 
window.onload = function() {
         
    var videoIndex = 0; var questionsURL = [];
    console.log("QuestionSet : " , $('#postedvalues questions'));
    if ($('#postedvalues questions').text().trim()) questionsURL = JSON.parse($('#postedvalues questions').text());
    //var applicantId = $('#postedvalues applicant').text();
    companyId = $('#postedvalues company').text().trim();
    jobId = $('#postedvalues job').text().trim();
    //var evaluationId = $('#postedvalues evaluation').text();
    
    console.log("Window loaded Successfully");
    
    getApp_Properties();
    function getApp_Properties() {
         $.get(baseUrl + '/getAppProperties?companyid=' + companyId, function(response) {
            console.log("Application Properties : ",response);
            $('header').css({'background-color':response.app_bg_color});
            $('header').css({'border-bottom-color':response.app_ac_color});
            $('#logo').attr('src',response.app_customer_logo);
//            $('#logo').attr('src', response.app_customer_logo);
        });                
    }
    
    // Post Job Status to MongoDB
    $.post(baseUrl + '/storeJobStatus', {"companyid":companyId, "jobid" : jobId, "questions":[], "total_time_spent": job_time_spent,"browser_name": browser_name,"browser_version": browser_version,"screen_resolution": screen_resolution,"launched_time" : job_launched_time,"completed_time": job_completed_time})
        .done (function(response) {
            console.log("Evaluation Status Update : ",response);
        });        
            
    var OverallPercent = 100;
    
    heightWidthAdjustment();
    
    var video = $('#clientVideo')[0];    
    if (questionsURL.length > 0) {
        console.log('Questions URL : ', questionsURL);
        console.log('Questions URL Length: ', questionsURL.length);
        OverallPercent = Math.round(OverallPercent/questionsURL.length);
        
        //On QuestionURL Presence, Assign Welcome Video to Play
        //video.src = "/" + configProperties.applicationName + questionsURL[videoIndex].question_url;        
        
        video.src = questionsURL[videoIndex].question_url;        
        
        if (questionsURL[videoIndex].question_type.indexOf("question_")>=0) question_start_time =  new Date();
        else publishSelfVideo_OpenTok();
        
        playVideowithProgress();
        
        enableReplayButton(true);
        enableDoneButton(false);
        enableNextButton(false);        
    }
    
    // Perform Time based Progress Operations
    var timerProgress = null;
    var prevAngle = 0; // To Avoid the Gap inbetween
    function generateTimerProgress(forDuration) {        
        timerProgress = null;
        var canvas = $('.loader2')[0];
        var endsAt = 1; var startsAt = forDuration;
        var context = canvas.getContext('2d');
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;        
        var radius = 50;
                        
        context.beginPath(); canvas.width = canvas.width;
        context.arc(centerX,centerY,radius+10,0,Math.PI*2);
        context.fillStyle = '#FFFFFF';
        context.fill();
        context.lineWidth = 23;
        context.lineCap = 'round';
        context.strokeStyle = '#EFEEEC';
        context.stroke();
        context.save();
        
        if (forDuration > 0) {
            //startsAt = forDuration - 7;
            timerProgress = setInterval(function(){ 
                var endAngle = ((Math.PI*2)/startsAt) * endsAt;
                context.beginPath(); 
                context.fillStyle = '#FFFFFF';
                context.fillRect(centerX -40, centerY-(radius/2-10), radius + 20, radius-20);

                context.font = '18pt sans-serif';
                context.fillStyle = '#0096d3'; 
                context.textAlign = 'center';
                context.fillText(formatSeconds(startsAt - endsAt), centerX, centerY+(centerY*10/100));
                // (+ Math.PI * 1.5) added to start from 12'0 Clock
                context.arc(centerX,centerY,radius+10,prevAngle + (Math.PI*1.5),endAngle+ (Math.PI*1.5),false);
                context.lineWidth = 23;
                context.strokeStyle = '#0096d3'; 
                context.stroke();
                prevAngle = endAngle;
                if (endsAt==startsAt-7) {
                    context.closePath();
                    context.restore();
                    prevAngle = 0;
                    generateFlashTimerProgress(endAngle,forDuration);
                    clearInterval(timerProgress) ;
                }
                endsAt++;
            }, 1000);
        } else {            
            context.beginPath(); 
            context.fillStyle = '#FFFFFF';
            context.fillRect(centerX -40, centerY-(radius/2-10), radius + 20, radius-20);

            context.font = '18pt sans-serif';
            context.fillStyle = '#0096d3';
            context.textAlign = 'center';
            context.fillText(formatSeconds(0), centerX, centerY+(centerY*10/100));
            // (+ Math.PI * 1.5) added to start from 12'0 Clock
            context.arc(centerX,centerY,radius+10,Math.PI*1.5,Math.PI*3.5,false);
            context.lineWidth = 23;
            context.strokeStyle = '#0096d3';
            context.stroke();
            
            context.restore();                
            context.closePath();
            prevAngle = 0;
        }
    }
        
    // Perform Time based Progress Operations
    var flashTimerProgress = null;
    var flashPrevAngle = 0; // To Avoid the Gap inbetween
    function generateFlashTimerProgress(prevAngle,totalDuration) {
        flashPrevAngle = prevAngle;
        flashTimerProgress = null;
        var canvas = $('.loader2')[0];
        var endsAt = 1; var startsAt = timer_flash;
        var context = canvas.getContext('2d');
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;        
        var radius = 50;
        
        var isRed = false;
        var singleGrow = 0;
        flashTimerProgress = setInterval(function(){ 

            context.beginPath(); canvas.width = canvas.width;
            context.arc(centerX,centerY,radius+10,Math.PI*1.5,Math.PI*3.5);
            context.fillStyle = '#FFFFFF';
            context.fill();
            context.lineWidth = 23;
            context.lineCap = 'round';
            context.strokeStyle = '#EFEEEC';
            context.stroke();
            context.save();

            var endAngle = singleGrow + flashPrevAngle;
            context.beginPath(); 
            context.fillStyle = '#FFFFFF';
            context.fillRect(centerX -40, centerY-(radius/2-10), radius + 20, radius-20);
            context.font = '18pt sans-serif';                        
            
            if (isRed) {
                context.fillStyle = '#0096d3'; 
            } else {
                context.fillStyle = '#FF0000'; 
            }                
            context.textAlign = 'center';
            context.fillText(formatSeconds(startsAt - endsAt), centerX, centerY+(centerY*10/100));
            // (+ Math.PI * 1.5) added to start from 12'0 Clock
            context.arc(centerX,centerY,radius+10,(Math.PI*1.5),endAngle + (Math.PI*1.5),false);
            context.lineWidth = 23;
            if (isRed) {
                context.strokeStyle = '#0096d3'; 
            } else {
                context.strokeStyle = '#FF0000'; 
            }
            isRed = !(isRed);
            context.stroke();
            singleGrow = (Math.PI*2)/totalDuration;
            flashPrevAngle = endAngle;
            if (endsAt==startsAt) {
                context.closePath();
                context.restore();
                
                context.beginPath(); canvas.width = canvas.width;
                context.fillStyle = '#FFFFFF';
                context.fillRect(centerX -40, centerY-(radius/2-10), radius + 20, radius-20);

                context.font = '18pt sans-serif';
                context.fillStyle = '#0096d3';
                context.textAlign = 'center';
                context.fillText(formatSeconds(0), centerX, centerY+(centerY*10/100));
                // (+ Math.PI * 1.5) added to start from 12'0 Clock
                context.arc(centerX,centerY,radius+10,Math.PI*1.5,Math.PI*3.5,false);
                context.lineWidth = 23;
                context.strokeStyle = '#0096d3';
                context.stroke();
            
                context.closePath();                                
                flashPrevAngle = 0;
                clearInterval(flashTimerProgress) ;
            }
            endsAt++;
        }, 1000);
    }    
    
    
    // Perform Overall Timer Percentage based Operations
    var overallTimerProgress = null;
    var overallPrevAngle = 0; // To Avoid the Gap inbetween
    
    var overallCanvas = $('.loader3')[0];    
    var overallContext = overallCanvas.getContext('2d');
    var overallCenterX = overallCanvas.width / 2;
    var overallCenterY = overallCanvas.height / 2;        
    var overallRadius = 50; 
    
    function initOverallProgress() {
        overallPrevAngle = 0;
        overallContext.beginPath(); overallCanvas.width = overallCanvas.width;
        overallContext.arc(overallCenterX,overallCenterY,overallRadius+10,0,Math.PI*2);
        overallContext.fillStyle = '#FFFFFF';
        overallContext.fill();
        overallContext.lineWidth = 23;
        overallContext.lineCap = 'round';
        overallContext.strokeStyle = '#EFEEEC';
        overallContext.stroke();
        overallContext.save();
    }
    
    initOverallProgress();
    generateOverallProgress(0);
    
    function generateOverallProgress(forPercentage) {        
        overallTimerProgress = null;              
        if (forPercentage > 0) {                  
                var endAngle = ((forPercentage/100) * 360.0)* (Math.PI / 180);
                overallContext.beginPath(); 
                overallContext.fillStyle = '#FFFFFF';
                overallContext.fillRect(overallCenterX-40, overallCenterY-(overallRadius/2-10), overallRadius + 20, overallRadius-20);

                overallContext.font = '18pt sans-serif'; 
                overallContext.fillStyle = '#4d4d4d';
                overallContext.textAlign = 'center';
                overallContext.fillText(forPercentage + '%', overallCenterX, overallCenterY+(overallCenterY*10/100));
                // (+ Math.PI * 1.5) added to start from 12'0 Clock
                overallContext.arc(overallCenterX,overallCenterY,overallRadius+10,overallPrevAngle + (Math.PI*1.5),endAngle+ (Math.PI*1.5),false);
                overallContext.lineWidth = 23;
                overallContext.strokeStyle = '#4d4d4d';
                overallContext.stroke();
                overallPrevAngle = endAngle;
                if (forPercentage==100) {
                    overallContext.closePath();
                    overallContext.restore();
                    overallPrevAngle = 0;
                }
        } else {            
            overallContext.beginPath(); 
            overallContext.fillStyle = '#FFFFFF';

            overallContext.font = '18pt sans-serif';
            overallContext.fillStyle = '#4d4d4d';
            overallContext.textAlign = 'center';
            overallContext.fillText(forPercentage + '%', overallCenterX, overallCenterY+(overallCenterY*10/100));
            overallContext.closePath();
            overallContext.restore();            
            overallPrevAngle = 0;
        }
    }
    
       
    var timerCanvas = $('.loader2')[0];    
    var timerContext = timerCanvas.getContext('2d');
    var timerCenterX = timerCanvas.width / 2;
    var timerCenterY = timerCanvas.height / 2;        
    var timerRadius = 50; 
    var timerPrevAngle = 0;  // To Avoid the Gap inbetween
    
    function initVideoPlayProgress() {
        timerPrevAngle = 0;
        timerContext.beginPath(); timerCanvas.width = timerCanvas.width;
        timerContext.arc(timerCenterX,timerCenterY,timerRadius+10,0,Math.PI*2);
        timerContext.fillStyle = '#FFFFFF';
        timerContext.fill();
        timerContext.lineWidth = 23;
        timerContext.lineCap = 'round';
        timerContext.strokeStyle = '#EFEEEC';
        timerContext.stroke();
        timerContext.save();
    }
        
    function videoPlayProgress(playDuration, forDuration) {              
        if (forDuration > 0) {                      
            var endAngle = ((Math.PI*2)/playDuration) * forDuration;
            timerContext.beginPath(); 
            timerContext.fillStyle = '#FFFFFF';
            timerContext.fillRect(timerCenterX -40, timerCenterY-(timerRadius/2-10), timerRadius + 20, timerRadius-20);

            timerContext.font = '18pt sans-serif';
            timerContext.fillStyle = '#0096d3';
            timerContext.textAlign = 'center';
            timerContext.fillText(formatSeconds(playDuration - forDuration), timerCenterX, timerCenterY+(timerCenterY*10/100));
           
            timerContext.arc(timerCenterX,timerCenterY,timerRadius+10,timerPrevAngle + (Math.PI*1.5),endAngle+ (Math.PI*1.5),false);
            timerContext.lineWidth = 23;
            timerContext.strokeStyle = '#0096d3';
            timerContext.stroke(); 
            timerContext.closePath();
            timerPrevAngle = endAngle;
            if (forDuration==playDuration) {                                           
                timerContext.restore();                
                timerContext.closePath();
            }
        }
    }    
    
    var delayProgress = null;
    function generateDelayProgress(forDuration) {
        delayProgress = null;
        var canvas = $('.loader4')[0];
        $('#recordingdelay').css({'display':'block'});
        var endsAt = 1; var startsAt = forDuration;
        var context = canvas.getContext('2d');
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;        
        var radius = 50; var prevDelayAngle = 0;
                        
        context.beginPath(); canvas.width = canvas.width;
        context.arc(centerX,centerY,radius+10,0,Math.PI*2);
        context.fillStyle = '#FFFFFF';
        context.fill();
        context.lineWidth = 23;
        context.lineCap = 'round';
        context.strokeStyle = '#EFEEEC';
        context.stroke();
        context.save();
                       
        delayProgress = setInterval(function(){ 
            var endAngle = ((Math.PI*2)/startsAt) * endsAt;
            context.beginPath(); 
            context.fillStyle = '#FFFFFF';            
            context.fillRect(centerX -40, centerY-(radius/2-10), radius + 20, radius-20);
            
            context.font = '18pt sans-serif';
            context.fillStyle = '#FF0000';
            context.textAlign = 'center';
            context.fillText(startsAt - endsAt, centerX, centerY+(centerY*5/100));

            context.font = '12pt sans-serif';
            context.fillStyle = '#FF0000';
            context.textAlign = 'center';
            context.fillText('Secs', centerX, centerY+(centerY*50/100));

            context.arc(centerX,centerY,radius+10,prevDelayAngle + (Math.PI*1.5),endAngle+ (Math.PI*1.5),false);
            context.lineWidth = 23;
            context.strokeStyle = '#FF0000';
            context.stroke(); 
            prevDelayAngle = endAngle;
            if (endsAt==startsAt) {
                context.closePath();
                context.restore();
                $('#recordingdelay').css({'display':'none'});
                clearInterval(delayProgress) ;
            }
            endsAt++;
        }, 1000);
    }
    
    function formatSeconds (val) {
        var sec_num = parseInt(val, 10); // don't forget the second param
        var minutes = Math.floor(sec_num / 60);
        var seconds = sec_num - (minutes * 60);
        
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        return minutes+':'+seconds;
    }   
    
    function enableReplayButton(isenabled){
        $('#controlsButton .replay button').prop({'disabled':!isenabled});
        
        if (isenabled) {
            $('#controlsButton .replay').css('background','#0096d3');
            $('#controlsButton .replay button').css('color','#ffffff');
            $('#controlsButton .replay').addClass('changed');
        } else {
            $('#controlsButton .replay').css('background','#dddddd');
            $('#controlsButton .replay button').css('color','#757575');
            $('#controlsButton .replay').removeClass('changed');
        }
    }
    
    function enableDoneButton(isenabled){
        $('#controlsButton .done button').prop({'disabled':!isenabled});
        
        if (isenabled) {
            $('#controlsButton .done').css('background','#0096d3');
            $('#controlsButton .done button').css('color','#ffffff');
            $('#controlsButton .done').addClass('changed');
        } else {
            $('#controlsButton .done').css('background','#dddddd');
            $('#controlsButton .done button').css('color','#757575');
            $('#controlsButton .done').removeClass('changed');
        }
    }
    
    function enableNextButton(isenabled){
        $('#controlsButton .next button').prop({'disabled':!isenabled});
        
        if (isenabled) {
            $('#controlsButton .next').css('background','#0096d3');
            $('#controlsButton .next button').css('color','#ffffff');
            $('#controlsButton .next').addClass('changed');
        } else {
            $('#controlsButton .next').css('background','#dddddd');
            $('#controlsButton .next button').css('color','#757575');
            $('#controlsButton .next').removeClass('changed');
        }
    }
        
    video.onplay = function() {                        
        //enableReplayButton(true);
        if (questionsURL[videoIndex].repeats_allowed) enableReplayButton(true);
        else enableReplayButton(false);
        enableDoneButton(false);
        enableNextButton(false);          
    }
    
    var isResultUpdated = false;
    
    video.onended = function(e) {
        if ((questionsURL[videoIndex].question_type == "welcome_video") || (questionsURL[videoIndex].question_type == "introduction_video")) {
            //enableReplayButton(true);
            if (questionsURL[videoIndex].repeats_allowed) enableReplayButton(true);
            else enableReplayButton(false);
            enableDoneButton(false);
            enableNextButton(true);          
        } else if (questionsURL[videoIndex].question_type.indexOf("question_")>=0) {
            
            enableReplayButton(false);
            enableDoneButton(false);
            enableNextButton(false);
                                   
            if (session) session.disconnect();
            publishOpenTok();    
            
            //Generates a delay of 10 Seconds before recording
            generateDelayProgress(10);
            
            // Store Result URL for the Initial Recording
            if (!isResultUpdated) {
                $.post(baseUrl + '/storeResultUrl', {"companyid":companyId,"jobid":jobId,"resulturl":configProperties.baseUrl + '/' + configProperties.resultApp + '/' + companyId + '/' + jobId}, function(response) {
                    console.log("Result URL Stored Status : ",response.result);                
                    isResultUpdated = true;
                });        
            }
            
            setTimeout(function() {
                recordQuestion();
            },10000); 
        } else if ((questionsURL[videoIndex].question_type == "thanks_video") || (videoIndex+1 >= questionsURL.length)) {            
		
			$('#finalnotification').css({'display':'block'});
		
            var percentNow = OverallPercent*(videoIndex+1);
            //percentNow = (percentNow > 100 ? 100 : percentNow);
            //OverallProgress.draw(percentNow);
            percentNow = 100;
            generateOverallProgress(percentNow);
            
            if (questionsURL[videoIndex].repeats_allowed) enableReplayButton(true);
            else enableReplayButton(false);
            
            //enableReplayButton(false);
            enableDoneButton(false);
            enableNextButton(false);            
            
            job_completed_time = new Date();
            job_time_spent = formatSeconds((job_completed_time - job_launched_time)/1000);
            updateJob_Question_Status();            			
        }
        job_completed_time = new Date();
        job_time_spent = formatSeconds((job_completed_time - job_launched_time)/1000);
       // updateJob_Question_Status();
    };
    
    video.ontimeupdate = function() {
        videoPlayProgress(Math.round(video.duration),Math.round(video.currentTime));
    };
    
    function handleDoneActions() {
        if (recordingTimer) clearTimeout(recordingTimer);
        
        stopRecOpenTokSession();
        $('#publisher').css({'display':'none'}); 
        
        enableReplayButton(false);
        enableDoneButton(false);
        enableNextButton(true);          
        
        video.pause();
        video.src="";
    }
    
    function handleReplayActions() {                          
          question_replay_times++;
          
          video.currentTime = 0; 
          playVideowithProgress();
		  $('#finalnotification').css({'display':'none'});
    }
    
    function playVideowithProgress() {
        var t = window.setInterval(function(){
            if (video.readyState > 0) {
              //console.log('Video : ' + videoIndex + ' duration : ' + video.duration);
              initVideoPlayProgress();
              video.play();              
              clearInterval(t);
            }
        },500); 
    }
    
    function pad2(number) {   
        return (number < 10 ? '0' : '') + number;
    }
    
    function updateJob_Question_Status() {
        if (questionsURL[videoIndex].question_type.indexOf("question_")>=0) {
                        
            $('#notification').css({'display':'none'});
            
            //Collect time Spent on the Question **************************************************************************
            var question_end_time =  new Date();
            var diff =  Math.abs(new Date(question_end_time) - new Date(question_start_time));                        
            
            var seconds = Math.floor(diff/1000); //ignore any left over units smaller than a second
            var minutes = Math.floor(seconds/60); 
            seconds = seconds % 60;
            var hours = Math.floor(minutes/60);
            minutes = minutes % 60;
            var question_time_spent = pad2(hours) + ":" + pad2(minutes) + ":" + pad2(seconds);
            
            var question_object = {"title":questionsURL[videoIndex].title,"time_spent": question_time_spent,"replay_times": question_replay_times,"current_time": new Date()};
            
            console.log("Handle Next Navigations");
            // Insert Question Object to MongoDB
            $.post(baseUrl + '/storeQuestionStatus', {"companyid" : companyId, "jobid" : jobId , "questions" : question_object})
                .done (function(response) {
                    console.log("Question Status Update : ",response);                
                });                                                               
            //Collect time Spent on the Question **************************************************************************
        }
        $.post(baseUrl + '/updateJobStatus', {"companyid" : companyId, "jobid" : jobId , "total_time_spent": job_time_spent,"completed_time": job_completed_time})
        .done (function(response) {
            console.log("Job Status Update : ",response);
        });
    }
        
    function handleNextNavigations() {
        updateJob_Question_Status();
        question_start_time = null;
        question_replay_times = 0;          
        
        if (videoIndex < questionsURL.length) {
            if (questionsURL[videoIndex].question_type == "introduction_video") selfSession.disconnect();                        
            
            videoIndex++;                

            if (questionsURL[videoIndex].repeats_allowed) enableReplayButton(true);
            else enableReplayButton(false);
            enableDoneButton(false);
            enableNextButton(false);    

            video.src = questionsURL[videoIndex].question_url;
            //video.src = "/" + configProperties.applicationName + questionsURL[videoIndex].question_url;
            var percentNow = OverallPercent*videoIndex;
            
            generateOverallProgress(percentNow);
            question_last_handled = questionsURL[videoIndex].title;
            
            if (questionsURL[videoIndex].question_type.indexOf("question_")>=0) question_start_time = new Date();
            
            playVideowithProgress();                                  
        } else {
            if (selfSession) selfSession.disconnect();   
            if (session) session.disconnect();
            
            enableReplayButton(false);
            enableDoneButton(false);
            enableNextButton(false); 
        }
    }
    
    var recordingTimer = null;
    function recordQuestion() {                   
            enableReplayButton(false);
            enableDoneButton(true);
            enableNextButton(false);  
            
            //After First Question gets played                
            recOpenTokSession();                                   
            
            recordingTimer = setTimeout(function() {
                stopRecOpenTokSession();                                
                
                enableReplayButton(false);
                enableDoneButton(false);
                enableNextButton(true);  
                
                $('#publisher').css({'display':'none'});                       
                video.pause();
                video.src="";
            },(questionsURL[videoIndex].answer_time_limit * 1000));        
    }
    
    var selfSession = null;
    function publishSelfVideo_OpenTok() {
    // run an AJAX get request to the route you setup above...
    // respect the cross-domain policy by using the same domain
    // you used to access your index.html file!

    //Create an OpenTok session that clients can connect to, publish streams to, and subscribe to streams within.
    //Create a token that grants a client access to a session.
    
    $.get(baseUrl + '/getSessionIdandToken?apiKey='+apiKey+"&apiSecret="+apiSecret, function(response) {
        console.log("Response : " , response);                    
        token = response.token; sessionId = response.sessionId;

        $('#sessionid').val(sessionId);
        $('#token').val(token);
        
        //if (OT.checkSystemRequirements()) {
        selfSession = OT.initSession(apiKey,sessionId);       

        selfSession.connect(token, function(err, info) {
         if (err) {     
            console.log("Error connecting: ", err.code, err.message);
            if (err.code === 1006) {
              console.log('Failed to connect. Please check your connection and try connecting again.');
            } else {
              console.log('An unknown error occurred connecting. Please try again later.');
            }
          } else {
            console.log("Connected to the selfSession.");
            var audioInputDevices;
            var videoInputDevices;
            OT.getDevices(function(error, devices) {
                audioInputDevices = devices.filter(function(element) {
                  return element.kind == "audioInput";
                });
                videoInputDevices = devices.filter(function(element) {
                  return element.kind == "videoInput";
                });
                for (var i = 0; i < audioInputDevices.length; i++) {
                  console.log("audio input device: ", audioInputDevices[i].deviceId);
                }
                for (i = 0; i < videoInputDevices.length; i++) {
                  console.log("video input device: ", videoInputDevices[i].deviceId);
                }
                // Try setting insertMode to other values: "replace", "after", or "before":
                var publisherProperties = {resolution: '1280x720',insertMode: "append",audioSource: audioInputDevices[0].deviceId,showControls: false, videoSource: videoInputDevices[0].deviceId, width: '100%', height: '100%', fitMode: "cover"};
                publisher = OT.initPublisher('selfpublisher', publisherProperties, function (error) {
                    if (error) {
                        // The client cannot publish.
                        // You may want to notify the user.
                        console.log(error);
                        if (error.code === 1500 && error.message.indexOf('Publisher Access Denied:') >= 0) {
                            // Access denied can also be handled by the accessDenied event
                            console.log('Please allow access to the Camera and Microphone and try publishing again.');
                        } else {
                            console.log('Failed to get access to your camera or microphone. Please check that your webcam'
                              + ' is connected and not being used by another application and try again.');
                        }
                        publisher.destroy();
                        publisher = null;            
                    } else {
                      console.log("Publisher initialized.");
                    }
                });
                
                if (selfSession.capabilities.publish == 1) {
                   // publisher.stream = videoFileResponse;
                    selfSession.publish(publisher, function(err) {
                        if(err) {
                            alert(err.message || err);
                            if (err.code === 1553 || (err.code === 1500 && err.message.indexOf("Publisher PeerConnection Error:") >= 0)) {
                                console.log("Streaming connection failed. This could be due to a restrictive firewall.");
                            } else {
                                console.log("An unknown error occurred while trying to publish your video. Please try again later.");
                            }
                            publisher.destroy();
                            publisher = null;
                        } else { 
                            console.log("SESSION PUBLISHED");  
                            publisher.on({
                              'accessDenied': function() {
                                console.log('Please allow access to the Camera and Microphone and try publishing again.');
                              }  
                            });
                            publisher.on("streamDestroyed", function (event) {
                              console.log("The publisher stopped streaming. Reason: "
                                + event.reason);
                              if (event.reason === 'networkDisconnected') {
                                  console.log('Your publisher lost its connection. Please check your internet connection and try publishing again.');
                              } 
                            });                
                        }
                    }).on('streamCreated', function (event) {
                        console.log('The publisher started streaming.',event);
                     //   playVideowithProgress();
                    });
                } else {
                    console.log("You cannot publish an audio-video stream.");
                }
             });
            }                     
        });

        var connectionCount = 0;
        selfSession.on({
          connectionCreated: function (event) {
            connectionCount++;
            if (event.connection.connectionId != selfSession.connection.connectionId) {
              console.log('Another client connected. ' + connectionCount + ' total.');
            }
          },
          connectionDestroyed: function connectionDestroyedHandler(event) {
            connectionCount--;
            console.log('A client disconnected. ' + connectionCount + ' total.');
          },
          sessionDisconnected: function sessionDisconnectHandler(event) {
              // The event is defined by the SessionDisconnectEvent class
              console.log('Disconnected from the selfSession.');                          
              if (event.reason == 'networkDisconnected') {
                alert('Your network connection terminated.')
              }
           }
        });

        selfSession.on('streamCreated', function(event) {
          console.log("New stream in the selfSession: " + event.stream.streamId);
          console.log("New stream Video Type: " + event.stream.videoType);
          selfSession.subscribe(event.stream, "selfvideo", { insertMode: "append" },function (error) {    
              if (error) {
                console.log(error);
              } else {
                console.log('Subscriber added.');
              }
          });
        });

        selfSession.on("streamDestroyed", function (event) {
            console.log("Stream stopped. Reason: " + event.reason);
            if (event.reason === 'networkDisconnected') {
                event.preventDefault();
                var subscribers = selfSession.getSubscribersForStream(event.stream);
                if (subscribers.length > 0) {
                    var subscriber = document.getElementById(subscribers[0].id);
                    // Display error message inside the Subscriber
                    subscriber.innerHTML = 'Lost connection. This could be due to your internet connection '
                        + 'or because the other party lost their connection.';
                    event.preventDefault();   // Prevent the Subscriber from being removed
                }
            }
        });

        selfSession.on("sessionDisconnected", function(event){
            console.log("sessionDisconnected event fired");
            // Session has been disconnected. Include any clean up code here
        });                            
    });
    }
    
    function publishOpenTok() {
        // run an AJAX get request to the route you setup above...
        // respect the cross-domain policy by using the same domain
        // you used to access your index.html file!

        //Create an OpenTok session that clients can connect to, publish streams to, and subscribe to streams within.
        //Create a token that grants a client access to a session.

        $.get(baseUrl + '/getSessionIdandToken?apiKey='+apiKey+"&apiSecret="+apiSecret, function(response) {
            console.log("Response : " , response);                    
            token = response.token; sessionId = response.sessionId;

            $('#sessionid').val(sessionId);
            $('#token').val(token);
						            
            session = OT.initSession(apiKey,sessionId);                                    

            session.connect(token, function(err, info) {
             if (err) {     
                console.log("Error connecting: ", err.code, err.message);
                if (err.code === 1006) {
                  console.log('Failed to connect. Please check your connection and try connecting again.');
                } else {
                  console.log('An unknown error occurred connecting. Please try again later.');
                }
              } else {
                console.log("Connected to the session.");
                var audioInputDevices;
                var videoInputDevices;
                OT.getDevices(function(error, devices) {
                    audioInputDevices = devices.filter(function(element) {
                      return element.kind == "audioInput";
                    });
                    videoInputDevices = devices.filter(function(element) {
                      return element.kind == "videoInput";
                    });
                    for (var i = 0; i < audioInputDevices.length; i++) {
                      console.log("audio input device: ", audioInputDevices[i].deviceId);
                    }
                    for (i = 0; i < videoInputDevices.length; i++) {
                      console.log("video input device: ", videoInputDevices[i].deviceId);
                    }
                    // Try setting insertMode to other values: "replace", "after", or "before":
                    var publisherProperties = {resolution: '1280x720',insertMode: "append",audioSource: audioInputDevices[0].deviceId, showControls: false, videoSource: videoInputDevices[0].deviceId, width: '100%', height: '100%', fitMode: "contain"};
                    publisher = OT.initPublisher('publisher', publisherProperties, function (error) {
                        if (error) {
                            // The client cannot publish.
                            // You may want to notify the user.
                            console.log(error);
                            if (err.code === 1500 && err.message.indexOf('Publisher Access Denied:') >= 0) {
                                // Access denied can also be handled by the accessDenied event
                                console.log('Please allow access to the Camera and Microphone and try publishing again.');
                            } else {
                                console.log('Failed to get access to your camera or microphone. Please check that your webcam'
                                  + ' is connected and not being used by another application and try again.');
                            }
                            publisher.destroy();
                            publisher = null;            
                        } else {
                          $('#publisher').css({'display':'block'});
                          alignRecordingVideoCenter();
                          console.log("Publisher initialized.");
                        }
                    });
                    if (session.capabilities.publish == 1) {                       
                        session.publish(publisher, function(err) {
                            if(err) {
                                if (err.code === 1553 || (err.code === 1500 && err.message.indexOf("Publisher PeerConnection Error:") >= 0)) {
                                    console.log("Streaming connection failed. This could be due to a restrictive firewall.");
                                } else {
                                    console.log("An unknown error occurred while trying to publish your video. Please try again later.");
                                }
                                publisher.destroy();
                                publisher = null;
                            } else { 
                                console.log("SESSION PUBLISHED");  
                                publisher.on({
                                  'accessDenied': function() {
                                    console.log('Please allow access to the Camera and Microphone and try publishing again.');
                                  }  
                                });
                                publisher.on("streamDestroyed", function (event) {
                                  console.log("The publisher stopped streaming. Reason: "
                                    + event.reason);
                                  if (event.reason === 'networkDisconnected') {
                                      console.log('Your publisher lost its connection. Please check your internet connection and try publishing again.');
                                  } 
                                });                
                            }
                        }).on('streamCreated', function (event) {                      
                            console.log('The publisher started streaming.',event);
                        });
                    } else {
                        console.log("You cannot publish an audio-video stream.");
                    }
                 });
                }                     
            });

            var connectionCount = 0;
            session.on({
              connectionCreated: function (event) {
                connectionCount++;
                if (event.connection.connectionId != session.connection.connectionId) {
                  console.log('Another client connected. ' + connectionCount + ' total.');
                }
              },
              connectionDestroyed: function connectionDestroyedHandler(event) {
                connectionCount--;
                console.log('A client disconnected. ' + connectionCount + ' total.');
              },
              sessionDisconnected: function sessionDisconnectHandler(event) {
                  // The event is defined by the SessionDisconnectEvent class
                  console.log('Disconnected from the session.');                          
                  if (event.reason == 'networkDisconnected') {
                    alert('Your network connection terminated.')
                  }
               }
            });

            session.on('streamCreated', function(event) {
              console.log("New stream in the session: " + event.stream.streamId);
              console.log("New stream Video Type: " + event.stream.videoType);
              session.subscribe(event.stream, "subscribers", { insertMode: "append" },function (error) {    
                  if (error) {
                    console.log(error);
                  } else {
                    console.log('Subscriber added.');
                  }
              });
            });

            session.on("streamDestroyed", function (event) {
                console.log("Stream stopped. Reason: " + event.reason);
                if (event.reason === 'networkDisconnected') {
                    event.preventDefault();
                    var subscribers = session.getSubscribersForStream(event.stream);
                    if (subscribers.length > 0) {
                        var subscriber = document.getElementById(subscribers[0].id);
                        // Display error message inside the Subscriber
                        subscriber.innerHTML = 'Lost connection. This could be due to your internet connection '
                            + 'or because the other party lost their connection.';
                        event.preventDefault();   // Prevent the Subscriber from being removed
                    }
                }
            });

            session.on("sessionDisconnected", function(event){
                console.log("sessionDisconnected event fired");
                // Session has been disconnected. Include any clean up code here
            });                            
        });
    }
    
    function recOpenTokSession() {
        generateTimerProgress(questionsURL[videoIndex].answer_time_limit); 
       
        $.post(baseUrl + '/startArchive?sessionId='+sessionId, function(response) {            
            console.log("ARCHIVE STARTED",response);
            archiveId = response.archiveId;
        }).fail(function (response) {
            console.log("ARCHIVE START FAILURE",response);
            archiveId = null;
        });
    };

    function stopRecOpenTokSession() {        
        if(timerProgress) clearInterval(timerProgress);
        generateTimerProgress(0);        
        $('#notification').css({'display':'block'});
        console.log("Company ID : ", companyId);
        $.post(baseUrl + '/stopArchive?companyId=' + companyId +'&questionId='+ questionsURL[videoIndex].title+'&apiKey='+apiKey+'&archiveId='+archiveId+'&sessionId='+sessionId+'&jobId='+jobId, function(response) {
            console.log("ARCHIVE STOPPED",response);
            archiveId = response.archiveId; 
            sessionId = null;
            session.disconnect();           
        });                
    };
     
    
    $('.replay').click(function() {
        handleReplayActions();      
    });
    
    $('.done').click(function() {
       handleDoneActions();   
    });
    
    $('.next').click(function() {
        handleNextNavigations();         
    });
};

$(window).resize(function(){
    heightWidthAdjustment();
});

function heightWidthAdjustment(){
  
    var windowWidth = window.innerWidth || Math.max(document.documentElement.clientWidth, document.body.clientWidth);
    var windowHeight = window.innerHeight || Math.max(document.documentElement.clientHeight, document.body.clientHeight);
    var hearderHeight=$('#header').height();
    var mainDivHeight=(windowHeight - (hearderHeight +5));     
    $('#leftDiv').height(mainDivHeight);
    
    var leftHeight = $('#leftDiv').height();
    var logoHeight = $('.mckessonLogo').outerHeight();
    var timerHeight = $('.timeCountdown').outerHeight();
    var progressHeight = $('.progressCountdown').outerHeight();                
    
    if (leftHeight < (logoHeight + timerHeight + progressHeight)) {
        $('#leftDiv').height(logoHeight + timerHeight + progressHeight);
        //$('#main-div').height($('#leftDiv').height());
    } else {
       // $('#main-div').height(mainDivHeight);
    }
    //$('#main-div').height(mainDivHeight);
    if (windowWidth < 768) {
        $('#selfpublisher').css({'height':'100px','width':'100px'});        
        $('#main-div').height($('#leftDiv').height()*2);
        $('#subscribers').height($('#main-div').height()/2);
    } else {
        $('#selfpublisher').css({'height':'150px','width':'150px'});
        $('#main-div').height($('#leftDiv').height());
        $('#subscribers').height($('#main-div').height());
    }    
    
    $('#header').width(windowWidth);
    $('#main-div').width(windowWidth);
  
    $('#clientdiv').width($('#subscribers').width());
    
    // Reduce bottom control buttons height
    $('#clientdiv').height($('#subscribers').height()-50);   

    var hasVScroll = document.body.scrollHeight > document.body.clientHeight;
    if (hasVScroll) {
        $('#controlsButton').width(($('#subscribers #clientVideo').width()-20));
        $("#leftDiv").css('padding','0px');
        $("#leftDiv").css('margin','0px');
        $('body').css('overflow-x','hidden');
    } else {
        $('#controlsButton').width(($('#subscribers #clientVideo').width()-20));
    }
    
    $('body').height($('#main-div').height() + hearderHeight + 5);
    $(window).height($('body').height());    

    $('#publisher').width($('#clientdiv').width());
    $('#publisher').height($('#clientdiv').height());

    $('#controlsButton').css('position','absolute'); 
    alignRecordingVideoCenter(); //window.resizeTo(windowWidth,$('body').height());
}

function alignRecordingVideoCenter() {      
    var vidHeight = $('.OT_video-element').height();
    var vidContHeight = $('.OT_widget-container').height();
    
    if (vidContHeight > vidHeight) {
        $('.OT_video-element').css({'margin-top': (vidContHeight - vidHeight)/2 + 'px'});
    } else {
        $('.OT_video-element').css({'margin-top':'0px'});
    }
}

