/* global h5 */
(function($) {
  var defaults = {};
  var validators = {
    pattern: (function() {
      var regExps = {};
      return function(field) {
        var ptrn = field.attr("pattern"), regExp = regExps[ptrn];
        if(!regExp) {
          regExp = regExps[ptrn] = new RegExp(ptrn);
        }        
        return regExp.test(field.val());
      };
    })(),
    required: function(field) {
      return !!field.val();
    },
    number: function(field) {
      var val = field.val();
      return !isNaN(Number(val));
    }
  };
  
  $.extension("validator", function(opts) {
    var options = $.shallowCopy({}, defaults, opts),
        form = this,
        formElements = form.get(0).elements,
        formFields = $.map(formElements, function(e) {return $(e);}),
        messageElem = $("<span class='box v-message error-text hint'></span>"),
        validatorNames = {};
        
    function render(messageElem, e) {
      var id = this.attr("id"), fieldId = messageElem.attr("data-for"), title;
      if(!this.hasClass("invalid")) {
        if(fieldId === id) {
          messageElem.attr("data-for", null).remove();
        }
        return;
      }
      title = this.attr("title");
      if(id !== fieldId) {
        messageElem.remove()
            .attr("data-for", id)
            .html(title);
        
        var target = $(this.get(0).parentNode).children("[data-v-msg]");
        if(target.length) {
          $(target).append(messageElem);
        }else {
          this.before(messageElem);
        }
      }
    }

    function validation(id, e) {
      var field = this, vNames = validatorNames[id], vName, v;
      for(var i = 0, len = vNames.length; i < len; i += 1) {
        vName = vNames[i];
        v = validators[vName];
        if(! v) {
          console.log("Validator not found " + vName);
          continue;
        }
        if(!v(field)) {
          field.addClass("invalid");
          break;
        }else {
          field.removeClass("invalid");
        }
      }
    }
        
    formFields.forEach(function(field, i) {
      var vDef = field.attr("data-v"),
          fid,
          validationRenderer,
          validationHandler;
          
      if(!vDef) {
        return;
      }
      // Assign an id to the field for efficient message rendering
      if(!(fid = field.attr("id"))) {
        fid = $.uuid();
        field.attr("id", fid);
      }
      
      validatorNames[fid] = vDef.split(",");
      validationHandler = validation.bind(field, fid);
      validationRenderer = render.bind(field, messageElem);
      field.on("input", validationHandler).on("change", validationHandler);
      field.on("input", validationRenderer).on("focus", validationRenderer);
    });
    
    return {
      clear: function(/* id, id */) {
        if(arguments.length) {
          for(var i = 0, len = arguments.length; i < len; i += 1) {
            form.find("#" + arguments[i]).removeClass("invalid");
          }
        }else {
          formFields.forEach(function(f) {
            f.removeClass("invalid");
          });
        }
        messageElem.remove();
      },
      isValid: function() {
        return form.find(".invalid").count() === 0;
      }
    };
  });
})(h5);