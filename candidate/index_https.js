/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    path = require('path'),
    https = require('https'),
    fs = require("fs"),
    config = require("./applicant_node_config");
	
var conn = require('mongolab-data-api')(config.mongolab);

var options = {
  key: fs.readFileSync('cert/key.pem'),
  cert: fs.readFileSync('cert/cert.pem')
};

var sessionArray = [];

var OpenTok = require('opentok');

var s3path = config.s3path;

// Initialize the express app
var app = express();

var router = express.Router();

// route middleware that will happen on every request
router.use(function(req, res, next) {

    // log each request to the console
    console.log(req.method, req.url);

    // continue doing what we were doing and go to the route
    next(); 
});

app.use('/' +  config.applicationName, express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public/views');
app.engine('jade', require('jade').renderFile);
app.set('view engine', 'jade');

var httpsServer = https.createServer(options, app);

/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
app.use(bodyParser.json());

/** bodyParser.urlencoded(options)
 * Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST)
 * and exposes the resulting object (containing the keys and values) on req.body
 */
app.use(bodyParser.urlencoded({
    extended: true
}));


// Initialize OpenTok
var opentok = null;

router.get('/', function(request, response) {
   response.writeHeader(200, {"Content-Type": "text/html"});  
   response.write("<h3> Welcome to Splain Applicant Workflow </h3>");  
   response.end();
});

router.use('/:companyid/:jobid',function(req,res,next){
    console.log("Applicant Work flow Entry");
    next();
}); 

//https://splain.io/candidate/example1/57df68b2c2ef16762a996bda
router.get('/:companyid/:jobid', function(req, res) {
    console.log('Queried URL',req.params);          
    
    var options = { database: req.params.companyid, collectionName: 'jobs', query:'{"_id":{"$oid":"'+req.params.jobid+'"}}'};
    var parsedResult = null;
    conn.listDocuments(options, function(err, data) {
        console.log('Collected URL Request Data: ', data);
        if (data.length > 0) {
            parsedResult = data[0];
            console.log("evalId", parsedResult.evalid);
            console.log("Applicant Name : ", parsedResult.applname);
        }
    });       
    
    if (parsedResult) {
        var questionOptions = { database: req.params.companyid, collectionName: 'evaluation', query:'{"_id":{"$oid":"'+parsedResult.evalid+'"}}'};
        var questions = [];
        conn.listDocuments(questionOptions, function(err, data) {
            var obj = data;
            console.log("Question_Object : ", obj);            
            if (obj.length > 0) questions = obj[0].questions;
        });
        console.log("Questions length: ", questions.length);
        if (questions.length > 0) {            
            res.render('index',{"companyid":req.params.companyid, "jobid" : req.params.jobid,"questions" : JSON.stringify(questions)});
        } else {
            res.render('index',{"companyid":req.params.companyid, "jobid" : req.params.jobid,"questions" : null});
        }
    }
});

router.use("/getSessionIdandToken",function(req,res,next){
    console.log("GetSessionIdandToken Entry");
    next();
}); 

router.get('/getSessionIdandToken', function(request, response) {
    console.log('API KEY :' + request.query.apiKey);
    console.log('API SECRET KEY :' + request.query.apiSecret);
   
    var apiKey = request.query.apiKey;
    var apiSecret = request.query.apiSecret;
   
    if (!apiKey || !apiSecret) {
        console.log('You must specify API_KEY and API_SECRET Values');
        process.exit(1);
    } else {                                
        opentok = new OpenTok(apiKey, apiSecret);
         // Create a session and store it in the express app
        opentok.createSession({mediaMode:'routed'}, function(err, session) {
            if (err) throw err;
            console.log("SESSION ID : " ,session.sessionId);
            app.set('sessionId', session.sessionId);

            var token = session.generateToken({
                  role :       'moderator',
                  expireTime : (new Date().getTime() / 1000)+(7 * 24 * 60 * 60), // in one week
                  data :       'name=splain'
            });
            console.log("TOKEN GENERATED : " ,token);
            app.set('token', token);

            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({sessionId:session.sessionId, token: token}));           
        }); 
    }
});


router.use("/getAppProperties",function(req,res,next){
    console.log("GetAppProperties Entry");
    next();
}); 

