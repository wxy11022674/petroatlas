(function(g){
'use strict';
// Keep every structural edge in its original renderer. Only nonzero weighted
// contributions carry animated marks; direction always follows the path.
function paths(edges){
 const maxima=new Map(),groups=new Map();
 for(const e of edges)maxima.set(e.layer,Math.max(maxima.get(e.layer)||0,Math.abs(e.value)));
 for(const e of edges){
  if(!Number.isFinite(e.value)||Math.abs(e.value)<1e-12)continue;
  const strong=Math.abs(e.value)/maxima.get(e.layer)>.35,negative=e.value<0,key=`${e.layer}:${negative}:${strong}`;
  if(!groups.has(key))groups.set(key,{layer:e.layer,negative,strong,paths:[]});
  groups.get(key).paths.push(e.d);
 }
 return '<g class="nn-flow" aria-hidden="true" pointer-events="none">'+[...groups.values()].map((b,i)=>`<path class="nn-flow-path" data-flow-layer="${b.layer}" data-flow-edges="${b.paths.length}" d="${b.paths.join(' ')}" fill="none" stroke="${b.negative?'#f5c17c':b.layer===2?'#8bffe0':'#cfbbff'}" stroke-width="${b.strong?1.5:1}" stroke-opacity="${b.strong?.8:.3}" stroke-linecap="round" stroke-dasharray="1.6 30" style="animation-delay:calc(var(--flow-delay,0ms) - ${i*173}ms)"/>`).join('')+'</g>';
}
function create(node,button){
 let moving=true,last=performance.now(),cycles=0,delay=100;
 function advance(){const now=performance.now();if(moving)cycles+=(now-last)/(delay*24);last=now;}
 function state(){node.style.setProperty('--flow-state',moving?'running':'paused');button.textContent=moving?'Ⅱ 暂停连线':'▶ 连线流动';button.setAttribute('aria-pressed',String(moving));}
 function refresh(){advance();node.style.setProperty('--flow-duration',`${delay*24}ms`);node.style.setProperty('--flow-delay',`${-(cycles%1)*delay*24}ms`);state();}
 function pause(){advance();moving=false;state();}
 function resume(){advance();moving=true;state();}
 button.onclick=()=>{if(moving)pause();else resume();};refresh();
 return{refresh,pause,resume,isMoving:()=>moving,speed:value=>{advance();delay=value;refresh();node.querySelectorAll('.nn-flow-path').forEach(p=>p.getAnimations().forEach(a=>{a.currentTime=0;}));}};
}
const api={paths,create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else g.NeuralFlow=api;
})(typeof window!=='undefined'?window:globalThis);
