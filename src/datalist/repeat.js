// @TODO Append prepend repeat elements exactly at the position where data-template was.
// Hint: Consider previous or next sibling

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
      console.warn("Template element not found for this repeat, using default span element");
      template = $.template("<span>{item}</span>");
    }
    
    function renderItem(item, index) {
      var itemElem = $(template.process({
        $index: index,
        item: item.data
      }));
      
      itemElem.attr("id", item.key);
      itemElem.attr("data-repeat-item", "");
      
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
      // root.html('').append(frag);
      // @TODO Implement this! Currently fails with onItem event
      root.remove('[data-repeat-item]').append(frag);
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
          var idx = indexOf.call(root.find("[data-repeat-item]").h5Elements, itemElem);
          if(idx !== -1) {
            callback(e, {
              item: items[idx].data,
              index: idx,
              element: itemElem
            });
          }
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
      
      getItemAt: function(idx) {
        var len = items.length;
        if(idx < len && idx >= 0) {
          return items[idx].data;
        }
        return null;
      },
      
      appendItems: function(itms) {
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
      
      prependItems: function(itms, preserveOrder) {
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
