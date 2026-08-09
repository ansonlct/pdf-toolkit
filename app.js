const VERSION='1';
const VISUAL_SPLIT_THRESHOLD=20;
const CAT_LABELS={ORGANIZE:'整理 PDF',EDIT:'編輯 PDF',SECURITY:'PDF 安全',CONVERT:'文件轉換',UTILITY:'其他工具'};
const CAT_ORDER=['ORGANIZE','EDIT','SECURITY','CONVERT','UTILITY'];
const TOOLS=[
{id:'pages',icon:'▦',name:'管理 PDF 頁面',cat:'ORGANIZE',accept:'.pdf,application/pdf',multiple:false,c:'#2563eb'},
{id:'merge',icon:'⤧',name:'合併 PDF',cat:'ORGANIZE',accept:'.pdf,application/pdf',multiple:true,c:'#0ea5e9'},
{id:'split',icon:'✂',name:'分割 PDF',cat:'ORGANIZE',accept:'.pdf,application/pdf',multiple:false,c:'#7c3aed'},
{id:'watermark',icon:'◒',name:'文字水印',cat:'EDIT',accept:'.pdf,application/pdf',multiple:false,c:'#db2777'},
{id:'protect',icon:'⌾',name:'PDF 加密',cat:'SECURITY',accept:'.pdf,application/pdf',multiple:false,c:'#b45309'},
{id:'unlock',icon:'◉',name:'移除 PDF 密碼',cat:'SECURITY',accept:'.pdf,application/pdf',multiple:false,c:'#c2410c'},
{id:'img2pdf',icon:'▧',name:'圖片 → PDF',cat:'CONVERT',accept:'image/jpeg,image/png,.jpg,.jpeg,.png',multiple:true,c:'#16a34a'},
{id:'pdf2img',icon:'▤',name:'PDF → 圖片',cat:'CONVERT',accept:'.pdf,application/pdf',multiple:false,c:'#0891b2'},
{id:'docx',icon:'W',name:'DOCX → PDF',cat:'CONVERT',accept:'.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',multiple:false,c:'#2563eb'},
{id:'xlsx',icon:'X',name:'XLSX → PDF',cat:'CONVERT',accept:'.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',multiple:false,c:'#15803d'},
{id:'markdown',icon:'M↓',name:'Markdown → PDF',cat:'CONVERT',accept:'.md,.markdown,text/markdown,text/plain',multiple:false,c:'#475569'},
{id:'html',icon:'<>',name:'HTML → PDF',cat:'CONVERT',accept:'.html,.htm,text/html',multiple:false,c:'#ea580c'},
{id:'txt',icon:'Tt',name:'TXT → PDF',cat:'CONVERT',accept:'.txt,text/plain',multiple:false,c:'#64748b'},
{id:'info',icon:'i',name:'PDF 資料',cat:'UTILITY',accept:'.pdf,application/pdf',multiple:false,c:'#059669'}
];
const state={tool:null,files:[],pdfjs:null,pdfjsDoc:null,pageItems:[],history:[],result:null,sort:null,deferredPrompt:null,wm:{x:.5,y:.5},splitPoints:new Set(),splitMode:'range',splitPageCount:0,mergeGeneration:0,mergePreview:false,splitRangeText:'',qpdfFactory:null,sourceEl:null,infoReport:null,pdf2imgSelected:new Set(),pdf2imgPageCount:0,pdf2imgMode:'all'};
const DONATION_LINKS={
  payme:'',
  paypal:''
};
const $=s=>document.querySelector(s);const els={
  grid:$('#toolGrid'),search:$('#searchInput'),count:$('#toolCount'),
  compactTitle:$('#compactTitle'),largeTitle:$('#largeTitle'),bottomSearch:$('#bottomSearchShell'),
  themeToggle:$('#themeToggle'),payme:$('#paymeRow'),paypal:$('#paypalRow'),
  dialog:$('#toolDialog'),cat:$('#dialogCat'),title:$('#dialogTitle'),close:$('#closeDialog'),
  drop:$('#dropZone'),input:$('#fileInput'),dropTitle:$('#dropTitle'),summary:$('#fileSummary'),
  workspace:$('#workspace'),progressWrap:$('#progressWrap'),progress:$('#progressBar'),
  progressText:$('#progressText'),progressPct:$('#progressPct'),result:$('#resultBox'),
  resultName:$('#resultName'),resultMeta:$('#resultMeta'),download:$('#downloadBtn'),
  share:$('#shareBtn'),actions:$('#stickyActions'),toast:$('#toast')
};
function toast(s){els.toast.textContent=s;els.toast.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>els.toast.classList.remove('show'),2300)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function bytes(n){const u=['B','KB','MB','GB'];let i=0,v=n||0;while(v>=1024&&i<3){v/=1024;i++}return `${v.toFixed(i?1:0)} ${u[i]}`}
function baseName(n){return n.replace(/\.[^.]+$/,'').replace(/[^\w\u3400-\u9fff-]+/g,'_').slice(0,70)||'document'}

function syncHomeNavigationTitle(){
  if(!els.largeTitle)return;
  const headerH=document.querySelector('.app-header')?.getBoundingClientRect().height||44;
  const r=els.largeTitle.getBoundingClientRect();
  const compact=r.bottom<=headerH+5;
  document.body.classList.toggle('compact-title-visible',compact);
  if(els.compactTitle)els.compactTitle.setAttribute('aria-hidden',compact?'false':'true')
}
let homeTitleRaf=0;
function scheduleHomeNavigationSync(){
  if(homeTitleRaf)return;
  homeTitleRaf=requestAnimationFrame(()=>{
    homeTitleRaf=0;
    syncHomeNavigationTitle()
  })
}
window.addEventListener('scroll',scheduleHomeNavigationSync,{passive:true});
window.addEventListener('resize',scheduleHomeNavigationSync,{passive:true});

function applyTheme(mode,persist=true){
  const dark=mode==='dark';
  document.documentElement.dataset.theme=dark?'dark':'light';
  if(els.themeToggle)els.themeToggle.checked=dark;
  if(persist)localStorage.setItem('theme',dark?'dark':'light')
}
function openDonation(kind){
  const url=DONATION_LINKS[kind];
  if(!url){
    toast(`${kind==='payme'?'PayMe':'PayPal'} 捐款連結尚未設定`);
    return
  }
  window.open(url,'_blank','noopener,noreferrer')
}

