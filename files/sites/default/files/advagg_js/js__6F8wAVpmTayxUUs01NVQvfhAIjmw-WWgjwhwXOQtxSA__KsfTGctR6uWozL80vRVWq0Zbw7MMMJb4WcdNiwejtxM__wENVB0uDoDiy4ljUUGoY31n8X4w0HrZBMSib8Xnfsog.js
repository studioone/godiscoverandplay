/**
 * @file
 * Implement a simple, clickable dropbutton menu.
 *
 * See dropbutton.theme.inc for primary documentation.
 *
 * The javascript relies on four classes:
 * - The dropbutton must be fully contained in a div with the class
 *   ctools-dropbutton. It must also contain the class ctools-no-js
 *   which will be immediately removed by the javascript; this allows for
 *   graceful degradation.
 * - The trigger that opens the dropbutton must be an a tag wit hthe class
 *   ctools-dropbutton-link. The href should just be '#' as this will never
 *   be allowed to complete.
 * - The part of the dropbutton that will appear when the link is clicked must
 *   be a div with class ctools-dropbutton-container.
 * - Finally, ctools-dropbutton-hover will be placed on any link that is being
 *   hovered over, so that the browser can restyle the links.
 *
 * This tool isn't meant to replace click-tips or anything, it is specifically
 * meant to work well presenting menus.
 */

(function ($) {
  Drupal.behaviors.CToolsDropbutton = {
    attach: function() {
      // Process buttons. All dropbuttons are buttons.
      $('.ctools-button')
        .once('ctools-button')
        .removeClass('ctools-no-js');

      // Process dropbuttons. Not all buttons are dropbuttons.
      $('.ctools-dropbutton').once('ctools-dropbutton', function() {
        var $dropbutton = $(this);
        var $button = $('.ctools-content', $dropbutton);
        var $secondaryActions = $('li', $button).not(':first');
        var $twisty = $(".ctools-link", $dropbutton);
        var open = false;
        var hovering = false;
        var timerID = 0;

        var toggle = function(close) {
          // if it's open or we're told to close it, close it.
          if (open || close) {
            // If we're just toggling it, close it immediately.
            if (!close) {
              open = false;
              $secondaryActions.slideUp(100);
              $dropbutton.removeClass('open');
            }
            else {
              // If we were told to close it, wait half a second to make
              // sure that's what the user wanted.
              // Clear any previous timer we were using.
              if (timerID) {
                clearTimeout(timerID);
              }
              timerID = setTimeout(function() {
                if (!hovering) {
                  open = false;
                  $secondaryActions.slideUp(100);
                  $dropbutton.removeClass('open');
                }}, 500);
            }
          }
          else {
            // open it.
            open = true;
            $secondaryActions.animate({height: "show", opacity: "show"}, 100);
            $dropbutton.addClass('open');
          }
        }
        // Hide the secondary actions initially.
        $secondaryActions.hide();

        $twisty.click(function() {
            toggle();
            return false;
          });

        $dropbutton.hover(
          function() {
            hovering = true;
          }, // hover in
          function() { // hover out
            hovering = false;
            toggle(true);
            return false;
          }
        );
      });
    }
  }
})(jQuery);
;
/**
 * @file
 * Provides dependent visibility for form items in CTools' ajax forms.
 *
 * To your $form item definition add:
 * - '#process' => array('ctools_process_dependency'),
 * - '#dependency' => array('id-of-form-item' => array(list, of, values, that,
 *   make, this, item, show),
 *
 * Special considerations:
 * - Radios are harder. Because Drupal doesn't give radio groups individual IDs,
 *   use 'radio:name-of-radio'.
 *
 * - Checkboxes don't have their own id, so you need to add one in a div
 *   around the checkboxes via #prefix and #suffix. You actually need to add TWO
 *   divs because it's the parent that gets hidden. Also be sure to retain the
 *   'expand_checkboxes' in the #process array, because the CTools process will
 *   override it.
 */

(function ($) {
  Drupal.CTools = Drupal.CTools || {};
  Drupal.CTools.dependent = {};

  Drupal.CTools.dependent.bindings = {};
  Drupal.CTools.dependent.activeBindings = {};
  Drupal.CTools.dependent.activeTriggers = [];

  Drupal.CTools.dependent.inArray = function(array, search_term) {
    var i = array.length;
    while (i--) {
      if (array[i] == search_term) {
         return true;
      }
    }
    return false;
  }


  Drupal.CTools.dependent.autoAttach = function() {
    // Clear active bindings and triggers.
    for (i in Drupal.CTools.dependent.activeTriggers) {
      $(Drupal.CTools.dependent.activeTriggers[i]).unbind('change');
    }
    Drupal.CTools.dependent.activeTriggers = [];
    Drupal.CTools.dependent.activeBindings = {};
    Drupal.CTools.dependent.bindings = {};

    if (!Drupal.settings.CTools) {
      return;
    }

    // Iterate through all relationships
    for (id in Drupal.settings.CTools.dependent) {
      // Test to make sure the id even exists; this helps clean up multiple
      // AJAX calls with multiple forms.

      // Drupal.CTools.dependent.activeBindings[id] is a boolean,
      // whether the binding is active or not.  Defaults to no.
      Drupal.CTools.dependent.activeBindings[id] = 0;
      // Iterate through all possible values
      for(bind_id in Drupal.settings.CTools.dependent[id].values) {
        // This creates a backward relationship.  The bind_id is the ID
        // of the element which needs to change in order for the id to hide or become shown.
        // The id is the ID of the item which will be conditionally hidden or shown.
        // Here we're setting the bindings for the bind
        // id to be an empty array if it doesn't already have bindings to it
        if (!Drupal.CTools.dependent.bindings[bind_id]) {
          Drupal.CTools.dependent.bindings[bind_id] = [];
        }
        // Add this ID
        Drupal.CTools.dependent.bindings[bind_id].push(id);
        // Big long if statement.
        // Drupal.settings.CTools.dependent[id].values[bind_id] holds the possible values

        if (bind_id.substring(0, 6) == 'radio:') {
          var trigger_id = "input[name='" + bind_id.substring(6) + "']";
        }
        else {
          var trigger_id = '#' + bind_id;
        }

        Drupal.CTools.dependent.activeTriggers.push(trigger_id);

        if ($(trigger_id).attr('type') == 'checkbox') {
          $(trigger_id).siblings('label').addClass('hidden-options');
        }

        var getValue = function(item, trigger) {
          if ($(trigger).size() == 0) {
            return null;
          }

          if (item.substring(0, 6) == 'radio:') {
            var val = $(trigger + ':checked').val();
          }
          else {
            switch ($(trigger).attr('type')) {
              case 'checkbox':
                var val = $(trigger).attr('checked') ? true : false;

                if (val) {
                  $(trigger).siblings('label').removeClass('hidden-options').addClass('expanded-options');
                }
                else {
                  $(trigger).siblings('label').removeClass('expanded-options').addClass('hidden-options');
                }

                break;
              default:
                var val = $(trigger).val();
            }
          }
          return val;
        }

        var setChangeTrigger = function(trigger_id, bind_id) {
          // Triggered when change() is clicked.
          var changeTrigger = function() {
            var val = getValue(bind_id, trigger_id);

            if (val == null) {
              return;
            }

            for (i in Drupal.CTools.dependent.bindings[bind_id]) {
              var id = Drupal.CTools.dependent.bindings[bind_id][i];
              // Fix numerous errors
              if (typeof id != 'string') {
                continue;
              }

              // This bit had to be rewritten a bit because two properties on the
              // same set caused the counter to go up and up and up.
              if (!Drupal.CTools.dependent.activeBindings[id]) {
                Drupal.CTools.dependent.activeBindings[id] = {};
              }

              if (val != null && Drupal.CTools.dependent.inArray(Drupal.settings.CTools.dependent[id].values[bind_id], val)) {
                Drupal.CTools.dependent.activeBindings[id][bind_id] = 'bind';
              }
              else {
                delete Drupal.CTools.dependent.activeBindings[id][bind_id];
              }

              var len = 0;
              for (i in Drupal.CTools.dependent.activeBindings[id]) {
                len++;
              }

              var object = $('#' + id + '-wrapper');
              if (!object.size()) {
                // Some elements can't use the parent() method or they can
                // damage things. They are guaranteed to have wrappers but
                // only if dependent.inc provided them. This check prevents
                // problems when multiple AJAX calls cause settings to build
                // up.
                var $original = $('#' + id);
                if ($original.is('fieldset') || $original.is('textarea')) {
                  continue;
                }

                object = $('#' + id).parent();
              }

              if (Drupal.settings.CTools.dependent[id].type == 'disable') {
                if (Drupal.settings.CTools.dependent[id].num <= len) {
                  // Show if the element if criteria is matched
                  object.attr('disabled', false);
                  object.addClass('dependent-options');
                  object.children().attr('disabled', false);
                }
                else {
                  // Otherwise hide. Use css rather than hide() because hide()
                  // does not work if the item is already hidden, for example,
                  // in a collapsed fieldset.
                  object.attr('disabled', true);
                  object.children().attr('disabled', true);
                }
              }
              else {
                if (Drupal.settings.CTools.dependent[id].num <= len) {
                  // Show if the element if criteria is matched
                  object.show(0);
                  object.addClass('dependent-options');
                }
                else {
                  // Otherwise hide. Use css rather than hide() because hide()
                  // does not work if the item is already hidden, for example,
                  // in a collapsed fieldset.
                  object.css('display', 'none');
                }
              }
            }
          }

          $(trigger_id).change(function() {
            // Trigger the internal change function
            // the attr('id') is used because closures are more confusing
            changeTrigger(trigger_id, bind_id);
          });
          // Trigger initial reaction
          changeTrigger(trigger_id, bind_id);
        }
        setChangeTrigger(trigger_id, bind_id);
      }
    }
  }

  Drupal.behaviors.CToolsDependent = {
    attach: function (context) {
      Drupal.CTools.dependent.autoAttach();

      // Really large sets of fields are too slow with the above method, so this
      // is a sort of hacked one that's faster but much less flexible.
      $("select.ctools-master-dependent")
        .once('ctools-dependent')
        .change(function() {
          var val = $(this).val();
          if (val == 'all') {
            $('.ctools-dependent-all').show(0);
          }
          else {
            $('.ctools-dependent-all').hide(0);
            $('.ctools-dependent-' + val).show(0);
          }
        })
        .trigger('change');
    }
  }
})(jQuery);
;
/**
 * @file
 * Javascript required for a simple collapsible div.
 *
 * Creating a collapsible div with this doesn't take too much. There are
 * three classes necessary:
 *
 * - ctools-collapsible-container: This is the overall container that will be
 *   collapsible. This must be a div.
 * - ctools-collapsible-handle: This is the title area, and is what will be
 *   visible when it is collapsed. This can be any block element, such as div
 *   or h2.
 * - ctools-collapsible-content: This is the ocntent area and will only be
 *   visible when expanded. This must be a div.
 *
 * Adding 'ctools-collapsible-remember' to the container class will cause the
 * state of the container to be stored in a cookie, and remembered from page
 * load to page load. This will only work if the container has a unique ID, so
 * very carefully add IDs to your containers.
 *
 * If the class 'ctools-no-container' is placed on the container, the container
 * will be the handle. The content will be found by appending '-content' to the
 * id of the handle. The ctools-collapsible-handle and
 * ctools-collapsible-content classes will not be required in that case, and no
 * restrictions on what of data the container is are placed. Like
 * ctools-collapsible-remember this requires an id to eist.
 *
 * The content will be 'open' unless the container class has 'ctools-collapsed'
 * as a class, which will cause the container to draw collapsed.
 */

