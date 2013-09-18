/* Source and licensing information for the line(s) below can be found at http://godiscoverandplay.com/modules/overlay/overlay-child.js. */
(function($){Drupal.behaviors.overlayChild={attach:function(context,settings){if(this.processed)return;this.processed=true;if(!parent.Drupal||!parent.Drupal.overlay)window.location=window.location.href.replace(/([?&]?)render=overlay&?/g,'$1').replace(/\?$/,'');var settings=settings.overlayChild||{};if(settings.refreshPage)parent.Drupal.overlay.refreshPage=true;if(settings.closeOverlay){parent.Drupal.overlay.bindChild(window,true);setTimeout(function(){if(typeof settings.redirect=='string'){parent.Drupal.overlay.redirect(settings.redirect)}else parent.Drupal.overlay.close()},1);return};if(settings.refreshRegions)parent.Drupal.overlay.refreshRegions(settings.refreshRegions);parent.Drupal.overlay.bindChild(window);window.scrollTo(window.scrollX,window.scrollY);Drupal.overlayChild.attachBehaviors(context,settings);$('#overlay-disable-message',context).focusin(function(){$(this).addClass('overlay-disable-message-focused');$('a.element-focusable',this).removeClass('element-invisible')}).focusout(function(){$(this).removeClass('overlay-disable-message-focused');$('a.element-focusable',this).addClass('element-invisible')})}};Drupal.overlayChild=Drupal.overlayChild||{behaviors:{}};Drupal.overlayChild.prototype={};Drupal.overlayChild.attachBehaviors=function(context,settings){$.each(this.behaviors,function(){this(context,settings)})};Drupal.overlayChild.behaviors.addClickHandler=function(context,settings){$(document).bind('click.drupal-overlay mouseup.drupal-overlay',$.proxy(parent.Drupal.overlay,'eventhandlerOverrideLink'))};Drupal.overlayChild.behaviors.parseForms=function(context,settings){$('form',context).once('overlay',function(){var action=$(this).attr('action');if(action==undefined||(action.indexOf('http')!=0&&action.indexOf('https')!=0)){action+=(action.indexOf('?')>-1?'&':'?')+'render=overlay';$(this).attr('action',action)}else $(this).attr('target','_new')})};Drupal.overlayChild.behaviors.loading=function(context,settings){var $title,text=Drupal.t('Loading'),dots='';$(document).bind('drupalOverlayBeforeLoad.drupal-overlay.drupal-overlay-child-loading',function(){$title=$('#overlay-title').text(text);var id=setInterval(function(){dots=(dots.length>10)?'':dots+'.';$title.text(text+dots)},500)})};Drupal.overlayChild.behaviors.tabs=function(context,settings){var $tabsLinks=$('#overlay-tabs > li > a');$('#overlay-tabs > li > a').bind('click.drupal-overlay',function(){var active_tab=Drupal.t('(active tab)');$tabsLinks.parent().siblings().removeClass('active').find('element-invisible:contains('+active_tab+')').appendTo(this);$(this).parent().addClass('active')})};Drupal.overlayChild.behaviors.shortcutAddLink=function(context,settings){$('#overlay-titlebar').find('.add-or-remove-shortcuts').remove();var $addToShortcuts=$('.add-or-remove-shortcuts');if($addToShortcuts.length)$addToShortcuts.insertAfter('#overlay-title');$(document).bind('drupalOverlayBeforeLoad.drupal-overlay.drupal-overlay-child-loading',function(){$('#overlay-titlebar').find('.add-or-remove-shortcuts').remove()})};Drupal.overlayChild.behaviors.alterTableHeaderOffset=function(context,settings){if(Drupal.settings.tableHeaderOffset)Drupal.overlayChild.prevTableHeaderOffset=Drupal.settings.tableHeaderOffset;Drupal.settings.tableHeaderOffset='Drupal.overlayChild.tableHeaderOffset'};Drupal.overlayChild.tableHeaderOffset=function(){var topOffset=Drupal.overlayChild.prevTableHeaderOffset?eval(Drupal.overlayChild.prevTableHeaderOffset+'()'):0;return topOffset+parseInt($(document.body).css('marginTop'))}})(jQuery);
/* Source and licensing information for the above line(s) can be found at http://godiscoverandplay.com/modules/overlay/overlay-child.js. */
/* Source and licensing information for the line(s) below can be found at http://godiscoverandplay.com/profiles/openpublish/modules/contrib/views/js/jquery.ui.dialog.patch.js. */
(function($,undefined){if($.ui&&$.ui.dialog)$.ui.dialog.overlay.events=$.map('focus,keydown,keypress'.split(','),function(event){return event+'.dialog-overlay'}).join(' ')}(jQuery));
/* Source and licensing information for the above line(s) can be found at http://godiscoverandplay.com/profiles/openpublish/modules/contrib/views/js/jquery.ui.dialog.patch.js. */
