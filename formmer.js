/**
 * Formmer v0.3
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

    function Plugin( element, options, optionalParams ) {

      // This plugin allows direct access to plugin methods if the method name
      // is passed in as a string for the options param. If not a string, assume
      // it is an object containing plugin options

      this.element = element;
      this.settings = $.extend( {}, defaults, options );
      this._defaults = defaults;
      this._name = pluginName;

      if( typeof(options) === 'string' ) {
        if( typeof(this[options]) === 'function' ) {
          this[options](optionalParams);
        }

      } else {
        this.init();
        return this;
      }
    }

    $.extend( Plugin.prototype, {
      init: function() {
        console.log("Plugin init called on", this);
        this.bindFormSubmission( this.element );
        this.getDataSettings( this.element );
      },
      bindFormSubmission: function( form ) {

        // Add selector class and plugin reference id
        $(form).addClass('formmer')
               .attr('data-formmerid', ($("[data-formmerid]").length + 1));

        if( $(form).attr('action') != null ) {
          formmerUrls.push( $(form).attr('action') );
        }
        
        $(form).on("submit", null, { formmer : this}, function(e) {
          if( $(form).hasClass('formmer-processing') ) {
            // Prevents any additionally bound events from firing
            e.stopImmediatePropagation();
            return false;
          }

          //console.log("this inside the bind", e.data.plugin);
          e.data.formmer.disableSubmission();
          return false;
        });
      },
      getDataSettings: function() {

        // We always take data-attribute settings over initialized settings if provided
        if( this.element[0].hasAttribute('data-enableonsuccess') ) {
          if( this.element.attr('data-enableonsuccess').toLowerCase() === "true" )
            this.settings.enableOnSuccess = true;
        }

        if( this.element[0].hasAttribute('data-enableonerror') ) {
          if( this.element.attr('data-enableonerror').toLowerCase() === "false" )
            this.settings.enableOnError = false;
        }

        // If a watchURL was provided as data, set to settings. Otherwise, check
        // if one was provided via options and add that to data
        if( this.element[0].hasAttribute('data-watchurl') ) {
          this.settings.watchURL = this.element.attr('data-watchurl');
        } else if( this.settings.watchURL ) {
          this.element.attr('data-watchurl', this.settings.watchURL);
        }

        if( this.element[0].hasAttribute('data-disableajax') ) {
          if( this.element.attr('data-disableajax').toLowerCase() === "true" )
            this.settings.disableAjax = true;
        }

        if( this.element[0].hasAttribute('data-disableforminputs') ) {
          if( this.element.attr('data-disableforminputs').toLowerCase() === "true" )
            this.settings.disableFormInputs = true;
        }
      },
      enableSubmission: function( isError ) {

        // Check correct data attr depending on error value
        if( isError ) {

          // By default, buttons should enable after an error
          if( this.settings.enableOnError === true ) {

            // Enable all form inputs if specified
            if( this.settings.disableFormInputs === true ) {
              $(this.element).children('input, textarea, select').prop('disabled', false);
            }

            $(this.element).removeClass('formmer-processing');
            this.enableFormButton();

          } else {
          
            // Not specified, default to enabled
            // Enable all form inputs if specified
            if( this.settings.disableFormInputs === true ) {
              $(this.element).children('input, textarea, select').prop('disabled', false);
            }

            $(this.element).removeClass('formmer-processing');
            this.enableFormButton();
          }

          if( this.settings.ajaxOnError )
            this.settings.ajaxOnError.call(this);

        } else {

          // By default, buttons don't enable after success
          if( this.settings.enableOnSuccess === true ) {

            // Enable all form inputs if specified
            if( this.settings.disableFormInputs === true ) {
              $(this.element).children('input, textarea, select').prop('disabled', false);
            }

            $(this.element).removeClass('formmer-processing');
            this.enableFormButton();
          } // No else because of defaults
        
          if( this.settings.ajaxOnSuccess )
            this.settings.ajaxOnError.call(this);

        }
      },
      disableSubmission: function() {
        $(this.element).addClass('formmer-processing');

        // Disable all form inputs if specified
        if( this.settings.disableFormInputs === true ) {
          $(this.element).children('input, textarea, select').prop('disabled', true);
        }

        this.disableFormButton();
      },
      enableFormButton: function() {

        // Used when disabling a form button, but are not passing the button into
        // the plugin directly
        var button = $(this.element).find('button[type=submit]');
        if( button )
          this.enableButton( button );
      },
      disableFormButton: function() {

        // The converse of the previous method
        var button = $(this.element).find('button[type=submit]');
        if( button )
          this.disableButton( button );
      },
      enableButton: function( button ) {

        // This method is called either directly as a plugin method or indirectly
        // after enableFormButton has obtained a button element
        button.html( button.attr('data-originalhtml') )
              .prop('disabled', false)
              .removeAttr('data-originalhtml');

        if( this.settings.enabledCallback )
          this.settings.enabledCallback.call(this, this.element, button);

      },
      disableButton: function( button ) {

        // Change button html out with loadinghtml if provided or use default
        if( button.attr('data-loadinghtml') ) {
          button.attr('data-originalhtml', button.html())
                .html( button.attr('data-loadinghtml') )
                .prop('disabled', true);
        } else {
          button.attr('data-originalhtml', button.html())
                .html(this.settings.loadingHTML)
                .prop('disabled', true);
        }

        if( this.settings.disabledCallback )
          this.settings.disabledCallback.call(this, this.element, button);

      }
    });


    $.fn[ pluginName ] = function( options, optionalParams ) {

      // When options is a string, treat as a direct method call and return plugin
      // object without storing reference to document
      if( typeof(options) === 'string' ) {
        return new Plugin( this, options, optionalParams );
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

      // console.log("options:", options);
      // console.log("originalOptions:", originalOptions);
      // console.log("jaXHR:", jqXHR);

      // To prevent issues if the action attribute is used for something else,
      // look for the watch url first and use action url as backup
      var form = $("form.formmer[data-watchurl='" + options.url + "']:not([data-disableajax=true])");

      if( form.length === 0 ) {
        form = $("form.formmer[action='" + options.url + "']:not([data-disableajax=true])");
      }

      // Attach custom success and error handlers to the request
      if( form.length ) {
        var $this = $.data(document, pluginName + "-" + form.attr('data-formmerid'));

        // If a success function exists, we need to check if it is already an array
        // of functions or a single function
        if( options.hasOwnProperty('success') ) {
          if( options.success.constructor === Array ) {
            options.success.push( function() { 
              $this.enableSubmission(false);
            });
          } else {
            options.success = [ options.success, function() {
              $this.enableSubmission(false);
            }];
          }
        } else {
          options.success = function() {
            $this.enableSubmission(false);
          };
        }

        if( options.hasOwnProperty('error') ) {
          if( options.error.constructor === Array ) {
            options.error.push( function() { 
              $this.enableSubmission(true);
            });
          } else {
            options.error = [ options.error, function() {
              $this.enableSubmission(true);
            }];
          }
        } else { 
          options.error = function() {
            $this.enableSubmission(true);
          }
        }
      }
    });
}( jQuery, window, document ));