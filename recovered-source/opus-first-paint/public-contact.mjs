export function publicContactText(text){
 return text.replaceAll('263710740387','263776396530').replaceAll('0710 740 387','0776 396 530').replaceAll('0710740387','0776396530');
}
export function versionPublicScripts(text){return text.replace(/static\/chunks\/[a-zA-Z0-9_./-]+\.js(?![a-zA-Z0-9?])/g,match=>match+'?opus-lines=20261114');}
