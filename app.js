(function(){
var KEY='contagem-estoque-v1', $=function(id){return document.getElementById(id)};
var state=null; try{state=JSON.parse(localStorage.getItem(KEY))}catch(e){}
var undoStack=[];
function save(){localStorage.setItem(KEY,JSON.stringify(state));updateUndoBtn()}
function pushUndo(){if(state)undoStack.push(JSON.stringify(state));if(undoStack.length>15)undoStack.shift();updateUndoBtn()}
function updateUndoBtn(){$('undo').disabled=!undoStack.length}
function fmt(n){return n==null?'—':String(n).replace('.',',')}
function toast(t,err){var e=$('toast');e.textContent=t;e.style.background=err?'#b71c1c':'#222';e.style.display='block';clearTimeout(e._t);e._t=setTimeout(function(){e.style.display='none'},2200)}
var actx;function beep(ok){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();var o=actx.createOscillator(),g=actx.createGain();o.frequency.value=ok?1400:300;o.connect(g);g.connect(actx.destination);g.gain.value=.2;o.start();o.stop(actx.currentTime+(ok?0.12:0.35))}catch(e){}if(navigator.vibrate)navigator.vibrate(ok?80:[100,60,100])}
function show(){var has=!!state;$('start').hidden=has;$('work').hidden=!has;$('bar').hidden=!has;$('listName').textContent=has?state.list_name:'Nenhuma lista';if(has)render();updateUndoBtn()}
function render(){var f=$('filter').value,s=$('sort').value,items=Core.search(state,$('q').value);
 items=items.filter(function(i){var d=Core.diff(i);return f==='all'||(f==='counted'&&i.contado!=null)||(f==='pending'&&i.contado==null)||(f==='diff'&&d!=null&&d!==0)});
 items.sort(function(a,b){
  if(s==='code')return a.codigo.localeCompare(b.codigo);
  if(s==='desc')return (a.descricao||'').localeCompare(b.descricao||'');
  if(s==='diff'){var da=Core.diff(a)||0,db=Core.diff(b)||0;return db-da}
  return (b.ts||0)-(a.ts||0)
 });
 var c=state.items.filter(function(i){return i.contado!=null}).length;
 var neg=state.items.filter(function(i){return i.estoque!=null&&i.estoque<0}).length;
 $('stats').textContent='Itens: '+state.items.length+' · Contados: '+c+' · Faltam: '+(state.items.length-c)+(neg?' · ⚠️ '+neg+' com estoque negativo no Clipp':'');
 var ul=$('list');ul.innerHTML='';items.slice(0,300).forEach(function(i){var li=document.createElement('li');var d=Core.diff(i);
  var cls=(i.contado!=null?'c ':'')+(i.manual?'m ':'');
  if(d!=null&&d!==0)cls+='has-diff '+(d<0?'neg-diff':'');
  li.className=cls.trim();
  li.innerHTML='<div><b></b><div class="d"></div></div><div class="n"><div>Est: '+fmt(i.estoque)+(i.estoque<0?' ⚠️':'')+'</div><div>Cont: <b>'+fmt(i.contado)+'</b></div><div class="'+(d<0?'neg':d>0?'pos':'')+'">'+(d==null?'':'Dif: '+(d>0?'+':'')+fmt(d))+'</div></div>';
  li.querySelector('b').textContent=i.descricao;li.querySelector('.d').textContent=i.codigo+(i.manual?' · fora da lista':'');
  li.onclick=function(){askQty(i.codigo)};ul.appendChild(li)});
 if(items.length>300){var li=document.createElement('li');li.textContent='Mostrando 300 de '+items.length+'. Use a busca.';ul.appendChild(li)}}
$('file').onchange=function(e){var f=e.target.files[0];if(!f)return;
 if(state&&!confirm('Já existe uma contagem em andamento. Substituir e perder o progresso atual?')){e.target.value='';return}
 var r=new FileReader();r.onload=function(){try{pushUndo();state=Core.parseClipp(r.result);save();show();toast(state.items.length+' itens carregados')}catch(err){toast('Não consegui ler o arquivo: '+err.message,true)}};r.readAsText(f,'utf-8');e.target.value=''};
$('manual').onclick=function(){if(state&&!confirm('Já existe uma contagem. Começar manual e perder o progresso?'))return;pushUndo();state={list_name:'manual',items:[]};save();show()};
function handleCode(code,fromScan){code=String(code).trim();if(!code)return;var it=Core.find(state,code);
 if($('fast').checked){pushUndo();var known=!!it;Core.addCount(state,code,1,'add');save();render();beep(known);var cur=Core.find(state,code);toast((known?cur.descricao:'Item fora da lista: '+code)+' → '+fmt(cur.contado));if(fromScan)$('lastScan').textContent='Último: '+code+' → '+fmt(cur.contado);return}
 beep(!!it);askQty(code);if(fromScan)$('lastScan').textContent='Último: '+code}
function askQty(code){var it=Core.find(state,code);$('qtyTitle').textContent=it?it.descricao:'Item fora da lista';
 $('qtyInfo').textContent='Código '+code+(it?' · Estoque: '+fmt(it.estoque)+' · Contado: '+fmt(it.contado):'');
 var showDesc=!it||it.manual;$('qtyDesc').hidden=!showDesc;$('qtyDesc').value=it&&it.manual?it.descricao:'';$('qty').value='';
 var d=$('qtyDlg');d._code=code;d.returnValue='';d.showModal();setTimeout(function(){$('qty').focus()},50)}
$('qtyDlg').addEventListener('close',function(){var d=$('qtyDlg');if(d.returnValue!=='ok')return;
 var mode=document.querySelector('input[name=qm]:checked').value;
 var desc=$('qtyDesc').value.trim();
 try{pushUndo();var it=Core.addCount(state,d._code,$('qty').value,mode,desc||undefined);save();render();toast(it.descricao+' → '+fmt(it.contado))}catch(e){toast(e.message,true)}});
$('go').onclick=function(){handleCode($('code').value);$('code').value='';$('code').focus()};
$('code').onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();$('go').onclick()}};
$('q').oninput=render;$('filter').onchange=render;$('sort').onchange=render;
// Undo
$('undo').onclick=function(){if(!undoStack.length)return;state=JSON.parse(undoStack.pop());save();show();toast('Ação desfeita')};
// Scanner
window.zxDecode=function(reader,canvas){try{var src=new ZXing.HTMLCanvasElementLuminanceSource(canvas);return reader.decodeWithState(new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(src))).getText()}catch(e){return null}};
var stream,timer,zx,last='',lastT=0,torchOn=false,videoTrack;
function onRead(c){var now=Date.now();if(c===last&&now-lastT<2000)return;last=c;lastT=now;
 if(!$('fast').checked)stopScan();handleCode(c,true)}