(function ($) {
  // All CTools tools begin with this if they need to use the CTools namespace.
  if (!Drupal.CTools) {
    Drupal.CTools = {};
  }

  /**
   * Object to store state.
   *
   * This object will remember the state of collapsible containers. The first
   * time a state is requested, it will check the cookie and set up the variable.
   * If a state has been changed, when the window is unloaded the state will be
   * saved.
   */
  Drupal.CTools.Collapsible = {
    state: {},
    stateLoaded: false,
    stateChanged: false,
    cookieString: 'ctools-collapsible-state=',

    /**
     * Get the current collapsed state of a container.
     *
     * If set to 1, the container is open. If set to -1, the container is
     * collapsed. If unset the state is unknown, and the default state should
     * be used.
     */
    getState: function (id) {
      if (!this.stateLoaded) {
        this.loadCookie();
      }

      return this.state[id];
    },

    /**
     * Set the collapsed state of a container for subsequent page loads.
     *
     * Set the state to 1 for open, -1 for collapsed.
     */
    setState: function (id, state) {
      if (!this.stateLoaded) {
        this.loadCookie();
      }

      this.state[id] = state;

      if (!this.stateChanged) {
        this.stateChanged = true;
        $(window).unload(this.unload);
      }
    },

    /**
     * Check the cookie and load the state variable.
     */
    loadCookie: function () {
      // If there is a previous instance of this cookie
      if (document.cookie.length > 0) {
        // Get the number of characters that have the list of values
        // from our string index.
        offset = document.cookie.indexOf(this.cookieString);

        // If its positive, there is a list!
        if (offset != -1) {
          offset += this.cookieString.length;
          var end = document.cookie.indexOf(';', offset);
          if (end == -1) {
            end = document.cookie.length;
          }

          // Get a list of all values that are saved on our string
          var cookie = unescape(document.cookie.substring(offset, end));

          if (cookie != '') {
            var cookieList = cookie.split(',');
            for (var i = 0; i < cookieList.length; i++) {
              var info = cookieList[i].split(':');
              this.state[info[0]] = info[1];
            }
          }
        }
      }

      this.stateLoaded = true;
    },

    /**
     * Turn the state variable into a string and store it in the cookie.
     */
    storeCookie: function () {
      var cookie = '';

      // Get a list of IDs, saparated by comma
      for (i in this.state) {
        if (cookie != '') {
          cookie += ',';
        }
        cookie += i + ':' + this.state[i];
      }

      // Save this values on the cookie
      document.cookie = this.cookieString + escape(cookie) + ';path=/';
    },

    /**
     * Respond to the unload event by storing the current state.
     */
    unload: function() {
      Drupal.CTools.Collapsible.storeCookie();
    }
  };

  // Set up an array for callbacks.
  Drupal.CTools.CollapsibleCallbacks = [];
  Drupal.CTools.CollapsibleCallbacksAfterToggle = [];

  /**
   * Bind collapsible behavior to a given container.
   */
  Drupal.CTools.bindCollapsible = function () {
    var $container = $(this);

    // Allow the specification of the 'no container' class, which means the
    // handle and the container can be completely independent.
    if ($container.hasClass('ctools-no-container') && $container.attr('id')) {
      // In this case, the container *is* the handle and the content is found
      // by adding '-content' to the id. Obviously, an id is required.
      var handle = $container;
      var content = $('#' + $container.attr('id') + '-content');
    }
    else {
      var handle = $container.children('.ctools-collapsible-handle');
      var content = $container.children('div.ctools-collapsible-content');
    }

    if (content.length) {
      // Create the toggle item and place it in front of the toggle.
      var toggle = $('<span class="ctools-toggle"></span>');
      handle.before(toggle);

      // If the remember class is set, check to see if we have a remembered
      // state stored.
      if ($container.hasClass('ctools-collapsible-remember') && $container.attr('id')) {
        var state = Drupal.CTools.Collapsible.getState($container.attr('id'));
        if (state == 1) {
          $container.removeClass('ctools-collapsed');
        }
        else if (state == -1) {
          $container.addClass('ctools-collapsed');
        }
      }

      // If we should start collapsed, do so:
      if ($container.hasClass('ctools-collapsed')) {
        toggle.toggleClass('ctools-toggle-collapsed');
        content.hide();
      }

      var afterToggle = function () {
        if (Drupal.CTools.CollapsibleCallbacksAfterToggle) {
          for (i in Drupal.CTools.CollapsibleCallbacksAfterToggle) {
            Drupal.CTools.CollapsibleCallbacksAfterToggle[i]($container, handle, content, toggle);
          }
        }
      }

      var clickMe = function () {
        if (Drupal.CTools.CollapsibleCallbacks) {
          for (i in Drupal.CTools.CollapsibleCallbacks) {
            Drupal.CTools.CollapsibleCallbacks[i]($container, handle, content, toggle);
          }
        }

        // If the container is a table element slideToggle does not do what
        // we want, so use toggle() instead.
        if ($container.is('table')) {
          content.toggle(0, afterToggle);
        }
        else {
          content.slideToggle(100, afterToggle);
        }

        toggle.toggleClass('ctools-toggle-collapsed');

        // If we're supposed to remember the state of this class, do so.
        if ($container.hasClass('ctools-collapsible-remember') && $container.attr('id')) {
          var state = toggle.hasClass('ctools-toggle-collapsed') ? -1 : 1;
          Drupal.CTools.Collapsible.setState($container.attr('id'), state);
        }

        return false;
      }

      // Let both the toggle and the handle be clickable.
      toggle.click(clickMe);
      handle.click(clickMe);
    }
  };

  /**
   * Support Drupal's 'behaviors' system for binding.
   */
  Drupal.behaviors.CToolsCollapsible = {
    attach: function(context) {
      $('.ctools-collapsible-container', context).once('ctools-collapsible', Drupal.CTools.bindCollapsible);
    }
  }
})(jQuery);
;
(function ($) {

/**
 * Drag and drop table rows with field manipulation.
 *
 * Using the drupal_add_tabledrag() function, any table with weights or parent
 * relationships may be made into draggable tables. Columns containing a field
 * may optionally be hidden, providing a better user experience.
 *
 * Created tableDrag instances may be modified with custom behaviors by
 * overriding the .onDrag, .onDrop, .row.onSwap, and .row.onIndent methods.
 * See blocks.js for an example of adding additional functionality to tableDrag.
 */
Drupal.behaviors.tableDrag = {
  attach: function (context, settings) {
    for (var base in settings.tableDrag) {
      $('#' + base, context).once('tabledrag', function () {
        // Create the new tableDrag instance. Save in the Drupal variable
        // to allow other scripts access to the object.
        Drupal.tableDrag[base] = new Drupal.tableDrag(this, settings.tableDrag[base]);
      });
    }
  }
};

/**
 * Constructor for the tableDrag object. Provides table and field manipulation.
 *
 * @param table
 *   DOM object for the table to be made draggable.
 * @param tableSettings
 *   Settings for the table added via drupal_add_dragtable().
 */
Drupal.tableDrag = function (table, tableSettings) {
  var self = this;

  // Required object variables.
  this.table = table;
  this.tableSettings = tableSettings;
  this.dragObject = null; // Used to hold information about a current drag operation.
  this.rowObject = null; // Provides operations for row manipulation.
  this.oldRowElement = null; // Remember the previous element.
  this.oldY = 0; // Used to determine up or down direction from last mouse move.
  this.changed = false; // Whether anything in the entire table has changed.
  this.maxDepth = 0; // Maximum amount of allowed parenting.
  this.rtl = $(this.table).css('direction') == 'rtl' ? -1 : 1; // Direction of the table.

  // Configure the scroll settings.
  this.scrollSettings = { amount: 4, interval: 50, trigger: 70 };
  this.scrollInterval = null;
  this.scrollY = 0;
  this.windowHeight = 0;

  // Check this table's settings to see if there are parent relationships in
  // this table. For efficiency, large sections of code can be skipped if we
  // don't need to track horizontal movement and indentations.
  this.indentEnabled = false;
  for (var group in tableSettings) {
    for (var n in tableSettings[group]) {
      if (tableSettings[group][n].relationship == 'parent') {
        this.indentEnabled = true;
      }
      if (tableSettings[group][n].limit > 0) {
        this.maxDepth = tableSettings[group][n].limit;
      }
    }
  }
  if (this.indentEnabled) {
    this.indentCount = 1; // Total width of indents, set in makeDraggable.
    // Find the width of indentations to measure mouse movements against.
    // Because the table doesn't need to start with any indentations, we
    // manually append 2 indentations in the first draggable row, measure
    // the offset, then remove.
    var indent = Drupal.theme('tableDragIndentation');
    var testRow = $('<tr/>').addClass('draggable').appendTo(table);
    var testCell = $('<td/>').appendTo(testRow).prepend(indent).prepend(indent);
    this.indentAmount = $('.indentation', testCell).get(1).offsetLeft - $('.indentation', testCell).get(0).offsetLeft;
    testRow.remove();
  }

  // Make each applicable row draggable.
  // Match immediate children of the parent element to allow nesting.
  $('> tr.draggable, > tbody > tr.draggable', table).each(function () { self.makeDraggable(this); });

  // Add a link before the table for users to show or hide weight columns.
  $(table).before($('<a href="#" class="tabledrag-toggle-weight"></a>')
    .attr('title', Drupal.t('Re-order rows by numerical weight instead of dragging.'))
    .click(function () {
      if ($.cookie('Drupal.tableDrag.showWeight') == 1) {
        self.hideColumns();
      }
      else {
        self.showColumns();
      }
      return false;
    })
    .wrap('<div class="tabledrag-toggle-weight-wrapper"></div>')
    .parent()
  );

  // Initialize the specified columns (for example, weight or parent columns)
  // to show or hide according to user preference. This aids accessibility
  // so that, e.g., screen reader users can choose to enter weight values and
  // manipulate form elements directly, rather than using drag-and-drop..
  self.initColumns();

  // Add mouse bindings to the document. The self variable is passed along
  // as event handlers do not have direct access to the tableDrag object.
  $(document).bind('mousemove', function (event) { return self.dragRow(event, self); });
  $(document).bind('mouseup', function (event) { return self.dropRow(event, self); });
};

/**
 * Initialize columns containing form elements to be hidden by default,
 * according to the settings for this tableDrag instance.
 *
 * Identify and mark each cell with a CSS class so we can easily toggle
 * show/hide it. Finally, hide columns if user does not have a
 * 'Drupal.tableDrag.showWeight' cookie.
 */
Drupal.tableDrag.prototype.initColumns = function () {
  for (var group in this.tableSettings) {
    // Find the first field in this group.
    for (var d in this.tableSettings[group]) {
      var field = $('.' + this.tableSettings[group][d].target + ':first', this.table);
      if (field.length && this.tableSettings[group][d].hidden) {
        var hidden = this.tableSettings[group][d].hidden;
        var cell = field.closest('td');
        break;
      }
    }

    // Mark the column containing this field so it can be hidden.
    if (hidden && cell[0]) {
      // Add 1 to our indexes. The nth-child selector is 1 based, not 0 based.
      // Match immediate children of the parent element to allow nesting.
      var columnIndex = $('> td', cell.parent()).index(cell.get(0)) + 1;
      $('> thead > tr, > tbody > tr, > tr', this.table).each(function () {
        // Get the columnIndex and adjust for any colspans in this row.
        var index = columnIndex;
        var cells = $(this).children();
        cells.each(function (n) {
          if (n < index && this.colSpan && this.colSpan > 1) {
            index -= this.colSpan - 1;
          }
        });
        if (index > 0) {
          cell = cells.filter(':nth-child(' + index + ')');
          if (cell[0].colSpan && cell[0].colSpan > 1) {
            // If this cell has a colspan, mark it so we can reduce the colspan.
            cell.addClass('tabledrag-has-colspan');
          }
          else {
            // Mark this cell so we can hide it.
            cell.addClass('tabledrag-hide');
          }
        }
      });
    }
  }

  // Now hide cells and reduce colspans unless cookie indicates previous choice.
  // Set a cookie if it is not already present.
  if ($.cookie('Drupal.tableDrag.showWeight') === null) {
    $.cookie('Drupal.tableDrag.showWeight', 0, {
      path: Drupal.settings.basePath,
      // The cookie expires in one year.
      expires: 365
    });
    this.hideColumns();
  }
  // Check cookie value and show/hide weight columns accordingly.
  else {
    if ($.cookie('Drupal.tableDrag.showWeight') == 1) {
      this.showColumns();
    }
    else {
      this.hideColumns();
    }
  }
};

/**
 * Hide the columns containing weight/parent form elements.
 * Undo showColumns().
 */
Drupal.tableDrag.prototype.hideColumns = function () {
  // Hide weight/parent cells and headers.
  $('.tabledrag-hide', 'table.tabledrag-processed').css('display', 'none');
  // Show TableDrag handles.
  $('.tabledrag-handle', 'table.tabledrag-processed').css('display', '');
  // Reduce the colspan of any effected multi-span columns.
  $('.tabledrag-has-colspan', 'table.tabledrag-processed').each(function () {
    this.colSpan = this.colSpan - 1;
  });
  // Change link text.
  $('.tabledrag-toggle-weight').text(Drupal.t('Show row weights'));
  // Change cookie.
  $.cookie('Drupal.tableDrag.showWeight', 0, {
    path: Drupal.settings.basePath,
    // The cookie expires in one year.
    expires: 365
  });
  // Trigger an event to allow other scripts to react to this display change.
  $('table.tabledrag-processed').trigger('columnschange', 'hide');
};

/**
 * Show the columns containing weight/parent form elements
 * Undo hideColumns().
 */
Drupal.tableDrag.prototype.showColumns = function () {
  // Show weight/parent cells and headers.
  $('.tabledrag-hide', 'table.tabledrag-processed').css('display', '');
  // Hide TableDrag handles.
  $('.tabledrag-handle', 'table.tabledrag-processed').css('display', 'none');
  // Increase the colspan for any columns where it was previously reduced.
  $('.tabledrag-has-colspan', 'table.tabledrag-processed').each(function () {
    this.colSpan = this.colSpan + 1;
  });
  // Change link text.
  $('.tabledrag-toggle-weight').text(Drupal.t('Hide row weights'));
  // Change cookie.
  $.cookie('Drupal.tableDrag.showWeight', 1, {
    path: Drupal.settings.basePath,
    // The cookie expires in one year.
    expires: 365
  });
  // Trigger an event to allow other scripts to react to this display change.
  $('table.tabledrag-processed').trigger('columnschange', 'show');
};

/**
 * Find the target used within a particular row and group.
 */
Drupal.tableDrag.prototype.rowSettings = function (group, row) {
  var field = $('.' + group, row);
  for (var delta in this.tableSettings[group]) {
    var targetClass = this.tableSettings[group][delta].target;
    if (field.is('.' + targetClass)) {
      // Return a copy of the row settings.
      var rowSettings = {};
      for (var n in this.tableSettings[group][delta]) {
        rowSettings[n] = this.tableSettings[group][delta][n];
      }
      return rowSettings;
    }
  }
};

/**
 * Take an item and add event handlers to make it become draggable.
 */
Drupal.tableDrag.prototype.makeDraggable = function (item) {
  var self = this;

  // Create the handle.
  var handle = $('<a href="#" class="tabledrag-handle"><div class="handle">&nbsp;</div></a>').attr('title', Drupal.t('Drag to re-order'));
  // Insert the handle after indentations (if any).
  if ($('td:first .indentation:last', item).length) {
    $('td:first .indentation:last', item).after(handle);
    // Update the total width of indentation in this entire table.
    self.indentCount = Math.max($('.indentation', item).length, self.indentCount);
  }
  else {
    $('td:first', item).prepend(handle);
  }

  // Add hover action for the handle.
  handle.hover(function () {
    self.dragObject == null ? $(this).addClass('tabledrag-handle-hover') : null;
  }, function () {
    self.dragObject == null ? $(this).removeClass('tabledrag-handle-hover') : null;
  });

  // Add the mousedown action for the handle.
  handle.mousedown(function (event) {
    // Create a new dragObject recording the event information.
    self.dragObject = {};
    self.dragObject.initMouseOffset = self.getMouseOffset(item, event);
    self.dragObject.initMouseCoords = self.mouseCoords(event);
    if (self.indentEnabled) {
      self.dragObject.indentMousePos = self.dragObject.initMouseCoords;
    }

    // If there's a lingering row object from the keyboard, remove its focus.
    if (self.rowObject) {
      $('a.tabledrag-handle', self.rowObject.element).blur();
    }

    // Create a new rowObject for manipulation of this row.
    self.rowObject = new self.row(item, 'mouse', self.indentEnabled, self.maxDepth, true);

    // Save the position of the table.
    self.table.topY = $(self.table).offset().top;
    self.table.bottomY = self.table.topY + self.table.offsetHeight;

    // Add classes to the handle and row.
    $(this).addClass('tabledrag-handle-hover');
    $(item).addClass('drag');

    // Set the document to use the move cursor during drag.
    $('body').addClass('drag');
    if (self.oldRowElement) {
      $(self.oldRowElement).removeClass('drag-previous');
    }

    // Hack for IE6 that flickers uncontrollably if select lists are moved.
    if (navigator.userAgent.indexOf('MSIE 6.') != -1) {
      $('select', this.table).css('display', 'none');
    }

    // Hack for Konqueror, prevent the blur handler from firing.
    // Konqueror always gives links focus, even after returning false on mousedown.
    self.safeBlur = false;

    // Call optional placeholder function.
    self.onDrag();
    return false;
  });

  // Prevent the anchor tag from jumping us to the top of the page.
  handle.click(function () {
    return false;
  });

  // Similar to the hover event, add a class when the handle is focused.
  handle.focus(function () {
    $(this).addClass('tabledrag-handle-hover');
    self.safeBlur = true;
  });

  // Remove the handle class on blur and fire the same function as a mouseup.
  handle.blur(function (event) {
    $(this).removeClass('tabledrag-handle-hover');
    if (self.rowObject && self.safeBlur) {
      self.dropRow(event, self);
    }
  });

  // Add arrow-key support to the handle.
  handle.keydown(function (event) {
    // If a rowObject doesn't yet exist and this isn't the tab key.
    if (event.keyCode != 9 && !self.rowObject) {
      self.rowObject = new self.row(item, 'keyboard', self.indentEnabled, self.maxDepth, true);
    }

    var keyChange = false;
    switch (event.keyCode) {
      case 37: // Left arrow.
      case 63234: // Safari left arrow.
        keyChange = true;
        self.rowObject.indent(-1 * self.rtl);
        break;
      case 38: // Up arrow.
      case 63232: // Safari up arrow.
        var previousRow = $(self.rowObject.element).prev('tr').get(0);
        while (previousRow && $(previousRow).is(':hidden')) {
          previousRow = $(previousRow).prev('tr').get(0);
        }
        if (previousRow) {
          self.safeBlur = false; // Do not allow the onBlur cleanup.
          self.rowObject.direction = 'up';
          keyChange = true;

          if ($(item).is('.tabledrag-root')) {
            // Swap with the previous top-level row.
            var groupHeight = 0;
            while (previousRow && $('.indentation', previousRow).length) {
              previousRow = $(previousRow).prev('tr').get(0);
              groupHeight += $(previousRow).is(':hidden') ? 0 : previousRow.offsetHeight;
            }
            if (previousRow) {
              self.rowObject.swap('before', previousRow);
              // No need to check for indentation, 0 is the only valid one.
              window.scrollBy(0, -groupHeight);
            }
          }
          else if (self.table.tBodies[0].rows[0] != previousRow || $(previousRow).is('.draggable')) {
            // Swap with the previous row (unless previous row is the first one
            // and undraggable).
            self.rowObject.swap('before', previousRow);
            self.rowObject.interval = null;
            self.rowObject.indent(0);
            window.scrollBy(0, -parseInt(item.offsetHeight, 10));
          }
          handle.get(0).focus(); // Regain focus after the DOM manipulation.
        }
        break;
      case 39: // Right arrow.
      case 63235: // Safari right arrow.
        keyChange = true;
        self.rowObject.indent(1 * self.rtl);
        break;
      case 40: // Down arrow.
      case 63233: // Safari down arrow.
        var nextRow = $(self.rowObject.group).filter(':last').next('tr').get(0);
        while (nextRow && $(nextRow).is(':hidden')) {
          nextRow = $(nextRow).next('tr').get(0);
        }
        if (nextRow) {
          self.safeBlur = false; // Do not allow the onBlur cleanup.
          self.rowObject.direction = 'down';
          keyChange = true;

          if ($(item).is('.tabledrag-root')) {
            // Swap with the next group (necessarily a top-level one).
            var groupHeight = 0;
            var nextGroup = new self.row(nextRow, 'keyboard', self.indentEnabled, self.maxDepth, false);
            if (nextGroup) {
              $(nextGroup.group).each(function () {
                groupHeight += $(this).is(':hidden') ? 0 : this.offsetHeight;
              });
              var nextGroupRow = $(nextGroup.group).filter(':last').get(0);
              self.rowObject.swap('after', nextGroupRow);
              // No need to check for indentation, 0 is the only valid one.
              window.scrollBy(0, parseInt(groupHeight, 10));
            }
          }
          else {
            // Swap with the next row.
            self.rowObject.swap('after', nextRow);
            self.rowObject.interval = null;
            self.rowObject.indent(0);
            window.scrollBy(0, parseInt(item.offsetHeight, 10));
          }
          handle.get(0).focus(); // Regain focus after the DOM manipulation.
        }
        break;
    }

    if (self.rowObject && self.rowObject.changed == true) {
      $(item).addClass('drag');
      if (self.oldRowElement) {
        $(self.oldRowElement).removeClass('drag-previous');
      }
      self.oldRowElement = item;
      self.restripeTable();
      self.onDrag();
    }

    // Returning false if we have an arrow key to prevent scrolling.
    if (keyChange) {
      return false;
    }
  });

  // Compatibility addition, return false on keypress to prevent unwanted scrolling.
  // IE and Safari will suppress scrolling on keydown, but all other browsers
  // need to return false on keypress. http://www.quirksmode.org/js/keys.html
  handle.keypress(function (event) {
    switch (event.keyCode) {
      case 37: // Left arrow.
      case 38: // Up arrow.
      case 39: // Right arrow.
      case 40: // Down arrow.
        return false;
    }
  });
};

/**
 * Mousemove event handler, bound to document.
 */
Drupal.tableDrag.prototype.dragRow = function (event, self) {
  if (self.dragObject) {
    self.currentMouseCoords = self.mouseCoords(event);

    var y = self.currentMouseCoords.y - self.dragObject.initMouseOffset.y;
    var x = self.currentMouseCoords.x - self.dragObject.initMouseOffset.x;

    // Check for row swapping and vertical scrolling.
    if (y != self.oldY) {
      self.rowObject.direction = y > self.oldY ? 'down' : 'up';
      self.oldY = y; // Update the old value.

      // Check if the window should be scrolled (and how fast).
      var scrollAmount = self.checkScroll(self.currentMouseCoords.y);
      // Stop any current scrolling.
      clearInterval(self.scrollInterval);
      // Continue scrolling if the mouse has moved in the scroll direction.
      if (scrollAmount > 0 && self.rowObject.direction == 'down' || scrollAmount < 0 && self.rowObject.direction == 'up') {
        self.setScroll(scrollAmount);
      }

      // If we have a valid target, perform the swap and restripe the table.
      var currentRow = self.findDropTargetRow(x, y);
      if (currentRow) {
        if (self.rowObject.direction == 'down') {
          self.rowObject.swap('after', currentRow, self);
        }
        else {
          self.rowObject.swap('before', currentRow, self);
        }
        self.restripeTable();
      }
    }

    // Similar to row swapping, handle indentations.
    if (self.indentEnabled) {
      var xDiff = self.currentMouseCoords.x - self.dragObject.indentMousePos.x;
      // Set the number of indentations the mouse has been moved left or right.
      var indentDiff = Math.round(xDiff / self.indentAmount * self.rtl);
      // Indent the row with our estimated diff, which may be further
      // restricted according to the rows around this row.
      var indentChange = self.rowObject.indent(indentDiff);
      // Update table and mouse indentations.
      self.dragObject.indentMousePos.x += self.indentAmount * indentChange * self.rtl;
      self.indentCount = Math.max(self.indentCount, self.rowObject.indents);
    }

    return false;
  }
};

/**
 * Mouseup event handler, bound to document.
 * Blur event handler, bound to drag handle for keyboard support.
 */
Drupal.tableDrag.prototype.dropRow = function (event, self) {
  // Drop row functionality shared between mouseup and blur events.
  if (self.rowObject != null) {
    var droppedRow = self.rowObject.element;
    // The row is already in the right place so we just release it.
    if (self.rowObject.changed == true) {
      // Update the fields in the dropped row.
      self.updateFields(droppedRow);

      // If a setting exists for affecting the entire group, update all the
      // fields in the entire dragged group.
      for (var group in self.tableSettings) {
        var rowSettings = self.rowSettings(group, droppedRow);
        if (rowSettings.relationship == 'group') {
          for (var n in self.rowObject.children) {
            self.updateField(self.rowObject.children[n], group);
          }
        }
      }

      self.rowObject.markChanged();
      if (self.changed == false) {
        $(Drupal.theme('tableDragChangedWarning')).insertBefore(self.table).hide().fadeIn('slow');
        self.changed = true;
      }
    }

    if (self.indentEnabled) {
      self.rowObject.removeIndentClasses();
    }
    if (self.oldRowElement) {
      $(self.oldRowElement).removeClass('drag-previous');
    }
    $(droppedRow).removeClass('drag').addClass('drag-previous');
    self.oldRowElement = droppedRow;
    self.onDrop();
    self.rowObject = null;
  }

  // Functionality specific only to mouseup event.
  if (self.dragObject != null) {
    $('.tabledrag-handle', droppedRow).removeClass('tabledrag-handle-hover');

    self.dragObject = null;
    $('body').removeClass('drag');
    clearInterval(self.scrollInterval);

    // Hack for IE6 that flickers uncontrollably if select lists are moved.
    if (navigator.userAgent.indexOf('MSIE 6.') != -1) {
      $('select', this.table).css('display', 'block');
    }
  }
};

/**
 * Get the mouse coordinates from the event (allowing for browser differences).
 */
Drupal.tableDrag.prototype.mouseCoords = function (event) {
  if (event.pageX || event.pageY) {
    return { x: event.pageX, y: event.pageY };
  }
  return {
    x: event.clientX + document.body.scrollLeft - document.body.clientLeft,
    y: event.clientY + document.body.scrollTop  - document.body.clientTop
  };
};

/**
 * Given a target element and a mouse event, get the mouse offset from that
 * element. To do this we need the element's position and the mouse position.
 */
Drupal.tableDrag.prototype.getMouseOffset = function (target, event) {
  var docPos   = $(target).offset();
  var mousePos = this.mouseCoords(event);
  return { x: mousePos.x - docPos.left, y: mousePos.y - docPos.top };
};

/**
 * Find the row the mouse is currently over. This row is then taken and swapped
 * with the one being dragged.
 *
 * @param x
 *   The x coordinate of the mouse on the page (not the screen).
 * @param y
 *   The y coordinate of the mouse on the page (not the screen).
 */
Drupal.tableDrag.prototype.findDropTargetRow = function (x, y) {
  var rows = $(this.table.tBodies[0].rows).not(':hidden');
  for (var n = 0; n < rows.length; n++) {
    var row = rows[n];
    var indentDiff = 0;
    var rowY = $(row).offset().top;
    // Because Safari does not report offsetHeight on table rows, but does on
    // table cells, grab the firstChild of the row and use that instead.
    // http://jacob.peargrove.com/blog/2006/technical/table-row-offsettop-bug-in-safari.
    if (row.offsetHeight == 0) {
      var rowHeight = parseInt(row.firstChild.offsetHeight, 10) / 2;
    }
    // Other browsers.
    else {
      var rowHeight = parseInt(row.offsetHeight, 10) / 2;
    }

    // Because we always insert before, we need to offset the height a bit.
    if ((y > (rowY - rowHeight)) && (y < (rowY + rowHeight))) {
      if (this.indentEnabled) {
        // Check that this row is not a child of the row being dragged.
        for (var n in this.rowObject.group) {
          if (this.rowObject.group[n] == row) {
            return null;
          }
        }
      }
      else {
        // Do not allow a row to be swapped with itself.
        if (row == this.rowObject.element) {
          return null;
        }
      }

      // Check that swapping with this row is allowed.
      if (!this.rowObject.isValidSwap(row)) {
        return null;
      }

      // We may have found the row the mouse just passed over, but it doesn't
      // take into account hidden rows. Skip backwards until we find a draggable
      // row.
      while ($(row).is(':hidden') && $(row).prev('tr').is(':hidden')) {
        row = $(row).prev('tr').get(0);
      }
      return row;
    }
  }
  return null;
};

/**
 * After the row is dropped, update the table fields according to the settings
 * set for this table.
 *
 * @param changedRow
 *   DOM object for the row that was just dropped.
 */
Drupal.tableDrag.prototype.updateFields = function (changedRow) {
  for (var group in this.tableSettings) {
    // Each group may have a different setting for relationship, so we find
    // the source rows for each separately.
    this.updateField(changedRow, group);
  }
};

/**
 * After the row is dropped, update a single table field according to specific
 * settings.
 *
 * @param changedRow
 *   DOM object for the row that was just dropped.
 * @param group
 *   The settings group on which field updates will occur.
 */
Drupal.tableDrag.prototype.updateField = function (changedRow, group) {
  var rowSettings = this.rowSettings(group, changedRow);

  // Set the row as its own target.
  if (rowSettings.relationship == 'self' || rowSettings.relationship == 'group') {
    var sourceRow = changedRow;
  }
  // Siblings are easy, check previous and next rows.
  else if (rowSettings.relationship == 'sibling') {
    var previousRow = $(changedRow).prev('tr').get(0);
    var nextRow = $(changedRow).next('tr').get(0);
    var sourceRow = changedRow;
    if ($(previousRow).is('.draggable') && $('.' + group, previousRow).length) {
      if (this.indentEnabled) {
        if ($('.indentations', previousRow).length == $('.indentations', changedRow)) {
          sourceRow = previousRow;
        }
      }
      else {
        sourceRow = previousRow;
      }
    }
    else if ($(nextRow).is('.draggable') && $('.' + group, nextRow).length) {
      if (this.indentEnabled) {
        if ($('.indentations', nextRow).length == $('.indentations', changedRow)) {
          sourceRow = nextRow;
        }
      }
      else {
        sourceRow = nextRow;
      }
    }
  }
  // Parents, look up the tree until we find a field not in this group.
  // Go up as many parents as indentations in the changed row.
  else if (rowSettings.relationship == 'parent') {
    var previousRow = $(changedRow).prev('tr');
    while (previousRow.length && $('.indentation', previousRow).length >= this.rowObject.indents) {
      previousRow = previousRow.prev('tr');
    }
    // If we found a row.
    if (previousRow.length) {
      sourceRow = previousRow[0];
    }
    // Otherwise we went all the way to the left of the table without finding
    // a parent, meaning this item has been placed at the root level.
    else {
      // Use the first row in the table as source, because it's guaranteed to
      // be at the root level. Find the first item, then compare this row
      // against it as a sibling.
      sourceRow = $(this.table).find('tr.draggable:first').get(0);
      if (sourceRow == this.rowObject.element) {
        sourceRow = $(this.rowObject.group[this.rowObject.group.length - 1]).next('tr.draggable').get(0);
      }
      var useSibling = true;
    }
  }

  // Because we may have moved the row from one category to another,
  // take a look at our sibling and borrow its sources and targets.
  this.copyDragClasses(sourceRow, changedRow, group);
  rowSettings = this.rowSettings(group, changedRow);

  // In the case that we're looking for a parent, but the row is at the top
  // of the tree, copy our sibling's values.
  if (useSibling) {
    rowSettings.relationship = 'sibling';
    rowSettings.source = rowSettings.target;
  }

  var targetClass = '.' + rowSettings.target;
  var targetElement = $(targetClass, changedRow).get(0);

  // Check if a target element exists in this row.
  if (targetElement) {
    var sourceClass = '.' + rowSettings.source;
    var sourceElement = $(sourceClass, sourceRow).get(0);
    switch (rowSettings.action) {
      case 'depth':
        // Get the depth of the target row.
        targetElement.value = $('.indentation', $(sourceElement).closest('tr')).length;
        break;
      case 'match':
        // Update the value.
        targetElement.value = sourceElement.value;
        break;
      case 'order':
        var siblings = this.rowObject.findSiblings(rowSettings);
        if ($(targetElement).is('select')) {
          // Get a list of acceptable values.
          var values = [];
          $('option', targetElement).each(function () {
            values.push(this.value);
          });
          var maxVal = values[values.length - 1];
          // Populate the values in the siblings.
          $(targetClass, siblings).each(function () {
            // If there are more items than possible values, assign the maximum value to the row.
            if (values.length > 0) {
              this.value = values.shift();
            }
            else {
              this.value = maxVal;
            }
          });
        }
        else {
          // Assume a numeric input field.
          var weight = parseInt($(targetClass, siblings[0]).val(), 10) || 0;
          $(targetClass, siblings).each(function () {
            this.value = weight;
            weight++;
          });
        }
        break;
    }
  }
};

/**
 * Copy all special tableDrag classes from one row's form elements to a
 * different one, removing any special classes that the destination row
 * may have had.
 */
Drupal.tableDrag.prototype.copyDragClasses = function (sourceRow, targetRow, group) {
  var sourceElement = $('.' + group, sourceRow);
  var targetElement = $('.' + group, targetRow);
  if (sourceElement.length && targetElement.length) {
    targetElement[0].className = sourceElement[0].className;
  }
};

Drupal.tableDrag.prototype.checkScroll = function (cursorY) {
  var de  = document.documentElement;
  var b  = document.body;

  var windowHeight = this.windowHeight = window.innerHeight || (de.clientHeight && de.clientWidth != 0 ? de.clientHeight : b.offsetHeight);
  var scrollY = this.scrollY = (document.all ? (!de.scrollTop ? b.scrollTop : de.scrollTop) : (window.pageYOffset ? window.pageYOffset : window.scrollY));
  var trigger = this.scrollSettings.trigger;
  var delta = 0;

  // Return a scroll speed relative to the edge of the screen.
  if (cursorY - scrollY > windowHeight - trigger) {
    delta = trigger / (windowHeight + scrollY - cursorY);
    delta = (delta > 0 && delta < trigger) ? delta : trigger;
    return delta * this.scrollSettings.amount;
  }
  else if (cursorY - scrollY < trigger) {
    delta = trigger / (cursorY - scrollY);
    delta = (delta > 0 && delta < trigger) ? delta : trigger;
    return -delta * this.scrollSettings.amount;
  }
};

Drupal.tableDrag.prototype.setScroll = function (scrollAmount) {
  var self = this;

  this.scrollInterval = setInterval(function () {
    // Update the scroll values stored in the object.
    self.checkScroll(self.currentMouseCoords.y);
    var aboveTable = self.scrollY > self.table.topY;
    var belowTable = self.scrollY + self.windowHeight < self.table.bottomY;
    if (scrollAmount > 0 && belowTable || scrollAmount < 0 && aboveTable) {
      window.scrollBy(0, scrollAmount);
    }
  }, this.scrollSettings.interval);
};

Drupal.tableDrag.prototype.restripeTable = function () {
  // :even and :odd are reversed because jQuery counts from 0 and
  // we count from 1, so we're out of sync.
  // Match immediate children of the parent element to allow nesting.
  $('> tbody > tr.draggable:visible, > tr.draggable:visible', this.table)
    .removeClass('odd even')
    .filter(':odd').addClass('even').end()
    .filter(':even').addClass('odd');
};

/**
 * Stub function. Allows a custom handler when a row begins dragging.
 */
Drupal.tableDrag.prototype.onDrag = function () {
  return null;
};

/**
 * Stub function. Allows a custom handler when a row is dropped.
 */
Drupal.tableDrag.prototype.onDrop = function () {
  return null;
};

/**
 * Constructor to make a new object to manipulate a table row.
 *
 * @param tableRow
 *   The DOM element for the table row we will be manipulating.
 * @param method
 *   The method in which this row is being moved. Either 'keyboard' or 'mouse'.
 * @param indentEnabled
 *   Whether the containing table uses indentations. Used for optimizations.
 * @param maxDepth
 *   The maximum amount of indentations this row may contain.
 * @param addClasses
 *   Whether we want to add classes to this row to indicate child relationships.
 */
Drupal.tableDrag.prototype.row = function (tableRow, method, indentEnabled, maxDepth, addClasses) {
  this.element = tableRow;
  this.method = method;
  this.group = [tableRow];
  this.groupDepth = $('.indentation', tableRow).length;
  this.changed = false;
  this.table = $(tableRow).closest('table').get(0);
  this.indentEnabled = indentEnabled;
  this.maxDepth = maxDepth;
  this.direction = ''; // Direction the row is being moved.

  if (this.indentEnabled) {
    this.indents = $('.indentation', tableRow).length;
    this.children = this.findChildren(addClasses);
    this.group = $.merge(this.group, this.children);
    // Find the depth of this entire group.
    for (var n = 0; n < this.group.length; n++) {
      this.groupDepth = Math.max($('.indentation', this.group[n]).length, this.groupDepth);
    }
  }
};

/**
 * Find all children of rowObject by indentation.
 *
 * @param addClasses
 *   Whether we want to add classes to this row to indicate child relationships.
 */
Drupal.tableDrag.prototype.row.prototype.findChildren = function (addClasses) {
  var parentIndentation = this.indents;
  var currentRow = $(this.element, this.table).next('tr.draggable');
  var rows = [];
  var child = 0;
  while (currentRow.length) {
    var rowIndentation = $('.indentation', currentRow).length;
    // A greater indentation indicates this is a child.
    if (rowIndentation > parentIndentation) {
      child++;
      rows.push(currentRow[0]);
      if (addClasses) {
        $('.indentation', currentRow).each(function (indentNum) {
          if (child == 1 && (indentNum == parentIndentation)) {
            $(this).addClass('tree-child-first');
          }
          if (indentNum == parentIndentation) {
            $(this).addClass('tree-child');
          }
          else if (indentNum > parentIndentation) {
            $(this).addClass('tree-child-horizontal');
          }
        });
      }
    }
    else {
      break;
    }
    currentRow = currentRow.next('tr.draggable');
  }
  if (addClasses && rows.length) {
    $('.indentation:nth-child(' + (parentIndentation + 1) + ')', rows[rows.length - 1]).addClass('tree-child-last');
  }
  return rows;
};

/**
 * Ensure that two rows are allowed to be swapped.
 *
 * @param row
 *   DOM object for the row being considered for swapping.
 */
Drupal.tableDrag.prototype.row.prototype.isValidSwap = function (row) {
  if (this.indentEnabled) {
    var prevRow, nextRow;
    if (this.direction == 'down') {
      prevRow = row;
      nextRow = $(row).next('tr').get(0);
    }
    else {
      prevRow = $(row).prev('tr').get(0);
      nextRow = row;
    }
    this.interval = this.validIndentInterval(prevRow, nextRow);

    // We have an invalid swap if the valid indentations interval is empty.
    if (this.interval.min > this.interval.max) {
      return false;
    }
  }

  // Do not let an un-draggable first row have anything put before it.
  if (this.table.tBodies[0].rows[0] == row && $(row).is(':not(.draggable)')) {
    return false;
  }

  return true;
};

/**
 * Perform the swap between two rows.
 *
 * @param position
 *   Whether the swap will occur 'before' or 'after' the given row.
 * @param row
 *   DOM element what will be swapped with the row group.
 */
Drupal.tableDrag.prototype.row.prototype.swap = function (position, row) {
  Drupal.detachBehaviors(this.group, Drupal.settings, 'move');
  $(row)[position](this.group);
  Drupal.attachBehaviors(this.group, Drupal.settings);
  this.changed = true;
  this.onSwap(row);
};

/**
 * Determine the valid indentations interval for the row at a given position
 * in the table.
 *
 * @param prevRow
 *   DOM object for the row before the tested position
 *   (or null for first position in the table).
 * @param nextRow
 *   DOM object for the row after the tested position
 *   (or null for last position in the table).
 */
Drupal.tableDrag.prototype.row.prototype.validIndentInterval = function (prevRow, nextRow) {
  var minIndent, maxIndent;

  // Minimum indentation:
  // Do not orphan the next row.
  minIndent = nextRow ? $('.indentation', nextRow).length : 0;

  // Maximum indentation:
  if (!prevRow || $(prevRow).is(':not(.draggable)') || $(this.element).is('.tabledrag-root')) {
    // Do not indent:
    // - the first row in the table,
    // - rows dragged below a non-draggable row,
    // - 'root' rows.
    maxIndent = 0;
  }
  else {
    // Do not go deeper than as a child of the previous row.
    maxIndent = $('.indentation', prevRow).length + ($(prevRow).is('.tabledrag-leaf') ? 0 : 1);
    // Limit by the maximum allowed depth for the table.
    if (this.maxDepth) {
      maxIndent = Math.min(maxIndent, this.maxDepth - (this.groupDepth - this.indents));
    }
  }

  return { 'min': minIndent, 'max': maxIndent };
};

/**
 * Indent a row within the legal bounds of the table.
 *
 * @param indentDiff
 *   The number of additional indentations proposed for the row (can be
 *   positive or negative). This number will be adjusted to nearest valid
 *   indentation level for the row.
 */
Drupal.tableDrag.prototype.row.prototype.indent = function (indentDiff) {
  // Determine the valid indentations interval if not available yet.
  if (!this.interval) {
    var prevRow = $(this.element).prev('tr').get(0);
    var nextRow = $(this.group).filter(':last').next('tr').get(0);
    this.interval = this.validIndentInterval(prevRow, nextRow);
  }

  // Adjust to the nearest valid indentation.
  var indent = this.indents + indentDiff;
  indent = Math.max(indent, this.interval.min);
  indent = Math.min(indent, this.interval.max);
  indentDiff = indent - this.indents;

  for (var n = 1; n <= Math.abs(indentDiff); n++) {
    // Add or remove indentations.
    if (indentDiff < 0) {
      $('.indentation:first', this.group).remove();
      this.indents--;
    }
    else {
      $('td:first', this.group).prepend(Drupal.theme('tableDragIndentation'));
      this.indents++;
    }
  }
  if (indentDiff) {
    // Update indentation for this row.
    this.changed = true;
    this.groupDepth += indentDiff;
    this.onIndent();
  }

  return indentDiff;
};

/**
 * Find all siblings for a row, either according to its subgroup or indentation.
 * Note that the passed-in row is included in the list of siblings.
 *
 * @param settings
 *   The field settings we're using to identify what constitutes a sibling.
 */
Drupal.tableDrag.prototype.row.prototype.findSiblings = function (rowSettings) {
  var siblings = [];
  var directions = ['prev', 'next'];
  var rowIndentation = this.indents;
  for (var d = 0; d < directions.length; d++) {
    var checkRow = $(this.element)[directions[d]]();
    while (checkRow.length) {
      // Check that the sibling contains a similar target field.
      if ($('.' + rowSettings.target, checkRow)) {
        // Either add immediately if this is a flat table, or check to ensure
        // that this row has the same level of indentation.
        if (this.indentEnabled) {
          var checkRowIndentation = $('.indentation', checkRow).length;
        }

        if (!(this.indentEnabled) || (checkRowIndentation == rowIndentation)) {
          siblings.push(checkRow[0]);
        }
        else if (checkRowIndentation < rowIndentation) {
          // No need to keep looking for siblings when we get to a parent.
          break;
        }
      }
      else {
        break;
      }
      checkRow = $(checkRow)[directions[d]]();
    }
    // Since siblings are added in reverse order for previous, reverse the
    // completed list of previous siblings. Add the current row and continue.
    if (directions[d] == 'prev') {
      siblings.reverse();
      siblings.push(this.element);
    }
  }
  return siblings;
};

/**
 * Remove indentation helper classes from the current row group.
 */
Drupal.tableDrag.prototype.row.prototype.removeIndentClasses = function () {
  for (var n in this.children) {
    $('.indentation', this.children[n])
      .removeClass('tree-child')
      .removeClass('tree-child-first')
      .removeClass('tree-child-last')
      .removeClass('tree-child-horizontal');
  }
};

/**
 * Add an asterisk or other marker to the changed row.
 */
Drupal.tableDrag.prototype.row.prototype.markChanged = function () {
  var marker = Drupal.theme('tableDragChangedMarker');
  var cell = $('td:first', this.element);
  if ($('span.tabledrag-changed', cell).length == 0) {
    cell.append(marker);
  }
};

/**
 * Stub function. Allows a custom handler when a row is indented.
 */
Drupal.tableDrag.prototype.row.prototype.onIndent = function () {
  return null;
};

/**
 * Stub function. Allows a custom handler when a row is swapped.
 */
Drupal.tableDrag.prototype.row.prototype.onSwap = function (swappedRow) {
  return null;
};

Drupal.theme.prototype.tableDragChangedMarker = function () {
  return '<span class="warning tabledrag-changed">*</span>';
};

Drupal.theme.prototype.tableDragIndentation = function () {
  return '<div class="indentation">&nbsp;</div>';
};

Drupal.theme.prototype.tableDragChangedWarning = function () {
  return '<div class="tabledrag-changed-warning messages warning">' + Drupal.theme('tableDragChangedMarker') + ' ' + Drupal.t('Changes made in this table will not be saved until the form is submitted.') + '</div>';
};

})(jQuery);
;
/**
 * @file
 * Some basic behaviors and utility functions for Views UI.
 */
Drupal.viewsUi = {};

Drupal.behaviors.viewsUiEditView = {};

/**
 * Improve the user experience of the views edit interface.
 */
Drupal.behaviors.viewsUiEditView.attach = function (context, settings) {
  // Only show the SQL rewrite warning when the user has chosen the
  // corresponding checkbox.
  jQuery('#edit-query-options-disable-sql-rewrite').click(function () {
    jQuery('.sql-rewrite-warning').toggleClass('js-hide');
  });
};

Drupal.behaviors.viewsUiAddView = {};

/**
 * In the add view wizard, use the view name to prepopulate form fields such as
 * page title and menu link.
 */
Drupal.behaviors.viewsUiAddView.attach = function (context, settings) {
  var $ = jQuery;
  var exclude, replace, suffix;
  // Set up regular expressions to allow only numbers, letters, and dashes.
  exclude = new RegExp('[^a-z0-9\\-]+', 'g');
  replace = '-';

  // The page title, block title, and menu link fields can all be prepopulated
  // with the view name - no regular expression needed.
  var $fields = $(context).find('[id^="edit-page-title"], [id^="edit-block-title"], [id^="edit-page-link-properties-title"]');
  if ($fields.length) {
    if (!this.fieldsFiller) {
      this.fieldsFiller = new Drupal.viewsUi.FormFieldFiller($fields);
    }
    else {
      // After an AJAX response, this.fieldsFiller will still have event
      // handlers bound to the old version of the form fields (which don't exist
      // anymore). The event handlers need to be unbound and then rebound to the
      // new markup. Note that jQuery.live is difficult to make work in this
      // case because the IDs of the form fields change on every AJAX response.
      this.fieldsFiller.rebind($fields);
    }
  }

  // Prepopulate the path field with a URLified version of the view name.
  var $pathField = $(context).find('[id^="edit-page-path"]');
  if ($pathField.length) {
    if (!this.pathFiller) {
      this.pathFiller = new Drupal.viewsUi.FormFieldFiller($pathField, exclude, replace);
    }
    else {
      this.pathFiller.rebind($pathField);
    }
  }

  // Populate the RSS feed field with a URLified version of the view name, and
  // an .xml suffix (to make it unique).
  var $feedField = $(context).find('[id^="edit-page-feed-properties-path"]');
  if ($feedField.length) {
    if (!this.feedFiller) {
      suffix = '.xml';
      this.feedFiller = new Drupal.viewsUi.FormFieldFiller($feedField, exclude, replace, suffix);
    }
    else {
      this.feedFiller.rebind($feedField);
    }
  }
};

/**
 * Constructor for the Drupal.viewsUi.FormFieldFiller object.
 *
 * Prepopulates a form field based on the view name.
 *
 * @param $target
 *   A jQuery object representing the form field to prepopulate.
 * @param exclude
 *   Optional. A regular expression representing characters to exclude from the
 *   target field.
 * @param replace
 *   Optional. A string to use as the replacement value for disallowed
 *   characters.
 * @param suffix
 *   Optional. A suffix to append at the end of the target field content.
 */
Drupal.viewsUi.FormFieldFiller = function ($target, exclude, replace, suffix) {
  var $ = jQuery;
  this.source = $('#edit-human-name');
  this.target = $target;
  this.exclude = exclude || false;
  this.replace = replace || '';
  this.suffix = suffix || '';

  // Create bound versions of this instance's object methods to use as event
  // handlers. This will let us easily unbind those specific handlers later on.
  // NOTE: jQuery.proxy will not work for this because it assumes we want only
  // one bound version of an object method, whereas we need one version per
  // object instance.
  var self = this;
  this.populate = function () {return self._populate.call(self);};
  this.unbind = function () {return self._unbind.call(self);};

  this.bind();
  // Object constructor; no return value.
};

/**
 * Bind the form-filling behavior.
 */
Drupal.viewsUi.FormFieldFiller.prototype.bind = function () {
  this.unbind();
  // Populate the form field when the source changes.
  this.source.bind('keyup.viewsUi change.viewsUi', this.populate);
  // Quit populating the field as soon as it gets focus.
  this.target.bind('focus.viewsUi', this.unbind);
};

/**
 * Get the source form field value as altered by the passed-in parameters.
 */
Drupal.viewsUi.FormFieldFiller.prototype.getTransliterated = function () {
  var from = this.source.val();
  if (this.exclude) {
    from = from.toLowerCase().replace(this.exclude, this.replace);
  }
  return from + this.suffix;
};

/**
 * Populate the target form field with the altered source field value.
 */
Drupal.viewsUi.FormFieldFiller.prototype._populate = function () {
  var transliterated = this.getTransliterated();
  this.target.val(transliterated);
};

/**
 * Stop prepopulating the form fields.
 */
Drupal.viewsUi.FormFieldFiller.prototype._unbind = function () {
  this.source.unbind('keyup.viewsUi change.viewsUi', this.populate);
  this.target.unbind('focus.viewsUi', this.unbind);
};

/**
 * Bind event handlers to the new form fields, after they're replaced via AJAX.
 */
Drupal.viewsUi.FormFieldFiller.prototype.rebind = function ($fields) {
  this.target = $fields;
  this.bind();
}

Drupal.behaviors.addItemForm = {};
Drupal.behaviors.addItemForm.attach = function (context) {
  var $ = jQuery;
  // The add item form may have an id of views-ui-add-item-form--n.
  var $form = $(context).find('form[id^="views-ui-add-item-form"]').first();
  // Make sure we don't add more than one event handler to the same form.
  $form = $form.once('views-ui-add-item-form');
  if ($form.length) {
    new Drupal.viewsUi.addItemForm($form);
  }
}

Drupal.viewsUi.addItemForm = function($form) {
  this.$form = $form;
  this.$form.find('.views-filterable-options :checkbox').click(jQuery.proxy(this.handleCheck, this));
  // Find the wrapper of the displayed text.
  this.$selected_div = this.$form.find('.views-selected-options').parent();
  this.$selected_div.hide();
  this.checkedItems = [];
}

