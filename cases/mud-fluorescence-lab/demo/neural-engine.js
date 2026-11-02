(function (g) {
'use strict';
// Small, fully trainable networks. No pretrained weights or fabricated metrics.
const clip=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)), mean=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length);
function rng(seed){let s=seed>>>0;return()=>((s=(1664525*s+1013904223)>>>0)/4294967296);}
const argmax=a=>a.indexOf(Math.max(...a));
function softmax(a){const m=Math.max(...a),e=a.map(v=>Math.exp(v-m)),s=e.reduce((a,b)=>a+b);return e.map(v=>v/s);}
const VOCAB=['砂岩','荧光','全烃','连续','油气','显示','复核','接单根','短峰','工况','迟到','核对','钻压','钻时','界面','岩性','变化','校正','取样','记录','正常','异常','仪器','深度'];
const META={
 cuttings:{title:'岩屑图像：k-NN 与可训练 CNN',labels:['砂岩纹理','泥岩纹理','灰岩纹理'],input:144,cnn:true,unit:'归一化灰度',feature:'12 × 12 灰度像素',baseline:'k-NN / 亮度、离散度与横纵梯度',task:'从存在拍摄差异的教学纹理图像预测三类岩屑标签，比较手工特征与卷积特征。',limit:'图像为合成纹理。默认随机改变光照、方向与模糊程度；各类别共享相同的扰动规则。关闭拍摄差异可对照理想样本；两种设置都不代表真实井场精度。'},
 gas:{title:'气测窗口：k-NN 与双隐藏层 MLP',labels:['背景 / 短峰','持续异常'],input:11,unit:'全烃 TG / %',feature:'11 点校正后局部气测窗口',baseline:'k-NN / 相同的 11 点窗口',task:'将中心深度前后各 5 点作为输入，区分持续抬升与背景、短促工况峰。',limit:'窗口包含中心点之后的观测，属于离线辅助判别；不能称实时预警，也不解释油气水性质。'},
 fluorescence:{title:'荧光像素：k-NN 与局部窗口 MLP',labels:['背景','发光区域'],input:9,unit:'曝光校正后强度',feature:'3 × 3 像素邻域展开为 9 个数',baseline:'k-NN / 相同的像素邻域',task:'预测邻域中心像素是否属于合成发光区域，再逐像素拼成分割掩膜。',limit:'输入是展开的邻域，模型为 MLP；输出仅是教学发光掩膜，不是含油量或工业荧光级别。'},
 layering:{title:'钻时界面：k-NN 与窗口 MLP',labels:['无界面','界面附近'],input:11,unit:'校正钻时 / min·m⁻¹',feature:'11 点钻时窗口，工况补偿后输入',baseline:'k-NN / 相同的 11 点窗口',task:'学习局部钻时曲线是否出现层界特征；工况因子已按合成关系补偿。',limit:'本网络输出界面附近窗口的候选分数。它没有给地层命名；完整分层仍需与动态规划及其他资料复核。'},
 report:{title:'报告意图：k-NN 与文本 MLP',labels:['显示复核','工况排查','层界复核'],input:VOCAB.length,unit:'固定词表二值向量',feature:'24 维教学词表；未登录词不编码',baseline:'k-NN / 相同的词向量',task:'对三种复核意图进行分类，为受控报告选择核查方向，字段仍从原文抽取。',limit:'意图分类不是文本生成，也没有调用大语言模型。低分、陌生词和混合意图需人工复核。'}
};
function textVector(text){return VOCAB.map(t=>text.includes(t)?1:0);}
function imageFeatures(a){const m=mean(a);let dx=0,dy=0;for(let y=0;y<12;y++)for(let x=0;x<12;x++){if(x)dx+=Math.abs(a[y*12+x]-a[y*12+x-1]);if(y)dy+=Math.abs(a[y*12+x]-a[(y-1)*12+x]);}return[m,Math.sqrt(mean(a.map(v=>(v-m)**2))),dx/132,dy/132];}
function glowImage(random,noise=.18,size=16){const r=random,cx=4+r()*8,cy=4+r()*8,radius=3+r()*3,exposure=.65+r()*.8,amp=.42+r()*.35,truth=[],pixels=[];for(let y=0;y<size;y++)for(let x=0;x<size;x++){const on=(x-cx)**2+(y-cy)**2<radius**2;truth.push(+on);let v=on?amp:.08+r()*.12;if(r()<.04)v=on?.16:.6;pixels.push(clip((v+(r()+r()-1)*noise)*exposure)/exposure);}return{size,pixels,truth,exposure};}
function patch(a,x,y,n){const p=[];for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)p.push(a[clip(y+j,0,n-1)*n+clip(x+i,0,n-1)]);return p;}
function sample(kind,c,r,noise,id){let x=[],meta={};if(kind==='cuttings'){
 const phase=r()*Math.PI*2,phase2=r()*Math.PI*2,scale=.8+r()*.5,grains=Array.from({length:12},()=>[r()*12,r()*12,.5+r()]);
 for(let y=0;y<12;y++)for(let i=0;i<12;i++){let v=.45;if(c===0){v=.22;for(const [gx,gy,sz] of grains)v+=.44*Math.exp(-((i-gx)**2+(y-gy)**2)/(2*sz*sz));}if(c===1)v=.45+.26*Math.sin(y*1.6*scale+phase)+.035*Math.sin(i+phase2);if(c===2)v=.45+.22*Math.sin(i*.35+phase)*Math.cos(y*.4+phase2);x.push(clip(v+(r()+r()-1)*noise));}
 }else if(kind==='gas'){
 const base=.35+r()*.3,amp=1+r()*1.5,spike=r()<.7,offset=Math.floor(r()*7)+2;
 x=Array.from({length:11},(_,j)=>clip((base+(c?amp*Math.exp(-((j-5)**2)/(2*(2.3+r())**2)):(spike&&j===offset?amp:0))+(r()+r()-1)*noise*2)/4));
 }else if(kind==='fluorescence'){
 const im=glowImage(r,noise),ids=im.truth.map((v,i)=>v===c?i:-1).filter(i=>i>=0),pos=ids[Math.floor(r()*ids.length)];x=patch(im.pixels,pos%16,Math.floor(pos/16),16);meta={exposure:im.exposure};
 }else if(kind==='layering'){
 const base=2+r()*5,delta=(r()<.5?-1:1)*(1.7+r()*2.7),boundary=4+Math.floor(r()*3),weight=.8+r()*.8;
 const raw=Array.from({length:11},(_,j)=>(base+(c&&j>=boundary?delta:0)+(r()+r()-1)*noise*3)/weight);x=raw.map(v=>clip(v*weight/12));meta={weight,raw};
 }else{
 const words=[['砂岩','荧光','全烃','连续','油气','显示'],['接单根','短峰','工况','迟到','核对','仪器'],['钻压','钻时','界面','岩性','变化','校正']];
 let chosen=words[c].filter(()=>r()>.2);if(!chosen.length)chosen=[words[c][0]];if(r()<noise*1.5)chosen.push(words[(c+1)%3][Math.floor(r()*6)]);chosen.push(['取样','记录','深度','复核'][Math.floor(r()*4)]);
 const templates=['本次记录包含：WORDS，建议核查。','请对 WORDS 相关资料进行复核。','观察到 WORDS，保存现场记录。'];
 meta.text=templates[Number(id.split('-')[1])%3].replace('WORDS',chosen.join('、'));x=textVector(meta.text);
 }return{id,x,c,meta};}
