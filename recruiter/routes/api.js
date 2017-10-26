var express = require('express');
var router = express.Router();
var http = require('http');
var request = require('request');
var jquery = require('jquery');
var bodyParser = require('body-parser');
var OpenTok = require('opentok');
var Memcached = require('memcached');

router.get('/api/status', function(req, res) {
    console.log("API CALLED");
});
