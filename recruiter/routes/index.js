var express = require('express');
var router = express.Router();
var http = require('http');
var request = require('request');
var jquery = require('jquery');
var bodyParser = require('body-parser');
var OpenTok = require('opentok');
var Memcached = require('memcached');
var mLab = require('mongolab-data-api')('_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD');
var applicant_base_url = "https://splain.io/candidate";
var aws = require('aws-sdk');


//initializations - start
aws.config.loadFromPath('./sesconfig.json');
var ses = new aws.SES({apiVersion: '2010-12-01'});
var memcached = new Memcached('localhost:11211');
var apiKey = process.env.OPENTOK_API_KEY,
	apiSecret = process.env.OPENTOK_API_SEC;
if (!apiKey || !apiSecret) {
	console.log('You must specify API_KEY and API_SECRET environment variables');
    process.exit(1);
}
var opentok = new OpenTok(apiKey, apiSecret);
// initializations - end

router.get('/webrtc', function(req, res) {
	opentok.createSession( {mediaMode: 'routed'}, function(err, session) {
  		if (err) throw err;
	   	var sessionId = session.sessionId;
	    var token = opentok.generateToken(sessionId, { role: 'moderator' });
	    //cache the session id
		memcached.set('sessionId', sessionId, 86000, function(err, data) {
        	console.log(data);
		});
		res.render('host.ejs', {apiKey: apiKey, sessionId: sessionId, token: token});
  });
});

router.post('/start', function(req, res) {
  var hasAudio = true;
  var hasVideo = true;

  var id = memcached.get('sessionId', function(err, result) {
	if (err) console.err(err);
    // delete the last archive - to take of user start/stopping multile times before
    // publishing
    var archid = memcached.get('archiveId', function(err, result) {
        if (err) console.err(err);
        var archiveId = result;
        console.log("existing archive id = ", archiveId);
	    if (archiveId != null) {
	    	//delete the archive
	    	opentok.deleteArchive(archiveId, function(err) {
    			if (err) return res.send(500, 'Could not stop archive '+archiveId+'. error='+err.message);
  			});
		};
    });

    //call start archive
	opentok.startArchive(result, {
    	name: 'Recording Sample App',
    	hasAudio: hasAudio,
    	hasVideo: hasVideo
  	}, function(err, archive) {
    	if (err) return res.send(500,
      		'Could not start archive for session '+sessionId+'. error='+err.message
    	);
    	res.json(archive);
		console.log(archive);
  	});
  });
});


router.get('/stop/:archiveId', function(req, res) {
	var archiveId = req.param('archiveId');
  	opentok.stopArchive(archiveId, function(err, archive) {
    if (err) return res.send(500, 'Could not stop archive '+archiveId+'. error='+err.message);
    console.log("STOP Archive : ", archive);
    res.json(archive);
    // update cache and overwrite the archiveId. The last recording (archiveId) will be the right one before publishing
    memcached.set('archiveId', archiveId, 86000, function(err, data) {
        console.log(data);
    });

  });
});

router.get('/publish', function(req, res) {
  	// Get the last archive id, get the URL and add this to mongo
  	var id = memcached.get('archiveId', function(err, result) {
    	if (err) console.err(err);
		var archiveId = result;
    	console.log("publish archive id = ", archiveId);
	    //delete this from memcache
	    memcached.delete('archiveId', function(err, result) {
			if (err) console.log(err);
		});
    });
    res.redirect('/login');
});

// ***** Opentok specific code ends here *****

// Render the home page.
router.get('/',function(req, res) {

req.user.getCustomData(function(err, data) {
   res.render('index', {title: 'Home', user: req.user,custom: data});
  });
});


// Render the dashboard page after login
router.get('/dashboard', function (req, res) {
   if (!req.user || req.user.status !== 'ENABLED') {
     return res.redirect('/login');
   } else {
	req.user.getCustomData(function(err, data) {
       	   console.log("HERE admin flag:", data.admin);
  	});
	// pass admin flag to jade so that it can hide admin options
       res.render('dashboard', {title: 'Dashboard', user: req.user});
   }
});


router.post('/dashboard', function(req, res) {
   console.log('_____________*********_________________************__________');

       console.log('JSON_NAME= '+req.body.name);
       res.render('dashboard',{sentName:req.body.name});
       res.send('DONE');
});

