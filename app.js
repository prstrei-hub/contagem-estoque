(function(){
var KEY='contagem-estoque-v1', $=function(id){return document.getElementById(id)};
var state=null; try{state=JSON.parse(localStorage.getItem(KEY))}catch(e){}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function fmt(n){return n==null?'—':String(n).replace('.',',')}
function toast(t){var e=$('toast');e.textContent=t;e.style.display='block';clearTimeout(e._t);e._t=setTimeout(function(){e.style.display='none'},1800)}
var actx;function beep(ok){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();var o=actx.createOscillator(),g=actx.createGain();o.frequency.value=ok?1400:300;o.connect(g);g.connect(actx.destination);g.gain.value=.2;o.start();o.stop(actx.currentTime+(ok?.12:.35))}catch(e){}if(navigator.vibrate)navigator.vibrate(ok?80:[100,60,100])}
function show(){var has=!!state;$('start').hidden=has;$('work').hidden=!has;$('bar').hidden=!has;$('listName').textContent=has?state.list_name:'Nenhuma lista';if(has)render()}
function render(){var f=$('filter').value,items=Core.search(state,$('q').value);
 items=items.filter(function(i){var d=Core.diff(i);return f==='all'||(f==='counted'&&i.contado!=null)||(f==='pending'&&i.contado==null)||(f==='diff'&&d!=null&&d!==0)});
 items.sort(function(a,b){return (b.ts||0)-(a.ts||0)});
 var c=state.items.filter(function(i){return i.contado!=null}).length;
 var neg=state.items.filter(function(i){return i.estoque!=null&&i.estoque<0}).length;
 $('stats').textContent='Itens: '+state.items.length+' · Contados: '+c+' · Faltam: '+(state.items.length-c)+(neg?' · ⚠️ '+neg+' com estoque negativo no Clipp':'');
 var ul=$('list');ul.innerHTML='';items.slice(0,300).forEach(function(i){var li=document.createElement('li');var d=Core.diff(i);
  li.className=(i.contado!=null?'c ':'')+(i.manual?'m':'');
  li.innerHTML='<div><b></b><div class="d"></div></div><div class="n"><div>Est: '+fmt(i.estoque)+(i.estoque<0?' ⚠️':'')+'</div><div>Cont: <b>'+fmt(i.contado)+'</b></div><div class="'+(d<0?'neg':d>0?'pos':'')+'">'+(d==null?'':'Dif: '+(d>0?'+':'')+fmt(d))+'</div></div>';
  li.querySelector('b').textContent=i.descricao;li.querySelector('.d').textContent=i.codigo+(i.manual?' · fora da lista':'');
  li.onclick=function(){askQty(i.codigo)};ul.appendChild(li)});
 if(items.length>300){var li=document.createElement('li');li.textContent='Mostrando 300 de '+items.length+'. Use a busca.';ul.appendChild(li)}}
$('file').onchange=function(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{state=Core.parseClipp(r.result);save();show();toast(state.items.length+' itens carregados')}catch(err){alert('Não consegui ler o arquivo: '+err.message)}};r.readAsText(f,'utf-8');e.target.value=''};
$('manual').onclick=function(){state={list_name:'manual',items:[]};save();show()};
function handleCode(code,fromScan){code=String(code).trim();if(!code)return;var it=Core.find(state,code);
 if($('fast').checked){var known=!!it;Core.addCount(state,code,1,'add');save();render();beep(known);toast((known?it.descricao:'Item fora da lista: '+code)+' → '+fmt(Core.find(state,code).contado));return}
 beep(!!it);askQty(code)}
function askQty(code){var it=Core.find(state,code);$('qtyTitle').textContent=it?it.descricao:'Item fora da lista';
 $('qtyInfo').textContent='Código '+code+(it?' · Estoque: '+fmt(it.estoque)+' · Contado: '+fmt(it.contado):'');
 $('qtyDesc').hidden=!!it;$('qtyDesc').value='';$('qty').value='';var d=$('qtyDlg');d._code=code;d.returnValue='';d.showModal();setTimeout(function(){$('qty').focus()},50)}
$('qtyDlg').addEventListener('close',function(){var d=$('qtyDlg');if(d.returnValue!=='ok')return;
 var mode=document.querySelector('input[name=qm]:checked').value;
 try{var it=Core.addCount(state,d._code,$('qty').value,mode,$('qtyDesc').value.trim());save();render();toast(it.descricao+' → '+fmt(it.contado))}catch(e){alert(e.message)}});
