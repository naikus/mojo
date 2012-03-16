/**
 * A simple templating mechanism for creating string templates. A template has replacement tokens
 * that are of the format '{' followed by anystring followed by '}'. 
 * @example
 * var temp = $.template("Hi, my name is {firstName} {lastName}, born in {birthYear}. " + 
 *    "I live on the {address.street} street. Today I'm {getAge} years old.");
 * var out = temp.process({
 *    firstName: "John",
 *    lastName:  "Doe",
 *    birthYear: 1975,
 *    getAge: function() {
 *       return new Date().getYear() - this.birthYear;
 *    },
 *    address: {
 *       street: "1st"
 *    } 
 * });
 * 
 * // another way to create the template is:
 * <script id="nameTemplate" type="text/x-mojo-template">
 *    <p class="name">{firstName} {lastName}</p>
 *    <p class="address">{address.street}</p>
 * </script>
 * // in js file:
 * var templ = $("#nameTemplate").template();
 * var out = templ.process({
 *    firstName: "John",
 *    lastName:  "Doe",
 *    address: {
 *       street: "1st"
 *    } 
 * });
 * 
 * @author aniketn3@gmail.com
 */
(function($) {
   var regExp = /\{([^\{\}]+)\}/g;
   
   /** 
    * Internally compiles the template into a function so that we don't need to
    * search the string for replacement for every call to process() function
    */
   function compile(templateStr) {
      var match = regExp.exec(templateStr), allParts = [], tmp = templateStr, lastIndex = 0;
      while(match !== null)   {
         tmp = templateStr.substring(lastIndex, match.index);
         if(tmp) {
            allParts.push(tmp);
         }
         allParts.push({
            rawKey:match[0], 
            key: match[1]
            });
         lastIndex = regExp.lastIndex;
         match = regExp.exec(templateStr);
      }
      // if there is any trailing string
      if(lastIndex < templateStr.length) {
         allParts.push(templateStr.substring(lastIndex));
      }

      return function(objMap) {
         var str = [], i, len, part;
         if(!objMap) {
            return allParts.join("");
         }
         
         for(i = 0, len = allParts.length; i < len; i++)  {
            part = allParts[i];            
            if(typeof(part) === "string")   {
               str[str.length] = part;
            }else {
               str[str.length] = getValue(part.key, objMap);
            }
         }
         return str.join("");
      };
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
   
   $.template = function(text) {
      /* The original template string */
      var templateStr = text,
      templateFunc = compile(text);
      
      return {
         template: templateStr,
         /**
          * Process this template. The values in the optional passed map will override those that were
          * put by the put(String, String) function of this template
          * @param {Object} objMap The object containing tokens and their values as properties
          */
         process: function(objMap) {
            return templateFunc(objMap);
         }
      };
   };
   
   $.extension("template", function() {
      return $.template(this.html());
   });
})(h5);



