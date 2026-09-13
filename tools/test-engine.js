// Runs the page's own rule engine in Node against a stubbed DOM, so every test in
// the procedure can be checked for all three SA1 salts without a browser.
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];

const noop=()=>{};
const el=new Proxy(function(){},{
  get(t,k){ if(k==='length') return 0; if(k==='style'||k==='classList'||k==='dataset') return el;
            if(k===Symbol.iterator) return [][Symbol.iterator].bind([]);
            if(k==='getBoundingClientRect') return ()=>({left:0,top:0,width:100,height:100});
            if(k==='map'||k==='forEach'||k==='filter') return ()=>[];
            return el; },
  set(){ return true; }, apply(){ return el; }, has(){ return true; }
});
global.document={querySelector:()=>el,querySelectorAll:()=>[],getElementById:()=>el,addEventListener:noop,
  createElementNS:()=>el,createElement:()=>el,body:el,documentElement:el};
global.window={matchMedia:()=>({matches:false}),addEventListener:noop};global.addEventListener=noop; global.localStorage={getItem:()=>null,setItem:noop};
global.requestAnimationFrame=noop; global.setTimeout=noop; global.clearTimeout=noop;
global.confirm=()=>true; global.print=noop;

const api=new Function(src+'\n;return {GUIDE,SALTS,SA1,simFor,evaluate,probeResult,RULES,CATIONS,ANIONS,setSalt:s=>{salt=s},getSalt:()=>salt,FLAME,ASH,bullets};')();

let fail=0,rows=0;
console.log('salt'.padEnd(22)+'| test');
for(const sec of api.GUIDE) for(const t of sec.tests){
  if(!t.sim) continue;
  for(const s of api.SA1){
    rows++;
    const r=api.simFor(t,s);
    const bad=[];
    if(!r.obs||r.obs==='—') bad.push('no observation');
    if(!r.inf) bad.push('no inference');
    if(/undefined|NaN|\[object/.test(r.obs+r.inf)) bad.push('bad interpolation');
    if(bad.length){ fail++; console.log('FAIL '+s.f.padEnd(18)+'| '+t.name+' -> '+bad.join(', ')+' :: '+JSON.stringify(r)); }
  }
}
console.log(`\n${rows} salt x test combinations evaluated, ${fail} broken.`);

// Every rule must return a well-formed result for every salt in the catalogue,
// heated and cold, so no reachable branch can throw or come back blank.
let crash=0;
for(const s of api.SALTS){
  for(const sec of api.GUIDE) for(const t of sec.tests){
    if(!t.sim) continue;
    for(const heated of [true,false]){
      const test={...t,sim:{...t.sim,heated}};
      try{ const r=api.simFor(test,s);
        if(/undefined|NaN|\[object/.test(r.obs+r.inf)){ crash++; console.log('BAD '+s.f+' / '+t.name+' heated='+heated+' :: '+r.obs+' | '+r.inf); }
      }catch(e){ crash++; console.log('THROW '+s.f+' / '+t.name+' heated='+heated+' :: '+e.message); }
    }
  }
}
console.log(`all ${api.SALTS.length} salts x every test x heated/cold: ${crash} problems.`);
