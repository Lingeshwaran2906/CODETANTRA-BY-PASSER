document.addEventListener('DOMContentLoaded', ()=>{
  const toggle = document.getElementById('toggle');
  const status = document.getElementById('status');
  const apply = document.getElementById('apply');
  const cleanup = document.getElementById('cleanup');
  chrome.storage.local.get({ctb_enabled:false}, (res)=>{
    toggle.checked = !!res.ctb_enabled;
    status.textContent = res.ctb_enabled ? 'Active — Enabled. Click Apply to inject into active tab.' : 'Status: Disabled. Toggle ON then click Apply.';
  });
  toggle.addEventListener('change', ()=>{
    const v = !!toggle.checked;
    chrome.storage.local.set({ctb_enabled:v}, ()=>{
      status.textContent = v ? '✅ Enabled. Click "Apply" to inject into active tab.' : '🧹 Disabled. Click "Cleanup" to clean active tab.';
    });
  });
  apply.addEventListener('click', ()=>{
    chrome.storage.local.get({ctb_enabled:false}, (res)=>{
      const enabled = !!res.ctb_enabled;
      chrome.runtime.sendMessage({cmd:'applyToggle', enabled}, (resp)=>{
        if (resp && resp.ok) status.textContent = enabled ? '✅ Injected into active tab (all frames).' : '🧹 Cleanup requested.';
        else status.textContent = 'Error: ' + (resp && resp.error ? resp.error : 'unknown');
      });
    });
  });
  cleanup.addEventListener('click', ()=>{
    chrome.runtime.sendMessage({cmd:'applyToggle', enabled:false}, (resp)=>{ status.textContent = '🧹 Cleanup requested for active tab.'; });
  });
});