// Render the Manage User page.
router.get('/manageuser', function (req, res) {
  if (!req.user || req.user.status !== 'ENABLED') {
     return res.redirect('/login');
     }
  res.render('manageuser', {title: 'Manage User', user: req.user});
});

// Render Mobile App Settings page
router.get('/theme', function(req,res) {

   var logo = "https://splain.com/logo.jpg";
   var bgcolor = "#6598bc";
   var accolor = "#6598bc";

  if (!req.user || req.user.status !== 'ENABLED') {
     return res.redirect('/login');
  }
   // retrieve values from app_properties collection if present
   request('https://api.mongolab.com/api/1/databases/example1/collections/app_properties?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
	if (!error && response.statusCode == 200) {
	    var obj = JSON.parse(body);
	    console.log("logo: ", obj[0].app_customer_logo, "color: ", obj[0].app_bg_color);
	    logo = obj[0].app_customer_logo;
	    bgcolor = obj[0].app_bg_color;
	    accolor = obj[0].app_ac_color;
	    res.render('theme', {user: req.user, logo: logo, bgcolor: bgcolor, accolor: accolor});
	} else {
	    res.render('theme', {user: req.user, logo: logo, bgcolor: bgcolor, accolor: accolor});
	}
   });

});

//post from mobileapp page
router.post('/theme', function(req, res) {

    // Add code here to post this to mongo collection 'appproperties'
    var uri = 'https://api.mongolab.com/api/1/databases/example1/collections/app_properties?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD';

    request({url: uri,
	     	method: 'PUT',
	     	json: {app_customer_logo: req.body.logo, app_bg_color: req.body.bgcolor, app_ac_color: req.body.accolor}}, function (error, request, body) {
    });

    // stay on the same page but use the new values
    res.redirect('/theme');
});


// Render Mail settings page
router.get('/mailsetting', function(req,res) {

    var subject = "Your appliation for <job title>";
    var from = "no.reply@mycompany.com";
    var body = "Thank you for applying";

	if (!req.user || req.user.status !== 'ENABLED') {
		return res.redirect('/login');
	}

	/*
	 * Display current mail settings
	 * Let user edit and change it
	 * variables are added with '$' design
	 * store it as it is and parse it when the e-mail is sent
	 */

    request('https://api.mongolab.com/api/1/databases/example1/collections/mailsettings?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var obj = JSON.parse(body);
            from = obj[0].from;
            subject = obj[0].sub;
			body = obj[0].body;
            console.log("from: "+ from+ "subject: "+ subject+ "body :"+body);
        }
        res.render('mailsetting', {user:req.user, from: from, sub: subject, body: body});
   });

});

//Process POST from Jade for mailsettings page
router.post('/mailsetting', function(req, res) {

    // post it to mongo collection mailsettings
    console.log("post - from"+req.body.from+"sub:"+req.body.sub+"body:"+req.body.body);
    var uri = 'https://api.mongolab.com/api/1/databases/example1/collections/mailsettings?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD';
    // Add code - for body
    request({url: uri,
             method: 'PUT',
             json: {from: req.body.from, sub: req.body.sub, body: req.body.body}},
             function (error, request, body) {
                console.log(body);
           });

    // render the same page with new values
    res.redirect('/mailsetting');
});


// the following function gets called when adding a new eval with "add evalaution"
router.get('/addlinkevaluation', function (req, res) {
  if (!req.user || req.user.status !== 'ENABLED') {
     return res.redirect('/login');
     }
	 request('https://api.mongolab.com/api/1/databases/example1/collections/question_objects?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
     if (!error && response.statusCode == 200) {
			 var evaluationDetails=body;
			 request('https://api.mongolab.com/api/1/databases/example1/collections/rule_objects?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
					if (!error && response.statusCode == 200) {
						var ruleDetails=body;
						request('https://api.mongolab.com/api/1/databases/example1/collections/evaluation?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
							if (!error && response.statusCode == 200) {

									res.render('addlinkevaluation', {title: 'Evaluation List', user: req.user, evJson:JSON.parse(evaluationDetails), ruleJson:JSON.parse(ruleDetails),  evaluationList:JSON.parse(body) });
							}
						});
					 }
			 });
     }
   });
});