async function startScan(){$('scanDlg').showModal();$('scanMsg').textContent='Abrindo câmera…';$('lastScan').textContent='';$('torch').hidden=true;torchOn=false;
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280}}});}catch(e){$('scanMsg').textContent='Sem acesso à câmera: '+e.message;return}
 var v=$('video');v.srcObject=stream;await v.play();
 videoTrack=stream.getVideoTracks()[0];
 if(videoTrack&&videoTrack.getCapabilities&&videoTrack.getCapabilities().torch){$('torch').hidden=false}
 var native=false;if('BarcodeDetector' in window){try{var fm=await BarcodeDetector.getSupportedFormats();native=fm.indexOf('ean_13')>=0}catch(e){}}
 if(native){var det=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128']});$('scanMsg').textContent='Leitor nativo · aponte para o código';
  var loop=async function(){if(!stream)return;try{var r=await det.detect(v);if(r.length)onRead(r[0].rawValue)}catch(e){}timer=setTimeout(loop,150)};loop()}
 else if(window.ZXing){$('scanMsg').textContent='Leitor ZXing · aponte para o código';
  var hints=new Map(),F=ZXing.BarcodeFormat;hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS,[F.EAN_13,F.EAN_8,F.UPC_A,F.UPC_E,F.CODE_128]);hints.set(ZXing.DecodeHintType.TRY_HARDER,true);
  zx=new ZXing.MultiFormatReader();zx.setHints(hints);var cv=document.createElement('canvas');
  var loop2=function(){if(!stream)return;try{cv.width=v.videoWidth;cv.height=v.videoHeight;if(cv.width){cv.getContext('2d').drawImage(v,0,0);var r=zxDecode(zx,cv);if(r)onRead(r)}}catch(e){}timer=setTimeout(loop2,250)};loop2()}
 else $('scanMsg').textContent='Leitor não disponível neste navegador. Digite o código.'}
