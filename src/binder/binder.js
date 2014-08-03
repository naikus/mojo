;(function($) {
   var forEach = $.forEach, 
      getTypeOf = $.getTypeOf,
      binders;

   function setContentStandard(arrElems, value) {
      for(var i = 0, len = arrElems.length; i < len; i++) {
         arrElems[i].textContent = value;
      }
   }
   
   function setContentIE(arrElems, value) {
      for(var i = 0, len = arrElems.length; i < len; i++) {
         arrElems[i].innerText = value;
      }
   }
   
   function getKey(theKey) {
      var idx = theKey.indexOf(":"), type, key;
      if(idx === -1) {
         type = "text";
         key = theKey;
      }else {
         type = theKey.substring(0, idx);
         key = theKey.substring(idx + 1);
      }
      // console.log(type + ", " + key);
      return {
         type: type,
         key: key
      };
   }
   
   function getValue(key, obj, formatter) {
      var i, len, val, keys = key.split("."), tmp = obj, par;
      for(i = 0, len = keys.length; i < len; i++) {
         par = tmp;
         val = tmp[keys[i]];
         if(val == null) { // intentional '==' to check for null and undefined
            break;
         }else {
            tmp = val;
         }
      }
      if(!val && i < len) { // this means some object in the chain is null and we still have keys left
         return formatter ? formatter(val) : "";
      }
      val = val || tmp;
      if(typeof val === "function") {
         val = val.call(par);
      }
      return formatter ? formatter(val) : val;
   }

   
   binders = {
      attr: function(arrElems, value, attr) {
         for(var i = 0, len = arrElems.length; i < len; i++) {
            arrElems[i].setAttribute(attr, value);
         }
      },
      
      value: function(arrElems, value) {
         for(var i = 0, len = arrElems.length; i < len; i++) {
            var elem = $(arrElems[i]);
            if(elem.val() !== value) {
               elem.val(value);
            }
         }
      },
      
      // use appropriate function for textContent
      text: ("textContent" in document.documentElement ? setContentStandard : setContentIE),
      
      html: function(arrElems, value) {
         for(var i = 0, len = arrElems.length; i < len; i++) {
            arrElems[i].innerHTML = value;
         }
      }
   };
   
   $.binder = {
      
   };
   
   $.extension("binder", function(options) {
      options = options || {};
      var model = options.model || {}, self = this, 
            bindingAttr = options.attr || "data-bind",
            boundElemMap = {}, 
            formatters = options.formatters || {};
      
      
      function applyBindings() {
         forEach(boundElemMap, function(keyMap, modelKey) {
            var value = getValue(modelKey, model, formatters[modelKey]);
            applyBindingsForKey(modelKey, value);
         });
      }
      
      function applyBindingsForKey(modelKey, value) {
         var keyMap = boundElemMap[modelKey] || {};
         forEach(keyMap, function(arrElems, typeKey) {
            var attr, binder;
            if(typeKey.indexOf("@") === 0) {
               // we have attribute setter
               attr = typeKey.substring(1);
               binders.attr(arrElems, value, attr);
            }else {
               binder = binders[typeKey] || binders.text;
               binder(arrElems, value);
            }
         });
         
         if($.getTypeOf(value) === "Object") {
            var k = modelKey + ".";
            $.forEach(value, function(val, prop) {
               applyBindingsForKey(k + prop, val);
            });
         }
      }      

      /**
       * Partially updates the model from the specified model model
       * @param {type} mdl The values to update in this binder's model
       * @param {type} pKey Optional parent key (for nested keys e.g. user.name)
       * @param {type} modelRef Optoinal parent model
       * @returns {undefined}
       */
      function updateModel(mdl, pKey, modelRef) {
         if(!mdl) {return;}
         var parentKey = pKey ? pKey + "." : "", pModel = modelRef || model;
         forEach(mdl, function(value, key) {
            var actKey = parentKey + key, type = getTypeOf(value), formatter = formatters[actKey];
            if(type === "Object") {
               applyBindingsForKey(actKey, formatter ? formatter(value) : value);
               updateModel(value, key, pModel[key] || (pModel[key] = {}));
            }else {
               if(pModel[key] !== value) {
                  pModel[key] = value; //update our model
                  applyBindingsForKey(actKey,  formatter ? formatter(value) : value);
               }
            }
         });
      }

      function updateModelValue(key, value) {
         var keys = key.split("."), modelValue, partKey, tmpModel = model, formatter = formatters[key];
         for(var i = 0, len = keys.length; i < len; i++) {
            partKey = keys[i];
            modelValue = tmpModel[partKey];
            if(i === len - 1) {
               if(tmpModel[partKey] !== value) {
                  tmpModel[partKey] = value;
               }
            }else {
               if(!modelValue) {
                  tmpModel[partKey] = {};
               }
               tmpModel = tmpModel[partKey];
            }
         }
         
         // update the view
         applyBindingsForKey(key, formatter ? formatter(value) : value);
      }
      
      function changeListener(e) {
         updateModelValue(bindKey, e.target.value);
      }
      
      function attachListeners(elem, bindKey) {
         var eName = elem.nodeName.toLowerCase(), type = eName.type;
         if((eName === "input" || eName === "textarea" || eName === "select") && 
                 (type !== "submit" && type !== "reset" || type !== "image" && type !== "button")) {
            $(elem).on("input", changeListener).on("change", changeListener);
         }
      }
      
      /* Structure of bound element map
      var boundElemMap = {
         "user.firstname": {
            "@title": [],
            "text": [],
            "html": []
         }
      };
      */
      // search for all bound elements
      self.find("[" + bindingAttr + "]").forEach(function(elem) {
         var bindKey = elem.getAttribute(bindingAttr), 
               keyInfo = getKey(bindKey),
               keyMap = boundElemMap[keyInfo.key] || (boundElemMap[keyInfo.key] = {}), 
               arrElems = keyMap[keyInfo.type] || (keyMap[keyInfo.type] = []);
               
         // console.log(boundElemMap);               
         arrElems[arrElems.length] = elem;
         
         attachListeners(elem, keyInfo.key);
      });
      
      applyBindings(model);
      
      return {
         apply: function(mdl) {
            model = mdl || {};
            applyBindings();
         },
         
         update: function(key, val) {
            if(typeof key === "string") {
               updateModelValue(key, val);
            }else {
               updateModel(key); // key is actually a partial model object
            }
         },
         
         getModel: function() {
            return model;
         }
      };
      
   });
})(h5);