// Render the Evaluation List page. called when the user select "Evalautions" from the left menu
router.get('/evaluationlist', function (req, res) {
  if (!req.user || req.user.status !== 'ENABLED') {
     return res.redirect('/login');
     }
   request('https://api.mongolab.com/api/1/databases/example1/collections/evaluation?s={"_id":1}&apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
		 console.log(body);
      if (!error && response.statusCode == 200) {
        res.render('evaluationlist', {title: 'Evaluation List', user: req.user, json:JSON.parse(body) });
      }
    });
});

router.get('/evaluationCheckJSON', function (req, res) {
  if (!req.user || req.user.status !== 'ENABLED') {
     return res.redirect('/login');
     }
   request('https://api.mongolab.com/api/1/databases/example1/collections/evaluation?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {

      if (!error && response.statusCode == 200) {
         return JSON.parse(body);
      }
    });
});


// Render the add Evaluation page.
router.get('/addevaluation', function (req, res) {
  if (!req.user || req.user.status !== 'ENABLED') {
     return res.redirect('/login');
     }
	request('https://api.mongolab.com/api/1/databases/example1/collections/question_objects?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      res.render('addevaluation', {title: 'Add Evaluation', user: req.user, json:JSON.parse(body) });
    }
  });
});


// the following is called when you click on a specific eval to edit
router.get('/editlinkevaluation/:key?', function (req, res) {
	if (!req.user || req.user.status !== 'ENABLED') {
    	return res.redirect('/login');
    }
  	request('https://api.mongolab.com/api/1/databases/example1/collections/evaluation?q={"_id": { "$oid" : "'+req.query.key+'"} }&apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
    if (!error && response.statusCode == 200) {
	  //	console.log("* eval exist");
      	var evaluationName=body;
	  //  console.log("*body=" + body);
		// get question objects
		request('https://api.mongolab.com/api/1/databases/example1/collections/question_objects?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
		    if (!error && response.statusCode == 200) {
            	//console.log(body);
            	var questionObjects=body;
			    // get rule objects
			    request('https://api.mongolab.com/api/1/databases/example1/collections/rule_objects?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
                	if (!error && response.statusCode == 200) {
						var ruleObjects = body;
						// Render everything
						//console.log("ruleObjects="+ruleObjects);
						 	console.log(evaluationName);
						// console.log("evJson=", JSON.parse(evaluationName));
					    res.render('editlinkevaluation', {title: 'Edit Linked Evaluation', user: req.user, evJson:JSON.parse(evaluationName), ruleJson:JSON.parse(ruleObjects), json:JSON.parse(questionObjects) });
					}
				});
	    	}
	    });
    }
  });
});

router.get('/editevaluation/:key?', function (req, res) {
	//console.log(req.query.key);
  if (!req.user || req.user.status !== 'ENABLED') {
     return res.redirect('/login');
     }
  request('https://api.mongolab.com/api/1/databases/example1/collections/evaluation?q={"_id": { "$oid" : "'+req.query.key+'"} }&apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var evaluationDetails=body;
			console.log(evaluationDetails);
			request('https://api.mongolab.com/api/1/databases/example1/collections/questions?q={"eval_collection_id": "'+req.query.key+'"}&apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
		    if (!error && response.statusCode == 200) {
					var questionsDetails=body;
		      console.log(questionsDetails);
					request('https://api.mongolab.com/api/1/databases/example1/collections/question_objects?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
				    if (!error && response.statusCode == 200) {
				      console.log(body);
				      res.render('editevaluation', {title: 'Edit Evaluation', user: req.user, evJson:JSON.parse(evaluationDetails), qusJson:JSON.parse(questionsDetails), json:JSON.parse(body) });
				    }
				  });
		    }
		  });
    }
  });
});