// Camera nuisance variables are independent of the class label and the model.
// A separate RNG preserves the underlying samples when this option is toggled.
function captureImage(source,r){
 const rotationDegrees=(r()-.5)*45,gain=.65+r()*.7,blackLevel=(r()-.5)*.24,blurMix=r()*.65;
 const angle=rotationDegrees*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
 const pixel=(x,y)=>source[clip(y,0,11)*12+clip(x,0,11)];
 const rotated=source.map((_,index)=>{const x=index%12-5.5,y=Math.floor(index/12)-5.5,u=clip(x*cos-y*sin+5.5,0,11),v=clip(x*sin+y*cos+5.5,0,11),i=Math.floor(u),j=Math.floor(v),dx=u-i,dy=v-j;return pixel(i,j)*(1-dx)*(1-dy)+pixel(i+1,j)*dx*(1-dy)+pixel(i,j+1)*(1-dx)*dy+pixel(i+1,j+1)*dx*dy;});
 const pixels=rotated.map((value,index)=>{const x=index%12,y=Math.floor(index/12),smooth=mean(patch(rotated,x,y,12));return clip((value*(1-blurMix)+smooth*blurMix)*gain+blackLevel);});
 return{pixels,settings:{rotationDegrees,gain,blackLevel,blurMix}};
}
function dataset(kind,seed=17,noise=.18,captureVariation=true){const make=(split,n,s)=>{const r=rng(s),camera=rng(s+7401);return Array.from({length:n},(_,i)=>{const row=sample(kind,i%META[kind].labels.length,r,noise,`${split}-${split==='train'?0:split==='validation'?1:2}-${i}`);if(kind==='cuttings'&&captureVariation){const capture=captureImage(row.x,camera);row.meta={...row.meta,sourcePixels:row.x,capture:capture.settings};row.x=capture.pixels;}return row;});};return{kind,seed,noise,captureVariation:kind==='cuttings'&&captureVariation,train:make('train',144,seed+101),validation:make('validation',48,seed+202),test:make('test',72,seed+303)};}
function layer(input,output,r,last=false){return{input,output,w:Array.from({length:input*output},()=> (r()*2-1)*Math.sqrt((last?3:6)/input)),b:Array(output).fill(0)};}
function init(kind,seed=17){const r=rng(seed+401),cnn=!!META[kind].cnn,n=cnn?100:META[kind].input;return{kind,cnn,conv:cnn?{w:Array.from({length:36},()=> (r()*2-1)*Math.sqrt(6/9)),b:Array(4).fill(0)}:null,layers:cnn?[layer(n,16,r),layer(16,3,r,true)]:[layer(n,20,r),layer(20,12,r),layer(12,META[kind].labels.length,r,true)]};}
function forward(model,input){let a=input.slice(),conv=null,pooled=null;
 if(model.cnn){conv=Array(400).fill(0);for(let f=0;f<4;f++)for(let y=0;y<10;y++)for(let x=0;x<10;x++){let s=model.conv.b[f];for(let j=0;j<3;j++)for(let i=0;i<3;i++)s+=model.conv.w[f*9+j*3+i]*(input[(y+j)*12+x+i]-.5);conv[f*100+y*10+x]=Math.max(0,s);}pooled=Array(100).fill(0);for(let f=0;f<4;f++)for(let y=0;y<5;y++)for(let x=0;x<5;x++)for(let j=0;j<2;j++)for(let i=0;i<2;i++)pooled[f*25+y*5+x]+=conv[f*100+(2*y+j)*10+2*x+i]/4;a=pooled;}
 const acts=[a];model.layers.forEach((l,k)=>{let z=Array(l.output).fill(0);for(let j=0;j<l.output;j++){let s=l.b[j];for(let i=0;i<l.input;i++)s+=l.w[j*l.input+i]*a[i];z[j]=s;}a=k===model.layers.length-1?softmax(z):z.map(v=>Math.max(0,v));acts.push(a);});return{probabilities:a,acts,conv,pooled};}
