/* Copyright (C) Vasel Systems (P) Ltd., Inc - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Annamalai <annamalai.a@vaselsystems.com>, September 2016
 */

var express = require ('express'),
    request = require ('request'),
    bodyParser = require('body-parser'),
    config = require("./public/config/settings.js");   
    
var conn = require('mongolab-data-api')(config.mongolab);
var appName = config.applicationName;

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

app.use(express.static(__dirname + '/public'));
app.use('/'+ appName, express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.engine('jade', require('jade').renderFile);
app.set('view engine', 'jade');

/** bodyParser.urlencoded(options)
 * Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST)
 * and exposes the resulting object (containing the keys and values) on req.body
 */
app.use(bodyParser.urlencoded({
    extended: true
}));

/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
app.use(bodyParser.json());

//app.use(express.cookieParser());
//app.use(express.session({secret: '1234567890QWERTY'}));

router.get('/', function(request, response) {
   response.writeHeader(200, {"Content-Type": "text/html"});  
   response.write("<h3> Welcome to Splain Recruiter Result Validation </h3>");  
   response.end();
   return;
});

router.use('/:companyid/:jobid',function(req,res,next){
    console.log("Recruiter Work flow Entry");
    next();
}); 

//https://splain.io/recruiter/companyid/jobid
router.get('/:companyid/:jobid', function(req, res) {
    console.log('Queried URL',req.params);  
    
    res.render('index',{"companyid" : req.params.companyid, "jobid" : req.params.jobid});
    
    return;
});

router.use('/collectQuestions',function(req,res,next){
    console.log("Collect Questions Entry");
    next();
}); 

router.get('/collectQuestions', function(req, res) {
    var requestData = req.query;
    var resultData = {"questions":null,"average_rating":null,"interest":null,"name":null,"position":null};
    var questionSet = []; var questionJson = null;
        
    // Fetch Job , Applicant Details
    var jobOptions = { database: requestData.companyid, collectionName: 'jobs', query:'{"_id":{"$oid":"'+requestData.jobid+'"}}'};
    var evaluation = null;
    conn.listDocuments(jobOptions, function(err, data) {
        if (err) { console.log(err); }
        else {
            var obj = data;
            if (obj.length > 0) {
                evaluation = obj[0].evalid;
                resultData.name = obj[0].applname;
                resultData.position = obj[0].reqtitle;
            }
        }
    });
    
    var options = { database: requestData.companyid, 
                    collectionName: 'recruiter_results',
                    query : '{"job_id":"'+requestData.jobid+'"}'
                  };                                    
    
    conn.listDocuments(options, function(err, data) {
        if (data.length > 0) {
            var parsedResult = data[0];
            // Already Results are Entered
            console.log('Collect Questions Data Success: ');
            resultData.average_rating = parsedResult.average_rating;
            resultData.interest = parsedResult.interest;
                        
            for (var index=0; index<parsedResult.questions.length; index++) {
                questionJson = {"url":null,"title":null,"rating":null,"submittedon":null};
                questionJson.title = parsedResult.questions[index].title;
                questionJson.rating = parsedResult.questions[index].rating;
                
                // Fetch Answer URL
                var answerOptions = { database: requestData.companyid, 
                   collectionName: 'applicant_answers',
                   query : '{"job_id":"'+requestData.jobid+'","question_id":"'+parsedResult.questions[index].title+'"}'
                };
    
                conn.listDocuments(answerOptions, function(err, answerData) {  
                    // If Answer Set Available
                    if (answerData.length > 0) questionJson.url = answerData[0].answer_url;                    
                });
                
                // Fetch Question Submitted Date from Analytics
                var titleOptions = { database: requestData.companyid, collectionName: 'applicant_analytics', query:'{"job_id":"'+requestData.jobid+'"}'};
                conn.listDocuments(titleOptions, function(err, questionData) {
                    if (err) { console.log(err); }
                    else {
                        console.log("Questions length: ", questionData.length);                        
                        if (questionData.length > 0) {
                            // If Question Set Available, find the title
                            var questionFound = questionData[0].questions.filter(function(item) {
                                return item.title == parsedResult.questions[index].title;
                            });                        
                            if (questionFound.length > 0) {
                                var dateObj = new Date(questionFound[0].current_time);
                                var month = dateObj.getUTCMonth() + 1; //months from 1-12
                                var day = dateObj.getUTCDate();
                                var year = dateObj.getUTCFullYear();

                                var formattedDate = pad2(day) + "/" + pad2(month) + "/" + pad2(year) ;
                                questionJson.submittedon = formattedDate;
                            }
                        }                        
                    }
                });                                              
                questionSet.push(questionJson);
            }
            resultData.questions = questionSet;
            res.setHeader('Content-Type', 'application/json');        
            res.send(JSON.stringify({"status":"OK","statuscode":200,"data":resultData}));
        } else {
            // New Result Entry
            console.log('NEW RESULT ENTRY');
            if (evaluation) {
                // Fetch Question Title
                var questionOptions = { database: requestData.companyid, collectionName: 'evaluation', query:'{"_id":{"$oid":"'+evaluation+'"}}'};              

                conn.listDocuments(questionOptions, function(err, questionData) {  
                    if (err) { console.log(err); }
                    console.log('Collected Question Data: ');                
                    // If Question Set Available, Collect its Details
                    if (questionData.length > 0) {
                        var parsedQuestionData = questionData[0].questions;
                        //console.log('Collected Question Object: ', parsedQuestionData);
                        for (var index = 0; index < parsedQuestionData.length; index++) {
							if (parsedQuestionData[index].question_type.startsWith("question_")) {														
								questionJson = {"url":null,"title":null,"rating":null,"submittedon":null};
								questionJson.title = parsedQuestionData[index].title;

								// Fetch Answer URL
								var answerOptions = { database: requestData.companyid,
								   collectionName: 'applicant_answers',
								   query : '{"job_id":"'+requestData.jobid+'","question_id":"'+ parsedQuestionData[index].title+'"}'
								};

								conn.listDocuments(answerOptions, function(err, answerData) {  
									// If Answer Set Available
									if (answerData.length > 0) { 
										questionJson.url = answerData[0].answer_url;                                                                                                           
									} else { 
										questionJson.url = null;
									}
								});
															
								// Fetch Question Submitted Date from Analytics
								var titleOptions = { database: requestData.companyid, collectionName: 'applicant_analytics', query:'{"job_id":"'+requestData.jobid+'"}'};
								conn.listDocuments(titleOptions, function(err, questionData) {
									if (err) { console.log(err); }
									else {
										console.log("Questions length: ", questionData.length);                        
										if (questionData.length > 0) {
											// If Question Set Available, find the title
											var questionFound = questionData[0].questions.filter(function(item) {
												return item.title == parsedQuestionData[index].title;
											});                        
											if (questionFound.length > 0) {
												var dateObj = new Date(questionFound[0].current_time);
												var month = dateObj.getUTCMonth() + 1; //months from 1-12
												var day = dateObj.getUTCDate();
												var year = dateObj.getUTCFullYear();

												var formattedDate = pad2(day) + "/" + pad2(month) + "/" + pad2(year) ;
												questionJson.submittedon = formattedDate;
											} else {
												questionJson.submittedon = null;
											}
										}                        
									}
								});
								questionSet.push(questionJson);
							}
							resultData.questions = questionSet;
						}                        
                    } else {
                        console.log("Question Set not exists for the Job");
                    }
                });
               
                // Clone Question Set without URL, Title Fields
                var insertQuestion = [];                
                
                for (var questionIndex=0; questionIndex < questionSet.length; questionIndex++) {
                    insertQuestion.push({"title":questionSet[questionIndex]['title'],"rating":questionSet[questionIndex]['rating']});                    
                }

                // Insert the Question Set in to Recruiter Results            
                var insertData = {
                    "job_id": requestData.jobid,
                    "questions":insertQuestion,
                    "average_rating":null,
                    "interest":null,
                };

                var insertOptions = {
                    database: requestData.companyid,
                    collectionName: 'recruiter_results',	
                    documents: insertData
                };                        

                conn.insertDocuments(insertOptions, function(err, data) {
                    if (err) { 
                        console.log("Error in Inserting New Result", err);                    
                    } else {                    
                        console.log("INSERT NEW RESULT SUCCESS");
                    }
                });

                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({"status":"OK","statuscode":200,"data":resultData}));
            } else {
                console.log("No Evaluation Exists. Please check!...");
            }
        }
    });    
    return;
});