router.get('/getAppProperties', function(req, res) {
    var options = { database: req.query.companyid, collectionName: 'app_properties' };   
    conn.listDocuments(options, function(err, data) {  		
        console.log("READ APPLICATION PROPERITES HERE");
        request('https://api.mongolab.com/api/1/databases/' + options.database + '/collections/' + options.collectionName + '?apiKey=' + config.mongolab,
        function(error, response, body){
            console.log("GetAppProperties error :" + error);    
            console.log("response :" + response.statusCode);
            console.log("body :" , body);
            if (!error && response.statusCode == 200) {
                var obj = JSON.parse(body);
                console.log(obj);
                var properties = null;
                if (obj.length > 0) {
                    properties = {app_customer_logo:obj[0].app_customer_logo, app_bg_color: obj[0].app_bg_color, app_ac_color: obj[0].app_ac_color};                    
                } 
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(properties));                
            }            
        });						
    });
});

router.use('/startArchive',function(req,res,next){
    console.log("Start Archive Entry");
    next();
}); 

router.post('/startArchive', function(request, response) {
    
    console.log('SESSION ID :' + request.query.sessionId);    
   
    var sessionId = request.query.sessionId;       
        
//  For Storing as a Zip file in "Individual Stream Archive" format
//  opentok.startArchive(sessionId, { name: 'Splain Applicants' , outputMode: 'individual' }, function(err, archive) {

    // For Storing as a mp4 file in "Composed Stream Archive" format
    opentok.startArchive(sessionId, { name: 'Splain Applicants' }, function(err, archive) {
      if (err) {
        console.log('Archive Start Error: ', err);
        response.setHeader('Content-Type', 'application/json');
        response.send(JSON.stringify({'error':err}));            
      } else {
        console.log("Archive Started successfully");
        // The id property is useful to save off into a database
        console.log("new archive:" + archive.id);
        response.setHeader('Content-Type', 'application/json');
        response.send(JSON.stringify({archiveId:archive.id}));        
      }
    });
});

router.use('/stopArchive',function(req,res,next){
    console.log("Stop Archive Entry");
    next();
}); 

router.post('/stopArchive', function(req, res){
    console.log('ARCHIVE :' + req.query.archiveId + 'STOP INITIATED');       
    var archiveId = req.query.archiveId;   
    console.log("STOP ARCHIVE REQUEST : ", req.query);
    sessionArray.push({"companyid":req.query.companyId,"jobid":req.query.jobId,"questionid":req.query.questionId,"archiveid":req.query.archiveId,"sessionid":req.query.sessionId,"apikey":req.query.apiKey,"status":"","url":""});
    
    opentok.stopArchive(archiveId, function(err, archive) {
        if (err) return console.log(err);
        else {
            console.log("Stopped archive:" + archive.id);           
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({archiveId:archive.id}));
        }
    });
});

router.use('/storeQuestionStatus',function(req,res,next){
    console.log("StoreQuestionStatus Entry");
    next();
}); 

router.post('/storeQuestionStatus', function (request,response) {   
    console.log("storeQuestionStatus : ",request.body);
    var requestData =request.body;
    var questionListOptions = {
        database: requestData.companyid,
        collectionName: 'applicant_analytics',
        query: '{"job_id":"' + requestData.jobid + '"}'        
    };
    conn.listDocuments(questionListOptions, function(err, data) {
        if (err) {
            console.log('Analytics Fetch Error :', err);
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({result:err}));              
        }
        console.log("Analytics QuestionStatus collected : ", data);
        var questionsArray = []; var isQuestionExists = false;
        if (data.length > 0) {            
            console.log("Analytics QuestionStatus length : ", data.length);
            
            questionsArray = data[0].questions;            
            
            for (var index=0; index<questionsArray.length; index++){
                if (questionsArray[index].title == requestData.questions.title) {
                    questionsArray[index] = {   "title": requestData.questions.title,
                                                "time_spent": requestData.questions.time_spent,
                                                "replay_times": requestData.questions.replay_times,
                                                "current_time": requestData.questions.current_time
                                        };
                    isQuestionExists = true;
                    break;
                }
            }
        }
        
        if ((!isQuestionExists) || (data.length <= 0)) {
            questionsArray.push({
                "title": requestData.questions.title,
                "time_spent": requestData.questions.time_spent,
                "replay_times": requestData.questions.replay_times,
                "current_time": requestData.questions.current_time
            });
        }        
        
        console.log("Analytics QuestionStatus After Insert : \n \n", questionsArray);
        
        var questionInsertOptions = {
            database: requestData.companyid,
            collectionName: 'applicant_analytics',	           
            data: {"questions": questionsArray},
            query: '{"job_id":"' + requestData.jobid + '"}'
        };

        conn.updateDocuments(questionInsertOptions, function(err, data) {
            if (err) { 
                console.log(err);
                response.setHeader('Content-Type', 'application/json');
                response.send(JSON.stringify({result:err}));                      
            } else {
                console.log("INSERT QUESTION STATUS SUCCESS", data);                                          
                response.setHeader('Content-Type', 'application/json');
                response.send(JSON.stringify({result:"Question Inserted Successfully"}));  
            }
        });        
    });
    return;
});

