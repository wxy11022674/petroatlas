/* Pure explanations and controlled experiment presets. No fabricated results. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MethodExplainer=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const profiles={
 image:['图像特征与空间分析','观测像素','计算局部特征','标记区域或类别','特征把人眼观察的亮暗、边缘或相似性转成可重复计算的量。噪声与阈值改变时，误报和漏检会同时影响评价。','保持种子不变，比较低噪声与高噪声，观察预测区域和真值的差异。'],
 classify:['机器学习 · k-NN','归一化业务特征','检索 k 个近邻并投票','预测类别与决策边界','相同类别在此合成特征空间中较接近，邻近训练样本可以提供分类证据。类别重叠时，距离近不保证标签相同。','比较相同样本下 k=1 与 k=15 的决策边界，核对测试误判。'],
 regress:['机器学习 · 岭回归','输入特征与训练标签','拟合系数并施加正则约束','连续数值预测','系数从训练数据估计特征与响应的关系；正则项限制系数过大。独立测试误差用来核对这种关系能否迁移到留出样本。','比较低噪声与高噪声；同时看模型与训练均值基线的测试 RMSE。'],
 optimize:['学习代理 + 约束寻优','训练观测与资源约束','拟合二次代理，搜索可行网格','当前设置与推荐组合','代理模型近似输入到响应的关系，再用约束排除不可执行组合。推荐仅是当前代理模型和网格内的最优点。','改变约束上限，查看可行域怎样收缩，推荐点是否仍可行。'],
 anomaly:['稳健统计 · 时序异常检测','多通道观测','中位数 / MAD 标准化与连续性筛选','报警区间','相对背景尺度的偏离使不同量纲的信号可比较；连续性规则过滤孤立短峰。阈值越高通常漏检越多。','同一观测分别要求连续 1 点、5 点，比较短峰误报与持续异常。'],
 retrieve:['案例推理 · 加权匹配','业务特征与候选方案原型','先排除不相容方案，再按证据排序','方案及各特征贡献','明确的排除条件避免推荐不相容方案，特征贡献解释排名来源。匹配分数表示相似程度。','改变关键特征权重，查看推荐顺序和贡献；分数不表示成功概率。'],
 arrival:['信号检测 · STA/LTA','多道地震波形','短窗与前置长窗能量求比','首个越阈值的候选到时','初至到来时短窗能量相对背景迅速增加，能量比将变化显露出来。噪声尖峰也可能造成提前触发。','同一道集调低、调高触发阈值，对照假拾取和漏拾取。'],
 segment:['序列推断 · 动态规划分层','按深度排列的曲线','最小化段内误差与层界数惩罚','分段拟合与候选层界','层内较稳定、层间均值变化的假设，把曲线简化为分段结构。惩罚项抑制把每个噪声波动当成新层。','同一曲线比较小惩罚和大惩罚，观察过分层与漏层。'],
 repair:['机器学习 · 辅助曲线岭回归','未遮挡样本与辅助曲线','拟合曲线间关系，重建遮挡区','缺失段预测','辅助曲线携带与目标曲线相关的信息，能为缺失区提供证据。已遮挡的目标真值只用于事后验收。','在同一缺失段切换线性插值与回归，观察误差和边界连续性。'],
 trajectory:['反馈控制 + 增益寻优','计划轨迹与当前横向偏差','按偏差调整航向并限制转角','受约束的跟踪轨迹','反馈把偏差带回控制输入，转角约束限制动作幅度。增益过大可能振荡；过小可能来不及纠偏。','同一靶点比较低、高反馈增益；路径 RMSE 与末端偏差一起看。'],
 geometry:['机器学习 · 偏心率岭回归','两侧带噪间隙','用几何生成的训练样本拟合回归','偏心率估计','两侧间隙的差异反映套管偏移，学习模型从带噪传感器中估计偏心率。几何真值提供可核对的基准。','保持几何不变，提高传感器噪声，查看独立测试 MAE。'],
 stress:['机器学习 · 力学代理回归','长度、温升与约束比例','学习含温升×约束交互项的响应','应力量级估计','已知简化力学关系提供训练标签，代理模型学习其中的组合效应。与力学真值的留出误差能检查拟合。','提高训练标签噪声，检查独立测试 RMSE；这不是强度设计验算。'],
 forecast:['机器学习 · 自回归外推','按时间排列的历史段','拟合滞后关系并递归外推','未来留出段预测','历史相邻时刻的关系为短期外推提供信息；预测误差会在递归中累积，走势变化时容易失效。','固定时间分界，比较不同观测噪声；未来真值不参与预测。'],
 calibrate:['参数学习 · 最小二乘校准','标准值与仪表示值对','估计零点与比例校正系数','校正后的流量','标准样本帮助识别系统偏移与比例误差。独立检验点比较校正前后误差，随机噪声仍然存在。','比较低、高随机噪声；核对校准前与校准后 RMSE。'],
 balance:['机理推断 · 物料平衡残差','液位、流入量与流出量','用守恒关系预测，再计算残差','泄漏候选报警','正常流量应解释液位变化，无法解释的亏损形成残差。传感器误差也会引起残差，所以需核对误报。','比较无泄漏与有泄漏条件，查看残差、阈值和误报 / 漏检。'],
 quality:['规则推理 · 结构抽取与审核','原始化验 CSV 文本','单位统一、范围与一致性检查','逐行问题及原文位置','先将不同单位变成可比较的量，再用显式规则发现缺失、重复和不一致。通过规则不等于通过工业验收。','切换示例与精简记录，查看问题如何对应到具体行号。']
};
function profile(c){
 const p=profiles[c.kind];if(!p)throw new Error('Unknown experiment kind: '+c.kind);
 let name=p[0];
 if(c.kind==='image')name=c.type==='spectral'?'原型分类 · 最近光谱原型':c.type==='denoise'?'信号处理 · 邻域均值滤波':c.type==='spatial'?'稳健标准化 · 空间异常评分':c.type==='fault'?'相邻道差分 · 断层候选检测':'图像分析 · 阈值与连通区域';
 return {name,input:p[1],operation:p[2],output:p[3],why:p[4],try:p[5],learned:['classify','regress','optimize','repair','geometry','stress','forecast','calibrate'].includes(c.kind)};
}
function number(n,d=3){return Number.isFinite(n)?n.toFixed(d):'—';}
function evidence(c,d,p){
 switch(c.kind){
 case'image':return c.type==='denoise'?`同一观测的输入 RMSE ${number(d.before)}，滤波后 ${number(d.after)}；误差可能因过度平滑而上升。`:c.type==='spectral'?`当前 ${d.input.length} 个像素中，分类准确率 ${(100*d.metrics.accuracy).toFixed(1)}%；混淆矩阵显示错分去向。`:`当前像素 F1 ${(100*d.metrics.f1).toFixed(1)}%；检出 ${d.components.length} 个连通区域，需同时检查误报与漏检。`;
 case'classify':return `在 ${d.test.length} 个独立测试点上，${d.test.filter(r=>r.label===r.pred).length} 个正确；k=${p.k}，红边标记误判。`;
 case'regress':case'forecast':return `同一留出集：模型 RMSE ${number(d.error)}，${c.kind==='forecast'?'末值保持':'训练均值'}基线 ${number(d.baseError)}。本次模型${d.error<d.baseError?'误差较低':d.error>d.baseError?'误差较高':'与基线相同'}。`;
 case'optimize':return `${d.feasible} / ${d.grid.length} 个组合满足约束；${d.best?'推荐点在可行域内，综合目标为 '+number(d.best.score):'当前没有可行组合，不能给出推荐'}。代理留出 RMSE ${number(d.error)}。`;
 case'anomaly':case'balance':return `逐点评价：误报 ${d.metrics.fp} 个、漏检 ${d.metrics.fn} 个，F1 ${(100*d.metrics.f1).toFixed(1)}%。真值只用于这里的评价。`;
 case'retrieve':return '排名与硬性排除项、各特征贡献一同展示；改变输入后应先核对排除条件，再比较总分。';
 case'arrival':return `道集有 ${d.rows.length} 个采样记录；下方按有效拾取统计误差，漏拾道单独显示，不能只看已拾取道的 MAE。`;
 case'segment':return `检出 ${d.boundaries.length} 个候选层界；曲线与界面位置一起显示，不能把噪声波动都解释为地层变化。`;
 case'repair':return `同一遮挡区：所选方法 RMSE ${number(d.error)}，线性插值基线 ${number(d.interpolationError)}。遮挡真值不参与拟合。`;
 case'trajectory':return `当前路径 RMSE ${number(d.error)}；枚举候选反馈增益后，最低路径误差对应增益 ${number(d.bestGain,2)}。`;
 case'geometry':return `${d.test.length} 个独立样本的偏心率 MAE ${number(d.error)}；传感器噪声 ${number(p.sensorNoise,2)}。`;
 case'stress':return `${d.test.length} 个独立样本的代理 RMSE ${number(d.error)} MPa；当前力学基线 ${number(d.max,1)} MPa，代理估计 ${number(d.surrogate,1)} MPa。`;
 case'calibrate':return `同一 ${d.test.length} 个独立检验点：校准前 RMSE ${number(d.before)}，校准后 ${number(d.after)}。`;
 case'quality':return `读取 ${d.records.length} 条记录，${d.valid} 条通过当前规则；发现 ${d.issues.length} 项问题，每项均保留行号。`;
 }
}
function scenario(c,which){
 const pair={image:[{noise:.03},{noise:.30}],classify:[{k:1},{k:15}],regress:[{noise:.01},{noise:.18}],optimize:[{budget:.3},{budget:.9}],anomaly:[{run:1},{run:5}],retrieve:[{weight:.2},{weight:5}],arrival:[{threshold:2},{threshold:10}],segment:[{penalty:10},{penalty:1500}],repair:[{method:'linear'},{method:'ridge'}],trajectory:[{gain:.1},{gain:.6}],geometry:[{sensorNoise:0},{sensorNoise:.2}],stress:[{trainNoise:0},{trainNoise:20}],forecast:[{noise:.005},{noise:.08}],calibrate:[{noise:0},{noise:5}],balance:[{leak:0},{leak:2}],quality:[{text:c.example},{text:String(c.example||'').split('\n').slice(0,3).join('\n')}]};
 return pair[c.kind][which];
}
return {profile,evidence,scenario};
});
