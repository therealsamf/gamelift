

const gamelift = require('bindings')('gamelift.node');
const network = new gamelift.Network();

network.performConnect({
  connect: function() { console.log("called"); },
  once: function(blah, blahblah) {
    console.log("once!");
    console.log("blah", blah);
    setTimeout(function() {
      console.log("calling");
      blahblah();
    }, 0);
  }
});
