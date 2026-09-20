
(function(root){
  'use strict';
  const WEIGHT=3;
  const Extras=typeof module!=='undefined'?require('./search-extras.js'):root.KnightSearchExtras;
  class Heap {
    constructor(){this.items=[];}
    less(a,b){return a.f<b.f||(a.f===b.f&&(a.h<b.h||(a.h===b.h&&a.id<b.id)));}
    push(n){const a=this.items;let i=a.length;a.push(n);while(i){const p=(i-1)>>1;if(!this.less(n,a[p]))break;a[i]=a[p];i=p;}a[i]=n;}
    pop(){const a=this.items,first=a[0],last=a.pop();if(a.length){let i=0;while(2*i+1<a.length){let c=2*i+1;if(c+1<a.length&&this.less(a[c+1],a[c]))c++;if(!this.less(a[c],last))break;a[i]=a[c];i=c;}a[i]=last;}return first;}
  }
  // Immutable parent records preserve a valid path when a state is reopened.
  function createSearch(game,start,{maxNodes=100000,maxMs=30000,now=()=>performance.now(),weight=3,algorithm='weighted',heuristic=null,incumbent=null,compress=true,cacheEntries=0,schedule='adaptive',ringPruning=algorithm==='ida',mirror=false,endgame=algorithm!=='weighted'}={}){
    if(!Number.isInteger(cacheEntries)||cacheEntries<0||cacheEntries>100000)throw Error('缓存上限不正确');
    if(!['legacy','direct','fast-finish','adaptive'].includes(schedule))throw Error('阶段方案不正确');
    if(!['weighted','ida','anytime','repair'].includes(algorithm)||!Number.isFinite(weight)||weight<1||weight>5)throw Error('算法或权重不正确');
    heuristic=heuristic||((game.width===4&&game.height===4&&root.KnightPDB)?root.KnightPDB.heuristic:game.heuristic);
    if(mirror&&game.width===4&&game.height===4)heuristic=Extras.mirrorHeuristic(heuristic);
    if(algorithm==='ida')return createIdaSearch(game,start,{maxNodes,maxMs,now,heuristic,cacheEntries,ringPruning,endgame});
    if(!game.valid(start))throw Error('求解局面不完整');
    if(!Number.isInteger(maxNodes)||maxNodes<1||maxNodes>300000||!Number.isFinite(maxMs)||maxMs<1||maxMs>120000)throw Error('搜索上限不正确');
    if(algorithm==='repair'){const engine=typeof module!=='undefined'?require('./improver.js'):root.KnightImprover;return engine.createSearch(game,start,{maxNodes,maxMs,now,heuristic,incumbent,weight,endgame});}
    if(algorithm==='anytime'){const engine=typeof module!=='undefined'?require('./anytime.js'):root.KnightAnytime;return engine.createSearch(game,start,{maxNodes,maxMs,now,heuristic,incumbent,compress,cacheEntries,schedule,ringPruning,endgame});}
    const began=now(),open=new Heap(),best=new Map(),nodes=[];
    const encode=b=>String.fromCharCode(...b);
    let status='searching',reason='',expanded=0,reopened=0,path=null;
    const push=(b,g,h,parent,empty)=>{
      const key=encode(b),node={b,g,h,f:g+weight*h,parent,empty,key,id:nodes.length};
      nodes.push(node);best.set(key,node);open.push(node);
    };
    if(!game.analyze(start).solvable){status='unsolvable';reason='可解性判定未通过';}
    else push(start.slice(),0,heuristic(start),-1,start.indexOf(0));
    function snapshot(){return {status,reason,weight,algorithm,optimal:weight===1,expanded,stored:nodes.length,unique:best.size,frontier:open.items.length,reopened,elapsedMs:now()-began,path};}
    function step(batch=200,sliceMs=8){
      if(status!=='searching')return snapshot();
      const sliceStart=now();let processed=0;
      while(open.items.length&&processed<batch&&now()-sliceStart<sliceMs){
        if(now()-began>=maxMs){status='limit';reason='达到时间上限';break;}
        const node=open.pop();processed++;
        if(best.get(node.key)!==node)continue;
        if(game.won(node.b)){
          path=[];for(let n=node;n;n=n.parent<0?null:nodes[n.parent])path.push(n.b.slice());path.reverse();status='solved';break;
        }
        expanded++;
        const tracker=heuristic.createState?.(node.b);
        for(const from of game.graph[node.empty]){
          if(node.parent>=0&&from===nodes[node.parent].empty)continue;
          const tile=node.b[from],b=node.b.slice();b[node.empty]=tile;b[from]=0;
          const key=encode(b),g=node.g+1,old=best.get(key);
          if(old&&old.g<=g)continue;
          if(nodes.length>=maxNodes){status='limit';reason='达到节点存储上限';break;}
          if(old)reopened++;
          let h;if(tracker){tracker.swap(tile,from,node.empty);h=tracker.value();tracker.swap(tile,node.empty,from);}else h=heuristic(b);
          push(b,g,h,node.id,from);
        }
        if(status!=='searching')break;
      }
      if(status==='searching'&&!open.items.length){status='unsolvable';reason='已穷尽可达状态';}
      return snapshot();
    }
    function cancel(){if(status==='searching'){status='cancelled';reason='用户取消';}return snapshot();}
    return {step,cancel,snapshot};
  }
  function createIdaSearch(game,start,{maxNodes,maxMs,now,heuristic,cacheEntries,ringPruning,endgame}){
    if(!game.valid(start)||!Number.isInteger(maxNodes)||maxNodes<1||maxNodes>300000||!Number.isFinite(maxMs)||maxMs<1||maxMs>120000)throw Error('局面或搜索上限不正确');
    const began=now(),b=start.slice(),route=[b.slice()],tracker=heuristic.createState?.(b);
    let status=game.analyze(start).solvable?'searching':'unsolvable',reason=status==='unsolvable'?'可解性判定未通过':'',expanded=0,path=null,bound=heuristic(b),next=Infinity;
    const positions=[start.indexOf(0)],table=endgame?Extras.perimeter(game):null;
    const seen=new Map();let cacheHits=0,cachePeak=0,ringCuts=0,endgameHits=0;
    function* dfs(z,previous,g,h){
      const tail=table&&h<=table.depth?table.find(b):undefined;if(tail!==undefined)h=table.distance(tail);
      if(g+h>bound){next=Math.min(next,g+h);return;}
      if(tail!==undefined){path=route.concat(table.path(tail).slice(1)).map(b=>b.slice());endgameHits++;status='solved';return;}
      if(game.won(b)){path=route.map(b=>b.slice());status='solved';return;}
      if(cacheEntries){const key=String.fromCharCode(...b,previous+1)+(ringPruning?String.fromCharCode(...positions.slice(-8)):" "),old=seen.get(key);if(old!==undefined&&old<=g){cacheHits++;return;}if(old===undefined&&seen.size>=cacheEntries)seen.delete(seen.keys().next().value);seen.set(key,g);cachePeak=Math.max(cachePeak,seen.size);}
      if(expanded>=maxNodes){status='limit';reason='达到展开节点上限';return;}
      expanded++;yield;
      const options=game.graph[z].filter(v=>{if(v===previous)return false;if(ringPruning&&Extras.redundantRing(positions,v)){ringCuts++;return false;}return true;}).map(v=>{const t=b[v];b[z]=t;b[v]=0;if(tracker)tracker.swap(t,v,z);const nh=tracker?tracker.value():heuristic(b);if(tracker)tracker.swap(t,z,v);b[v]=t;b[z]=0;return {v,t,h:nh};}).sort((a,b)=>a.h-b.h);
      for(const o of options){
        b[z]=o.t;b[o.v]=0;if(tracker)tracker.swap(o.t,o.v,z);positions.push(o.v);route.push(b.slice());yield* dfs(o.v,z,g+1,o.h);
        route.pop();positions.pop();if(tracker)tracker.swap(o.t,z,o.v);b[o.v]=o.t;b[z]=0;if(status!=='searching')return;
      }
    }
    function* run(){while(status==='searching'){next=Infinity;seen.clear();yield* dfs(start.indexOf(0),-1,0,heuristic(start));if(status!=='searching')return;if(!Number.isFinite(next)){status='unsolvable';reason='已穷尽可达状态';return;}bound=next;}}
    const iterator=run();
    const snapshot=()=>({status,reason,algorithm:'ida',weight:1,optimal:true,expanded,ringCuts,endgameHits,endgameSize:table?.size||0,cacheHits,cachePeak,cacheSize:seen.size,stored:route.length+seen.size,frontier:route.length,reopened:0,elapsedMs:now()-began,path,bound});
    function step(batch=200,sliceMs=8){const end=now()+sliceMs;let n=0;while(status==='searching'&&n++<batch&&now()<end){if(now()-began>=maxMs){status='limit';reason='达到时间上限';break;}iterator.next();}return snapshot();}
    function cancel(){if(status==='searching'){status='cancelled';reason='用户取消';}return snapshot();}
    return {step,cancel,snapshot};
  }
  const api={WEIGHT,createSearch};if(typeof module!=='undefined')module.exports=api;else root.KnightSolver=api;
})(globalThis);

