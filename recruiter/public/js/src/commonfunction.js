linkEvaluationjsonObj = [];

function gotoAdduser() {
  window.location.href="/adduser";
}

function gotoAddEvaluation() {
//  window.location.href="/addevaluation";
    window.location.href="/addlinkevaluation";
}
function gotoAddRule() {
  window.location.href="/addrule";
}

function gotoEditEvaluation(key) {
  //window.location.href="/editevaluation?key="+key;
    window.location.href="/editlinkevaluation?key="+key;
}

function gotoEditjob(key) {
	window.location.href="/editjob?key="+key;
}

function gotoAddjob() {
  window.location.href="/recruiter/addjob";
}

function gotoAddlinkeva() {
  window.location.href="/recruiter/addlinkevaluation";
}

function gotoEditlinkEvaluation(key){
  window.location.href="/editlinkevaluation?key="+key;
}

function getEvalutionvalue(val,page) {
  currentIndex=$(val).parents(".sequence-order-div").index();
  //console.log(currentIndex);
  $(".modal-title").html(" "+$(val).parents(".sequence-order-div").find(".question-header").html());
  $("#qustionTitle").val("");
  $("#questionSource").val("Provide URL");
  $(".questionTypeRow").show();
  if($(val).parents(".sequence-order-div").find(".question-header").attr("id")=="welcome_video"){
    $("#qustionURLtext").val("https://s3-us-west-2.amazonaws.com/splain-example/DemoManagerWelcome.mp4");
  }else if($(val).parents(".sequence-order-div").find(".question-header").attr("id")=="instruction_video"){
    $("#qustionURLtext").val("https://s3-us-west-2.amazonaws.com/splain-example/Instructions.mp4");
  }else if($(val).parents(".sequence-order-div").find(".question-header").attr("id")=="thanks_video"){
    $("#qustionURLtext").val("https://s3-us-west-2.amazonaws.com/splain-example/DemoThankYou.mp4");
  }else{
    $("#qustionURLtext").val("https://s3-us-west-2.amazonaws.com/splain-example/DemoQuestion1_CustomerSvc.mp4");
  }

  $(".questionUploadVideo").hide();
  $("#questionType").val($(val).parents(".sequence-order-div").find(".question-header").attr("id"));
   if( $(val).parents(".sequence-order-div").find(".question-header").attr("id")=="question_video"  || $(val).parents(".sequence-order-div").find(".question-header").attr("id")=="question_image"){
    $(".answertimeLimit").show();
  }else{
      $(".answertimeLimit").hide();
  }

  if(evaluationjsonObj.hasOwnProperty(currentIndex)){
    $("#qustionTitle").val(evaluationjsonObj[currentIndex].title);
  }else{
    $("#qustionTitle").val("");
     console.log("no");
  }

}
function getEditEvalutionvalue(val,page) {
  console.log(val);
  console.log(page);
  //console.log($(val).parents(".sequence-order-div").find(".edit-question-json").val());
  evaluationjsonObj=JSON.parse($(".edit-question-json").val());
  currentIndex=$(val).parents(".sequence-order-div").index();
  //console.log(evaluationjsonObj);
  if(page){
    currentIndex=$(val).parents(".sequence-order-div").index();
    if($(val).parents(".sequence-order-div").find(".question-header").attr("id")=="welcome_video"){
      $("#qustionURLtext").val("https://s3-us-west-2.amazonaws.com/splain-example/DemoManagerWelcome.mp4");
    }else if($(val).parents(".sequence-order-div").find(".question-header").attr("id")=="instruction_video"){
        $("#qustionURLtext").val("https://s3-us-west-2.amazonaws.com/splain-example/Instructions.mp4");
    }else if($(val).parents(".sequence-order-div").find(".question-header").attr("id")=="thanks_video"){
      $("#qustionURLtext").val("https://s3-us-west-2.amazonaws.com/splain-example/DemoThankYou.mp4");
    }else{
      $("#qustionURLtext").val("https://s3-us-west-2.amazonaws.com/splain-example/DemoQuestion1_CustomerSvc.mp4");
    }

    currentIndex=currentIndex-1;
    $("#edit-question-obj-id").val(currentIndex);
    $(".modal-title").html(" "+$(val).parents(".sequence-order-div").find(".question-header").html());
    $("#qustionTitle").val("");
    currentIndex=currentIndex-1;
    $(val).parents(".sequence-order-div").find(".edit-question-key").val(currentIndex)
    console.log($(val).parents(".sequence-order-div").find(".edit-question-key").val())
    //$("#questionType").val($(val).parents(".sequence-order-div").find(".question-header").attr("id"));
    $("#qustionTitle").val($(val).parents(".sequence-order-div").find(".edit-question-title").val());
    if($(val).parents(".sequence-order-div").find(".edit-question-type").val()==""){
      $("#questionType").val($(val).parents(".sequence-order-div").find(".question-header").attr("id"));
    }else{
      $("#questionType").val($(val).parents(".sequence-order-div").find(".question-header").attr("id"));
    }
    // $("#questionType").val($(val).parent(".sequence-order-edit-link").find(".edit-question-url").val());
    $("#answerType").val($(val).parents(".sequence-order-div").find(".edit-answer-type").val());
    $("#quesionRepeats").prop( "checked", $(val).parents(".sequence-order-div").find(".edit-repeats-allowed").val() );
    $("#answertimeLimit").val($(val).parents(".sequence-order-div").find(".edit-answer-time-limit").val());

  }else{

    $("#qustionTitle").val($(val).parents(".sequence-order-div").find(".edit-question-title").val());
    $("#questionType").val($(val).parents(".sequence-order-div").find(".edit-question-type").val());
    // $("#questionType").val($(val).parent(".sequence-order-edit-link").find(".edit-question-url").val());
    $("#answerType").val($(val).parents(".sequence-order-div").find(".edit-answer-type").val());
    $("#quesionRepeats").prop( "checked", $(val).parents(".sequence-order-div").find(".edit-repeats-allowed").val() );
    $("#answertimeLimit").val($(val).parents(".sequence-order-div").find(".edit-answer-time-limit").val());
    console.log($(val).parents(".sequence-order-div").find(".edit-question-key").val())
    if($("#edit-question-obj-key").val()=="edit"){
      var index =parseInt($(val).parents(".sequence-order-div").find(".edit-question-key").val())+1;
      $("#edit-question-obj-id").val(index);
    }
  }
  if( $(val).parents(".sequence-order-div").find(".edit-question-type").val()=="question_video"  || $(val).parents(".sequence-order-div").find(".edit-question-type").val()=="question_image"){
      $(".answertimeLimit").show();
   }else{
       $(".answertimeLimit").hide();
   }

}

