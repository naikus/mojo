/**
 * Mobile enabled cardpanel widget. This can be used to simulate a carousel, tabstrip widget
 */
 (function($) {
    var forEach = $.forEach,
      noop = function() {}, 
      env = $.env,
      hasTransitions = env.supports("transition"),
      transitionEndEvt = env.property("transitionend"),
      transformProp = env.supports("transform") ? env.property("transform") : "",
      
      defaults = {
         oncardchange: noop,
         activeCard: 0,
         orientation: "horizontal"
      };
      
   function layoutH(panel, wrapper, cards)  {
      var offsets = panel.offsets(), 
         len = cards.length, 
         width = offsets.width,
         wStyle = wrapper.get(0).style;
         
      wStyle.width = (width * len) + "px";
      wStyle.minHeight = "100%";
      
      forEach(cards, function(c, i) {
         var s = c.style;
         s.width = width + "px";
         s.position = "absolute";
         s.left = 0;
         s.marginLeft = (width * i) + "px";
         s.minHeight = "100%";
      });
      //return width;
   }
   
   function moveH(wrapper, distance) {
      wrapper.get(0).style[transformProp] = "translateX(-" + distance + "%)";
      // wrapper.get(0).style[transformProp] = "translateX(-" + distance + "px)";
   }
   
   function layoutV(panel, wrapper, cards) {
      var offsets = panel.offsets(), 
         len = cards.length, 
         height = offsets.height, 
         wStyle = wrapper.get(0).style;
      
      wStyle.height = (height * len) + "px";
      forEach(cards, function(c) {
         c.style.height = height + "px";
      });      
      //return height;
   }
   
   function moveV(wrapper, distance) {
      wrapper.get(0).style[transformProp] = "translateY(-" + distance + "%)";
      // wrapper.get(0).style[transformProp] = "translateY(-" + distance + "px)";
   }
         
    $.extension("cardpanel", function(opts) {
       var options = $.shallowCopy({}, defaults, opts),
         self = this,
         cpOffsets = self.offsets(),
         
         cardWrapper,
         
         layout,
         moveWrapper, 
         
         // unitDistance,
         allCards = [],
         widget,
         currentCardIdx = options.activeCard;
         
         /* ------------------------------------- Card changing --------------------------------- */
         
         function hideCards() {
            /*var style = cardWrapper.get(0).style;
            style.width = cpOffsets.width;
            style.height = cpOffsets.height;*/
            
            forEach(allCards, function(c, i) {
               if(i !== currentCardIdx) {
                  c.style.display = "none";
               }
            });
         }
         
         function showCards() {
            // cardWrapper.get(0).style.width = (cpOffsets.width * allCards.length) + "px";
            forEach(allCards, function(c) {
               c.style.display = "block";
            });
         }
         
         function showCard(idx) {
            if(idx < 0 || idx >= allCards.length) {
               return;
            }
            
            // showCards();
            currentCardIdx = idx;
            if(idx === 0) {
               moveWrapper(cardWrapper, 0);
            }else {
               moveWrapper(cardWrapper, (100 / allCards.length) * idx);
               // moveWrapper(cardWrapper, distance * idx);
            }
         }
         
         /* ------------------------------------- Event handling -------------------------------- */
         function configureEvents() {
            $(window).on("resize", function() {
               //unitDistance = layout(self, cardWrapper, allCards);
               layout(self, cardWrapper, allCards);
            });
            
            // cardWrapper.on(transitionEndEvt, hideCards);
         }         
         
         /* ------------------------------------- Initialization -------------------------------- */
         
         cardWrapper = self.find(".card-wrapper");
         if(!cardWrapper.get(0)) {
            throw new Error("Card wrapper element with class 'card-wrapper' not found");
         }
         allCards = cardWrapper.children(".card"); //cardWrapper.find(".card:nth-child(n+1)").elements;
         if(options.orientation === "vertical") {
            layout = layoutV;
            moveWrapper = moveV;
         }else {
            layout = layoutH;
            moveWrapper = moveH;
         }
         
         // unitDistance = layout(self, cardWrapper, allCards);
         configureEvents();
         layout(self, cardWrapper, allCards);
         showCard(currentCardIdx);
         
         widget = {
            next: function() {
               showCard(currentCardIdx + 1);
            },
            previous: function() {
               showCard(currentCardIdx - 1);
            },
            card: function(idx) {
               showCard(idx);               
            },
            layout: function() {
               layout(self, cardWrapper, allCards);
            }
         };
         return widget;
    });
 })(h5);