function renderTools(q=''){
  q=q.trim().toLowerCase();
  const list=TOOLS.filter(t=>!q||`${t.name} ${CAT_LABELS[t.cat]||t.cat}`.toLowerCase().includes(q));
  els.count.textContent=`${list.length} 個`;
  els.grid.innerHTML=list.length?CAT_ORDER.map(cat=>{
    const items=list.filter(t=>t.cat===cat);if(!items.length)return'';
    return `<section class="settings-section">
      <div class="settings-section-title">${CAT_LABELS[cat]}</div>
      <div class="settings-list">${items.map(t=>`
        <button class="settings-row" data-id="${t.id}" style="--toolc:${t.c}" type="button">
          <span class="settings-icon" aria-hidden="true">${t.icon}</span>
          <span class="settings-label">${t.name}</span>
          <span class="settings-chevron" aria-hidden="true">›</span>
        </button>`).join('')}</div>
    </section>`
  }).join(''):'<div class="empty">搵唔到相關工具。</div>';
  els.grid.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>openTool(b.dataset.id,b))
}
async function getPdfjs(){if(state.pdfjs)return state.pdfjs;state.pdfjs=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');state.pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';return state.pdfjs}
function clearResult(){if(state.result?.url)URL.revokeObjectURL(state.result.url);state.result=null;els.result.hidden=true}
function clearState(){clearResult();if(state.sort){state.sort.destroy();state.sort=null}if(state.pdfjsDoc){try{state.pdfjsDoc.destroy()}catch{}state.pdfjsDoc=null}state.pageItems=[];state.history=[];state.wm={x:.5,y:.5};state.splitPoints=new Set();state.splitMode='range';state.splitPageCount=0;state.mergeGeneration++;state.mergePreview=false;state.splitRangeText='';state.infoReport=null;state.pdf2imgSelected=new Set();state.pdf2imgPageCount=0;state.pdf2imgMode='all';els.workspace.innerHTML='';els.actions.innerHTML='';els.summary.hidden=true;els.summary.textContent='';clearProgress()}
function prefersReducedMotion(){return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches}
function setRouteActive(active){
  document.body.classList.toggle('tool-route-active',!!active)
}
async function animateToolOpen(){
  setRouteActive(true);
  if(prefersReducedMotion())return;
  const sheet=els.dialog.querySelector('.sheet');
  if(!sheet)return;
  const a=sheet.animate([
    {transform:'translate3d(100%,0,0)'},
    {transform:'translate3d(0,0,0)'}
  ],{
    duration:390,
    easing:'cubic-bezier(.32,.72,0,1)',
    fill:'both'
  });
  try{await a.finished}catch{}
  a.cancel()
}
async function closeToolAnimated(){
  if(!els.dialog.open)return;

  // Restore the home screen FIRST. The tool page then slides away on top of
  // an already-visible home screen, preventing a blank frame during pop.
  setRouteActive(false);

  if(prefersReducedMotion()){
    els.dialog.close();
    clearState();
    return
  }

  const sheet=els.dialog.querySelector('.sheet');
  if(!sheet){
    els.dialog.close();
    clearState();
    return
  }

  // Prevent accidental interaction while the pushed route is leaving.
  els.dialog.style.pointerEvents='none';

  const a=sheet.animate([
    {transform:'translate3d(0,0,0)'},
    {transform:'translate3d(100%,0,0)'}
  ],{
    duration:320,
    easing:'cubic-bezier(.32,.72,0,1)',
    fill:'both'
  });

  try{await a.finished}catch{}

  els.dialog.close();
  a.cancel();
  els.dialog.style.pointerEvents='';
  clearState()
}
function openTool(id,sourceEl){
  els.dialog.style.pointerEvents='';
  clearState();
  state.sourceEl=sourceEl||null;
  state.tool=TOOLS.find(t=>t.id===id);
  state.files=[];
  els.cat.textContent=CAT_LABELS[state.tool.cat]||state.tool.cat;
  els.title.textContent=state.tool.name;
  els.input.accept=state.tool.accept;
  els.input.multiple=state.tool.multiple;
  els.dropTitle.textContent=state.tool.multiple?'選擇一個或多個檔案':'選擇一個檔案';
  els.dialog.showModal();
  renderInitial();
  requestAnimationFrame(()=>animateToolOpen())
}
function renderInitial(){if(['markdown','html','txt'].includes(state.tool.id)){els.workspace.innerHTML='<div class="hint">你可以選擇檔案，或直接在下方貼上內容。</div>'+field('內容',`<textarea id="textSource" placeholder="貼上內容…"></textarea>`)+paperControls();els.actions.innerHTML='<button class="primary" id="convertText">轉換 PDF</button>';$('#convertText').onclick=convertText;return}els.workspace.innerHTML='';els.actions.innerHTML=''}
function field(label,html,help=''){return `<label class="field"><span>${label}</span>${html}${help?`<small>${help}</small>`:''}</label>`}
function paperControls(){return `<div class="inline" style="margin-top:10px">${field('紙張','<select id="paper"><option value="a4">A4</option><option value="letter">Letter</option></select>')}${field('方向','<select id="orientation"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select>')}</div>`}
function renderFileSummary(){if(!state.files.length){els.summary.hidden=true;els.summary.textContent='';return}els.summary.hidden=false;const total=state.files.reduce((s,f)=>s+f.size,0);if(state.tool?.id==='merge'){els.summary.innerHTML=`<b>${state.files.length} 份 PDF</b> · ${bytes(total)}`;return}els.summary.innerHTML=state.files.map(f=>`<b>${esc(f.name)}</b> · ${bytes(f.size)}`).join('<br>')}
function bytesContainPdfHeader(bytes){
  const sig=[0x25,0x50,0x44,0x46,0x2d]; // %PDF-
  outer:for(let i=0;i<=bytes.length-sig.length;i++){
    for(let j=0;j<sig.length;j++)if(bytes[i+j]!==sig[j])continue outer;
    return true
  }
  return false
}
async function looksLikePdf(file){
  if(!/\.pdf$/i.test(file.name||''))return false;
  try{
    const scan=Math.min(file.size,64*1024);
    const head=new Uint8Array(await file.slice(0,scan).arrayBuffer());
    return bytesContainPdfHeader(head)
  }catch{return false}
}
async function validateSelectedFile(file,tool){
  const pdfTool=/application\/pdf|\.pdf/i.test(tool.accept||'');
  if(pdfTool){
    if(!/\.pdf$/i.test(file.name||''))return {ok:false,msg:`${file.name} 不是 .pdf 檔案`};
    // Unlock deliberately lets QPDF be the final parser. Some real-world encrypted
    // PDFs have unusual leading bytes/wrappers, so do not reject them before QPDF.
    if(tool.id==='unlock')return {ok:true};
    if(!(await looksLikePdf(file)))return {ok:false,msg:`${file.name} 不是有效 PDF`};
    return {ok:true};
  }
  const ext=(file.name.match(/(\.[^.]+)$/)||['',''])[1].toLowerCase();
  const accepted=(tool.accept||'').toLowerCase().split(',').map(x=>x.trim());
  const mime=(file.type||'').toLowerCase();
  const ok=accepted.some(a=>a===mime||a===ext||(a==='image/jpeg'&&['.jpg','.jpeg'].includes(ext))||(a==='image/png'&&ext==='.png'));
  return ok?{ok:true}:{ok:false,msg:`不支援檔案：${file.name}`};
}
async function addFiles(files){
  let arr=[...files];
  if(!state.tool.multiple&&arr.length>1)arr=arr.slice(0,1);
  const valid=[];
  for(const f of arr){
    const check=await validateSelectedFile(f,state.tool);
    if(check.ok) valid.push(f); else toast(check.msg);
  }
  if(!state.tool.multiple)state.files=[];
  state.files.push(...valid);
  if(!state.files.length){renderFileSummary();return}
  const total=state.files.reduce((s,f)=>s+f.size,0);
  if(total>200*1024*1024){state.files=[];renderFileSummary();toast('檔案總大小超過 200 MB 安全上限');return}
  renderFileSummary();clearResult();await setupTool()
}
async function setupTool(){const id=state.tool.id;if(id==='pages')return setupPageManager();if(id==='watermark')return setupWatermark();if(id==='protect')return setupProtect();if(id==='unlock')return setupUnlock();if(id==='docx')return setupDocx();if(id==='xlsx')return setupXlsx();if(id==='markdown'||id==='html'||id==='txt'){const text=await state.files[0].text();$('#textSource').value=text;return}if(id==='merge')return setupMerge();if(id==='split')return setupSplit();if(id==='img2pdf')return setupImg2pdf();if(id==='pdf2img')return setupPdf2img();if(id==='info')return setupInfo()}
async function loadPdfPreview(file){const pdfjs=await getPdfjs();const data=new Uint8Array(await file.arrayBuffer());return pdfjs.getDocument({data}).promise}
function setProgress(p,t='處理中…'){els.progressWrap.hidden=false;els.progress.value=p;els.progressText.textContent=t;els.progressPct.textContent=`${Math.round(p)}%`}
function clearProgress(){els.progressWrap.hidden=true;els.progress.value=0}
async function setupPageManager(){setProgress(3,'讀取 PDF…');try{state.pdfjsDoc=await loadPdfPreview(state.files[0]);const n=state.pdfjsDoc.numPages;state.pageItems=Array.from({length:n},(_,i)=>({orig:i,deleted:false,rotation:0}));els.workspace.innerHTML=`<div class="page-toolbar"><button id="undoBtn" class="smallbtn">↶ Undo</button><button id="resetBtn" class="smallbtn">重設</button><button id="reverseBtn" class="smallbtn">反轉排序</button></div><p class="history-note">長按縮圖後拖拉排序；按右上角 × 標記刪除。原始 PDF 不會被修改。</p><div id="pageGrid" class="page-grid"></div>`;renderPageGrid();clearProgress();els.actions.innerHTML='<button class="primary" id="exportPages">產生新 PDF</button>';$('#exportPages').onclick=exportPageManager;$('#undoBtn').onclick=undoPageAction;$('#resetBtn').onclick=()=>{pushHistory();state.pageItems=Array.from({length:n},(_,i)=>({orig:i,deleted:false,rotation:0}));renderPageGrid()};$('#reverseBtn').onclick=()=>{pushHistory();state.pageItems.reverse();renderPageGrid()}}catch(e){clearProgress();toast(`PDF 讀取失敗：${e.message}`)}}
function pushHistory(){state.history.push(JSON.stringify(state.pageItems));if(state.history.length>20)state.history.shift()}
function undoPageAction(){const h=state.history.pop();if(!h)return toast('沒有可復原操作');state.pageItems=JSON.parse(h);renderPageGrid()}
function renderPageGrid(){const grid=$('#pageGrid');if(!grid)return;grid.innerHTML=state.pageItems.map((it,pos)=>`<div class="page-card ${it.deleted?'deleted':''}" data-orig="${it.orig}"><button class="delete-page" type="button" data-del="${it.orig}" aria-label="刪除原頁 ${it.orig+1}">×</button><div class="thumb-wrap"><span class="thumb-placeholder">原頁 ${it.orig+1}</span></div><div class="page-meta"><span><b>${pos+1}</b> · 原頁 ${it.orig+1}</span><span class="drag-handle">≡</span></div></div>`).join('');grid.querySelectorAll('[data-del]').forEach(b=>b.onclick=e=>{e.stopPropagation();const orig=Number(b.dataset.del),it=state.pageItems.find(x=>x.orig===orig);if(!it.deleted&&state.pageItems.filter(x=>!x.deleted).length<=1)return toast('至少要保留 1 頁');pushHistory();it.deleted=!it.deleted;renderPageGrid()});if(state.sort){state.sort.destroy();state.sort=null}if(window.Sortable){state.sort=new Sortable(grid,{animation:170,handle:'.drag-handle',delay:160,delayOnTouchOnly:true,touchStartThreshold:4,onStart:()=>pushHistory(),onEnd:()=>{const order=[...grid.children].map(el=>Number(el.dataset.orig));state.pageItems=order.map(o=>state.pageItems.find(x=>x.orig===o));renderPageGrid()}})}lazyRenderThumbs()}
async function lazyRenderThumbs(){const cards=[...document.querySelectorAll('.page-card')];const obs=new IntersectionObserver(entries=>entries.forEach(async en=>{if(!en.isIntersecting)return;obs.unobserve(en.target);const orig=Number(en.target.dataset.orig),wrap=en.target.querySelector('.thumb-wrap');try{const page=await state.pdfjsDoc.getPage(orig+1),vp0=page.getViewport({scale:1}),scale=Math.min(220/vp0.width,260/vp0.height),vp=page.getViewport({scale,rotation:state.pageItems.find(x=>x.orig===orig)?.rotation||0}),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(vp.width));canvas.height=Math.max(1,Math.ceil(vp.height));await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;wrap.innerHTML='';wrap.appendChild(canvas);page.cleanup()}catch{wrap.innerHTML='<span class="thumb-placeholder">預覽失敗</span>'}}),{root:els.dialog,rootMargin:'420px'});cards.forEach(c=>obs.observe(c))}
async function exportPageManager(){try{if(!window.PDFLib)throw new Error('pdf-lib 未載入');const {PDFDocument,degrees}=PDFLib,src=await PDFDocument.load(await state.files[0].arrayBuffer()),out=await PDFDocument.create(),keep=state.pageItems.filter(x=>!x.deleted);for(let i=0;i<keep.length;i++){setProgress(5+80*(i+1)/keep.length,`建立頁面 ${i+1}/${keep.length}`);const [p]=await out.copyPages(src,[keep[i].orig]);if(keep[i].rotation)p.setRotation(degrees((p.getRotation().angle+keep[i].rotation)%360));out.addPage(p)}return saveResult(new Blob([await out.save()],{type:'application/pdf'}),`${baseName(state.files[0].name)}_visual_edited.pdf`)}catch(e){clearProgress();toast(e.message)}}
async function setupWatermark(){setProgress(5,'建立預覽…');try{state.pdfjsDoc=await loadPdfPreview(state.files[0]);els.workspace.innerHTML=`<div class="preview-layout"><div><div class="preview-box" id="wmPreview"><canvas id="wmCanvas"></canvas><div id="wmOverlay" class="wm-overlay">CONFIDENTIAL</div></div><div class="page-toolbar"><button id="prevPreview" class="smallbtn">‹</button><span id="previewLabel" class="history-note">Page 1 / ${state.pdfjsDoc.numPages}</span><button id="nextPreview" class="smallbtn">›</button></div></div><div class="controls">${field('水印文字','<input id="wmText" value="CONFIDENTIAL" maxlength="80">')}<div class="inline">${field('字體大小','<input id="wmSize" type="range" min="18" max="96" value="46">')}${field('透明度','<input id="wmOpacity" type="range" min="5" max="80" value="20">')}</div><div class="inline">${field('角度','<select id="wmAngle"><option value="-35">-35°</option><option value="0">0°</option><option value="35">35°</option></select>')}${field('顏色','<input id="wmColor" type="color" value="#9f1239">')}</div>${field('套用頁面','<select id="wmPages"><option value="all">全部頁</option><option value="odd">奇數頁</option><option value="even">偶數頁</option></select>')}<div class="hint">可以直接用手指拖動預覽上的水印位置。輸出時以頁面比例儲存位置。</div></div></div>`;state.previewPage=1;await renderWatermarkPage();bindWatermarkControls();clearProgress();els.actions.innerHTML='<button class="primary" id="exportWm">輸出水印 PDF</button>';$('#exportWm').onclick=exportWatermark}catch(e){clearProgress();toast(e.message)}}
async function renderWatermarkPage(){const page=await state.pdfjsDoc.getPage(state.previewPage),host=$('#wmPreview'),canvas=$('#wmCanvas'),vp0=page.getViewport({scale:1}),maxW=Math.min(host.clientWidth-24,620),scale=Math.max(.35,Math.min(maxW/vp0.width,.95)),vp=page.getViewport({scale});canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;$('#previewLabel').textContent=`Page ${state.previewPage} / ${state.pdfjsDoc.numPages}`;positionOverlay()}
function bindWatermarkControls(){['wmText','wmSize','wmOpacity','wmAngle','wmColor'].forEach(id=>$('#'+id).addEventListener('input',updateOverlay));$('#prevPreview').onclick=async()=>{if(state.previewPage>1){state.previewPage--;await renderWatermarkPage()}};$('#nextPreview').onclick=async()=>{if(state.previewPage<state.pdfjsDoc.numPages){state.previewPage++;await renderWatermarkPage()}};const ov=$('#wmOverlay'),host=$('#wmPreview');let drag=false;ov.onpointerdown=e=>{drag=true;ov.setPointerCapture(e.pointerId)};ov.onpointermove=e=>{if(!drag)return;const r=host.getBoundingClientRect();state.wm.x=Math.max(.05,Math.min(.95,(e.clientX-r.left)/r.width));state.wm.y=Math.max(.05,Math.min(.95,(e.clientY-r.top)/r.height));positionOverlay()};ov.onpointerup=()=>drag=false;updateOverlay()}
function updateOverlay(){const ov=$('#wmOverlay');if(!ov)return;ov.textContent=$('#wmText').value||' ';ov.style.fontSize=`${$('#wmSize').value}px`;ov.style.opacity=Number($('#wmOpacity').value)/100;ov.style.color=$('#wmColor').value;positionOverlay()}
function positionOverlay(){const ov=$('#wmOverlay');if(!ov)return;ov.style.left=`${state.wm.x*100}%`;ov.style.top=`${state.wm.y*100}%`;ov.style.transform=`translate(-50%,-50%) rotate(${$('#wmAngle')?.value||-35}deg)`}
async function watermarkPng(text,size,color){const c=document.createElement('canvas'),ctx=c.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2),fs=Math.max(20,Number(size))*dpr;ctx.font=`900 ${fs}px -apple-system,BlinkMacSystemFont,"PingFang HK","PingFang TC","Noto Sans TC",sans-serif`;const m=ctx.measureText(text),pad=22*dpr;c.width=Math.ceil(m.width+pad*2);c.height=Math.ceil(fs*1.55);ctx.font=`900 ${fs}px -apple-system,BlinkMacSystemFont,"PingFang HK","PingFang TC","Noto Sans TC",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,c.width/2,c.height/2);const b=await new Promise(r=>c.toBlob(r,'image/png'));return new Uint8Array(await b.arrayBuffer())}
async function exportWatermark(){try{const {PDFDocument,degrees}=PDFLib,doc=await PDFDocument.load(await state.files[0].arrayBuffer()),text=$('#wmText').value.trim();if(!text)throw new Error('請輸入水印文字');const png=await watermarkPng(text,$('#wmSize').value,$('#wmColor').value),img=await doc.embedPng(png),angle=Number($('#wmAngle').value),opacity=Number($('#wmOpacity').value)/100,mode=$('#wmPages').value,pages=doc.getPages();pages.forEach((p,i)=>{const n=i+1;if(mode==='odd'&&n%2===0)return;if(mode==='even'&&n%2===1)return;const {width,height}=p.getSize(),target=Math.min(width*.68,500),h=target*(img.height/img.width);p.drawImage(img,{x:state.wm.x*width-target/2,y:(1-state.wm.y)*height-h/2,width:target,height:h,rotate:degrees(angle),opacity});if(i%8===0)setProgress(8+75*(i+1)/pages.length,'加入水印…')});saveResult(new Blob([await doc.save()],{type:'application/pdf'}),`${baseName(state.files[0].name)}_watermarked.pdf`)}catch(e){clearProgress();toast(e.message)}}
async function setupMerge(){
  if(state.sort){state.sort.destroy();state.sort=null}
  const snapshot=[...state.files],generation=++state.mergeGeneration,show=state.mergePreview;
  els.workspace.innerHTML=`<div class="merge-toolbar"><label class="toggle-row"><input id="mergePreviewToggle" type="checkbox" ${show?'checked':''}><span>顯示首頁預覽</span></label><span class="history-note">拖拉 ≡ 改變合併次序</span></div><div id="mergeList" class="merge-list">${snapshot.map((f,i)=>`<div class="merge-card ${show?'has-preview':''}" data-i="${i}">${show?'<div class="merge-thumb"><span>載入…</span></div>':''}<div class="merge-info"><b>${esc(f.name)}</b><small class="merge-meta">${bytes(f.size)}</small></div><div class="merge-actions"><button class="remove-merge" data-remove="${i}" type="button" aria-label="移除">×</button><span class="merge-handle" aria-label="拖拉排序">≡</span></div></div>`).join('')}</div><button id="addMoreMerge" class="secondary wide-btn" type="button">＋ 加入 PDF</button>`;
  els.actions.innerHTML='<button id="runMerge" class="primary">合併 PDF</button>';
  $('#mergePreviewToggle').onchange=e=>{state.mergePreview=e.target.checked;setupMerge()};
  $('#addMoreMerge').onclick=()=>els.input.click();
  $('#mergeList').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const idx=Number(b.dataset.remove);state.files.splice(idx,1);renderFileSummary();if(!state.files.length){els.workspace.innerHTML='';els.actions.innerHTML='';return}setupMerge()});
  if(window.Sortable){state.sort=new Sortable($('#mergeList'),{animation:180,handle:'.merge-handle',delay:140,delayOnTouchOnly:true,touchStartThreshold:4,onEnd:()=>{const order=[...$('#mergeList').children].map(el=>Number(el.dataset.i));state.files=order.map(i=>snapshot[i]);renderFileSummary();setupMerge()}})}
  if(show)renderMergePreviews(snapshot,generation);
  $('#runMerge').onclick=runMerge;
}
async function renderMergePreviews(files,generation){for(let i=0;i<files.length;i++){if(generation!==state.mergeGeneration)return;const host=document.querySelector(`.merge-card[data-i="${i}"] .merge-thumb`);const meta=document.querySelector(`.merge-card[data-i="${i}"] .merge-meta`);if(!host)continue;try{const pdf=await loadPdfPreview(files[i]);const page=await pdf.getPage(1),vp0=page.getViewport({scale:1}),scale=Math.min(150/vp0.width,180/vp0.height),vp=page.getViewport({scale}),c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(vp.width));c.height=Math.max(1,Math.ceil(vp.height));await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;if(generation!==state.mergeGeneration){c.width=1;c.height=1;page.cleanup();await pdf.destroy();return}host.innerHTML='';host.appendChild(c);meta.textContent=`${pdf.numPages} 頁 · ${bytes(files[i].size)}`;page.cleanup();await pdf.destroy()}catch(e){host.innerHTML='<span>預覽失敗</span>';meta.textContent=bytes(files[i].size)}}}
async function runMerge(){try{if(state.files.length<2)throw new Error('請至少加入 2 份 PDF');const {PDFDocument}=PDFLib,out=await PDFDocument.create();for(let i=0;i<state.files.length;i++){setProgress(5+80*(i+1)/state.files.length,`合併 ${i+1}/${state.files.length}`);const src=await PDFDocument.load(await state.files[i].arrayBuffer()),pages=await out.copyPages(src,src.getPageIndices());pages.forEach(p=>out.addPage(p))}saveResult(new Blob([await out.save()],{type:'application/pdf'}),`${baseName(state.files[0].name)}_merged.pdf`)}catch(e){clearProgress();toast(e.message)}}
function parsePages(text,max){const out=[];for(const raw of text.split(',')){const p=raw.trim();if(!p)continue;if(p.includes('-')){const[a,b]=p.split('-').map(Number);if(!Number.isInteger(a)||!Number.isInteger(b)||a<1||b<a||b>max)throw new Error(`無效範圍：${p}`);for(let i=a;i<=b;i++)out.push(i-1)}else{const n=Number(p);if(!Number.isInteger(n)||n<1||n>max)throw new Error(`無效頁碼：${p}`);out.push(n-1)}}return out}

function uniquePageIndexes(arr){const seen=new Set(),out=[];for(const n of arr){if(!seen.has(n)){seen.add(n);out.push(n)}}return out}
function pageIndexesToRangeString(arr){
  const pages=uniquePageIndexes(arr).map(x=>x+1).sort((a,b)=>a-b);
  if(!pages.length)return '';
  const out=[];let start=pages[0],prev=pages[0];
  for(let i=1;i<=pages.length;i++){
    const cur=pages[i];
    if(cur===prev+1){prev=cur;continue}
    out.push(start===prev?String(start):`${start}-${prev}`);
    start=cur;prev=cur
  }
  return out.join(',')
}
function getPdf2imgSelectedIndexes(){
  if(state.pdf2imgMode==='all')return Array.from({length:state.pdf2imgPageCount},(_,i)=>i);
  const input=$('#pdf2imgPages');
  if(input && input.value.trim()){
    return uniquePageIndexes(parsePages(input.value.trim(),state.pdf2imgPageCount))
  }
  return uniquePageIndexes([...state.pdf2imgSelected]).sort((a,b)=>a-b)
}
function syncPdf2imgInput(){
  const input=$('#pdf2imgPages');
  if(input && state.pdf2imgMode==='custom'){
    input.value=pageIndexesToRangeString([...state.pdf2imgSelected].sort((a,b)=>a-b))
  }
}
function renderPdf2imgSelectionSummary(){
  const badge=$('#pdf2imgSelectionBadge');
  if(!badge)return;
  const count=state.pdf2imgMode==='all'?state.pdf2imgPageCount:state.pdf2imgSelected.size;
  badge.textContent=state.pdf2imgMode==='all'
    ? `已選全部 ${state.pdf2imgPageCount} 頁`
    : (count?`已選 ${count} 頁`:'尚未選擇頁面');
}
function renderPdf2imgChips(){
  const host=$('#pdf2imgChipGrid');
  if(!host)return;
  const custom=state.pdf2imgMode==='custom';
  host.innerHTML=Array.from({length:state.pdf2imgPageCount},(_,i)=>{
    const selected=custom && state.pdf2imgSelected.has(i);
    return `<button type="button" class="page-chip ${selected?'active':''}" data-page="${i+1}" ${custom?'':'disabled'}>${i+1}</button>`
  }).join('');
  host.querySelectorAll('[data-page]').forEach(btn=>btn.onclick=()=>{
    if(state.pdf2imgMode!=='custom')return;
    const idx=Number(btn.dataset.page)-1;
    if(state.pdf2imgSelected.has(idx))state.pdf2imgSelected.delete(idx);
    else state.pdf2imgSelected.add(idx);
    btn.classList.toggle('active',state.pdf2imgSelected.has(idx));
    syncPdf2imgInput();
    renderPdf2imgSelectionSummary();
  })
}
function updatePdf2imgModeUI(){
  const custom=state.pdf2imgMode==='custom';
  $('#pdf2imgCustomWrap')?.toggleAttribute('hidden',!custom);
  $('#pdf2imgChipTools')?.toggleAttribute('hidden',!custom || state.pdf2imgPageCount>20);
  $('#pdf2imgChipGrid')?.toggleAttribute('hidden',!custom || state.pdf2imgPageCount>20);
  renderPdf2imgSelectionSummary();
  renderPdf2imgChips();
}
async function setupSplit(){
  setProgress(3,'讀取 PDF…');
  try{
    if(state.pdfjsDoc){try{await state.pdfjsDoc.destroy()}catch{}}
    state.pdfjsDoc=await loadPdfPreview(state.files[0]);state.splitPageCount=state.pdfjsDoc.numPages;state.splitPoints=new Set();state.splitMode=state.splitPageCount<=VISUAL_SPLIT_THRESHOLD?'visual':'range';
    renderSplitShell();clearProgress();
  }catch(e){clearProgress();toast(`PDF 讀取失敗：${e.message}`)}
}
function renderSplitShell(){const n=state.splitPageCount;els.workspace.innerHTML=`<div class="split-top"><div class="split-tabs"><button id="splitVisualTab" class="smallbtn ${state.splitMode==='visual'?'active-tab':''}">縮圖</button><button id="splitRangeTab" class="smallbtn ${state.splitMode==='range'?'active-tab':''}">輸入範圍</button></div><span class="history-note">${n} 頁</span></div><div id="splitModeHost"></div>`;$('#splitVisualTab').onclick=()=>{state.splitMode='visual';renderSplitShell()};$('#splitRangeTab').onclick=()=>{state.splitMode='range';renderSplitShell()};if(state.splitMode==='visual')renderVisualSplit();else renderRangeSplit();els.actions.innerHTML='<button id="runSplit" class="primary">分割 PDF</button>';$('#runSplit').onclick=runSplit}
function renderVisualSplit(){
  const n=state.splitPageCount,host=$('#splitModeHost');
  host.innerHTML=`<div id="splitSummary" class="split-summary"></div><div class="split-viewport"><div id="splitVisualList" class="split-filmstrip">${Array.from({length:n},(_,i)=>`<div class="split-page" data-page="${i+1}"><div class="split-page-head"><b>Page ${i+1}</b></div><div class="split-thumb"><span>Page ${i+1}</span></div></div>${i<n-1?`<button class="split-divider ${state.splitPoints.has(i+1)?'is-cut':''}" data-cut="${i+1}" type="button" aria-label="在第 ${i+1} 與 ${i+2} 頁之間${state.splitPoints.has(i+1)?'取消':'加入'}分割線"><span>${state.splitPoints.has(i+1)?'✂':'＋'}</span></button>`:''}`).join('')}</div><div class="split-scroll-hint"><span>← 左右滑動查看頁面 →</span><span>按 ＋ 加入分割線</span></div></div>`;
  host.querySelectorAll('[data-cut]').forEach(b=>b.onclick=()=>{
    const p=Number(b.dataset.cut);
    const active=state.splitPoints.has(p);
    active?state.splitPoints.delete(p):state.splitPoints.add(p);
    const isCut=!active;
    b.classList.toggle('is-cut',isCut);
    b.querySelector('span').textContent=isCut?'✂':'＋';
    b.setAttribute('aria-label',`在第 ${p} 與 ${p+1} 頁之間${isCut?'取消':'加入'}分割線`);
    updateSplitSummary();
  });
  updateSplitSummary();lazyRenderSplitThumbs()
}
async function lazyRenderSplitThumbs(){const cards=[...document.querySelectorAll('.split-page')],viewport=document.querySelector('.split-viewport');const obs=new IntersectionObserver(entries=>entries.forEach(async en=>{if(!en.isIntersecting)return;obs.unobserve(en.target);const n=Number(en.target.dataset.page),wrap=en.target.querySelector('.split-thumb');try{const page=await state.pdfjsDoc.getPage(n),vp0=page.getViewport({scale:1}),scale=Math.min(210/vp0.width,260/vp0.height),vp=page.getViewport({scale}),c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(vp.width));c.height=Math.max(1,Math.ceil(vp.height));await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;wrap.innerHTML='';wrap.appendChild(c);page.cleanup()}catch{wrap.innerHTML='<span>預覽失敗</span>'}}),{root:viewport,rootMargin:'0px 500px'});cards.forEach(c=>obs.observe(c))}
function splitRangesFromPoints(){const n=state.splitPageCount,cuts=[...state.splitPoints].sort((a,b)=>a-b),parts=[];let start=1;for(const c of cuts){parts.push(`${start}-${c}`);start=c+1}parts.push(`${start}-${n}`);return parts}
function updateSplitSummary(){const el=$('#splitSummary');if(!el)return;const parts=splitRangesFromPoints();el.innerHTML=`<b>${parts.length} 份</b><span>${parts.map((r,i)=>`Part ${i+1}: ${r}`).join(' · ')}</span>`}
function renderRangeSplit(){const n=state.splitPageCount,host=$('#splitModeHost');host.innerHTML=`<div class="inline">${field('每 N 頁','<select id="splitEvery"><option value="">自訂</option><option value="1">1</option><option value="2">2</option><option value="5">5</option><option value="10">10</option><option value="20">20</option></select>')}${field('','<button id="applyEvery" class="secondary field-button" type="button">套用</button>')}</div>${field('分割範圍',`<textarea id="splitRanges" placeholder="例如：1-10, 11-25, 26-${n}">${esc(state.splitRangeText||'')}</textarea>`)}`;$('#splitRanges').oninput=e=>state.splitRangeText=e.target.value;$('#applyEvery').onclick=()=>{const every=Number($('#splitEvery').value);if(!every)return toast('請選擇每 N 頁');const parts=[];for(let start=1;start<=n;start+=every)parts.push(`${start}-${Math.min(n,start+every-1)}`);$('#splitRanges').value=parts.join(', ');state.splitRangeText=$('#splitRanges').value}}
function splitFileSuffix(range,idx){
  const clean=String(range).replace(/\s+/g,'');
  const m=clean.match(/^(\d+)-(\d+)$/);
  if(m)return `page${m[1]}-${m[2]}`;
  if(/^\d+$/.test(clean))return `page${clean}`;
  if(idx?.length){
    const first=idx[0]+1,last=idx[idx.length-1]+1;
    return first===last?`page${first}`:`page${first}-${last}`;
  }
  return 'pages';
}
async function runSplit(){try{
  const {PDFDocument}=PDFLib,src=await PDFDocument.load(await state.files[0].arrayBuffer());
  let parts;
  if(state.splitMode==='visual'){
    if(!state.splitPoints.size)throw new Error('請至少加入 1 條分割線');
    parts=splitRangesFromPoints()
  }else{
    parts=$('#splitRanges').value.split(',').map(x=>x.trim()).filter(Boolean);
    if(parts.length<2)throw new Error('請輸入至少 2 個分割範圍')
  }
  const zip=new JSZip(),base=baseName(state.files[0].name);
  for(let i=0;i<parts.length;i++){
    const idx=parsePages(parts[i],src.getPageCount());
    if(!idx.length)throw new Error(`無效範圍：${parts[i]}`);
    const out=await PDFDocument.create(),pages=await out.copyPages(src,idx);
    pages.forEach(p=>out.addPage(p));
    zip.file(`${base}_${splitFileSuffix(parts[i],idx)}.pdf`,await out.save());
    setProgress(8+60*(i+1)/parts.length,`建立 ${i+1}/${parts.length}`)
  }
  const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'},m=>setProgress(70+m.percent*.25,'建立 ZIP…'));
  saveResult(blob,`${base}_split.zip`)
}catch(e){clearProgress();toast(e.message)}}
function setupProtect(){
  els.workspace.innerHTML=`<div class="controls protect-controls"><div class="inline">${field('開啟密碼','<input id="openPassword" type="password" autocomplete="new-password">')}${field('確認密碼','<input id="confirmPassword" type="password" autocomplete="new-password">')}</div>${field('擁有者密碼','<input id="ownerPassword" type="password" autocomplete="new-password" placeholder="留空 = 同開啟密碼">')}<label class="check-row"><input id="showPasswords" type="checkbox"> 顯示密碼</label><div class="security-badge">AES-256</div><div class="permission-grid"><label><input id="allowPrinting" type="checkbox" checked> 列印</label><label><input id="allowCopying" type="checkbox" checked> 複製</label><label><input id="allowModifying" type="checkbox" checked> 修改</label><label><input id="allowAnnotating" type="checkbox" checked> 註解</label><label><input id="allowFillingForms" type="checkbox" checked> 填寫表格</label><label><input id="allowAssembly" type="checkbox" checked> 文件組合</label></div></div>`;
  $('#showPasswords').onchange=e=>{['openPassword','confirmPassword','ownerPassword'].forEach(id=>$('#'+id).type=e.target.checked?'text':'password')};
  els.actions.innerHTML='<button id="runProtect" class="primary">加密 PDF</button>';$('#runProtect').onclick=runProtect;
}
async function runProtect(){try{if(!window.PDFEncrypt?.encryptPDF)throw new Error('PDF 加密元件未載入');if(!window.isSecureContext||!crypto?.subtle)throw new Error('AES-256 需要 HTTPS 或 localhost');const user=$('#openPassword').value,confirm=$('#confirmPassword').value,owner=$('#ownerPassword').value||user;if(!user)throw new Error('請輸入開啟密碼');if(user!==confirm)throw new Error('兩次開啟密碼不相同');setProgress(12,'AES-256 加密中…');const input=new Uint8Array(await state.files[0].arrayBuffer());const encrypted=await PDFEncrypt.encryptPDF(input,user,{ownerPassword:owner,algorithm:'AES-256',allowPrinting:$('#allowPrinting').checked,allowCopying:$('#allowCopying').checked,allowModifying:$('#allowModifying').checked,allowAnnotating:$('#allowAnnotating').checked,allowFillingForms:$('#allowFillingForms').checked,allowAssembly:$('#allowAssembly').checked,allowExtraction:true,allowHighQualityPrint:$('#allowPrinting').checked});saveResult(new Blob([encrypted],{type:'application/pdf'}),`${baseName(state.files[0].name)}_protected.pdf`)}catch(e){clearProgress();toast(e.message)}}

async function getQpdfFactory(){
  if(state.qpdfFactory)return state.qpdfFactory;
  const mod=await import('https://cdn.jsdelivr.net/npm/qpdf-wasm-esm-embedded@1.1.1/qpdf.mjs');
  state.qpdfFactory=mod.default||mod;
  return state.qpdfFactory
}
function setupUnlock(){els.workspace.innerHTML=`<div class="controls unlock-controls">${field('PDF 開啟密碼','<input id="unlockPassword" type="password" autocomplete="current-password" placeholder="如 PDF 要求密碼才輸入">')}<label class="check-row"><input id="showUnlockPassword" type="checkbox"> 顯示密碼</label><div class="unlock-status"><i></i><span>輸入正確開啟密碼後，會建立一份不再要求密碼的新 PDF；原始檔案不會被修改。</span></div></div>`;$('#showUnlockPassword').onchange=e=>$('#unlockPassword').type=e.target.checked?'text':'password';els.actions.innerHTML='<button id="runUnlock" class="primary">移除 PDF 密碼</button>';$('#runUnlock').onclick=runUnlock}
function explainQpdfUnlockFailure(logs,exitCode){
  const detail=logs.join('\n').trim();
  if(/invalid password|incorrect password|password.*incorrect|supplied password is incorrect|requires a password/i.test(detail))
    return '密碼不正確';
  if(/not a pdf|can't find pdf header|unable to find trailer|xref.*not found/i.test(detail))
    return 'QPDF 無法解析此檔案為 PDF；檔案可能使用非標準封裝或結構';
  if(/unsupported.*encryption|unsupported encryption|unknown encryption|encryption.*not supported/i.test(detail))
    return '此 PDF 的加密方式目前不受 browser 解密引擎支援';
  if(/operation not permitted|permission denied/i.test(detail))
    return '解密引擎無法建立輸出檔案';
  if(detail)return `QPDF 解密失敗（code ${exitCode}）：${detail.slice(0,240)}`;
  return `QPDF 解密失敗（code ${exitCode}）。請確認密碼正確，再用其他 PDF 測試以判斷是否屬特定加密相容性問題`
}
async function runUnlock(){try{
  if(!state.files[0])throw new Error('請先選擇 PDF');
  setProgress(5,'載入 PDF 解密引擎…');
  const createModule=await getQpdfFactory(),logs=[];
  let qpdf;
  try{
    qpdf=await createModule({
      noInitialRun:true,
      print:t=>logs.push(String(t)),
      printErr:t=>logs.push(String(t))
    })
  }catch(e){
    throw new Error(`QPDF 解密引擎載入失敗：${e?.message||e}`)
  }
  setProgress(22,'準備 PDF…');
  const input=new Uint8Array(await state.files[0].arrayBuffer());
  const FS=qpdf.FS,work='work';
  try{FS.mkdir(work)}catch{}
  for(const p of [`${work}/input.pdf`,`${work}/output.pdf`]){
    try{FS.unlink(p)}catch{}
  }
  FS.writeFile(`${work}/input.pdf`,input);

  const password=$('#unlockPassword').value||'';
  // Match qpdf-wasm's browser example: infile first, then options, then outfile.
  const args=[`${work}/input.pdf`];
  if(password)args.push(`--password=${password}`);
  args.push('--decrypt',`${work}/output.pdf`);

  setProgress(45,'驗證密碼及移除加密…');
  let exitCode=0;
  try{
    const rc=qpdf.callMain(args);
    exitCode=Number.isFinite(rc)?rc:0
  }catch(e){
    exitCode=Number.isFinite(e?.status)?e.status:-1;
    if(e?.message)logs.push(String(e.message))
  }

  let output=null;
  try{output=FS.readFile(`${work}/output.pdf`)}catch{}
  if(!output||!output.length||(exitCode!==0&&exitCode!==3)){
    throw new Error(explainQpdfUnlockFailure(logs,exitCode))
  }

  // Final output sanity check. Do not use pdf-lib here: pdf-lib does not decrypt PDFs.
  const copy=new Uint8Array(output.length);copy.set(output);
  if(!bytesContainPdfHeader(copy.subarray(0,Math.min(copy.length,64*1024))))
    throw new Error('QPDF 已執行，但輸出沒有有效 PDF header；已停止下載以避免產生錯誤檔案');

  setProgress(88,'建立未加密 PDF…');
  for(const p of [`${work}/input.pdf`,`${work}/output.pdf`]){
    try{FS.unlink(p)}catch{}
  }
  saveResult(new Blob([copy],{type:'application/pdf'}),`${baseName(state.files[0].name)}_unlocked.pdf`)
}catch(e){
  clearProgress();
  toast(e.message||'移除 PDF 密碼失敗')
}}

function setupImg2pdf(){els.workspace.innerHTML=paperControls();els.actions.innerHTML='<button id="runImg" class="primary">建立 PDF</button>';$('#runImg').onclick=async()=>{try{const {PDFDocument}=PDFLib,out=await PDFDocument.create(),paper=$('#paper').value,orient=$('#orientation').value;let size=paper==='letter'?[612,792]:[595.28,841.89];if(orient==='landscape')size=size.reverse();for(let i=0;i<state.files.length;i++){const f=state.files[i],buf=await f.arrayBuffer(),img=f.type==='image/png'?await out.embedPng(buf):await out.embedJpg(buf),page=out.addPage(size),m=24,maxW=size[0]-m*2,maxH=size[1]-m*2,s=Math.min(maxW/img.width,maxH/img.height),w=img.width*s,h=img.height*s;page.drawImage(img,{x:(size[0]-w)/2,y:(size[1]-h)/2,width:w,height:h});setProgress(5+80*(i+1)/state.files.length,`加入圖片 ${i+1}/${state.files.length}`)}saveResult(new Blob([await out.save()],{type:'application/pdf'}),'images.pdf')}catch(e){clearProgress();toast(e.message)}}}
async function setupPdf2img(){
  try{
    setProgress(3,'讀取 PDF…');
    state.pdfjsDoc=await loadPdfPreview(state.files[0]);
    state.pdf2imgPageCount=state.pdfjsDoc.numPages;
    state.pdf2imgMode='all';
    state.pdf2imgSelected=new Set(Array.from({length:Math.min(state.pdf2imgPageCount,20)},(_,i)=>i));
    els.workspace.innerHTML=`
      <div class="controls">
        <div class="inline">
          ${field('格式','<select id="imgFmt"><option value="png">PNG</option><option value="jpeg">JPEG</option></select>')}
          ${field('清晰度','<select id="imgScale"><option value="1">1×</option><option value="1.5" selected>1.5×</option><option value="2">2×</option><option value="3">3×</option></select>')}
        </div>
        <div class="inline" style="margin-top:10px">
          ${field('頁面選擇','<select id="pdf2imgMode"><option value="all">全部頁面</option><option value="custom">自訂頁面</option></select>')}
          ${field('輸出方式','<select id="pdf2imgOutput"><option value="auto">自動（1頁=單張；多頁=ZIP）</option><option value="zip">永遠輸出 ZIP</option></select>')}
        </div>
        <div class="hint" style="margin-top:10px">PDF 共 <b>${state.pdf2imgPageCount}</b> 頁。可輸出全部頁面，或自訂頁碼如 <b>1,3,5-7</b>。</div>
        <div class="pdf2img-selection-badge" id="pdf2imgSelectionBadge"></div>
        <div id="pdf2imgCustomWrap" hidden>
          ${field('頁碼範圍','<input id="pdf2imgPages" type="text" placeholder="例如 1,3,5-7">','支援以逗號分隔頁碼及範圍。')}
        </div>
        <div id="pdf2imgChipTools" class="merge-toolbar" hidden>
          <button id="pdf2imgSelectAll" type="button" class="smallbtn">全選</button>
          <button id="pdf2imgClearAll" type="button" class="smallbtn">清除</button>
          <span class="history-note">點按頁碼選取</span>
        </div>
        <div id="pdf2imgChipGrid" class="page-chip-grid" hidden></div>
      </div>`;
    els.actions.innerHTML='<button id="runPdfImg" class="primary">轉換圖片</button>';

    $('#pdf2imgMode').onchange=e=>{
      state.pdf2imgMode=e.target.value;
      if(state.pdf2imgMode==='custom' && !state.pdf2imgSelected.size){
        state.pdf2imgSelected=new Set(Array.from({length:Math.min(state.pdf2imgPageCount,Math.min(5,state.pdf2imgPageCount))},(_,i)=>i));
      }
      updatePdf2imgModeUI();
      syncPdf2imgInput();
    };
    $('#pdf2imgPages').addEventListener('input',e=>{
      const val=e.target.value.trim();
      if(!val){state.pdf2imgSelected.clear();renderPdf2imgChips();renderPdf2imgSelectionSummary();return}
      try{
        state.pdf2imgSelected=new Set(uniquePageIndexes(parsePages(val,state.pdf2imgPageCount)));
        e.target.setCustomValidity('');
      }catch(err){
        e.target.setCustomValidity(err.message||'範圍格式錯誤');
      }
      renderPdf2imgChips();
      renderPdf2imgSelectionSummary();
    });
    $('#pdf2imgSelectAll').onclick=()=>{
      state.pdf2imgSelected=new Set(Array.from({length:state.pdf2imgPageCount},(_,i)=>i));
      syncPdf2imgInput();renderPdf2imgChips();renderPdf2imgSelectionSummary();
    };
    $('#pdf2imgClearAll').onclick=()=>{
      state.pdf2imgSelected.clear();
      syncPdf2imgInput();renderPdf2imgChips();renderPdf2imgSelectionSummary();
    };
    updatePdf2imgModeUI();
    clearProgress();
    $('#runPdfImg').onclick=runPdf2img
  }catch(e){
    clearProgress();
    toast(e.message)
  }
}
async function runPdf2img(){
  try{
    const pdf=state.pdfjsDoc||await loadPdfPreview(state.files[0]);
    const fmt=$('#imgFmt').value,mime=fmt==='png'?'image/png':'image/jpeg',ext=fmt==='png'?'png':'jpg';
    const scale=Number($('#imgScale').value),outputMode=$('#pdf2imgOutput').value;
    const pageIndexes=getPdf2imgSelectedIndexes();
    if(!pageIndexes.length)throw new Error('請選擇至少 1 頁');
    const pageSuffix=pageIndexesToRangeString(pageIndexes).replace(/,/g,'_');
    const makeBlob=canvas=>new Promise(r=>canvas.toBlob(r,mime,fmt==='png'?undefined:.9));
    if(outputMode==='auto' && pageIndexes.length===1){
      const n=pageIndexes[0]+1,p=await pdf.getPage(n),vp=p.getViewport({scale}),c=document.createElement('canvas');
      c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);
      await p.render({canvasContext:c.getContext('2d',{alpha:false}),viewport:vp}).promise;
      const blob=await makeBlob(c);
      c.width=1;c.height=1;p.cleanup();
      saveResult(blob,`${baseName(state.files[0].name)}_page${n}.${ext}`);
      return
    }
    const zip=new JSZip();
    for(let i=0;i<pageIndexes.length;i++){
      const n=pageIndexes[i]+1,p=await pdf.getPage(n),vp=p.getViewport({scale}),c=document.createElement('canvas');
      c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);
      await p.render({canvasContext:c.getContext('2d',{alpha:false}),viewport:vp}).promise;
      const blob=await makeBlob(c);
      zip.file(`page_${String(n).padStart(3,'0')}.${ext}`,blob);
      c.width=1;c.height=1;p.cleanup();
      setProgress(5+70*(i+1)/pageIndexes.length,`轉換 ${i+1}/${pageIndexes.length}`)
    }
    const blob=await zip.generateAsync({type:'blob'},m=>setProgress(78+m.percent*.19,'建立 ZIP…'));
    saveResult(blob,`${baseName(state.files[0].name)}_pages_${pageSuffix||'all'}_images.zip`)
  }catch(e){
    clearProgress();
    toast(e.message)
  }
}
async function setupDocx(){els.workspace.innerHTML='<div class="hint">Basic conversion：複雜 Word 排版、浮動物件、SmartArt、Track Changes 等可能與 Microsoft Word 不一致。</div>'+paperControls()+'<div id="officePreview" class="office-preview">正在解析 DOCX…</div>';try{if(!window.mammoth)throw new Error('Mammoth library 未載入');const res=await mammoth.convertToHtml({arrayBuffer:await state.files[0].arrayBuffer()});$('#officePreview').innerHTML=res.value||'<p>沒有可顯示內容</p>';els.actions.innerHTML='<button id="runDocx" class="primary">轉換 PDF</button>';$('#runDocx').onclick=()=>htmlElementToPdf($('#officePreview'),`${baseName(state.files[0].name)}_from_docx.pdf`)}catch(e){$('#officePreview').textContent=e.message}}
async function setupXlsx(){els.workspace.innerHTML='<div class="hint">Basic conversion：原生 chart、pivot、VBA、精確 Microsoft 分頁不保證。</div>'+paperControls()+'<div id="sheetControls" class="conversion-tabs"></div><div id="officePreview" class="office-preview">正在解析 XLSX…</div>';try{if(!window.XLSX)throw new Error('SheetJS library 未載入');state.workbook=XLSX.read(await state.files[0].arrayBuffer(),{type:'array'});$('#sheetControls').innerHTML=state.workbook.SheetNames.map((n,i)=>`<button class="smallbtn" data-sheet="${esc(n)}">${esc(n)}</button>`).join('');const show=n=>{$('#officePreview').innerHTML=XLSX.utils.sheet_to_html(state.workbook.Sheets[n],{editable:false})};show(state.workbook.SheetNames[0]);$('#sheetControls').querySelectorAll('[data-sheet]').forEach(b=>b.onclick=()=>show(b.dataset.sheet));els.actions.innerHTML='<button id="runXlsx" class="primary">轉換目前工作表 PDF</button>';$('#runXlsx').onclick=()=>htmlElementToPdf($('#officePreview'),`${baseName(state.files[0].name)}_from_xlsx.pdf`)}catch(e){$('#officePreview').textContent=e.message}}
async function convertText(){try{let src=$('#textSource').value,html='';if(state.tool.id==='markdown'){if(!window.marked)throw new Error('Marked library 未載入');html=marked.parse(src)}else if(state.tool.id==='html')html=src;else html=`<pre style="white-space:pre-wrap;font-family:-apple-system,BlinkMacSystemFont,'PingFang HK','Noto Sans TC',sans-serif;line-height:1.6">${esc(src)}</pre>`;const temp=document.createElement('div');temp.className='office-preview';temp.style.position='fixed';temp.style.left='-10000px';temp.style.top='0';temp.innerHTML=html;document.body.appendChild(temp);await htmlElementToPdf(temp,`${state.tool.id}_converted.pdf`);temp.remove()}catch(e){clearProgress();toast(e.message)}}
async function htmlElementToPdf(el,name){try{if(!window.html2pdf)throw new Error('html2pdf library 未載入');setProgress(15,'建立 PDF…');const paper=$('#paper')?.value||'a4',orientation=$('#orientation')?.value||'portrait';const blob=await html2pdf().set({margin:[10,10,10,10],filename:name,image:{type:'jpeg',quality:.95},html2canvas:{scale:1.5,useCORS:true},jsPDF:{unit:'mm',format:paper,orientation}}).from(el).outputPdf('blob');saveResult(blob,name)}catch(e){clearProgress();toast(e.message)}}


function safeValue(v,fallback='—'){
  if(v===null||v===undefined||v==='')return fallback;
  if(v instanceof Date)return formatInfoDate(v);
  if(Array.isArray(v))return v.length?v.join(', '):fallback;
  if(typeof v==='object'){
    try{return JSON.stringify(v)}catch{return String(v)}
  }
  return String(v)
}
function formatInfoDate(v){
  if(!v)return '—';
  let d=v;
  if(!(d instanceof Date)){
    const s=String(v).trim();
    const m=s.match(/^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/);
    if(m){
      d=new Date(
        Number(m[1]),Number(m[2]||1)-1,Number(m[3]||1),
        Number(m[4]||0),Number(m[5]||0),Number(m[6]||0)
      )
    }else{
      const t=Date.parse(s);if(!Number.isNaN(t))d=new Date(t);else return s
    }
  }
  if(Number.isNaN(d.getTime()))return String(v);
  const p=new Intl.DateTimeFormat('zh-HK',{
    year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
  }).formatToParts(d).reduce((o,x)=>(o[x.type]=x.value,o),{});
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`
}
function asciiContains(bytes,needle,start=0,end=bytes.length){
  const n=new TextEncoder().encode(needle);
  outer:for(let i=start;i<=end-n.length;i++){
    for(let j=0;j<n.length;j++)if(bytes[i+j]!==n[j])continue outer;
    return true
  }
  return false
}
function readPdfVersion(bytes){
  const lim=Math.min(bytes.length,65536),sig=new TextEncoder().encode('%PDF-');
  outer:for(let i=0;i<=lim-sig.length-3;i++){
    for(let j=0;j<sig.length;j++)if(bytes[i+j]!==sig[j])continue outer;
    let s='';for(let k=i+5;k<Math.min(i+12,lim);k++){
      const c=String.fromCharCode(bytes[k]);
      if(!/[0-9.]/.test(c))break;s+=c
    }
    return s||'—'
  }
  return '—'
}
function detectEncryption(bytes){
  const tailStart=Math.max(0,bytes.length-2*1024*1024);
  return asciiContains(bytes,'/Encrypt',tailStart,bytes.length)
}
function sampledAscii(bytes){
  const dec=new TextDecoder('latin1');
  const head=bytes.subarray(0,Math.min(bytes.length,4*1024*1024));
  const tailStart=Math.max(head.length,bytes.length-1024*1024);
  const tail=bytes.subarray(tailStart);
  return dec.decode(head)+(tail.length?'\n'+dec.decode(tail):'')
}
function normalizePageMode(v){
  if(!v)return 'USE_NONE';
  return String(v).replace(/([a-z0-9])([A-Z])/g,'$1_$2').replace(/[\s-]+/g,'_').toUpperCase()
}
function sourceTypeFromMeta(...vals){
  const s=vals.filter(Boolean).join(' ').toLowerCase();
  if(/excel|openpyxl|spreadsheet/.test(s))return 'Workbook (推斷)';
  if(/powerpoint|presentation/.test(s))return 'Presentation (推斷)';
  if(/word|docx/.test(s))return 'Document (推斷)';
  return 'PDF'
}
function standardPageName(w,h){
  const a=Math.min(w,h),b=Math.max(w,h),tol=4;
  const standards=[
    ['A5',419.53,595.28],['A4',595.28,841.89],['A3',841.89,1190.55],
    ['Letter',612,792],['Legal',612,1008],['Tabloid',792,1224]
  ];
  const hit=standards.find(([,x,y])=>Math.abs(a-x)<=tol&&Math.abs(b-y)<=tol);
  return hit?hit[0]:'Custom'
}
function rectArray(r){
  if(!r)return null;
  return [
    Number(r.x.toFixed(2)),Number(r.y.toFixed(2)),
    Number((r.x+r.width).toFixed(2)),Number((r.y+r.height).toFixed(2))
  ]
}
function countOutline(nodes){
  if(!Array.isArray(nodes))return 0;
  return nodes.reduce((n,x)=>n+1+countOutline(x.items),0)
}
function countWordsSmart(text,lang='zh-HK'){
  text=String(text||'').trim();if(!text)return 0;
  try{
    if(Intl.Segmenter){
      const seg=new Intl.Segmenter(lang||'zh-HK',{granularity:'word'});
      let n=0;for(const x of seg.segment(text))if(x.isWordLike)n++;return n
    }
  }catch{}
  return (text.match(/[\p{L}\p{N}]+/gu)||[]).length
}
function countMapish(x){
  if(!x)return 0;
  if(x instanceof Map)return x.size;
  if(Array.isArray(x))return x.length;
  if(typeof x==='object')return Object.keys(x).length;
  return 0
}
function mapishEntries(x){
  if(!x)return [];
  if(x instanceof Map)return [...x.entries()];
  if(typeof x==='object')return Object.entries(x);
  return []
}
async function safeAsync(fn,fallback=null){
  try{return await fn()}catch{return fallback}
}
function xmpRawOf(metadata){
  if(!metadata)return '';
  try{if(typeof metadata.getRaw==='function')return metadata.getRaw()||''}catch{}
  return ''
}
function xmpAllOf(metadata){
  if(!metadata)return {};
  try{if(typeof metadata.getAll==='function')return metadata.getAll()||{}}catch{}
  return {}
}
function inferLanguage(info,xmpRaw,xmpAll){
  const direct=info?.Language||info?.language||xmpAll?.['dc:language']||xmpAll?.['dc:Language'];
  if(typeof direct==='string'&&direct.trim())return direct.trim().toUpperCase();
  if(Array.isArray(direct)&&direct.length)return String(direct[0]).toUpperCase();
  const m=String(xmpRaw||'').match(/<dc:language[\s\S]*?<rdf:li[^>]*>([^<]+)<\/rdf:li>/i);
  return m?m[1].trim().toUpperCase():'—'
}
function complianceFromXmp(raw){
  raw=String(raw||'');
  const list=[
    ['PDF/A',/pdfaid:part|pdfa\/ns\/id/i],
    ['PDF/X',/pdfxid:|GTS_PDFXVersion|pdf\/x/i],
    ['PDF/E',/pdfeid:|pdf\/e/i],
    ['PDF/VT',/pdfvtid:|pdf\/vt/i],
    ['PDF/UA',/pdfuaid:part|pdfua\/ns\/id/i],
    ['PDF/B',/pdfbid:|pdf\/b/i],
    ['PDF/SEC',/pdfsecid:|pdf\/sec/i]
  ];
  return list.map(([name,re])=>({name,detected:re.test(raw)}))
}
function permissionRows(pdfjs,permissions,encrypted){
  const P=pdfjs?.PermissionFlag||{};
  const defs=[
    ['Printing','PRINT',0x04],
    ['Modifying','MODIFY_CONTENTS',0x08],
    ['Extracting Content','COPY',0x10],
    ['Modifying annotations','MODIFY_ANNOTATIONS',0x20],
    ['Form Filling','FILL_INTERACTIVE_FORMS',0x100],
    ['Extracting for accessibility','COPY_FOR_ACCESSIBILITY',0x200],
    ['Document Assembly','ASSEMBLE',0x400],
    ['High-quality Printing','PRINT_HIGH_QUALITY',0x800]
  ];
  if(!encrypted||!permissions){
    return defs.map(([label])=>[label,'Allowed'])
  }
  const set=permissions instanceof Set?permissions:new Set(permissions||[]);
  return defs.map(([label,key,fallback])=>[label,set.has(P[key]??fallback)?'Allowed':'Not allowed'])
}
function infoRow(label,value,cls=''){
  return `<div class="pdf-info-row ${cls}"><span>${esc(label)}</span><b>${esc(safeValue(value))}</b></div>`
}
function infoSection(title,rows,note=''){
  return `<section class="pdf-info-section"><h3>${esc(title)}</h3><div class="pdf-info-list">${rows.map(r=>infoRow(r[0],r[1],r[2]||'')).join('')}</div>${note?`<p class="pdf-info-note">${esc(note)}</p>`:''}</section>`
}
function detailBlock(title,body,open=false){
  return `<details class="pdf-info-details" ${open?'open':''}><summary>${esc(title)}<span>›</span></summary><div class="pdf-info-detail-body">${body}</div></details>`
}
function downloadInspectorJson(){
  if(!state.infoReport)return;
  const blob=new Blob([JSON.stringify(state.infoReport,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`${baseName(state.files[0]?.name||'pdf')}_pdf_info.json`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),600)
}
async function copyInspectorSummary(){
  if(!state.infoReport)return;
  const r=state.infoReport,b=r.basic,d=r.document,sec=r.security;
  const text=[
    'PDF 摘要',r.overview,'',
    `Pages: ${b.pages}`,`File Size: ${b.fileSize}`,`PDF Version: ${b.pdfVersion}`,`Language: ${b.language}`,'',
    `Title: ${d.title||'-'}`,`Author: ${d.author||'-'}`,`Creator: ${d.creator||'-'}`,`Producer: ${d.producer||'-'}`,'',
    `Encrypted: ${sec.isEncrypted?'Yes':'No'}`
  ].join('\n');
  try{await navigator.clipboard.writeText(text);toast('摘要已複製')}catch{toast('Browser 不允許複製')}
}
async function setupInfo(password=''){
  const file=state.files[0];if(!file)return;
  setProgress(3,'分析 PDF…');
  els.actions.innerHTML='';
  try{
    // IMPORTANT: PDF.js may transfer/detach the ArrayBuffer passed in `data`.
    // Keep three independent copies:
    //   1) rawBytes   -> our binary/header/XMP heuristics
    //   2) pdfjsBytes -> PDF.js only (may become detached internally)
    //   3) pdfLibBuf  -> pdf-lib only
    const sourceBuffer=await file.arrayBuffer();
    const rawBytes=new Uint8Array(sourceBuffer.slice(0));
    const pdfjsBytes=new Uint8Array(sourceBuffer.slice(0));
    const pdfLibBuf=sourceBuffer.slice(0);

    const pdfjs=await getPdfjs();
    let pdf;
    try{
      pdf=await pdfjs.getDocument({data:pdfjsBytes,password:password||undefined}).promise
    }catch(e){
      clearProgress();
      if(e?.name==='PasswordException'||/password/i.test(e?.message||'')){
        els.workspace.innerHTML=`<section class="pdf-info-section"><h3>PDF 已加密</h3><div class="pdf-info-list">${infoRow('檔案',file.name)}${infoRow('狀態','需要開啟密碼才能讀取完整 PDF 資料')}</div><label class="field pdf-info-password"><span>PDF 開啟密碼</span><input id="infoPassword" type="password" autocomplete="current-password" placeholder="輸入密碼"></label></section>`;
        els.actions.innerHTML='<button id="runInfoPassword" class="primary">讀取 PDF 資料</button>';
        $('#runInfoPassword').onclick=()=>setupInfo($('#infoPassword').value);
        return
      }
      throw e
    }
    state.pdfjsDoc=pdf;

    const meta=await safeAsync(()=>pdf.getMetadata(),{info:{},metadata:null});
    const info=meta?.info||{},xmpRaw=xmpRawOf(meta?.metadata),xmpAll=xmpAllOf(meta?.metadata);
    const pdfLibDoc=await safeAsync(()=>PDFLib.PDFDocument.load(pdfLibBuf,{updateMetadata:false}),null);

    const [
      permissions,pageMode,pageLayout,attachments,fields,jsActions,outline,
      viewerPrefs,markInfo,openAction,pageLabels,optionalCfg,signatures
    ]=await Promise.all([
      safeAsync(()=>pdf.getPermissions(),null),
      safeAsync(()=>pdf.getPageMode(),'UseNone'),
      safeAsync(()=>pdf.getPageLayout(),''),
      safeAsync(()=>pdf.getAttachments(),null),
      safeAsync(()=>pdf.getFieldObjects(),null),
      safeAsync(()=>pdf.getJSActions(),null),
      safeAsync(()=>pdf.getOutline(),null),
      safeAsync(()=>pdf.getViewerPreferences(),null),
      safeAsync(()=>pdf.getMarkInfo(),null),
      safeAsync(()=>pdf.getOpenAction(),null),
      safeAsync(()=>pdf.getPageLabels(),null),
      safeAsync(()=>pdf.getOptionalContentConfig(),null),
      typeof pdf.getSignatures==='function'?safeAsync(()=>pdf.getSignatures(),null):Promise.resolve(null)
    ]);

    const pdfLibStatus=pdfLibDoc?'Available':'Unavailable (PDF.js data still available)';
    const version=readPdfVersion(rawBytes)||info.PDFFormatVersion||'—';
    const encrypted=detectEncryption(rawBytes);
    const language=inferLanguage(info,xmpRaw,xmpAll);
    const sampled=sampledAscii(rawBytes);
    const compliance=complianceFromXmp(xmpRaw);
    const compressionFilters=[
      ['FlateDecode',/\/FlateDecode\b/],
      ['DCTDecode',/\/DCTDecode\b/],
      ['JPXDecode',/\/JPXDecode\b/],
      ['LZWDecode',/\/LZWDecode\b/],
      ['CCITTFaxDecode',/\/CCITTFaxDecode\b/]
    ].filter(([,re])=>re.test(sampled)).map(([x])=>x);

    const pages=[],fontMap=new Map(),allLinks=[],annotationSubtypeCounts={};
    let totalChars=0,totalTextChars=0,totalWords=0,totalParagraphs=0,totalAnnotations=0,totalImages=0;

    for(let i=1;i<=pdf.numPages;i++){
      setProgress(8+72*i/pdf.numPages,`分析頁面 ${i}/${pdf.numPages}`);
      const p=await pdf.getPage(i);
      const [textContent,annotations,opList]=await Promise.all([
        safeAsync(()=>p.getTextContent(),{items:[],styles:{}}),
        safeAsync(()=>p.getAnnotations({intent:'display'}),[]),
        safeAsync(()=>p.getOperatorList(),{fnArray:[],argsArray:[]})
      ]);

      let text='',line='',paragraphs=0;
      for(const item of textContent.items||[]){
        const s=item?.str||'';
        text+=s;
        line+=s;
        if(item?.hasEOL){
          if(line.trim())paragraphs++;
          text+='\n';line=''
        }else if(s&&!/\s$/.test(s))text+=' '
      }
      if(line.trim())paragraphs++;
      const chars=text.length,textChars=(text.match(/\S/gu)||[]).length,words=countWordsSmart(text,language==='—'?'zh-HK':language);
      totalChars+=chars;totalTextChars+=textChars;totalWords+=words;totalParagraphs+=paragraphs;

      for(const [fontName,style] of Object.entries(textContent.styles||{})){
        let fo=null;
        try{fo=p.commonObjs?.get?.(fontName)}catch{}
        const current=fontMap.get(fontName)||{
          id:fontName,
          name:fo?.name||fo?.loadedName||fontName,
          fontFamily:style?.fontFamily||fo?.fallbackName||'—',
          vertical:!!style?.vertical,
          isType3:!!fo?.isType3Font,
          embedded:fo?.data?.length?true:(fo?.missingFile===true?false:null),
          count:0
        };
        current.count+=(textContent.items||[]).filter(x=>x.fontName===fontName).length;
        fontMap.set(fontName,current)
      }

      const anns=annotations||[];
      totalAnnotations+=anns.length;
      for(const a of anns){
        const subtype=a.subtype||a.annotationType||'Other';
        annotationSubtypeCounts[subtype]=(annotationSubtypeCounts[subtype]||0)+1;
        if(a.url||a.unsafeUrl||subtype==='Link'){
          allLinks.push({page:i,url:a.url||a.unsafeUrl||null,dest:a.dest||null})
        }
      }

      const OPS=pdfjs.OPS||{},imageCodes=new Set([
        OPS.paintImageXObject,OPS.paintInlineImageXObject,OPS.paintImageMaskXObject,OPS.paintSolidColorImageMask
      ].filter(x=>x!==undefined));
      const imageCount=(opList.fnArray||[]).filter(x=>imageCodes.has(x)).length;
      totalImages+=imageCount;

      const plPage=pdfLibDoc?.getPages?.()[i-1]||null;
      const media=plPage?.getMediaBox?.()||{x:p.view?.[0]||0,y:p.view?.[1]||0,width:(p.view?.[2]||0)-(p.view?.[0]||0),height:(p.view?.[3]||0)-(p.view?.[1]||0)};
      const crop=plPage?.getCropBox?.()||media,bleed=plPage?.getBleedBox?.()||crop,trim=plPage?.getTrimBox?.()||crop,art=plPage?.getArtBox?.()||crop;
      const rotation=plPage?.getRotation?.().angle??p.rotate??0;
      let contentsCount=null;
      try{
        const c=plPage?.node?.Contents?.();
        contentsCount=c?(typeof c.size==='function'?c.size():1):0
      }catch{}

      pages.push({
        page:i,
        widthPt:Number(media.width.toFixed(2)),heightPt:Number(media.height.toFixed(2)),
        widthIn:Number((media.width/72).toFixed(2)),heightIn:Number((media.height/72).toFixed(2)),
        widthCm:Number((media.width/72*2.54).toFixed(2)),heightCm:Number((media.height/72*2.54).toFixed(2)),
        standardPage:standardPageName(media.width,media.height),
        orientation:media.width>media.height?'Landscape':'Portrait',
        rotation,
        mediaBox:rectArray(media),cropBox:rectArray(crop),bleedBox:rectArray(bleed),trimBox:rectArray(trim),artBox:rectArray(art),
        textCharacters:chars,visibleTextCharacters:textChars,wordCount:words,paragraphCount:paragraphs,
        annotationsCount:anns.length,linksCount:anns.filter(a=>a.url||a.unsafeUrl||a.subtype==='Link').length,
        imagePaintOperations:imageCount,contentsCount
      });
      p.cleanup?.()
    }

    let layers=[];
    try{
      if(optionalCfg?.getOrder){
        const order=optionalCfg.getOrder();
        const walk=x=>Array.isArray(x)?x.flatMap(walk):[x];
        layers=walk(order||[]).filter(x=>typeof x==='string'||typeof x==='number').map(String)
      }else if(optionalCfg?.getGroups){
        const g=optionalCfg.getGroups();layers=g?Object.keys(g):[]
      }
    }catch{}

    const fieldEntries=mapishEntries(fields);
    const attachmentEntries=mapishEntries(attachments).map(([name,v])=>({
      name:v?.filename||name,size:v?.content?.length??null
    }));
    const jsEntries=mapishEntries(jsActions).map(([name,v])=>({
      name,value:Array.isArray(v)?v.join('\n'):String(v??'')
    }));
    const signatureList=Array.isArray(signatures)?signatures:[];
    const xmpDocumentId=(xmpRaw.match(/xmpMM:DocumentID[^>]*>([^<]+)/i)||[])[1]||null;
    const xmpInstanceId=(xmpRaw.match(/xmpMM:InstanceID[^>]*>([^<]+)/i)||[])[1]||null;

    const libCreation=pdfLibDoc?.getCreationDate?.(),libMod=pdfLibDoc?.getModificationDate?.();
    const docInfo={
      title:info.Title||pdfLibDoc?.getTitle?.()||null,
      author:info.Author||pdfLibDoc?.getAuthor?.()||null,
      subject:info.Subject||pdfLibDoc?.getSubject?.()||null,
      keywords:info.Keywords||pdfLibDoc?.getKeywords?.()||null,
      creator:info.Creator||pdfLibDoc?.getCreator?.()||null,
      producer:info.Producer||pdfLibDoc?.getProducer?.()||null,
      created:formatInfoDate(libCreation||info.CreationDate),
      modified:formatInfoDate(libMod||info.ModDate||info.ModificationDate),
      trapped:info.Trapped||null,
      documentId:xmpDocumentId,
      instanceId:xmpInstanceId,
      sourceType:null
    };
    // Fix source type after object initialization without self-reference.
    docInfo.sourceType=sourceTypeFromMeta(info.Creator,info.Producer,docInfo.author);

    const securityRows=permissionRows(pdfjs,permissions,encrypted);
    const complianceDetected=compliance.filter(x=>x.detected).map(x=>x.name);
    const overview=`This is a ${pdf.numPages}-page PDF${docInfo.author?` created by ${docInfo.author}`:(docInfo.creator?` created by ${docInfo.creator}`:'')} (PDF version ${version}).`;

    const report={
      generatedAt:new Date().toISOString(),
      overview,
      basic:{
        fileName:file.name,fileSize:bytes(file.size),fileSizeInBytes:file.size,
        pages:pdf.numPages,pdfVersion:version,language,
        pageMode:normalizePageMode(pageMode),pageLayout:pageLayout||null,
        linearized:!!info.IsLinearized,compressionFiltersDetected:compressionFilters
      },
      document:docInfo,
      security:{
        isEncrypted:encrypted,
        status:encrypted?'已加密 / 密碼保護':'未加密的 PDF - 無密碼保護',
        permissions:Object.fromEntries(securityRows)
      },
      compliance:{
        identifiers:compliance,
        summary:complianceDetected.length?`偵測到：${complianceDetected.join(', ')}`:'未偵測到已知合規 metadata 標識'
      },
      structure:{
        formFieldGroups:fieldEntries.length,
        attachments:attachmentEntries,
        javascriptActions:jsEntries,
        layers,
        outlineItems:countOutline(outline),
        signatures:signatureList,
        viewerPreferences:viewerPrefs||null,
        markInfo:markInfo||null,
        openAction:openAction||null,
        pageLabels:pageLabels||null
      },
      content:{
        wordCountEstimated:totalWords,paragraphCountEstimated:totalParagraphs,
        characterCount:totalChars,textCharactersCount:totalTextChars,
        annotationsCount:totalAnnotations,annotationSubtypeCounts,
        imagePaintOperations:totalImages,links:allLinks
      },
      fonts:[...fontMap.values()],
      pages,
      xmp:{
        all:xmpAll,raw:xmpRaw||null
      }
    };
    state.infoReport=report;

    const basicRows=[
      ['Pages',pdf.numPages],['File Size',bytes(file.size)],['File Size (bytes)',file.size],
      ['PDF Version',version],['Language',language],['Page Mode',normalizePageMode(pageMode)],
      ['Page Layout',pageLayout||'—'],['Linearized',info.IsLinearized?'Yes':'No'],
      ['Page Box Inspector',pdfLibStatus],
      ['Compression filters',compressionFilters.length?compressionFilters.join(', '):'None detected in sampled structure']
    ];
    const documentRows=[
      ['Title',docInfo.title||'-'],['Author',docInfo.author||'-'],['Subject',docInfo.subject||'-'],
      ['Keywords',docInfo.keywords||'-'],['Producer',docInfo.producer||'-'],['Creator',docInfo.creator||'-'],
      ['Created',docInfo.created],['Modified',docInfo.modified],['Trapped',docInfo.trapped||'null'],
      ['Type',docInfo.sourceType],['Document ID',docInfo.documentId||'-'],['Instance ID',docInfo.instanceId||'-']
    ];
    const securityTop=[
      ['Encryption',report.security.status],
      ['Permissions',(!encrypted||!permissions)?'允許所有權限':'請參閱下方各項權限']
    ];
    const complianceRows=compliance.map(x=>[x.name,x.detected?'Metadata identifier detected':'未偵測到']);
    const contentRows=[
      ['WordCount (估算)',totalWords],['ParagraphCount (估算)',totalParagraphs],
      ['CharacterCount',totalChars],['Text Characters Count',totalTextChars],
      ['AnnotationsCount',totalAnnotations],['Images / paint operations',totalImages],
      ['Links',allLinks.length],['Fonts',fontMap.size]
    ];
    const structureRows=[
      ['FormFields',fieldEntries.length?`${fieldEntries.length} group(s)`:'Empty'],
      ['Attachments',attachmentEntries.length?attachmentEntries.length:'Empty'],
      ['JavaScript',jsEntries.length?`${jsEntries.length} action group(s)`:'Empty'],
      ['Layers',layers.length?layers.length:'Empty'],
      ['Outline / Bookmarks',countOutline(outline)],
      ['Digital Signatures',signatureList.length],
      ['Tagged PDF',markInfo?.Marked?'Yes':'No']
    ];

    const pageHtml=pages.map(pg=>detailBlock(
      `Page ${pg.page} · ${pg.standardPage} · ${pg.orientation}`,
      `<div class="pdf-info-list">
        ${infoRow('Width (pt)',pg.widthPt)}${infoRow('Height (pt)',pg.heightPt)}
        ${infoRow('Width (px @72 DPI)',pg.widthPt)}${infoRow('Height (px @72 DPI)',pg.heightPt)}
        ${infoRow('Width (in)',pg.widthIn)}${infoRow('Height (in)',pg.heightIn)}
        ${infoRow('Width (cm)',pg.widthCm)}${infoRow('Height (cm)',pg.heightCm)}
        ${infoRow('Standard Page',pg.standardPage)}${infoRow('Rotation',pg.rotation)}
        ${infoRow('MediaBox',JSON.stringify(pg.mediaBox))}${infoRow('CropBox',JSON.stringify(pg.cropBox))}
        ${infoRow('BleedBox',JSON.stringify(pg.bleedBox))}${infoRow('TrimBox',JSON.stringify(pg.trimBox))}
        ${infoRow('ArtBox',JSON.stringify(pg.artBox))}
        ${infoRow('Text Characters Count',pg.textCharacters)}
        ${infoRow('WordCount (估算)',pg.wordCount)}${infoRow('ParagraphCount (估算)',pg.paragraphCount)}
        ${infoRow('AnnotationsCount',pg.annotationsCount)}${infoRow('Links',pg.linksCount)}
        ${infoRow('Image paint operations',pg.imagePaintOperations)}
        ${infoRow('ContentsCount',pg.contentsCount===null?'—':pg.contentsCount)}
      </div>`,
      pg.page===1
    )).join('');

    const fontsHtml=[...fontMap.values()].length
      ? [...fontMap.values()].map(f=>detailBlock(
          `${f.fontFamily} · ${f.name}`,
          `<div class="pdf-info-list">
            ${infoRow('Internal Font ID',f.id)}
            ${infoRow('Name',f.name)}
            ${infoRow('FontFamily',f.fontFamily)}
            ${infoRow('Count',f.count)}
            ${infoRow('IsEmbedded',f.embedded===null?'Unknown':f.embedded?'true':'false')}
            ${infoRow('IsType3',f.isType3?'true':'false')}
            ${infoRow('Vertical',f.vertical?'true':'false')}
            ${infoRow('IsBold (inferred)',/bold|700|800|900/i.test(`${f.name} ${f.fontFamily}`)?'true':'false')}
            ${infoRow('IsItalic (inferred)',/italic|oblique/i.test(`${f.name} ${f.fontFamily}`)?'true':'false')}
          </div>`
        )).join('')
      : '<div class="pdf-info-empty">沒有偵測到文字字體。</div>';

    const attachmentHtml=attachmentEntries.length
      ? attachmentEntries.map(x=>infoRow(x.name,x.size===null?'Size unknown':bytes(x.size))).join('')
      : infoRow('Attachments','Empty array');
    const jsHtml=jsEntries.length
      ? jsEntries.map(x=>detailBlock(`JavaScript · ${x.name}`,`<pre class="pdf-info-pre">${esc(x.value)}</pre>`)).join('')
      : '<div class="pdf-info-list">'+infoRow('JavaScript','Empty array')+'</div>';
    const layersHtml='<div class="pdf-info-list">'+infoRow('Layers',layers.length?layers.join(', '):'Empty array')+'</div>';
    const xmpBody=xmpRaw
      ? `<div class="pdf-info-toolbar"><button id="copyXmp" class="smallbtn" type="button">複製 XMP</button></div><pre class="pdf-info-pre">${esc(xmpRaw)}</pre>`
      : '<div class="pdf-info-empty">沒有 XMP metadata。</div>';

    els.workspace.innerHTML=`
      <section class="pdf-overview-card">
        <span>PDF 摘要</span>
        <h3>${esc(file.name)}</h3>
        <p>${esc(overview)}</p>
      </section>
      ${infoSection('基本資訊',basicRows)}
      ${infoSection('文件資訊',documentRows)}
      ${infoSection('安全性狀態',securityTop)}
      ${infoSection('PDF 權限',securityRows)}
      ${infoSection('合規標識',complianceRows,'這裡只檢查 XMP / metadata 標識，不等同正式 PDF/A、PDF/X、PDF/UA 合規驗證。')}
      ${infoSection('內容統計',contentRows,'WordCount / ParagraphCount 由 PDF 文字層估算；掃描影像 PDF 如沒有 OCR 文字層，數值可能為 0。')}
      ${infoSection('文件結構',structureRows)}
      <section class="pdf-info-section"><h3>頁面詳細資料</h3><div class="pdf-info-stack">${pageHtml}</div></section>
      <section class="pdf-info-section"><h3>字體</h3><div class="pdf-info-stack">${fontsHtml}</div></section>
      <section class="pdf-info-section"><h3>附件</h3><div class="pdf-info-list">${attachmentHtml}</div></section>
      <section class="pdf-info-section"><h3>JavaScript</h3><div class="pdf-info-stack">${jsHtml}</div></section>
      <section class="pdf-info-section"><h3>Layers / Optional Content</h3>${layersHtml}</section>
      <section class="pdf-info-section"><h3>XMP Metadata</h3>${detailBlock('查看原始 XMP XML',xmpBody)}</section>
    `;

    els.actions.innerHTML='<button id="copyInfoSummary" class="secondary">複製摘要</button><button id="downloadInfoJson" class="primary">下載 JSON</button>';
    $('#copyInfoSummary').onclick=copyInspectorSummary;
    $('#downloadInfoJson').onclick=downloadInspectorJson;
    $('#copyXmp')?.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(xmpRaw);toast('XMP 已複製')}catch{toast('Browser 不允許複製')}
    });

    clearProgress()
  }catch(e){
    clearProgress();
    els.workspace.innerHTML=`<div class="hint">PDF 資料分析失敗：${esc(e?.message||String(e))}</div>`;
    toast('PDF 資料分析失敗')
  }
}

