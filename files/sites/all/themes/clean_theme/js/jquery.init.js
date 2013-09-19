jQuery(function($){
	$(document).ready(function(){
		//dropdowns
		$("#main-menu ul.menu").superfish({ 
			autoArrows: true,
			animation:  {opacity:'show',height:'show'}
		});
	}); // END doc ready
}); // END function

(function ($) {

  Drupal.behaviors.imagePoll = {
    attach: function (context, settings) {
    	$('.view-image-poll-list .field-name-body').hide();
		$('.view-image-poll-list form').next('.field-name-body').show();
		$('.advpoll .choices .choice-image img').click(function(){
			$(this).parent().next().find('input[type="radio"]').attr('checked',true);
		});
    }
  };

})(jQuery);