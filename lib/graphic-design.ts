import {parseSectionDesign} from './section-design';
export type GraphicClassDesign={image:string;shape:'rounded'|'square'|'arch';radius:number;aspect:'landscape'|'square'|'portrait';overlay_kind:'solid'|'gradient';overlay_color:string;overlay_gradient:string;overlay_opacity:number;text_color:string;title_size:number;title_weight:number;body_size:number;body_weight:number;align:'left'|'center'|'right';position:'top'|'center'|'bottom';text_overlay:boolean};
export const DEFAULT_GRAPHIC_DESIGN:GraphicClassDesign={image:'',shape:'rounded',radius:28,aspect:'landscape',overlay_kind:'gradient',overlay_color:'#0f0928',overlay_gradient:'180deg,#0f092800,#0f0928',overlay_opacity:.8,text_color:'#ffffff',title_size:30,title_weight:700,body_size:16,body_weight:400,align:'left',position:'bottom',text_overlay:true};
export function parseGraphicDesign(raw:unknown):GraphicClassDesign|null{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;const d={...DEFAULT_GRAPHIC_DESIGN,...raw} as GraphicClassDesign;
 const overlay=parseSectionDesign({background_color:'#ffffff',background_image:d.image,overlay_kind:d.overlay_kind,overlay_color:d.overlay_color,overlay_gradient:d.overlay_gradient,overlay_opacity:d.overlay_opacity});
 if(!overlay||!['rounded','square','arch'].includes(d.shape)||!['landscape','square','portrait'].includes(d.aspect)||!['left','center','right'].includes(d.align)||!['top','center','bottom'].includes(d.position)||typeof d.text_overlay!=='boolean'||!/^#[a-f0-9]{6}$/i.test(d.text_color))return null;
 for(const [key,min,max] of [['radius',0,120],['title_size',16,64],['body_size',12,28],['title_weight',300,900],['body_weight',300,900]] as const){if(typeof d[key]!=='number'||!Number.isFinite(d[key])||d[key]<min||d[key]>max)return null;}
 if(d.title_weight%100||d.body_weight%100)return null;
 return {...d,image:overlay.background_image,overlay_color:overlay.overlay_color,overlay_gradient:overlay.overlay_gradient};
}
