/*
 * <ul id="list">
 *  <li id="repeat_{$index}" class="list-item activable item_{$index}" data-template>
 *    {firstName} {lastName}
 *  </li>
 * </ul>
 * 
 * <script>
 *  var list = $("#list").repeat({
 *    items: ["one", "two", "three", "four", "five"]
 *  });
 *  list.on("selectionchange", (e) => {
 *    var items = e.currentSelection;
 *  });
 * </script>
 */
(function($) {
  var isTypeOf = $.isTypeOf,
      forEach = $.forEach,
      indexOf = Array.prototype.indexOf,
      uuid = $.uuid,
      // ACTION = "ontouchstart" in document.documentElement ? "tap" : "click",
      defaults = {};
      
  function asModel(arrItems) {
    return $.map(arrItems || [], function(item, i) {
      return {
        key: item.key || "repeat_" + uuid(),
        data: item
      };
    });
  }
      
  $.extension("repeat", function(opts) {
    var root = this,
        // element = root.get(0),
        options = $.shallowCopy({}, defaults, opts),
        templateElem = root.find("[data-template]"),
        items = asModel(options.items),
        renderer = options.render,
        template,
        widget;
        
    // remove the template elem
    if(templateElem.get(0)) {
      templateElem.get(0).removeAttribute("data-template");
      template = $.template(templateElem.outerhtml());
      templateElem.remove();
    }else {
      template = $.template("{item}");
    }
    
    function renderItem(item, index) {
      var itemElem = $(template.process({
        $index: index,
        item: item.data
      }));
      
      itemElem.attr("id", item.key);
      
      if(renderer) {
        renderer(itemElem, index, item.data);
      }
      return itemElem.get(0);
    }
    
    function render() {
      var frag = document.createDocumentFragment();
      forEach(items, function(item, i) {
        var itemElem = renderItem(item, i);
        frag.appendChild(itemElem);
      });
      root.html('').append(frag);
    }
    
    function getItemFromEvent(e) {
      var t = e.target, parent = t.parentNode, tmpElem, rootElem = root.get(0);
      if(t === rootElem) {
        return null;
      }

      if(parent === rootElem) {
        tmpElem = t;
      }else {
        while(parent && parent !== rootElem) {
          tmpElem = parent;
          parent = parent.parentNode;
        }
      }
      return parent === rootElem ? tmpElem : null;
    }
        
    widget = {
      element: root,
      
      onItem: function(event, callback) {
        root.on(event, function(e) {
          var itemElem = getItemFromEvent(e);
          if(!itemElem) {
            return;
          }
          var idx = indexOf.call(root.children(), itemElem);
          callback(e, {
            item: items[idx].data,
            index: idx,
            element: itemElem
          });
        });
        return this;
      },
      
      size: function() {
        return items.length;
      },
      
      setItems: function(arrItems) {
        items = asModel(arrItems);
        render();
      },
      
      getItems: function() {
        return $.map(items, function(itm, i) {
          return itm.data;
        });
      },
      
      appendItem: function(itms) {
        if(!$.isArray(itms)) {
          itms = [itms];
        }
        itms = asModel(itms);
        var idx, frag = document.createDocumentFragment();
        for(var i = 0, len = itms.length; i < len; i += 1) {
          idx = items.push(itms[i]);
          frag.appendChild(renderItem(itms[i], idx));
        }
        root.append(frag);
      },
      
      prependItem: function(itms, preserveOrder) {
        if(!$.isArray(itms)) {
          itms = [itms];
        }
        itms = asModel(itms);
        var idx, frag = document.createDocumentFragment(), 
            method = preserveOrder ? 
                function(itm) {
                  frag.appendChild(itm);
                } :
                function(itm, fc) {
                  frag.insertBefore(itm, fc);
                };
        for(var i = 0, len = itms.length; i < len; i += 1) {
          idx = items.unshift(itms[i]);
          method(renderItem(itms[i], idx), frag.firstChild);
        }
        root.prepend(frag);
      }
    };
    
    render();
    
    return widget;
  });
})(h5);