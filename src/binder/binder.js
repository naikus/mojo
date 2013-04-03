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
   
   // use appropriate function for textContent
   /*
    * This is done for performance reasons.
    */
   setValue = "textContent" in Elem ? setValueStandard : setValueIE;
   
   $.extension("binder", function(binderModel) {
      var model = binderModel, self = this, boundElemMap = {};
      
      
      function applyBindings() {
         forEach(boundElemMap, function(arrElems, valKey) {
            var value = getValue(valKey, model);
            setValue(arrElems, value);
         });
      }

      function updateModel(mdl, pKey, modelRef) {
         var parentKey = pKey ? pKey + "." : "", pModel = modelRef || model;
         forEach(mdl, function(value, key) {
            var actKey = parentKey + key, type = getTypeOf(value);
            if(type === "Object") {
               updateModel(value, key, pModel[key] || (pModel[key] = {}));
            }else {
               pModel[key] = value; //update our model
               var arrElems = boundElemMap[actKey];
               if(arrElems) {
                  setValue(arrElems, value == null ? "" : value); //intentional == check, for '0' values
               }
            }
         });
      }

      function updateModelValue(key, value) {
         var keys = key.split(","), modelValue, partKey, tmpModel = model;
         for(var i = 0, len = keys.length; i < len; i++) {
            partKey = keys[i];
            modelValue = tmpModel[partKey];
            if(i === len - 1) {
               tmpModel[partKey] = value;
            }else {
               if(!modelValue) {
                  tmpModel[partKey] = {};
               }
               tmpModel = tmpModel[partKey];
            }
         }
         
         // update the view
         var arrElems = boundElemMap[key];
         if(arrElems) {
            setValue(arrElems, value == null ? "" : value); //intentional == check, for '0' values
         }
      }      
      
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
            applyBindings(boundElemMap, model);
         },
         
         update: function(key, val) {
            if(!model) {
               model = {};
            }
            if(typeof key === "string") {
               updateModelValue(key, val);
            }else {
               updateModel(key); // key is actually a partial model object
            }
         }
      };
      
   });
})(h5);


