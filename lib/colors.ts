export type RGBA={r:number;g:number;b:number;a:number};
export function parseColor(raw:unknown):RGBA|null{
 if(typeof raw!=='string'||raw.length>100)return null;const v=raw.trim();if(v==='transparent')return{r:0,g:0,b:0,a:0};
 if(/^#(?:[a-f0-9]{3,4}|[a-f0-9]{6}|[a-f0-9]{8})$/i.test(v)){let h=v.slice(1);if(h.length<=4)h=[...h].map(c=>c+c).join('');return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16),a:h.length===8?parseInt(h.slice(6,8),16)/255:1};}
 const match=v.match(/^(rgb|rgba)\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);if(!match||(match[1].toLowerCase()==='rgba'&&!match[5]))return null;
 const [r,g,b]=match.slice(2,5).map(Number),a=match[5]===undefined?1:Number(match[5]);if([r,g,b].some(n=>!Number.isFinite(n)||n<0||n>255)||!Number.isFinite(a)||a<0||a>1)return null;return{r,g,b,a};
}
export const isCssColor=(value:unknown)=>parseColor(value)!==null;
export const rgba=(v:RGBA)=>`rgba(${v.r}, ${v.g}, ${v.b}, ${Number(v.a.toFixed(4))})`;
export function colorHex(v:RGBA){return '#'+[v.r,v.g,v.b].map(n=>Math.round(n).toString(16).padStart(2,'0')).join('');}
export function splitCss(value:string):string[]{const parts:string[]=[];let depth=0,start=0;for(let i=0;i<value.length;i++){if(value[i]==='(')depth++;if(value[i]===')')depth--;if(depth<0)return[];if(value[i]===','&&depth===0){parts.push(value.slice(start,i).trim());start=i+1;}}if(depth!==0)return[];parts.push(value.slice(start).trim());return parts;}
export type GradientStop={color:string;position?:number};
export function parseGradient(value:unknown):{angle:number;stops:GradientStop[]}|null{
 if(typeof value!=='string'||value.length>2000)return null;let v=value.trim();if(/^linear-gradient\(/i.test(v)){if(!v.endsWith(')'))return null;v=v.slice(v.indexOf('(')+1,-1).trim();}
 const parts=splitCss(v);if(parts.length<3||parts.length>13||! /^-?(?:\d{1,3}(?:\.\d{1,4})?|\.\d{1,4})deg$/i.test(parts[0]))return null;
 const angle=Number(parts[0].slice(0,-3));if(!Number.isFinite(angle)||Math.abs(angle)>360)return null;
 const stops:GradientStop[]=[];for(const part of parts.slice(1)){const match=part.match(/^(.*?)(?:\s+(\d+(?:\.\d+)?)%)?$/);if(!match||!isCssColor(match[1]))return null;const position=match[2]===undefined?undefined:Number(match[2]);if(position!==undefined&&(position<0||position>100))return null;stops.push({color:match[1].trim(),...(position===undefined?{}:{position})});}return{angle,stops};
}
export const gradientValue=(angle:number,stops:GradientStop[])=>`${angle}deg,${stops.map(s=>s.color+(s.position===undefined?'':` ${s.position}%`)).join(',')}`;
export function cleanGradient(value:unknown){const d=parseGradient(value);return d?gradientValue(d.angle,d.stops):null;}
export function gradientCss(value:unknown){const gradient=cleanGradient(value);return gradient?`linear-gradient(${gradient})`:'transparent';}