function getFilename(val) {
    var value= $(val).val().toString();
    value=value.split('\\');
    $(".file-input-name").html(value[2]);
}

function createQustionjson(val) {
  var qustionTitle=$("#qustionTitle").val();
  var questionType=$("#questionType").val();
  var questionUrl=$(".fileinput input:file").val();
  var answerType=$("#answerType").val();
  var quesionRepeats=$("#quesionRepeats").is(':checked');
  var answertimeLimit=$("#answertimeLimit").val();

   // hardcoded to take the url value only - record now and upload file later
  var questionUrl = $("#qustionURLtext").val();
  item = {}
  item ["title"] = qustionTitle;
  item ["question_type"] = questionType;
  item ["question_url"] = questionUrl;
  item ["image_url"] = questionUrl;
  item ["answer_type"] = answerType;
  item ["repeats_allowed"] = quesionRepeats;
  item ["answer_time_limit"] = answertimeLimit;
  evaluationjsonObj[currentIndex]=item;
  $('.sequence-order-div:eq('+currentIndex+')').find(".header").html(qustionTitle);
}
function editCreateQustionjson(val) {

  var divId=$("#edit-question-obj-id").val();
  divId=divId-1;
  var qustionTitle=$("#qustionTitle").val();
  console.log(divId);
  $('.sequence-order-div:eq('+divId+')').find(".edit-question-title").val(qustionTitle);
  var questionType=$("#questionType").val();
  $('.sequence-order-div:eq('+divId+')').find(".edit-question-type").val(questionType);
  var questionUrl=$(".fileinput input:file").val();
  $('.sequence-order-div:eq('+divId+')').find(".edit-question-url").val(questionType);
  var answerType=$("#answerType").val();
  $('.sequence-order-div:eq('+divId+')').find(".edit-answer-type").val(answerType);
  var quesionRepeats=$("#quesionRepeats").is(':checked');
  $('.sequence-order-div:eq('+divId+')').find(".edit-repeats-allowed").val(quesionRepeats);
  var answertimeLimit=$("#answertimeLimit").val();
  $('.sequence-order-div:eq('+divId+')').find(".edit-answer-time-limit").val(answertimeLimit);
   // hardcoded to take the url value only - record now and upload file later
  var questionUrl = $("#qustionURLtext").val();
  item = {}
  item ["title"] = qustionTitle;
  item ["question_type"] = questionType;
  item ["question_url"] = questionUrl;
  item ["image_url"] = questionUrl;
  item ["answer_type"] = answerType;
  item ["repeats_allowed"] = quesionRepeats;
  item ["answer_time_limit"] = answertimeLimit;
  // console.log(evaluationjsonObj);
  // console.log(parseInt(divId));
  var evaluationjsonObjLength=evaluationjsonObj.length;
  console.log("evaluationjsonObjLength"+evaluationjsonObjLength);
  console.log("divId"+parseInt(divId));
  evaluationjsonObj[parseInt(divId)]=item;
  console.log(evaluationjsonObj);
  $(".edit-question-json").val(JSON.stringify(evaluationjsonObj));
  $('.sequence-order-div:eq('+divId+')').find(".edit-header").html(qustionTitle);
  $('.sequence-order-div:eq('+divId+')').find(".header").html(qustionTitle);
}
function queryEditlinkEvRuleSubmit(){
  if($("#evaluationName").val()==""){
    alert("Please enter evaluation name...");
    return false;
  }
  var key=$(".key-value").val();
  console.log(key);
  var result = $('#builder-basic').queryBuilder('getRules');
  console.log(result);
  item = {};
  item ["key"] = key;
  item ["rule"] = JSON.stringify(result);
  item ["quesion"] = JSON.parse($(".edit-question-json").val());
  item ["evaluation"] = $("#evaluationName").val();
  item ["updated_on"] = new Date().getTime();
  var query=JSON.stringify(item);
  console.log(query);
  $.ajax({
    type: 'POST',
    url: 'editlinkevaluationJSON',
    data: query,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success:function(data){
    },
    error:function(){
    },
    complete:function(){
        window.location.href="/recruiter/evaluationlist";
    }
  });
}
function submitEvaluation() {
  if($("#evaluationName").val()==""){
    alert("Please enter evaluation name...");
    return false;
  }
  evaluationjsonObjTemp = [];
  item = {}
  item ["quesion"] = evaluationjsonObj;
  item ["evaluation"] = $("#evaluationName").val();
  var query=JSON.stringify(item);
  $.ajax({
    type: 'POST',
    url: 'evaluationJSON',
    data: query,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success:function(data){
    },
    error:function(){
    },
    complete:function(){
      window.location.href="/recruiter/evaluationlist";
    }
  })
}
function submitRule() {
  if($("#ruleName").val()==""){
    alert("Please enter rule name...");
    return false;
  }
  if($("#ruleOperators").val()==""){
    alert("Please select the operators...");
    return false;
  }
  item = {}
  item ["ruleName"] = $("#ruleName").val().trim();
  item ["operator"] = $("#ruleOperators").val();
  var query=JSON.stringify(item);
  $.ajax({
    type: 'POST',
    url: 'ruleJSON',
    data: query,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success:function(data){
    },
    error:function(){
    },
    complete:function(){
      window.location.href="/rulelist";
    }
  })
}

