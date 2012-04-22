/**
 * Mobile enabled cardpanel widget. This can be used to simulate a carousel, tabstrip widget
 */
 (function($) {
    var forEach = $.forEach,
      noop = function() {},
      action = "ontouchstart" in document.documentElement ? "tap" : "click",
      defaults = {
         oncardchange: noop,
         activeCard: 0
      };
    
    $.extension("cardpanel", function(opts) {
       var options = $.extend({}, defaults, opts),
         cards = this.children(".card"),
         activeCard = options.activeCard,
         currentCardIdx = null;
         
         /* ------------------------------------- Card changing --------------------------------- */
         function nextCard() {
            
         }
         
         function previousCard() {
            
         }
         
         function showCard(idx) {
            var card = cards.get(idx), currCard;
            if(!card) {
               return false;
            }
            card = $(card);
            card.addClass("active");
            
            if(currentCardIdx !== null) {
               currCard = $(cards.get(currentCardIdx));
               
            }
            
         }
         
         function fireCardChange() {
            
         }
         
         function hasNext() {}
         function hasPrevious() {}
         
         
         /* ------------------------------------- Event handling -------------------------------- */
         function configureEvents() {
            this.on("touchstart", handleTouchStart)
               .on("touchmove", handleTouchMove)
               .on("touchend", handleTouchEnd);
         }
         
         function handleTouchStart() {}
         function handleTouchMove() {}
         function handleTouchEnd() {}
         
         
         /* ------------------------------------- Initialization -------------------------------- */
         this.addClass("card-panel");
         showCard(options.activeCard || 0);
         
         
         return {
            nextCard: function() {},
            previousCard: function() {},
            showCard: function(idx) {}
         }
    });
 })(h5);
