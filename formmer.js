/**
 * Formmer v0.1
 * Prevents duplicate submissions of a form by disabling form submission once the 
 * submit event has fired. Formmer also watches jQuery ajax requests and will
 * automatically enable form submission on error or (optionally) success.
 **/
 
;(function( $ ) {
 
    var loadingText = "Please Wait";
    var formmerUrls = [];
    
    // Bind submission events and gather action urls for all formmer enabled forms
    $.each( $('form.formmer'), function(idx, form) {
    
      if( $(form).attr('action') != null ) {
        formmerUrls.push( $(form).attr('action') );
      }
      
      $(form).on("submit", function(e) {
        if( $(form).hasClass('formmer-processing') ) {
          // Prevents any additionally bound events from firing
          e.stopImmediatePropagation();
          return false;
        }

        disableSubmission( $(form) );
        return false;
      });
    });
    
    // Ajax prefilter that attaches our button control functions to outgoing ajax
    // requests if they are submissions to known forms
    $.ajaxPrefilter( function( options, originalOptions, jqXHR) {
      if( formmerUrls.indexOf(options.url) > -1 ) {

        var form = $("form.formmer[action='" + options.url + "']");

        // If a success function exists, we need to check if it is already an array
        // of functions or a single function
        if( options.hasOwnProperty('success') ) {
          if( options.success.constructor === Array ) {
            options.success.push( function() { 
              enableSubmission(form);
              
            });
          } else {
            options.success = [ options.success, function() {
              enableSubmission(form);
            }];
          }
        } else {
          options.success = function() {
            enableSubmission(form);
          };
        }

        if( options.hasOwnProperty('error') ) {
          if( options.error.constructor === Array ) {
            options.error.push( function() { 
              enableSubmission(form);
            });
          } else {
            options.error = [ options.error, function() {
              enableSubmission(form);
            }];
          }
        } else { 
          options.error = function() {
            enableSubmission(form);
          }
        }
      }
    });
    
    var enableSubmission = function( form ) {
      form.removeClass('formmer-processing');

      var button = form.find('button[type=submit]');
      if( button ) {
        enableButton( button );
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
      button.html( button.attr('data-originalHTML') )
            .prop('disabled', false)
            .removeAttr('data-originalHTML');
    };
    
    var disableButton = function( button ) {
      button.attr('data-originalHTML', button.html())
            .html(loadingText)
            .prop('disabled', true);
    };
 
}( jQuery ));