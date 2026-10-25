'use client';
import {createContext,useContext,useState,type ReactNode} from 'react';
export const ImageUploadContext=createContext<{accept:(file:File)=>void;busy:boolean}>({accept:()=>{},busy:false});
export default function UploadDropZone({onSelect,children}:{onSelect:()=>void;children:ReactNode}){
 const context=useContext(ImageUploadContext),[dragging,setDragging]=useState(false),[error,setError]=useState('');
 function accept(files:File[]){setDragging(false);if(context.busy||!files.length)return;if(files.length!==1){setError('Use one image for this control.');return;}const file=files[0];if(!/^image\//.test(file.type)){setError('Choose a local image file.');return;}if(file.size>5*1024*1024){setError('Images must be 5 MB or smaller.');return;}setError('');onSelect();context.accept(file)}
 return <div className="upload-drop-zone" data-dragging={dragging} tabIndex={0} aria-label="Image upload area: drop a file or paste an image" onDragOver={e=>{if(e.dataTransfer.types.includes('Files')){e.preventDefault();e.stopPropagation();setDragging(true)}}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setDragging(false)}} onDrop={e=>{e.preventDefault();e.stopPropagation();accept([...e.dataTransfer.files])}} onPaste={e=>{const files=[...e.clipboardData.files];if(files.length){e.preventDefault();e.stopPropagation();accept(files)}}}>{children}<p className="upload-drop-hint">Drop a local image here, or focus here and paste · max 5 MB</p>{error&&<p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}</div>;
}
