
(function(root) {
  'use strict';
  function create(width=4,height=4) {
    if(!Number.isInteger(width)||!Number.isInteger(height)||width<3||width>5||height<3||height>5) throw Error('宽、高必须为 3–5 的整数');
    const size=width*height, goal=Array.from({length:size},(_,i)=>(i+1)%size);
    const graph=Array.from({length:size},(_,u)=>Array.from({length:size},(_,v)=>v).filter(v=>Math.abs(u%width-v%width)*Math.abs(Math.floor(u/width)-Math.floor(v/width))===2));
    const distances=graph.map((_,start)=>{
      const d=Array(size).fill(Infinity),queue=[start];d[start]=0;
      for(const u of queue)for(const v of graph[u])if(d[v]===Infinity){d[v]=d[u]+1;queue.push(v);}
      return d;
    });
    const heuristic=b=>b.reduce((sum,tile,pos)=>sum+(tile?distances[pos][tile-1]:0),0);
    const key=b=>b.join(',');
    function valid(b) { return Array.isArray(b)&&b.length===size&&new Set(b).size===size&&b.every(x=>Number.isInteger(x)&&x>=0&&x<size); }
    function won(b) { return valid(b)&&b.every((x,i)=>x===goal[i]); }
    function legal(b,from) { return Number.isInteger(from)&&from>=0&&from<size&&b[from]!==0&&graph[b.indexOf(0)]?.includes(from); }
    function move(b,from) {
      if(!legal(b,from)) throw Error('这匹马无法跳入空格');
      const next=b.slice(),empty=b.indexOf(0); [next[empty],next[from]]=[next[from],next[empty]];return next;
    }
    function adjacent(a,b) { return valid(a)&&valid(b)&&legal(a,b.indexOf(0))&&key(move(a,b.indexOf(0)))===key(b); }
    let ringStates;
    function analyze(b) {
      if(!valid(b)) return {solvable:false,label:'布局不完整',reason:'需要每个数字各一个，并保留一个空格。'};
      if(width===3&&height===3) {
        if(!ringStates) {
          ringStates=new Set([key(goal)]); const queue=[goal];
          for(let i=0;i<queue.length;i++) for(const from of graph[queue[i].indexOf(0)]) {
            const next=move(queue[i],from),k=key(next);
            if(!ringStates.has(k)) {ringStates.add(k);queue.push(next);}
          }
        }
        const solvable=ringStates.has(key(b));
        return {solvable,label:solvable?'可解':'不可解',reason:solvable?'与目标位于同一个 56 状态的可达类。':'3×3 中心格不能移动，外圈循环次序受限；当前布局不在目标的可达类。'};
      }
      let inversions=0;
      const permutation=b.map(x=>x===0?size:x);
      for(let i=0;i<size;i++) for(let j=i+1;j<size;j++) if(permutation[i]>permutation[j]) inversions++;
      const empty=b.indexOf(0),color=(empty%width+Math.floor(empty/width))%2,goalColor=(width+height-2)%2;
      const solvable=inversions%2===(color^goalColor);
      return {solvable,label:solvable?'可解':'不可解',reason:solvable?'通过该尺寸马步图的完整奇偶性判定；未搜索具体解法。':'排列奇偶性与空格颜色不匹配，无法到达标准目标。'};
    }
    function random(seed,steps=40) {
      if(!Number.isInteger(steps)||steps<1||steps>500) throw Error('打乱步数必须为 1–500 的整数');
      let state=2166136261;
      for(const ch of String(seed)) { state^=ch.charCodeAt(0);state=Math.imul(state,16777619)>>>0; }
      const pick=n=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return Math.floor((state/4294967296)*n);};
      let b=goal.slice(),previous=-1,performed=0;const path=[b];
      for(let i=0;i<steps||won(b);i++) {
        const empty=b.indexOf(0),options=graph[empty].filter(x=>x!==previous);
        const from=(options.length?options:graph[empty])[pick(options.length||graph[empty].length)];
        b=move(b,from);previous=empty;performed++;
        const seen=path.findIndex(p=>key(p)===key(b));
        if(seen>=0) path.splice(seen+1);else path.push(b);
      }
      return {initial:b.slice(),solution:path.slice().reverse().map(p=>p.slice()),seed:String(seed),requestedSteps:steps,performed};
    }
    function validateSave(data) {
      if(!data||data.version!==1||data.width!==width||data.height!==height) throw Error('文件版本或尺寸不匹配');
      if(!Array.isArray(data.history)||!data.history.length||data.history.length>10001||!data.history.every(valid)) throw Error('操作历史格式不正确');
      if(!Number.isInteger(data.cursor)||data.cursor<0||data.cursor>=data.history.length) throw Error('历史位置不正确');
      for(let i=1;i<data.history.length;i++) if(!adjacent(data.history[i-1],data.history[i])) throw Error('历史包含非法移动');
      if(!Array.isArray(data.solution)||data.solution.length>10001) throw Error('参考解格式不正确');
      if(data.solution.length) {
        if(!data.solution.every(valid)||key(data.solution[0])!==key(data.history[0])||!won(data.solution.at(-1))) throw Error('参考解起点或终点不正确');
        for(let i=1;i<data.solution.length;i++) if(!adjacent(data.solution[i-1],data.solution[i])) throw Error('参考解包含非法移动');
      }
      return true;
    }
    return {width,height,size,goal,graph,distances,heuristic,key,valid,won,legal,move,adjacent,analyze,random,validateSave};
  }
  function exportRecord(game,history){
    if(!history.length||!game.valid(history[0]))throw Error('原局面格式不正确');
    const initial=Array.from({length:game.height},(_,r)=>history[0].slice(r*game.width,(r+1)*game.width));
    const moves=history.slice(1).map((b,i)=>{if(!game.adjacent(history[i],b))throw Error('历史包含非法移动');return history[i][b.indexOf(0)];});
    return {initial,moves};
  }
  function importRecord(data){
    if(data?.version===1){const game=create(data.width,data.height);game.validateSave(data);return {game,...data};}
    if(!Array.isArray(data?.initial)||data.initial.length<3||data.initial.length>5||!Array.isArray(data.initial[0]))throw Error('原局面需要 3–5 行二维数字数组');
    const height=data.initial.length,width=data.initial[0].length,game=create(width,height);
    if(!data.initial.every(row=>Array.isArray(row)&&row.length===width)||!game.valid(data.initial.flat()))throw Error('原局面数字须各一个，0 代表空格');
    if(!Array.isArray(data.moves)||data.moves.length>10000)throw Error('移动序列须为不超过 10,000 步的数字数组');
    const history=[data.initial.flat()];
    for(const tile of data.moves){
      if(!Number.isInteger(tile)||tile<1||tile>=game.size)throw Error('移动序列必须填写被移动的马的编号');
      const b=history.at(-1),from=b.indexOf(tile);
      if(!game.legal(b,from))throw Error(`第 ${history.length} 步移动 ${tile} 号马不合法`);
      history.push(game.move(b,from));
    }
    return {game,history,cursor:0,solution:game.won(history.at(-1))?history.map(b=>b.slice()):[],meta:{source:'导入局面'}};
  }
  const api={create,exportRecord,importRecord};if(typeof module!=='undefined') module.exports=api;else root.KnightPuzzle=api;
})(globalThis);

