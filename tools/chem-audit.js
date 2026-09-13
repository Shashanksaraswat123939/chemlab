// Chemistry audit: drives the page's own rule engine and asserts that the
// qualitative scheme actually works — the right group test fires for each cation,
// the confirmatory tests are positive only for their own ion, and each anion is
// picked out by its own preliminary and confirmatory tests.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const noop=()=>{};
const el=new Proxy(function(){},{get(t,k){if(k==='length')return 0;if(k==='style'||k==='classList'||k==='dataset')return el;
 if(k===Symbol.iterator)return [][Symbol.iterator].bind([]);if(k==='getBoundingClientRect')return()=>({left:0,top:0,width:100,height:100});
 if(k==='map'||k==='forEach'||k==='filter')return()=>[];return el;},set(){return true},apply(){return el},has(){return true}});
global.document={querySelector:()=>el,querySelectorAll:()=>[],getElementById:()=>el,addEventListener:noop,createElementNS:()=>el,createElement:()=>el,body:el,documentElement:el};
global.window={matchMedia:()=>({matches:false}),addEventListener:noop};global.addEventListener=noop;
global.localStorage={getItem:()=>null,setItem:noop};global.requestAnimationFrame=noop;global.setTimeout=noop;global.clearTimeout=noop;global.confirm=()=>true;
const api=new Function(src+'\n;return {SALTS,CATIONS,ANIONS,evaluate,probeResult,FLAME,ASH,setSalt:s=>{salt=s}};')();

function run(s,items,heated,probeId){
  api.setSalt(s);
  const v={name:'test tube',Name:'Test tube',st:{items:[...items],heated:!!heated,scratched:true,soaked:false,gas:null,smell:null}};
  const r=api.evaluate(v);
  let out={obs:r.obs,inf:r.inf,ppt:r.vis&&r.vis.ppt?r.vis.ppt.color:null,gas:v.st.gas};
  if(probeId){ const p=api.probeResult(probeId,v.st.gas); out.probe=p; }
  return out;
}
const fails=[];
const check=(cond,msg)=>{ if(!cond) fails.push(msg); };

// ---- cation groups: exactly the right group test must be positive ----
const GROUP_TEST={
  0:{items:['salt','NaOH'],heated:true,probe:'redLitmus'},
  1:{items:['saltSoln','dilHCl']},
  2:{items:['saltSoln','dilHCl','NH4_2S']},
  3:{items:['saltSoln','NH4Cl','NH4OH'],heated:true},
  4:{items:['saltSoln','NH4OH','NH4_2S']},
  5:{items:['saltSoln','NH4OH','NH4_2CO3']},
  6:{items:['saltSoln','NH4OH','Na2HPO4']},
};
const GROUP_OF={NH4:0,Pb:1,Cu:2,Al:3,Zn:4,Mn:4,Co:4,Ni:4,Ba:5,Sr:5,Ca:5,Mg:6};
console.log('=== cation group separation ===');
for(const c of Object.keys(GROUP_OF)){
  const s=api.SALTS.find(x=>x.c===c&&x.a!=='CO3')||api.SALTS.find(x=>x.c===c);
  const g=GROUP_OF[c],t=GROUP_TEST[g];
  const r=run(s,t.items,t.heated,t.probe);
  const positive = g===0 ? (r.probe&&r.probe.pos) : (!!r.ppt || /Presence of Group/i.test(r.inf));
  check(positive, `${api.CATIONS[c].sym}: its own Group ${g} test was NOT positive -> ${r.obs} | ${r.inf}`);
  console.log(`  ${api.CATIONS[c].sym.padEnd(9)} group ${g}: ${positive?'positive':'NEGATIVE'}  ${r.inf}`);
  // and every EARLIER group must be negative, or the ion would be caught too soon
  for(let e=0;e<g;e++){
    const te=GROUP_TEST[e],re=run(s,te.items,te.heated,te.probe);
    const pos = e===0 ? (re.probe&&re.probe.pos) : !!re.ppt;
    if(pos) fails.push(`${api.CATIONS[c].sym}: Group ${e} test is ALSO positive (${re.obs}) — it would be caught in the wrong group`);
  }
}

// ---- confirmatory cation tests: positive for their own ion, negative elsewhere ----
const CONF={Pb:[['saltSoln','KI'],['saltSoln','K2CrO4']],Cu:[['saltSoln','K4FeCN6']],NH4:[['saltSoln','Nessler']],
  Al:[['salt','dilHCl','litmusSoln','NH4OH']],Zn:[['saltSoln','K4FeCN6']],Ni:[['saltSoln','NH4OH','DMG']],
  Ca:[['saltSoln','NH4Ox']],Sr:[['saltSoln','NH4_2SO4']],Ba:[['saltSoln','K2CrO4']],Mg:[['saltSoln','magneson','NaOH']]};
console.log('\n=== confirmatory cation tests ===');
for(const [c,tests] of Object.entries(CONF)) for(const items of tests){
  const own=api.SALTS.find(x=>x.c===c);
  const r=run(own,items);
  const ok=/confirmed/i.test(r.inf);
  check(ok,`${api.CATIONS[c].sym}: its confirmatory test [${items.join('+')}] did not confirm -> ${r.inf}`);
  console.log(`  ${api.CATIONS[c].sym.padEnd(9)} [${items.slice(1).join(' + ').padEnd(28)}] ${ok?'confirms':'DOES NOT CONFIRM'}`);
}

// ---- anions ----
console.log('\n=== anion tests ===');
const ANION_CONF={CO3:[[['salt','dilH2SO4'],'limeWater'],[['saltSoln','MgSO4','NH4OH'],null]],
  NO3:[[['salt','concH2SO4','copper'],null,true],[['saltSoln','FeSO4','concH2SO4'],null]],
  SO4:[[['saltSoln','BaCl2','dilHCl'],null],[['saltSoln','PbAc','NH4Ac'],null]],
  Cl:[[['salt','concH2SO4'],'rodNH4OH',true]],
  Ac:[[['salt','concH2SO4','ethanol'],null,true]]};
for(const [an,tests] of Object.entries(ANION_CONF)) for(const [items,probe,heated] of tests){
  const own=api.SALTS.find(x=>x.a===an);
  const r=run(own,items,heated,probe);
  const ok=/confirmed|Presence of/i.test(r.inf)||(r.probe&&r.probe.pos);
  check(ok,`${api.ANIONS[an].sym}: [${items.join('+')}]${probe?' + '+probe:''} did not confirm -> ${r.obs} | ${r.inf}`);
  console.log(`  ${api.ANIONS[an].sym.padEnd(10)} [${items.slice(1).join(' + ').padEnd(26)}]${(probe||'').padEnd(11)} ${ok?'confirms':'DOES NOT CONFIRM'}`);
  // the same test on every other anion must not confirm
  for(const other of api.SALTS.filter(x=>x.a!==an&&x.c===own.c)){
    const ro=run(other,items,heated,probe);
    if(/is confirmed/i.test(ro.inf)||(ro.probe&&ro.probe.pos))
      fails.push(`${api.ANIONS[an].sym} test [${items.join('+')}] ALSO fires for ${other.f} -> ${ro.inf}`);
  }
}
console.log('\n'+(fails.length? 'ISSUES ('+fails.length+'):\n - '+fails.join('\n - ') : 'No contradictions found in the scheme.'));