// the following gets called when you submit editing of an eval
router.post('/editlinkevaluationJSON', function(req, res) {
	var jSON=req.body;
    console.log("UPDATE in editlinkeval" + jSON);

 // 	request.put({
	// 	headers: {'content-type' : 'application/json'},
	// 	url:     'https://api.mongolab.com/api/1/databases/example1/collections/rules/'+jSON.key+'?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD',
	// 	body: JSON.stringify( { "$set" : { "rule" : JSON.stringify(jSON.rule) } } ),
	// }, function(error, response, body){
	// 	var body=JSON.parse(body);
	// 	//console.log(body);
	// });
	request.put({
		headers: {'content-type' : 'application/json'},
			url:     'https://api.mongolab.com/api/1/databases/example1/collections/evaluation/'+jSON.key+'?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD',
		 body: JSON.stringify( { "$set" : { "eval_name" : jSON.evaluation, "questions" : jSON.quesion , "rule" :  jSON.rule, "updated_on" :  jSON.updated_on  } } ),
	}, function(error, response, body){
			console.log(JSON.parse(body));
			var evaId=JSON.parse(body);
			console.log(evaId._id["$oid"]);
			// request.put({
			// 	headers: {'content-type' : 'application/json'},
			// 		url:     'https://api.mongolab.com/api/1/databases/example1/collections/questions?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD',
			// 	 body: JSON.stringify( { "eval_collection_id" : evaId._id["$oid"] ,"questions" : jSON.quesion } ),
			// }, function(error, response, body){
			// 	console.log(body);
			// });
	});
	res.redirect('/evaluationlist');
 });


router.post('/linkevaluationJSON', function(req, res) {
	var jSON=req.body;
	//console.log(jSON.eval_collection_id);
	request.post({
    headers: {'content-type' : 'application/json'},
    url:     'https://api.mongolab.com/api/1/databases/example1/collections/rules?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD',
    body: JSON.stringify( jSON ),
  }, function(error, response, body){
		  request.put({
	    	headers: {'content-type' : 'application/json'},
	    	url:     'https://api.mongolab.com/api/1/databases/example1/collections/evaluation/'+jSON.eval_collection_id+'?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD',
	    	body: JSON.stringify( { "$set" : { "link" : true } } ),
	  	}, function(error, response, body){
				var body=JSON.parse(body);
				//console.log(body);
	  	});
			var body=JSON.parse(body);
			//console.log(body);
  });
	res.redirect('/evaluationlist');
 });

/* The following function gets called when a new eval is submitted
 */

router.post('/evaluationJSON', function(req, res) {
    var jSON=req.body;
    var evalName = jSON.evaluation;
	var options = {
		database: 'example1',
		collectionName: 'evaluation',
		query: '{"eval_name": "'+evalName+'"}'
	};

	var evalName = jSON.evaluation;

	console.log("***", req.body);

	/*
	 * steps to parse and store eval criterias - it will make the search optimal later
	 *   parse json rule and get id - this is the doc id of rule objects
	 *   get the doc that matches the id. check if the rule name is reqtitle or reqnumber
	 *   get the string and save in evaluation object
	 *   get value
	 *   store that as well in evalaution object
	 */

	var cont = JSON.parse(jSON.rule);
	//we are only taking care of simple rule - Add code to handle complex rules
	var ruleid = cont.rules[0].id;
	var rulevalue = cont.rules[0].value;
	//search ruleobjects to get the name of the rule
	request('https://api.mongolab.com/api/1/databases/example1/collections/rule_objects?q={"_id": { "$oid" : "'+ruleid+'"} }&apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log("rule obj found for: ", ruleid);
			ruleJson = JSON.parse(body);
			console.log("rule block", ruleJson);
			rule_internalName = ruleJson[0].internalName;
			console.log("rule int name", rule_internalName);
			// Add code - check if the rule value already exists and reject it if it is
			// for example, we should not add two entried with the same requmber
			mLab.listDocuments(options, function(err, data) {
			if ((data.length) == 0) {
				console.log("CREATE HERE");
				// add an entry in evalaution document
				request.post({
					headers: {'content-type' : 'application/json'},
					url:     'https://api.mongolab.com/api/1/databases/example1/collections/evaluation?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD',
					body: JSON.stringify( { "eval_name" : jSON.evaluation, "rulename": rule_internalName, "rulevalue": rulevalue, "questions" : jSON.quesion, "rule": jSON.rule, "create_on": jSON.create_on  } ),
				}, function(error, response, body){
					console.log(body);
					res.redirect('/evaluationlist');
				});
			} else {
				console.log("ERROR adding - eval name already exist");
			}
			});
			//add end
		} else {
			console.log("rule obj NOT found for: ", ruleid);
		}
	});

});


// Render ATS pages

