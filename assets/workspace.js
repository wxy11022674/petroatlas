(function (global) {
  'use strict';
  const A = global.ATLAS, P = global.AtlasPortal, esc = K.esc;
  const catalog = Object.fromEntries((global.AtlasCatalog || []).map(c => [c.scene, c]));
  const learningKinds = new Set(['classify', 'regress', 'optimize', 'repair', 'geometry', 'stress', 'forecast', 'calibrate']);
  const neural = { m1: 'CNN 卷积神经网络', m2: 'MLP 时序窗口分类', m3: 'MLP 像素分类', m4: 'MLP 层界识别', m5: 'MLP 文本意图分类' };
  const visualNames = { image: '原图 · 识别结果 · 真值', classify: '样本分布 · 决策边界', regress: '预测散点 · 误差对照', optimize: '响应热力图 · 可行区域', anomaly: '信号曲线 · 异常区间', retrieve: '关系图 · 证据排序', arrival: '地震波形 · 拾取位置', segment: '测井曲线 · 分层结果', repair: '缺失区间 · 重建对照', trajectory: '井眼轨迹 · 目标路径', geometry: '井眼剖面 · 间隙变化', stress: '载荷曲线 · 代理预测', forecast: '历史曲线 · 未来预测', calibrate: '标定散点 · 校正误差', balance: '液位曲线 · 物料平衡', quality: '异常高亮 · 字段校验' };
  function progress() { try { const data=JSON.parse(localStorage.getItem('petroatlas-explored')||'{}'); return data && typeof data==='object' ? data : {}; } catch (_) { return {}; } }
  function meta(sc, c) {
    const item = catalog[sc.id];
    if (!item || c && c.id !== item.id) return { type: 'custom', label: '扩展案例', algorithm: c?.title || sc.name, visual: '专业背景 · 流程 · 演示' };
    if (neural[sc.id]) return { type: 'dl', label: '机器学习 + 深度学习', algorithm: neural[sc.id], visual: '输入特征 · 学习曲线 · 预测对照' };
    return { type: learningKinds.has(item.kind) ? 'ml' : 'base', label: learningKinds.has(item.kind) ? '机器学习' : '规则 / 机理算法', algorithm: item.algorithm, visual: visualNames[item.kind] || '输入 · 计算 · 输出' };
  }
  function badges(sc, c) {
    const m = meta(sc, c);
    return m.type === 'dl' ? '<span class="ux-badge ml">机器学习 · k-NN</span><span class="ux-badge dl">深度学习 · ' + (sc.id === 'm1' ? 'CNN' : 'MLP') + '</span>' : '<span class="ux-badge ' + m.type + '">' + esc(m.label) + '</span>';
  }
  function preview(sc) {
    if(sc.id==='m5')return '<svg viewBox="0 0 340 150" role="img" aria-label="文本输入与意图分类示意"><rect x="18" y="17" width="112" height="116" rx="9" fill="#fff" stroke="#ccddd0"/><path d="M35 42h77M35 60h59M35 78h77M35 96h48M35 114h67" stroke="#8ca997" stroke-width="5"/><path d="M146 75h38m-7-6 7 6-7 6" fill="none" stroke="#8ca997"/><rect x="208" y="30" width="91" height="18" rx="5" fill="#9e89ca"/><rect x="208" y="66" width="57" height="18" rx="5" fill="#bcb0d7"/><rect x="208" y="102" width="34" height="18" rx="5" fill="#d8cfe7"/></svg>';
    if (neural[sc.id]) {
      if (sc.id === 'm1') return `<svg viewBox="0 0 340 150" role="img" aria-label="岩屑图像到神经网络的流程示意"><rect x="14" y="20" width="100" height="110" rx="12" fill="#ebdfc9"/>${Array.from({length:15},(_,i)=>`<circle cx="${30+i%3*32}" cy="${37+Math.floor(i/3)*19}" r="${5+i%3}" fill="${['#c4a474','#8099a3','#a5b693'][i%3]}"/>`).join('')}<path d="M124 75h25m-6-6 6 6-6 6" fill="none" stroke="#8daca1"/>${[0,1,2].map(col=>[0,1,2,3].map(row=>`${col<2?[0,1,2,3].map(r=>`<path d="M${169+col*63} ${34+row*28}L${232+col*63} ${34+r*28}" stroke="#a3a5d8" opacity=".35"/>`).join(''):''}<circle cx="${169+col*63}" cy="${34+row*28}" r="8" fill="${['#5b9fc3','#8b79cb','#538f7d'][col]}"/>`).join('')).join('')}</svg>`;
      if (sc.id === 'm3') return `<svg viewBox="0 0 340 150" role="img" aria-label="荧光输入与分割掩膜示意"><rect x="15" y="20" width="125" height="110" rx="10" fill="#193944"/><rect x="200" y="20" width="125" height="110" rx="10" fill="#e5ebf6"/>${Array.from({length:15},(_,i)=>`<circle cx="${35+i%5*21}" cy="${43+Math.floor(i/5)*31}" r="${7+i%4}" fill="#bbc978" opacity="${.4+i%4*.15}"/><circle cx="${220+i%5*21}" cy="${43+Math.floor(i/5)*31}" r="${7+i%4}" fill="#8471c2"/>`).join('')}<path d="M153 75h33m-6-6 6 6-6 6" stroke="#8daca1" fill="none"/></svg>`;
    }
    return global.AtlasFull.thumb(catalog[sc.id] || {scene:sc.id});
  }
  function card(sc) {
    const m = meta(sc), item = catalog[sc.id];
    return `<article class="ux-card"><a class="ux-card-visual" href="#/scene/${sc.id}" aria-label="了解${esc(sc.name)}">${preview(sc)}<span>${esc(sc.stageName)} / ${sc.id.toUpperCase()}</span></a><div class="ux-card-body"><div class="ux-badges">${badges(sc)}</div><h3><a href="#/scene/${sc.id}">${esc(sc.name)}</a></h3><p>${esc(m.algorithm)}</p><div class="ux-card-views"><span>可视化</span>${esc(m.visual)}</div><div class="ux-card-actions"><a href="#/scene/${sc.id}">了解场景</a><a class="ux-start" href="#/scene/${sc.id}?tab=demo">进入实验 <span>→</span></a></div></div></article>`;
  }
  function cards(list) { return '<div class="ux-card-grid">' + list.map(card).join('') + '</div>'; }
  function stages() { return '<div class="ux-stage-grid">' + A.stages.map(st => `<a href="#/stage/${st.id}"><span>${String(st.idx).padStart(2,'0')}</span><b>${esc(st.name)}</b><small>${st.scenes.length} 个案例 →</small></a>`).join('') + '</div>'; }
  function bread(p) {
    const sc = p[0] === 'scene' ? A.index.byScene[p[1]] : null, st = sc ? A.index.byStage[sc.stageId] : p[0] === 'stage' ? A.index.byStage[p[1]] : null;
    let out = '<a href="#/">首页</a>';
    if (['scene','stage','explore','labmap','chain','method'].includes(p[0])) out += '<span>/</span><a href="#/explore">案例实验室</a>';
    if (st) out += '<span>/</span><a href="#/stage/' + st.id + '">' + esc(st.name) + '</a>';
    if (sc) out += '<span>/</span><b>' + esc(sc.name) + '</b>';
    if (p[0] === 'guide') out += '<span>/</span><b>使用指南</b>';
    if (['cases','admin'].includes(p[0])) out += '<span>/</span><b>案例管理</b>';
    return out;
  }
  P.header = function (p) {
    const cur = p[0] || 'home', isLibrary = ['explore','labmap','chain','stage','scene','method'].includes(cur);
    const sc = cur === 'scene' ? A.index.byScene[p[1]] : null, st = sc ? A.index.byStage[sc.stageId] : cur === 'stage' ? A.index.byStage[p[1]] : null;
    const side = st ? `<div class="ux-side-context"><div class="ux-side-label">当前环节 <a href="#/explore">切换 ↗</a></div><h3>${esc(st.name)} <small>${st.scenes.length} 个案例</small></h3><nav aria-label="本环节案例">${st.scenes.map((s,i)=>`<a href="#/scene/${s.id}" ${s.id===sc?.id?'aria-current="page"':''}><span>${i+1}</span>${esc(s.name)}</a>`).join('')}</nav></div>` : `<div class="ux-side-help"><span>学习路线</span><p>选择业务场景<br>理解专业背景<br>观察算法过程<br>动手比较结果</p><a href="#/stage/mudlogging">从录井 5 例开始 →</a></div>`;
    return `<aside class="p-sidebar ux-sidebar"><a class="p-brand" href="#/"><span>◈</span><div>Petro<span>Atlas</span><small>石油智能化可视化实验室</small></div></a><nav class="ux-main-nav" aria-label="主导航"><a href="#/" ${cur==='home'?'aria-current="page"':''}><span>⌂</span>学习总览</a><a href="#/explore" ${isLibrary?'aria-current="page"':''}><span>▦</span>案例实验室<small>61</small></a><a href="#/guide" ${cur==='guide'?'aria-current="page"':''}><span>☷</span>使用指南</a></nav>${side}<div class="ux-side-tools"><button data-import>＋ 添加案例</button><a href="#/cases">管理已接入案例 ↗</a></div></aside><header class="p-topbar ux-topbar"><div class="ux-top-path">${global.AtlasNavigation.header(p)}<nav class="ux-breadcrumb" aria-label="当前位置">${bread(p)}</nav></div><div class="ux-top-actions">${cur==='scene'?'<button class="ux-exit" data-case-tab="bg" hidden>退出实验 ↗</button>':''}<button class="ux-menu" aria-label="打开导航菜单" aria-expanded="false">☰</button></div></header><button class="ux-scrim" aria-label="关闭导航菜单" hidden></button>`;
  };
  P.footer = () => '<footer class="p-footer ux-footer"><span><b>PetroAtlas</b> · 石油智能化可视化实验室</span><span><a href="#/explore">全部案例</a> · <a href="#/guide">使用指南</a></span></footer>';
  P.home = function () {
    return `<main class="p-main ux-main"><section class="ux-home-hero"><div><span class="ux-eyebrow">PETROLEUM × MACHINE LEARNING</span><h1>从石油场景出发，<br>看懂 AI 怎样工作。</h1><p>看地层与信号如何变成数据，<br>亲手调参数，观察模型怎样学习和预测。</p><div class="ux-badges"><span class="ux-badge ml">机器学习 ML</span><span class="ux-badge dl">深度学习 DL</span><span class="ux-badge visual">交互可视化</span></div><div class="ux-hero-actions"><a class="ux-primary" href="#/stage/mudlogging">开始录井专题 →</a><a href="#/explore">浏览全部 61 个案例 ↗</a></div><div class="ux-inline-stats"><b>13 <small>作业环节</small></b><b>61 <small>可运行案例</small></b><b>5 <small>深度学习对照实验</small></b></div></div><figure class="ux-hero-visual"><div><span>岩屑岩性识别</span><small>方法示意</small></div>${preview(A.index.byScene.m1)}<div class="ux-visual-route"><span>岩屑图像<small>观察颗粒与纹理</small></span><i>→</i><span>学习特征<small>k-NN / CNN</small></span><i>→</i><span>岩性预测<small>查看误判与差异</small></span></div><a href="#/scene/m1?tab=demo">打开这个可视化实验 ↗</a></figure></section><div class="ux-learning-route"><span><b>01</b>选场景</span><i>→</i><span><b>02</b>看背景图解</span><i>→</i><span><b>03</b>理解方法流程</span><i>→</i><span><b>04</b>动手做实验</span></div><section class="ux-section"><div class="ux-section-title"><div><span class="ux-eyebrow">推荐从这里开始</span><h2>录井 · 机器学习与深度学习对照</h2><p>五个场景，分别观察图像、时序、像素与文本的学习过程。</p></div><a href="#/stage/mudlogging">进入专题 →</a></div>${cards(A.index.byStage.mudlogging.scenes)}</section><section class="ux-section"><div class="ux-section-title"><div><span class="ux-eyebrow">从总览到具体环节</span><h2>沿着石油作业链探索</h2><p>先选择业务环节，再进入该环节的案例。</p></div><a href="#/explore">全部案例 →</a></div>${stages()}</section></main>`;
  };
  function library(q) {
    const option = (v,label,current) => `<option value="${esc(v)}" ${v===current?'selected':''}>${esc(label)}</option>`;
    return `<main class="p-main ux-main"><div class="ux-page-title"><span class="ux-eyebrow">CASE LABORATORY</span><h1>案例实验室</h1><p>全部 61 个案例统一从这里进入。按业务环节或实际算法筛选，找到你想观察的问题。</p></div><div class="ux-library-tabs"><a href="#/explore" class="${q.view!=='stages'?'active':''}">按案例查找</a><a href="#/explore?view=stages" class="${q.view==='stages'?'active':''}">按 13 个环节浏览</a></div>${q.view==='stages'?stages():`<div class="ux-filters"><label class="ux-search"><span>⌕</span><input id="ux-search" aria-label="搜索案例" placeholder="搜索案例、业务问题或算法…" value="${esc(q.q||'')}"></label><select id="ux-stage" aria-label="筛选业务环节">${option('','全部环节',q.stage)}${A.stages.map(s=>option(s.id,s.name,q.stage)).join('')}</select><select id="ux-type" aria-label="筛选算法类型">${option('','全部算法类型',q.type)}${option('dl','深度学习 · 5 例',q.type)}${option('ml','机器学习（含对照实验）',q.type)}${option('base','规则 / 机理算法',q.type)}</select></div><details class="ux-more-filters" ${q.method||q.diff?'open':''}><summary>更多条件：应用方向与难度</summary><select id="ux-method" aria-label="筛选应用方向">${option('','全部应用方向',q.method)}${Object.entries(A.methods).map(([k,m])=>option(k,m.name,q.method)).join('')}</select><select id="ux-diff" aria-label="筛选案例难度">${option('','全部难度',q.diff)}${['低','中','高'].map(d=>option(d,d,q.diff)).join('')}</select></details><div class="ux-result-bar"><span id="ux-count" aria-live="polite"></span><button id="ux-clear">清除筛选</button></div><div id="ux-results"></div>`}</main>`;
  }
  P.explore = library;
  P.bind = function () {
    const search = document.getElementById('ux-search'); if (!search) return;
    const keys = ['q','stage','type','method','diff'], els = ['search','stage','type','method','diff'].map(k => document.getElementById('ux-'+k));
    function draw(save) {
      const [q,stage,type,method,diff] = els.map(el => el.value), text = q.trim().toLowerCase();
      const list = A.allScenes.filter(sc => {
        const m = meta(sc);
        return (!stage || sc.stageId===stage) && (!type || m.type===type || type==='ml' && m.type==='dl') && (!method || sc.methods.includes(method)) && (!diff || sc.diff===diff) && (!text || [sc.name,sc.point,sc.stageName,m.algorithm,m.label].join(' ').toLowerCase().includes(text));
      });
      document.getElementById('ux-count').textContent = '找到 '+list.length+' 个案例';
      document.getElementById('ux-results').innerHTML = list.length ? cards(list) : '<div class="ux-empty"><h3>没有匹配的案例</h3><p>换个关键词，或清除筛选后重新查找。</p></div>';
      if (save) { const params = new URLSearchParams(); keys.forEach((k,i)=>{if(els[i].value)params.set(k,els[i].value);}); try { history.replaceState(history.state,'','#/explore'+(params.size?'?'+params.toString():'')); } catch (_) {} }
    }
    els.forEach(el => el.addEventListener(el===search?'input':'change',()=>draw(true)));
    document.getElementById('ux-clear').onclick = () => {els.forEach(el=>el.value='');draw(true);}; draw(false);
  };
  function stage(st) {
    return `<main class="p-main ux-main"><div class="ux-page-title ux-stage-title"><div><span class="ux-eyebrow">环节 ${String(st.idx).padStart(2,'0')} / 13</span><h1>${esc(st.name)}${st.id==='mudlogging'?'智能化专题':''}</h1><p>${esc(st.blurb)}</p></div><span class="ux-stage-count">${st.scenes.length}<small>个可运行案例</small></span></div>${st.id==='mudlogging'?'<div class="ux-stage-note"><div class="ux-badges"><span class="ux-badge ml">机器学习 · k-NN</span><span class="ux-badge dl">深度学习 · CNN / MLP</span></div><p>在同一数据划分上比较两种方法，观察实际训练曲线、网络特征与预测结果。</p></div>':''}${cards(st.scenes)}<div class="ux-page-bottom"><a href="#/explore">← 返回全部案例</a><a href="#/explore?view=stages">切换业务环节 →</a></div></main>`;
  }
  function sceneHead(sc,c) {
    const m = meta(sc,c);
    return `<div class="detail-head ux-case-head"><div><span class="ux-eyebrow">${esc(sc.stageName)} / 案例 ${sc.id.toUpperCase()}</span><h1 class="dh-title">${esc(sc.name)}</h1><p class="ux-case-intro">${esc(c?.tabs.background?.lede || sc.intro)}</p><div class="ux-badges">${badges(sc,c)}<span class="ux-badge visual">可视化实验</span></div></div>${c?.tabs.demo?'<button class="ux-primary" data-case-tab="demo">进入可视化实验 →</button>':''}</div>`;
  }
  function background(sc,c) {
    const b=c.tabs.background, sections=b.sections||[];
    return `<section class="ux-background"><div class="ux-visual-heading"><span>01 / 专业背景</span><h2>先看懂这个场景</h2></div>${sections[0]?'<div class="ux-concept">'+(sections[0].html||sections[0].body||'')+'</div>':''}${sections.slice(1).map((s,i)=>`<details class="ux-detail" ${i===0?'open':''}><summary>${esc(s.title)}</summary><div>${s.html||s.body||''}</div></details>`).join('')}<div class="ux-next-step"><p>理解业务问题后，看看数据如何进入算法。</p><button data-case-tab="flow" class="ux-primary">下一步：方法流程 →</button></div></section>`;
  }
  function workflow(sc,c) {
    const w=c.tabs.workflow, steps=w.steps||[];
    return `<section class="ux-workflow"><div class="ux-visual-heading"><span>02 / 方法流程</span><h2>从输入数据，到可解释的结果</h2><p>点击每一步，查看输入、处理方式和输出。</p></div><div class="ux-flow-track" role="tablist" aria-label="案例流程步骤">${steps.map((s,i)=>`<button role="tab" id="ux-step-${i}" aria-controls="ux-flow-${i}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-flow-step="${i}"><span>0${i+1}</span><b>${esc(s.name)}</b><small>${esc(s.role||['输入','处理','学习','验证'][i]||'步骤')}</small></button>`).join('')}</div>${steps.map((s,i)=>`<div class="ux-flow-detail" id="ux-flow-${i}" role="tabpanel" aria-labelledby="ux-step-${i}" ${i?'hidden':''}><div class="ux-flow-number">0${i+1}</div><div><span>${esc(s.role||'当前步骤')}</span><h3>${esc(s.name)}</h3><p>${K.rich(s.do||'')}</p><div class="ux-flow-out"><b>观察结果</b><p>${K.rich(s.effect||'')}</p></div>${s.trap?'<details><summary>这一步需要注意什么</summary><p>'+K.rich(s.trap)+'</p></details>':''}</div></div>`).join('')}${w.metrics?'<div class="ux-flow-metrics"><h3>'+esc(w.metrics.title||'观察与验证')+'</h3>'+w.metrics.html+'</div>':''}${w.fails?'<details class="ux-detail"><summary>失败情形与改进思路</summary>'+K.fails(w.fails)+'</details>':''}<div class="ux-next-step"><button data-case-tab="bg" class="ux-secondary">← 背景图解</button><button data-case-tab="demo" class="ux-primary">下一步：动手实验 →</button></div></section>`;
  }
  function related(sc) {
    const list=A.index.byStage[sc.stageId].scenes, index=list.findIndex(s=>s.id===sc.id), prev=list[index-1],next=list[index+1],item=catalog[sc.id];
    return `<nav class="ux-case-pager" aria-label="案例间导航">${prev?`<a href="#/scene/${prev.id}"><small>← 上一个案例</small><b>${esc(prev.name)}</b></a>`:'<a href="#/stage/'+sc.stageId+'"><small>← 返回环节</small><b>'+esc(sc.stageName)+'案例目录</b></a>'}<a href="#/stage/${sc.stageId}" class="ux-directory">全部 ${list.length} 个案例</a>${next?`<a href="#/scene/${next.id}"><small>下一个案例 →</small><b>${esc(next.name)}</b></a>`:'<a href="#/explore"><small>继续探索 →</small><b>全部案例实验室</b></a>'}</nav>${item?'<div class="ux-case-tools"><button data-mark-scene="'+sc.id+'" aria-pressed="'+!!progress()[sc.id]+'">'+(progress()[sc.id]?'✓ 已探索':'○ 标记已探索')+'</button><a href="'+esc(item.zip)+'" download>下载本案例包 ↓</a><span>可导入原网站的“添加案例”</span></div>':''}`;
  }
  function guide(original) {
    const start=original.indexOf('<main'), end=original.lastIndexOf('</main>');
    const inner=original.slice(original.indexOf('>',start)+1,end);
    return `<main class="p-main ux-main"><div class="ux-page-title"><span class="ux-eyebrow">HOW TO EXPLORE</span><h1>怎样使用这个实验室</h1><p>从一个问题出发，把专业背景、算法过程与可视化结果连起来。</p></div><div class="ux-guide-grid">${[['01','找到案例','在案例实验室选择环节，或筛选“机器学习 / 深度学习”。','#/explore','选择案例'],['02','看背景与流程','先读专业图解，再逐步查看数据如何进入算法。','#/scene/m1','查看示例'],['03','动手比较结果','改变参数或开始训练，观察曲线、特征与预测的变化。','#/scene/m1?tab=demo','进入实验']].map(x=>`<article><span>${x[0]}</span><h2>${x[1]}</h2><p>${x[2]}</p><a href="${x[3]}">${x[4]} →</a></article>`).join('')}</div><details class="ux-detail"><summary>算法标签是什么意思？</summary><p><span class="ux-badge ml">机器学习</span> 从样本学习映射或利用已标注样本做预测，例如 k-NN、回归模型。</p><p><span class="ux-badge dl">深度学习</span> 录井 5 例实际训练 CNN 或双隐藏层 MLP，并与 k-NN 对照。</p><p><span class="ux-badge base">规则 / 机理算法</span> 用阈值、优化规则或物理关系计算。标签按当前演示的实际实现标注。</p></details><details class="ux-detail"><summary>如何添加、下载和管理案例？</summary><p>左侧“添加案例”支持直接选择 ZIP，无需先解压。可一次选择多个“一例一包”的 ZIP，逐包核对后批量添加；同名案例会分配新 id，已有案例保留。文件和文件夹导入仍可使用。每个案例底部可下载独立 ZIP。</p><button data-import class="ux-primary">＋ 添加案例</button> <a href="#/cases">打开案例管理 →</a></details><details class="ux-detail"><summary>实验数据与使用说明</summary><p>案例使用教学合成数据；数据和实验记录可以导出。录井实验的训练、验证与测试分开进行，网页指标用于学习方法。浏览器中的导入记录和学习记录不会跨设备同步。</p><a href="docs/网站亮点与演示路线.html">查看网站亮点与演示路线 →</a></details><details class="ux-detail ux-developer-guide"><summary>开发者接入文档</summary>${inner}</details></main>`;
  }
  function activateTab(key) {
    document.querySelectorAll('[data-case-tab="demo"]').forEach(b=>b.hidden=key==='demo');
    document.querySelectorAll('.ux-exit').forEach(b=>b.hidden=key!=='demo');
    document.querySelector('.ux-case-head')?.classList.toggle('is-experiment',key==='demo');
  }
  function bind() {
    document.body.classList.remove('ux-menu-open');
    const menu=document.querySelector('.ux-menu'), scrim=document.querySelector('.ux-scrim');
    const toggle=open=>{document.body.classList.toggle('ux-menu-open',open);menu?.setAttribute('aria-expanded',String(open));if(scrim)scrim.hidden=!open;};
    if(menu)menu.onclick=()=>toggle(!document.body.classList.contains('ux-menu-open'));
    if(scrim)scrim.onclick=()=>toggle(false);
    const side=document.querySelector('.ux-sidebar');
    if(side){const close=document.createElement('button');close.className='ux-menu-close';close.setAttribute('aria-label','关闭侧栏');close.textContent='×';close.onclick=()=>{toggle(false);menu?.focus();};side.prepend(close);}
    document.querySelectorAll('[data-mark-scene]').forEach(b=>{b.onclick=()=>{const data=progress(),id=b.dataset.markScene;data[id]=!data[id];try{localStorage.setItem('petroatlas-explored',JSON.stringify(data));}catch(_){}b.setAttribute('aria-pressed',String(data[id]));b.textContent=data[id]?'✓ 已探索':'○ 标记已探索';};});
    const buttons=[...document.querySelectorAll('[data-flow-step]')];
    function select(i){buttons.forEach((b,j)=>{b.setAttribute('aria-selected',String(j===i));b.tabIndex=j===i?0:-1;document.getElementById('ux-flow-'+j).hidden=j!==i;});}
    buttons.forEach((b,i)=>{b.onclick=()=>select(i);b.onkeydown=e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%buttons.length;else if(e.key==='ArrowLeft')n=(i+buttons.length-1)%buttons.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=buttons.length-1;else return;e.preventDefault();select(n);buttons[n].focus();};});
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('ux-menu-open');document.querySelector('.ux-menu')?.setAttribute('aria-expanded','false');const scrim=document.querySelector('.ux-scrim');if(scrim)scrim.hidden=true;}});
  global.AtlasWorkspace={meta,badges,stage,sceneHead,background,workflow,related,guide,activateTab,bind};
})(window);
