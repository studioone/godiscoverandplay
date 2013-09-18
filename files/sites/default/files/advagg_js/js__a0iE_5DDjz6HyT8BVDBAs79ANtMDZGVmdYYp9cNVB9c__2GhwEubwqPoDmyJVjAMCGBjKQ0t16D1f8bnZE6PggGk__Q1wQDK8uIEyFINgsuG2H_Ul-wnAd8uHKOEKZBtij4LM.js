/* Source and licensing information for the line(s) below can be found at http://godiscoverandplay.com/profiles/openpublish/modules/contrib/views/js/jquery.ui.dialog.patch.js. */
(function($,undefined){if($.ui&&$.ui.dialog)$.ui.dialog.overlay.events=$.map('focus,keydown,keypress'.split(','),function(event){return event+'.dialog-overlay'}).join(' ')}(jQuery));
/* Source and licensing information for the above line(s) can be found at http://godiscoverandplay.com/profiles/openpublish/modules/contrib/views/js/jquery.ui.dialog.patch.js. */
/* Source and licensing information for the line(s) below can be found at http://godiscoverandplay.com/misc/states.js. */
(function($){var states=Drupal.states={postponed:[]};Drupal.behaviors.states={attach:function(context,settings){var $context=$(context);for(var selector in settings.states)for(var state in settings.states[selector])new states.Dependent({element:$context.find(selector),state:states.State.sanitize(state),constraints:settings.states[selector][state]});while(states.postponed.length)(states.postponed.shift())()}};states.Dependent=function(args){$.extend(this,{values:{},oldValue:null},args);this.dependees=this.getDependees();for(var selector in this.dependees)this.initializeDependee(selector,this.dependees[selector])};states.Dependent.comparisons={RegExp:function(reference,value){return reference.test(value)},Function:function(reference,value){return reference(value)},Number:function(reference,value){return(typeof value==='string')?compare(reference.toString(),value):compare(reference,value)}};states.Dependent.prototype={initializeDependee:function(selector,dependeeStates){var state;this.values[selector]={};for(var i in dependeeStates)if(dependeeStates.hasOwnProperty(i)){state=dependeeStates[i];if($.inArray(state,dependeeStates)===-1)continue;state=states.State.sanitize(state);this.values[selector][state.name]=null;$(selector).bind('state:'+state,$.proxy(function(e){this.update(selector,state,e.value)},this));new states.Trigger({selector:selector,state:state})}},compare:function(reference,selector,state){var value=this.values[selector][state.name];if(reference.constructor.name in states.Dependent.comparisons){return states.Dependent.comparisons[reference.constructor.name](reference,value)}else return compare(reference,value)},update:function(selector,state,value){if(value!==this.values[selector][state.name]){this.values[selector][state.name]=value;this.reevaluate()}},reevaluate:function(){var value=this.verifyConstraints(this.constraints);if(value!==this.oldValue){this.oldValue=value;value=invert(value,this.state.invert);this.element.trigger({type:'state:'+this.state,value:value,trigger:true})}},verifyConstraints:function(constraints,selector){var result;if($.isArray(constraints)){var hasXor=$.inArray('xor',constraints)===-1;for(var i=0,len=constraints.length;i<len;i++)if(constraints[i]!='xor'){var constraint=this.checkConstraints(constraints[i],selector,i);if(constraint&&(hasXor||result))return hasXor;result=result||constraint}}else if($.isPlainObject(constraints))for(var n in constraints)if(constraints.hasOwnProperty(n)){result=ternary(result,this.checkConstraints(constraints[n],selector,n));if(result===false)return false};return result},checkConstraints:function(value,selector,state){if(typeof state!=='string'||/[0-9]/.test(state[0])){state=null}else if(typeof selector==='undefined'){selector=state;state=null};if(state!==null){state=states.State.sanitize(state);return invert(this.compare(value,selector,state),state.invert)}else return this.verifyConstraints(value,selector)},getDependees:function(){var cache={},_compare=this.compare;this.compare=function(reference,selector,state){(cache[selector]||(cache[selector]=[])).push(state.name)};this.verifyConstraints(this.constraints);this.compare=_compare;return cache}};states.Trigger=function(args){$.extend(this,args);if(this.state in states.Trigger.states){this.element=$(this.selector);if(!this.element.data('trigger:'+this.state))this.initialize()}};states.Trigger.prototype={initialize:function(){var trigger=states.Trigger.states[this.state];if(typeof trigger=='function'){trigger.call(window,this.element)}else for(var event in trigger)if(trigger.hasOwnProperty(event))this.defaultTrigger(event,trigger[event]);this.element.data('trigger:'+this.state,true)},defaultTrigger:function(event,valueFn){var oldValue=valueFn.call(this.element);this.element.bind(event,$.proxy(function(e){var value=valueFn.call(this.element,e);if(oldValue!==value){this.element.trigger({type:'state:'+this.state,value:value,oldValue:oldValue});oldValue=value}},this));states.postponed.push($.proxy(function(){this.element.trigger({type:'state:'+this.state,value:oldValue,oldValue:null})},this))}};states.Trigger.states={empty:{keyup:function(){return this.val()==''}},checked:{change:function(){return this.attr('checked')}},value:{keyup:function(){if(this.length>1)return this.filter(':checked').val()||false;return this.val()},change:function(){if(this.length>1)return this.filter(':checked').val()||false;return this.val()}},collapsed:{collapsed:function(e){return(typeof e!=='undefined'&&'value'in e)?e.value:this.is('.collapsed')}}};states.State=function(state){this.pristine=this.name=state;while(true){while(this.name.charAt(0)=='!'){this.name=this.name.substring(1);this.invert=!this.invert};if(this.name in states.State.aliases){this.name=states.State.aliases[this.name]}else break}};states.State.sanitize=function(state){if(state instanceof states.State){return state}else return new states.State(state)};states.State.aliases={enabled:'!disabled',invisible:'!visible',invalid:'!valid',untouched:'!touched',optional:'!required',filled:'!empty',unchecked:'!checked',irrelevant:'!relevant',expanded:'!collapsed',readwrite:'!readonly'};states.State.prototype={invert:false,toString:function(){return this.name}};$(document).bind('state:disabled',function(e){if(e.trigger)$(e.target).attr('disabled',e.value).closest('.form-item, .form-submit, .form-wrapper').toggleClass('form-disabled',e.value).find('select, input, textarea').attr('disabled',e.value)});$(document).bind('state:required',function(e){if(e.trigger)if(e.value){$(e.target).closest('.form-item, .form-wrapper').find('label').append('<span class="form-required">*</span>')}else $(e.target).closest('.form-item, .form-wrapper').find('label .form-required').remove()});$(document).bind('state:visible',function(e){if(e.trigger)$(e.target).closest('.form-item, .form-submit, .form-wrapper').toggle(e.value)});$(document).bind('state:checked',function(e){if(e.trigger)$(e.target).attr('checked',e.value)});$(document).bind('state:collapsed',function(e){if(e.trigger)if($(e.target).is('.collapsed')!==e.value)$('> legend a',e.target).click()})
function ternary(a,b){return typeof a==='undefined'?b:(typeof b==='undefined'?a:a&&b)}
function invert(a,invert){return(invert&&typeof a!=='undefined')?!a:a}
function compare(a,b){return(a===b)?(typeof a==='undefined'?a:true):(typeof a==='undefined'||typeof b==='undefined')}})(jQuery);
/* Source and licensing information for the above line(s) can be found at http://godiscoverandplay.com/misc/states.js. */