router.get('/editjob/:key?', function(req, res) {

	if (!req.user || req.user.status !== 'ENABLED') {
        return res.redirect('/login');
	}

	request('https://api.mongolab.com/api/1/databases/example1/collections/jobs?q={"_id": { "$oid" : "'+req.query.key+'"} }&apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body){
		if (!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			console.log("###" + req.query.key);
			// we are passing the mongo document _id as the key and get that back in post
			res.render('editjob', {id:req.query.key, evalid:json[0].evalid, applicant_url:json[0].applicant_url, emailsent:json[0].emailsent, reqtitle:json[0].reqtitle, user: req.user, reqnumber:json[0].reqnumber, recruiter:json[0].recruiter, applname:json[0].applname, applemail:json[0].applemail, curr_applemail:json[0].applemail });
		}
	});

});

router.post('/editjob', function(req, res) {
	console.log("POST from ATS Jade value ");
    console.log(req.body);

	process(req.body);

	function process(jSON) {

		var curr_applemail = jSON.curr_applemail;
		var data = {
			reqtitle: jSON.reqtitle,
			reqnumber: jSON.reqnumber,
			recruiter: jSON.recruiter,
			applname: jSON.applname,
			applemail: jSON.applemail,
			evalid: jSON.evalid,
			applicantUrl: jSON.applicant_url,
			emailsent: jSON.emailsent
		};

		console.log("***", data);

		//since we don't let user modify reqnum/title, we just dump the modified data into mongo

		request.put({ headers: {'content-type' : 'application/json'},
				   url:     'https://api.mongolab.com/api/1/databases/example1/collections/jobs/'+jSON.id+'?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD',
				   body: JSON.stringify(data),
		}, function(error, response, body){
			/* send e-mail if the form action is resend e-mail OR
			 * if there is a change in e-mail in address during edit operation and admin save it
			 * should trigger an e-mail
			 */
			if (data.action == "resend" || data.curr_applemail != data.applemail) {
				request('https://api.mongolab.com/api/1/databases/example1/collections/mailsettings?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
					var body = JSON.parse(body);
					var from = body[0].from;
					var content = body[0].body;
					var toemail = [data.applemail];
					var applurl = data.applicant_url;
					var	 sub = body[0].sub + " " + data.reqtitle;
					var body = body[0].body + "Evaluation URL: " + applurl;
					console.log("email: ", from, sub, content, toemail, applurl);
					ses.sendEmail( {
						Source: from,
						Destination: { ToAddresses: toemail },
					Message: {
						Subject:{
							Data: sub,
						},
						Body: {
							Html: {
							      Data: body,
							},

							Text: {
								Data: body,
							}
						}
					}
					} , function(err, data) {
						if(err) throw err;
						console.log('Email sent:');
					});
				});
			}
		});
	} //function

	res.redirect('/jobs');
});

router.get('/addjob', function(req, res) {

	if (!req.user || req.user.status !== 'ENABLED') {
    	return res.redirect('/login');
    }
    var reqtitle = "";
    var reqnumber = "";
    var recruiter="";
    var applname="";
    var applemail="";

    res.render('addjob', {reqtitle:reqtitle, user: req.user, reqnumber:reqnumber, recruiter:recruiter, applname:applname, applemail:applemail });
});

