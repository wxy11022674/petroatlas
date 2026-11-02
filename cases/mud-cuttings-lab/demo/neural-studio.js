(function(g){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const percent=v=>(v*100).toFixed(1)+'%', colors=['#bc8750','#477e9e','#8d739f'];
const contexts={
 cuttings:['岩屑观察台','钻头破碎岩石 → 岩屑返出 → 清洗与成像 → 岩性辅助识别','比较纹理的颗粒、方向与平滑程度；拍摄差异也会影响判断。','12 × 12 灰度纹理 · 教学合成'],
 gas:['气测曲线解释台','返出气体 → 全烃测量 → 深度校正 → 异常窗口复核','短促气峰与持续抬升的意义不同。观察超过阈值的点是否连续。','11 点校正窗口 · 相对中心采样点'],
 fluorescence:['荧光像素判读台','紫外成像 → 曝光校正 → 邻域判别 → 发光掩膜','中心像素提供亮度，周围 8 个像素提供局部空间信息。','3 × 3 校正邻域 · 中心像素为判断对象'],
 layering:['钻时层界观察台','钻时记录 → 工况补偿 → 窗口识别 → 层界候选复核','观察相邻点的变化；输出只是界面附近的候选，不是岩性命名。','11 点补偿窗口 · 相对中心采样点'],
 report:['录井记录核查台','原始记录 → 关键词编码 → 意图判断 → 选择复核方向','保留原文，观察哪些词被编码。模型选择核查方向，不生成事实。','24 维固定词表 · 命中为 1 / 未命中为 0']
};
function convolution(model,x,k,pos){
 const col=pos%10,row=Math.floor(pos/10),indices=[],products=[];
 for(let j=0;j<3;j++)for(let i=0;i<3;i++){const id=(row+j)*12+col+i;indices.push(id);products.push((x[id]-.5)*model.conv.w[k*9+j*3+i]);}
 const sum=products.reduce((a,b)=>a+b,model.conv.b[k]);return{indices,products,sum,response:Math.max(0,sum),col,row};
}
function grid(values,n,label,{signed=false,selected=[],unit=false}={}){
 const scale=unit?1:Math.max(.0001,...values.map(Math.abs));
 const rects=values.map((v,i)=>{const t=Math.min(1,Math.abs(v)/scale),c=signed?(v<0?`hsl(28 55% ${96-t*55}%)`:`hsl(266 42% ${96-t*52}%)`):`hsl(163 26% ${97-t*72}%)`;return `<rect x="${i%n*20}" y="${Math.floor(i/n)*20}" width="20" height="20" fill="${c}" stroke="#ffffff55" stroke-width=".5"><title>${label} · 第 ${Math.floor(i/n)+1} 行第 ${i%n+1} 列：${v.toFixed(4)}</title></rect>`;}).join('');
 return `<svg viewBox="0 0 ${n*20} ${Math.ceil(values.length/n)*20}" role="img" aria-label="${esc(label)}">${rects}${selected.map(i=>`<rect x="${i%n*20+1}" y="${Math.floor(i/n)*20+1}" width="18" height="18" fill="none" stroke="#e99321" stroke-width="2"/>`).join('')}</svg>`;
}
function signal(kind,x,overlay=false){
 const mult=kind==='gas'?4:12,values=x.map(v=>v*mult),max=Math.max(kind==='gas'?4:12,...values)*1.05;
 const px=i=>45+i*42,py=v=>210-v/max*170;
 let layer='';
 if(overlay&&kind==='gas')layer=`<line x1="45" x2="465" y1="${py(1.2)}" y2="${py(1.2)}" stroke="#b4762f" stroke-width="2" stroke-dasharray="6 5"/><text x="46" y="${py(1.2)-9}" fill="#996124" font-size="12">固定阈值 TG = 1.2%</text>`;
 if(overlay&&kind==='layering'){let at=1;for(let i=2;i<values.length;i++)if(Math.abs(values[i]-values[i-1])>Math.abs(values[at]-values[at-1]))at=i;layer=`<rect x="${px(at-1)-5}" y="30" width="52" height="180" fill="#f6dfb8" opacity=".65"/><text x="250" y="20" text-anchor="middle" fill="#996124" font-size="12">橙带：最大相邻差 ${Math.abs(values[at]-values[at-1]).toFixed(2)} min/m</text>`;}
 return `<svg viewBox="0 0 505 260" role="img" aria-label="${kind==='gas'?'全烃气测':'钻时'}窗口及${overlay?'固定规则证据':'采样值'}">${[0,.5,1].map(v=>`<path d="M45 ${py(v*max)}H465" stroke="#dbe6e2"/><text x="37" y="${py(v*max)+4}" text-anchor="end" fill="#748b84" font-size="11">${(v*max).toFixed(1)}</text>`).join('')}${layer}<path d="M255 35V210" stroke="#94aba1" stroke-dasharray="3 4"/><polyline points="${values.map((v,i)=>`${px(i)},${py(v)}`).join(' ')}" fill="none" stroke="#277e6c" stroke-width="3"/>${values.map((v,i)=>`<circle cx="${px(i)}" cy="${py(v)}" r="5" fill="${overlay&&kind==='gas'&&v>1.2?'#b4762f':'#277e6c'}" stroke="white" stroke-width="2"><title>相对点 ${i-5}：${v.toFixed(3)} ${kind==='gas'?'%':'min/m'}</title></circle>`).join('')}<text x="45" y="232" font-size="12" fill="#6a8279">−5</text><text x="255" y="232" text-anchor="middle" font-size="12" fill="#6a8279">0 · 中心点</text><text x="465" y="232" text-anchor="end" font-size="12" fill="#6a8279">+5</text><text x="45" y="20" font-size="12" fill="#6a8279">${kind==='gas'?'全烃 TG（%）':'钻时（min/m）'}</text></svg>`;
}
function input(kind,row,stage,model,k,pos){
 if(kind==='cuttings')return grid(row.x,12,'共同输入：岩屑灰度纹理',{unit:true,selected:stage===3?convolution(model,row.x,k,pos).indices:[]});
 if(kind==='fluorescence')return grid(row.x,3,'校正后荧光邻域',{unit:true,selected:[4]});
 if(kind==='report'){let text=esc(row.meta.text);g.NeuralLab.VOCAB.forEach(w=>{text=text.replaceAll(w,`<mark>${w}</mark>`);});return `<div class="ns-document"><span>现场记录 · 教学文本</span><p>${text}</p><small>高亮为词表命中；其他文字保留用于阅读。</small></div>`;}
 return signal(kind,row.x,stage===1);
}
function bars(labels,values,cls,format=percent){return `<div class="ns-bars ${cls}">${values.map((v,i)=>`<div><span>${esc(labels[i])}</span><div><i style="width:${v*100}%"></i></div><b>${format(v)}</b></div>`).join('')}</div>`;}
function create(host,actions){
 let state,stage=3,kernel=0,position=44,cinema=null,first=true;
 const steps=['观察录井输入','常规规则判别','ML · 近邻投票','DL · 特征计算','对照识别结果'];
 function content(s){
  const {kind,row,model,forward:f,neighbor:n,rule:r,meta:M,session,result}=s,E=g.NeuralLab,ctx=contexts[kind];
  if(M.cnn&&stage===3)return '<div id="ns-cinema-host"></div>';
  if(stage===0){
   let visual='';
   if(kind==='cuttings')visual=`<div class="ns-before">${grid(row.meta.sourcePixels||row.x,12,'拍摄扰动前纹理',{unit:true})}<div><b>同一岩屑纹理，成像条件会改变外观</b><p>${row.meta.capture?`光照增益 ${row.meta.capture.gain.toFixed(2)}<br>旋转 ${row.meta.capture.rotationDegrees.toFixed(1)}°<br>失焦混合 ${row.meta.capture.blurMix.toFixed(2)}`:'本次没有加入拍摄差异。'}</p></div></div>`;
   else if(kind==='report')visual=`<div class="ns-wordgrid">${E.VOCAB.map((w,i)=>`<span class="${row.x[i]?'hit':''}">${w}<b>${row.x[i]}</b></span>`).join('')}</div>`;
   else if(kind==='fluorescence')visual=`<div class="ns-numbergrid">${row.x.map((v,i)=>`<span class="${i===4?'center':''}">${v.toFixed(3)}<small>${i===4?'待判中心':'邻域像素'}</small></span>`).join('')}</div>`;
   else visual=`<div class="ns-signal-values">${row.x.map((v,i)=>`<span>${i-5}<b>${(v*(kind==='gas'?4:12)).toFixed(2)}</b></span>`).join('')}</div><p class="ns-note">${kind==='gas'?'数值对应左图 11 个采样点。模型同时读取整段波形，而不是只看峰值。':'这里使用工况补偿后的曲线；网络输出“界面附近 / 无界面”，不直接给出具体地层名称。'}</p>`;
   return `<span class="ns-kicker">01 / INPUT</span><h3>先看清模型实际收到什么</h3><p>${ctx[2]}</p>${visual}<div class="ns-callout">三条路径使用同一个输入。真实标签仅用于最后核对，不作为预测输入。</div>`;
  }
  if(stage===1)return `<span class="ns-kicker rule">02 / FIXED RULE</span><h3>${esc(E.CONVENTIONAL[kind].name)}</h3><p>${esc(E.CONVENTIONAL[kind].rule)}</p><div class="ns-evidence-values">${r.evidence.map(([name,value])=>`<div><span>${esc(name)}</span><strong>${Number.isInteger(value)?value:value.toFixed(3)}</strong></div>`).join('')}</div><div class="ns-branch"><span>测量输入特征</span><i>↓</i><span>${esc(r.reason)}</span><i>↓</i><b>${M.labels[r.pred]}</b></div><p class="ns-note">固定教学规则，不从样本学习，不代表人工专家的实测表现。</p>`;
  if(stage===2)return `<span class="ns-kicker ml">03 / MACHINE LEARNING</span><h3>从训练库找到最相似的 5 个样本</h3><p>${kind==='cuttings'?'按亮度、离散度和横纵梯度 4 个特征检索。':'按与当前样本相同的输入向量检索。'}距离由训练集标准化后的特征计算。</p><div class="ns-neighbors">${n.neighbors.map((v,i)=>{const near=session.data.train[v.index];return `<div style="--class-color:${colors[v.label]}"><small>近邻 ${i+1} · #${v.index+1}</small><div class="ns-thumb">${input(kind,near,0,model,0,0)}</div><b>${M.labels[v.label]}</b><span>d = ${v.distance.toFixed(3)}</span></div>`;}).join('')}</div><p class="ns-note">下方是实际投票数，不是概率。测试标签未参与距离计算。</p>${bars(M.labels,n.votes.map(v=>v/5),'ml',v=>Math.round(v*5)+' 票')}<div class="ns-callout ml">多数票 → <b>${M.labels[n.pred]}</b>。k-NN 不随神经网络的训练轮次更新。</div>`;
  if(stage===3){
   let visual;
   if(M.cnn){const c=convolution(model,row.x,kernel,position);visual=`<div class="ns-conv-controls"><label>卷积核<select id="ns-kernel">${[0,1,2,3].map(i=>`<option value="${i}" ${i===kernel?'selected':''}>第 ${i+1} 个卷积核</option>`).join('')}</select></label><label>滑动位置 · 第 ${c.row+1} 行 / 第 ${c.col+1} 列<input id="ns-position" type="range" min="0" max="99" value="${position}"></label></div><div class="ns-conv-flow"><div>${grid(model.conv.w.slice(kernel*9,kernel*9+9),3,'当前卷积核权重',{signed:true})}<small>可训练 3 × 3 权重<br>紫：正 / 橙：负</small></div><i>→</i><div>${grid(f.conv.slice(kernel*100,kernel*100+100),10,'卷积激活图',{selected:[position]})}<small>10 × 10 实际激活<br>深色：响应较强</small></div><i>→</i><div>${grid(f.pooled.slice(kernel*25,kernel*25+25),5,'平均池化结果')}<small>5 × 5 平均池化<br>每 2 × 2 区域取均值</small></div></div><div class="ns-callout dl">左图橙框 3 × 3 区域 → Σ[(像素 − 0.5) × 权重] + 偏置 = <b>${c.sum.toFixed(4)}</b><br>ReLU 保留非负响应 → <b>${c.response.toFixed(4)}</b>（右侧橙框位置）</div>`;}
   else visual=`<div class="ns-mlp-flow"><div>${grid(f.acts[1],10,'第一隐藏层实际激活')}<small>输入 ${M.input} 维 → 隐藏层 20 个单元</small></div><i>→</i><div>${grid(f.acts[2],6,'第二隐藏层实际激活')}<small>第二隐藏层 · 12 个单元</small></div></div><p class="ns-note">每格对应真实前向计算的神经元响应；各层按自身最大值着色，深色表示响应较强，颜色不能跨层比较。响应不等于因果解释。</p>`;
   return `<span class="ns-kicker dl">04 / DEEP LEARNING · ${M.cnn?'CNN':'MLP'}</span><h3>${M.cnn?'滑动卷积核，看局部纹理怎样被提取':'输入如何经过两层网络形成分类分数'}</h3><p>${result?'使用验证集选出的第 '+result.bestEpoch+' 轮权重。':'当前尚未完成训练验收；这里显示当前权重的真实计算。'}</p>${visual}`;
  }
  let segmentation='';if(kind==='fluorescence'&&result){const seg=E.segment(model,session.options.seed,session.options.noise);segmentation=`<span class="ns-kicker dl">额外图像 / PIXEL SEGMENTATION</span><h3>把邻域判别拼成一张发光区域图</h3><p>对一张额外留出图像的每个像素提取 3 × 3 邻域，再用同一个 MLP 逐像素推理。</p><div class="ns-segmentation">${[[seg.pixels,'校正后输入'],[seg.pred,'MLP 发光掩膜'],[seg.truth,'合成真值'],[seg.pred.map((v,i)=>+(v!==seg.truth[i])),'错误像素']].map(([x,label])=>`<div>${grid(x,16,label,{unit:true})}<small>${label}</small></div>`).join('')}</div><div class="ns-callout dl">像素准确率：<b>${percent(seg.pred.filter((v,i)=>v===seg.truth[i]).length/seg.truth.length)}</b> · 16 × 16 个实际像素预测</div><p class="ns-note">这张额外图像的像素准确率与主对照的 72 个测试窗口准确率分别计算。掩膜只表示教学发光区域，不推断含油量。</p><button type="button" class="btn" data-ns-action="results">查看三种方法的整体对照 ↓</button>`;}
  const pred=f.probabilities.indexOf(Math.max(...f.probabilities));
  return `<span class="ns-kicker">05 / VERIFY</span><h3>同一份输入，三种方法得到了什么？</h3><div class="ns-truth">核对标签：<b>${M.labels[row.c]}</b><small>合成数据的预设真值，仅用于评分</small></div><div class="ns-verdicts">${[['常规规则',r.pred,'rule'],['ML · k-NN',n.pred,'ml'],['DL · '+(M.cnn?'CNN':'MLP'),pred,'dl']].map(([name,p,cls])=>`<div class="${cls}"><span>${name}</span><b>${M.labels[p]}</b><em class="${p===row.c?'correct':'wrong'}">${p===row.c?'✓ 正确':'× 误判'}</em></div>`).join('')}</div><p>${result?'这一份样本只能说明一次判断。完整效果请看下方同一批 72 个测试样本的统计。':'深度学习尚未完成训练，当前判别不能作为最终效果。先运行训练，再比较。'}</p><button type="button" class="btn" data-ns-action="results">查看 72 个样本的整体对照 ↓</button>${segmentation?`<details class="ns-extra-mask"><summary>展开额外图像的逐像素分割</summary>${segmentation}</details>`:String()}`;
 }
 function render(){if(!state)return;if(cinema){cinema.dispose();cinema=null;}const s=state,ctx=contexts[s.kind];
 const accuracyStrip=`<div class="ns-accuracy-strip" aria-label="同一测试集的三种方法准确率">${[['常规方式 · 固定规则','conventional','rule'],['ML · 机器学习','baseline','ml'],['DL · 深度学习','nn','dl']].map(([name,key,cls])=>`<section class="${cls}"><h3>${name}</h3><strong>${s.result?percent(s.result[key].accuracy):'—'}</strong><span>测试准确率</span><div class="ns-accuracy-track"><i style="width:${s.result?s.result[key].accuracy*100:0}%"></i></div><p>${s.result?'同一批 72 个测试样本':'完成训练后显示'}</p></section>`).join('')}</div>`;
  host.innerHTML=`<div class="ns-heading"><div><span class="ns-kicker">录井可视化工作台</span><h2>${ctx[0]}</h2><p>${ctx[1]}</p></div><span class="ns-state">${s.result?'已训练 · 第 '+s.result.bestEpoch+' 轮权重':'尚未完成训练验收'}</span></div>${accuracyStrip}<div class="ns-toolbar"><label>当前测试样本<select id="ns-sample" aria-label="工作台测试样本">${s.session.data.test.map((r,i)=>`<option value="${i}" ${i===s.index?'selected':''}>样本 ${String(i+1).padStart(2,'0')} / 72</option>`).join('')}</select></label><button type="button" class="btn" data-ns-action="prev" ${s.index===0?'disabled':''}>← 上一个</button><button type="button" class="btn" data-ns-action="next" ${s.index===71?'disabled':''}>下一个 →</button><button type="button" class="btn primary" data-ns-action="train" ${s.running?'disabled':''}>${s.meta.cnn?'训练并播放完整动画':'训练并比较准确率'}</button><button type="button" class="btn" data-ns-action="settings">调整训练参数</button></div><nav class="ns-steps" aria-label="样本处理过程">${steps.map((name,i)=>`<button type="button" data-ns-step="${i}" aria-pressed="${stage===i}" class="${stage===i?'active':''} ${i===1?'rule':i===2?'ml':i===3?'dl':''}"><small>0${i+1}</small>${name}</button>`).join('')}</nav><div class="ns-body ${s.meta.cnn&&stage===3?'ns-cnn-wide':''}"><section class="ns-source"><div class="ns-source-head"><b>共同输入 · 样本 ${s.index+1}</b><small>${ctx[3]}</small></div><div class="ns-source-image">${input(s.kind,s.row,stage,s.model,kernel,position)}</div><div class="ns-source-foot">${s.kind==='cuttings'?'浅 → 深：像素值由低到高。纹理是合成输入，不是真实岩屑照片。':s.kind==='fluorescence'?'橙框是待判断的中心像素。浅 → 深：校正强度由低到高。':s.kind==='report'?'模型读取关键词向量，原文同时保留用于人工核查。':'横轴是相对采样点，不代表真实井深。悬停采样点可查看数值。'}<b>输入保持一致 → 切换上方路径观察判断差别</b></div></section><section class="ns-process" aria-live="polite">${content(s)}</section></div><div class="ns-footer"><span id="ns-live-status" role="status">${s.running?'训练进行中…':s.result?'已完成真实训练与独立测试':'可先浏览输入与算法步骤，再运行训练。'}</span><button type="button" class="btn" data-ns-action="step-next">${stage===4?'返回输入 ↺':'下一步：'+steps[stage+1]+' →'}</button></div>`;
  if(s.meta.cnn&&stage===3)cinema=CNNCinema.mount(host.querySelector('#ns-cinema-host'),s,{train:trainAndPlay});
  host.querySelectorAll('[data-ns-step]').forEach(b=>b.onclick=()=>{stage=+b.dataset.nsStep;render();host.querySelector(`[data-ns-step="${stage}"]`).focus({preventScroll:true});});
  host.querySelector('#ns-sample').onchange=e=>actions.sample(+e.target.value);
  host.querySelectorAll('[data-ns-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.nsAction;if(a==='prev'||a==='next')actions.sample(s.index+(a==='prev'?-1:1));else if(a==='step-next'){stage=(stage+1)%5;render();host.querySelector('[data-ns-action="step-next"]').focus({preventScroll:true});}else if(a==='train')trainAndPlay();else actions[a]();});
  const k=host.querySelector('#ns-kernel'),p=host.querySelector('#ns-position');if(k)k.onchange=e=>{kernel=+e.target.value;render();host.querySelector('#ns-kernel').focus({preventScroll:true});};if(p)p.onchange=e=>{position=+e.target.value;render();host.querySelector('#ns-position').focus({preventScroll:true});};
 }
 async function trainAndPlay(){if(state.running)return;await actions.train();if(state.result&&state.meta.cnn){stage=3;render();cinema.play();}}
 return{update:s=>{state=s;if(first){stage=s.meta.cnn?3:0;first=false;}render();},stage:i=>{stage=i;render();},busy:(busy,epoch,total)=>{if(state)state.running=busy;const b=host.querySelector('[data-ns-action="train"]');if(b)b.disabled=busy;const status=host.querySelector('#ns-live-status');if(status)status.textContent=busy?`神经网络真实训练：${epoch} / ${total} 轮；k-NN 与固定规则不逐轮训练。`:state?.result?'已完成真实训练与独立测试':'尚未完成训练验收';}};
}
const api={create,convolution,grid,signal};if(typeof module!=='undefined'&&module.exports)module.exports=api;else g.NeuralStudio=api;
})(typeof window!=='undefined'?window:globalThis);
