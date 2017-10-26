var session = OT.initSession(sessionId);
var publisher = OT.initPublisher(
  'publisher', // Replace with the replacement element ID
  {  
     name: 'Splain',
     style: {buttonDisplayMode: 'off'}
  }
);

var    archiveID = null;

session.connect(apiKey, token, function(err, info) {
  if(err) {
    alert(err.message || err);
  }
  session.publish(publisher);
});

session.on('streamCreated', function(event) {
  session.subscribe(event.stream, "subscribers", { insertMode: "append" });
});

session.on('archiveStarted', function(event) {
  archiveID = event.id;
  console.log("ARCHIVE STARTED");
  $(".start").hide();
  $(".publish").hide();
  $(".stop").show();
  disableForm();
});

session.on('archiveStopped', function(event) {
  archiveID = null;
  console.log("ARCHIVE STOPPED");
  $(".start").show();
  $(".publish").show();
  $(".stop").hide();
  enableForm();
});

$(document).ready(function() {
  $(".start").click(function (event) {
    var options = $(".archive-options").serialize();
    disableForm();
    $.post("/start", options).fail(enableForm);
  }).show();
  $(".stop").click(function(event){
    $.get("stop/" + archiveID);
  }).hide();
  $(".publish").click(function(event){
    $.get("publish/");
  }).hide();
});


function disableForm() {
  $(".archive-options-fields").attr('disabled', 'disabled');
}

function enableForm() {
  $(".archive-options-fields").removeAttr('disabled');
}