router.post('/addjob', function(req, res) {
    console.log("POST from ATS Jade value ");
    //console.log(req.body);

    var jSON = req.body;

	process(jSON);

	//Define a function so to take care of variable scoping
	function process(jSON) {

	var data = {
		reqtitle: jSON.reqtitle,
		reqnumber: jSON.reqnumber,
		recruiter: jSON.recruiter,
		applname: jSON.applname,
		applemail: jSON.applemail,
		evalid: "0",
		applicant_url: applicant_base_url+"/example1/",
		evalresulturl: "Pending",
		emailsent: "0"
	};

	// Add code to also check the reqtitle here
	request('https://api.mongolab.com/api/1/databases/example1/collections/evaluation?q={"rulename": "reqnumber", "rulevalue": "'+jSON.reqnumber+'"}&apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var eval = JSON.parse(body);
			if (eval.length != 0) {
				// match found - add the evalid. if there is no match, eval id will be zero
				console.log("matching eval with reqnum match");
				evalid = eval[0]._id["$oid"];
				console.log("eval id", evalid);
				data.evalid = evalid;
			} else {
				console.log("No matching eval for reqid - checking for reqtitle match");
				request('https://api.mongolab.com/api/1/databases/example1/collections/evaluation?q={"rulename": "reqtitle", "rulevalue": "'+jSON.reqtitle+'"}&apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body)	{
					if (!error && response.statusCode == 200) {
						var eval = JSON.parse(body);
						if (eval.length != 0) {
							// match found - add the evalid. if there is no match, eval id will be zero
							console.log("matching eval with reqtitle match");
							evalid = eval[0]._id["$oid"];
							console.log("eval id", evalid);
							data.evalid = evalid;
						}
					}
				}); //request

			} //reqtitle check
		}	else {
			console.log("HTTPS error");
		}

		//create a new doc to job collections with the id
		request.post({
			headers: {'content-type' : 'application/json'},
			url:     'https://api.mongolab.com/api/1/databases/example1/collections/jobs?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD',
			body: JSON.stringify(data),
		}, function(error, response, body){
			//update the same document with the document id in applicant_url field
			var body = JSON.parse(body);
			// this id is the jobs collection document id
			id = body._id["$oid"];
			body.applicant_url = body.applicant_url+id;
			data.applicant_url = body.applicant_url;
			console.log("URL ", data.applicant_url);
			request.put({
				headers: {'content-type' : 'application/json'},
			    url:     'https://api.mongolab.com/api/1/databases/example1/collections/jobs?q={"_id": { "$oid" : "'+id+'"}}&apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD',
			    body: JSON.stringify(body),
			}, function(error, response, body){
				// launch e-mail
				request('https://api.mongolab.com/api/1/databases/example1/collections/mailsettings?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
					var body = JSON.parse(body);
					var from = body[0].from;
					var content = body[0].body;
					var toemail = [data.applemail];
					var applurl = data.applicant_url;
					var	 sub = body[0].sub + " " + data.reqtitle;
					//var body = "Evaluation URL - " + applurl;
					var body = body[0].body + "Evaluation URL: " + applurl;

					console.log("email: ", from, sub, content, toemail, applurl);
					ses.sendEmail( {
						Source: from,
						Destination: { ToAddresses: toemail },
					Message: {
						Subject:{
							Data: sub,
						},
						Body: {
							Text: {
								Data: body,
							}
						}
					}
					} , function(err, data) {
						if(err) throw err;
						console.log('Email sent:');
					});
				});

			  }); //req.put
		});
	});
  } //process function

  res.redirect('/jobs');
});

router.get('/jobs', function(req, res) {

	if (!req.user || req.user.status !== 'ENABLED') {
    	return res.redirect('/login');
     }

   	request('https://api.mongolab.com/api/1/databases/example1/collections/jobs?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD', function (error, response, body) {
		console.log(body);
		json = JSON.parse(body);
		if (json.length != 0) {
			console.log("title " + json[0].reqtitle);
			if (!error && response.statusCode == 200) {
				res.render('joblist', {title: 'Req List', user: req.user, json:JSON.parse(body) });
			}
		} else {
			console.log("Empty joblist");
			res.redirect('/addjob');
		}
	});

});


/* POST from ATS pages
 * write the data in jobs collection
 */
router.post('/jobs', function(req, res) {
    console.log("POST from ATS Jade value ");
    console.log(req.body);

    var jSON = req.body;

    request.put({
    	headers: {'content-type' : 'application/json'},
        url:     'https://api.mongolab.com/api/1/databases/example1/collections/jobs?apiKey=_2WTyEf_DXgydY4XcJ29QzP0SstA1iBD',
        body: JSON.stringify(jSON),
    }, function(error, response, body){
	    res.redirect('/jobs');
	});

});

//Callback from Tokbox after the recording is published
router.post('/api/status', function(req, res) {
    console.log("API POST: ", req.body);
    if (req.body.status == "uploaded") {
	//the recorded file is uploaded - store the url in mongo
	var archiveId = req.body.id;
	console.log("archive id ", archiveId);
	/** the URL for the video is
        https://s3-us-west-2.amazonaws.com/splain-example/45558352/archiveId/archive.mp4
        ***/
    }

});

router.get('/connector', function(req, res) {

	if (!req.user || req.user.status !== 'ENABLED') {
	    return res.redirect('/login');
	}
	res.render('connector', {title: 'ATS Connectors', user: req.user});
});


module.exports = router;