function stopScan(){clearTimeout(timer);if(stream)stream.getTracks().forEach(function(t){t.stop()});stream=null;videoTrack=null;if($('scanDlg').open)$('scanDlg').close()}
$('torch').onclick=async function(){if(!videoTrack)return;try{torchOn=!torchOn;await videoTrack.applyConstraints({advanced:[{torch:torchOn}]});this.textContent=torchOn?'💡 Lanterna ligada':'💡 Lanterna'}catch(e){toast('Lanterna não disponível',true)}};
$('scan').onclick=startScan;$('scanClose').onclick=stopScan;$('scanDlg').addEventListener('cancel',stopScan);
// Export
$('export').onclick=function(){var c=state.items.filter(function(i){return i.contado!=null}).length;$('incl').checked=false;$('inclWarn').hidden=true;
 $('expInfo').textContent=c+' item(ns) contado(s) serão exportados. Itens não contados ficam de fora e o estoque deles não é alterado.';$('expDlg').returnValue='';$('expDlg').showModal()};
function uncountedN(){return state.items.filter(function(i){return i.contado==null}).length}
$('incl').onchange=function(){$('inclWarn').hidden=!this.checked;$('inclWarn').textContent='⚠ '+uncountedN()+' itens não contados serão enviados com quantidade 0 e marcados como Conferido. Se você clicar em Atualizar cadastros no Clipp, o estoque deles será ZERADO.'};
function confirmZero(){return new Promise(function(res){var d=$('zeroDlg');$('zeroMsg').textContent='⚠ '+uncountedN()+' itens não contados serão enviados com quantidade 0 e marcados como Conferido. Se você clicar em Atualizar cadastros no Clipp, o estoque deles será ZERADO. Continuar?';d.returnValue='cancel';d.addEventListener('close',function(){res(d.returnValue==='ok')},{once:true});d.showModal()})}
$('expDlg').addEventListener('close',async function(){var rv=$('expDlg').returnValue;if(rv!=='ok'&&rv!=='dl')return;
 if($('incl').checked&&uncountedN()>0&&!(await confirmZero()))return;
 var name=Core.fileName(),data=Core.buildExport(state,{fileName:name,includeUncounted:$('incl').checked,listName:state.list_name});
 if(!data.items.length){toast('Nenhum item contado para exportar.',true);return}
 var txt=JSON.stringify(data,null,2),blob=new Blob([txt],{type:'application/json'});
 if(rv==='ok'){try{var file=new File([blob],name,{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:name});return}}catch(e){if(e.name==='AbortError')return}}
 var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Arquivo baixado: '+name)});
// Menu + backup/restore
$('menu').onclick=function(){$('menuDlg').returnValue='';$('menuDlg').showModal()};
$('menuDlg').addEventListener('close',function(){
 var rv=$('menuDlg').returnValue;
 if(rv==='new'&&confirm('Apagar a contagem atual deste celular?')){pushUndo();state=null;localStorage.removeItem(KEY);show()}
 else if(rv==='backup'){if(!state){toast('Nada para fazer backup',true);return}var blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='backup_contagem_'+Date.now()+'.json';document.body.appendChild(a);a.click();a.remove();toast('Backup baixado')}
 else if(rv==='restore')$('restoreFile').click()
});
$('restoreFile').onchange=function(e){var f=e.target.files[0];if(!f)return;if(state&&!confirm('Restaurar vai substituir a contagem atual. Continuar?')){e.target.value='';return}
 var r=new FileReader();r.onload=function(){try{var s=JSON.parse(r.result);if(!s||!Array.isArray(s.items))throw new Error('Formato inválido');pushUndo();state=s;save();show();toast('Progresso restaurado')}catch(err){toast('Não consegui restaurar: '+err.message,true)}};r.readAsText(f);e.target.value=''};
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();
show();
})();
