;(function($) {
   var forEach = $.forEach, 
      getTypeOf = $.getTypeOf,
      Elem = document.documentElement,
      setValue;

   function setValueStandard(arrElems, value) {
      for(var i = 0, len = arrElems.length; i < len; i++) {
         arrElems[i].textContent = value;
      }
   }
   
   function setValueIE(arrElems, value) {
      for(var i = 0, len = arrElems.length; i < len; i++) {
         arrElems[i].innerText = value;
      }
   }
   
   function getValue(key, obj) {
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
         return "";
      }
      val = val || tmp;
      if(typeof val === "function") {
         return val.call(par);
      }else {
         return val;
      }
   }
   
   function applyBindings(boundElemMap, model) {
      forEach(boundElemMap, function(arrElems, valKey) {
         var value = getValue(valKey, model);
         setValue(arrElems, value);
      });
   }
   
   function updateBingings(boundElemMap, model, pKey) {
      var parentKey = pKey ? pKey + "." : "";
      forEach(model, function(val, key) {
         var actKey = parentKey + key, type = getTypeOf(val);
         if(type === "Object") {
            updateBindings(boundElemMap, val, actKey);
         }else {
            var arrElems = boundElemMap[actKey];
            if(arrElems) {
               if(type === "Function") {
                  setValue(arrElems, val.call(model));
               }else {
                  setValue(arrElems, val);
               }
            }
         }
      });
   }
   
   // use appropriate function for textContent
   /*
    * This is done for performance reasons.
    */
   setValue = "textContent" in Elem ? setValueStandard : setValueIE;
   
   $.extension("binder", function(binderModel) {
      var model = binderModel, self = this, boundElemMap = {};
      
      // search for all bound elements
      self.find("[data-bind]").forEach(function(elem) {
         var key = elem.getAttribute("data-bind"), arr = boundElemMap[key];
         if(!arr) {
            arr = boundElemMap[key] = [];
         }
         arr[arr.length] = elem;
      });
      
      if(model) {
         applyBindings(boundElemMap, model);
      }
      
      return {
         apply: function(mdl) {
            model = mdl;
            applyBindings(boundElemMap, mdl);
         },
         
         update: function(key, val) {
            if(typeof key === "string") {
               var arrElems = boundElemMap[key];
               if(arrElems) {
                  setValue(arrElems, val == null ? "" : val); //intentional == check, for '0' values
               }
            }else {
               updateBingings(boundElemMap, model);
            }
         }
      };
      
   });
})(h5);