function pad2(number) {   
    return (number < 10 ? '0' : '') + number;
}

router.use("/getAppProperties",function(req,res,next){
    console.log("GetAppProperties Entry");
    next();
}); 

router.get('/getAppProperties', function(req, res) {    
    var options = { database: req.query.companyid, 
                    collectionName: 'app_properties'
                  };    
    conn.listDocuments(options, function(err, data) {        
        if (data.length > 0) {
            console.log('Collect Application Data Success: ');
            res.setHeader('Content-Type', 'application/json');        
            res.send(JSON.stringify({"status":"OK","statuscode":200,"data":data[0]}));
        } else {
            console.log('Error in Database Collection :', err);       
            res.setHeader('Content-Type', 'application/json');        
            res.send(JSON.stringify({"status":"error","statuscode":400,"data":err}));
        }
    });
    return;
});

router.use("/updateRating",function(req,res,next){
    console.log("Updating Rating Entry");
    next();
}); 

router.post('/updateRating', function(req, res) {    
    var companyId = req.body.companyid;
    var jobId = req.body.jobid;
    var queId = req.body.questionid;
    var rating = req.body.rating;
    var options = { database: companyId, 
                    collectionName: 'recruiter_results',
                    query : '{"job_id":"'+jobId+'"}'
                  };
    conn.listDocuments(options, function(err, data) {
        if (data.length > 0) {
            var parsedResult = data[0];
            // Only update is needed as JOB Entry is already available
            console.log('Collect Questions Data Success: ');
            var averageRating = 0; var totalRating =0;
            var interest = parsedResult.interest;
            var questionSet = []; var questionJson;
            for (var index=0; index<(parsedResult.questions).length; index++) {
                // If has questions
                questionJson = {};
                if (parsedResult.questions[index].title == queId) {
                    questionJson = {"title":parsedResult.questions[index].title,"rating":rating};
                } else {
                    questionJson = {"title":parsedResult.questions[index].title,"rating":parsedResult.questions[index].rating};
                }
                if (questionJson.rating) totalRating += parseFloat(questionJson.rating);
                questionSet.push(questionJson);
            }
            averageRating = parseFloat(totalRating/(parsedResult.questions.length));
            averageRating = (Math.round(averageRating * 2) / 2).toFixed(1);
            var resultData = {"job_id": jobId, "questions": questionSet,"average_rating": averageRating,"interest": interest};

            var updateRatingOptions = {
                database: companyId,
                collectionName: 'recruiter_results',	                
                data: resultData,
                query: '{"job_id":"' + jobId + '"}'
            };

            conn.updateDocuments(updateRatingOptions, function(err, data) {
                if (err) { 
                    console.log("QUESTION RATING UPDATE FAILURE", err);
                } else {
                    console.log("QUESTION RATING UPDATE SUCCESS");                                          
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({"status":"OK","statuscode":200,"data":{"average_rating":averageRating}}));                    
                }
            });
        } else {
            console.log("QUESTION RATING UPDATE FAILURE - JOB ID Not Exists");
        }
    });
    return;
});

