/**
 * Formmer v0.3
 * Eric South - https://github.com/Shantred/jquery-formmer
 * Prevents duplicate submissions of a form by disabling form submission once the 
 * submit event has fired. Formmer also watches jQuery ajax requests and will
 * automatically enable form submission on error or (optionally) success.
 **/
 
;(function( $, window, document, undefined ) {
 
    var loadingText = "Please Wait";
    var formmerUrls = [];

    var pluginName = "formmer",
        defaults = {
          enableOnError: true,
          enableOnSucces: false,
          watchURL: null,
          enabledCallback: null,
          disabledCallback: null
        };

    function Plugin( element, options ) {
      this.element = element;

      this.settings = $.extend( {}, defaults, options );
      this._defaults = defaults;
      this._name = pluginName,
      this.init();

      return this;
    }

    $.extend( Plugin.prototype, {
      init: function() {
        this.bindFormSubmission( this.element );
        this.applySettings( this.element );
      },
      bindFormSubmission: function( form ) {
        if( $(form).attr('action') != null ) {
          formmerUrls.push( $(form).attr('action') );
        }
        
        $(form).on("submit", function(e) {
          if( $(form).hasClass('formmer-processing') ) {
            // Prevents any additionally bound events from firing
            e.stopImmediatePropagation();
            return false;
          }

          disableSubmission( form );
          return false;
        });
      },
      applySettings: function( form ) {
        $(form).addClass('formmer')
              .attr('data-enableonerror', this.settings.enableOnError)
              .attr('data-enableonsuccess', this.settings.enableOnSuccess);

        // If a watchURL was provided, add it to the urls to watch
        if( this.settings.watchURL ) {
          formmerUrls.push( this.settings.watchURL );
          $(form).attr('data-watchurl', this.settings.watchURL);
        }
      },
      testClosure: function() {
        console.log("testing closure here");
      }
    });

    // A really lightweight plugin wrapper around the constructor, preventing 
    // against multiple instantiations
    $.fn[ pluginName ] = function( options ) {
      return new Plugin( this, options );
      // console.log(this.each);
      // return this.each( function() {
      //   if( !$.data( this, "plugin_" + pluginName ) ) {
      //     $.data( this, "plugin_" +
      //       pluginName, new Plugin( this, options ) );
      //   }
      // });
    };



    // Automatically apply formmer to every form with class formmer
    $.each( $('form.formmer'), function(idx, form) {
      $(form).formmer();
    });

    var enableSubmission = function( form, error ) {
      form.removeClass('formmer-processing');

      var button = form.find('button[type=submit]');
      if( button ) {

        // Check correct data attr depending on error value
        if( error ) {

          // By default, buttons should enable after an error
          if( form.attr('data-enableonerror') ) {
            if( form.attr('data-enableonerror') == "true") {
              enableButton( button );
            }
          } else {
          
            // Not specified, default to enabled
            enableButton( button );
          }
        } else {

          // By default, buttons don't enable after success
          if( form.attr('data-enableonsuccess') ) {
            if( form.attr('data-enableonsuccess') === "true" ) {
              enableButton( button );
            }
          } // No else because of defaults
        }
      }
    };

    var disableSubmission = function( form ) {
      form.addClass('formmer-processing');

      var button = form.find('button[type=submit]');
      if( button ) {
        disableButton( button );
      }
    }

    var enableButton = function( button ) {
      button.html( button.attr('data-originalhtml') )
            .prop('disabled', false)
            .removeAttr('data-originalhtml');
    };
    
    var disableButton = function( button ) {
      // If provided, replace the button text data-loadinghtml
      if( button.attr('data-loadinghtml') ) {
        button.attr('data-originalhtml', button.html())
              .html( button.attr('data-loadinghtml') )
              .prop('disabled', true);
      } else {
        button.attr('data-originalhtml', button.html())
              .html(loadingText)
              .prop('disabled', true);
      }
    };

    // Ajax prefilter that attaches our button control functions to outgoing ajax
    // requests if they are submissions to known forms
    $.ajaxPrefilter( function( options, originalOptions, jqXHR) {
      if( formmerUrls.indexOf(options.url) > -1 ) {

        // Attempt to get a form with the watched url first. If this fails, get the
        // form by it's data-watchurl property
        var form = $("form.formmer[action='" + options.url + "']");

        if( form.length === 0 ) {
          form = $("form.formmer[data-watchurl='" + options.url + "']");
        }

        // If a success function exists, we need to check if it is already an array
        // of functions or a single function
        if( options.hasOwnProperty('success') ) {
          if( options.success.constructor === Array ) {
            options.success.push( function() { 
              enableSubmission(form, false);
              
            });
          } else {
            options.success = [ options.success, function() {
              enableSubmission(form, false);
            }];
          }
        } else {
          options.success = function() {
            enableSubmission(form, false);
          };
        }

        if( options.hasOwnProperty('error') ) {
          if( options.error.constructor === Array ) {
            options.error.push( function() { 
              enableSubmission(form, true);
            });
          } else {
            options.error = [ options.error, function() {
              enableSubmission(form, true);
            }];
          }
        } else { 
          options.error = function() {
            enableSubmission(form, true);
          }
        }
      }
    });
}( jQuery, window, document ));