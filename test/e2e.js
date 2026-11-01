// Requer: npm i playwright bwip-js ; servidor em http://localhost:8765
const {chromium}=require('playwright'),bwip=require('bwip-js'),assert=require('assert'),fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:800},acceptDownloads:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/');await p.setInputFiles('#file',__dirname+'/clipp_export_amostra.json');
await p.waitForSelector('#work:not([hidden])');assert.match(await p.textContent('#stats'),/Itens: 3/);
await p.check('#fast');for(let i=0;i<3;i++){await p.fill('#code','7891000100103');await p.press('#code','Enter');}
await p.uncheck('#fast');await p.fill('#code','5545');await p.press('#code','Enter');await p.fill('#qty','2,5');await p.click('#qtyOk');await p.waitForFunction(()=>document.getElementById('stats').textContent.includes('Contados: 2'));
await p.reload();await p.waitForSelector('#work:not([hidden])');assert.match(await p.textContent('#stats'),/Contados: 2/);// persistiu
await p.click('#export');const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#expDl')]);
const out=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));assert.match(dl.suggestedFilename(),/^conferencia_\d{8}_\d{6}\.json$/);
assert.equal(out.items.length,2);assert.equal(out.items.find(i=>i.codigo==='5545').quantidade,2.5);assert.equal(out.items.find(i=>i.codigo==='7891000100103').quantidade,3);
// ZXing local decodifica EAN-13 e Code128
for(const [bcid,text] of [['ean13','7891000100103'],['code128','ABC-123'],['ean8','96385074']]){
 const png=(await bwip.toBuffer({bcid,text,scale:3,height:12,includetext:false})).toString('base64');
 const r=await p.evaluate(async d=>{const img=new Image();img.src='data:image/png;base64,'+d;await img.decode();const c=document.createElement('canvas');c.width=img.width+40;c.height=img.height+40;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(img,20,20);const F=ZXing.BarcodeFormat,h=new Map();h.set(ZXing.DecodeHintType.POSSIBLE_FORMATS,[F.EAN_13,F.EAN_8,F.UPC_A,F.UPC_E,F.CODE_128]);h.set(ZXing.DecodeHintType.TRY_HARDER,true);const m=new ZXing.MultiFormatReader();m.setHints(h);return zxDecode(m,c)},png);
 assert.equal(r,text);}
const sw=await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));assert.ok(sw);
assert.deepEqual(errs,[]);console.log('OK: e2e passou');await b.close()})().catch(e=>{console.error(e);process.exit(1)});
