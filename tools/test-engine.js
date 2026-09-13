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

/* The cation preliminary tests are numbered as the record numbers them, and the
   last three are the ones written down rather than carried out when the cation
   turns out to be group zero. */
{
  const cat=api.GUIDE.find(s=>/III-A/.test(s.sec));
  let bad=0;
  const want=['1. Group 0','2. Group I','3. Group II','4. Group III','5. Group IV','6. Group V','7. Group VI'];
  if(!cat){ console.log('FAIL no cation group-analysis section'); bad++; }
  else {
    if(cat.tests.length!==7){ console.log('FAIL cation preliminary tests: '+cat.tests.length+', the record has 7'); bad++; }
    cat.tests.forEach((t,i)=>{ if(want[i]&&t.name.indexOf(want[i])!==0){
      console.log('FAIL test '+(i+1)+' is "'+t.name+'", expected to start "'+want[i]+'"'); bad++; } });
    const skip=cat.tests.filter(t=>t.skipIfZero).map(t=>t.id).join(',');
    if(skip!=='g4,g5,g6'){ console.log('FAIL written-not-performed set is ['+skip+'], expected g4,g5,g6'); bad++; }
    // each of the three has to be a real test too, or the student could never do it
    cat.tests.filter(t=>t.skipIfZero).forEach(t=>{
      api.SA1.forEach(s=>{ const r=api.simFor(t,s);
        if(!r.obs||r.obs==='—'||!r.inf||r.inf==='—'){ console.log('FAIL '+t.id+' gives nothing for '+s.f); bad++; } });
    });
    // The row you write against a group-zero salt has to be the row you would have
    // got by carrying the test out -- otherwise the record says one thing and the
    // chemistry another.
    const amm=api.SALTS.find(x=>x.n==='Ammonium carbonate');
    cat.tests.filter(t=>t.skipIfZero).forEach(t=>{
      if(!t.absent){ console.log('FAIL '+t.id+' has no row to write'); bad++; return; }
      const r=api.simFor(t,amm);
      if(r.inf.indexOf(t.absent)!==0){
        console.log('FAIL '+t.id+' would be written "'+t.absent+'" but performing gives "'+r.inf+'"'); bad++; }
      if(r.obs.indexOf('No characteristic precipitate')!==0){
        console.log('FAIL '+t.id+' on an ammonium salt observes "'+r.obs+'", not an absence'); bad++; }
    });
  }
  console.log('\ncation preliminary tests: '+(bad?bad+' PROBLEMS':'1-7 numbered, 5-7 writable without performing, all three still work'));
  if(bad) process.exitCode=1;
}
