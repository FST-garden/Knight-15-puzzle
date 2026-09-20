
// Explanations are read from the executed plan, never inferred from total length.
function formulaLabel(p){return p.formula?p.formula.family+' · '+p.formula.symmetry+' · '+(p.formula.reversed?'倒读':'正向'):'普通马步';}
function ringName(t){return [4,6,13,11].includes(t)?'黄环':[3,5,14,12].includes(t)?'绿环':[2,9,15,8].includes(t)?'蓝环':'红环';}
function buttonAt(text,n){const b=document.createElement('button');b.textContent=text;b.onclick=()=>{stop();show(n);};return b;}
function drawTimeline(){const box=$('timeline-v3');box.replaceChildren();if(!fullPlan)return;for(const s of fullPlan.stages){const group=document.createElement('details'),h=document.createElement('summary');group.className='panel';h.textContent=s.target?ringName(s.target)+' · '+s.target+'号：'+(s.end===s.start?'已归位，直接锁定':'第'+(s.start+1)+'～'+s.end+'步'):'红环收尾';group.append(h);box.append(group);for(const p of fullPlan.phases.filter(p=>p.start>=s.start&&p.end<=s.end&&p.target===s.target)){const row=document.createElement('div');row.textContent=(p.formula?'【点对点定式】':'')+'第'+(p.start+1)+'～'+p.end+'步 · '+p.kind+' · '+formulaLabel(p)+(p.formula?' · 实际空格端点 '+p.edge[0]+'→'+p.edge.at(-1):'');row.append(buttonAt('到开始',p.start),buttonAt('看段末',p.end));group.append(row);}}}
function explainNow(){if(mode!=='receive'||!fullPlan)return;const p=phases.find(p=>cursor>=p.start&&cursor<p.end),s=fullPlan.stages.find(s=>cursor>=s.start&&cursor<s.end),done=fullPlan.stages.filter(s=>s.end<=cursor&&s.target),last=phases.find(p=>p.end===cursor),next=s?.target;
 const items=['① 整盘计划：黄环 → 绿环 → 蓝环 → 红环。每次归位一匹；已锁定：'+(done.map(s=>s.target).join('、')||'无')+'。其他块允许调整，碰巧正确不自动锁定。'];
 if(s?.target)items.push('② 本匹目标：'+s.target+'号，目标格为'+s.target+'。规划的目标格位路线：'+s.targetRoute.join(' → ')+'。这条路线只列每次完整接送的落点，不包括定式中途绕行。');else items.push('② 当前目标：'+(p?'转动红环，使最后三匹归位。':'整盘已经完成。'));
 if(p){items.push('③ 一次接送：'+p.text+'。本操作第'+(p.start+1)+'～'+p.end+'步；当前已执行'+(cursor-p.start)+'/'+(p.end-p.start)+'步。');
 if(p.formula){const a=p.edge[0],b=p.edge.at(-1),tile=p.before[b-1];items.push('④ 点对点工具：'+formulaLabel(p)+'。开始时空格在'+a+'格，'+tile+'号在'+b+'格；整张卡结束后，'+tile+'号到'+a+'格，空格到'+b+'格，其他块恢复。用途：'+p.kind+'。这里给出可用的保序接送方案，不表示这张卡在所有解法中都必不可少。');items.push('暂借后恢复的棋子：'+p.borrowed.map(x=>x.tile+'号（'+x.position+'格）').join('、')+'。卡中途不要因归位数下降而误判失败。');}else items.push('④ 本操作没有使用点对点定式。');}
 if(last){const changed=last.before.flatMap((t,i)=>t!==last.after[i]?i+1:[]);items.push('⑤ 刚完成操作的检查：空格在'+last.blankAfter+'格；此前锁定块'+(last.locked.every(t=>states[cursor][t-1]===t)?'全部恢复':'仍需检查')+'；净变化格位 '+(changed.join('、')||'无')+'。'+(next?'下一操作继续处理'+next+'号。':'最后收尾或整盘完成。'));}else if(p)items.push('⑤ 完成本操作后检查：空格应在'+p.blankAfter+'格，已锁定块应恢复。当前'+(cursor>p.start?'仍在操作中，暂借尚未全部归还。':'尚未开始该操作。'));
 const lesson=$('lesson-v3');lesson.replaceChildren();for(const text of items){const row=document.createElement('details'),heading=document.createElement('summary'),body=document.createElement('p');row.open=true;heading.textContent=text.split('：')[0];body.textContent=text;row.append(heading,body);lesson.append(row);}
 const steps=$('steps-v3');steps.replaceChildren();if(p){for(let n=p.start+1;n<=p.end;n++){const row=document.createElement('p'),from=route[n],to=route[n-1],tile=states[n-1][from-1];row.textContent='第'+n+'步：'+tile+'号从'+from+'格 → '+to+'格；空格到'+from+'格'+(n===cursor?' ← 当前':'');steps.append(row);}}
 $('op-end').disabled=!p;$('op-back').disabled=cursor===0;
}
const explanationLoad=load,explanationShow=show,explanationMode=setMode;
load=function(){explanationLoad();if(mode==='receive'){drawTimeline();explainNow();}};
show=function(n){explanationShow(n);explainNow();};
setMode=function(m){explanationMode(m);$('explain-v3').hidden=m!=='receive';syncReplayLabels();};
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));$('example').onchange=load;
$('op-back').onclick=()=>{stop();show(Math.max(0,...phases.map(p=>p.start).filter(n=>n<cursor)));};
$('op-end').onclick=()=>{const p=phases.find(p=>cursor>=p.start&&cursor<p.end);if(p){stop();show(p.end);}};
const overview=$('formula-overview');for(const sample of DATA.samples){const plan=basicPlan(sample.initial,DATA.bases),macros=plan.phases.filter(p=>p.formula),a=macros.filter(p=>p.formula.family==='10↔6').length;const row=document.createElement('p');row.textContent='样本'+sample.id+' · MD '+sample.md+'：'+macros.length+'次10↔9定式（含变体），定式共'+macros.reduce((s,p)=>s+p.end-p.start,0)+'步 / 总'+(plan.route.length-1)+'步。';overview.append(row);}
function nextFrame(){if(mode==='receive'&&$('granularity').value!=='step')return phases.find(p=>p.end>cursor)?.end??states.length-1;return cursor+1;}
function syncReplayLabels(){const active=mode==='receive';$('granularity-control').hidden=!active;const segment=active&&$('granularity').value!=='step';$('next').textContent=segment?'下一操作段 →':'下一步 →';$('back').textContent=segment?'← 上一操作段':'← 上一步';$('play').title=segment?'每次推进到接应或送达操作的段末':'每次只移动一匹棋子';}
$('granularity').onchange=()=>{stop();syncReplayLabels();};
$('next').onclick=()=>{stop();show(nextFrame());};
$('back').onclick=()=>{stop();show(mode==='receive'&&$('granularity').value!=='step'?Math.max(0,...phases.map(p=>p.start).filter(n=>n<cursor)):cursor-1);};
$('play').onclick=()=>{if(timer)return stop();if(cursor===states.length-1)show(0);$('play').textContent='暂停';timer=setInterval(()=>show(nextFrame()),900);};
setMode('rings');