function checkQuestionurl(val) {
  $(".questionTypeRow").hide();
  if($(val).val()=="Provide URL") {
    $("#questionProvideURL").show();
  } else if($(val).val()=="Upload Video") {
    $("#questionUploadVideo").show();
  }
}

function linkEvRule(val){
  var ruleId=$(val).parents("tr").attr("id");
  var note=$(val).parents("tr").find(".rule-note").val();
  item = {}
  item ["ruleId"] = ruleId;
  item ["note"] = note;
  linkEvaluationjsonObj.push(item);
  $(val).parents("tr").remove();
}

function duplicateEvaCheck(){

  evaluationItem = {}
  evaluationItem ["evaluation"] = $("#evaluationName").val();
  $.ajax({
    type: 'POST',
    url: 'evaluationCheckJSON',
    data: evaluationItem,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success:function(data){
      console.log(data);
    },
    error:function(){
    },
    complete:function(){
    }
  });
}
function querylinkEvRuleSubmit(){
  var evaluationList= $("#evaluationList").val();
  evaluationList=evaluationList.split(",");

  if($("#evaluationName").val()==""){
    alert("Please enter evaluation name...");
    return false;
  }
  for(var i=0; i<evaluationList.length; i++){
    if($("#evaluationName").val()==evaluationList[i]){
      alert("Evaluation name already exists");
      return false;
    }
  }
  var result = $('#builder-basic').queryBuilder('getRules');

  if (!$.isEmptyObject(result)) {
    //alert(JSON.stringify(result, null, 2));
  }else{
    alert("Please assign rules...");
    return false;
  }

  evaluationItem = {}
  evaluationItem ["quesion"] = evaluationjsonObj;
  evaluationItem ["evaluation"] = $("#evaluationName").val();
  evaluationItem ["rule"] = JSON.stringify(result);
  evaluationItem ["create_on"] = new Date().getTime();
  var evaluationItemQuery=JSON.stringify(evaluationItem);

  $.ajax({
    type: 'POST',
    url: 'evaluationJSON',
    data: evaluationItemQuery,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success:function(data){
    },
    error:function(){
    },
    complete:function(){
       window.location.href="/recruiter/evaluationlist";
     }
  });

}
// function linkEvRuleSubmit(){
//   if($("#linkEvaluationType").val()==""){
//     alert("Please select evaluation name...");
//     return false;
//   }
//   linkEvaluationjsonObjTemp = [];
//   item = {}
//   item ["rule"] = linkEvaluationjsonObj;
//   item ["eval_collection_id"] = $("#linkEvaluationType").val();
//   var query=JSON.stringify(item);
//   $.ajax({
//     type: 'POST',
//     url: 'linkevaluationJSON',
//     data: query,
//     contentType: "application/json; charset=utf-8",
//     dataType: "json",
//     success:function(data){
//
//     },
//     error:function(){
//     },
//     complete:function(){
//       window.location.href="/linkedevaluationlist";
//     }
//   })
// }
function gotolinkevaTab(val) {
  $(".unlink-eva-div").hide();
  $(".link-eva-div").show();
  $(".link-tab li").removeClass("active");
  $(val).addClass("active");
}
function gotounlinkevaTab(val) {
  $(".link-eva-div").hide();
  $(".unlink-eva-div").show();
  $(".link-tab li").removeClass("active");
  $(val).addClass("active");
}
function removeDropedDiv(val){
  $(val).parent("div").remove();
}
function editremoveDropedDiv(val){
  var keyValue=$(val).parents(".sequence-order-div").find(".question-header").html();
  currentIndex=$(val).parents(".sequence-order-div").index();
  console.log(currentIndex);
  evaluationjsonObj=JSON.parse($(".edit-question-json").val());
  console.log(evaluationjsonObj);
  for(var i = 0; i < evaluationjsonObj.length; i++) {
    if(evaluationjsonObj[i]["question_type"]==keyValue){
      evaluationjsonObj.splice(i, 1);
    }
   }
  console.log(evaluationjsonObj);
  $(".edit-question-json").val(JSON.stringify(evaluationjsonObj));
  $(val).parents(".sequence-order-div").remove();
  slider2.destroySlider();
  slider2 = $('.slider2').bxSlider({
    slideWidth: 193,
    minSlides: 2,
    maxSlides: 5,
    slideMargin: 2,
    infiniteLoop: false
  });
}

function connector(){

}
