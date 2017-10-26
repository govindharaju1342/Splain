// load aws sdk
var aws = require('aws-sdk');

//load aws config
aws.config.loadFromPath('../sesconfig.json');

//load AWS SES
var ses = new aws.SES({apiVersion: '2010-12-01'});

//send to list
var to = ['thiyar@gmail.com']

// this must relate to a verified SES account
var from = 'thiya.ramalingam@splain.io'

var sub="Test123";


// this sends the email
// @todo - add HTML version
ses.sendEmail( { 
    Source: from, 
       Destination: { ToAddresses: to },
          Message: {
                 Subject:{
                       Data: sub
                 },
                 Body: {
                     Text: {
                            Data: 'Stop your voice',
                      }
                 }
          }
} , function(err, data) {
     if(err) throw err
     console.log('Email sent:');
                                                                                                                console.log(data);
});