$('go').onclick=function(){handleCode($('code').value);$('code').value='';$('code').focus()};
$('code').onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();$('go').onclick()}};
$('q').oninput=render;$('filter').onchange=render;
// Scanner
window.zxDecode=function(reader,canvas){try{var src=new ZXing.HTMLCanvasElementLuminanceSource(canvas);return reader.decodeWithState(new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(src))).getText()}catch(e){return null}};
var stream,timer,zx,last='',lastT=0;
function onRead(c){var now=Date.now();if(c===last&&now-lastT<2000)return;last=c;lastT=now;
 if(!$('fast').checked)stopScan();handleCode(c,true)}
async function startScan(){$('scanDlg').showModal();$('scanMsg').textContent='Abrindo câmera…';
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280}}});}catch(e){$('scanMsg').textContent='Sem acesso à câmera: '+e.message;return}
 var v=$('video');v.srcObject=stream;await v.play();
 var native=false;if('BarcodeDetector' in window){try{var fm=await BarcodeDetector.getSupportedFormats();native=fm.indexOf('ean_13')>=0}catch(e){}}
 if(native){var det=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128']});$('scanMsg').textContent='Leitor nativo · aponte para o código';
  var loop=async function(){if(!stream)return;try{var r=await det.detect(v);if(r.length)onRead(r[0].rawValue)}catch(e){}timer=setTimeout(loop,150)};loop()}
 else if(window.ZXing){$('scanMsg').textContent='Leitor ZXing · aponte para o código';
  var hints=new Map(),F=ZXing.BarcodeFormat;hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS,[F.EAN_13,F.EAN_8,F.UPC_A,F.UPC_E,F.CODE_128]);hints.set(ZXing.DecodeHintType.TRY_HARDER,true);
  zx=new ZXing.MultiFormatReader();zx.setHints(hints);var cv=document.createElement('canvas');
  var loop2=function(){if(!stream)return;try{cv.width=v.videoWidth;cv.height=v.videoHeight;if(cv.width){cv.getContext('2d').drawImage(v,0,0);var r=zxDecode(zx,cv);if(r)onRead(r)}}catch(e){}timer=setTimeout(loop2,250)};loop2()}
 else $('scanMsg').textContent='Leitor não disponível neste navegador. Digite o código.'}
function stopScan(){clearTimeout(timer);if(stream)stream.getTracks().forEach(function(t){t.stop()});stream=null;if($('scanDlg').open)$('scanDlg').close()}
$('scan').onclick=startScan;$('scanClose').onclick=stopScan;$('scanDlg').addEventListener('cancel',stopScan);
// Export
$('export').onclick=function(){var c=state.items.filter(function(i){return i.contado!=null}).length;$('incl').checked=false;$('inclWarn').hidden=true;
 $('expInfo').textContent=c+' item(ns) contado(s) serão exportados. Itens não contados ficam de fora e o estoque deles não é alterado.';$('expDlg').returnValue='';$('expDlg').showModal()};
$('incl').onchange=function(){$('inclWarn').hidden=!this.checked};
$('expDlg').addEventListener('close',async function(){var rv=$('expDlg').returnValue;if(rv!=='ok'&&rv!=='dl')return;
 if($('incl').checked&&!confirm('Confirma incluir itens não contados com quantidade 0? Isso pode ZERAR o estoque deles no Clipp.'))return;
 var name=Core.fileName(),data=Core.buildExport(state,{fileName:name,includeUncounted:$('incl').checked});
 if(!data.items.length){alert('Nenhum item contado para exportar.');return}
 var txt=JSON.stringify(data,null,2),blob=new Blob([txt],{type:'application/json'});
 if(rv==='ok'){try{var file=new File([blob],name,{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:name});return}}catch(e){if(e.name==='AbortError')return}}
 var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Arquivo baixado: '+name)});
$('menu').onclick=function(){$('menuDlg').returnValue='';$('menuDlg').showModal()};
$('menuDlg').addEventListener('close',function(){if($('menuDlg').returnValue==='new'&&confirm('Apagar a contagem atual deste celular?')){state=null;localStorage.removeItem(KEY);show()}});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();
show();
})();
