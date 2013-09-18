
/*
 * Superfish v1.4.8 - jQuery menu widget
 * Copyright (c) 2008 Joel Birch
 *
 * Dual licensed under the MIT and GPL licenses:
 * 	http://www.opensource.org/licenses/mit-license.php
 * 	http://www.gnu.org/licenses/gpl.html
 *
 * CHANGELOG: http://users.tpg.com.au/j_birch/plugins/superfish/changelog.txt
 */

(function(a){a.fn.superfish=function(b){var c=a.fn.superfish,d=c.c,e=a(['<span class="',d.arrowClass,'"> &#187;</span>'].join("")),f=function(){var b=a(this),c=h(b);clearTimeout(c.sfTimer);b.showSuperfishUl().siblings().hideSuperfishUl()},g=function(){var b=a(this),d=h(b),e=c.op;clearTimeout(d.sfTimer);d.sfTimer=setTimeout(function(){e.retainPath=a.inArray(b[0],e.$path)>-1;b.hideSuperfishUl();if(e.$path.length&&b.parents(["li.",e.hoverClass].join("")).length<1){f.call(e.$path)}},e.delay)},h=function(a){var b=a.parents(["ul.",d.menuClass,":first"].join(""))[0];c.op=c.o[b.serial];return b},i=function(a){a.addClass(d.anchorClass).append(e.clone())};return this.each(function(){var e=this.serial=c.o.length;var h=a.extend({},c.defaults,b);h.$path=a("li."+h.pathClass,this).slice(0,h.pathLevels).each(function(){a(this).addClass([h.hoverClass,d.bcClass].join(" ")).filter("li:has(ul)").removeClass(h.pathClass)});c.o[e]=c.op=h;a("li:has(ul)",this)[a.fn.hoverIntent&&!h.disableHI?"hoverIntent":"hover"](f,g).each(function(){if(h.autoArrows)i(a(">a:first-child",this))}).not("."+d.bcClass).hideSuperfishUl();var j=a("a",this);j.each(function(a){var b=j.eq(a).parents("li");j.eq(a).focus(function(){f.call(b)}).blur(function(){g.call(b)})});h.onInit.call(this)}).each(function(){var b=[d.menuClass];if(c.op.dropShadows&&!(a.browser.msie&&a.browser.version<7))b.push(d.shadowClass);a(this).addClass(b.join(" "))})};var b=a.fn.superfish;b.o=[];b.op={};b.IE7fix=function(){var c=b.op;if(a.browser.msie&&a.browser.version>6&&c.dropShadows&&c.animation.opacity!=undefined)this.toggleClass(b.c.shadowClass+"-off")};b.c={bcClass:"sf-breadcrumb",menuClass:"sf-js-enabled",anchorClass:"sf-with-ul",arrowClass:"sf-sub-indicator",shadowClass:"sf-shadow"};b.defaults={hoverClass:"sfHover",pathClass:"overideThisToUse",pathLevels:1,delay:800,animation:{opacity:"show"},speed:"normal",autoArrows:true,dropShadows:true,disableHI:false,onInit:function(){},onBeforeShow:function(){},onShow:function(){},onHide:function(){}};a.fn.extend({hideSuperfishUl:function(){var c=b.op,d=c.retainPath===true?c.$path:"";c.retainPath=false;var e=a(["li.",c.hoverClass].join(""),this).add(this).not(d).removeClass(c.hoverClass).find(">ul").hide().css("visibility","hidden");c.onHide.call(e);return this},showSuperfishUl:function(){var a=b.op,c=b.c.shadowClass+"-off",d=this.addClass(a.hoverClass).find(">ul:hidden").css("visibility","visible");b.IE7fix.call(d);a.onBeforeShow.call(d);d.animate(a.animation,a.speed,function(){b.IE7fix.call(d);a.onShow.call(d)});return this}})})(jQuery);
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
			// console.log($(this).first().parents().eq(3).find('input[type="submit"]'));
			$(this).parent().next().find('input[type="radio"]').attr('checked',true);
			// $(this).first().parents().eq(3).find('input[type="submit"]').mousedown();

		});
    }
  };

})(jQuery);;