router.use('/storeJobStatus',function(req,res,next){
    console.log("storeJobStatus JobID : ",req.body.jobid);
    console.log("storeJobStatus CompanyID : ",req.body.companyid);   
    next();
}); 

router.post('/storeJobStatus', function (request,response) {   
    console.log("storeJobStatus : ",request.body);
    var requestData =request.body;
    
    var listOptions = {
        database: requestData.companyid,
        collectionName: 'applicant_analytics',
        query: '{"job_id":"' + requestData.jobid +'"}',
        setOfFields: '{"questions":1}'
    };
    conn.listDocuments(listOptions, function(err, data) {        
        if (err) {
            console.log('Job Insert Error :', err);        
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({result:err}));                        
        }
        //console.log("Evaluation Insert List Status : ", data);                
        // If new job
        if (data.length == 0) {
            console.log("New Job Entry");             
            
            var insertData = {
                "job_id": requestData.jobid,
                "questions": [],
                "total_time_spent": requestData.total_time_spent,
                "browser_name": requestData.browser_name,
                "browser_version": requestData.browser_version,
                "screen_resolution": requestData.screen_resolution,
                "launched_time": requestData.launched_time,
                "completed_time": requestData.completed_time   
            };
           
            var insertOptions = {
                database: requestData.companyid,
                collectionName: 'applicant_analytics',	
                documents: insertData
            };            
            
            conn.insertDocuments(insertOptions, function(err, data) {
                if (err) { 
                    console.log(err);
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify({result:err}));
                } else {                    
                    console.log("INSERT JOB STATUS SUCCESS", data);
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify({result:"Job Inserted Successfully"}));                      
                }
            });
        } else {
          // If job exists
            console.log("Job Entry Exists");            
            var add_on_Data = {
                    "job_id": requestData.jobid,
                    "questions": data[0].questions,
                    "total_time_spent": requestData.total_time_spent,
                    "browser_name": requestData.browser_name,
                    "browser_version": requestData.browser_version,
                    "screen_resolution": requestData.screen_resolution,
                    "launched_time" : requestData.launched_time,
                    "completed_time": requestData.completed_time
            };

            var insertOptions = {
                database: requestData.companyid,
                collectionName: 'applicant_analytics',	                
                data: add_on_Data,
                query: '{"job_id":"' + requestData.jobid + '"}'
            };

            conn.updateDocuments(insertOptions, function(err, data) {
                if (err) { 
                    console.log(err); 
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify({result:err}));
                } else {
                    console.log("INSERT JOB STATUS SUCCESS", data); 
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify({result:"JOB Stored Successfully"}));  
                }
            });               
        }
    });
    return;
});

router.use('/updateJobStatus',function(req,res,next){
    console.log("updateJobStatus Entry");
    next();
}); 

router.post('/updateJobStatus', function (request,response) {   
    console.log("updateJobStatus : ",request.body);
    var requestData =request.body;
    
    var listOptions = {
        database: requestData.companyid,
        collectionName: 'applicant_analytics',
        query:'{"job_id":"' + requestData.jobid + '"}'        
    };
    conn.listDocuments(listOptions, function(err, data) {        
        if (err) {
            console.log('Job Update Error :', err);
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({result:err}));              
        }
        //console.log("Evaluation Update List Status : ", data);                
        // If no entry 
        if (data.length == 0) {                        
            console.log("NO JOB FOUND FOR UPDATE");
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({result:"No Job Found"}));  
        } else {
          // If exists,          
            //console.log("INSERT EVALUATION STATUS SUCCESS", data);            
            
            data[0].total_time_spent = requestData.total_time_spent;
            data[0].completed_time = requestData.completed_time;
                
            var updateOptions = {
                database: requestData.companyid,
                collectionName: 'applicant_analytics',	                
                data: data[0],
                query: '{"job_id":"' + requestData.jobid + '"}'
            };
                                        
            conn.updateDocuments(updateOptions, function(err, data) {
                if (err) { 
                    console.log(err); 
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify({result:err}));
                } else {
                //    console.log("EVALUATION UPDATE STATUS SUCCESS", data);
                    response.setHeader('Content-Type', 'application/json');                        
                    response.send(JSON.stringify({result:"Job Updated Successfully"}));  
                }
            });
        }
    });
    return;
});

router.use('/listenArchiveStatus',function(req,res,next){
    console.log("Listen Archive Status Entry");
    next();
}); 