function tensors(model){return[...(model.cnn?[model.conv.w,model.conv.b]:[]),...model.layers.flatMap(l=>[l.w,l.b])];}
const copy=model=>JSON.parse(JSON.stringify(model));
function gradients(model,rows){const groups=tensors(model).map(a=>Array(a.length).fill(0));let loss=0;const offset=model.cnn?2:0;
 for(const row of rows){const f=forward(model,row.x);loss-=Math.log(Math.max(1e-12,f.probabilities[row.c]));let delta=f.probabilities.slice();delta[row.c]-=1;
 for(let k=model.layers.length-1;k>=0;k--){const l=model.layers[k],a=f.acts[k],prev=Array(l.input).fill(0),dw=groups[offset+k*2],db=groups[offset+k*2+1];for(let j=0;j<l.output;j++){db[j]+=delta[j];for(let i=0;i<l.input;i++){dw[j*l.input+i]+=delta[j]*a[i];prev[i]+=l.w[j*l.input+i]*delta[j];}}delta=prev;if(k>0)delta=delta.map((v,i)=>f.acts[k][i]>0?v:0);}
 if(model.cnn){for(let fi=0;fi<4;fi++)for(let y=0;y<10;y++)for(let x=0;x<10;x++){const idx=fi*100+y*10+x;if(f.conv[idx]<=0)continue;const d=delta[fi*25+Math.floor(y/2)*5+Math.floor(x/2)]/4;groups[1][fi]+=d;for(let j=0;j<3;j++)for(let i=0;i<3;i++)groups[0][fi*9+j*3+i]+=d*(row.x[(y+j)*12+x+i]-.5);}}
 }groups.forEach(a=>a.forEach((v,i)=>a[i]=v/rows.length));return{groups,loss:loss/rows.length};}
