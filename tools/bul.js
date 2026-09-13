const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const noop=()=>{};
const el=new Proxy(function(){},{get(t,k){if(k==='length')return 0;if(k==='style'||k==='classList'||k==='dataset')return el;
 if(k===Symbol.iterator)return [][Symbol.iterator].bind([]);if(k==='getBoundingClientRect')return()=>({left:0,top:0,width:100,height:100});
 if(k==='map'||k==='forEach'||k==='filter')return()=>[];return el;},set(){return true},apply(){return el},has(){return true}});
global.document={querySelector:()=>el,querySelectorAll:()=>[],getElementById:()=>el,addEventListener:noop,createElementNS:()=>el,createElement:()=>el,body:el,documentElement:el};
global.window={matchMedia:()=>({matches:false}),addEventListener:noop};global.addEventListener=noop;global.localStorage={getItem:()=>null,setItem:noop};global.requestAnimationFrame=noop;global.setTimeout=noop;global.clearTimeout=noop;global.confirm=()=>true;
const api=new Function(src+'\n;return {GUIDE,SA1,SALTS,evaluate,bullets,probeResult,setSalt:s=>{salt=s}};')();
// what the pop-up actually prints for each SA1 salt on the key tests
const cases=[['Dil. H2SO4',['salt','dilH2SO4'],false],['Conc. H2SO4 + heat',['salt','concH2SO4'],true],
 ['BaCl2',['saltSoln','BaCl2'],false],['NaOH + heat',['salt','NaOH'],true],['dil HCl',['saltSoln','dilHCl'],false],
 ['KI',['saltSoln','KI'],false],['NH4Cl + NH4OH',['saltSoln','NH4Cl','NH4OH'],true],['brown ring',['saltSoln','FeSO4','concH2SO4'],false],
 ['salt only (setup)',['salt'],false],['salt + water (setup)',['salt','water'],false]];
for(const [name,items,heated] of cases){
  console.log('\n'+name);
  for(const s of api.SA1){ api.setSalt(s);
    const v={name:'test tube',Name:'Test tube',st:{items:[...items],heated,scratched:false,soaked:false,gas:null,smell:null}};
    const r=api.evaluate(v);
    console.log('  '+s.f.padEnd(12)+(r.quiet?'[POPUP SUPPRESSED] ':'')+api.bullets(r).map(b=>'• '+b).join('  '));
  }
}
console.log('\nprobes:');
for(const g of ['CO2','NH3','NO2',null]) console.log('  gas='+String(g).padEnd(5)+' limeWater: '+api.bullets(api.probeResult('limeWater',g)).join(' / ')+'   redLitmus: '+api.bullets(api.probeResult('redLitmus',g)).join(' / '));
