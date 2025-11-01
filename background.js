chrome.runtime.onInstalled.addListener(()=>{ chrome.storage.local.set({ctb_enabled:false}); });
chrome.runtime.onMessage.addListener((msg, sender, sendResp) => {
  if (!msg || !msg.cmd) return;
  if (msg.cmd === 'applyToggle') {
    const enabled = !!msg.enabled;
    chrome.storage.local.set({ctb_enabled: enabled}, ()=>{});
    chrome.tabs.query({active:true,currentWindow:true}, (tabs)=>{
      if (!tabs || !tabs[0]) { sendResp({ok:false, error:'no-active-tab'}); return; }
      const tabId = tabs[0].id;
      if (enabled) {
        chrome.scripting.executeScript({ target: { tabId: tabId, allFrames: true }, files: ['content.js'] })
          .then(()=> sendResp({ok:true, injected:true}))
          .catch(err=> sendResp({ok:false, error:String(err)}));
      } else {
        chrome.tabs.sendMessage(tabId, {cmd:'ctb_cleanup'}, ()=> sendResp({ok:true, cleaned:true}));
      }
    });
    return true;
  }
});