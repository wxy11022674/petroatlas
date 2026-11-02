(function(g){'use strict';
const LIMIT=6*1024*1024;
function crc(b){let c=-1;for(const n of b){c^=n;for(let k=0;k<8;k++)c=c>>>1^((c&1)?0xedb88320:0);}return(c^-1)>>>0;}
function decode(bytes){
 if(!g.fflate)throw Error('ZIP 解压组件未加载，请刷新页面');
 const b=new Uint8Array(bytes);if(b.length>LIMIT)throw Error('压缩文件超过 6 MB');
 const v=new DataView(b.buffer,b.byteOffset,b.byteLength);let end=-1;
 for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(v.getUint32(i,true)===0x06054b50&&i+22+v.getUint16(i+20,true)===b.length){end=i;break;}
 if(end<0)throw Error('ZIP 文件不完整或格式错误');
 const count=v.getUint16(end+10,true),start=v.getUint32(end+16,true),len=v.getUint32(end+12,true);
 if(v.getUint16(end+4,true)||v.getUint16(end+6,true)||count!==v.getUint16(end+8,true)||count>512||!count||start+len!==end)throw Error('不支持分卷、ZIP64 或文件过多的压缩包');
 let pos=start,total=0;const entries=[],seen=new Set();
 for(let i=0;i<count;i++){
  if(pos+46>end||v.getUint32(pos,true)!==0x02014b50)throw Error('ZIP 目录损坏');
  const flags=v.getUint16(pos+8,true),method=v.getUint16(pos+10,true),size=v.getUint32(pos+24,true),nl=v.getUint16(pos+28,true),el=v.getUint16(pos+30,true),cl=v.getUint16(pos+32,true);
  if(pos+46+nl+el+cl>end)throw Error('ZIP 目录不完整');
  const name=new TextDecoder('utf-8',{fatal:true}).decode(b.subarray(pos+46,pos+46+nl));
  if(flags&1||![0,8].includes(method))throw Error('不支持加密或此压缩算法，请使用普通 ZIP');
  if(!name||name.includes('\\')||name.startsWith('/')||/^[a-z]:/i.test(name)||name.split('/').some(x=>x==='..'||x==='.')||/[\x00-\x1f]/.test(name))throw Error('ZIP 包含非法路径');
  if(seen.has(name))throw Error('ZIP 包含重名文件：'+name);seen.add(name);
  if((v.getUint32(pos+38,true)>>>16&0xf000)===0xa000)throw Error('ZIP 不支持符号链接');
  total+=size;if(total>LIMIT)throw Error('解压后超过 6 MB，已停止');
  if(!name.endsWith('/')&&!name.startsWith('__MACOSX/')&&!name.endsWith('/.DS_Store')&&name!=='.DS_Store')entries.push({name,size,crc:v.getUint32(pos+16,true)});
  pos+=46+nl+el+cl;
 }
 if(pos!==end)throw Error('ZIP 目录长度错误');
 const data=g.fflate.unzipSync(b,{filter:e=>entries.some(n=>n.name===e.name&&n.size===e.originalSize)});
 const manifests=entries.filter(e=>/(^|\/)case\.json$/i.test(e.name));
 if(manifests.length!==1)throw Error('每个 ZIP 必须且只能包含一个 case.json 案例清单');
 const prefix=manifests[0].name.slice(0,-9);
 return entries.map(e=>{
  if(prefix&&!e.name.startsWith(prefix))throw Error('案例资源必须与 case.json 位于同一目录内');
  const x=data[e.name];if(!x||x.length!==e.size||crc(x)!==e.crc)throw Error('文件校验失败：'+e.name);
  return{name:e.name.slice(prefix.length),bytes:x,size:x.length};
 });
}
g.CaseZip={decode,crc};
})(typeof window==='object'?window:globalThis);