router.use("/updateInterest",function(req,res,next){
    console.log("Updating Interest Feedback Entry");
    next();
}); 

router.post('/updateInterest', function(req, res) {    
    var companyId = req.body.companyid;
    var jobId = req.body.jobid;
    var interest = req.body.interest;
    var options = { database: companyId, 
                    collectionName: 'recruiter_results',
                    query : '{"job_id":"'+jobId+'"}'
                  };
    conn.listDocuments(options, function(err, data) {
        if (err) { console.log("Error with Update Interest Job Fetching",err) }
        else {
            console.log('Update Interest Data: ');
            if (data.length > 0) {
                // JOB Exists
                var parsedResult = data[0];            
                var resultData = {"job_id": jobId, "questions": parsedResult.questions,"average_rating":  parsedResult.average_rating,"interest": interest};

                var updateInterestOptions = {
                    database: companyId,
                    collectionName: 'recruiter_results',
                    data: resultData,
                    query: '{"job_id":"' + jobId + '"}'
                };

                conn.updateDocuments(updateInterestOptions, function(err, data) {
                    if (err) { 
                        console.log("UPDATE JOB INTEREST FAILURE", err);
                    } else {
                        console.log("UPDATE JOB INTEREST SUCCESS");                                          
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({"status":"OK","statuscode":200}));                    
                    }
                });                
            }
        }
    });
    return;
});


app.use('/'+appName, router); 

app.listen(config.listenPort, function () {
  console.log('Splain Recruiter Application Started listening on port ' + config.listenPort);
});