Drupal.viewsUi.addItemForm.prototype.handleCheck = function (event) {
  var $target = jQuery(event.target);
  var label = jQuery.trim($target.next().text());
  // Add/remove the checked item to the list.
  if ($target.is(':checked')) {
    this.$selected_div.show();
    this.checkedItems.push(label);
  }
  else {
    var length = this.checkedItems.length;
    var position = jQuery.inArray(label, this.checkedItems);
    // Delete the item from the list and take sure that the list doesn't have undefined items left.
    for (var i = 0; i < this.checkedItems.length; i++) {
      if (i == position) {
        this.checkedItems.splice(i, 1);
        i--;
        break;
      }
    }
    // Hide it again if none item is selected.
    if (this.checkedItems.length == 0) {
      this.$selected_div.hide();
    }
  }
  this.refreshCheckedItems();
}


/**
 * Refresh the display of the checked items.
 */
Drupal.viewsUi.addItemForm.prototype.refreshCheckedItems = function() {
  // Perhaps we should precache the text div, too.
  this.$selected_div.find('.views-selected-options').html(Drupal.checkPlain(this.checkedItems.join(', ')));
  Drupal.viewsUi.resizeModal('', true);
}


/**
 * The input field items that add displays must be rendered as <input> elements.
 * The following behavior detaches the <input> elements from the DOM, wraps them
 * in an unordered list, then appends them to the list of tabs.
 */
Drupal.behaviors.viewsUiRenderAddViewButton = {};

Drupal.behaviors.viewsUiRenderAddViewButton.attach = function (context, settings) {
  var $ = jQuery;
  // Build the add display menu and pull the display input buttons into it.
  var $menu = $('#views-display-menu-tabs', context).once('views-ui-render-add-view-button-processed');

  if (!$menu.length) {
    return;
  }
  var $addDisplayDropdown = $('<li class="add"><a href="#"><span class="icon add"></span>' + Drupal.t('Add') + '</a><ul class="action-list" style="display:none;"></ul></li>');
  var $displayButtons = $menu.nextAll('input.add-display').detach();
  $displayButtons.appendTo($addDisplayDropdown.find('.action-list')).wrap('<li>')
    .parent().first().addClass('first').end().last().addClass('last');
  // Remove the 'Add ' prefix from the button labels since they're being palced
  // in an 'Add' dropdown.
  // @todo This assumes English, but so does $addDisplayDropdown above. Add
  //   support for translation.
  $displayButtons.each(function () {
    var label = $(this).val();
    if (label.substr(0, 4) == 'Add ') {
      $(this).val(label.substr(4));
    }
  });
  $addDisplayDropdown.appendTo($menu);

  // Add the click handler for the add display button
  $('li.add > a', $menu).bind('click', function (event) {
    event.preventDefault();
    var $trigger = $(this);
    Drupal.behaviors.viewsUiRenderAddViewButton.toggleMenu($trigger);
  });
  // Add a mouseleave handler to close the dropdown when the user mouses
  // away from the item. We use mouseleave instead of mouseout because
  // the user is going to trigger mouseout when she moves from the trigger
  // link to the sub menu items.
  //
  // We use the 'li.add' selector because the open class on this item will be
  // toggled on and off and we want the handler to take effect in the cases
  // that the class is present, but not when it isn't.
  $menu.delegate('li.add', 'mouseleave', function (event) {
    var $this = $(this);
    var $trigger = $this.children('a[href="#"]');
    if ($this.children('.action-list').is(':visible')) {
      Drupal.behaviors.viewsUiRenderAddViewButton.toggleMenu($trigger);
    }
  });
};

/**
 * @note [@jessebeach] I feel like the following should be a more generic function and
 * not written specifically for this UI, but I'm not sure where to put it.
 */
Drupal.behaviors.viewsUiRenderAddViewButton.toggleMenu = function ($trigger) {
  $trigger.parent().toggleClass('open');
  $trigger.next().slideToggle('fast');
}


Drupal.behaviors.viewsUiSearchOptions = {};

Drupal.behaviors.viewsUiSearchOptions.attach = function (context) {
  var $ = jQuery;
  // The add item form may have an id of views-ui-add-item-form--n.
  var $form = $(context).find('form[id^="views-ui-add-item-form"]').first();
  // Make sure we don't add more than one event handler to the same form.
  $form = $form.once('views-ui-filter-options');
  if ($form.length) {
    new Drupal.viewsUi.OptionsSearch($form);
  }
};

/**
 * Constructor for the viewsUi.OptionsSearch object.
 *
 * The OptionsSearch object filters the available options on a form according
 * to the user's search term. Typing in "taxonomy" will show only those options
 * containing "taxonomy" in their label.
 */
Drupal.viewsUi.OptionsSearch = function ($form) {
  this.$form = $form;
  // Add a keyup handler to the search box.
  this.$searchBox = this.$form.find('#edit-options-search');
  this.$searchBox.keyup(jQuery.proxy(this.handleKeyup, this));
  // Get a list of option labels and their corresponding divs and maintain it
  // in memory, so we have as little overhead as possible at keyup time.
  this.options = this.getOptions(this.$form.find('.filterable-option'));
  // Restripe on initial loading.
  this.handleKeyup();
  // Trap the ENTER key in the search box so that it doesn't submit the form.
  this.$searchBox.keypress(function(event) {
    if (event.which == 13) {
      event.preventDefault();
    }
  });
};

/**
 * Assemble a list of all the filterable options on the form.
 *
 * @param $allOptions
 *   A jQuery object representing the rows of filterable options to be
 *   shown and hidden depending on the user's search terms.
 */
Drupal.viewsUi.OptionsSearch.prototype.getOptions = function ($allOptions) {
  var $ = jQuery;
  var i, $label, $description, $option;
  var options = [];
  var length = $allOptions.length;
  for (i = 0; i < length; i++) {
    $option = $($allOptions[i]);
    $label = $option.find('label');
    $description = $option.find('div.description');
    options[i] = {
      // Search on the lowercase version of the label text + description.
      'searchText': $label.text().toLowerCase() + " " + $description.text().toLowerCase(),
      // Maintain a reference to the jQuery object for each row, so we don't
      // have to create a new object inside the performance-sensitive keyup
      // handler.
      '$div': $option
    }
  }
  return options;
};

/**
 * Keyup handler for the search box that hides or shows the relevant options.
 */
Drupal.viewsUi.OptionsSearch.prototype.handleKeyup = function (event) {
  var found, i, j, option, search, words, wordsLength, zebraClass, zebraCounter;

  // Determine the user's search query. The search text has been converted to
  // lowercase.
  search = this.$searchBox.val().toLowerCase();
  words = search.split(' ');
  wordsLength = words.length;

  // Start the counter for restriping rows.
  zebraCounter = 0;

  // Search through the search texts in the form for matching text.
  var length = this.options.length;
  for (i = 0; i < length; i++) {
    // Use a local variable for the option being searched, for performance.
    option = this.options[i];
    found = true;
    // Each word in the search string has to match the item in order for the
    // item to be shown.
    for (j = 0; j < wordsLength; j++) {
      if (option.searchText.indexOf(words[j]) === -1) {
        found = false;
      }
    }
    if (found) {
      // Show the checkbox row, and restripe it.
      zebraClass = (zebraCounter % 2) ? 'odd' : 'even';
      option.$div.show();
      option.$div.removeClass('even odd');
      option.$div.addClass(zebraClass);
      zebraCounter++;
    }
    else {
      // The search string wasn't found; hide this item.
      option.$div.hide();
    }
  }
};


Drupal.behaviors.viewsUiPreview = {};
Drupal.behaviors.viewsUiPreview.attach = function (context, settings) {
  var $ = jQuery;

  // Only act on the edit view form.
  var contextualFiltersBucket = $('.views-display-column .views-ui-display-tab-bucket.contextual-filters', context);
  if (contextualFiltersBucket.length == 0) {
    return;
  }

  // If the display has no contextual filters, hide the form where you enter
  // the contextual filters for the live preview. If it has contextual filters,
  // show the form.
  var contextualFilters = $('.views-display-setting a', contextualFiltersBucket);
  if (contextualFilters.length) {
    $('#preview-args').parent().show();
  }
  else {
    $('#preview-args').parent().hide();
  }

  // Executes an initial preview.
  if ($('#edit-displays-live-preview').once('edit-displays-live-preview').is(':checked')) {
    $('#preview-submit').once('edit-displays-live-preview').click();
  }
};


Drupal.behaviors.viewsUiRearrangeFilter = {};
Drupal.behaviors.viewsUiRearrangeFilter.attach = function (context, settings) {
  var $ = jQuery;
  // Only act on the rearrange filter form.
  if (typeof Drupal.tableDrag == 'undefined' || typeof Drupal.tableDrag['views-rearrange-filters'] == 'undefined') {
    return;
  }

  var table = $('#views-rearrange-filters', context).once('views-rearrange-filters');
  var operator = $('.form-item-filter-groups-operator', context).once('views-rearrange-filters');
  if (table.length) {
    new Drupal.viewsUi.rearrangeFilterHandler(table, operator);
  }
};

/**
 * Improve the UI of the rearrange filters dialog box.
 */
Drupal.viewsUi.rearrangeFilterHandler = function (table, operator) {
  var $ = jQuery;
  // Keep a reference to the <table> being altered and to the div containing
  // the filter groups operator dropdown (if it exists).
  this.table = table;
  this.operator = operator;
  this.hasGroupOperator = this.operator.length > 0;

  // Keep a reference to all draggable rows within the table.
  this.draggableRows = $('.draggable', table);

  // Keep a reference to the buttons for adding and removing filter groups.
  this.addGroupButton = $('input#views-add-group');
  this.removeGroupButtons = $('input.views-remove-group', table);

  // Add links that duplicate the functionality of the (hidden) add and remove
  // buttons.
  this.insertAddRemoveFilterGroupLinks();

  // When there is a filter groups operator dropdown on the page, create
  // duplicates of the dropdown between each pair of filter groups.
  if (this.hasGroupOperator) {
    this.dropdowns = this.duplicateGroupsOperator();
    this.syncGroupsOperators();
  }

  // Add methods to the tableDrag instance to account for operator cells (which
  // span multiple rows), the operator labels next to each filter (e.g., "And"
  // or "Or"), the filter groups, and other special aspects of this tableDrag
  // instance.
  this.modifyTableDrag();

  // Initialize the operator labels (e.g., "And" or "Or") that are displayed
  // next to the filters in each group, and bind a handler so that they change
  // based on the values of the operator dropdown within that group.
  this.redrawOperatorLabels();
  $('.views-group-title select', table)
    .once('views-rearrange-filter-handler')
    .bind('change.views-rearrange-filter-handler', $.proxy(this, 'redrawOperatorLabels'));

  // Bind handlers so that when a "Remove" link is clicked, we:
  // - Update the rowspans of cells containing an operator dropdown (since they
  //   need to change to reflect the number of rows in each group).
  // - Redraw the operator labels next to the filters in the group (since the
  //   filter that is currently displayed last in each group is not supposed to
  //   have a label display next to it).
  $('a.views-groups-remove-link', this.table)
    .once('views-rearrange-filter-handler')
    .bind('click.views-rearrange-filter-handler', $.proxy(this, 'updateRowspans'))
    .bind('click.views-rearrange-filter-handler', $.proxy(this, 'redrawOperatorLabels'));
};

/**
 * Insert links that allow filter groups to be added and removed.
 */
Drupal.viewsUi.rearrangeFilterHandler.prototype.insertAddRemoveFilterGroupLinks = function () {
  var $ = jQuery;

  // Insert a link for adding a new group at the top of the page, and make it
  // match the action links styling used in a typical page.tpl.php. Note that
  // Drupal does not provide a theme function for this markup, so this is the
  // best we can do.
  $('<ul class="action-links"><li><a id="views-add-group-link" href="#">' + this.addGroupButton.val() + '</a></li></ul>')
    .prependTo(this.table.parent())
    // When the link is clicked, dynamically click the hidden form button for
    // adding a new filter group.
    .once('views-rearrange-filter-handler')
    .bind('click.views-rearrange-filter-handler', $.proxy(this, 'clickAddGroupButton'));

  // Find each (visually hidden) button for removing a filter group and insert
  // a link next to it.
  var length = this.removeGroupButtons.length;
  for (i = 0; i < length; i++) {
    var $removeGroupButton = $(this.removeGroupButtons[i]);
    var buttonId = $removeGroupButton.attr('id');
    $('<a href="#" class="views-remove-group-link">' + Drupal.t('Remove group') + '</a>')
      .insertBefore($removeGroupButton)
      // When the link is clicked, dynamically click the corresponding form
      // button.
      .once('views-rearrange-filter-handler')
      .bind('click.views-rearrange-filter-handler', {buttonId: buttonId}, $.proxy(this, 'clickRemoveGroupButton'));
  }
};

/**
 * Dynamically click the button that adds a new filter group.
 */
Drupal.viewsUi.rearrangeFilterHandler.prototype.clickAddGroupButton = function () {
  // Due to conflicts between Drupal core's AJAX system and the Views AJAX
  // system, the only way to get this to work seems to be to trigger both the
  // .mousedown() and .submit() events.
  this.addGroupButton.mousedown();
  this.addGroupButton.submit();
  return false;
};

/**
 * Dynamically click a button for removing a filter group.
 *
 * @param event
 *   Event being triggered, with event.data.buttonId set to the ID of the
 *   form button that should be clicked.
 */
Drupal.viewsUi.rearrangeFilterHandler.prototype.clickRemoveGroupButton = function (event) {
  // For some reason, here we only need to trigger .submit(), unlike for
  // Drupal.viewsUi.rearrangeFilterHandler.prototype.clickAddGroupButton()
  // where we had to trigger .mousedown() also.
  jQuery('input#' + event.data.buttonId, this.table).submit();
  return false;
};

/**
 * Move the groups operator so that it's between the first two groups, and
 * duplicate it between any subsequent groups.
 */
Drupal.viewsUi.rearrangeFilterHandler.prototype.duplicateGroupsOperator = function () {
  var $ = jQuery;
  var dropdowns, newRow;

  var titleRows = $('tr.views-group-title'), titleRow;

  // Get rid of the explanatory text around the operator; its placement is
  // explanatory enough.
  this.operator.find('label').add('div.description').addClass('element-invisible');
  this.operator.find('select').addClass('form-select');

  // Keep a list of the operator dropdowns, so we can sync their behavior later.
  dropdowns = this.operator;

  // Move the operator to a new row just above the second group.
  titleRow = $('tr#views-group-title-2');
  newRow = $('<tr class="filter-group-operator-row"><td colspan="5"></td></tr>');
  newRow.find('td').append(this.operator);
  newRow.insertBefore(titleRow);
  var i, length = titleRows.length;
  // Starting with the third group, copy the operator to a new row above the
  // group title.
  for (i = 2; i < length; i++) {
    titleRow = $(titleRows[i]);
    // Make a copy of the operator dropdown and put it in a new table row.
    var fakeOperator = this.operator.clone();
    fakeOperator.attr('id', '');
    newRow = $('<tr class="filter-group-operator-row"><td colspan="5"></td></tr>');
    newRow.find('td').append(fakeOperator);
    newRow.insertBefore(titleRow);
    dropdowns = dropdowns.add(fakeOperator);
  }

  return dropdowns;
};

/**
 * Make the duplicated groups operators change in sync with each other.
 */
Drupal.viewsUi.rearrangeFilterHandler.prototype.syncGroupsOperators = function () {
  if (this.dropdowns.length < 2) {
    // We only have one dropdown (or none at all), so there's nothing to sync.
    return;
  }

  this.dropdowns.change(jQuery.proxy(this, 'operatorChangeHandler'));
};

/**
 * Click handler for the operators that appear between filter groups.
 *
 * Forces all operator dropdowns to have the same value.
 */
Drupal.viewsUi.rearrangeFilterHandler.prototype.operatorChangeHandler = function (event) {
  var $ = jQuery;
  var $target = $(event.target);
  var operators = this.dropdowns.find('select').not($target);

  // Change the other operators to match this new value.
  operators.val($target.val());
};

Drupal.viewsUi.rearrangeFilterHandler.prototype.modifyTableDrag = function () {
  var tableDrag = Drupal.tableDrag['views-rearrange-filters'];
  var filterHandler = this;

  /**
   * Override the row.onSwap method from tabledrag.js.
   *
   * When a row is dragged to another place in the table, several things need
   * to occur.
   * - The row needs to be moved so that it's within one of the filter groups.
   * - The operator cells that span multiple rows need their rowspan attributes
   *   updated to reflect the number of rows in each group.
   * - The operator labels that are displayed next to each filter need to be
   *   redrawn, to account for the row's new location.
   */
  tableDrag.row.prototype.onSwap = function () {
    if (filterHandler.hasGroupOperator) {
      // Make sure the row that just got moved (this.group) is inside one of
      // the filter groups (i.e. below an empty marker row or a draggable). If
      // it isn't, move it down one.
      var thisRow = jQuery(this.group);
      var previousRow = thisRow.prev('tr');
      if (previousRow.length && !previousRow.hasClass('group-message') && !previousRow.hasClass('draggable')) {
        // Move the dragged row down one.
        var next = thisRow.next();
        if (next.is('tr')) {
          this.swap('after', next);
        }
      }
      filterHandler.updateRowspans();
    }
    // Redraw the operator labels that are displayed next to each filter, to
    // account for the row's new location.
    filterHandler.redrawOperatorLabels();
  };

  /**
   * Override the onDrop method from tabledrag.js.
   */
  tableDrag.onDrop = function () {
    var $ = jQuery;

    // If the tabledrag change marker (i.e., the "*") has been inserted inside
    // a row after the operator label (i.e., "And" or "Or") rearrange the items
    // so the operator label continues to appear last.
    var changeMarker = $(this.oldRowElement).find('.tabledrag-changed');
    if (changeMarker.length) {
      // Search for occurrences of the operator label before the change marker,
      // and reverse them.
      var operatorLabel = changeMarker.prevAll('.views-operator-label');
      if (operatorLabel.length) {
        operatorLabel.insertAfter(changeMarker);
      }
    }

    // Make sure the "group" dropdown is properly updated when rows are dragged
    // into an empty filter group. This is borrowed heavily from the block.js
    // implementation of tableDrag.onDrop().
    var groupRow = $(this.rowObject.element).prevAll('tr.group-message').get(0);
    var groupName = groupRow.className.replace(/([^ ]+[ ]+)*group-([^ ]+)-message([ ]+[^ ]+)*/, '$2');
    var groupField = $('select.views-group-select', this.rowObject.element);
    if ($(this.rowObject.element).prev('tr').is('.group-message') && !groupField.is('.views-group-select-' + groupName)) {
      var oldGroupName = groupField.attr('class').replace(/([^ ]+[ ]+)*views-group-select-([^ ]+)([ ]+[^ ]+)*/, '$2');
      groupField.removeClass('views-group-select-' + oldGroupName).addClass('views-group-select-' + groupName);
      groupField.val(groupName);
    }
  };
};


/**
 * Redraw the operator labels that are displayed next to each filter.
 */
Drupal.viewsUi.rearrangeFilterHandler.prototype.redrawOperatorLabels = function () {
  var $ = jQuery;
  for (i = 0; i < this.draggableRows.length; i++) {
    // Within the row, the operator labels are displayed inside the first table
    // cell (next to the filter name).
    var $draggableRow = $(this.draggableRows[i]);
    var $firstCell = $('td:first', $draggableRow);
    if ($firstCell.length) {
      // The value of the operator label ("And" or "Or") is taken from the
      // first operator dropdown we encounter, going backwards from the current
      // row. This dropdown is the one associated with the current row's filter
      // group.
      var operatorValue = $draggableRow.prevAll('.views-group-title').find('option:selected').html();
      var operatorLabel = '<span class="views-operator-label">' + operatorValue + '</span>';
      // If the next visible row after this one is a draggable filter row,
      // display the operator label next to the current row. (Checking for
      // visibility is necessary here since the "Remove" links hide the removed
      // row but don't actually remove it from the document).
      var $nextRow = $draggableRow.nextAll(':visible').eq(0);
      var $existingOperatorLabel = $firstCell.find('.views-operator-label');
      if ($nextRow.hasClass('draggable')) {
        // If an operator label was already there, replace it with the new one.
        if ($existingOperatorLabel.length) {
          $existingOperatorLabel.replaceWith(operatorLabel);
        }
        // Otherwise, append the operator label to the end of the table cell.
        else {
          $firstCell.append(operatorLabel);
        }
      }
      // If the next row doesn't contain a filter, then this is the last row
      // in the group. We don't want to display the operator there (since
      // operators should only display between two related filters, e.g.
      // "filter1 AND filter2 AND filter3"). So we remove any existing label
      // that this row has.
      else {
        $existingOperatorLabel.remove();
      }
    }
  }
};

/**
 * Update the rowspan attribute of each cell containing an operator dropdown.
 */
Drupal.viewsUi.rearrangeFilterHandler.prototype.updateRowspans = function () {
  var $ = jQuery;
  var i, $row, $currentEmptyRow, draggableCount, $operatorCell;
  var rows = $(this.table).find('tr');
  var length = rows.length;
  for (i = 0; i < length; i++) {
    $row = $(rows[i]);
    if ($row.hasClass('views-group-title')) {
      // This row is a title row.
      // Keep a reference to the cell containing the dropdown operator.
      $operatorCell = $($row.find('td.group-operator'));
      // Assume this filter group is empty, until we find otherwise.
      draggableCount = 0;
      $currentEmptyRow = $row.next('tr');
      $currentEmptyRow.removeClass('group-populated').addClass('group-empty');
      // The cell with the dropdown operator should span the title row and
      // the "this group is empty" row.
      $operatorCell.attr('rowspan', 2);
    }
    else if (($row).hasClass('draggable') && $row.is(':visible')) {
      // We've found a visible filter row, so we now know the group isn't empty.
      draggableCount++;
      $currentEmptyRow.removeClass('group-empty').addClass('group-populated');
      // The operator cell should span all draggable rows, plus the title.
      $operatorCell.attr('rowspan', draggableCount + 1);
    }
  }
};

Drupal.behaviors.viewsFilterConfigSelectAll = {};

/**
 * Add a select all checkbox, which checks each checkbox at once.
 */
Drupal.behaviors.viewsFilterConfigSelectAll.attach = function(context) {
  var $ = jQuery;
  // Show the select all checkbox.
  $('#views-ui-config-item-form div.form-item-options-value-all', context).once(function() {
    $(this).show();
  })
  .find('input[type=checkbox]')
  .click(function() {
    var checked = $(this).is(':checked');
    // Update all checkbox beside the select all checkbox.
    $(this).parents('.form-checkboxes').find('input[type=checkbox]').each(function() {
      $(this).attr('checked', checked);
    });
  });
  // Uncheck the select all checkbox if any of the others are unchecked.
  $('#views-ui-config-item-form div.form-type-checkbox').not($('.form-item-options-value-all')).find('input[type=checkbox]').each(function() {
    $(this).click(function() {
      if ($(this).is('checked') == 0) {
        $('#edit-options-value-all').removeAttr('checked');
      }
    });
  });
};

/**
 * Ensure the desired default button is used when a form is implicitly submitted via an ENTER press on textfields, radios, and checkboxes.
 *
 * @see http://www.w3.org/TR/html5/association-of-controls-and-forms.html#implicit-submission
 */
Drupal.behaviors.viewsImplicitFormSubmission = {};
Drupal.behaviors.viewsImplicitFormSubmission.attach = function (context, settings) {
  var $ = jQuery;
  $(':text, :password, :radio, :checkbox', context).once('viewsImplicitFormSubmission', function() {
    $(this).keypress(function(event) {
      if (event.which == 13) {
        var formId = this.form.id;
        if (formId && settings.viewsImplicitFormSubmission && settings.viewsImplicitFormSubmission[formId] && settings.viewsImplicitFormSubmission[formId].defaultButton) {
          event.preventDefault();
          var buttonId = settings.viewsImplicitFormSubmission[formId].defaultButton;
          var $button = $('#' + buttonId, this.form);
          if ($button.length == 1 && $button.is(':enabled')) {
            if (Drupal.ajax && Drupal.ajax[buttonId]) {
              $button.trigger(Drupal.ajax[buttonId].element_settings.event);
            }
            else {
              $button.click();
            }
          }
        }
      }
    });
  });
};

/**
 * Remove icon class from elements that are themed as buttons or dropbuttons.
 */
Drupal.behaviors.viewsRemoveIconClass = {};
Drupal.behaviors.viewsRemoveIconClass.attach = function (context, settings) {
  jQuery('.ctools-button', context).once('RemoveIconClass', function () {
    var $ = jQuery;
    var $this = $(this);
    $('.icon', $this).removeClass('icon');
    $('.horizontal', $this).removeClass('horizontal');
  });
};

/**
 * Change "Expose filter" buttons into checkboxes.
 */
Drupal.behaviors.viewsUiCheckboxify = {};
Drupal.behaviors.viewsUiCheckboxify.attach = function (context, settings) {
  var $ = jQuery;
  var $buttons = $('#edit-options-expose-button-button, #edit-options-group-button-button').once('views-ui-checkboxify');
  var length = $buttons.length;
  var i;
  for (i = 0; i < length; i++) {
    new Drupal.viewsUi.Checkboxifier($buttons[i]);
  }
};

/**
 * Change the default widget to select the default group according to the
 * selected widget for the exposed group.
 */
Drupal.behaviors.viewsUiChangeDefaultWidget = {};
Drupal.behaviors.viewsUiChangeDefaultWidget.attach = function (context, settings) {
  var $ = jQuery;
  function change_default_widget(multiple) {
    if (multiple) {
      $('input.default-radios').hide();
      $('td.any-default-radios-row').parent().hide();
      $('input.default-checkboxes').show();
    }
    else {
      $('input.default-checkboxes').hide();
      $('td.any-default-radios-row').parent().show();
      $('input.default-radios').show();
    }
  }
  // Update on widget change.
  $('input[name="options[group_info][multiple]"]').change(function() {
    change_default_widget($(this).attr("checked"));
  });
  // Update the first time the form is rendered.
  $('input[name="options[group_info][multiple]"]').trigger('change');
};

/**
 * Attaches an expose filter button to a checkbox that triggers its click event.
 *
 * @param button
 *   The DOM object representing the button to be checkboxified.
 */
Drupal.viewsUi.Checkboxifier = function (button) {
  var $ = jQuery;
  this.$button = $(button);
  this.$parent = this.$button.parent('div.views-expose, div.views-grouped');
  this.$input = this.$parent.find('input:checkbox, input:radio');
  // Hide the button and its description.
  this.$button.hide();
  this.$parent.find('.exposed-description, .grouped-description').hide();

  this.$input.click($.proxy(this, 'clickHandler'));

};

/**
 * When the checkbox is checked or unchecked, simulate a button press.
 */
Drupal.viewsUi.Checkboxifier.prototype.clickHandler = function (e) {
  this.$button.mousedown();
  this.$button.submit();
};

/**
 * Change the Apply button text based upon the override select state.
 */
Drupal.behaviors.viewsUiOverrideSelect = {};
Drupal.behaviors.viewsUiOverrideSelect.attach = function (context, settings) {
  var $ = jQuery;
  $('#edit-override-dropdown', context).once('views-ui-override-button-text', function() {
    // Closures! :(
    var $submit = $('#edit-submit', context);
    var old_value = $submit.val();

    $submit.once('views-ui-override-button-text')
      .bind('mouseup', function() {
        $(this).val(old_value);
        return true;
      });

    $(this).bind('change', function() {
      if ($(this).val() == 'default') {
        $submit.val(Drupal.t('Apply (all displays)'));
      }
      else if ($(this).val() == 'default_revert') {
        $submit.val(Drupal.t('Revert to default'));
      }
      else {
        $submit.val(Drupal.t('Apply (this display)'));
      }
    })
    .trigger('change');
  });

};

Drupal.viewsUi.resizeModal = function (e, no_shrink) {
  var $ = jQuery;
  var $modal = $('.views-ui-dialog');
  var $scroll = $('.scroll', $modal);
  if ($modal.size() == 0 || $modal.css('display') == 'none') {
    return;
  }

  var maxWidth = parseInt($(window).width() * .85); // 70% of window
  var minWidth = parseInt($(window).width() * .6); // 70% of window

  // Set the modal to the minwidth so that our width calculation of
  // children works.
  $modal.css('width', minWidth);
  var width = minWidth;

  // Don't let the window get more than 80% of the display high.
  var maxHeight = parseInt($(window).height() * .8);
  var minHeight = 200;
  if (no_shrink) {
    minHeight = $modal.height();
  }

  if (minHeight > maxHeight) {
    minHeight = maxHeight;
  }

  var height = 0;

  // Calculate the height of the 'scroll' region.
  var scrollHeight = 0;

  scrollHeight += parseInt($scroll.css('padding-top'));
  scrollHeight += parseInt($scroll.css('padding-bottom'));

  $scroll.children().each(function() {
    var w = $(this).innerWidth();
    if (w > width) {
      width = w;
    }
    scrollHeight += $(this).outerHeight(true);
  });

  // Now, calculate what the difference between the scroll and the modal
  // will be.

  var difference = 0;
  difference += parseInt($scroll.css('padding-top'));
  difference += parseInt($scroll.css('padding-bottom'));
  difference += $('.views-override').outerHeight(true);
  difference += $('.views-messages').outerHeight(true);
  difference += $('#views-ajax-title').outerHeight(true);
  difference += $('.views-add-form-selected').outerHeight(true);
  difference += $('.form-buttons', $modal).outerHeight(true);

  height = scrollHeight + difference;

  if (height > maxHeight) {
    height = maxHeight;
    scrollHeight = maxHeight - difference;
  }
  else if (height < minHeight) {
    height = minHeight;
    scrollHeight = minHeight - difference;
  }

  if (width > maxWidth) {
    width = maxWidth;
  }

  // Get where we should move content to
  var top = ($(window).height() / 2) - (height / 2);
  var left = ($(window).width() / 2) - (width / 2);

  $modal.css({
    'top': top + 'px',
    'left': left + 'px',
    'width': width + 'px',
    'height': height + 'px'
  });

  // Ensure inner popup height matches.
  $(Drupal.settings.views.ajax.popup).css('height', height + 'px');

  $scroll.css({
    'height': scrollHeight + 'px',
    'max-height': scrollHeight + 'px'
  });

};

