
(function($) {
  $(document).ready(function() {
    evaluationjsonObj = [];
    var currentIndex;
    slider1  = $('.slider1').bxSlider({
      slideWidth: 193,
      minSlides: 2,
      maxSlides: 5,
      slideMargin: 2,
      infiniteLoop: false
    });

    slider2=0;

    slider2 = $('.slider2').bxSlider({
      slideWidth: 193,
      minSlides: 2,
      maxSlides: 5,
      slideMargin: 2,
      infiniteLoop: false
    });

    $( ".question-carousel" ).draggable({
      appendTo: "body",
      helper: "clone"
    });

    $( ".sequence-order" ).droppable({
       drop: function( event, ui ) {
        $( ".sequence-order" ).append( "<div class='sequence-order-div'>"+ui.draggable.html()+"</div>" ).appendTo( this );
        //$(this).find(".sequence-order-edit-link").remove();
        var pageVal=$("#edit-question-obj-key").val();
        var divLength= parseInt($(this).find(".sequence-order-div").length)-1;
        if(pageVal=="edit"){
          $(this).find(".sequence-order-div:eq("+divLength+")").append("<img src='images/delete.png' title='Remove' class='delete-drop-div' onclick='removeDropedDiv(this)' /> <div class='sequence-order-edit-link'><input type='hidden' class='edit-question-json' value='"+$("#edit-question-obj-json").val()+"' /><input type='hidden' class='edit-question-key' /><input type='hidden' class='edit-question-title' /><input type='hidden' class='edit-question-type' /><input type='hidden' class='edit-question-url' /><input type='hidden' class='edit-image-url' /><input type='hidden' class='edit-answer-type' /><input type='hidden' class='edit-repeats-allowed' /><input type='hidden' class='edit-answer-time-limit' /><div class='header'> </div><button type='button' class='btn btn-success btn-sm' data-toggle='modal' onclick='getEditEvalutionvalue(this,\""+pageVal+"\")' data-target='#myModal'>Edit</button></div>");
        }else{
          $(this).find(".sequence-order-div:eq("+divLength+")").append("<img src='images/delete.png' title='Remove' class='delete-drop-div' onclick='removeDropedDiv(this)' /> <div class='sequence-order-edit-link'><div class='header'> </div><button type='button' class='btn btn-success btn-sm' data-toggle='modal' onclick='getEvalutionvalue(this)' data-target='#myModal'>Edit</button></div>");
        }

        //ui.draggable.remove();
        slider1.destroySlider();
        slider1 = $('.slider1').bxSlider({
          slideWidth: 193,
          minSlides: 2,
          maxSlides: 5,
          slideMargin: 2,
          infiniteLoop: false
        });
        if(slider2 != 0){
          slider2.destroySlider();
        }
        slider2 = $('.slider2').bxSlider({
          slideWidth: 193,
          minSlides: 2,
          maxSlides: 5,
          slideMargin: 2,
          infiniteLoop: false
        });
      }
    })
    // .sortable({
    //   sort: function() {
    //   }
    // }).disableSelection();
  });
}(jQuery));