function saveResult(blob,name){
  clearProgress();clearResult();
  const url=URL.createObjectURL(blob);
  state.result={blob,name,url};
  els.resultName.textContent=name;
  els.resultMeta.textContent=`${bytes(blob.size)} · 本機完成`;
  els.result.hidden=false;
  const f=new File([blob],name,{type:blob.type||'application/octet-stream'});
  els.share.hidden=!(navigator.canShare&&navigator.canShare({files:[f]}));
  setProgress(100,'完成');
  setTimeout(clearProgress,650);
  requestAnimationFrame(()=>els.result.scrollIntoView({behavior:prefersReducedMotion()?'auto':'smooth',block:'nearest'}))
}
function downloadResult(){if(!state.result)return;const a=document.createElement('a');a.href=state.result.url;a.download=state.result.name;document.body.appendChild(a);a.click();a.remove()}
async function shareResult(){if(!state.result)return;try{const f=new File([state.result.blob],state.result.name,{type:state.result.blob.type});await navigator.share({files:[f],title:state.result.name})}catch(e){if(e.name!=='AbortError')toast('此 browser 未能分享文件')}}
els.search.oninput=e=>renderTools(e.target.value);
els.close.onclick=()=>{if(state.dialogBusy)return;closeToolAnimated()};

// Important: <input type="file"> also fires a bubbling "cancel" event when the
// native file picker is dismissed without choosing a file. Only treat a
// cancel whose target is the dialog itself as an Escape/dialog dismissal.
els.dialog.addEventListener('cancel',e=>{
  if(e.target!==els.dialog)return;
  e.preventDefault();
  closeToolAnimated()
});
els.input.addEventListener('cancel',e=>{
  e.stopPropagation();
  // Stay inside the current tool and preserve all current tool state.
});

