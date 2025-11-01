(function(){
  if (window.__ctb_final_injected) return;
  window.__ctb_final_injected = true;

  const OVERLAY_ID = 'ctb_final_overlay';
  const STYLE_ID = 'ctb_final_style';

  function injectStyle(doc=document){
    if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
    const s = doc.createElement('style'); s.id = STYLE_ID;
    s.textContent = '* { user-select: text !important; -webkit-user-select: text !important; }';
    (doc.head || doc.documentElement).appendChild(s);
  }

  function isEditorAncestor(el){
    for(let n=el; n; n=n.parentElement){
      const cls = (n.className||'').toString().toLowerCase();
      if (cls.includes('codemirror')||cls.includes('monaco')||cls.includes('ace_editor')||cls.includes('ql-editor')||cls.includes('cm-editor')) return true;
    }
    return false;
  }

  function isEditable(el){
    if (!el) return false;
    const tag = (el.tagName||'').toUpperCase();
    if (tag==='INPUT' || tag==='TEXTAREA') return true;
    if (el.isContentEditable) return true;
    if (isEditorAncestor(el)) return true;
    return false;
  }

  async function readClipboard(){
    try { return await navigator.clipboard.readText(); } catch(e){ return ''; }
  }

  async function fallbackPasteInto(el){
    try{
      const text = await readClipboard();
      if (!text) return false;
      if (el.tagName==='INPUT' || el.tagName==='TEXTAREA'){
        const start = el.selectionStart||0, end = el.selectionEnd||start;
        const v = el.value||'';
        el.value = v.slice(0,start)+text+v.slice(end);
        el.selectionStart = el.selectionEnd = start + text.length;
        el.dispatchEvent(new Event('input',{bubbles:true}));
        return true;
      }
      if (el.isContentEditable){
        const sel = el.ownerDocument.getSelection();
        if (sel && sel.rangeCount){
          const r = sel.getRangeAt(0);
          r.deleteContents();
          r.insertNode(el.ownerDocument.createTextNode(text));
          r.collapse(false);
          sel.removeAllRanges(); sel.addRange(r);
          el.dispatchEvent(new Event('input',{bubbles:true}));
          return true;
        } else { el.textContent = (el.textContent||'') + text; el.dispatchEvent(new Event('input',{bubbles:true})); return true; }
      }
      const inner = el.querySelector && (el.querySelector('textarea')||el.querySelector('[contenteditable="true"]')||el.querySelector('[role="textbox"]'));
      if (inner) return await fallbackPasteInto(inner);
    }catch(e){}
    return false;
  }

  function showOverlay(title,msg,color){
    try{
      const doc = window.top.document;
      const existing = doc.getElementById(OVERLAY_ID);
      if (existing) existing.remove();
      const ov = doc.createElement('div');
      ov.id = OVERLAY_ID;
      ov.style.position='fixed'; ov.style.left='50%'; ov.style.top='50%'; ov.style.transform='translate(-50%,-50%)';
      ov.style.zIndex=2147483647; ov.style.padding='18px 22px'; ov.style.borderRadius='12px';
      ov.style.boxShadow='0 12px 32px rgba(0,0,0,0.28)'; ov.style.maxWidth='520px'; ov.style.fontFamily='Inter, system-ui, Arial, sans-serif';
      ov.style.textAlign='center'; ov.style.opacity='0'; ov.style.transition='opacity 220ms ease';
      ov.style.background = color==='red' ? 'linear-gradient(180deg,#fff5f5,#fff1f0)' : 'linear-gradient(180deg,#f6fffa,#eef9f1)';
      ov.style.color = color==='red' ? '#5f1b1b' : '#0b3d1b';
      ov.innerHTML = '<h2 style="margin:0 0 8px;font-size:18px;">'+title+'</h2><div style="font-size:14px;color:inherit;line-height:1.3">'+msg+'</div><div style="margin-top:8px;font-size:12px;color:rgba(0,0,0,0.45)">Developed with 💻 by E. Lingeshwaran B.Tech A.I.D.S — <a href="https://github.com/Lingeshwaran2906" target="_blank">GitHub</a></div>';
      const close = doc.createElement('button'); close.textContent='✖'; Object.assign(close.style,{position:'absolute',right:'12px',top:'8px',border:'none',background:'transparent',fontSize:'18px',cursor:'pointer'}); close.onclick=()=>ov.remove();
      ov.appendChild(close); doc.documentElement.appendChild(ov); requestAnimationFrame(()=>ov.style.opacity='1');
    }catch(e){}
  }

  function attachHandlers(doc){
    try{
      injectStyle(doc);
      if (doc.__ctb_attached) return; doc.__ctb_attached = true;
      const evs = ['contextmenu','copy','cut','selectstart'];
      evs.forEach(ev => { const h = function(e){ try{ const t = e.target; if (isEditable(t)) return; if (e.stopImmediatePropagation) e.stopImmediatePropagation(); }catch(err){} }; doc.addEventListener(ev, h, true); doc.__ctb_handlers = doc.__ctb_handlers || []; doc.__ctb_handlers.push({ev,h}); });
      const pasteHandler = async function(e){ try{ const t = e.target; if (!isEditable(t)) return; if (e.defaultPrevented){ e.preventDefault(); e.stopImmediatePropagation(); await fallbackPasteInto(t); return; } const pre = (t.tagName==='INPUT'||t.tagName==='TEXTAREA') ? (t.value||'') : (t.textContent||''); setTimeout(async ()=>{ const post = (t.tagName==='INPUT'||t.tagName==='TEXTAREA') ? (t.value||'') : (t.textContent||''); if (post === pre) await fallbackPasteInto(t); },120); }catch(e){} };
      doc.addEventListener('paste', pasteHandler, true); doc.__ctb_handlers.push({ev:'paste',h:pasteHandler});
    }catch(e){ console.error('attachHandlers error', e); }
  }

  function cleanupDoc(doc){ try{ if (!doc || !doc.__ctb_handlers) return; doc.__ctb_handlers.forEach(o=>{ try{ doc.removeEventListener(o.ev,o.h,true); }catch(e){} }); doc.__ctb_handlers = null; doc.__ctb_attached = false; const ov = window.top.document.getElementById(OVERLAY_ID); if (ov) ov.remove(); }catch(e){} }

  try{
    attachHandlers(document);
    if (window.self === window.top){ const tryAttach = ()=>{ try{ const f = document.getElementById('course-iframe'); if (f && f.contentWindow && f.contentDocument){ try { attachHandlers(f.contentDocument); } catch(e){} } }catch(e){} };
      tryAttach(); const mo = new MutationObserver(()=> tryAttach()); mo.observe(document.documentElement || document.body, {childList:true, subtree:true});
    } else { try { window.top && window.top.postMessage && window.top.postMessage({__ctb_frame_ready:true}, '*'); } catch(e){} }
    showOverlay('🟢 CodeTantra Bypasser Enabled','You can now Copy / Paste / Right Click inside editable areas.','green');
  }catch(e){ console.error(e); }

  try{ if (chrome && chrome.runtime && chrome.runtime.onMessage){ chrome.runtime.onMessage.addListener((msg,s,resp)=>{ try{ if (!msg) return; if (msg.cmd === 'ctb_cleanup'){ cleanupDoc(document); resp && resp({ok:true}); } if (msg.cmd === 'ctb_show_enable'){ showOverlay('🟢 CodeTantra Bypasser Enabled','You can now Copy / Paste / Right Click inside editable areas.','green'); } if (msg.cmd === 'ctb_show_disable'){ showOverlay('❌ CodeTantra Bypasser Disabled','Restrictions are back on.','red'); } }catch(e){} }); } }catch(e){}
})();