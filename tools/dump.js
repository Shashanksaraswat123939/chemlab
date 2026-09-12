const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const noop=()=>{};
const el=new Proxy(function(){},{get(t,k){if(k==='length')return 0;if(k==='style'||k==='classList'||k==='dataset')return el;
 if(k===Symbol.iterator)return [][Symbol.iterator].bind([]);if(k==='getBoundingClientRect')return()=>({left:0,top:0,width:100,height:100});
 if(k==='map'||k==='forEach'||k==='filter')return()=>[];return el;},set(){return true},apply(){return el},has(){return true}});
global.document={querySelector:()=>el,querySelectorAll:()=>[],getElementById:()=>el,addEventListener:noop,createElementNS:()=>el,createElement:()=>el,body:el,documentElement:el};
global.window={matchMedia:()=>({matches:false})};global.localStorage={getItem:()=>null,setItem:noop};global.requestAnimationFrame=noop;global.setTimeout=noop;global.clearTimeout=noop;global.confirm=()=>true;
const api=new Function(src+'\n;return {GUIDE,SA1,simFor};')();
for(const sec of api.GUIDE){
  console.log('\n### '+sec.sec);
  for(const t of sec.tests){ if(!t.sim) continue;
    console.log('\n  '+t.name);
    for(const s of api.SA1){ const r=api.simFor(t,s);
      console.log('    '+s.f.padEnd(12)+' obs: '+r.obs+'\n    '+' '.repeat(12)+' inf: '+r.inf); }
  }
}
