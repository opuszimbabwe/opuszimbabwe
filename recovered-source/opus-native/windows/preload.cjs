const {contextBridge,ipcRenderer}=require('electron');
if(location.origin==='https://opuszim.co.zw'){
 contextBridge.exposeInMainWorld('opusNative',{openNotificationSettings:()=>ipcRenderer.invoke('opus-alert-system-settings'),getState:()=>ipcRenderer.invoke('opus-alert-state'),setEnabled:enabled=>ipcRenderer.invoke('opus-alert-enable',enabled===true),setStartOnLogin:enabled=>ipcRenderer.invoke('opus-startup',enabled===true),notify:data=>ipcRenderer.invoke('opus-alert-message',{id:String(data?.id||''),sessionId:String(data?.sessionId||'')}),testNotification:()=>ipcRenderer.invoke('opus-alert-test')});
 ipcRenderer.on('opus-open-chat',(_event,data)=>window.dispatchEvent(new CustomEvent('opus-native-open-chat',{detail:{sessionId:String(data?.sessionId||'')}})));
}
