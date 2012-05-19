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
      },
      
      orientationUtils = {
         horizontal: {
            layout: function(panel, wrapper, cards) {
               var offsets = panel.offsets(), len = cards.length, 
                  width = offsets.width, 
                  wStyle = wrapper.get(0).style;
               
               wStyle.width = (width * len) + "px";
               wStyle.minHeight = "100%";
               
               forEach(cards, function(c, i) {
                  var s = c.style;
                  s.width = width + "px";
                  s.position = "absolute";
                  s.left = 0;
                  s.minHeight = "100%";
                  s.marginLeft = (width * i) + "px";
               });
            },
            translate: function(elem, distance) {
               elem.style[transformProp] = "translateX(-" + distance + "%)";
            }
         },
         
         vertical: {
            layout: function(panel, wrapper, cards) {
               var offsets = panel.offsets(), 
                  len = cards.length, 
                  height = offsets.height, 
                  wStyle = wrapper.get(0).style;
                  
               wStyle.height = (height * len) + "px";
               forEach(cards, function(c) {
                  c.style.height = height + "px";
               });
            },
            translate: function(elem, distance) {
               elem.style[transformProp] = "translateY(-" + distance + "%)";
            }
         }
      };
         
    $.extension("cardpanel", function(opts) {
       var options = $.extend({}, defaults, opts),
         self = this,
         allCards = [],
         
         cardWrapper,
         cardWrapperElem, 
         
         
         // whats the orientation of this card panel?
         orientation = options.orientation,
         // which layout function to use? 
         layout = orientationUtils[orientation].layout,
         translate = orientationUtils[orientation].translate,
         
         activeCard = options.activeCard,
         currentCardIdx = activeCard;
         
         /* ------------------------------------- Card changing --------------------------------- */        
         
         function showCard(idx) {
            console.log("showing card: " + idx + " from " + currentCardIdx);
            var distance;
            
            if(idx < 0 || idx >= allCards.length) {
               return;
            }
            
            if(idx === 0) {
               translate(cardWrapperElem, 0);
            }else {
               distance = (100 / allCards.length) * idx;
            }
            translate(cardWrapperElem, distance);
            currentCardIdx = idx;
         }
         
         /* ------------------------------------- Event handling -------------------------------- */
         function configureEvents() {
            self.on("swipe", function(e) {
               var dir = e.movement.dir;
               if(dir === "left" || dir === "up") {
                  showCard(currentCardIdx + 1);
               }else if(dir === "right" || dir === "down") {
                  showCard(currentCardIdx - 1);
               }
            });
            
            $(window).on("resize", function() {
               layout(self, cardWrapper, allCards);
            });
         }
         
         function handleTouchStart() {}
         function handleTouchMove() {}
         function handleTouchEnd() {}
         
         
         /* ------------------------------------- Initialization -------------------------------- */
         cardWrapper = self.find(".card-wrapper");
         cardWrapperElem = cardWrapper.get(0);
         if(!cardWrapperElem) {
            throw new Error("Cards wrapper element with .card-wrapper class not found");
         }         
         allCards = cardWrapper.find(".card:nth-child(n+1)").elements;
         
         layout(self, cardWrapper, allCards);
         showCard(activeCard);
         configureEvents();
         
         
         return {
            next: function() {
               showCard(currentCardIdx + 1);
            },
            previous: function() {
               showCard(currentCardIdx - 1);
            },
            card: function(idx) {
               showCard(idx);               
            }
         };
    });
 })(h5);
