(()=>{
 const down=document.getElementById('zoom-out'),up=document.getElementById('zoom-in'),reset=document.getElementById('zoom-reset'),board=document.getElementById('board');let zoom=100;
 try{const saved=Number(localStorage.getItem('knight15-board-zoom'));if(saved>=70&&saved<=140&&saved%10===0)zoom=saved;}catch{}
 function apply(){board.style.setProperty('--board-scale',String(2/3*zoom/100));board.style.setProperty('--tile-zoom',String(zoom/100));reset.textContent=zoom+'%';reset.setAttribute('aria-label','当前棋盘比例'+zoom+'%，点击恢复100%');down.disabled=zoom===70;up.disabled=zoom===140;try{localStorage.setItem('knight15-board-zoom',String(zoom));}catch{}}
 down.onclick=()=>{zoom=Math.max(70,zoom-10);apply();};up.onclick=()=>{zoom=Math.min(140,zoom+10);apply();};reset.onclick=()=>{zoom=100;apply();};apply();
})();
