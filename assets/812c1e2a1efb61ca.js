
// One marker: location encodes the tile goal, color encodes its goal ring.
(()=>{const sets=[[1,7,16,10],[2,9,15,8],[3,5,14,12],[4,6,13,11]],colors=['#ed6b65','#67a9ef','#65c58b','#f0cd5b'];
 const original=positionMark;
 positionMark=function(value){const markup=original(value);if(!value||game.width!==4||game.height!==4)return markup;const ring=sets.findIndex(s=>s.includes(value));return markup.replace('style="','style="background:'+colors[ring]+';');};
 render();
})();

