// Ensamblador MIPS de 32 bits. Uso: asmMips(texto) -> {err, lst, lab, imem, dmem}
const REGN="zero at v0 v1 a0 a1 a2 a3 t0 t1 t2 t3 t4 t5 t6 t7 s0 s1 s2 s3 s4 s5 s6 s7 t8 t9 k0 k1 gp sp fp ra".split(' ');
const RF={add:33,sub:35,and:36,or:37,slt:42},IO={addi:9,addiu:9,ori:13,lw:35,sw:43,beq:4,bne:5};
function asmMips(txt){
 const err=[],lst=[],lab={},dat=[],ins=[],W=[];let sec='text';
 const E=(line,msg)=>err.push({line,msg});
 const num=s=>/^#?-?(0x[0-9a-f]+|\d+)$/i.test(s||'')?parseInt(s.replace('#','')):null;
 const reg=(s,l)=>{const m=/^\$(\w+)$/.exec(s||''),v=m?(/^\d+$/.test(m[1])?+m[1]:REGN.indexOf(m[1])):-1;if(v<0||v>31){E(l,`Registro inválido: ${s}`);return 0}return v};
 // Pasada 1: etiquetas, datos e instrucciones
 txt.split('\n').forEach((raw,i)=>{
  const l=i+1;let t=raw.replace(/(;|\/\/|#\s|^\s*#).*$/,'').trim(),m;
  while((m=/^(\w+):\s*(.*)$/.exec(t))){if(m[1] in lab)E(l,`Etiqueta duplicada: ${m[1]}`);lab[m[1]]=sec=='text'?ins.length*4:dat.length*4;t=m[2]}
  if(!t)return;
  if(t=='.data'||t=='.text'){sec=t.slice(1);return}
  if(t.startsWith('.word')){if(sec!='data')E(l,'.word solo se permite en .data');else t.slice(5).split(',').forEach(v=>{const n=num(v.trim());if(n===null||n<-2147483648||n>4294967295)E(l,`Dato inválido: ${v.trim()}`);else dat.push(n|0)});return}
  if(sec=='data'){E(l,'En .data solo se permite .word');return}
  const k=t.search(/\s/),op=(k<0?t:t.slice(0,k)).toLowerCase();
  ins.push({op,a:k<0?[]:t.slice(k).split(',').map(s=>s.trim()),l,addr:ins.length*4});
 });
 // Pasada 2: codificación
 ins.forEach(x=>{
  const {op,a,l,addr}=x;let w=0;
  const n=c=>a.length==c||(E(l,`${op} requiere ${c} operandos`),false);
  const tgt=s=>s in lab?lab[s]:(E(l,`Etiqueta indefinida: ${s}`),null);
  if(op in RF){if(n(3))w=reg(a[1],l)<<21|reg(a[2],l)<<16|reg(a[0],l)<<11|RF[op]}
  else if(['addi','addiu','ori'].includes(op)){if(n(3)){const v=num(a[2]),[lo,hi]=op=='ori'?[0,65535]:[-32768,32767];
   if(v===null||v<lo||v>hi)E(l,`Inmediato fuera de rango [${lo}, ${hi}]: ${a[2]}`);else w=IO[op]<<26|reg(a[1],l)<<21|reg(a[0],l)<<16|(v&65535)}}
  else if(op=='lw'||op=='sw'){if(n(2)){const m=/^(#?-?\w+)\((\$\w+)\)$/.exec(a[1]),v=m?num(m[1]):null;
   if(v===null||v<-32768||v>32767)E(l,`Operando inválido o fuera de rango: ${a[1]}`);else w=IO[op]<<26|reg(m[2],l)<<21|reg(a[0],l)<<16|(v&65535)}}
  else if(op=='beq'||op=='bne'){if(n(3)){const t=tgt(a[2]);if(t!==null){const o=(t-(addr+4))/4;
   if(o<-32768||o>32767)E(l,'Desplazamiento de rama fuera de 16 bits');else w=IO[op]<<26|reg(a[0],l)<<21|reg(a[1],l)<<16|(o&65535)}}}
  else if(op=='j'){if(n(1)){const t=tgt(a[0]);if(t!==null){
   if(t>>>28!=(addr+4)>>>28)E(l,'Salto j fuera de la región de PC+4');else w=2<<26|(t>>>2)&0x3FFFFFF}}}
  else E(l,`Mnemónico inválido: ${op}`);
  W.push(w>>>0);lst.push({addr,w:w>>>0,src:op+' '+a.join(', '),l});
 });
 const B=arr=>{const u=new Uint8Array(arr.length*4);arr.forEach((v,i)=>[24,16,8,0].forEach((s,k)=>u[i*4+k]=v>>>s&255));return u};
 return{err,lst,lab,imem:B(W),dmem:B(dat)}; // big-endian, un byte por dirección
}
if(typeof module!=='undefined')module.exports={asmMips};
