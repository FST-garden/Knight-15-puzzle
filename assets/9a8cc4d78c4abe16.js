
(function(root){
  'use strict';
  // Two laps of a four-vertex ring (8 swaps) equal one reverse lap (4 swaps).
  // Positions include the current blank; next is the proposed blank position.
  function redundantRing(positions,next){
    const n=positions.length;if(n<8||next!==positions[n-8])return false;
    for(let i=0;i<4;i++)if(positions[n-8+i]!==positions[n-4+i])return false;
    return new Set(positions.slice(n-4)).size===4;
  }
  const transpose=p=>(p%4)*4+(p>>2),tileMap=t=>t?transpose(t-1)+1:0;
  function mirrorBoard(board){const b=new Array(16);board.forEach((t,i)=>b[transpose(i)]=tileMap(t));return b;}
  function mirrorHeuristic(base){
    const h=board=>Math.max(base(board),base(mirrorBoard(board)));
    if(base.createState)h.createState=board=>{
      const a=base.createState(board),b=base.createState(mirrorBoard(board));
      return {value:()=>Math.max(a.value(),b.value()),swap:(t,from,z)=>{a.swap(t,from,z);b.swap(tileMap(t),transpose(from),transpose(z));}};
    };
    return h;
  }
  const tables=new Map();
  function perimeter(game,{depth=8,capacity=4096}={}){
    if(game.width!==4||game.height!==4)return null;
    const id=depth+':'+capacity;if(tables.has(id))return tables.get(id);
    const nodes=[{board:game.goal.slice(),z:15,d:0,parent:-1}],lookup=new Map([[game.key(game.goal),0]]);
    let capped=false;
    for(let i=0;i<nodes.length&&!capped;i++){
      const n=nodes[i];if(n.d===depth)continue;
      for(const v of game.graph[n.z]){
        const b=game.move(n.board,v),key=game.key(b);if(lookup.has(key))continue;
        if(nodes.length>=capacity){capped=true;break;}
        lookup.set(key,nodes.length);nodes.push({board:b,z:v,d:n.d+1,parent:i});
      }
    }
    const api={size:nodes.length,depth,capped,find:b=>lookup.get(game.key(b)),distance:i=>nodes[i].d,
      path:i=>{const p=[];for(;i>=0;i=nodes[i].parent)p.push(nodes[i].board.slice());return p;}};
    tables.set(id,api);return api;
  }
  const api={redundantRing,mirrorBoard,mirrorHeuristic,perimeter};if(typeof module!=='undefined')module.exports=api;else root.KnightSearchExtras=api;
})(globalThis);

