const VERSION='1.4.0';
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
const state={tool:null,files:[],pdfjs:null,pdfjsDoc:null,pageItems:[],history:[],result:null,sort:null,deferredPrompt:null,wm:{x:.5,y:.5},splitPoints:new Set(),splitMode:'range',splitPageCount:0,mergeGeneration:0,mergePreview:false,splitRangeText:'',qpdfFactory:null};
const $=s=>document.querySelector(s);const els={grid:$('#toolGrid'),search:$('#searchInput'),count:$('#toolCount'),dialog:$('#toolDialog'),cat:$('#dialogCat'),title:$('#dialogTitle'),close:$('#closeDialog'),drop:$('#dropZone'),input:$('#fileInput'),dropTitle:$('#dropTitle'),summary:$('#fileSummary'),workspace:$('#workspace'),progressWrap:$('#progressWrap'),progress:$('#progressBar'),progressText:$('#progressText'),progressPct:$('#progressPct'),result:$('#resultBox'),resultName:$('#resultName'),resultMeta:$('#resultMeta'),download:$('#downloadBtn'),share:$('#shareBtn'),actions:$('#stickyActions'),toast:$('#toast'),theme:$('#themeBtn'),install:$('#installBtn')};
function toast(s){els.toast.textContent=s;els.toast.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>els.toast.classList.remove('show'),2300)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function bytes(n){const u=['B','KB','MB','GB'];let i=0,v=n||0;while(v>=1024&&i<3){v/=1024;i++}return `${v.toFixed(i?1:0)} ${u[i]}`}
function baseName(n){return n.replace(/\.[^.]+$/,'').replace(/[^\w\u3400-\u9fff-]+/g,'_').slice(0,70)||'document'}
function renderTools(q=''){q=q.trim().toLowerCase();const list=TOOLS.filter(t=>!q||`${t.name} ${CAT_LABELS[t.cat]||t.cat}`.toLowerCase().includes(q));els.count.textContent=`${list.length} 個`;els.grid.innerHTML=list.length?CAT_ORDER.map(cat=>{const items=list.filter(t=>t.cat===cat);if(!items.length)return'';return `<section class="tool-section"><div class="tool-section-head"><h4>${CAT_LABELS[cat]}</h4><span>${items.length}</span></div><div class="tool-grid">${items.map(t=>`<button class="tool" data-id="${t.id}" style="--toolc:${t.c}"><div class="tool-icon">${t.icon}</div><b>${t.name}</b></button>`).join('')}</div></section>`}).join(''):'<div class="empty">搵唔到相關工具。</div>';els.grid.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>openTool(b.dataset.id))}
async function getPdfjs(){if(state.pdfjs)return state.pdfjs;state.pdfjs=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');state.pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';return state.pdfjs}
function clearResult(){if(state.result?.url)URL.revokeObjectURL(state.result.url);state.result=null;els.result.hidden=true}
function clearState(){clearResult();if(state.sort){state.sort.destroy();state.sort=null}if(state.pdfjsDoc){try{state.pdfjsDoc.destroy()}catch{}state.pdfjsDoc=null}state.pageItems=[];state.history=[];state.wm={x:.5,y:.5};state.splitPoints=new Set();state.splitMode='range';state.splitPageCount=0;state.mergeGeneration++;state.mergePreview=false;state.splitRangeText='';els.workspace.innerHTML='';els.actions.innerHTML='';els.summary.hidden=true;els.summary.textContent='';clearProgress()}
function openTool(id){clearState();state.tool=TOOLS.find(t=>t.id===id);state.files=[];els.cat.textContent=CAT_LABELS[state.tool.cat]||state.tool.cat;els.title.textContent=state.tool.name;els.input.accept=state.tool.accept;els.input.multiple=state.tool.multiple;els.dropTitle.textContent=state.tool.multiple?'選擇一個或多個檔案':'選擇一個檔案';els.dialog.showModal();renderInitial()}
function renderInitial(){if(['markdown','html','txt'].includes(state.tool.id)){els.workspace.innerHTML='<div class="hint">你可以選擇檔案，或直接在下方貼上內容。</div>'+field('內容',`<textarea id="textSource" placeholder="貼上內容…"></textarea>`)+paperControls();els.actions.innerHTML='<button class="primary" id="convertText">轉換 PDF</button>';$('#convertText').onclick=convertText;return}els.workspace.innerHTML='';els.actions.innerHTML=''}
function field(label,html,help=''){return `<label class="field"><span>${label}</span>${html}${help?`<small>${help}</small>`:''}</label>`}
function paperControls(){return `<div class="inline" style="margin-top:10px">${field('紙張','<select id="paper"><option value="a4">A4</option><option value="letter">Letter</option></select>')}${field('方向','<select id="orientation"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select>')}</div>`}
function renderFileSummary(){if(!state.files.length){els.summary.hidden=true;els.summary.textContent='';return}els.summary.hidden=false;const total=state.files.reduce((s,f)=>s+f.size,0);if(state.tool?.id==='merge'){els.summary.innerHTML=`<b>${state.files.length} 份 PDF</b> · ${bytes(total)}`;return}els.summary.innerHTML=state.files.map(f=>`<b>${esc(f.name)}</b> · ${bytes(f.size)}`).join('<br>')}
async function looksLikePdf(file){
  if(!/\.pdf$/i.test(file.name||'')) return false;
  try{
    const head=new Uint8Array(await file.slice(0,1024).arrayBuffer());
    const text=new TextDecoder('latin1').decode(head);
    return /%PDF-\d\.\d/.test(text);
  }catch{return false}
}
async function validateSelectedFile(file,tool){
  const pdfTool=/application\/pdf|\.pdf/i.test(tool.accept||'');
  if(pdfTool){
    if(!/\.pdf$/i.test(file.name||'')) return {ok:false,msg:`${file.name} 不是 .pdf 檔案`};
    if(!(await looksLikePdf(file))) return {ok:false,msg:`${file.name} 不是有效 PDF`};
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
function setupUnlock(){els.workspace.innerHTML=`<div class="controls unlock-controls">${field('PDF 開啟密碼','<input id="unlockPassword" type="password" autocomplete="current-password" placeholder="如 PDF 要求密碼才輸入">')}<label class="check-row"><input id="showUnlockPassword" type="checkbox"> 顯示密碼</label><div class="unlock-status"><i></i><span>會建立一份沒有 PDF encryption 的新檔案；原始 PDF 不會被修改。</span></div></div>`;$('#showUnlockPassword').onchange=e=>$('#unlockPassword').type=e.target.checked?'text':'password';els.actions.innerHTML='<button id="runUnlock" class="primary">移除 PDF 密碼</button>';$('#runUnlock').onclick=runUnlock}
async function runUnlock(){try{
  setProgress(6,'載入 PDF 解密引擎…');
  const createModule=await getQpdfFactory(),logs=[];
  const qpdf=await createModule({
    noInitialRun:true,
    print:t=>logs.push(String(t)),
    printErr:t=>logs.push(String(t))
  });
  setProgress(24,'讀取加密 PDF…');
  const input=new Uint8Array(await state.files[0].arrayBuffer());
  try{qpdf.FS.unlink('/input.pdf')}catch{}
  try{qpdf.FS.unlink('/output.pdf')}catch{}
  qpdf.FS.writeFile('/input.pdf',input);
  const password=$('#unlockPassword').value||'';
  const args=['--decrypt','/input.pdf','/output.pdf'];
  if(password)args.unshift(`--password=${password}`);
  let exitCode=0;
  try{exitCode=qpdf.callMain(args)??0}catch(e){exitCode=e?.status??-1}
  const exists=(()=>{try{return !!qpdf.FS.analyzePath('/output.pdf').exists}catch{return false}})();
  if((exitCode!==0&&exitCode!==3)||!exists){
    const detail=logs.join(' ').trim();
    if(/invalid password|password.*incorrect|incorrect password|requires a password/i.test(detail))throw new Error('密碼不正確');
    throw new Error(detail?`移除密碼失敗：${detail.slice(0,180)}`:'移除密碼失敗：PDF 加密格式不受支援或檔案已損壞')
  }
  setProgress(84,'建立未加密 PDF…');
  const output=qpdf.FS.readFile('/output.pdf'),copy=new Uint8Array(output.length);copy.set(output);
  try{qpdf.FS.unlink('/input.pdf');qpdf.FS.unlink('/output.pdf')}catch{}
  saveResult(new Blob([copy],{type:'application/pdf'}),`${baseName(state.files[0].name)}_unlocked.pdf`)
}catch(e){clearProgress();toast(e.message||'移除密碼失敗')}}

function setupImg2pdf(){els.workspace.innerHTML=paperControls();els.actions.innerHTML='<button id="runImg" class="primary">建立 PDF</button>';$('#runImg').onclick=async()=>{try{const {PDFDocument}=PDFLib,out=await PDFDocument.create(),paper=$('#paper').value,orient=$('#orientation').value;let size=paper==='letter'?[612,792]:[595.28,841.89];if(orient==='landscape')size=size.reverse();for(let i=0;i<state.files.length;i++){const f=state.files[i],buf=await f.arrayBuffer(),img=f.type==='image/png'?await out.embedPng(buf):await out.embedJpg(buf),page=out.addPage(size),m=24,maxW=size[0]-m*2,maxH=size[1]-m*2,s=Math.min(maxW/img.width,maxH/img.height),w=img.width*s,h=img.height*s;page.drawImage(img,{x:(size[0]-w)/2,y:(size[1]-h)/2,width:w,height:h});setProgress(5+80*(i+1)/state.files.length,`加入圖片 ${i+1}/${state.files.length}`)}saveResult(new Blob([await out.save()],{type:'application/pdf'}),'images.pdf')}catch(e){clearProgress();toast(e.message)}}}
function setupPdf2img(){els.workspace.innerHTML=`<div class="inline">${field('格式','<select id="imgFmt"><option value="png">PNG</option><option value="jpeg">JPEG</option></select>')}${field('清晰度','<select id="imgScale"><option value="1">1×</option><option value="1.5" selected>1.5×</option><option value="2">2×</option></select>')}</div>`;els.actions.innerHTML='<button id="runPdfImg" class="primary">轉換 ZIP</button>';$('#runPdfImg').onclick=async()=>{try{const pdf=await loadPdfPreview(state.files[0]),zip=new JSZip(),fmt=$('#imgFmt').value,scale=Number($('#imgScale').value);for(let n=1;n<=pdf.numPages;n++){const p=await pdf.getPage(n),vp=p.getViewport({scale}),c=document.createElement('canvas');c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);await p.render({canvasContext:c.getContext('2d',{alpha:false}),viewport:vp}).promise;const mime=fmt==='png'?'image/png':'image/jpeg',blob=await new Promise(r=>c.toBlob(r,mime,.88));zip.file(`page_${String(n).padStart(3,'0')}.${fmt==='png'?'png':'jpg'}`,blob);c.width=1;c.height=1;p.cleanup();setProgress(5+70*n/pdf.numPages,`轉換 ${n}/${pdf.numPages}`)}const blob=await zip.generateAsync({type:'blob'},m=>setProgress(78+m.percent*.19,'建立 ZIP…'));saveResult(blob,`${baseName(state.files[0].name)}_images.zip`)}catch(e){clearProgress();toast(e.message)}}}
async function setupDocx(){els.workspace.innerHTML='<div class="hint">Basic conversion：複雜 Word 排版、浮動物件、SmartArt、Track Changes 等可能與 Microsoft Word 不一致。</div>'+paperControls()+'<div id="officePreview" class="office-preview">正在解析 DOCX…</div>';try{if(!window.mammoth)throw new Error('Mammoth library 未載入');const res=await mammoth.convertToHtml({arrayBuffer:await state.files[0].arrayBuffer()});$('#officePreview').innerHTML=res.value||'<p>沒有可顯示內容</p>';els.actions.innerHTML='<button id="runDocx" class="primary">轉換 PDF</button>';$('#runDocx').onclick=()=>htmlElementToPdf($('#officePreview'),`${baseName(state.files[0].name)}_from_docx.pdf`)}catch(e){$('#officePreview').textContent=e.message}}
async function setupXlsx(){els.workspace.innerHTML='<div class="hint">Basic conversion：原生 chart、pivot、VBA、精確 Microsoft 分頁不保證。</div>'+paperControls()+'<div id="sheetControls" class="conversion-tabs"></div><div id="officePreview" class="office-preview">正在解析 XLSX…</div>';try{if(!window.XLSX)throw new Error('SheetJS library 未載入');state.workbook=XLSX.read(await state.files[0].arrayBuffer(),{type:'array'});$('#sheetControls').innerHTML=state.workbook.SheetNames.map((n,i)=>`<button class="smallbtn" data-sheet="${esc(n)}">${esc(n)}</button>`).join('');const show=n=>{$('#officePreview').innerHTML=XLSX.utils.sheet_to_html(state.workbook.Sheets[n],{editable:false})};show(state.workbook.SheetNames[0]);$('#sheetControls').querySelectorAll('[data-sheet]').forEach(b=>b.onclick=()=>show(b.dataset.sheet));els.actions.innerHTML='<button id="runXlsx" class="primary">轉換目前工作表 PDF</button>';$('#runXlsx').onclick=()=>htmlElementToPdf($('#officePreview'),`${baseName(state.files[0].name)}_from_xlsx.pdf`)}catch(e){$('#officePreview').textContent=e.message}}
async function convertText(){try{let src=$('#textSource').value,html='';if(state.tool.id==='markdown'){if(!window.marked)throw new Error('Marked library 未載入');html=marked.parse(src)}else if(state.tool.id==='html')html=src;else html=`<pre style="white-space:pre-wrap;font-family:-apple-system,BlinkMacSystemFont,'PingFang HK','Noto Sans TC',sans-serif;line-height:1.6">${esc(src)}</pre>`;const temp=document.createElement('div');temp.className='office-preview';temp.style.position='fixed';temp.style.left='-10000px';temp.style.top='0';temp.innerHTML=html;document.body.appendChild(temp);await htmlElementToPdf(temp,`${state.tool.id}_converted.pdf`);temp.remove()}catch(e){clearProgress();toast(e.message)}}
async function htmlElementToPdf(el,name){try{if(!window.html2pdf)throw new Error('html2pdf library 未載入');setProgress(15,'建立 PDF…');const paper=$('#paper')?.value||'a4',orientation=$('#orientation')?.value||'portrait';const blob=await html2pdf().set({margin:[10,10,10,10],filename:name,image:{type:'jpeg',quality:.95},html2canvas:{scale:1.5,useCORS:true},jsPDF:{unit:'mm',format:paper,orientation}}).from(el).outputPdf('blob');saveResult(blob,name)}catch(e){clearProgress();toast(e.message)}}
async function setupInfo(){try{const {PDFDocument}=PDFLib,doc=await PDFDocument.load(await state.files[0].arrayBuffer(),{updateMetadata:false}),p=doc.getPages()[0]?.getSize(),rows=[['檔名',state.files[0].name],['大小',bytes(state.files[0].size)],['頁數',doc.getPageCount()],['第一頁尺寸',p?`${p.width.toFixed(1)} × ${p.height.toFixed(1)} pt`:'—'],['Title',doc.getTitle()||'—'],['Author',doc.getAuthor()||'—'],['Creator',doc.getCreator()||'—'],['Producer',doc.getProducer()||'—']];els.workspace.innerHTML=`<div class="hint">${rows.map(([a,b])=>`<div style="display:grid;grid-template-columns:110px 1fr;gap:8px;padding:5px 0;border-bottom:1px solid var(--line)"><b>${esc(a)}</b><span style="overflow-wrap:anywhere">${esc(b)}</span></div>`).join('')}</div>`}catch(e){toast(e.message)}}
function saveResult(blob,name){clearProgress();clearResult();const url=URL.createObjectURL(blob);state.result={blob,name,url};els.resultName.textContent=name;els.resultMeta.textContent=`${bytes(blob.size)} · 本機完成`;els.result.hidden=false;const f=new File([blob],name,{type:blob.type||'application/octet-stream'});els.share.hidden=!(navigator.canShare&&navigator.canShare({files:[f]}));setProgress(100,'完成');setTimeout(clearProgress,650)}
function downloadResult(){if(!state.result)return;const a=document.createElement('a');a.href=state.result.url;a.download=state.result.name;document.body.appendChild(a);a.click();a.remove()}
async function shareResult(){if(!state.result)return;try{const f=new File([state.result.blob],state.result.name,{type:state.result.blob.type});await navigator.share({files:[f],title:state.result.name})}catch(e){if(e.name!=='AbortError')toast('此 browser 未能分享文件')}}
els.search.oninput=e=>renderTools(e.target.value);els.close.onclick=()=>{if(state.dialogBusy)return;els.dialog.close();clearState()};els.drop.onclick=()=>els.input.click();els.drop.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();els.input.click()}};els.input.onchange=e=>{addFiles(e.target.files);e.target.value=''};['dragenter','dragover'].forEach(ev=>els.drop.addEventListener(ev,e=>{e.preventDefault();els.drop.classList.add('dragging')}));['dragleave','drop'].forEach(ev=>els.drop.addEventListener(ev,e=>{e.preventDefault();els.drop.classList.remove('dragging')}));els.drop.addEventListener('drop',e=>addFiles(e.dataTransfer.files));els.download.onclick=downloadResult;els.share.onclick=shareResult;const pref=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.dataset.theme=pref;els.theme.onclick=()=>{const n=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.setItem('theme',n)};window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.deferredPrompt=e});els.install.onclick=async()=>{if(state.deferredPrompt){state.deferredPrompt.prompt();await state.deferredPrompt.userChoice;state.deferredPrompt=null}else toast(/iPhone|iPad/i.test(navigator.userAgent)?'iPhone：Safari 分享 → 加入主畫面':'Browser 選單 → Install / 加入主畫面')};if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));renderTools();