jQuery(function() {
  jQuery(window).bind('resize', Drupal.viewsUi.resizeModal);
  jQuery(window).bind('scroll', Drupal.viewsUi.resizeModal);
});
;
// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function (window) {
	
	// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
	if (!Function.prototype.bind ) {

		Function.prototype.bind = function( obj ) {
			var slice = [].slice,
					args = slice.call(arguments, 1), 
					self = this, 
					nop = function () {}, 
					bound = function () {
						return self.apply( this instanceof nop ? this : ( obj || {} ), 
																args.concat( slice.call(arguments) ) );
					};

			nop.prototype = self.prototype;

			bound.prototype = new nop();

			return bound;
		};
	}

	

	if (typeof window.Code === "undefined") {
		window.Code = {};
	}
	
	
	
	window.Code.Util = {
		
		
		/*
		 * Function: registerNamespace
		 */			
		registerNamespace: function () {
			var 
				args = arguments, obj = null, i, j, ns, nsParts, root, argsLen, nsPartsLens;
			for (i=0, argsLen=args.length; i<argsLen; i++) {
				ns = args[i];
				nsParts = ns.split(".");
				root = nsParts[0];
				if (typeof window[root] === "undefined"){
					window[root] = {};
				}
				obj = window[root];
				//eval('if (typeof ' + root + ' == "undefined"){' + root + ' = {};} obj = ' + root + ';');
				for (j=1, nsPartsLens=nsParts.length; j<nsPartsLens; ++j) {
					obj[nsParts[j]] = obj[nsParts[j]] || {};
					obj = obj[nsParts[j]];
				}
			}
		},
		
		
		
		/*
		 * Function: coalesce
		 * Takes any number of arguments and returns the first non Null / Undefined argument.
		 */
		coalesce: function () {
			var i, j;
			for (i=0, j=arguments.length; i<j; i++) {
				if (!this.isNothing(arguments[i])) {
					return arguments[i];
				}
			}
			return null;
		},
		
		
		
		/*
		 * Function: extend
		 */
		extend: function(destination, source, overwriteProperties){
			var prop;
			if (this.isNothing(overwriteProperties)){
				overwriteProperties = true;
			}
			if (destination && source && this.isObject(source)){
				for(prop in source){
					if (this.objectHasProperty(source, prop)) {
						if (overwriteProperties){
							destination[prop] = source[prop];
						}
						else{
							if(typeof destination[prop] === "undefined"){ 
								destination[prop] = source[prop]; 
							}
						}
					}
				}
			}
		},
		
		
		
		/*
		 * Function: clone
		 */
		clone: function(obj) {
			var retval = {};
			this.extend(retval, obj);
			return retval;
		},
		
		
		
		/*
		 * Function: isObject
		 */
		isObject: function(obj){
			return obj instanceof Object;
		},
		
		
		
		/*
		 * Function: isFunction
		 */
		isFunction: function(obj){
			return ({}).toString.call(obj) === "[object Function]";
		},
		
		
		
		/*
		 * Function: isArray
		 */
		isArray: function(obj){
			return obj instanceof Array;
		},
		
		
		/*
		 * Function: isLikeArray
		 */
		isLikeArray: function(obj) { 
			return typeof obj.length === 'number';
		},
		
		
		
		/*
		 * Function: isNumber
		 */
		isNumber: function(obj){
			return typeof obj === "number";
		},
		
		
		
		/*
		 * Function: isString
		 */
		isString: function(obj){
			return typeof obj === "string";
		},
	
		
		/*
		 * Function: isNothing
		 */
		isNothing: function (obj) {
		
			if (typeof obj === "undefined" || obj === null) {
				return true;
			}	
			return false;
			
		},
		
		
		
		/*
		 * Function: swapArrayElements
		 */
		swapArrayElements: function(arr, i, j){
			
			var temp = arr[i]; 
			arr[i] = arr[j];
			arr[j] = temp;
		
		},
		
		
		
		/*
		 * Function: trim
		 */
		trim: function(val) {
			return val.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
		},
		
		
		
		/*
		 * Function: toCamelCase
		 */
		toCamelCase: function(val){
			return val.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
		},
		
		
		
		/*
		 * Function: toDashedCase
		 */
		toDashedCase: function(val){
			return val.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
		},
		
		
		
		/*
		 * Function: indexOf
		 */
		arrayIndexOf: function(obj, array, prop){
			
			var i, j, retval, arrayItem;
			
			retval = -1;
			
			for (i=0, j=array.length; i<j; i++){
				
				arrayItem = array[i];
				
				if (!this.isNothing(prop)){
					if (this.objectHasProperty(arrayItem, prop)) {
						if (arrayItem[prop] === obj){
							retval = i;
							break;
						}
					}
				}
				else{
					if (arrayItem === obj){
						retval = i;
						break;
					}
				}
				
			}
			
			return retval;
			
		},
		
		
		
		/*
		 * Function: objectHasProperty
		 */
		objectHasProperty: function(obj, propName){
			
			if (obj.hasOwnProperty){
				return obj.hasOwnProperty(propName);
			}
			else{
				return ('undefined' !== typeof obj[propName]);
			}
			
		}
		
		
	};
	
}(window));
// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, Util) {
	
	Util.Browser = {
	
		ua: null,
		version: null,
		safari: null,
		webkit: null,
		opera: null,
		msie: null,
		chrome: null,
		mozilla: null,
		
		android: null,
		blackberry: null,
		iPad: null,
		iPhone: null,
		iPod: null,
		iOS: null,
		
		is3dSupported: null,
		isCSSTransformSupported: null,
		isTouchSupported: null,
		isGestureSupported: null,
		
		
		_detect: function(){
			
			this.ua = window.navigator.userAgent;
			this.version = (this.ua.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || []);
			this.safari = (/Safari/gi).test(window.navigator.appVersion);
			this.webkit = /webkit/i.test(this.ua);
			this.opera = /opera/i.test(this.ua);
			this.msie = /msie/i.test(this.ua) && !this.opera;
			this.chrome = /Chrome/i.test(this.ua);
			this.firefox = /Firefox/i.test(this.ua);
			this.fennec = /Fennec/i.test(this.ua);
			this.mozilla = /mozilla/i.test(this.ua) && !/(compatible|webkit)/.test(this.ua);
			this.android = /android/i.test(this.ua);
			this.blackberry = /blackberry/i.test(this.ua);
			this.iOS = (/iphone|ipod|ipad/gi).test(window.navigator.platform);
			this.iPad = (/ipad/gi).test(window.navigator.platform);
			this.iPhone = (/iphone/gi).test(window.navigator.platform);
			this.iPod = (/ipod/gi).test(window.navigator.platform);
			
			var testEl = document.createElement('div');
			this.is3dSupported = !Util.isNothing(testEl.style.WebkitPerspective);	
			this.isCSSTransformSupported = ( !Util.isNothing(testEl.style.WebkitTransform) || !Util.isNothing(testEl.style.MozTransform) || !Util.isNothing(testEl.style.transformProperty) );
			this.isTouchSupported = this.isEventSupported('touchstart');
			this.isGestureSupported = this.isEventSupported('gesturestart');
			
		},
		
			
		_eventTagNames: {
			'select':'input',
			'change':'input',
			'submit':'form',
			'reset':'form',
			'error':'img',
			'load':'img',
			'abort':'img'
		},
				
				
		/*
		 * Function: isEventSupported
		 * http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
		 */
		isEventSupported: function(eventName) {
			var 
				el = document.createElement(this._eventTagNames[eventName] || 'div'),
				isSupported;
			eventName = 'on' + eventName;
			isSupported = Util.objectHasProperty(el, eventName);
			if (!isSupported) {
				el.setAttribute(eventName, 'return;');
				isSupported = typeof el[eventName] === 'function';
			}
			el = null;
			return isSupported;
		},
		
		
		isLandscape: function(){
			return (Util.DOM.windowWidth() > Util.DOM.windowHeight());
		}
  };
	
	Util.Browser._detect();
	
}
(
	window,
	window.Code.Util
))
;
// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function (window, Util) {
	
	Util.extend(Util, {
		
		Events: {
			
			
			/*
			 * Function: add
			 * Add an event handler
			 */
			add: function(obj, type, handler){
				
				this._checkHandlersProperty(obj);
				
				if (type === 'mousewheel'){
					type = this._normaliseMouseWheelType();
				}
				
				if (typeof obj.__eventHandlers[type] === 'undefined'){
					obj.__eventHandlers[type] = [];
				}
				obj.__eventHandlers[type].push(handler);
				
				// DOM element 
				if (this._isBrowserObject(obj)){
					obj.addEventListener(type, handler, false);
				}
				
			},
			
			
			
			/*
			 * Function: remove
			 * Removes a handler or all handlers associated with a type
			 */
			remove: function(obj, type, handler){
				
				this._checkHandlersProperty(obj);
				
				if (type === 'mousewheel'){
					type = this._normaliseMouseWheelType();
				}
				
				if (obj.__eventHandlers[type] instanceof Array){
					
					var
						i, j,
						handlers = obj.__eventHandlers[type];
					
					// Removing all handlers for a type
					if (Util.isNothing(handler)){
						
						if (this._isBrowserObject(obj)){
							for (i=0, j=handlers.length; i<j; i++){
								obj.removeEventListener(type, handlers[i], false);
							}
						}
						
						obj.__eventHandlers[type] = [];
						return;
					}
					
					// Removing a specific handler
					for (i=0, j=handlers.length; i<j; i++){
						if (handlers[i] === handler){
							handlers.splice(i, 1);
							break;
						}
					}
					
					// DOM element 
					if (this._isBrowserObject(obj)){
						obj.removeEventListener(type, handler, false);
						return;
					}
				
				}
			
			},
			
			
			/*
			 * Function: fire
			 * Fire an event
			 */
			fire: function(obj, type){
				
				var 
					i, j,
					event,
					listeners,
					listener,
					args = Array.prototype.slice.call(arguments).splice(2),
					isNative;
				
				
				if (type === 'mousewheel'){
					type = this._normaliseMouseWheelType();
				}
				
				
				// DOM element 
				if (this._isBrowserObject(obj)){
				
					if (typeof type !== "string"){
						throw 'type must be a string for DOM elements';
					}
					
					isNative = this._NATIVE_EVENTS[type];
					event = document.createEvent(isNative ? "HTMLEvents" : "UIEvents"); 
					event[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, window, 1);
					
					// Fire an event on an element that has no extra arguments
					if (args.length < 1){
						obj.dispatchEvent(event);
						return;
					}
				
				}
				
				this._checkHandlersProperty(obj);
				
				if (typeof type === "string"){
					event = { type: type };
				}
				else{
					event = type;
				}
				if (!event.target){
					event.target = obj;
				}

				if (!event.type){ 
					throw new Error("Event object missing 'type' property.");
				}

				if (obj.__eventHandlers[event.type] instanceof Array){
					listeners = obj.__eventHandlers[event.type];
					args.unshift(event);
					for (i=0, j=listeners.length; i<j; i++){
						listener = listeners[i];
						if (!Util.isNothing(listener)){
							listener.apply(obj, args);
						}
					}
				}
				
			},
			
			
			/*
			 * Function: getMousePosition
			 */
			getMousePosition: function(event){
				
				var retval = {
					x: 0,
					y: 0
				};
				
				if (event.pageX) {
					retval.x = event.pageX;
				}
				else if (event.clientX) {
					retval.x = event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft);
				}
			
				if (event.pageY) {
					retval.y = event.pageY;
				}
				else if (event.clientY) {
					retval.y = event.clientY + ( document.documentElement.scrollTop || document.body.scrollTop);
				}
				
				return retval;
			},
			
			
			/*
			 * Function: getTouchEvent
			 */
			getTouchEvent: function(event){
				
				return event;
			
			},
			
			
			
			/*
			 * Function: getWheelDelta
			 */
			getWheelDelta: function(event){
				
				var delta = 0;
				
				if (!Util.isNothing(event.wheelDelta)){
					delta = event.wheelDelta / 120;
				}
				else if (!Util.isNothing(event.detail)){
					delta = -event.detail / 3;
				}
				
				return delta;
				
			},
			
			
			/*
			 * Function: domReady
			 */
			domReady: function(handler){
				
				document.addEventListener('DOMContentLoaded', handler, false);
			
			},
			
			
			_checkHandlersProperty: function(obj){
				
				if (Util.isNothing(obj.__eventHandlers)){
					Util.extend(obj, {
						__eventHandlers: { }
					});
				}
			
			},
			
			
			_isBrowserObject: function(obj){
				if (obj === window || obj === window.document){
					return true;
				}
				return this._isElement(obj) || this._isNode(obj);
			},
			
			
			_isElement: function(obj){
				return (
					typeof window.HTMLElement === "object" ? obj instanceof window.HTMLElement : //DOM2
					typeof obj === "object" && obj.nodeType === 1 && typeof obj.nodeName==="string"
				);
			},
			
			
			
			_isNode: function(obj){
				return (
					typeof window.Node === "object" ? obj instanceof window.Node : 
					typeof obj === "object" && typeof obj.nodeType === "number" && typeof obj.nodeName==="string"
				);
			},
			
			
			
			_normaliseMouseWheelType: function(){
				
				if (Util.Browser.isEventSupported('mousewheel')){
					return 'mousewheel';
				}
				return 'DOMMouseScroll';
				
			},
			
			
			
			_NATIVE_EVENTS: { 
				click: 1, dblclick: 1, mouseup: 1, mousedown: 1, contextmenu: 1, //mouse buttons
				mousewheel: 1, DOMMouseScroll: 1, //mouse wheel
				mouseover: 1, mouseout: 1, mousemove: 1, selectstart: 1, selectend: 1, //mouse movement
				keydown: 1, keypress: 1, keyup: 1, //keyboard
				orientationchange: 1, // mobile
				touchstart: 1, touchmove: 1, touchend: 1, touchcancel: 1, // touch
				gesturestart: 1, gesturechange: 1, gestureend: 1, // gesture
				focus: 1, blur: 1, change: 1, reset: 1, select: 1, submit: 1, //form elements
				load: 1, unload: 1, beforeunload: 1, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
				error: 1, abort: 1, scroll: 1 
			}
			
		}
	
		
	});
	
	
}
(
	window,
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function (window, Util) {
	
	Util.extend(Util, {
		
		DOM: {
			
			
			
			/*
			 * Function: setData
			 */
			setData: function(el, key, value){
			
				if (Util.isLikeArray(el)){
					var i, len;
					for (i=0, len=el.length; i<len; i++){
						Util.DOM._setData(el[i], key, value);
					}
				}
				else{
					Util.DOM._setData(el, key, value);
				}
			
			},
			_setData: function(el, key, value){
			
				Util.DOM.setAttribute(el, 'data-' + key, value);
			
			},
			
			
			
			/*
			 * Function: getData
			 */
			getData: function(el, key, defaultValue){
				
				return Util.DOM.getAttribute(el, 'data-' + key, defaultValue);
				
			},
			
			
			
			/*
			 * Function: removeData
			 */
			removeData: function(el, key){
				
				if (Util.isLikeArray(el)){
					var i, len;
					for (i=0, len=el.length; i<len; i++){
						Util.DOM._removeData(el[i], key);
					}
				}
				else{
					Util.DOM._removeData(el, key);
				}
				
			},
			_removeData: function(el, key){
				
				Util.DOM.removeAttribute(el, 'data-' + key);
				
			},
			
			
			
			/*
			 * Function: isChildOf
			 */
			isChildOf: function(childEl, parentEl)
			{
				if (parentEl === childEl){ 
					return false; 
				}
				while (childEl && childEl !== parentEl)
				{ 
					childEl = childEl.parentNode; 
				}

				return childEl === parentEl;
			},
			
	
		
			/*
			 * Function: find
			 */
			find: function(selectors, contextEl){
				if (Util.isNothing(contextEl)){
					contextEl = window.document;
				}
				var 
					els = contextEl.querySelectorAll(selectors),
					retval = [],
					i, j;
				
				for (i=0, j=els.length; i<j; i++){
					retval.push(els[i]);
				}
				return retval;
			},
			
			
					
			/*
			 * Function: createElement
			 */
			createElement: function(type, attributes, content){
				
				var 
					attribute,
					retval = document.createElement(type);
					
				for(attribute in attributes) {
					if(Util.objectHasProperty(attributes, attribute)){
						retval.setAttribute(attribute, attributes[attribute]);
					}
				}
    
				retval.innerHTML = content || '';
				
				return retval;
				
			},
			
			
			/*
			 * Function: appendChild
			 */
			appendChild: function(childEl, parentEl){
				
				parentEl.appendChild(childEl);
				
			},
			
			
			/*
			 * Function: insertBefore
			 */
			insertBefore: function(newEl, refEl, parentEl){
				
				parentEl.insertBefore(newEl, refEl);
				
			},
			
			
			/*
			 * Function: appendText
			 */
			appendText: function(text, parentEl){
				
				Util.DOM.appendChild(document.createTextNode(text), parentEl);
				
			},
			
			
			/*
			 * Function: appendToBody
			 */
			appendToBody: function(childEl){
				
				this.appendChild(childEl, document.body);
				
			},
			
			
			/*
			 * Function: removeChild
			 */
			removeChild: function(childEl, parentEl){
			
				parentEl.removeChild(childEl);
				
			},
			
			
			
			/*
			 * Function: removeChildren
			 */
			removeChildren: function(parentEl){
				
				if (parentEl.hasChildNodes()){
					
					while (parentEl.childNodes.length >= 1){
						parentEl.removeChild(parentEl.childNodes[parentEl.childNodes.length -1]);
					}
					
				}
			
			},
			
			
			
			/*
			 * Function: hasAttribute
			 */
			hasAttribute: function(el, attributeName){
				
				return !Util.isNothing(el.getAttribute(attributeName));
			
			},
			
			
			
			/*
			 * Function: getAttribute
			 */
			getAttribute: function(el, attributeName, defaultValue){
				
				var retval = el.getAttribute(attributeName);
				if (Util.isNothing(retval) && !Util.isNothing(defaultValue)){
					retval = defaultValue;
				}
				return retval;
			
			},
			
			
			
			/*
			 * Function: el, attributeName
			 */
			setAttribute: function(el, attributeName, value){
				
				if (Util.isLikeArray(el)){
					var i, len;
					for (i=0, len=el.length; i<len; i++){
						Util.DOM._setAttribute(el[i], attributeName, value);
					}
				}
				else{
					Util.DOM._setAttribute(el, attributeName, value);
				}
				
			},
			_setAttribute: function(el, attributeName, value){
				
				el.setAttribute(attributeName, value);
				
			},
			
			
			
			/*
			 * Function: removeAttribute
			 */
			removeAttribute: function(el, attributeName){
				
				if (Util.isLikeArray(el)){
					var i, len;
					for (i=0, len=el.length; i<len; i++){
						Util.DOM._removeAttribute(el[i], attributeName);
					}
				}
				else{
					Util.DOM._removeAttribute(el, attributeName);
				}
			
			},
			_removeAttribute: function(el, attributeName){
				
				if (this.hasAttribute(el, attributeName)){
				
					el.removeAttribute(attributeName);
					
				}
				
			},
			
			
			
			/*
			 * Function: addClass
			 */
			addClass: function(el, className){
				
				if (Util.isLikeArray(el)){
					var i, len;
					for (i=0, len=el.length; i<len; i++){
						Util.DOM._addClass(el[i], className);
					}
				}
				else{
					Util.DOM._addClass(el, className);
				} 
				
			},
			_addClass: function(el, className){
				var 
					currentClassValue = Util.DOM.getAttribute(el, 'class', ''),
					re = new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)');
				
				if ( ! re.test(currentClassValue) ){
					if (currentClassValue !== ''){
						currentClassValue = currentClassValue + ' ';
					}
					currentClassValue = currentClassValue + className;
					Util.DOM.setAttribute(el, 'class', currentClassValue);
				}
			},
			
			
			
			/*
			 * Function: removeClass
			 */
			removeClass: function(el, className){
				
				if (Util.isLikeArray(el)){
					var i, len;
					for (i=0, len=el.length; i<len; i++){
						Util.DOM._removeClass(el[i], className);
					}
				}
				else{
					Util.DOM._removeClass(el, className);
				}
				
			},
			_removeClass: function(el, className){
				
				var 
					currentClassValue = Util.DOM.getAttribute(el, 'class', ''),
					classes = Util.trim(currentClassValue).split(' '),
					newClassVal = '',
					i, j;
				
				for (i=0, j=classes.length; i<j; i++){
					if (classes[i] !== className){
						if (newClassVal !== ''){
							newClassVal += ' ';
						}
						newClassVal += classes[i];
					}
				}
				
				if (newClassVal === ''){
					Util.DOM.removeAttribute(el, 'class');
				}
				else{
					Util.DOM.setAttribute(el, 'class', newClassVal);
				}
				
			},
			
			
			
			/*
			 * Function: hasClass
			 */
			hasClass: function(el, className){
				
				var re = new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)');
        return re.test(Util.DOM.getAttribute(el, 'class', ''));
				
			},
			
			
			
			/*
			 * Function: setStyle
			 */
			setStyle: function(el, style, value){
				
				if (Util.isLikeArray(el)){
					var i, len;
					for (i=0, len=el.length; i<len; i++){
						Util.DOM._setStyle(el[i], style, value);
					}
				}
				else{
					Util.DOM._setStyle(el, style, value);
				}
				
			},
			_setStyle: function(el, style, value){
				
				var prop, val;
				
				if (Util.isObject(style)) {
					for(prop in style) {
						if(Util.objectHasProperty(style, prop)){
							
							if (prop === 'width'){
								Util.DOM.width(el, style[prop]);
							}
							else if (prop === 'height'){
								Util.DOM.height(el, style[prop]);
							}
							else{
								el.style[prop] = style[prop];
							}
						
						}
					}
				}
				else {
					el.style[style] = value;
				}
			},
			
			
			
			/*
			 * Function: getStyle
			 */
			getStyle: function(el, styleName){
				
				var retval = window.getComputedStyle(el,'').getPropertyValue(styleName);
				if (retval === ''){
					retval = el.style[styleName];
				}
				return retval;
				
			},
			
			
			
			/*
			 * Function: hide
			 */
			hide: function(el){
				
				if (Util.isLikeArray(el)){
					var i, len;
					for (i=0, len=el.length; i<len; i++){
						Util.DOM._hide(el[i]);
					}
				}
				else{
					Util.DOM._hide(el);
				}
				
			},
			_hide: function(el){
				
				// Store the current display value if we use show
				Util.DOM.setData(el, 'ccl-disp', Util.DOM.getStyle(el, 'display'));
				Util.DOM.setStyle(el, 'display', 'none');
				
			},
			
			
			
			/*
			 * Function: show
			 */
			show: function(el){
				
				if (Util.isLikeArray(el)){
					var i, len;
					for (i=0, len=el.length; i<len; i++){
						Util.DOM._show(el[i]);
					}
				}
				else{
					Util.DOM._show(el);
				}
				
			},
			_show: function(el){
				
				if (Util.DOM.getStyle(el, 'display') === 'none'){
					var oldDisplayValue = Util.DOM.getData(el, 'ccl-disp', 'block');
					if (oldDisplayValue === 'none' || oldDisplayValue === ''){
						oldDisplayValue = 'block';
					}
					Util.DOM.setStyle(el, 'display', oldDisplayValue);
				}
				
			},
			
			
			
			/*
			 * Function: width 
			 * Content width, excludes padding
			 */
			width: function(el, value){
				
				if (!Util.isNothing(value)){
					if (Util.isNumber(value)){
						value = value + 'px';
					}
					el.style.width = value;
				}
				
				return this._getDimension(el, 'width');
				
			},
			
			
			
			/*
			 * Function: outerWidth
			 */
			outerWidth: function(el){
				
				var retval = Util.DOM.width(el);
				
				retval += parseInt(Util.DOM.getStyle(el, 'padding-left'), 10) + parseInt(Util.DOM.getStyle(el, 'padding-right'), 10); 
				retval += parseInt(Util.DOM.getStyle(el, 'margin-left'), 10) + parseInt(Util.DOM.getStyle(el, 'margin-right'), 10); 
				retval += parseInt(Util.DOM.getStyle(el, 'border-left-width'), 10) + parseInt(Util.DOM.getStyle(el, 'border-right-width'), 10); 
				return retval;
			
			},
			
			
			
			/*
			 * Function: height 
			 * Content height, excludes padding
			 */
			height: function(el, value){
				
				if (!Util.isNothing(value)){
					if (Util.isNumber(value)){
						value = value + 'px';
					}
					el.style.height = value;
				}
				
				return this._getDimension(el, 'height');
				
			},
			
			
			
			/*
			 * Function: _getDimension
			 */
			_getDimension: function(el, dimension){
				
				var 
					retval = window.parseInt(window.getComputedStyle(el,'').getPropertyValue(dimension)),
					styleBackup;
				
				if (isNaN(retval)){
					
					// If this is the case, chances are the element is not displayed and we can't get
					// the width and height. This temporarily shows and hides to get the value
					styleBackup = { 
						display: el.style.display,
						left: el.style.left
					};
					
					el.style.display = 'block';
					el.style.left = '-1000000px';
					
					retval = window.parseInt(window.getComputedStyle(el,'').getPropertyValue(dimension));
					
					el.style.display = styleBackup.display;
					el.style.left = styleBackup.left;
				}
				return retval;
				
			},
			
			
			
			/*
			 * Function: outerHeight
			 */
			outerHeight: function(el){
				
				var retval = Util.DOM.height(el);
				
				retval += parseInt(Util.DOM.getStyle(el, 'padding-top'), 10) + parseInt(Util.DOM.getStyle(el, 'padding-bottom'), 10); 
				retval += parseInt(Util.DOM.getStyle(el, 'margin-top'), 10) + parseInt(Util.DOM.getStyle(el, 'margin-bottom'), 10); 
				retval += parseInt(Util.DOM.getStyle(el, 'border-top-width'), 10) + parseInt(Util.DOM.getStyle(el, 'border-bottom-width'), 10); 
								
				return retval;
			
			},
			
			
			
			/*
			 * Function: documentWidth
			 */
			documentWidth: function(){
				
				return Util.DOM.width(document.documentElement);
				
			},


			
			/*
			 * Function: documentHeight
			 */
			documentHeight: function(){
				
				return Util.DOM.height(document.documentElement);
				
			},
			
			
			
			/*
			 * Function: documentOuterWidth
			 */
			documentOuterWidth: function(){
				
				return Util.DOM.width(document.documentElement);
				
			},

			
			
			/*
			 * Function: documentOuterHeight
			 */
			documentOuterHeight: function(){
				
				return Util.DOM.outerHeight(document.documentElement);
				
			},
			
			
			
			/*
			 * Function: bodyWidth
			 */
			bodyWidth: function(){
				
				return Util.DOM.width(document.body);
			
			},
			
			
			
			/*
			 * Function: bodyHeight
			 */
			bodyHeight: function(){
				
				return Util.DOM.height(document.body);
			
			},
			
			
			
			/*
			 * Function: bodyOuterWidth
			 */
			bodyOuterWidth: function(){
				
				return Util.DOM.outerWidth(document.body);
			
			},
			
			
			
			/*
			 * Function: bodyOuterHeight
			 */
			bodyOuterHeight: function(){
				
				return Util.DOM.outerHeight(document.body);
			
			},
			
			
			
			/*
			 * Function: windowWidth
			 */
			windowWidth: function(){
			
				return window.innerWidth;
			
			},
			
			
			
			/*
			 * Function: windowHeight
			 */
			windowHeight: function(){
			
				return window.innerHeight;
			
			},
			
			
			
			/*
			 * Function: windowScrollLeft
			 */
			windowScrollLeft: function(){
			
				return window.pageXOffset;
			
			},
			
			
			
			/*
			 * Function: windowScrollTop
			 */
			windowScrollTop: function(){
			
				return window.pageYOffset;
			
			}
			
		}
	
		
	});
	
	
}
(
	window,
	window.Code.Util
));
// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function (window, Util) {
	
	Util.extend(Util, {
		
		Animation: {
				
			_applyTransitionDelay: 50,
			
			_transitionEndLabel: (window.document.documentElement.style.webkitTransition !== undefined) ? "webkitTransitionEnd" : "transitionend",
			
			_transitionEndHandler: null,
			
			_transitionPrefix: (window.document.documentElement.style.webkitTransition !== undefined) ? "webkitTransition" : (window.document.documentElement.style.MozTransition !== undefined) ? "MozTransition" : "transition",
			
			_transformLabel: (window.document.documentElement.style.webkitTransform !== undefined) ? "webkitTransform" : (window.document.documentElement.style.MozTransition !== undefined) ? "MozTransform" : "transform",
						
			
			/*
			 * Function: _getTransitionEndHandler
			 */
			_getTransitionEndHandler: function(){
			
				if (Util.isNothing(this._transitionEndHandler)){
					this._transitionEndHandler = this._onTransitionEnd.bind(this);
				}
				
				return this._transitionEndHandler;
			
			},
			
			
			
			/*
			 * Function: stop
			 */
			stop: function(el){
				
				if (Util.Browser.isCSSTransformSupported){
					var 
						property = el.style[this._transitionPrefix + 'Property'],
						callbackLabel = (property !== '') ? 'ccl' + property + 'callback' : 'cclallcallback',
						style = {};
					
					Util.Events.remove(el, this._transitionEndLabel, this._getTransitionEndHandler());
					if (Util.isNothing(el.callbackLabel)){
						delete el.callbackLabel;
					}
					
					style[this._transitionPrefix + 'Property'] = '';
					style[this._transitionPrefix + 'Duration'] = '';
					style[this._transitionPrefix + 'TimingFunction'] = '';
					style[this._transitionPrefix + 'Delay'] = '';
					style[this._transformLabel] = '';
					
					Util.DOM.setStyle(el, style);
				}
				else if (!Util.isNothing(window.jQuery)){
				
					window.jQuery(el).stop(true, true);
				
				}
				
			
			},
			
			
			
			/*
			 * Function: fadeIn
			 */
			fadeIn: function(el, speed, callback, timingFunction, opacity){
				
				opacity = Util.coalesce(opacity, 1);
				if (opacity <= 0){
					opacity = 1;
				}
				
				if (speed <= 0){
					Util.DOM.setStyle(el, 'opacity', opacity);
					if (!Util.isNothing(callback)){
						callback(el);
						return;
					}
				}
				
				var currentOpacity = Util.DOM.getStyle(el, 'opacity');
				
				if (currentOpacity >= 1){
					Util.DOM.setStyle(el, 'opacity', 0);
				}
				
				if (Util.Browser.isCSSTransformSupported){
					this._applyTransition(el, 'opacity', opacity, speed, callback, timingFunction);
				}
				else if (!Util.isNothing(window.jQuery)){
					window.jQuery(el).fadeTo(speed, opacity, callback);
				}
				
			},
			
			
			
			/*
			 * Function: fadeTo
			 */
			fadeTo: function(el, opacity, speed, callback, timingFunction){
				this.fadeIn(el, speed, callback, timingFunction, opacity);
			},
			
			
			
			/*
			 * Function: fadeOut
			 */
			fadeOut: function(el, speed, callback, timingFunction){
				
				if (speed <= 0){
					Util.DOM.setStyle(el, 'opacity', 0);
					if (!Util.isNothing(callback)){
						callback(el);
						return;
					}
				}
				
				if (Util.Browser.isCSSTransformSupported){
				
					this._applyTransition(el, 'opacity', 0, speed, callback, timingFunction);
					
				}
				else{
				
					window.jQuery(el).fadeTo(speed, 0, callback);
				
				}
				
			},
			
			
			
			/*
			 * Function: slideBy
			 */
			slideBy: function(el, x, y, speed, callback, timingFunction){
			
				var style = {};
				
				x = Util.coalesce(x, 0);
				y = Util.coalesce(y, 0);
				timingFunction = Util.coalesce(timingFunction, 'ease-out');
				
				style[this._transitionPrefix + 'Property'] = 'all';
				style[this._transitionPrefix + 'Delay'] = '0';
				
				if (speed === 0){
					style[this._transitionPrefix + 'Duration'] = '';
					style[this._transitionPrefix + 'TimingFunction'] = '';
				}
				else{
					style[this._transitionPrefix + 'Duration'] = speed + 'ms';
					style[this._transitionPrefix + 'TimingFunction'] = Util.coalesce(timingFunction, 'ease-out');
					
					Util.Events.add(el, this._transitionEndLabel, this._getTransitionEndHandler());
					
				}
				
				style[this._transformLabel] = (Util.Browser.is3dSupported) ? 'translate3d(' + x + 'px, ' + y + 'px, 0px)' : 'translate(' + x + 'px, ' + y + 'px)';
				
				if (!Util.isNothing(callback)){
					el.cclallcallback = callback;
				}
				
				Util.DOM.setStyle(el, style);
				
				if (speed === 0){
					window.setTimeout(function(){
						this._leaveTransforms(el);
					}.bind(this), this._applyTransitionDelay);
				}
				
			},
			
			
			
			/*
			 * Function: 
			 */
			resetTranslate: function(el){
				
				var style = {};
				style[this._transformLabel] = style[this._transformLabel] = (Util.Browser.is3dSupported) ? 'translate3d(0px, 0px, 0px)' : 'translate(0px, 0px)';
				Util.DOM.setStyle(el, style);
			
			},
			
			
			
			/*
			 * Function: _applyTransition
			 */
			_applyTransition: function(el, property, val, speed, callback, timingFunction){
					
				var style = {};
				
				timingFunction = Util.coalesce(timingFunction, 'ease-in');
				
				style[this._transitionPrefix + 'Property'] = property;
				style[this._transitionPrefix + 'Duration'] = speed + 'ms';
				style[this._transitionPrefix + 'TimingFunction'] = timingFunction;
				style[this._transitionPrefix + 'Delay'] = '0';
				
				Util.Events.add(el, this._transitionEndLabel, this._getTransitionEndHandler());
				
				Util.DOM.setStyle(el, style);
				
				if (!Util.isNothing(callback)){
					el['ccl' + property + 'callback'] = callback;
				}
				
				window.setTimeout(function(){
					Util.DOM.setStyle(el, property, val);
				}, this._applyTransitionDelay);	
				
			},
			
			
			
			/*
			 * Function: _onTransitionEnd
			 */
			_onTransitionEnd: function(e){
				
				Util.Events.remove(e.currentTarget, this._transitionEndLabel, this._getTransitionEndHandler());
				this._leaveTransforms(e.currentTarget);
			
			},
			
			
			
			/*
			 * Function: _leaveTransforms
			 */
			_leaveTransforms: function(el){
				
				var 
						property = el.style[this._transitionPrefix + 'Property'],
						callbackLabel = (property !== '') ? 'ccl' + property + 'callback' : 'cclallcallback',
						callback,
						transform = Util.coalesce(el.style.webkitTransform, el.style.MozTransform, el.style.transform),
						transformMatch, 
						transformExploded,
						domX = window.parseInt(Util.DOM.getStyle(el, 'left'), 0),
						domY = window.parseInt(Util.DOM.getStyle(el, 'top'), 0),
						transformedX,
						transformedY,
						style = {};
					
				if (transform !== ''){
					if (Util.Browser.is3dSupported){
						transformMatch = transform.match( /translate3d\((.*?)\)/ );
					}
					else{
						transformMatch = transform.match( /translate\((.*?)\)/ );
					}
					if (!Util.isNothing(transformMatch)){
						transformExploded = transformMatch[1].split(', ');
						transformedX = window.parseInt(transformExploded[0], 0);
						transformedY = window.parseInt(transformExploded[1], 0);
					}
				}
				
				style[this._transitionPrefix + 'Property'] = '';
				style[this._transitionPrefix + 'Duration'] = '';
				style[this._transitionPrefix + 'TimingFunction'] = '';
				style[this._transitionPrefix + 'Delay'] = '';
				
				Util.DOM.setStyle(el, style);
				
				window.setTimeout(function(){
					
					if(!Util.isNothing(transformExploded)){
						
						style = {};
						style[this._transformLabel] = '';
						style.left = (domX + transformedX) + 'px';
						style.top = (domY + transformedY) + 'px';
						
						Util.DOM.setStyle(el, style);
						
					}
					
					if (!Util.isNothing(el[callbackLabel])){
						callback = el[callbackLabel];
						delete el[callbackLabel];
						callback(el);
					}
					
				}.bind(this), this._applyTransitionDelay);
				
			}
			
			
		}
		
		
	});
	
	
}
(
	window,
	window.Code.Util
));
// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.Util.TouchElement');
	
	
	Util.TouchElement.EventTypes = {
	
		onTouch: 'CodeUtilTouchElementOnTouch'
	
	};
	
	
	Util.TouchElement.ActionTypes = {
		
		touchStart: 'touchStart',
		touchMove: 'touchMove',
		touchEnd: 'touchEnd',
		touchMoveEnd: 'touchMoveEnd',
		tap: 'tap',
		doubleTap: 'doubleTap',
		swipeLeft: 'swipeLeft',
		swipeRight: 'swipeRight',
		swipeUp: 'swipeUp',
		swipeDown: 'swipeDown',
		gestureStart: 'gestureStart',
		gestureChange: 'gestureChange',
		gestureEnd: 'gestureEnd'
	
	};
	
	
}
(
	window, 
	window.klass, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.Util.TouchElement');
	
	
	Util.TouchElement.TouchElementClass = klass({
		
		el: null,
		
		captureSettings: null,
		
		touchStartPoint: null,
		touchEndPoint: null,
		touchStartTime: null,
		doubleTapTimeout: null,
		
		touchStartHandler: null,
		touchMoveHandler: null,
		touchEndHandler: null,
		
		mouseDownHandler: null,
		mouseMoveHandler: null,
		mouseUpHandler: null,
		mouseOutHandler: null,
		
		gestureStartHandler: null,
		gestureChangeHandler: null,
		gestureEndHandler: null,
		
		swipeThreshold: null,
		swipeTimeThreshold: null,
		doubleTapSpeed: null,
		
		
		
		/*
		 * Function: dispose
		 */
		dispose: function(){
		
			var prop;
			
			this.removeEventHandlers();
			
			for (prop in this) {
				if (Util.objectHasProperty(this, prop)) {
					this[prop] = null;
				}
			}
		
		},
		
		
		
		/*
		 * Function: initialize
		 */
		initialize: function(el, captureSettings){
			
			this.el = el;
			
			this.captureSettings = {
				swipe: false,
				move: false,
				gesture: false,
				doubleTap: false,
				preventDefaultTouchEvents: true
			};
			
			Util.extend(this.captureSettings, captureSettings);
			
			this.swipeThreshold = 50;
			this.swipeTimeThreshold = 250;
			this.doubleTapSpeed = 250;
			
			this.touchStartPoint = { x: 0, y: 0 };
			this.touchEndPoint = { x: 0, y: 0 };
			
		},
		
		
		
		/*
		 * Function: addEventHandlers
		 */
		addEventHandlers: function(){
		
			if (Util.isNothing(this.touchStartHandler)){
				this.touchStartHandler = this.onTouchStart.bind(this);
				this.touchMoveHandler = this.onTouchMove.bind(this);
				this.touchEndHandler = this.onTouchEnd.bind(this);
				this.mouseDownHandler = this.onMouseDown.bind(this);
				this.mouseMoveHandler = this.onMouseMove.bind(this);
				this.mouseUpHandler = this.onMouseUp.bind(this);
				this.mouseOutHandler = this.onMouseOut.bind(this);
				this.gestureStartHandler = this.onGestureStart.bind(this);
				this.gestureChangeHandler = this.onGestureChange.bind(this);
				this.gestureEndHandler = this.onGestureEnd.bind(this);
			}
			
			Util.Events.add(this.el, 'touchstart', this.touchStartHandler);
			if (this.captureSettings.move){
				Util.Events.add(this.el, 'touchmove', this.touchMoveHandler);
			}
			Util.Events.add(this.el, 'touchend', this.touchEndHandler);
			
			Util.Events.add(this.el, 'mousedown', this.mouseDownHandler);
			
			if (Util.Browser.isGestureSupported && this.captureSettings.gesture){
				Util.Events.add(this.el, 'gesturestart', this.gestureStartHandler);
				Util.Events.add(this.el, 'gesturechange', this.gestureChangeHandler);
				Util.Events.add(this.el, 'gestureend', this.gestureEndHandler);
			}
			
		},
		
		
		
		/*
		 * Function: removeEventHandlers
		 */
		removeEventHandlers: function(){
			
			Util.Events.remove(this.el, 'touchstart', this.touchStartHandler);
			if (this.captureSettings.move){
				Util.Events.remove(this.el, 'touchmove', this.touchMoveHandler);
			}
			Util.Events.remove(this.el, 'touchend', this.touchEndHandler);
			Util.Events.remove(this.el, 'mousedown', this.mouseDownHandler);
			
			if (Util.Browser.isGestureSupported && this.captureSettings.gesture){
				Util.Events.remove(this.el, 'gesturestart', this.gestureStartHandler);
				Util.Events.remove(this.el, 'gesturechange', this.gestureChangeHandler);
				Util.Events.remove(this.el, 'gestureend', this.gestureEndHandler);
			}
			
		},
		
		
		
		/*
		 * Function: getTouchPoint
		 */
		getTouchPoint: function(touches){
			
			return {
				x: touches[0].pageX,
				y: touches[0].pageY
			};
			
		},
		
		
		
		/*
		 * Function: fireTouchEvent
		 */
		fireTouchEvent: function(e){
			
			var 
				action,
				distX = 0,
				distY = 0,
				dist = 0,
				self,
				endTime,
				diffTime;

			distX = this.touchEndPoint.x - this.touchStartPoint.x;
			distY = this.touchEndPoint.y - this.touchStartPoint.y;
			dist = Math.sqrt( (distX * distX) + (distY * distY) );
			
			if (this.captureSettings.swipe){
				endTime = new Date();
				diffTime = endTime - this.touchStartTime;
				
				// See if there was a swipe gesture
				if (diffTime <= this.swipeTimeThreshold){
					
					if (window.Math.abs(distX) >= this.swipeThreshold){
					
						Util.Events.fire(this, { 
							type: Util.TouchElement.EventTypes.onTouch, 
							target: this, 
							point: this.touchEndPoint,
							action: (distX < 0) ? Util.TouchElement.ActionTypes.swipeLeft : Util.TouchElement.ActionTypes.swipeRight,
							targetEl: e.target,
							currentTargetEl: e.currentTarget
						});
						return;
						
					}
					
					
					if (window.Math.abs(distY) >= this.swipeThreshold){
						
						Util.Events.fire(this, { 
							type: Util.TouchElement.EventTypes.onTouch, 
							target: this, 
							point: this.touchEndPoint,
							action: (distY < 0) ? Util.TouchElement.ActionTypes.swipeUp : Util.TouchElement.ActionTypes.swipeDown,
							targetEl: e.target,
							currentTargetEl: e.currentTarget
						});
						return;
					
					}
					
				}
			}
			
			
			if (dist > 1){
			
				Util.Events.fire(this, { 
					type: Util.TouchElement.EventTypes.onTouch, 
					target: this, 
					action: Util.TouchElement.ActionTypes.touchMoveEnd,
					point: this.touchEndPoint,
					targetEl: e.target,
					currentTargetEl: e.currentTarget
				});
				return;
			}
			
			
			if (!this.captureSettings.doubleTap){
				
				Util.Events.fire(this, { 
					type: Util.TouchElement.EventTypes.onTouch, 
					target: this, 
					point: this.touchEndPoint,
					action: Util.TouchElement.ActionTypes.tap,
					targetEl: e.target,
					currentTargetEl: e.currentTarget
				});
				return;
				
			}
			
			if (Util.isNothing(this.doubleTapTimeout)){
				
				this.doubleTapTimeout = window.setTimeout(function(){
					
					this.doubleTapTimeout = null;
					
					Util.Events.fire(this, { 
						type: Util.TouchElement.EventTypes.onTouch, 
						target: this, 
						point: this.touchEndPoint,
						action: Util.TouchElement.ActionTypes.tap,
						targetEl: e.target,
						currentTargetEl: e.currentTarget
					});
					
				}.bind(this), this.doubleTapSpeed);
				
				return;
				
			}
			else{
				
				window.clearTimeout(this.doubleTapTimeout);
				this.doubleTapTimeout = null;
			
				Util.Events.fire(this, { 
					type: Util.TouchElement.EventTypes.onTouch, 
					target: this, 
					point: this.touchEndPoint,
					action: Util.TouchElement.ActionTypes.doubleTap,
					targetEl: e.target,
					currentTargetEl: e.currentTarget
				});
				
			}
			
		},
		
		
		
		/*
		 * Function: onTouchStart
		 */
		onTouchStart: function(e){
			
			if (this.captureSettings.preventDefaultTouchEvents){
				e.preventDefault();
			}
			
			// No longer need mouse events
			Util.Events.remove(this.el, 'mousedown', this.mouseDownHandler);
			
			var 
				touchEvent = Util.Events.getTouchEvent(e),
				touches = touchEvent.touches;
			
			if (touches.length > 1 && this.captureSettings.gesture){
				this.isGesture = true;
				return;
			}
			
			this.touchStartTime = new Date();
			this.isGesture = false;
			this.touchStartPoint = this.getTouchPoint(touches);
			
			Util.Events.fire(this, { 
				type: Util.TouchElement.EventTypes.onTouch, 
				target: this, 
				action: Util.TouchElement.ActionTypes.touchStart,
				point: this.touchStartPoint,
				targetEl: e.target,
				currentTargetEl: e.currentTarget
			});
			
			
		},
		
		
		
		/*
		 * Function: onTouchMove
		 */
		onTouchMove: function(e){
			
			if (this.captureSettings.preventDefaultTouchEvents){
				e.preventDefault();
			}
			
			if (this.isGesture && this.captureSettings.gesture){
				return;
			}
			
			var 
				touchEvent = Util.Events.getTouchEvent(e),
				touches = touchEvent.touches;
			
			Util.Events.fire(this, { 
				type: Util.TouchElement.EventTypes.onTouch, 
				target: this, 
				action: Util.TouchElement.ActionTypes.touchMove,
				point: this.getTouchPoint(touches),
				targetEl: e.target,
				currentTargetEl: e.currentTarget
			});
			
		},
		
		
		
		/*
		 * Function: onTouchEnd
		 */
		onTouchEnd: function(e){
			
			if (this.isGesture && this.captureSettings.gesture){
				return;
			}
			
			if (this.captureSettings.preventDefaultTouchEvents){
				e.preventDefault();
			}
			
			// http://backtothecode.blogspot.com/2009/10/javascript-touch-and-gesture-events.html
			// iOS removed the current touch from e.touches on "touchend"
			// Need to look into e.changedTouches
			
			var 
				touchEvent = Util.Events.getTouchEvent(e),
				touches = (!Util.isNothing(touchEvent.changedTouches)) ? touchEvent.changedTouches : touchEvent.touches;
			
			this.touchEndPoint = this.getTouchPoint(touches);
			
			Util.Events.fire(this, { 
				type: Util.TouchElement.EventTypes.onTouch, 
				target: this, 
				action: Util.TouchElement.ActionTypes.touchEnd,
				point: this.touchEndPoint,
				targetEl: e.target,
				currentTargetEl: e.currentTarget
			});
				
			this.fireTouchEvent(e);
			
		},
		
		
		
		/*
		 * Function: onMouseDown
		 */
		onMouseDown: function(e){
			
			e.preventDefault();
			
			// No longer need touch events
			Util.Events.remove(this.el, 'touchstart', this.mouseDownHandler);
			Util.Events.remove(this.el, 'touchmove', this.touchMoveHandler);
			Util.Events.remove(this.el, 'touchend', this.touchEndHandler);
			
			// Add move/up/out
			if (this.captureSettings.move){
				Util.Events.add(this.el, 'mousemove', this.mouseMoveHandler);
			}
			Util.Events.add(this.el, 'mouseup', this.mouseUpHandler);
			Util.Events.add(this.el, 'mouseout', this.mouseOutHandler);
			
			this.touchStartTime = new Date();
			this.isGesture = false;
			this.touchStartPoint = Util.Events.getMousePosition(e);
			
			Util.Events.fire(this, { 
				type: Util.TouchElement.EventTypes.onTouch, 
				target: this, 
				action: Util.TouchElement.ActionTypes.touchStart,
				point: this.touchStartPoint,
				targetEl: e.target,
				currentTargetEl: e.currentTarget
			});
			
		},
		
		
		
		/*
		 * Function: onMouseMove
		 */
		onMouseMove: function(e){
			
			e.preventDefault();
			
			Util.Events.fire(this, { 
				type: Util.TouchElement.EventTypes.onTouch, 
				target: this, 
				action: Util.TouchElement.ActionTypes.touchMove,
				point: Util.Events.getMousePosition(e),
				targetEl: e.target,
				currentTargetEl: e.currentTarget
			});
			
		},
		
		
		
		/*
		 * Function: onMouseUp
		 */
		onMouseUp: function(e){
			
			e.preventDefault();
			
			if (this.captureSettings.move){
				Util.Events.remove(this.el, 'mousemove', this.mouseMoveHandler);
			}
			Util.Events.remove(this.el, 'mouseup', this.mouseUpHandler);
			Util.Events.remove(this.el, 'mouseout', this.mouseOutHandler);
			
			this.touchEndPoint = Util.Events.getMousePosition(e);
			
			Util.Events.fire(this, { 
				type: Util.TouchElement.EventTypes.onTouch, 
				target: this, 
				action: Util.TouchElement.ActionTypes.touchEnd,
				point: this.touchEndPoint,
				targetEl: e.target,
				currentTargetEl: e.currentTarget
			});
			
			this.fireTouchEvent(e);
		
		},
		
		
		
		/*
		 * Function: onMouseOut
		 */
		onMouseOut: function(e){
			
			/*
			 * http://blog.stchur.com/2007/03/15/mouseenter-and-mouseleave-events-for-firefox-and-other-non-ie-browsers/
			 */
			var relTarget = e.relatedTarget;
			if (this.el === relTarget || Util.DOM.isChildOf(relTarget, this.el)){ 
				return;
			}
			
			e.preventDefault();
			
			if (this.captureSettings.move){
				Util.Events.remove(this.el, 'mousemove', this.mouseMoveHandler);
			}
			Util.Events.remove(this.el, 'mouseup', this.mouseUpHandler);
			Util.Events.remove(this.el, 'mouseout', this.mouseOutHandler);
			
			this.touchEndPoint = Util.Events.getMousePosition(e);
			
			Util.Events.fire(this, { 
				type: Util.TouchElement.EventTypes.onTouch, 
				target: this, 
				action: Util.TouchElement.ActionTypes.touchEnd,
				point: this.touchEndPoint,
				targetEl: e.target,
				currentTargetEl: e.currentTarget
			});
			
			this.fireTouchEvent(e);
			
		},
		
		
		
		/*
		 * Function: onGestureStart
		 */
		onGestureStart: function(e){
		
			e.preventDefault();
			
			var touchEvent = Util.Events.getTouchEvent(e);
			
			Util.Events.fire(this, { 
				type: Util.TouchElement.EventTypes.onTouch, 
				target: this, 
				action: Util.TouchElement.ActionTypes.gestureStart,
				scale: touchEvent.scale,
				rotation: touchEvent.rotation,
				targetEl: e.target,
				currentTargetEl: e.currentTarget
			});
		
		},
		
		
		
		/*
		 * Function: onGestureChange
		 */
		onGestureChange: function(e){
		
			e.preventDefault();
			
			var touchEvent = Util.Events.getTouchEvent(e);
			
			Util.Events.fire(this, { 
				type: Util.TouchElement.EventTypes.onTouch, 
				target: this, 
				action: Util.TouchElement.ActionTypes.gestureChange,
				scale: touchEvent.scale,
				rotation: touchEvent.rotation,
				targetEl: e.target,
				currentTargetEl: e.currentTarget
			});
			
		},
		
		
		
		/*
		 * Function: onGestureEnd
		 */
		onGestureEnd: function(e){
		
			e.preventDefault();
			
			var touchEvent = Util.Events.getTouchEvent(e);
			
			Util.Events.fire(this, { 
				type: Util.TouchElement.EventTypes.onTouch, 
				target: this, 
				action: Util.TouchElement.ActionTypes.gestureEnd,
				scale: touchEvent.scale,
				rotation: touchEvent.rotation,
				targetEl: e.target,
				currentTargetEl: e.currentTarget
			});
			
		}
		
		
		
	});
	
	
	
}
(
	window, 
	window.klass, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.PhotoSwipe.Image');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	
	
	PhotoSwipe.Image.EventTypes = {
		
		onLoad: 'onLoad',
		onError: 'onError'
		
	};
	
	
	
}
(
	window, 
	window.klass, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.PhotoSwipe.Image');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	
	
	PhotoSwipe.Image.ImageClass = klass({
		
		
		
		refObj: null,
		imageEl: null,
		src: null,
		caption: null,
		metaData: null,
		imageLoadHandler: null,
		imageErrorHandler: null,
		
		
		
		/*
		 * Function: dispose
		 */
		dispose: function(){
		
			var prop, i;
			
			this.shrinkImage();
			
			for (prop in this) {
				if (Util.objectHasProperty(this, prop)) {
					this[prop] = null;
				}
			}
		
		},
		
		
		
		/*
		 * Function: initialize
		 */
		initialize: function(refObj, src, caption, metaData){
			
			this.refObj = refObj;
			// This is needed. Webkit resolves the src
			// value which means we can't compare against it in the load function
			this.originalSrc = src;
			this.src = src;
			this.caption = caption;
			this.metaData = metaData;
			
			this.imageEl = new window.Image();
			
			this.imageLoadHandler = this.onImageLoad.bind(this);
			this.imageErrorHandler = this.onImageError.bind(this);
			
		},
		
		
		
		/*
		 * Function: load
		 */
		load: function(){
			
			this.imageEl.originalSrc = Util.coalesce(this.imageEl.originalSrc, '');
			
			if (this.imageEl.originalSrc === this.src){
				
				if (this.imageEl.isError){
					Util.Events.fire(this, {
						type: PhotoSwipe.Image.EventTypes.onError,
						target: this
					});
				}
				else{
					Util.Events.fire(this, {
						type: PhotoSwipe.Image.EventTypes.onLoad,
						target: this
					});
				}
				return;
			}
			
			this.imageEl.isError = false;
			this.imageEl.isLoading = true;
			this.imageEl.naturalWidth = null;
			this.imageEl.naturalHeight = null;
			this.imageEl.isLandscape = false;
			this.imageEl.onload = this.imageLoadHandler;
			this.imageEl.onerror = this.imageErrorHandler;
			this.imageEl.onabort = this.imageErrorHandler;
			this.imageEl.originalSrc = this.src;
			this.imageEl.src = this.src;
			
		},
		
		
		
		/*
		 * Function: shrinkImage
		 */
		shrinkImage: function(){
		
			if (Util.isNothing(this.imageEl)){
				return;
			}
			
			if (this.imageEl.src.indexOf(this.src) > -1){
				this.imageEl.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
				if (!Util.isNothing(this.imageEl.parentNode)){
					Util.DOM.removeChild(this.imageEl, this.imageEl.parentNode);
				}
			}
		
		},
		
		
		
		/*
		 * Function: onImageLoad
		 */
		onImageLoad: function(e){
			
			this.imageEl.onload = null;
			this.imageEl.naturalWidth = Util.coalesce(this.imageEl.naturalWidth, this.imageEl.width);
			this.imageEl.naturalHeight = Util.coalesce(this.imageEl.naturalHeight, this.imageEl.height);
			this.imageEl.isLandscape = (this.imageEl.naturalWidth > this.imageEl.naturalHeight);
			this.imageEl.isLoading = false;
			
			Util.Events.fire(this, {
				type: PhotoSwipe.Image.EventTypes.onLoad,
				target: this
			});
			
		},
		
		
		
		/*
		 * Function: onImageError
		 */
		onImageError: function(e){
		
			this.imageEl.onload = null;
			this.imageEl.onerror = null;
			this.imageEl.onabort = null;
			this.imageEl.isLoading = false;
			this.imageEl.isError = true;
			
			Util.Events.fire(this, {
				type: PhotoSwipe.Image.EventTypes.onError,
				target: this
			});
			
		}
		
		
		
	});
	
	
	
}
(
	window, 
	window.klass, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.PhotoSwipe.Cache');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	
	
	PhotoSwipe.Cache.Mode = {
		
		normal: 'normal',
		aggressive: 'aggressive'
		
	};
	
	
	
	PhotoSwipe.Cache.Functions = {
		
		/*
		 * Function: getImageSource
		 * Default method for returning an image's source
		 */
		getImageSource: function(el){
			return el.href;
		},
	
	
	
		/*
		 * Function: getImageCaption
		 * Default method for returning an image's caption
		 * Assumes the el is an anchor and the first child is the
		 * image. The returned value is the "alt" attribute of the
		 * image.
		 */
		getImageCaption: function(el){
			
			if (el.nodeName === "IMG"){
				return Util.DOM.getAttribute(el, 'alt'); 
			}
			var i, j, childEl;
			for (i=0, j=el.childNodes.length; i<j; i++){
				childEl = el.childNodes[i];
				if (el.childNodes[i].nodeName === 'IMG'){
					return Util.DOM.getAttribute(childEl, 'alt'); 
				}
			}
			
		},
	
	
	
		/*
		 * Function: getImageMetaData
		 * Can be used if you wish to store additional meta
		 * data against the full size image
		 */
		getImageMetaData: function(el){
			
			return  {};
			
		}
		
	};
	
	
	
	
}
(
	window, 
	window.klass, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.PhotoSwipe.Cache');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	
	
	PhotoSwipe.Cache.CacheClass = klass({
		
		
		
		images: null,
		settings: null,
		
		
		
		/*
		 * Function: dispose
		 */
		dispose: function(){
		
			var prop, i, j;
			
			if (!Util.isNothing(this.images)){
				for (i=0, j=this.images.length; i<j; i++){
					this.images[i].dispose();
				}
				this.images.length = 0;
			}
			
			for (prop in this) {
				if (Util.objectHasProperty(this, prop)) {
					this[prop] = null;
				}
			}
		
		},
		
		
		
		/*
		 * Function: initialize
		 */
		initialize: function(images, options){
			
			var i, j, cacheImage, image, src, caption, metaData;
			
			this.settings = options;
			
			this.images = [];
			
			for (i=0, j=images.length; i<j; i++){
				
				image = images[i];
				src = this.settings.getImageSource(image);
				caption = this.settings.getImageCaption(image);
				metaData = this.settings.getImageMetaData(image);
				
				this.images.push(new PhotoSwipe.Image.ImageClass(image, src, caption, metaData));
				
			}
			
			
		},
		
		
		
		/*
		 * Function: getImages
		 */
		getImages: function(indexes){
		
			var i, j, retval = [], cacheImage;
			
			for (i=0, j=indexes.length; i<j; i++){
				cacheImage = this.images[indexes[i]];
				if (this.settings.cacheMode === PhotoSwipe.Cache.Mode.aggressive){
					cacheImage.cacheDoNotShrink = true;
				}
				retval.push(cacheImage);
			}
			
			if (this.settings.cacheMode === PhotoSwipe.Cache.Mode.aggressive){
				for (i=0, j=this.images.length; i<j; i++){
					cacheImage = this.images[i];
					if (!Util.objectHasProperty(cacheImage, 'cacheDoNotShrink')){
						cacheImage.shrinkImage();
					}
					else{
						delete cacheImage.cacheDoNotShrink;
					}
				}
			}
			
			return retval;
			
		}
		
		
	});
	
	
	
}
(
	window, 
	window.klass, 
	window.Code.Util,
	window.Code.PhotoSwipe.Image
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.PhotoSwipe.DocumentOverlay');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	
	
	PhotoSwipe.DocumentOverlay.CssClasses = {
		documentOverlay: 'ps-document-overlay'
	};
	
	
	
}
(
	window, 
	window.klass, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.PhotoSwipe.DocumentOverlay');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	
	
	PhotoSwipe.DocumentOverlay.DocumentOverlayClass = klass({
		
		
		
		el: null,
		settings: null,
		initialBodyHeight: null,
		
		
		
		/*
		 * Function: dispose
		 */
		dispose: function(){
		
			var prop;
			
			Util.Animation.stop(this.el);
			Util.DOM.removeChild(this.el, this.el.parentNode);
			
			for (prop in this) {
				if (Util.objectHasProperty(this, prop)) {
					this[prop] = null;
				}
			}
		
		},
		
		
		
		/*
		 * Function: initialize
		 */
		initialize: function(options){
			
			this.settings = options;
			
			this.el = Util.DOM.createElement(
				'div', 
				{ 
					'class': PhotoSwipe.DocumentOverlay.CssClasses.documentOverlay
				}, 
				''
			);
			Util.DOM.setStyle(this.el, {
				display: 'block',
				position: 'absolute',
				left: 0,
				top: 0,
				zIndex: this.settings.zIndex
			});
		
			Util.DOM.hide(this.el);
			if (this.settings.target === window){
				Util.DOM.appendToBody(this.el);
			}
			else{
				Util.DOM.appendChild(this.el, this.settings.target);
			}
			
			Util.Animation.resetTranslate(this.el);
			
			// Store this value incase the body dimensions change to zero!
			// I've seen it happen! :D
			this.initialBodyHeight = Util.DOM.bodyOuterHeight();
			
			
		},
		
		
		
		/*
		 * Function: resetPosition
		 */
		resetPosition: function(){
			
			var width, height, top;
			
			if (this.settings.target === window){
				
				width = Util.DOM.windowWidth();
				height = Util.DOM.bodyOuterHeight() * 2; // This covers extra height added by photoswipe
				top = (this.settings.jQueryMobile) ? Util.DOM.windowScrollTop() + 'px' : '0px';
				
				if (height < 1){
					height = this.initialBodyHeight;
				}

				if (Util.DOM.windowHeight() > height){
					height = Util.DOM.windowHeight();
				}
				
			}
			else{
				
				width = Util.DOM.width(this.settings.target);
				height = Util.DOM.height(this.settings.target);
				top = '0px';
				
			}
			
			Util.DOM.setStyle(this.el, {
				width: width,
				height: height,
				top: top
			});
		
		},
		
		
		
		/*
		 * Function: fadeIn
		 */
		fadeIn: function(speed, callback){
		
			this.resetPosition();
			
			Util.DOM.setStyle(this.el, 'opacity', 0);
			Util.DOM.show(this.el);
			
			Util.Animation.fadeIn(this.el, speed, callback);
		
		}
		
		
	});
	
	
	
}
(
	window, 
	window.klass, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.PhotoSwipe.Carousel');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	
	
	PhotoSwipe.Carousel.EventTypes = {
	
		onSlideByEnd: 'PhotoSwipeCarouselOnSlideByEnd',
		onSlideshowStart: 'PhotoSwipeCarouselOnSlideshowStart',
		onSlideshowStop: 'PhotoSwipeCarouselOnSlideshowStop'
		
	};
	
	
	
	PhotoSwipe.Carousel.CssClasses = {
		carousel: 'ps-carousel',
		content: 'ps-carousel-content',
		item: 'ps-carousel-item',
		itemLoading: 'ps-carousel-item-loading',
		itemError: 'ps-carousel-item-error'
	};
	
	
	
	PhotoSwipe.Carousel.SlideByAction = {
		previous: 'previous',
		current: 'current',
		next: 'next'
	};
	
	
}
(
	window, 
	window.klass, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.PhotoSwipe.Carousel');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	
	PhotoSwipe.Carousel.CarouselClass = klass({
		
		
		
		el: null,
		contentEl: null,
		settings: null,
		cache: null,
		slideByEndHandler: null,
		currentCacheIndex: null,
		isSliding: null,
		isSlideshowActive: null,
		lastSlideByAction: null,
		touchStartPoint: null,
		touchStartPosition: null,
		imageLoadHandler: null,
		imageErrorHandler: null,
		slideshowTimeout: null,
		
		
		
		/*
		 * Function: dispose
		 */
		dispose: function(){
		
			var prop, i, j;
			
			for (i=0, j=this.cache.images.length; i<j; i++){
				Util.Events.remove(this.cache.images[i], PhotoSwipe.Image.EventTypes.onLoad, this.imageLoadHandler);
				Util.Events.remove(this.cache.images[i], PhotoSwipe.Image.EventTypes.onError, this.imageErrorHandler);
			}
			
			this.stopSlideshow();
			Util.Animation.stop(this.el);
			Util.DOM.removeChild(this.el, this.el.parentNode);
			
			for (prop in this) {
				if (Util.objectHasProperty(this, prop)) {
					this[prop] = null;
				}
			}
		
		},
		
		
		
		/*
		 * Function: initialize
		 */
		initialize: function(cache, options){
			
			//this.supr(true);
			
			var i, totalItems, itemEl;
			
			this.cache = cache;
			this.settings = options;
			this.slideByEndHandler = this.onSlideByEnd.bind(this);
			this.imageLoadHandler = this.onImageLoad.bind(this);
			this.imageErrorHandler = this.onImageError.bind(this);
			this.currentCacheIndex = 0;
			this.isSliding = false;
			this.isSlideshowActive = false;
			
			// No looping if < 3 images
			if (this.cache.images.length < 3){
				this.settings.loop = false;
			}
			
			// Main container 
			this.el = Util.DOM.createElement(
				'div', 
				{ 
					'class': PhotoSwipe.Carousel.CssClasses.carousel
				}, 
				''
			);
			Util.DOM.setStyle(this.el, {
				display: 'block',
				position: 'absolute',
				left: 0,
				top: 0,
				overflow: 'hidden',
				zIndex: this.settings.zIndex
			});
			Util.DOM.hide(this.el);
			
			
			// Content
			this.contentEl = Util.DOM.createElement(
				'div', 
				{ 
					'class': PhotoSwipe.Carousel.CssClasses.content
				}, 
				''
			);
			Util.DOM.setStyle(this.contentEl, {
				display: 'block',
				position: 'absolute',
				left: 0,
				top: 0
			});
			
			Util.DOM.appendChild(this.contentEl, this.el);
			
			
			// Items
			totalItems = (cache.images.length < 3) ? cache.images.length : 3;
			
			for (i=0; i<totalItems; i++){
				
				itemEl = Util.DOM.createElement(
					'div', 
					{ 
						'class': PhotoSwipe.Carousel.CssClasses.item + 
						' ' + PhotoSwipe.Carousel.CssClasses.item + '-'+ i
					}, 
					''
				);
				Util.DOM.setAttribute(itemEl, 'style', 'float: left;');
				Util.DOM.setStyle(itemEl, {
					display: 'block',
					position: 'relative',
					left: 0,
					top: 0,
					overflow: 'hidden'
				});
				
				if (this.settings.margin > 0){
					Util.DOM.setStyle(itemEl, {
						marginRight: this.settings.margin + 'px'
					});
				}
				
				Util.DOM.appendChild(itemEl, this.contentEl);
				
			}
			
			
			if (this.settings.target === window){
				Util.DOM.appendToBody(this.el);
			}
			else{
				Util.DOM.appendChild(this.el, this.settings.target);
			}
			
		},
		
		
		
		
		/*
		 * Function: resetPosition
		 */
		resetPosition: function(){
			
			var width, height, top, itemWidth, itemEls, contentWidth, i, j, itemEl, imageEl;
			
			if (this.settings.target === window){
				width = Util.DOM.windowWidth();
				height = Util.DOM.windowHeight();
				top = Util.DOM.windowScrollTop()  + 'px';
			}
			else{
				width = Util.DOM.width(this.settings.target);
				height = Util.DOM.height(this.settings.target);
				top = '0px';
			}
			
			itemWidth = (this.settings.margin > 0) ? width + this.settings.margin : width;
			itemEls = Util.DOM.find('.' + PhotoSwipe.Carousel.CssClasses.item, this.contentEl);
			contentWidth = itemWidth * itemEls.length;
			
			
			// Set the height and width to fill the document
			Util.DOM.setStyle(this.el, {
				top: top,
				width: width,
				height: height
			});
			
			
			// Set the height and width of the content el
			Util.DOM.setStyle(this.contentEl, {
				width: contentWidth,
				height: height
			});
			
			
			// Set the height and width of item elements
			for (i=0, j=itemEls.length; i<j; i++){
				
				itemEl = itemEls[i];
				Util.DOM.setStyle(itemEl, {
					width: width,
					height: height
				});
				
				// If an item has an image then resize that
				imageEl = Util.DOM.find('img', itemEl)[0];
				if (!Util.isNothing(imageEl)){
					this.resetImagePosition(imageEl);
				}
				
			}
			
			this.setContentLeftPosition();
			
			
		},
		
		
		
		/*
		 * Function: resetImagePosition
		 */
		resetImagePosition: function(imageEl){
			
			if (Util.isNothing(imageEl)){
				return;
			}
			
			var 
				src = Util.DOM.getAttribute(imageEl, 'src'),
				scale, 
				newWidth, 
				newHeight, 
				newTop, 
				newLeft,
				maxWidth = Util.DOM.width(this.el),
				maxHeight = Util.DOM.height(this.el);
			
			if (this.settings.imageScaleMethod === 'fitNoUpscale'){
				
				newWidth = imageEl.naturalWidth;
				newHeight =imageEl.naturalHeight;
				
				if (newWidth > maxWidth){
					scale = maxWidth / newWidth;
					newWidth = Math.round(newWidth * scale);
					newHeight = Math.round(newHeight * scale);
				}
				
				if (newHeight > maxHeight){
					scale = maxHeight / newHeight;
					newHeight = Math.round(newHeight * scale);
					newWidth = Math.round(newWidth * scale);
				}
				
			}
			else{
				
				if (imageEl.isLandscape) {
					// Ensure the width fits the screen
					scale = maxWidth / imageEl.naturalWidth;
				}
				else {
					// Ensure the height fits the screen
					scale = maxHeight / imageEl.naturalHeight;
				}
				
				newWidth = Math.round(imageEl.naturalWidth * scale);
				newHeight = Math.round(imageEl.naturalHeight * scale);
				
				if (this.settings.imageScaleMethod === 'zoom'){
					
					scale = 1;
					if (newHeight < maxHeight){
						scale = maxHeight /newHeight;	
					}
					else if (newWidth < maxWidth){
						scale = maxWidth /newWidth;	
					}
					
					if (scale !== 1) {
						newWidth = Math.round(newWidth * scale);
						newHeight = Math.round(newHeight * scale);
					}
					
				}
				else if (this.settings.imageScaleMethod === 'fit') {
					// Rescale again to ensure full image fits into the viewport
					scale = 1;
					if (newWidth > maxWidth) {
						scale = maxWidth / newWidth;
					}
					else if (newHeight > maxHeight) {
						scale = maxHeight / newHeight;
					}
					if (scale !== 1) {
						newWidth = Math.round(newWidth * scale);
						newHeight = Math.round(newHeight * scale);
					}
				}
			
			}
			
			newTop = Math.round( ((maxHeight - newHeight) / 2) ) + 'px';
			newLeft = Math.round( ((maxWidth - newWidth) / 2) ) + 'px';
			
			Util.DOM.setStyle(imageEl, {
				position: 'absolute',
				width: newWidth,
				height: newHeight,
				top: newTop,
				left: newLeft,
				display: 'block'
			});
		
		},
		
		
		
		/*
		 * Function: setContentLeftPosition
		 */
		setContentLeftPosition: function(){
		
			var width, itemEls, left;
			if (this.settings.target === window){
				width = Util.DOM.windowWidth();
			}
			else{
				width = Util.DOM.width(this.settings.target);
			}
			
			itemEls = this.getItemEls();
			left = 0;
				
			if (this.settings.loop){
				left = (width + this.settings.margin) * -1;
			}
			else{
				
				if (this.currentCacheIndex === this.cache.images.length-1){
					left = ((itemEls.length-1) * (width + this.settings.margin)) * -1;
				}
				else if (this.currentCacheIndex > 0){
					left = (width + this.settings.margin) * -1;
				}
				
			}
			
			Util.DOM.setStyle(this.contentEl, {
				left: left + 'px'
			});
			
		},
		
		
		
		/*
		 * Function: 
		 */
		show: function(index){
			
			this.currentCacheIndex = index;
			this.resetPosition();
			this.setImages(false);
			Util.DOM.show(this.el);
			
			Util.Animation.resetTranslate(this.contentEl);
			var 
				itemEls = this.getItemEls(),
				i, j;
			for (i=0, j=itemEls.length; i<j; i++){
				Util.Animation.resetTranslate(itemEls[i]);
			}
			
			Util.Events.fire(this, {
				type: PhotoSwipe.Carousel.EventTypes.onSlideByEnd,
				target: this,
				action: PhotoSwipe.Carousel.SlideByAction.current,
				cacheIndex: this.currentCacheIndex
			});
			
		},
		
		
		
		/*
		 * Function: setImages
		 */
		setImages: function(ignoreCurrent){
			
			var 
				cacheImages,
				itemEls = this.getItemEls(),
				nextCacheIndex = this.currentCacheIndex + 1,
				previousCacheIndex = this.currentCacheIndex - 1;
			
			if (this.settings.loop){
				
				if (nextCacheIndex > this.cache.images.length-1){
					nextCacheIndex = 0;
				}
				if (previousCacheIndex < 0){
					previousCacheIndex = this.cache.images.length-1;
				}
				
				cacheImages = this.cache.getImages([
					previousCacheIndex,
					this.currentCacheIndex,
					nextCacheIndex
				]);
				
				if (!ignoreCurrent){
					// Current
					this.addCacheImageToItemEl(cacheImages[1], itemEls[1]);
				}
				// Next
				this.addCacheImageToItemEl(cacheImages[2], itemEls[2]);
				// Previous
				this.addCacheImageToItemEl(cacheImages[0], itemEls[0]);
				
			}
			else{
			
				if (itemEls.length === 1){
					if (!ignoreCurrent){
						// Current
						cacheImages = this.cache.getImages([
							this.currentCacheIndex
						]);
						this.addCacheImageToItemEl(cacheImages[0], itemEls[0]);
					}
				}
				else if (itemEls.length === 2){
					
					if (this.currentCacheIndex === 0){
						cacheImages = this.cache.getImages([
							this.currentCacheIndex,
							this.currentCacheIndex + 1
						]);
						if (!ignoreCurrent){
							this.addCacheImageToItemEl(cacheImages[0], itemEls[0]);
						}
						this.addCacheImageToItemEl(cacheImages[1], itemEls[1]);
					}
					else{
						cacheImages = this.cache.getImages([
							this.currentCacheIndex - 1,
							this.currentCacheIndex
						]);
						if (!ignoreCurrent){
							this.addCacheImageToItemEl(cacheImages[1], itemEls[1]);
						}
						this.addCacheImageToItemEl(cacheImages[0], itemEls[0]);
					}
					
				}
				else{
					
					if (this.currentCacheIndex === 0){
						cacheImages = this.cache.getImages([
							this.currentCacheIndex,
							this.currentCacheIndex + 1,
							this.currentCacheIndex + 2
						]);
						if (!ignoreCurrent){
							this.addCacheImageToItemEl(cacheImages[0], itemEls[0]);
						}
						this.addCacheImageToItemEl(cacheImages[1], itemEls[1]);
						this.addCacheImageToItemEl(cacheImages[2], itemEls[2]);
					}
					else if (this.currentCacheIndex === this.cache.images.length-1){
						cacheImages = this.cache.getImages([
							this.currentCacheIndex - 2,
							this.currentCacheIndex - 1,
							this.currentCacheIndex
						]);
						if (!ignoreCurrent){
							// Current
							this.addCacheImageToItemEl(cacheImages[2], itemEls[2]);
						}
						this.addCacheImageToItemEl(cacheImages[1], itemEls[1]);
						this.addCacheImageToItemEl(cacheImages[0], itemEls[0]);
					}
					else{
						cacheImages = this.cache.getImages([
							this.currentCacheIndex - 1,
							this.currentCacheIndex,
							this.currentCacheIndex + 1
						]);
						
						if (!ignoreCurrent){
							// Current
							this.addCacheImageToItemEl(cacheImages[1], itemEls[1]);
						}
						// Next
						this.addCacheImageToItemEl(cacheImages[2], itemEls[2]);
						// Previous
						this.addCacheImageToItemEl(cacheImages[0], itemEls[0]);
					}
					
				}
			
			}
		
		},
		
		
		
		/*
		 * Function: addCacheImageToItemEl
		 */
		addCacheImageToItemEl: function(cacheImage, itemEl){
			
			Util.DOM.removeClass(itemEl, PhotoSwipe.Carousel.CssClasses.itemError);
			Util.DOM.addClass(itemEl, PhotoSwipe.Carousel.CssClasses.itemLoading);
			
			Util.DOM.removeChildren(itemEl);
			
			Util.DOM.setStyle(cacheImage.imageEl, {
				display: 'none'
			});
			Util.DOM.appendChild(cacheImage.imageEl, itemEl);
			
			Util.Animation.resetTranslate(cacheImage.imageEl);
			
			Util.Events.add(cacheImage, PhotoSwipe.Image.EventTypes.onLoad, this.imageLoadHandler);
			Util.Events.add(cacheImage, PhotoSwipe.Image.EventTypes.onError, this.imageErrorHandler);
			
			cacheImage.load();
			
		},
		
		
		
		/*
		 * Function: slideCarousel
		 */
		slideCarousel: function(point, action, speed){
			
			if (this.isSliding){
				return;
			}
			
			var width, diffX, slideBy;
			
			if (this.settings.target === window){
				width = Util.DOM.windowWidth() + this.settings.margin;
			}
			else{
				width = Util.DOM.width(this.settings.target) + this.settings.margin;
			}
			
			speed = Util.coalesce(speed, this.settings.slideSpeed);
			
			if (window.Math.abs(diffX) < 1){
				return;
			}
			
			
			switch (action){
				
				case Util.TouchElement.ActionTypes.swipeLeft:
					
					slideBy = width * -1;
					break;
					
				case Util.TouchElement.ActionTypes.swipeRight:
				
					slideBy = width;
					break;
				
				default:
					
					diffX = point.x - this.touchStartPoint.x;
					
					if (window.Math.abs(diffX) > width / 2){
						slideBy = (diffX > 0) ? width : width * -1;
					}
					else{
						slideBy = 0;
					}
					break;
			
			}
			
			if (slideBy < 0){
				this.lastSlideByAction = PhotoSwipe.Carousel.SlideByAction.next;
			}
			else if (slideBy > 0){
				this.lastSlideByAction = PhotoSwipe.Carousel.SlideByAction.previous;
			}
			else{
				this.lastSlideByAction = PhotoSwipe.Carousel.SlideByAction.current;
			}
			
			// Check for non-looping carousels
			// If we are at the start or end, spring back to the current item element
			if (!this.settings.loop){
				if ( (this.lastSlideByAction === PhotoSwipe.Carousel.SlideByAction.previous && this.currentCacheIndex === 0 ) || (this.lastSlideByAction === PhotoSwipe.Carousel.SlideByAction.next && this.currentCacheIndex === this.cache.images.length-1) ){
					slideBy = 0;
					this.lastSlideByAction = PhotoSwipe.Carousel.SlideByAction.current;
				}
			}
			
			this.isSliding = true;
			this.doSlideCarousel(slideBy, speed);
			
		},
		
		
		
		/*
		 * Function: 
		 */
		moveCarousel: function(point){
			
			if (this.isSliding){
				return;
			}
			
			if (!this.settings.enableDrag){
				return;
			}
			
			this.doMoveCarousel(point.x - this.touchStartPoint.x);
			
		},
		
		
		
		/*
		 * Function: getItemEls
		 */
		getItemEls: function(){
		
			return Util.DOM.find('.' + PhotoSwipe.Carousel.CssClasses.item, this.contentEl);
		
		},
		
		
		
		/*
		 * Function: previous
		 */
		previous: function(){
			
			this.stopSlideshow();
			this.slideCarousel({x:0, y:0}, Util.TouchElement.ActionTypes.swipeRight, this.settings.nextPreviousSlideSpeed);
		
		},
		
		
		
		/*
		 * Function: next
		 */
		next: function(){
			
			this.stopSlideshow();
			this.slideCarousel({x:0, y:0}, Util.TouchElement.ActionTypes.swipeLeft, this.settings.nextPreviousSlideSpeed);
		
		},
		
		
		
		/*
		 * Function: slideshowNext
		 */
		slideshowNext: function(){
		
			this.slideCarousel({x:0, y:0}, Util.TouchElement.ActionTypes.swipeLeft);
		
		},
		
		
		
		
		/*
		 * Function: startSlideshow
		 */
		startSlideshow: function(){
			
			this.stopSlideshow();
			
			this.isSlideshowActive = true;
			
			this.slideshowTimeout = window.setTimeout(this.slideshowNext.bind(this), this.settings.slideshowDelay);
			
			Util.Events.fire(this, {
				type: PhotoSwipe.Carousel.EventTypes.onSlideshowStart,
				target: this
			});
			
		},
		
		
		
		/*
		 * Function: stopSlideshow
		 */
		stopSlideshow: function(){
			
			if (!Util.isNothing(this.slideshowTimeout)){
			
				window.clearTimeout(this.slideshowTimeout);
				this.slideshowTimeout = null;
				this.isSlideshowActive = false;
				
				Util.Events.fire(this, {
					type: PhotoSwipe.Carousel.EventTypes.onSlideshowStop,
					target: this
				});
			
			}
			
		},
		
		
		
		/*
		 * Function: onSlideByEnd
		 */
		onSlideByEnd: function(e){
			
			if (Util.isNothing(this.isSliding)){
				return;
			}
			
			var itemEls = this.getItemEls();
			
			this.isSliding = false;
			
			if (this.lastSlideByAction === PhotoSwipe.Carousel.SlideByAction.next){
				this.currentCacheIndex = this.currentCacheIndex + 1;
			}
			else if (this.lastSlideByAction === PhotoSwipe.Carousel.SlideByAction.previous){
				this.currentCacheIndex = this.currentCacheIndex - 1;
			}
			
			if (this.settings.loop){
				
				if (this.lastSlideByAction === PhotoSwipe.Carousel.SlideByAction.next){
					// Move first to the last
					Util.DOM.appendChild(itemEls[0], this.contentEl);
				}
				else if (this.lastSlideByAction === PhotoSwipe.Carousel.SlideByAction.previous){
					// Move the last to the first
					Util.DOM.insertBefore(itemEls[itemEls.length-1], itemEls[0], this.contentEl);
				}
				
				if (this.currentCacheIndex < 0){
					this.currentCacheIndex = this.cache.images.length - 1;
				}
				else if (this.currentCacheIndex === this.cache.images.length){
					this.currentCacheIndex = 0;
				}
				
			}
			else{
				
				if (this.cache.images.length > 3){
					
					if (this.currentCacheIndex > 1 && this.currentCacheIndex < this.cache.images.length-2){
						if (this.lastSlideByAction === PhotoSwipe.Carousel.SlideByAction.next){
							// Move first to the last
							Util.DOM.appendChild(itemEls[0], this.contentEl);
						}
						else if (this.lastSlideByAction === PhotoSwipe.Carousel.SlideByAction.previous){
							// Move the last to the first
							Util.DOM.insertBefore(itemEls[itemEls.length-1], itemEls[0], this.contentEl);
						}
					}
					else if (this.currentCacheIndex === 1){
						if (this.lastSlideByAction === PhotoSwipe.Carousel.SlideByAction.previous){
							// Move the last to the first
							Util.DOM.insertBefore(itemEls[itemEls.length-1], itemEls[0], this.contentEl);
						}
					}
					else if (this.currentCacheIndex === this.cache.images.length-2){
						if (this.lastSlideByAction === PhotoSwipe.Carousel.SlideByAction.next){
							// Move first to the last
							Util.DOM.appendChild(itemEls[0], this.contentEl);
						}
					}
				
				}
				
				
			}
			
			if (this.lastSlideByAction !== PhotoSwipe.Carousel.SlideByAction.current){
				this.setContentLeftPosition();
				this.setImages(true);
			}
			
			
			Util.Events.fire(this, {
				type: PhotoSwipe.Carousel.EventTypes.onSlideByEnd,
				target: this,
				action: this.lastSlideByAction,
				cacheIndex: this.currentCacheIndex
			});
			
			
			if (this.isSlideshowActive){
				
				if (this.lastSlideByAction !== PhotoSwipe.Carousel.SlideByAction.current){
					this.startSlideshow();
				}
				else{
					this.stopSlideshow();
				}
			
			}
			
			
		},
		
		
		
		/*
		 * Function: onTouch
		 */
		onTouch: function(action, point){
			
			this.stopSlideshow();
			
			switch(action){
				
				case Util.TouchElement.ActionTypes.touchStart:
					this.touchStartPoint = point;
					this.touchStartPosition = {
						x: window.parseInt(Util.DOM.getStyle(this.contentEl, 'left'), 0),
						y: window.parseInt(Util.DOM.getStyle(this.contentEl, 'top'), 0)
					};
					break;
				
				case Util.TouchElement.ActionTypes.touchMove:
					this.moveCarousel(point);
					break;
					
				case Util.TouchElement.ActionTypes.touchMoveEnd:
				case Util.TouchElement.ActionTypes.swipeLeft:
				case Util.TouchElement.ActionTypes.swipeRight:
					this.slideCarousel(point, action);
					break;
					
				case Util.TouchElement.ActionTypes.tap:
					break;
					
				case Util.TouchElement.ActionTypes.doubleTap:
					break;
				
				
			}
			
		},
		
		
		
		/*
		 * Function: onImageLoad
		 */
		onImageLoad: function(e){
			
			var cacheImage = e.target;
			
			if (!Util.isNothing(cacheImage.imageEl.parentNode)){
				Util.DOM.removeClass(cacheImage.imageEl.parentNode, PhotoSwipe.Carousel.CssClasses.itemLoading);
				this.resetImagePosition(cacheImage.imageEl);
			}
			
			Util.Events.remove(cacheImage, PhotoSwipe.Image.EventTypes.onLoad, this.imageLoadHandler);
			Util.Events.remove(cacheImage, PhotoSwipe.Image.EventTypes.onError, this.imageErrorHandler);
			
		},
		
		
		
		/*
		 * Function: onImageError
		 */
		onImageError: function(e){
			
			var cacheImage = e.target;
			
			if (!Util.isNothing(cacheImage.imageEl.parentNode)){
				Util.DOM.removeClass(cacheImage.imageEl.parentNode, PhotoSwipe.Carousel.CssClasses.itemLoading);
				Util.DOM.addClass(cacheImage.imageEl.parentNode, PhotoSwipe.Carousel.CssClasses.itemError);
			}
			
			Util.Events.remove(cacheImage, PhotoSwipe.Image.EventTypes.onLoad, this.imageLoadHandler);
			Util.Events.remove(cacheImage, PhotoSwipe.Image.EventTypes.onError, this.imageErrorHandler);
			
		}
		
		
		
	});
	
	
	
}
(
	window, 
	window.klass, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util, TouchElement){
	
	
	Util.registerNamespace('Code.PhotoSwipe.Carousel');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	
	PhotoSwipe.Carousel.CarouselClass = PhotoSwipe.Carousel.CarouselClass.extend({
	
		
		/*
		 * Function: getStartingPos
		 */
		getStartingPos: function(){
			
			var startingPos = this.touchStartPosition;
			
			if (Util.isNothing(startingPos)){
				startingPos = {
					x: window.parseInt(Util.DOM.getStyle(this.contentEl, 'left'), 0),
					y: window.parseInt(Util.DOM.getStyle(this.contentEl, 'top'), 0)
				};
			}
			
			return startingPos;
		
		},
		
		
		
		/*
		 * Function: doMoveCarousel
		 */
		doMoveCarousel: function(xVal){
			
			var style;
			
			if (Util.Browser.isCSSTransformSupported){
				
				style = {};
				
				style[Util.Animation._transitionPrefix + 'Property'] = 'all';
				style[Util.Animation._transitionPrefix + 'Duration'] = '';
				style[Util.Animation._transitionPrefix + 'TimingFunction'] = '';
				style[Util.Animation._transitionPrefix + 'Delay'] = '0';
				style[Util.Animation._transformLabel] = (Util.Browser.is3dSupported) ? 'translate3d(' + xVal + 'px, 0px, 0px)' : 'translate(' + xVal + 'px, 0px)';
				
				Util.DOM.setStyle(this.contentEl, style);
			
			}
			else if (!Util.isNothing(window.jQuery)){
				
				
				window.jQuery(this.contentEl).stop().css('left', this.getStartingPos().x + xVal + 'px');
				
			}
			
		},
		
		
		
		/*
		 * Function: doSlideCarousel
		 */
		doSlideCarousel: function(xVal, speed){
			
			var animateProps, transform;
			
			if (speed <= 0){
				
				this.slideByEndHandler();
				return;
				
			}
			
			
			if (Util.Browser.isCSSTransformSupported){
				
				transform = Util.coalesce(this.contentEl.style.webkitTransform, this.contentEl.style.MozTransform, this.contentEl.style.transform, '');
				if (transform.indexOf('translate3d(' + xVal) === 0){
					this.slideByEndHandler();
					return;
				}
				else if (transform.indexOf('translate(' + xVal) === 0){
					this.slideByEndHandler();
					return;
				}
				
				Util.Animation.slideBy(this.contentEl, xVal, 0, speed, this.slideByEndHandler, this.settings.slideTimingFunction);
				
			}
			else if (!Util.isNothing(window.jQuery)){
				
				animateProps = {
					left: this.getStartingPos().x + xVal + 'px'
				};
		
				if (this.settings.animationTimingFunction === 'ease-out'){
					this.settings.animationTimingFunction = 'easeOutQuad';
				}
				
				if ( Util.isNothing(window.jQuery.easing[this.settings.animationTimingFunction]) ){
					this.settings.animationTimingFunction = 'linear';
				}
			
				window.jQuery(this.contentEl).animate(
					animateProps, 
					this.settings.slideSpeed, 
					this.settings.animationTimingFunction,
					this.slideByEndHandler
				);
			
			}
			
			
		}
	
	});
	
	
	
}
(
	window, 
	window.klass, 
	window.Code.Util,
	window.Code.PhotoSwipe.TouchElement
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.PhotoSwipe.Toolbar');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	
	PhotoSwipe.Toolbar.CssClasses = {
		toolbar: 'ps-toolbar',
		toolbarContent: 'ps-toolbar-content',
		toolbarTop: 'ps-toolbar-top',
		caption: 'ps-caption',
		captionBottom: 'ps-caption-bottom',
		captionContent: 'ps-caption-content',
		close: 'ps-toolbar-close',
		play: 'ps-toolbar-play',
		previous: 'ps-toolbar-previous',
		previousDisabled: 'ps-toolbar-previous-disabled',
		next: 'ps-toolbar-next',
		nextDisabled: 'ps-toolbar-next-disabled'
	};
	
	
	
	PhotoSwipe.Toolbar.ToolbarAction = {
		close: 'close',
		play: 'play',
		next: 'next',
		previous: 'previous',
		none: 'none'
	};
	
	
	
	PhotoSwipe.Toolbar.EventTypes = {
		onTap: 'PhotoSwipeToolbarOnClick',
		onBeforeShow: 'PhotoSwipeToolbarOnBeforeShow',
		onShow: 'PhotoSwipeToolbarOnShow',
		onBeforeHide: 'PhotoSwipeToolbarOnBeforeHide',
		onHide: 'PhotoSwipeToolbarOnHide'
	};
	
	
	
	PhotoSwipe.Toolbar.getToolbar = function(){
		
		return '<div class="' + PhotoSwipe.Toolbar.CssClasses.close + '"><div class="' + PhotoSwipe.Toolbar.CssClasses.toolbarContent + '"></div></div><div class="' + PhotoSwipe.Toolbar.CssClasses.play + '"><div class="' + PhotoSwipe.Toolbar.CssClasses.toolbarContent + '"></div></div><div class="' + PhotoSwipe.Toolbar.CssClasses.previous + '"><div class="' + PhotoSwipe.Toolbar.CssClasses.toolbarContent + '"></div></div><div class="' + PhotoSwipe.Toolbar.CssClasses.next + '"><div class="' + PhotoSwipe.Toolbar.CssClasses.toolbarContent + '"></div></div>';
		
	};
	
}
(
	window, 
	window.klass, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.PhotoSwipe.Toolbar');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	
	PhotoSwipe.Toolbar.ToolbarClass = klass({
		
		
		
		toolbarEl: null,
		closeEl: null,
		playEl: null,
		previousEl: null,
		nextEl: null,
		captionEl: null,
		captionContentEl: null,
		currentCaption: null,
		settings: null,
		cache: null,
		timeout: null,
		isVisible: null,
		fadeOutHandler: null,
		touchStartHandler: null,
		touchMoveHandler: null,
		clickHandler: null,
		
		
		
		/*
		 * Function: dispose
		 */
		dispose: function(){
		
			var prop;
			
			this.clearTimeout();
			
			this.removeEventHandlers();
			
			Util.Animation.stop(this.toolbarEl);
			Util.Animation.stop(this.captionEl);
			
			Util.DOM.removeChild(this.toolbarEl, this.toolbarEl.parentNode);
			Util.DOM.removeChild(this.captionEl, this.captionEl.parentNode);
			
			for (prop in this) {
				if (Util.objectHasProperty(this, prop)) {
					this[prop] = null;
				}
			}
			
		},
		
		
		
		/*
		 * Function: initialize
		 */
		initialize: function(cache, options){
			
			var cssClass;
			
			this.settings = options;
			this.cache = cache;
			this.isVisible = false;
			
			this.fadeOutHandler = this.onFadeOut.bind(this);
			this.touchStartHandler = this.onTouchStart.bind(this);
			this.touchMoveHandler = this.onTouchMove.bind(this);
			this.clickHandler = this.onClick.bind(this);
			
			
			cssClass = PhotoSwipe.Toolbar.CssClasses.toolbar;
			if (this.settings.captionAndToolbarFlipPosition){
				cssClass = cssClass + ' ' + PhotoSwipe.Toolbar.CssClasses.toolbarTop;
			}
			
			
			// Toolbar
			this.toolbarEl = Util.DOM.createElement(
				'div', 
				{ 
					'class': cssClass
				},
				this.settings.getToolbar()
			);
		
			
			Util.DOM.setStyle(this.toolbarEl, {
				left: 0,
				position: 'absolute',
				overflow: 'hidden',
				zIndex: this.settings.zIndex
			});
			
			if (this.settings.target === window){
				Util.DOM.appendToBody(this.toolbarEl);
			}
			else{
				Util.DOM.appendChild(this.toolbarEl, this.settings.target);
			}
			Util.DOM.hide(this.toolbarEl);
			
			this.closeEl = Util.DOM.find('.' + PhotoSwipe.Toolbar.CssClasses.close, this.toolbarEl)[0];
			if (this.settings.preventHide && !Util.isNothing(this.closeEl)){
				Util.DOM.hide(this.closeEl);
			}
			
			this.playEl = Util.DOM.find('.' + PhotoSwipe.Toolbar.CssClasses.play, this.toolbarEl)[0];
			if (this.settings.preventSlideshow && !Util.isNothing(this.playEl)){
				Util.DOM.hide(this.playEl);
			}
			
			this.nextEl = Util.DOM.find('.' + PhotoSwipe.Toolbar.CssClasses.next, this.toolbarEl)[0];
			this.previousEl = Util.DOM.find('.' + PhotoSwipe.Toolbar.CssClasses.previous, this.toolbarEl)[0];
			
			
			// Caption
			cssClass = PhotoSwipe.Toolbar.CssClasses.caption;
			if (this.settings.captionAndToolbarFlipPosition){
				cssClass = cssClass + ' ' + PhotoSwipe.Toolbar.CssClasses.captionBottom;
			}
			
			this.captionEl = Util.DOM.createElement(
				'div', 
				{ 
					'class': cssClass
				}, 
				''
			);
			Util.DOM.setStyle(this.captionEl, {
				left: 0,
				position: 'absolute',
				overflow: 'hidden',
				zIndex: this.settings.zIndex
			});
			
			if (this.settings.target === window){
				Util.DOM.appendToBody(this.captionEl);
			}
			else{
				Util.DOM.appendChild(this.captionEl, this.settings.target);
			}
			Util.DOM.hide(this.captionEl);
			
			this.captionContentEl = Util.DOM.createElement(
				'div', 
				{
					'class': PhotoSwipe.Toolbar.CssClasses.captionContent
				}, 
				''
			);
			Util.DOM.appendChild(this.captionContentEl, this.captionEl);
			
			this.addEventHandlers();
			
		},
		
		
		
		/*
		 * Function: resetPosition
		 */
		resetPosition: function(){
		
			var width, toolbarTop, captionTop;
			
			if (this.settings.target === window){
				if (this.settings.captionAndToolbarFlipPosition){
					toolbarTop = Util.DOM.windowScrollTop();
					captionTop = (Util.DOM.windowScrollTop() + Util.DOM.windowHeight()) - Util.DOM.height(this.captionEl);
				}
				else {
					toolbarTop = (Util.DOM.windowScrollTop() + Util.DOM.windowHeight()) - Util.DOM.height(this.toolbarEl);
					captionTop = Util.DOM.windowScrollTop();
				}	
				width = Util.DOM.windowWidth();
			}
			else{
				if (this.settings.captionAndToolbarFlipPosition){
					toolbarTop = '0';
					captionTop = Util.DOM.height(this.settings.target) - Util.DOM.height(this.captionEl);
				}
				else{
					toolbarTop = Util.DOM.height(this.settings.target) - Util.DOM.height(this.toolbarEl);
					captionTop = 0;
				}
				width = Util.DOM.width(this.settings.target);
			}
			
			Util.DOM.setStyle(this.toolbarEl, {
				top: toolbarTop + 'px',
				width: width
			});
		
			Util.DOM.setStyle(this.captionEl, {
				top: captionTop + 'px',
				width: width
			});
		},
		
		
		
		/*
		 * Function: toggleVisibility
		 */
		toggleVisibility: function(index){
		
			if (this.isVisible){
				this.fadeOut();
			}
			else{
				this.show(index);
			}
		
		},
		
		
		
		/*
		 * Function: show
		 */
		show: function(index){
			
			Util.Animation.stop(this.toolbarEl);
			Util.Animation.stop(this.captionEl);
			
			this.resetPosition();
			this.setToolbarStatus(index);
			
			Util.Events.fire(this, { 
				type: PhotoSwipe.Toolbar.EventTypes.onBeforeShow, 
				target: this 
			});
			
			this.showToolbar();
			this.setCaption(index);
			this.showCaption();
			
			this.isVisible = true;
			
			this.setTimeout();
			
			Util.Events.fire(this, { 
				type: PhotoSwipe.Toolbar.EventTypes.onShow, 
				target: this 
			});
			
		},
		
		
		
		/*
		 * Function: setTimeout
		 */
		setTimeout: function(){
			
			if (this.settings.captionAndToolbarAutoHideDelay > 0){
				// Set a timeout to hide the toolbar
				this.clearTimeout();
				this.timeout = window.setTimeout(this.fadeOut.bind(this), this.settings.captionAndToolbarAutoHideDelay);
			}
		
		},
		
		
		
		/*
		 * Function: clearTimeout
		 */
		clearTimeout: function(){
			
			if (!Util.isNothing(this.timeout)){
				window.clearTimeout(this.timeout);
				this.timeout = null;
			}
			
		},
		
		
		
		/*
		 * Function: fadeOut
		 */
		fadeOut: function(){
		
			this.clearTimeout();
			
			Util.Events.fire(this, { 
				type: PhotoSwipe.Toolbar.EventTypes.onBeforeHide, 
				target: this 
			});
			
			Util.Animation.fadeOut(this.toolbarEl, this.settings.fadeOutSpeed);
			Util.Animation.fadeOut(this.captionEl, this.settings.fadeOutSpeed, this.fadeOutHandler);
			
			this.isVisible = false;
		
		},
		
		
		
		/*
		 * Function: addEventHandlers
		 */
		addEventHandlers: function(){
		
			if (Util.Browser.isTouchSupported){
				if (!Util.Browser.blackberry){
					// Had an issue with touchstart, animation and Blackberry. BB will default to click
					Util.Events.add(this.toolbarEl, 'touchstart', this.touchStartHandler);
				}
				Util.Events.add(this.toolbarEl, 'touchmove', this.touchMoveHandler);
				Util.Events.add(this.captionEl, 'touchmove', this.touchMoveHandler);
			}
			Util.Events.add(this.toolbarEl, 'click', this.clickHandler);
		
		},
		
		
		
		/*
		 * Function: removeEventHandlers
		 */
		removeEventHandlers: function(){
		
			if (Util.Browser.isTouchSupported){
				if (!Util.Browser.blackberry){
					// Had an issue with touchstart, animation and Blackberry. BB will default to click
					Util.Events.remove(this.toolbarEl, 'touchstart', this.touchStartHandler);
				}
				Util.Events.remove(this.toolbarEl, 'touchmove', this.touchMoveHandler);
				Util.Events.remove(this.captionEl, 'touchmove', this.touchMoveHandler);
			}
			Util.Events.remove(this.toolbarEl, 'click', this.clickHandler);
		
		},
		
		
		
		/*
		 * Function: handleTap
		 */
		handleTap: function(e){
			
			this.clearTimeout();
			
			var action;
			
			if (e.target === this.nextEl || Util.DOM.isChildOf(e.target, this.nextEl)){
				action = PhotoSwipe.Toolbar.ToolbarAction.next;
			}
			else if (e.target === this.previousEl || Util.DOM.isChildOf(e.target, this.previousEl)){
				action = PhotoSwipe.Toolbar.ToolbarAction.previous;
			}
			else if (e.target === this.closeEl || Util.DOM.isChildOf(e.target, this.closeEl)){
				action = PhotoSwipe.Toolbar.ToolbarAction.close;
			}
			else if (e.target === this.playEl || Util.DOM.isChildOf(e.target, this.playEl)){
				action = PhotoSwipe.Toolbar.ToolbarAction.play;
			}
			
			this.setTimeout();
			
			if (Util.isNothing(action)){
				action = PhotoSwipe.Toolbar.ToolbarAction.none;
			}
			
			Util.Events.fire(this, { 
				type: PhotoSwipe.Toolbar.EventTypes.onTap, 
				target: this, 
				action: action,
				tapTarget: e.target
			});
			
		},
		
		
		
		/*
		 * Function: setCaption
		 */ 
		setCaption: function(index){
		
			Util.DOM.removeChildren(this.captionContentEl);
			
			this.currentCaption = Util.coalesce(this.cache.images[index].caption, '\u00A0');
			
			if (Util.isObject(this.currentCaption)){
				Util.DOM.appendChild(this.currentCaption, this.captionContentEl);
			}
			else{
				if (this.currentCaption === ''){
					this.currentCaption = '\u00A0';
				}
				Util.DOM.appendText(this.currentCaption, this.captionContentEl);
			}
			
			this.currentCaption = (this.currentCaption === '\u00A0') ? '' : this.currentCaption;
			this.resetPosition();
			
		},
		
		
		
		/*
		 * Function: showToolbar
		 */
		showToolbar: function(){
		
			Util.DOM.setStyle(this.toolbarEl, {
				opacity: this.settings.captionAndToolbarOpacity
			});
			Util.DOM.show(this.toolbarEl);
			
		},
		
		
		
		/*
		 * Function: showCaption
		 */
		showCaption: function(){
			
			if (this.currentCaption === '' || this.captionContentEl.childNodes.length < 1){
				// Empty caption
				if (!this.settings.captionAndToolbarShowEmptyCaptions){
					Util.DOM.hide(this.captionEl);
					return;
				}
			}
			Util.DOM.setStyle(this.captionEl, {
				opacity: this.settings.captionAndToolbarOpacity
			});
			Util.DOM.show(this.captionEl);
		
		},
		
		
		
		/*
		 * Function: setToolbarStatus
		 */
		setToolbarStatus: function(index){
			
			if (this.settings.loop){
				return;
			}
			
			Util.DOM.removeClass(this.previousEl, PhotoSwipe.Toolbar.CssClasses.previousDisabled);
			Util.DOM.removeClass(this.nextEl, PhotoSwipe.Toolbar.CssClasses.nextDisabled);
			
			if (index > 0 && index < this.cache.images.length-1){
				return;
			}
			
			if (index === 0){
				if (!Util.isNothing(this.previousEl)){
					Util.DOM.addClass(this.previousEl, PhotoSwipe.Toolbar.CssClasses.previousDisabled);
				}
			}
			
			if (index === this.cache.images.length-1){
				if (!Util.isNothing(this.nextEl)){
					Util.DOM.addClass(this.nextEl, PhotoSwipe.Toolbar.CssClasses.nextDisabled);
				}
			}
			
		},
		
		
		
		/*
		 * Function: onFadeOut
		 */
		onFadeOut: function(){
		
			Util.DOM.hide(this.toolbarEl);
			Util.DOM.hide(this.captionEl);
			
			Util.Events.fire(this, { 
				type: PhotoSwipe.Toolbar.EventTypes.onHide, 
				target: this 
			});
			
		},
		
		
		
		/*
		 * Function: onTouchStart
		 */
		onTouchStart: function(e){
			
			e.preventDefault();
			Util.Events.remove(this.toolbarEl, 'click', this.clickHandler);
			this.handleTap(e);
			
		},
		
		
		
		/*
		 * Function: onTouchMove
		 */
		onTouchMove: function(e){
		
			e.preventDefault();
		
		},
		
		
		
		/*
		 * Function: onClick
		 */
		onClick: function(e){
			
			e.preventDefault();
			this.handleTap(e);
			
		}
		
		
	});
	
	
	
}
(
	window, 
	window.klass, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.PhotoSwipe.UILayer');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	PhotoSwipe.UILayer.CssClasses = {
		uiLayer: 'ps-uilayer'
	};
	
}
(
	window, 
	window.klass, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.PhotoSwipe.UILayer');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	
	PhotoSwipe.UILayer.UILayerClass = Util.TouchElement.TouchElementClass.extend({
		
		
		
		el: null,
		settings: null,
		
		
		
		/*
		 * Function: dispose
		 */
		dispose: function(){
		
			var prop;
			
			this.removeEventHandlers();
			
			Util.DOM.removeChild(this.el, this.el.parentNode);
			
			for (prop in this) {
				if (Util.objectHasProperty(this, prop)) {
					this[prop] = null;
				}
			}
		
		},
		
		
		
		/*
		 * Function: initialize
		 */
		initialize: function(options){
			
			this.settings = options;
			
			// Main container 
			this.el = Util.DOM.createElement(
				'div', 
				{ 
					'class': PhotoSwipe.UILayer.CssClasses.uiLayer
				}, 
				''
			);
			Util.DOM.setStyle(this.el, {
				display: 'block',
				position: 'absolute',
				left: 0,
				top: 0,
				overflow: 'hidden',
				zIndex: this.settings.zIndex,
				opacity: 0
			});
			Util.DOM.hide(this.el);
			
			if (this.settings.target === window){
				Util.DOM.appendToBody(this.el);
			}
			else{
				Util.DOM.appendChild(this.el, this.settings.target);
			}
			
			this.supr(this.el, {
				swipe: true,
				move: true,
				gesture: Util.Browser.iOS,
				doubleTap: true,
				preventDefaultTouchEvents: this.settings.preventDefaultTouchEvents
			});
			
		},
		
		
		
		/*
		 * Function: resetPosition
		 */
		resetPosition: function(){
			
			// Set the height and width to fill the document
			if (this.settings.target === window){
				Util.DOM.setStyle(this.el, {
					top: Util.DOM.windowScrollTop()  + 'px',
					width: Util.DOM.windowWidth(),
					height: Util.DOM.windowHeight()
				});	
			}
			else{
				Util.DOM.setStyle(this.el, {
					top: '0px',
					width: Util.DOM.width(this.settings.target),
					height: Util.DOM.height(this.settings.target)
				});
			}
			
		},
		
		
		
		/*
		 * Function: show
		 */
		show: function(){
			
			this.resetPosition();
			Util.DOM.show(this.el);
			this.addEventHandlers();
			
		},
		
		
		
		/*
		 * Function: addEventHandlers
		 */
		addEventHandlers: function(){
			
			this.supr();
			
		},
		
		
		
		/*
		 * Function: removeEventHandlers
		 */
		removeEventHandlers: function(){
		
			this.supr();
		
		}
		
		
	});
	
	
	
}
(
	window, 
	window.klass, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.PhotoSwipe.ZoomPanRotate');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	PhotoSwipe.ZoomPanRotate.CssClasses = {
		zoomPanRotate: 'ps-zoom-pan-rotate'
	};
	
	
	PhotoSwipe.ZoomPanRotate.EventTypes = {
	
		onTransform: 'PhotoSwipeZoomPanRotateOnTransform'
	
	};
	
}
(
	window, 
	window.klass, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util){
	
	
	Util.registerNamespace('Code.PhotoSwipe.ZoomPanRotate');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	
	PhotoSwipe.ZoomPanRotate.ZoomPanRotateClass = klass({
	
		el: null,
		settings: null,
		containerEl: null,
		imageEl: null,
		transformSettings: null,
		panStartingPoint: null,
		transformEl: null,
		
		
		
		/*
		 * Function: dispose
		 */
		dispose: function(){
		
			var prop;
			
			Util.DOM.removeChild(this.el, this.el.parentNode);
			
			for (prop in this) {
				if (Util.objectHasProperty(this, prop)) {
					this[prop] = null;
				}
			}
		
		},
		
		
		
		/*
		 * Function: initialize
		 */
		initialize: function(options, cacheImage, uiLayer){
			
			var parentEl, width, height, top;
			
			this.settings = options;
			
			if (this.settings.target === window){
				parentEl = document.body;
				width = Util.DOM.windowWidth();
				height = Util.DOM.windowHeight();
				top = Util.DOM.windowScrollTop() + 'px';
			}
			else{
				parentEl = this.settings.target;
				width = Util.DOM.width(parentEl);
				height = Util.DOM.height(parentEl);
				top = '0px';
			}
			
			this.imageEl = cacheImage.imageEl.cloneNode(false);
			Util.DOM.setStyle(this.imageEl, {
				
				zIndex: 1
				
			});
			
			this.transformSettings = {
				
				startingScale: 1.0,
				scale: 1.0,
				startingRotation: 0,
				rotation: 0,
				startingTranslateX: 0,
				startingTranslateY: 0,
				translateX: 0,
				translateY: 0
			
			};
			
			
			this.el = Util.DOM.createElement(
				'div', 
				{ 
					'class': PhotoSwipe.ZoomPanRotate.CssClasses.zoomPanRotate
				}, 
				''
			);
			Util.DOM.setStyle(this.el, {
				left: 0,
				top: top,
				position: 'absolute',
				width: width,
				height: height,
				zIndex: this.settings.zIndex,
				display: 'block'
			});
			
			Util.DOM.insertBefore(this.el, uiLayer.el, parentEl);
			
			if (Util.Browser.iOS){
				this.containerEl = Util.DOM.createElement('div','','');
				Util.DOM.setStyle(this.containerEl, {
					left: 0,
					top: 0,
					width: width,
					height: height,
					position: 'absolute',
					zIndex: 1
				});
				Util.DOM.appendChild(this.imageEl, this.containerEl);
				Util.DOM.appendChild(this.containerEl, this.el);
				Util.Animation.resetTranslate(this.containerEl);
				Util.Animation.resetTranslate(this.imageEl);
				this.transformEl = this.containerEl;
			}
			else{
				Util.DOM.appendChild(this.imageEl, this.el);
				this.transformEl = this.imageEl;
			}
			
		},
		
		
		
		/*
		 * Function: setStartingTranslateFromCurrentTransform
		 */
		setStartingTranslateFromCurrentTransform: function(){
			
			var 
				transformValue = Util.coalesce(this.transformEl.style.webkitTransform, this.transformEl.style.MozTransform, this.transformEl.style.transform),
				transformExploded;
			
			if (!Util.isNothing(transformValue)){
				
				transformExploded = transformValue.match( /translate\((.*?)\)/ );
				
				if (!Util.isNothing(transformExploded)){
				
					transformExploded = transformExploded[1].split(', ');
					this.transformSettings.startingTranslateX = window.parseInt(transformExploded[0], 10);
					this.transformSettings.startingTranslateY = window.parseInt(transformExploded[1], 10);
				
				}
			
			}
			
		},
		
		
		
		/*
		 * Function: getScale
		 */
		getScale: function(scaleValue){
			
			var scale = this.transformSettings.startingScale * scaleValue;
			
			if (this.settings.minUserZoom !== 0 && scale < this.settings.minUserZoom){
				scale = this.settings.minUserZoom;
			}
			else if (this.settings.maxUserZoom !== 0 && scale > this.settings.maxUserZoom){
				scale = this.settings.maxUserZoom;
			}
			
			return scale;
			
		},
		
		
		
		/*
		 * Function: setStartingScaleAndRotation
		 */
		setStartingScaleAndRotation: function(scaleValue, rotationValue){
			
			this.transformSettings.startingScale = this.getScale(scaleValue);
			
			this.transformSettings.startingRotation = 
				(this.transformSettings.startingRotation + rotationValue) % 360;
				
		},
		
		
		
		/*
		 * Function: zoomRotate
		 */
		zoomRotate: function(scaleValue, rotationValue){
			
			this.transformSettings.scale = this.getScale(scaleValue);
			
			this.transformSettings.rotation = 
				this.transformSettings.startingRotation + rotationValue;
			
			this.applyTransform();
			
		},
		
		
		
		/*
		 * Function: panStart
		 */
		panStart: function(point){
			
			this.setStartingTranslateFromCurrentTransform();
			
			this.panStartingPoint = {
				x: point.x,
				y: point.y
			};
			
		},
		
		
		
		/*
		 * Function: pan
		 */
		pan: function(point){ 
			
			var 
				dx = point.x - this.panStartingPoint.x,
				dy = point.y - this.panStartingPoint.y,
				dxScaleAdjust = dx / this.transformSettings.scale ,
        dyScaleAdjust = dy / this.transformSettings.scale;
			
			this.transformSettings.translateX = 
				this.transformSettings.startingTranslateX + dxScaleAdjust;

			this.transformSettings.translateY = 
				this.transformSettings.startingTranslateY + dyScaleAdjust;

			this.applyTransform();
			
		},
		
		
		
		/*
		 * Function: zoomAndPanToPoint
		 */
		zoomAndPanToPoint: function(scaleValue, point){
			
			
			if (this.settings.target === window){
				
				this.panStart({
					x: Util.DOM.windowWidth() / 2,
					y: Util.DOM.windowHeight() / 2
				});
				
				var 
					dx = point.x - this.panStartingPoint.x,
					dy = point.y - this.panStartingPoint.y,
					dxScaleAdjust = dx / this.transformSettings.scale,
					dyScaleAdjust = dy / this.transformSettings.scale;
					
				this.transformSettings.translateX = 
					(this.transformSettings.startingTranslateX + dxScaleAdjust) * -1;
				
				this.transformSettings.translateY = 
					(this.transformSettings.startingTranslateY + dyScaleAdjust) * -1;
					
			}
			
			
			this.setStartingScaleAndRotation(scaleValue, 0);
			this.transformSettings.scale = this.transformSettings.startingScale;
			
			this.transformSettings.rotation = 0;
			
			this.applyTransform();
			
		},
		
		
		
		/*
		 * Function: applyTransform
		 */
		applyTransform: function(){
			
			var 
				rotationDegs = this.transformSettings.rotation % 360,
				translateX = window.parseInt(this.transformSettings.translateX, 10),
				translateY = window.parseInt(this.transformSettings.translateY, 10),
				transform = 'scale(' + this.transformSettings.scale + ') rotate(' + rotationDegs + 'deg) translate(' + translateX + 'px, ' + translateY + 'px)';
			
			Util.DOM.setStyle(this.transformEl, {
				webkitTransform: transform,
				MozTransform: transform,
				msTransform: transform,
				transform: transform
			});
			
			Util.Events.fire(this, {
				target: this,
				type: PhotoSwipe.ZoomPanRotate.EventTypes.onTransform,
				scale: this.transformSettings.scale,
				rotation: this.transformSettings.rotation,
				rotationDegs: rotationDegs,
				translateX: translateX,
				translateY: translateY
			});
			
		}
	
	});
	
	
	
}
(
	window, 
	window.klass, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, Util){
	
	
	Util.registerNamespace('Code.PhotoSwipe');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	
	
	PhotoSwipe.CssClasses = {
		buildingBody: 'ps-building',
		activeBody: 'ps-active'
	};
	
	
	
	PhotoSwipe.EventTypes = {
	
		onBeforeShow: 'PhotoSwipeOnBeforeShow',
		onShow: 'PhotoSwipeOnShow',
		onBeforeHide: 'PhotoSwipeOnBeforeHide',
		onHide: 'PhotoSwipeOnHide',
		onDisplayImage: 'PhotoSwipeOnDisplayImage',
		onResetPosition: 'PhotoSwipeOnResetPosition',
		onSlideshowStart: 'PhotoSwipeOnSlideshowStart',
		onSlideshowStop: 'PhotoSwipeOnSlideshowStop',
		onTouch: 'PhotoSwipeOnTouch',
		onBeforeCaptionAndToolbarShow: 'PhotoSwipeOnBeforeCaptionAndToolbarShow',
		onCaptionAndToolbarShow: 'PhotoSwipeOnCaptionAndToolbarShow',
		onBeforeCaptionAndToolbarHide: 'PhotoSwipeOnBeforeCaptionAndToolbarHide',
		onCaptionAndToolbarHide: 'PhotoSwipeOnCaptionAndToolbarHide',
		onToolbarTap: 'PhotoSwipeOnToolbarTap',
		onBeforeZoomPanRotateShow: 'PhotoSwipeOnBeforeZoomPanRotateShow',
		onZoomPanRotateShow: 'PhotoSwipeOnZoomPanRotateShow',
		onBeforeZoomPanRotateHide: 'PhotoSwipeOnBeforeZoomPanRotateHide',
		onZoomPanRotateHide: 'PhotoSwipeOnZoomPanRotateHide',
		onZoomPanRotateTransform: 'PhotoSwipeOnZoomPanRotateTransform'
	
	};
	
	
	
	PhotoSwipe.instances = [];
	PhotoSwipe.activeInstances = [];
	
	
	
	/*
	 * Function: Code.PhotoSwipe.setActivateInstance
	 */
	PhotoSwipe.setActivateInstance = function(instance){
		
		// Can only have one instance per target (i.e. window or div)
		var index = Util.arrayIndexOf(instance.settings.target, PhotoSwipe.activeInstances, 'target');
		if (index > -1){
			throw 'Code.PhotoSwipe.activateInstance: Unable to active instance as another instance is already active for this target';
		}
		PhotoSwipe.activeInstances.push({
			target: instance.settings.target,
			instance: instance
		});
			
	};
	
	
	
	/*
	 * Function: Code.PhotoSwipe.unsetActivateInstance
	 */
	PhotoSwipe.unsetActivateInstance = function(instance){
		
		var index = Util.arrayIndexOf(instance, PhotoSwipe.activeInstances, 'instance');
		PhotoSwipe.activeInstances.splice(index, 1);
		
	};
	
	
	
	/*
	 * Function: Code.PhotoSwipe.attach
	 */
	PhotoSwipe.attach = function(images, options, id){
		
		var i, j, instance, image;
		
		instance = PhotoSwipe.createInstance(images, options, id);
		
		// Add click event handlers if applicable
		for (i=0, j=images.length; i<j; i++){
			
			image = images[i];
			if (!Util.isNothing(image.nodeType)){
				if (image.nodeType === 1){
					// DOM element
					image.__photoSwipeClickHandler = PhotoSwipe.onTriggerElementClick.bind(instance);
					Util.Events.remove(image, 'click', image.__photoSwipeClickHandler);
					Util.Events.add(image, 'click', image.__photoSwipeClickHandler);
				}
			}
			
		}
		
		return instance;
		
	};
	
	
	
	/*
	 * jQuery plugin
	 */
	if (window.jQuery){
		
		window.jQuery.fn.photoSwipe = function(options, id){
		
			return PhotoSwipe.attach(this, options, id);
			
		};
		
		
	}
	
	
	
	/*
	 * Function: Code.PhotoSwipe.detatch
	 */
	PhotoSwipe.detatch = function(instance){
	
		var i, j, image;
		
		// Remove click event handlers if applicable
		for (i=0, j=instance.originalImages.length; i<j; i++){
			
			image = instance.originalImages[i];
			if (!Util.isNothing(image.nodeType)){
				if (image.nodeType === 1){
					// DOM element
					Util.Events.remove(image, 'click', image.__photoSwipeClickHandler);
					delete image.__photoSwipeClickHandler;
				}
			}
			
		}
		
		PhotoSwipe.disposeInstance(instance);
	
	};
	
	
	
	/*
	 * Function: Code.PhotoSwipe.createInstance
	 */
	PhotoSwipe.createInstance = function(images, options, id){
		
		var i, instance, image;
		
		if (Util.isNothing(images)){
			throw 'Code.PhotoSwipe.attach: No images passed.';
		}
		
		if (!Util.isLikeArray(images)){
			throw 'Code.PhotoSwipe.createInstance: Images must be an array of elements or image urls.';
		}
		
		if (images.length < 1){
			throw 'Code.PhotoSwipe.createInstance: No images to passed.';
		}
		
		options = Util.coalesce(options, { });
		
		instance = PhotoSwipe.getInstance(id);
		
		if (Util.isNothing(instance)){
			instance = new PhotoSwipe.PhotoSwipeClass(images, options, id);
			PhotoSwipe.instances.push(instance);
		}
		else{
			throw 'Code.PhotoSwipe.createInstance: Instance with id "' + id +' already exists."';
		}
		
		return instance;
	
	};
	
	
	
	/*
	 * Function: Code.PhotoSwipe.disposeInstance
	 */
	PhotoSwipe.disposeInstance = function(instance){
		
		var instanceIndex = PhotoSwipe.getInstanceIndex(instance);
		
		if (instanceIndex < 0){
			throw 'Code.PhotoSwipe.disposeInstance: Unable to find instance to dispose.';
		}
		
		instance.dispose();
		PhotoSwipe.instances.splice(instanceIndex, 1);
		instance = null;
	
	};
	
	
	
	/*
	 * Function: onTriggerElementClick
	 */
	PhotoSwipe.onTriggerElementClick = function(e){
	
		e.preventDefault();
		
		var instance = this;
		instance.show(e.currentTarget);
	
	};
	
	
	
	/*
	 * Function: Code.PhotoSwipe.getInstance
	 */
	PhotoSwipe.getInstance = function(id){
		
		var i, j, instance;
		
		for (i=0, j=PhotoSwipe.instances.length; i<j; i++){
			
			instance = PhotoSwipe.instances[i];
			if (instance.id === id){
				return instance;
			}
			
		}
		
		return null;
		
	};
	
	
	
	/*
	 * Function: Code.PhotoSwipe.getInstanceIndex
	 */
	PhotoSwipe.getInstanceIndex = function(instance){
		
		var i, j, instanceIndex = -1;
		
		for (i=0, j=PhotoSwipe.instances.length; i<j; i++){
		
			if (PhotoSwipe.instances[i] === instance){
				instanceIndex = i;
				break;
			}
		
		}
		
		return instanceIndex;
		
	};
	
	
	
}
(
	window, 
	window.Code.Util
));// Copyright (c) 2012 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license
// version: 3.0.5