function optimizer(model){return{step:0,m:tensors(model).map(a=>a.map(()=>0)),v:tensors(model).map(a=>a.map(()=>0))};}
function update(model,grad,opt,lr=.008){opt.step++;const b1=1-.9**opt.step,b2=1-.999**opt.step;tensors(model).forEach((a,k)=>a.forEach((v,i)=>{const d=clip(grad.groups[k][i],-5,5);opt.m[k][i]=.9*opt.m[k][i]+.1*d;opt.v[k][i]=.999*opt.v[k][i]+.001*d*d;a[i]-=lr*(opt.m[k][i]/b1)/(Math.sqrt(opt.v[k][i]/b2)+1e-8);}));}
function score(model,rows){const n=META[model.kind].labels.length,matrix=Array.from({length:n},()=>Array(n).fill(0)),predictions=[];let loss=0;for(const row of rows){const p=forward(model,row.x).probabilities,pred=argmax(p);matrix[row.c][pred]++;loss-=Math.log(Math.max(1e-12,p[row.c]));predictions.push({id:row.id,truth:row.c,pred,probabilities:p});}return{accuracy:predictions.filter(p=>p.truth===p.pred).length/rows.length,loss:loss/rows.length,matrix,predictions,macroF1:mean(matrix.map((r,i)=>2*r[i]/Math.max(1,r.reduce((a,b)=>a+b)+matrix.reduce((s,r)=>s+r[i],0))))};}
function knnModel(data){const extract=data.kind==='cuttings'?imageFeatures:x=>x.slice(),features=data.train.map(r=>extract(r.x)),mu=features[0].map((_,j)=>mean(features.map(f=>f[j]))),sd=mu.map((m,j)=>Math.max(.03,Math.sqrt(mean(features.map(f=>(f[j]-m)**2)))));const norm=x=>x.map((v,j)=>(v-mu[j])/sd[j]);return{kind:data.kind,train:data.train.map((r,i)=>({x:norm(features[i]),c:r.c})),mu,sd};}
function knnPredict(model,x){const f=model.kind==='cuttings'?imageFeatures(x):x,query=f.map((v,j)=>(v-model.mu[j])/model.sd[j]),near=model.train.map((r,index)=>({index,c:r.c,d:r.x.reduce((s,v,j)=>s+(v-query[j])**2,0)})).sort((a,b)=>a.d-b.d).slice(0,5),votes=Array(META[model.kind].labels.length).fill(0);near.forEach(r=>votes[r.c]++);return{pred:argmax(votes),votes,neighbors:near.map(r=>({index:r.index,label:r.c,distance:Math.sqrt(r.d)}))};}
function baselineScore(model,rows){const n=META[model.kind].labels.length,matrix=Array.from({length:n},()=>Array(n).fill(0)),predictions=rows.map(r=>{const pred=knnPredict(model,r.x).pred;matrix[r.c][pred]++;return{id:r.id,truth:r.c,pred};});return{predictions,matrix,accuracy:predictions.filter(r=>r.pred===r.truth).length/rows.length,macroF1:mean(matrix.map((r,i)=>2*r[i]/Math.max(1,r.reduce((a,b)=>a+b)+matrix.reduce((s,r)=>s+r[i],0))))};}
function shuffle(a,r){for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function createSession(kind,options={}){const seed=options.seed??17,data=dataset(kind,seed,options.noise??.18,options.captureVariation!==false),random=rng(seed+505);if(options.shuffleLabels){const labels=shuffle(data.train.map(r=>r.c),rng(seed+606));data.train.forEach((r,i)=>r.c=labels[i]);}
 const model=init(kind,seed),baseline=knnModel(data),initialTrain=score(model,data.train),initialValidation=score(model,data.validation);return{kind,options:{seed,noise:options.noise??.18,captureVariation:data.captureVariation,shuffleLabels:!!options.shuffleLabels,lr:options.lr??.008},data,model,opt:optimizer(model),random,epoch:0,history:[{epoch:0,trainLoss:initialTrain.loss,valLoss:initialValidation.loss,trainAccuracy:initialTrain.accuracy,valAccuracy:initialValidation.accuracy}],best:copy(model),bestEpoch:0,bestLoss:initialValidation.loss,baseline,initialWeights:tensors(model).map(a=>a.slice())};}
function trainEpoch(session){const s=session,order=shuffle(s.data.train.slice(),s.random);for(let i=0;i<order.length;i+=12)update(s.model,gradients(s.model,order.slice(i,i+12)),s.opt,s.options.lr);s.epoch++;const tr=score(s.model,s.data.train),va=score(s.model,s.data.validation);s.history.push({epoch:s.epoch,trainLoss:tr.loss,valLoss:va.loss,trainAccuracy:tr.accuracy,valAccuracy:va.accuracy});if(va.loss<s.bestLoss){s.bestLoss=va.loss;s.best=copy(s.model);s.bestEpoch=s.epoch;}return s.history.at(-1);}
function finish(session){const s=session,selected=copy(s.best),nn=score(selected,s.data.test),baseline=baselineScore(s.baseline,s.data.test),weights=tensors(selected);return{model:selected,nn,baseline,untrained:score(init(s.kind,s.options.seed),s.data.test),bestEpoch:s.bestEpoch,epochs:s.epoch,changed:weights.reduce((sum,a,k)=>sum+a.reduce((sum,v,i)=>sum+Math.abs(v-s.initialWeights[k][i]),0),0)};}
function segment(model,seed=17,noise=.18){const image=glowImage(rng(seed+9876),noise),pred=image.pixels.map((_,i)=>argmax(forward(model,patch(image.pixels,i%16,Math.floor(i/16),16)).probabilities));let tp=0,fp=0,fn=0;pred.forEach((v,i)=>{if(v&&image.truth[i])tp++;if(v&&!image.truth[i])fp++;if(!v&&image.truth[i])fn++;});return{...image,pred,f1:2*tp/Math.max(1,2*tp+fp+fn)};}
// Controlled local input removal. Replacement values use training inputs only.
function evidenceRegions(kind){
 if(kind==='cuttings')return Array.from({length:16},(_,i)=>({name:`第 ${Math.floor(i/4)+1} 行、第 ${i%4+1} 列纹理块`,indices:Array.from({length:9},(_,j)=>(Math.floor(i/4)*3+Math.floor(j/3))*12+i%4*3+j%3)}));
 if(kind==='report')return VOCAB.map((name,i)=>({name:'关键词「'+name+'」',indices:[i]}));
 if(kind==='fluorescence')return Array.from({length:9},(_,i)=>({name:i===4?'中心像素':`邻域像素（${Math.floor(i/3)+1}, ${i%3+1}）`,indices:[i]}));
 return Array.from({length:9},(_,i)=>({name:`窗口第 ${i+1}–${i+3} 个采样点`,indices:[i,i+1,i+2]}));
}
function removeEvidence(kind,input,train,region=0){
 const regions=evidenceRegions(kind),r=regions[region];if(!r)throw new Error('Unknown evidence region');
 const x=input.slice();r.indices.forEach(i=>{x[i]=kind==='report'?0:mean(train.map(row=>row.x[i]));});
 return{x,indices:r.indices.slice(),name:r.name,replacement:kind==='report'?'将选中词的编码置零':'替换为训练集对应位置的平均值'};
}
function scanEvidence(model,input,train){const base=forward(model,input).probabilities,target=argmax(base);return{target,base:base[target],regions:evidenceRegions(model.kind).map((r,i)=>{const x=removeEvidence(model.kind,input,train,i).x,probability=forward(model,x).probabilities[target];return{index:i,name:r.name,probability,delta:probability-base[target]};})};}
const api={META,VOCAB,rng,dataset,init,forward,tensors,gradients,optimizer,update,score,knnModel,knnPredict,baselineScore,createSession,trainEpoch,finish,segment,textVector,softmax,evidenceRegions,removeEvidence,scanEvidence};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else g.NeuralLab=api;
})(typeof window!=='undefined'?window:globalThis);
