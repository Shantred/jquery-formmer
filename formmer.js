// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level ADVANCED_OPTIMIZATIONS
// ==/ClosureCompiler==

/**
 * Formmer v1.0
 * Eric South - https://github.com/Shantred/jquery-formmer
 * Prevents duplicate submissions of a form by disabling form submission once the
 * submit event has fired. Formmer also watches jQuery ajax requests and will
 * automatically enable form submission on error or (optionally) success.
 **/

;(function( $, window, document, undefined ) {

    var pluginName = "formmer",
        defaults = {
          enableOnError: true,
          enableOnSucces: false,
          watchURL: null,
          disableFormInputs: false,
          disableAjax: false,
          enabledCallback: null,
          disabledCallback: null,
          ajaxOnSuccess: null,
          ajaxOnError: null,
          loadingHTML: "Please Wait"
        };

    function Plugin( element, options ) {

      // This plugin allows direct access to plugin methods if the method name
      // is passed in as a string for the options param. If not a string, assume
      // it is an object containing plugin options

      this.ele = element;
      this.settings = $.extend( {}, defaults, options );
      this._defaults = defaults;
      this._name = pluginName;

      if( typeof(options) === 'string' ) {
        if( typeof(this[options]) === 'function' ) {
          this[options]();
        }

      } else {
        this.init();
        return this;
      }
    }

    $.extend( Plugin.prototype, {
      init: function() {
        this.bindFormSubmission( this.ele );
        this.getDataSettings( this.ele );
      },
      bindFormSubmission: function() {

        // Add selector class and plugin reference id
        this.ele.addClass('formmer')
            .attr('data-formmerid', ($("[data-formmerid]").length + 1));

        if( this.ele.attr('action') != null ) {
          formmerUrls.push( $(form).attr('action') );
        }

        this.ele.on("submit", null, { formmer : this}, function(e) {
          if( $(this.ele).hasClass('formmer-processing') ) {
            // Prevents any additionally bound events from firing
            e.stopImmediatePropagation();
            return false;
          }

          e.data.formmer.disableSubmission();
          return false;
        });
      },
      getDataSettings: function() {

        // We always take data-attribute settings over initialized settings if provided
        if( this.ele.attr('data-enableonsuccess') != null ) {
          if( this.ele.attr('data-enableonsuccess').toLowerCase() === "true" )
            this.settings.enableOnSuccess = true;
        }

        if( this.ele.attr('data-enableonerror') != null ) {
          if( this.ele.attr('data-enableonerror').toLowerCase() === "false" )
            this.settings.enableOnError = false;
        }

        // If a watchURL was provided as data, set to settings. Otherwise, check
        // if one was provided via options and add that to data
        if( this.ele.attr('data-watchurl') != null ) {
          this.settings.watchURL = this.ele.attr('data-watchurl');
        } else if( this.settings.watchURL ) {
          this.ele.attr('data-watchurl', this.settings.watchURL);
        }

        if( this.ele.attr('data-disableajax') != null ) {
          if( this.ele.attr('data-disableajax').toLowerCase() === "true" )
            this.settings.disableAjax = true;
        }

        if( this.ele.attr('data-disableforminputs') != null ) {
          if( this.ele.attr('data-disableforminputs').toLowerCase() === "true" )
            this.settings.disableFormInputs = true;
        }
      },
      enableSubmission: function( isError ) {

        // Check correct data attr depending on error value
        if( isError ) {

          // By default, buttons should enable after an error
          if( this.settings.enableOnError ) {

            // Enable all form inputs if specified
            if( this.settings.disableFormInputs ) {
              this.ele.children('input, textarea, select').prop('disabled', false);
            }

            this.ele.removeClass('formmer-processing');
            this.enableFormButton();

          } else {

            // Not specified, default to enabled
            // Enable all form inputs if specified
            if( this.settings.disableFormInputs )
              this.ele.children('input, textarea, select').prop('disabled', false);

            this.ele.removeClass('formmer-processing');
            this.enableFormButton();
          }

          if( this.settings.ajaxOnError )
            this.settings.ajaxOnError.call(this);

        } else {

          // By default, buttons don't enable after success
          if( this.settings.enableOnSuccess ) {

            // Enable all form inputs if specified
            if( this.settings.disableFormInputs )
              this.ele.children('input, textarea, select').prop('disabled', false);

            this.ele.removeClass('formmer-processing');
            this.enableFormButton();
          } // No else because of defaults

          if( this.settings.ajaxOnSuccess )
            this.settings.ajaxOnError.call(this);

        }
      },
      disableSubmission: function() {
        this.ele.addClass('formmer-processing');

        // Disable all form inputs if specified
        if( this.settings.disableFormInputs === true ) {
          this.ele.children('input, textarea, select').prop('disabled', true);
        }

        this.disableFormButton();
      },
      enableFormButton: function() {

        // Used when disabling a form button, but are not passing the button into
        // the plugin directly
        var button = this.ele.find('button[type=submit]');
        if( button ) {
          button.html( button.attr('data-originalhtml') )
              .prop('disabled', false)
              .removeAttr('data-originalhtml');
        }

        if( this.settings.enabledCallback )
          this.settings.enabledCallback.call(this, this.ele, button);
      },
      disableFormButton: function() {

        // The converse of the previous method
        var button = this.ele.find('button[type=submit]');
        if( button ) {
          if( button.attr('data-loadinghtml') ) {
            button.attr('data-originalhtml', button.html())
                .html( button.attr('data-loadinghtml') )
                .prop('disabled', true);
          } else {
            button.attr('data-originalhtml', button.html())
                .html(this.settings.loadingHTML)
                .prop('disabled', true);
          }
        }

        if( this.settings.disabledCallback )
          this.settings.disabledCallback.call(this, this.ele, button);
      },
    });


    $.fn[ pluginName ] = function( options ) {

      // When options is a string, treat as a direct method call and return plugin
      // object without storing reference to document
      if( typeof(options) === 'string' ) {
        return new Plugin( this, options );
      } else {
        $.data( document, pluginName + "-" + ($("[data-formmerid]").length + 1), new Plugin( this, options ) );
        return $.data(document, pluginName + "-" + + ($("[data-formmerid]").length + 1));
      }
    };

    // Automatically apply formmer to every form with class formmer that isn't
    // already an instance of the plugin
    $.each( $('form.formmer:not([data-formmerid])'), function(idx, form) {
      $(form).formmer();
    });

    // Ajax prefilter that communicates with plugin instances to enable and disable
    // form/button controls.
    $.ajaxPrefilter( function( options, originalOptions, jqXHR) {

      // To prevent issues if the action attribute is used for something else,
      // look for the watch url first and use action url as backup
      var form = $("form.formmer[data-watchurl='" + options.url + "']:not([data-disableajax=true])");

      if( form.length === 0 ) {
        form = $("form.formmer[action='" + options.url + "']:not([data-disableajax=true])");
      }

      // Attach custom success and error handlers to the request
      if( form.length ) {
        var $this = $.data(document, pluginName + "-" + form.attr('data-formmerid'));

        // Inject our submit callbacks to the ajax success and error handlers
        options.success = [ function() {
          $this.enableSubmission(false);
        }, options.success];

        options.error = [ function() {
          $this.enableSubmission(true);
        }, options.error];
      }
    });
}( jQuery, window, document ));