(function(window, klass, Util, Cache, DocumentOverlay, Carousel, Toolbar, UILayer, ZoomPanRotate){
	
	
	Util.registerNamespace('Code.PhotoSwipe');
	var PhotoSwipe = window.Code.PhotoSwipe;
	
	
	PhotoSwipe.PhotoSwipeClass = klass({
		
		
		
		id: null,
		settings: null,
		isBackEventSupported: null,
		backButtonClicked: null,
		currentIndex: null,
		originalImages: null,
		mouseWheelStartTime: null,
		windowDimensions: null,
		
		
		
		// Components
		cache: null,
		documentOverlay: null,
		carousel: null,
		uiLayer: null,
		toolbar: null,
		zoomPanRotate: null,
		
		
		
		// Handlers
		windowOrientationChangeHandler: null,
		windowScrollHandler: null,
		windowHashChangeHandler: null,
		keyDownHandler: null,
		windowOrientationEventName: null,
		uiLayerTouchHandler: null,
		carouselSlideByEndHandler: null,
		carouselSlideshowStartHandler: null,
		carouselSlideshowStopHandler: null,
		toolbarTapHandler: null,
		toolbarBeforeShowHandler: null,
		toolbarShowHandler: null,
		toolbarBeforeHideHandler: null,
		toolbarHideHandler: null,
		mouseWheelHandler: null,
		zoomPanRotateTransformHandler: null,
		
		
		_isResettingPosition: null,
		_uiWebViewResetPositionTimeout: null,
				
		
		/*
		 * Function: dispose
		 */
		dispose: function(){
		
			var prop;
			
			Util.Events.remove(this, PhotoSwipe.EventTypes.onBeforeShow);
			Util.Events.remove(this, PhotoSwipe.EventTypes.onShow);
			Util.Events.remove(this, PhotoSwipe.EventTypes.onBeforeHide);
			Util.Events.remove(this, PhotoSwipe.EventTypes.onHide);
			Util.Events.remove(this, PhotoSwipe.EventTypes.onDisplayImage);
			Util.Events.remove(this, PhotoSwipe.EventTypes.onResetPosition);
			Util.Events.remove(this, PhotoSwipe.EventTypes.onSlideshowStart);
			Util.Events.remove(this, PhotoSwipe.EventTypes.onSlideshowStop);
			Util.Events.remove(this, PhotoSwipe.EventTypes.onTouch);
			Util.Events.remove(this, PhotoSwipe.EventTypes.onBeforeCaptionAndToolbarShow);
			Util.Events.remove(this, PhotoSwipe.EventTypes.onCaptionAndToolbarShow);
			Util.Events.remove(this, PhotoSwipe.EventTypes.onBeforeCaptionAndToolbarHide);
			Util.Events.remove(this, PhotoSwipe.EventTypes.onCaptionAndToolbarHide);
			Util.Events.remove(this, PhotoSwipe.EventTypes.onZoomPanRotateTransform);
			
			
			this.removeEventHandlers();
			
			if (!Util.isNothing(this.documentOverlay)){
				this.documentOverlay.dispose();
			}
			
			if (!Util.isNothing(this.carousel)){
				this.carousel.dispose();
			}
			
			if (!Util.isNothing(this.uiLayer)){
				this.uiLayer.dispose();
			}
			
			if (!Util.isNothing(this.toolbar)){
				this.toolbar.dispose();
			}
			
			this.destroyZoomPanRotate();
			
			if (!Util.isNothing(this.cache)){
				this.cache.dispose();
			}
			
			for (prop in this) {
				if (Util.objectHasProperty(this, prop)) {
					this[prop] = null;
				}
			}
		
		},
		
		
		
		/*
		 * Function: initialize
		 */
		initialize: function(images, options, id){
			
			var targetPosition;
			
			if (Util.isNothing(id)){
				this.id = 'PhotoSwipe' + new Date().getTime().toString();
			}
			else{
				this.id = id;
			}
			
			this.originalImages = images;
			
			if (Util.Browser.android && !Util.Browser.firefox){
				if (window.navigator.userAgent.match(/Android (\d+.\d+)/).toString().replace(/^.*\,/, '') >= 2.1){
					this.isBackEventSupported = true;
				}
			}
			
			if (!this.isBackEventSupported){
				this.isBackEventSupported = Util.objectHasProperty(window, 'onhashchange');
			}
			
			this.settings = {
				
				// General
				fadeInSpeed: 250,
				fadeOutSpeed: 250,
				preventHide: false,
				preventSlideshow: false,
				zIndex: 1000,
				backButtonHideEnabled: true,
				enableKeyboard: true,
				enableMouseWheel: true,
				mouseWheelSpeed: 350,
				autoStartSlideshow: false,
				jQueryMobile: ( !Util.isNothing(window.jQuery) && !Util.isNothing(window.jQuery.mobile) ),
				jQueryMobileDialogHash: '&ui-state=dialog',
				enableUIWebViewRepositionTimeout: false,
				uiWebViewResetPositionDelay: 500,
				target: window,
				preventDefaultTouchEvents: true,
				
				
				// Carousel
				loop: true,
				slideSpeed: 250,
				nextPreviousSlideSpeed: 0,
				enableDrag: true,
				swipeThreshold: 50,
				swipeTimeThreshold: 250,
				slideTimingFunction: 'ease-out',
				slideshowDelay: 3000,
				doubleTapSpeed: 250,
				margin: 20,
				imageScaleMethod: 'fit', // Either "fit", "fitNoUpscale" or "zoom",
				
				
				// Toolbar
				captionAndToolbarHide: false,
				captionAndToolbarFlipPosition: false,
				captionAndToolbarAutoHideDelay: 5000,
				captionAndToolbarOpacity: 0.8,
				captionAndToolbarShowEmptyCaptions: true,
				getToolbar: PhotoSwipe.Toolbar.getToolbar,
				
				
				// ZoomPanRotate
				allowUserZoom: true, 
				allowRotationOnUserZoom: false,
				maxUserZoom: 5.0,
				minUserZoom: 0.5,
				doubleTapZoomLevel: 2.5,
				
				
				// Cache
				getImageSource: PhotoSwipe.Cache.Functions.getImageSource,
				getImageCaption: PhotoSwipe.Cache.Functions.getImageCaption,
				getImageMetaData: PhotoSwipe.Cache.Functions.getImageMetaData,
				cacheMode: PhotoSwipe.Cache.Mode.normal
				
			};
			
			Util.extend(this.settings, options);
			
			if (this.settings.target !== window){
				targetPosition = Util.DOM.getStyle(this.settings.target, 'position');
				if (targetPosition !== 'relative' || targetPosition !== 'absolute'){
					Util.DOM.setStyle(this.settings.target, 'position', 'relative');
				}
			}
			
			if (this.settings.target !== window){
				this.isBackEventSupported = false;
				this.settings.backButtonHideEnabled = false;
			}
			else{
				if (this.settings.preventHide){
					this.settings.backButtonHideEnabled = false;
				}
			}
			
			this.cache = new Cache.CacheClass(images, this.settings);
			
		},
		
		
		
		/*
		 * Function: show
		 */
		show: function(obj){
			
			var i, j;
			
			this._isResettingPosition = false;
			this.backButtonClicked = false;
			
			// Work out what the starting index is
			if (Util.isNumber(obj)){
				this.currentIndex = obj;
			}
			else{
				
				this.currentIndex = -1;
				for (i=0, j=this.originalImages.length; i<j; i++){
					if (this.originalImages[i] === obj){
						this.currentIndex = i;
						break;
					}
				}
				
			}
			
			if (this.currentIndex < 0 || this.currentIndex > this.originalImages.length-1){
				throw "Code.PhotoSwipe.PhotoSwipeClass.show: Starting index out of range";
			}
			
			// Store a reference to the current window dimensions
			// Use this later to double check that a window has actually
			// been resized.
			this.isAlreadyGettingPage = this.getWindowDimensions();
			
			// Set this instance to be the active instance
			PhotoSwipe.setActivateInstance(this);
			
			this.windowDimensions = this.getWindowDimensions();
			
			// Create components
			if (this.settings.target === window){
				Util.DOM.addClass(window.document.body, PhotoSwipe.CssClasses.buildingBody);
			}
			else{
				Util.DOM.addClass(this.settings.target, PhotoSwipe.CssClasses.buildingBody);
			}
			this.createComponents();
			
			Util.Events.fire(this, {
				type: PhotoSwipe.EventTypes.onBeforeShow,
				target: this
			});
			
			// Fade in the document overlay
			this.documentOverlay.fadeIn(this.settings.fadeInSpeed, this.onDocumentOverlayFadeIn.bind(this));
			
		},
		
		
		
		/*
		 * Function: getWindowDimensions
		 */
		getWindowDimensions: function(){
		
			return {
				width: Util.DOM.windowWidth(),
				height: Util.DOM.windowHeight()
			};
		
		},
		
		
		
		/*
		 * Function: createComponents
		 */
		createComponents: function(){
		
			this.documentOverlay = new DocumentOverlay.DocumentOverlayClass(this.settings);
			this.carousel = new Carousel.CarouselClass(this.cache, this.settings);
			this.uiLayer = new UILayer.UILayerClass(this.settings);
			if (!this.settings.captionAndToolbarHide){
				this.toolbar = new Toolbar.ToolbarClass(this.cache, this.settings);
			}
			
		},
		
		
		
		/*
		 * Function: resetPosition
		 */
		resetPosition: function(){
			
			if (this._isResettingPosition){
				return;
			}
			
			var newWindowDimensions = this.getWindowDimensions();
			if (!Util.isNothing(this.windowDimensions)){
				if (newWindowDimensions.width === this.windowDimensions.width && newWindowDimensions.height === this.windowDimensions.height){
					// This was added as a fudge for iOS
					return;
				}
			}
			
			this._isResettingPosition = true;
			
			this.windowDimensions = newWindowDimensions;
			
			this.destroyZoomPanRotate();
			
			this.documentOverlay.resetPosition();
			this.carousel.resetPosition();
			
			if (!Util.isNothing(this.toolbar)){
				this.toolbar.resetPosition();
			}
			
			this.uiLayer.resetPosition();
			
			this._isResettingPosition = false;
			
			Util.Events.fire(this, {
				type: PhotoSwipe.EventTypes.onResetPosition,
				target: this
			});
			
		},
		
		
		
		/*
		 * Function: addEventHandler
		 */
		addEventHandler: function(type, handler){
			
			Util.Events.add(this, type, handler);
		
		},
		
		
		
		/*
		 * Function: addEventHandlers
		 */
		addEventHandlers: function(){
			
			if (Util.isNothing(this.windowOrientationChangeHandler)){
			
				this.windowOrientationChangeHandler = this.onWindowOrientationChange.bind(this);
				this.windowScrollHandler = this.onWindowScroll.bind(this);
				this.keyDownHandler = this.onKeyDown.bind(this);
				this.windowHashChangeHandler = this.onWindowHashChange.bind(this);
				this.uiLayerTouchHandler = this.onUILayerTouch.bind(this);
				this.carouselSlideByEndHandler = this.onCarouselSlideByEnd.bind(this);
				this.carouselSlideshowStartHandler = this.onCarouselSlideshowStart.bind(this);
				this.carouselSlideshowStopHandler = this.onCarouselSlideshowStop.bind(this);
				this.toolbarTapHandler = this.onToolbarTap.bind(this);
				this.toolbarBeforeShowHandler = this.onToolbarBeforeShow.bind(this);
				this.toolbarShowHandler = this.onToolbarShow.bind(this);
				this.toolbarBeforeHideHandler = this.onToolbarBeforeHide.bind(this);
				this.toolbarHideHandler = this.onToolbarHide.bind(this);
				this.mouseWheelHandler = this.onMouseWheel.bind(this);
				this.zoomPanRotateTransformHandler = this.onZoomPanRotateTransform.bind(this);
				
			}
			
			// Set window handlers
			if (Util.Browser.android){
				// For some reason, resize was more stable than orientationchange in Android
				this.orientationEventName = 'resize';
			}
			else if (Util.Browser.iOS && (!Util.Browser.safari)){
				Util.Events.add(window.document.body, 'orientationchange', this.windowOrientationChangeHandler);
			}
			else{
				var supportsOrientationChange = !Util.isNothing(window.onorientationchange);
				this.orientationEventName = supportsOrientationChange ? 'orientationchange' : 'resize';
			}
			
			if (!Util.isNothing(this.orientationEventName)){
				Util.Events.add(window, this.orientationEventName, this.windowOrientationChangeHandler);
			}
			if (this.settings.target === window){
				Util.Events.add(window, 'scroll', this.windowScrollHandler);
			}
			
			if (this.settings.enableKeyboard){
				Util.Events.add(window.document, 'keydown', this.keyDownHandler);
			}
			
			
			if (this.isBackEventSupported && this.settings.backButtonHideEnabled){
					
				this.windowHashChangeHandler = this.onWindowHashChange.bind(this);
				
				if (this.settings.jQueryMobile){
					window.location.hash = this.settings.jQueryMobileDialogHash;
				}
				else{
					this.currentHistoryHashValue = 'PhotoSwipe' + new Date().getTime().toString();
					window.location.hash = this.currentHistoryHashValue;
				}
								
				Util.Events.add(window, 'hashchange', this.windowHashChangeHandler);
			
			}
			
			if (this.settings.enableMouseWheel){
				Util.Events.add(window, 'mousewheel', this.mouseWheelHandler);
			}
			
			Util.Events.add(this.uiLayer, Util.TouchElement.EventTypes.onTouch, this.uiLayerTouchHandler);
			Util.Events.add(this.carousel, Carousel.EventTypes.onSlideByEnd, this.carouselSlideByEndHandler);
			Util.Events.add(this.carousel, Carousel.EventTypes.onSlideshowStart, this.carouselSlideshowStartHandler);
			Util.Events.add(this.carousel, Carousel.EventTypes.onSlideshowStop, this.carouselSlideshowStopHandler);
			
			if (!Util.isNothing(this.toolbar)){
				Util.Events.add(this.toolbar, Toolbar.EventTypes.onTap, this.toolbarTapHandler);
				Util.Events.add(this.toolbar, Toolbar.EventTypes.onBeforeShow, this.toolbarBeforeShowHandler);
				Util.Events.add(this.toolbar, Toolbar.EventTypes.onShow, this.toolbarShowHandler);
				Util.Events.add(this.toolbar, Toolbar.EventTypes.onBeforeHide, this.toolbarBeforeHideHandler);
				Util.Events.add(this.toolbar, Toolbar.EventTypes.onHide, this.toolbarHideHandler);
			}
		
		},
		
		
		
		/*
		 * Function: removeEventHandlers
		 */
		removeEventHandlers: function(){
			
			if (Util.Browser.iOS && (!Util.Browser.safari)){
				Util.Events.remove(window.document.body, 'orientationchange', this.windowOrientationChangeHandler);
			}
			
			if (!Util.isNothing(this.orientationEventName)){
				Util.Events.remove(window, this.orientationEventName, this.windowOrientationChangeHandler);
			}
			
			Util.Events.remove(window, 'scroll', this.windowScrollHandler);
			
			if (this.settings.enableKeyboard){
				Util.Events.remove(window.document, 'keydown', this.keyDownHandler);
			}
			
			if (this.isBackEventSupported && this.settings.backButtonHideEnabled){
				Util.Events.remove(window, 'hashchange', this.windowHashChangeHandler);
			}
			
			if (this.settings.enableMouseWheel){
				Util.Events.remove(window, 'mousewheel', this.mouseWheelHandler);
			}
			
			if (!Util.isNothing(this.uiLayer)){
				Util.Events.remove(this.uiLayer, Util.TouchElement.EventTypes.onTouch, this.uiLayerTouchHandler);
			}
			
			if (!Util.isNothing(this.toolbar)){
				Util.Events.remove(this.carousel, Carousel.EventTypes.onSlideByEnd, this.carouselSlideByEndHandler);
				Util.Events.remove(this.carousel, Carousel.EventTypes.onSlideshowStart, this.carouselSlideshowStartHandler);
				Util.Events.remove(this.carousel, Carousel.EventTypes.onSlideshowStop, this.carouselSlideshowStopHandler);
			}
			
			if (!Util.isNothing(this.toolbar)){
				Util.Events.remove(this.toolbar, Toolbar.EventTypes.onTap, this.toolbarTapHandler);
				Util.Events.remove(this.toolbar, Toolbar.EventTypes.onBeforeShow, this.toolbarBeforeShowHandler);
				Util.Events.remove(this.toolbar, Toolbar.EventTypes.onShow, this.toolbarShowHandler);
				Util.Events.remove(this.toolbar, Toolbar.EventTypes.onBeforeHide, this.toolbarBeforeHideHandler);
				Util.Events.remove(this.toolbar, Toolbar.EventTypes.onHide, this.toolbarHideHandler);
			}
			
		},
		
		
		
		
		/*
		 * Function: hide
		 */
		hide: function(){
			
			if (this.settings.preventHide){
				return;
			}
			
			if (Util.isNothing(this.documentOverlay)){
				throw "Code.PhotoSwipe.PhotoSwipeClass.hide: PhotoSwipe instance is already hidden";
			}
			
			if (!Util.isNothing(this.hiding)){
				return;
			}
			
			this.clearUIWebViewResetPositionTimeout();
			
			this.destroyZoomPanRotate();
			
			this.removeEventHandlers();
			
			Util.Events.fire(this, {
				type: PhotoSwipe.EventTypes.onBeforeHide,
				target: this
			});
			
			this.uiLayer.dispose();
			this.uiLayer = null;
			
			if (!Util.isNothing(this.toolbar)){
				this.toolbar.dispose();
				this.toolbar = null;
			}
			
			this.carousel.dispose();
			this.carousel = null;
			
			Util.DOM.removeClass(window.document.body, PhotoSwipe.CssClasses.activeBody);
			
			this.documentOverlay.dispose();
			this.documentOverlay = null;
			
			this._isResettingPosition = false;
			
			// Deactive this instance
			PhotoSwipe.unsetActivateInstance(this);
		
			Util.Events.fire(this, {
				type: PhotoSwipe.EventTypes.onHide,
				target: this
			});
			
			this.goBackInHistory();
			
		},
		
		
		
		/*
		 * Function: goBackInHistory
		 */
		goBackInHistory: function(){
			
			if (this.isBackEventSupported && this.settings.backButtonHideEnabled){
				if ( !this.backButtonClicked ){
					window.history.back();
				}
			}
			
		},
		
		
		
		/*
		 * Function: play
		 */
		play: function(){
			
			if (this.isZoomActive()){
				return;
			}
			
			if (!this.settings.preventSlideshow){
				if (!Util.isNothing(this.carousel)){
					if (!Util.isNothing(this.toolbar) && this.toolbar.isVisible){
						this.toolbar.fadeOut();
					}
					this.carousel.startSlideshow();
				}
			}
			
		},
		
		
		
		/*
		 * Function: stop
		 */
		stop: function(){
			
			if (this.isZoomActive()){
				return;
			}
			
			if (!Util.isNothing(this.carousel)){
				this.carousel.stopSlideshow();
			}
		
		},
		
		
		
		/*
		 * Function: previous
		 */
		previous: function(){
			
			if (this.isZoomActive()){
				return;
			}
			
			if (!Util.isNothing(this.carousel)){
				this.carousel.previous();
			}
		
		},
		
		
		
		/*
		 * Function: next
		 */
		next: function(){
			
			if (this.isZoomActive()){
				return;
			}
			
			if (!Util.isNothing(this.carousel)){
				this.carousel.next();
			}
			
		},
		
		
		
		/*
		 * Function: toggleToolbar
		 */
		toggleToolbar: function(){
			
			if (this.isZoomActive()){
				return;
			}
			
			if (!Util.isNothing(this.toolbar)){
				this.toolbar.toggleVisibility(this.currentIndex);
			}
			
		},
		
		
		
		/*
		 * Function: fadeOutToolbarIfVisible
		 */
		fadeOutToolbarIfVisible: function(){
		
			if (!Util.isNothing(this.toolbar) && this.toolbar.isVisible && this.settings.captionAndToolbarAutoHideDelay > 0){
				this.toolbar.fadeOut();
			}
		
		},
		
		
		
		/*
		 * Function: createZoomPanRotate
		 */
		createZoomPanRotate: function(){
			
			this.stop();
			
			if (this.canUserZoom() && !this.isZoomActive()){
				
				Util.Events.fire(this, PhotoSwipe.EventTypes.onBeforeZoomPanRotateShow);
				
				this.zoomPanRotate = new ZoomPanRotate.ZoomPanRotateClass(
					this.settings, 
					this.cache.images[this.currentIndex],
					this.uiLayer
				);
				
				// If we don't override this in the event of false
				// you will be unable to pan around a zoomed image effectively
				this.uiLayer.captureSettings.preventDefaultTouchEvents = true;
				
				Util.Events.add(this.zoomPanRotate, PhotoSwipe.ZoomPanRotate.EventTypes.onTransform, this.zoomPanRotateTransformHandler);
				
				Util.Events.fire(this, PhotoSwipe.EventTypes.onZoomPanRotateShow);
				
				if (!Util.isNothing(this.toolbar) && this.toolbar.isVisible){
					this.toolbar.fadeOut();
				}
				
			}
		
		},
		
		
		
		/*
		 * Function: destroyZoomPanRotate
		 */
		destroyZoomPanRotate: function(){
			
			if (!Util.isNothing(this.zoomPanRotate)){
				
				Util.Events.fire(this, PhotoSwipe.EventTypes.onBeforeZoomPanRotateHide);
			
				Util.Events.remove(this.zoomPanRotate, PhotoSwipe.ZoomPanRotate.EventTypes.onTransform, this.zoomPanRotateTransformHandler);
				this.zoomPanRotate.dispose();
				this.zoomPanRotate = null;
				
				// Set the preventDefaultTouchEvents back to it was
				this.uiLayer.captureSettings.preventDefaultTouchEvents = this.settings.preventDefaultTouchEvents;
				
				Util.Events.fire(this, PhotoSwipe.EventTypes.onZoomPanRotateHide);
				
			}
		
		},
		
		
		
		/*
		 * Function: canUserZoom
		 */
		canUserZoom: function(){
			
			var testEl, cacheImage;
			
			if (Util.Browser.msie){
				testEl = document.createElement('div');
				if (Util.isNothing(testEl.style.msTransform)){
					return false;
				}
			}
			else if (!Util.Browser.isCSSTransformSupported){
				return false;
			}
			
			if (!this.settings.allowUserZoom){
				return false;
			}
			
			
			if (this.carousel.isSliding){
				return false;
			}
			
			cacheImage = this.cache.images[this.currentIndex];
			
			if (Util.isNothing(cacheImage)){
				return false;
			}
			
			if (cacheImage.isLoading){
				return false;
			}
			
			return true;
			
		},
		
		
		
		/*
		 * Function: isZoomActive
		 */
		isZoomActive: function(){
		
			return (!Util.isNothing(this.zoomPanRotate));
		
		},
		
		
		
		/*
		 * Function: getCurrentImage
		 */
		getCurrentImage: function(){
		
			return this.cache.images[this.currentIndex];
		
		},
		
		
		
		/*
		 * Function: onDocumentOverlayFadeIn
		 */
		onDocumentOverlayFadeIn: function(e){
			
			window.setTimeout(function(){
				
				var el = (this.settings.target === window) ? window.document.body : this.settings.target;
				
				Util.DOM.removeClass(el, PhotoSwipe.CssClasses.buildingBody);
				Util.DOM.addClass(el, PhotoSwipe.CssClasses.activeBody);
				
				this.addEventHandlers();
				
				this.carousel.show(this.currentIndex);
				
				this.uiLayer.show();
				
				if (this.settings.autoStartSlideshow){
					this.play();
				}
				else if (!Util.isNothing(this.toolbar)){
					this.toolbar.show(this.currentIndex);
				}
				
				Util.Events.fire(this, {
					type: PhotoSwipe.EventTypes.onShow,
					target: this
				});
			
				this.setUIWebViewResetPositionTimeout();
				
			}.bind(this), 250);
			
			
		},
		
		
		
		/*
		 * Function: setUIWebViewResetPositionTimeout
		 */
		setUIWebViewResetPositionTimeout: function(){
			
			if (!this.settings.enableUIWebViewRepositionTimeout){
				return;
			}
			
			if (!(Util.Browser.iOS && (!Util.Browser.safari))){
				return;
			}
			
			if (!Util.isNothing(this._uiWebViewResetPositionTimeout)){
				window.clearTimeout(this._uiWebViewResetPositionTimeout);
			}
			this._uiWebViewResetPositionTimeout = window.setTimeout(function(){
				
				this.resetPosition();
				
				this.setUIWebViewResetPositionTimeout();
				
			}.bind(this), this.settings.uiWebViewResetPositionDelay);
			
		},
		
		
		
		/*
		 * Function: clearUIWebViewResetPositionTimeout
		 */
		clearUIWebViewResetPositionTimeout: function(){
			if (!Util.isNothing(this._uiWebViewResetPositionTimeout)){
				window.clearTimeout(this._uiWebViewResetPositionTimeout);
			}
		},
		
		
		
		/*
		 * Function: onWindowScroll
		 */
		onWindowScroll: function(e){
			
			this.resetPosition();
		
		},
		
		
		
		/*
		 * Function: onWindowOrientationChange
		 */
		onWindowOrientationChange: function(e){
			
			this.resetPosition();
			
		},
		
		
		
		/*
		 * Function: onWindowHashChange
		 */
		onWindowHashChange: function(e){
			
			var compareHash = '#' + 
				((this.settings.jQueryMobile) ? this.settings.jQueryMobileDialogHash : this.currentHistoryHashValue);
			
			if (window.location.hash !== compareHash){
				this.backButtonClicked = true;
				this.hide();
			}
		
		},
		
		
		
		/*
		 * Function: onKeyDown
		 */
		onKeyDown: function(e){
			
			if (e.keyCode === 37) { // Left
				e.preventDefault();
				this.previous();
			}
			else if (e.keyCode === 39) { // Right
				e.preventDefault();
				this.next();
			}
			else if (e.keyCode === 38 || e.keyCode === 40) { // Up and down
				e.preventDefault();
			}
			else if (e.keyCode === 27) { // Escape
				e.preventDefault();
				this.hide();
			}
			else if (e.keyCode === 32) { // Spacebar
				if (!this.settings.hideToolbar){
					this.toggleToolbar();
				}
				else{
					this.hide();
				}
				e.preventDefault();
			}
			else if (e.keyCode === 13) { // Enter
				e.preventDefault();
				this.play();
			}
			
		},
		
		
		
		/*
		 * Function: onUILayerTouch
		 */
		onUILayerTouch: function(e){
			
			if (this.isZoomActive()){
				
				switch (e.action){
					
					case Util.TouchElement.ActionTypes.gestureChange:
						this.zoomPanRotate.zoomRotate(e.scale, (this.settings.allowRotationOnUserZoom) ? e.rotation : 0);
						break;
					
					case Util.TouchElement.ActionTypes.gestureEnd:
						this.zoomPanRotate.setStartingScaleAndRotation(e.scale, (this.settings.allowRotationOnUserZoom) ? e.rotation : 0);
						break;
						
					case Util.TouchElement.ActionTypes.touchStart:
						this.zoomPanRotate.panStart(e.point);
						break;
					
					case Util.TouchElement.ActionTypes.touchMove:
						this.zoomPanRotate.pan(e.point);
						break;
						
					case Util.TouchElement.ActionTypes.doubleTap:
						this.destroyZoomPanRotate();
						this.toggleToolbar();
						break;
					
					case Util.TouchElement.ActionTypes.swipeLeft:
						this.destroyZoomPanRotate();
						this.next();
						this.toggleToolbar();
						break;
						
					case Util.TouchElement.ActionTypes.swipeRight:
						this.destroyZoomPanRotate();
						this.previous();
						this.toggleToolbar();
						break;
				}
			
			}
			else{
				
				switch (e.action){
					
					case Util.TouchElement.ActionTypes.touchMove:
					case Util.TouchElement.ActionTypes.swipeLeft:
					case Util.TouchElement.ActionTypes.swipeRight:
						
						// Hide the toolbar if need be 
						this.fadeOutToolbarIfVisible();
						
						// Pass the touch onto the carousel
						this.carousel.onTouch(e.action, e.point);
						break;
					
					case Util.TouchElement.ActionTypes.touchStart:
					case Util.TouchElement.ActionTypes.touchMoveEnd:
					
						// Pass the touch onto the carousel
						this.carousel.onTouch(e.action, e.point);
						break;
						
					case Util.TouchElement.ActionTypes.tap:
						this.toggleToolbar();
						break;
						
					case Util.TouchElement.ActionTypes.doubleTap:
						
						// Take into consideration the window scroll
						if (this.settings.target === window){
							e.point.x -= Util.DOM.windowScrollLeft();
							e.point.y -= Util.DOM.windowScrollTop();
						}
						
						// Just make sure that if the user clicks out of the image
						// that the image does not pan out of view!
						var 
							cacheImageEl = this.cache.images[this.currentIndex].imageEl,
						
							imageTop = window.parseInt(Util.DOM.getStyle(cacheImageEl, 'top'), 10),
							imageLeft = window.parseInt(Util.DOM.getStyle(cacheImageEl, 'left'), 10),
							imageRight = imageLeft + Util.DOM.width(cacheImageEl),
							imageBottom = imageTop + Util.DOM.height(cacheImageEl);
						
						if (e.point.x < imageLeft){
							e.point.x = imageLeft;
						}
						else if (e.point.x > imageRight){
							e.point.x = imageRight;
						}
						
						if (e.point.y < imageTop){
							e.point.y = imageTop;
						}
						else if (e.point.y > imageBottom){
							e.point.y = imageBottom;
						}
						
						this.createZoomPanRotate();
						if (this.isZoomActive()){
							this.zoomPanRotate.zoomAndPanToPoint(this.settings.doubleTapZoomLevel, e.point);
						}
						
						break;
					
					case Util.TouchElement.ActionTypes.gestureStart:
						this.createZoomPanRotate();
						break;
				}
				
				
			}
			
			Util.Events.fire(this, {
				type: PhotoSwipe.EventTypes.onTouch,
				target: this,
				point: e.point, 
				action: e.action
			});
			
		},
		
		
		
		/*
		 * Function: onCarouselSlideByEnd
		 */
		onCarouselSlideByEnd: function(e){
			
			this.currentIndex = e.cacheIndex;
			
			if (!Util.isNothing(this.toolbar)){
				this.toolbar.setCaption(this.currentIndex);
				this.toolbar.setToolbarStatus(this.currentIndex);
			}
			
			Util.Events.fire(this, {
				type: PhotoSwipe.EventTypes.onDisplayImage,
				target: this,
				action: e.action,
				index: e.cacheIndex
			});
		
		},
		
		
		
		/*
		 * Function: onToolbarTap
		 */
		onToolbarTap: function(e){
		
			switch(e.action){
				
				case Toolbar.ToolbarAction.next:
					this.next();
					break;
				
				case Toolbar.ToolbarAction.previous:
					this.previous();
					break;
					
				case Toolbar.ToolbarAction.close:
					this.hide();
					break;
				
				case Toolbar.ToolbarAction.play:
					this.play();
					break;
					
			}
			
			Util.Events.fire(this, { 
				type: PhotoSwipe.EventTypes.onToolbarTap, 
				target: this,
				toolbarAction: e.action,
				tapTarget: e.tapTarget
			});
			
		},
		
		
		
		/*
		 * Function: onMouseWheel
		 */
		onMouseWheel: function(e){
			
			var 
				delta = Util.Events.getWheelDelta(e),
				dt = e.timeStamp - (this.mouseWheelStartTime || 0);
			
			if (dt < this.settings.mouseWheelSpeed) {
				return;
			}
			
			this.mouseWheelStartTime = e.timeStamp;
			
			if (this.settings.invertMouseWheel){
				delta = delta * -1;
			}
			
			if (delta < 0){
				this.next();
			}
			else if (delta > 0){
				this.previous();
			}
			
		},
		
		
		
		/*
		 * Function: onCarouselSlideshowStart
		 */
		onCarouselSlideshowStart: function(e){
		
			Util.Events.fire(this, {
				type: PhotoSwipe.EventTypes.onSlideshowStart,
				target: this
			});
		
		},
		
		
		
		/*
		 * Function: onCarouselSlideshowStop
		 */
		onCarouselSlideshowStop: function(e){
		
			Util.Events.fire(this, {
				type: PhotoSwipe.EventTypes.onSlideshowStop,
				target: this
			});
		
		},
		
		
		
		/*
		 * Function: onToolbarBeforeShow
		 */
		onToolbarBeforeShow: function(e){
		
			Util.Events.fire(this, {
				type: PhotoSwipe.EventTypes.onBeforeCaptionAndToolbarShow,
				target: this
			});
		
		},
		
		
		
		/*
		 * Function: onToolbarShow
		 */
		onToolbarShow: function(e){
		
			Util.Events.fire(this, {
				type: PhotoSwipe.EventTypes.onCaptionAndToolbarShow,
				target: this
			});
		
		},
		
		
		
		/*
		 * Function: onToolbarBeforeHide
		 */
		onToolbarBeforeHide: function(e){
		
			Util.Events.fire(this, {
				type: PhotoSwipe.EventTypes.onBeforeCaptionAndToolbarHide,
				target: this
			});
		
		},
		
		
		
		/*
		 * Function: onToolbarHide
		 */
		onToolbarHide: function(e){
		
			Util.Events.fire(this, {
				type: PhotoSwipe.EventTypes.onCaptionAndToolbarHide,
				target: this
			});
		
		},
		
		
		
		/*
		 * Function: onZoomPanRotateTransform
		 */
		onZoomPanRotateTransform: function(e){
			
			Util.Events.fire(this, {
				target: this,
				type: PhotoSwipe.EventTypes.onZoomPanRotateTransform,
				scale: e.scale,
				rotation: e.rotation,
				rotationDegs: e.rotationDegs,
				translateX: e.translateX,
				translateY: e.translateY
			});
			
		}
		
		
	});
	
	
	
}
(
	window, 
	window.klass, 
	window.Code.Util,
	window.Code.PhotoSwipe.Cache,
	window.Code.PhotoSwipe.DocumentOverlay,
	window.Code.PhotoSwipe.Carousel,
	window.Code.PhotoSwipe.Toolbar,
	window.Code.PhotoSwipe.UILayer,
	window.Code.PhotoSwipe.ZoomPanRotate
));
;
(function ($) {

  Drupal.behaviors.openpublish_media = {
    attach: function (context, settings) {
      if ($('.node-openpublish-photo-gallery .field-name-field-op-main-image .field-item a, .node-openpublish-photo-gallery .field-name-field-op-gallery-image-image .field-item a', context).length > 0) {
        var photoswipe = $('.node-openpublish-photo-gallery .field-name-field-op-main-image .field-item a, .node-openpublish-photo-gallery .field-name-field-op-gallery-image-image .field-item a', context).photoSwipe({
          getImageCaption: function(el){
            var caption = $(el).closest('.field-collection-item-field-op-gallery-image', context).find('.field-name-field-op-gallery-image-caption .field-item', context).text();
            if (caption != '') {
              return caption;
            } else {
              return $(el).closest('#region-content', context).find('h1#page-title', context).text();
            }
          },
          captionAndToolbarAutoHideDelay: 10000,
          captionAndToolbarShowEmptyCaptions: false,
          imageScaleMethod: 'fitNoUpscale'
        });
      }
    }
  };

})(jQuery);;