els.drop.onclick=()=>els.input.click();
els.drop.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();els.input.click()}};
els.input.onchange=e=>{
  if(e.target.files?.length)addFiles(e.target.files);
  e.target.value=''
};
['dragenter','dragover'].forEach(ev=>els.drop.addEventListener(ev,e=>{e.preventDefault();els.drop.classList.add('dragging')}));
['dragleave','drop'].forEach(ev=>els.drop.addEventListener(ev,e=>{e.preventDefault();els.drop.classList.remove('dragging')}));
els.drop.addEventListener('drop',e=>addFiles(e.dataTransfer.files));
els.download.onclick=downloadResult;
els.share.onclick=shareResult;

// Remove Safari/iPhone persistent focus rectangle from the back control after touch.
els.close.addEventListener('pointerup',()=>requestAnimationFrame(()=>els.close.blur()));

const pref=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
applyTheme(pref,false);
els.themeToggle?.addEventListener('change',e=>applyTheme(e.target.checked?'dark':'light',true));
els.payme?.addEventListener('click',()=>openDonation('payme'));
els.paypal?.addEventListener('click',()=>openDonation('paypal'));


// UI interaction policy: prevent accidental page text selection and browser zoom.
// Form fields remain editable/selectable for password/search/text entry.
for(const ev of ['gesturestart','gesturechange','gestureend']){
  document.addEventListener(ev,e=>e.preventDefault(),{passive:false});
}
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});

if('serviceWorker' in navigator){
  window.addEventListener('load',async()=>{
    try{
      const reg=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
      await reg.update();
    }catch{}
  });
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(sessionStorage.getItem('pdfToolkitSwReloaded')==='1')return;
    sessionStorage.setItem('pdfToolkitSwReloaded','1');
    location.reload();
  });
}
renderTools();
requestAnimationFrame(syncHomeNavigationTitle);
