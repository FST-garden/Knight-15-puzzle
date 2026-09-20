
'use strict';
const $=id=>document.getElementById(id);
let game=KnightPuzzle.create(),history=[],cursor=0,solution=[],meta={},editing=false,placements=[],assessment;
let directionPrefix='',lastWheelTime=-Infinity,freeEditing=false,editSnapshot=null,freePast=[];
let searchJob=null,searchToken=0,solverReport='尚未搜索。';
const board=()=>history[cursor];
const coord=i=>'abcde'[i%game.width]+(1+Math.floor(i/game.width));
function positionMark(value){
  if(!value)return '';
  const target=value-1,x=target%game.width,y=Math.floor(target/game.width);
  const edgeX=x===0||x===game.width-1,edgeY=y===0||y===game.height-1;
  const kind=edgeX&&edgeY?'corner':edgeX||edgeY?'edge':'inner';
  return `<span class="position-mark ${kind}" style="left:${(x+.5)/game.width*100}%;top:${(y+.5)/game.height*100}%" aria-hidden="true"></span>`;
}
function message(text) { $('status').textContent=text; }
function assess() { assessment=game.analyze(history[0]); }
function setGame(initial,route=[],info={source:'手动摆局'}) {
  if(searchJob)searchJob.cancel();searchJob=null;searchToken++;solverReport='尚未搜索。';
  history=[initial.slice()];cursor=0;solution=route.map(b=>b.slice());meta=info;editing=false;freeEditing=false;placements=[];assess();render();
}
function go(from) {
  if(searchJob)return;
  if(freeEditing){swapFree(from,board().indexOf(0));return;}
  if(editing) {
    if(placements.includes(from)||placements.length>=game.size-1) return;
    placements.push(from);render();message(placements.length===game.size-1?'摆局完成，最后一格已留空。可右键撤回，或点击「完成摆局」。':`下一步放置数字 ${placements.length+1}；右键撤回上一次放置。`);return;
  }
  if(!game.legal(board(),from)) {message('这匹马不能跳入当前空格，请选择带细绿框的数字。');return;}
  if(cursor>=10000) {message('已达到 10,000 步记录上限，请重开当前局面。');return;}
  const next=game.move(board(),from);solution=[];solverReport='路线已改变，请重新求解。';history=history.slice(0,cursor+1);history.push(next);cursor++;
  render();message(game.won(next)?'完成！全部数字归位；仍可继续移动探索。':'已移动。可以后退、重做，或继续探索。');
}
function undoPlacement() {
  if(!editing) return;
  placements.pop();render();message(`下一步放置数字 ${placements.length+1}。`);
}
function render() {
  directionPrefix='';
  const b=editing?Array(game.size).fill(null):board();
  if(editing) {placements.forEach((p,i)=>b[p]=i+1);if(placements.length===game.size-1)b[b.indexOf(null)]=0;}
  $('board').style.gridTemplateColumns=`repeat(${game.width},1fr)`;
  $('board').classList.toggle('editing',editing);$('board').replaceChildren();
  for(let i=0;i<game.size;i++) {
    const value=b[i],cell=document.createElement('button'),possible=!editing&&game.legal(b,i);
    cell.className='cell'+((i%game.width+Math.floor(i/game.width))%2?' dark':'')+(value===0?' empty':'')+(value===null?' editable':'')+(possible?' legal':'')+(!editing&&value&&value===game.goal[i]?' placed':'');
    cell.innerHTML=`${positionMark(value)}<span class="coord">${coord(i)}</span><span class="number">${value===null?'+':value===0?'·':value}</span>${value?' <span class="horse" aria-hidden="true">♘</span>':''}${!editing&&value&&value===game.goal[i]?'<span class="correct" aria-hidden="true">●</span>':''}`;
    cell.title=value?`${value}号目标：${coord(value-1)}；色标位置对应目标格`:'空格';
    cell.setAttribute('aria-label',`${coord(i)}，${value===null?'待放置':value===0?'空格':value+'号马'}${possible?'，可移动':''}`);
    cell.onclick=()=>go(i);$('board').append(cell);
  }
  $('mode-label').textContent=freeEditing?'自由编辑 · 点击任意数字与空格交换':editing?`摆局模式 · ${placements.length}/${game.size-1}`:game.won(b)?'已完成':'自由探索';
  $('dimensions').textContent=`${game.width} 列 × ${game.height} 行`;
  $('moves').textContent=editing?`下一编号 ${Math.min(placements.length+1,game.size-1)}`:`第 ${cursor} 步 / 历史 ${history.length-1} 步`;
  $('placed').textContent=editing?'右键撤回放置':`归位 ${b.filter((x,i)=>x!==0&&x===game.goal[i]).length}/${game.size-1}`;
  const h=editing?null:game.heuristic(b);
  $('distance').textContent=editing?'马步曼哈顿 h：—':`马步曼哈顿 h：${Number.isFinite(h)?h:'∞'}`;
  $('distance').title=h===Infinity?'至少一匹马与目标格不在同一连通区域。':'各编号马到目标格的最少马步数之和，不计空格；是解长下界。';
  $('verdict').textContent=editing?'待检查':game.won(b)?'已完成':assessment.label;
  $('verdict').className='badge'+(editing?' pending':assessment.solvable?'':' bad');
  $('analysis').textContent=editing?'完成摆局后检查可解性。':assessment.reason;
  $('source').textContent=meta.source||'导入局面';
  $('route').textContent=solution.length?`${solution.length-1} 步已验证参考解（非最短保证）`:'未保存解法';
  $('help').textContent=freeEditing?'点击任意数字与空格交换。不限制马步；交换后作为新起点，旧路线清除。点击「完成编辑」结束；也可撤销或取消。':editing?'左键按 1、2、3… 放置数字；右键撤销最近一次放置。已占用格不重复计数。':'键盘两键移动：第一方向两格，第二方向一格，例如 WA＝上二左一（也可按 ↑←）。棋盘内滚轮上滚后退、下滚重做。';
  $('back').disabled=editing||!!searchJob||cursor===0;$('forward').disabled=editing||!!searchJob||cursor===history.length-1;
  $('restart').disabled=editing||!!searchJob||cursor===0;
  $('back-five').disabled=$('back').disabled;
  $('forward-five').disabled=$('forward').disabled;$('end').disabled=$('forward').disabled;
  for(const id of ['resize','random','edit','goal','save','load','width','height','steps','solver-seconds','solver-nodes','solver-algorithm','solver-weight','solver-mirror']) $(id).disabled=editing||freeEditing||!!searchJob;
  $('solve').disabled=editing||freeEditing||!!searchJob||!assessment.solvable||game.won(b);
  $('free-edit').disabled=editing||!!searchJob;
  $('free-edit').setAttribute('aria-pressed',String(freeEditing));
  $('free-edit').textContent=freeEditing?'完成编辑':'编辑';
  $('solver-weight').disabled=editing||freeEditing||!!searchJob||!['weighted','repair'].includes($('solver-algorithm').value);
  if(freeEditing)for(const id of ['back','forward','restart','back-five','forward-five','end'])$(id).disabled=true;
  $('solver-mirror').disabled=editing||freeEditing||!!searchJob||game.width!==4||game.height!==4;
  $('solve-cancel').disabled=!searchJob;$('solver-status').textContent=solverReport;
  for(const id of ['edit-undo','edit-clear','edit-done','edit-cancel']) $(id).hidden=!editing;
  $('free-undo').hidden=!freeEditing;$('free-cancel').hidden=!freeEditing;$('free-undo').disabled=!freePast.length;
  $('edit-undo').disabled=!placements.length;$('edit-done').disabled=placements.length!==game.size-1;
  $('target').style.gridTemplateColumns=`repeat(${game.width},1fr)`;$('target').replaceChildren();
  game.goal.forEach(value=>{const span=document.createElement('span');span.innerHTML=positionMark(value)+`<b>${value||'□'}</b>`;$('target').append(span);});
  $('history-count').textContent=`· ${history.length-1} 步`;$('history').replaceChildren();
  // Keep the complete sequence in at most three nodes, even for long records.
  const numbers=history.slice(1).map((next,i)=>history[i][next.indexOf(0)]);
  const groups=[
    {text:numbers.slice(0,Math.max(0,cursor-1)).join(' '),kind:'past'},
    {text:cursor>0?String(numbers[cursor-1]):'',kind:'current'},
    {text:numbers.slice(cursor).join(' '),kind:'future'}
  ];
  for(const group of groups){
    if(!group.text)continue;
    const span=document.createElement('span');span.className=group.kind;span.textContent=group.text+' ';
    if(group.kind==='current'){span.setAttribute('aria-current','step');span.title=`当前第 ${cursor} 步`;}
    $('history').append(span);
  }

}
$('board').oncontextmenu=event=>{if(editing){event.preventDefault();undoPlacement();}};
const directions={w:[0,-1],a:[-1,0],s:[0,1],d:[1,0]};
const arrowKeys={ArrowUp:'w',ArrowLeft:'a',ArrowDown:'s',ArrowRight:'d'};
document.addEventListener('keydown',event=>{
  if(event.isComposing||event.ctrlKey||event.altKey||event.metaKey)return;
  if(event.target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')){directionPrefix='';return;}
  if(event.key==='Escape'){directionPrefix='';message('已取消方向输入。');return;}
  const key=arrowKeys[event.key]||event.key.toLowerCase();
  if(!directions[key]||editing||freeEditing||searchJob)return;
  event.preventDefault();if(event.repeat)return;
  if(!directionPrefix){directionPrefix=key;message(`已输入 ${key.toUpperCase()}（两格方向），再按一个垂直方向；Esc 取消。`);return;}
  const first=directions[directionPrefix],second=directions[key];
  if(first[0]*second[0]+first[1]*second[1]!==0){directionPrefix=key;message(`两键必须相互垂直。已改为 ${key.toUpperCase()} 开头，请再按垂直方向。`);return;}
  const command=(directionPrefix+key).toUpperCase();directionPrefix='';
  const empty=board().indexOf(0),x=empty%game.width+2*first[0]+second[0],y=Math.floor(empty/game.width)+2*first[1]+second[1];
  if(x<0||x>=game.width||y<0||y>=game.height){message(`${command} 指向棋盘外，未移动。`);return;}
  go(y*game.width+x);
});
document.addEventListener('focusin',()=>{directionPrefix='';});
document.addEventListener('pointerdown',()=>{directionPrefix='';});
$('board').addEventListener('wheel',event=>{
  if(editing||freeEditing||event.ctrlKey||event.deltaY===0||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
  if(searchJob){event.preventDefault();return;}
  event.preventDefault();directionPrefix='';
  if(event.timeStamp-lastWheelTime<160)return;
  lastWheelTime=event.timeStamp;
  if(event.deltaY<0){if(cursor>0)$('back').onclick();else message('已在起点，没有更早的步骤。');}
  else {if(cursor<history.length-1)$('forward').onclick();else message('没有可重做的步骤；滚轮前进只回放已有历史。');}
},{passive:false});
$('edit').onclick=()=>{editing=true;placements=[];render();message('点击数字 1 应放的位置。右键撤回一步。');};
$('edit-undo').onclick=undoPlacement;
$('edit-clear').onclick=()=>{placements=[];render();message('已清空摆局，请放置数字 1。');};
$('edit-cancel').onclick=()=>{editing=false;placements=[];render();message('已取消摆局，恢复之前的局面和历史。');};
$('edit-done').onclick=()=>{
  if(placements.length!==game.size-1)return;
  const b=Array(game.size).fill(0);placements.forEach((p,i)=>b[p]=i+1);setGame(b);
  message(assessment.solvable?'摆局已应用，可以开始。可解性判定不等于已找到解法。':'摆局已应用，但无法还原标准目标。可重新摆局修正，也可自由探索。');
};
$('back').onclick=()=>{if(!editing&&cursor>0){cursor--;render();message('已后退一步。前进可重做，走新步会开启新路线。');}};
$('forward').onclick=()=>{if(!editing&&cursor<history.length-1){cursor++;render();message(game.won(board())?'完成！全部数字已归位。':'已重做一步。');}};
$('restart').onclick=()=>{if(!editing){cursor=0;render();message('已回到起点，操作历史保留，可单步前进回放。');}};
function jumpHistory(to){if(editing||searchJob)return;cursor=Math.max(0,Math.min(history.length-1,to));render();message(`已定位到第 ${cursor} 步，全部历史保留。`);}
$('back-five').onclick=()=>jumpHistory(cursor-5);
$('forward-five').onclick=()=>jumpHistory(cursor+5);
$('end').onclick=()=>jumpHistory(history.length-1);
$('goal').onclick=()=>{setGame(game.goal,[],{source:'标准目标'});message('已恢复标准目标布局。');};
$('resize').onclick=()=>{
  game=KnightPuzzle.create(Number($('width').value),Number($('height').value));
  setGame(game.goal,[],{source:'标准目标'});message('尺寸已应用，旧局面已清除。可以随机生成或手动摆局。');
};
function generate() {
  try {
    const steps=Number($('steps').value),seed=String(crypto.getRandomValues(new Uint32Array(1))[0]);
    const result=game.random(seed,steps);
    setGame(result.initial,result.solution,{source:`随机生成 · 实际打乱 ${result.performed} 步`,seed,requestedSteps:steps});
    message(`已生成可解局面。参考路线 ${result.solution.length-1} 步，不代表最短解。${game.size===9?'3×3 的可达类只有 56 个状态，增加打乱步数不一定更难。':''}`);
  } catch(error) {message(error.message);}
}
$('random').onclick=generate;
$('save').onclick=()=>{
  const data=KnightPuzzle.exportRecord(game,history);
  const text='{\n  "initial": [\n'+data.initial.map(row=>'    '+JSON.stringify(row)).join(',\n')+'\n  ],\n  "moves": '+JSON.stringify(data.moves)+'\n}\n';
  const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=`knight-${game.width}x${game.height}.json`;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);message('已导出原局面和完整移动记录（含可重做步骤）。导入后从起点回放。');
};
$('load').onclick=()=>$('file').click();
function searchStats(s){return `展开 ${s.expanded.toLocaleString()} · 存储 ${s.stored.toLocaleString()} · 待搜索 ${s.frontier.toLocaleString()} · ${(s.elapsedMs/1000).toFixed(1)} 秒`;}
function currentIncumbent(){
  const candidates=[history.slice(cursor)];
  for(let i=0;i<solution.length;i++)if(game.key(solution[i])===game.key(board()))candidates.push(solution.slice(i));
  return candidates.filter(p=>p.length&&game.won(p.at(-1))&&p.slice(1).every((b,i)=>game.adjacent(p[i],b))).sort((a,b)=>a.length-b.length)[0]||null;
}
function startSearch(){
  if(editing||freeEditing||searchJob||!assessment.solvable||game.won(board()))return;
  try{
    const maxMs=Number($('solver-seconds').value)*1000,maxNodes=Number($('solver-nodes').value);
    if(!Number.isFinite(maxMs)||maxMs<1000||maxMs>120000)throw Error('时间上限应为 1–120 秒');
    const algorithm=$('solver-algorithm').value||'weighted',weight=Number($('solver-weight').value||2);
    searchJob=KnightSolver.createSearch(game,board(),{maxMs,maxNodes,algorithm,weight,incumbent:currentIncumbent(),mirror:!!$('solver-mirror').checked});
    const token=++searchToken,origin=board().slice();let lastUpdate=0;
    solverReport=`搜索中 · ${algorithm==='anytime'?'限时优化':algorithm==='repair'?'持续改进 A* · W＝'+weight:algorithm==='ida'?'IDA*':'Weighted A* · W＝'+weight}`;render();message('正在求解当前局面，可随时取消。');
    function tick(){
      if(token!==searchToken||!searchJob)return;
      try{
        const s=searchJob.step(200,8);
        if(s.status==='searching'){
          if(s.elapsedMs-lastUpdate>=200){solverReport=`搜索中 · ${s.upperBound!=null?`已知 ${s.lowerBound}–${s.upperBound} 步 · `:""}${searchStats(s)}`;$('solver-status').textContent=solverReport;lastUpdate=s.elapsedMs;}
          setTimeout(tick,8);return;
        }
        searchJob=null;
        if(s.status==='solved'){
          if(game.key(s.path[0])!==game.key(origin)||!game.won(s.path.at(-1))||s.path.slice(1).some((b,i)=>!game.adjacent(s.path[i],b)))throw Error('返回路线校验失败');
          if(cursor+s.path.length>10001)throw Error('解法超过历史容量，请导出存档并从当前布局重新摆局');
          history=history.slice(0,cursor+1).concat(s.path.slice(1));
          solution=history.map(b=>b.slice());
          solverReport=`找到 ${s.path.length-1} 步解（从搜索起点计，${s.optimal?'已证明最短':'不保证最短'}） · ${searchStats(s)}`;
          message('解法已加入前进历史，点击前进或滚轮回放。');
        }else{solverReport=`${s.reason} · ${searchStats(s)}`;message(s.status==='limit'?'本次搜索达到上限，未找到解。原有参考解和历史保留；不代表无解。':s.reason);}
        render();
      }catch(error){searchJob=null;solverReport=`搜索失败：${error.message}`;render();message(solverReport);}
    }
    setTimeout(tick,0);
  }catch(error){searchJob=null;solverReport=error.message;render();message(error.message);}
};
$('solve').onclick=()=>startSearch();
$('solver-algorithm').onchange=()=>{render();};
$('solve-cancel').onclick=()=>{
  if(!searchJob)return;
  const s=searchJob.cancel();searchJob=null;searchToken++;solverReport=`已取消 · ${searchStats(s)}`;render();message('搜索已取消，棋盘、历史和参考解未改变。');
};
$('file').onchange=async()=>{
  const file=$('file').files[0];if(!file)return;
  try {
    if(file.size>10000000)throw Error('文件超过 10 MB 限制');
    const data=KnightPuzzle.importRecord(JSON.parse(await file.text()));
    game=data.game;history=data.history;cursor=data.cursor;solution=data.solution;
    meta={source:typeof data.meta?.source==='string'?data.meta.source.slice(0,160):'导入局面',seed:typeof data.meta?.seed==='string'?data.meta.seed.slice(0,80):''};
    editing=false;freeEditing=false;placements=[];solverReport='尚未搜索。';$('width').value=String(game.width);$('height').value=String(game.height);assess();render();message('存档已导入，布局、移动历史及参考解均已验证。');
  }catch(error){message(`导入失败：${error.message}。当前局面未更改。`);}finally{$('file').value='';}
};
generate();

function swapFree(from,to){
  if(!freeEditing||searchJob||!Number.isInteger(from)||from<0||from>=game.size||!Number.isInteger(to)||to<0||to>=game.size||from===to)return;
  const b=board().slice();
  if(b[from]!==0&&b[to]!==0){message('请将数字与空格交换，不能直接交换两个数字。');return;}
  freePast.push(board().slice());
  [b[from],b[to]]=[b[to],b[from]];
  setGame(b,[],{source:'自由点击编辑'});freeEditing=true;render();message('已交换并设为新起点。'+assessment.label+'；可继续点击或完成编辑。');
}
$('free-edit').onclick=()=>{
  if(editing||searchJob)return;
  if(!freeEditing){editSnapshot={history:history.map(b=>b.slice()),cursor,solution:solution.map(b=>b.slice()),meta:{...meta},solverReport};freePast=[];freeEditing=true;}
  else {freeEditing=false;editSnapshot=null;freePast=[];}
  render();message(freeEditing?'自由编辑：点击任意数字与空格交换。可撤销一步或取消整个编辑。':'已结束编辑。'+assessment.reason);
};
$('free-undo').onclick=()=>{if(!freeEditing||!freePast.length)return;const b=freePast.pop();setGame(b,[],{source:'自由点击编辑'});freeEditing=true;render();message('已撤销一次交换。'+assessment.label);};
$('free-cancel').onclick=()=>{if(!freeEditing||!editSnapshot)return;({history,cursor,solution,meta,solverReport}=editSnapshot);freeEditing=false;editSnapshot=null;freePast=[];assess();render();message('已取消编辑，恢复编辑前局面、历史与解法。');};