router.post('/listenArchiveStatus', function(request,response) {
    console.log('LISTENARCHIVESTATUS Session :' + request.body.sessionId + '--- Archive :' + request.body.id + '--- Status :' + request.body.status);        
    
    if ((request.body.status =="available") || (request.body.status == "uploaded") || (request.body.status == "failed")) {
        for (var index=0; index < sessionArray.length; index++) {
            if ((sessionArray[index].archiveid == request.body.id) && (sessionArray[index].sessionid == request.body.sessionId) && (sessionArray[index].apikey == request.body.partnerId)) {
                sessionArray[index].status == request.body.status;
                if (request.body.status == "available") {
                    sessionArray[index].url =  request.body.url;
                    storeArchiveURL(sessionArray[index]);
                } else if (request.body.status == "uploaded") {                             
                    sessionArray[index].url = s3path +  request.body.partnerId + '/' + request.body.id + '/archive.mp4';
                    storeArchiveURL(sessionArray[index]);
                } else if (request.body.status == "failed") {                             
                    sessionArray[index].url = "";
                    storeArchiveURL(sessionArray[index]);
                }
            }
        }
    }     
    return;
});

router.use("/storeResultUrl",function(req,res,next){
    console.log("Result URL Storage Entry");
    next();
}); 

router.post('/storeResultUrl', function(req, res) {
    console.log('Store Result URL :', req.body);
    var companyId = req.body.companyid;
    var jobId = req.body.jobid;
    var resultUrl = req.body.resulturl;
//    var options = { database: companyId, 
//                    collectionName: 'jobs',
//                    query:'{"_id":{"$oid":"'+jobId+'"}}'
//                  };
                  
    var options = { database: companyId, collectionName: 'jobs', query:'{"_id":{"$oid":"'+jobId+'"}}'};
    conn.listDocuments(options, function(err, data) {
        if (err) { console.log("Error with Result URL Storage Job Fetching",err); }
        else {
            console.log('Result URL Storage Data: ');
            if (data.length > 0) {
                // JOB Exists
                var updateInterestOptions = {
                    database: companyId,
                    collectionName: 'jobs',
                    data: {"evalresulturl":resultUrl},
                    query:'{"_id":{"$oid":"'+jobId+'"}}'
                };

                conn.updateDocuments(updateInterestOptions, function(err, data) {
                    if (err) { 
                        console.log("RESULT URL STORAGE FAILURE", err);
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({result:"Failure"}));  
                    } else {
                        console.log("Result Url Stored Successfully");                                          
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({result:"Success"}));  
                    }
                });                
            }
        }
    });
    return;
});

app.use('/'+ config.applicationName, router); 

httpsServer.listen(config.listenPort, function(){
    console.log('Splain Applicant Workflow is now ready at ' + config.baseUrl + ':' + config.listenPort);
});

//app.listen(config.listenPort, function(){
//    console.log('Splain Applicant Workflow is now ready at ' + config.baseUrl + ':' + config.listenPort);
//});

function storeArchiveURL(sessionValues) {
    console.log("STORE ARCHIVE PROCESS :", sessionValues);
    
    var listOptions = {
        database: sessionValues.companyid,
        collectionName: 'applicant_answers',
        query: '{"job_id":"' + sessionValues.jobid + '","question_id":"' + sessionValues.questionid +'"}'
    };
    conn.listDocuments(listOptions, function(err, data) {        
        if (err) {
            console.log('Question Update Error :', err);
        }
        // If JOB already answered, update with new URL
        if(data.length>0) {
            data[0].answer_url = sessionValues.url;
            
            var updateOptions = {
                database: sessionValues.companyid,
                collectionName: 'applicant_answers',	                
                data: data[0],
                query: '{"job_id":"' + sessionValues.jobid + '","question_id":"' + sessionValues.questionid +'"}'
            };
                                        
            conn.updateDocuments(updateOptions, function(err, data) {
                if (err) { 
                    console.log(err); 
                } else {
                    console.log("ANSWER URL UPDATE SUCCESS", data);
                }
            });            
        } else { // Insert Data with new URL
            var insertData = {"job_id":sessionValues.jobid,"question_id":sessionValues.questionid, "answer_url": sessionValues.url};
            var insertOptions = {
                database: sessionValues.companyid,
                collectionName: 'applicant_answers',	
                documents: insertData
            };            
            
            conn.insertDocuments(insertOptions, function(err, data) {
                if (err) { 
                    console.log(err);
                } else {                    
                    console.log("JOB ANSWER ADDED SUCCESS", data);
                }
            });
        }                        
    });
}

 