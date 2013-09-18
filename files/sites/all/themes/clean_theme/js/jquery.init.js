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

  Drupal.behaviors.exampleModule = {
    attach: function (context, settings) {
		$('.advpoll .choices .choice-image img').click(function(){
			$(this).parent().next().find('input[type="radio"]').attr('checked',true);

		});
    }
  };

})(jQuery);