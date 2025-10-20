'use client';
import { create } from 'zustand';
export type Quality = 'low'|'medium'|'high'|'ultra';
type S = {
  locale:'tr'|'en'; setLocale:(l:S['locale'])=>void;
  paused:boolean; setPaused:(v:boolean)=>void;
  quality:Quality; setQuality:(q:Quality)=>void;
  resolutionScale:number; setScale:(v:number)=>void;
  fov:number; setFov:(v:number)=>void;
  music:boolean; sfx:boolean; toggleMusic:()=>void; toggleSfx:()=>void;
  checkpoint:string|null; setCheckpoint:(c:string)=>void;
  doorOpen:boolean; setDoor:(v:boolean)=>void;
  pos:[number,number,number]; setPos:(p:[number,number,number])=>void;
};
export const useGame = create<S>((set)=>({
  locale:'tr', setLocale:(l)=>set({locale:l}),
  paused:false, setPaused:(v)=>set({paused:v}),
  quality:'high', setQuality:(q)=>set({quality:q}),
  resolutionScale:1.0, setScale:(v)=>set({resolutionScale:Math.max(.5,Math.min(1.5,v))}),
  fov:55, setFov:(v)=>set({fov:Math.max(40,Math.min(90,v))}),
  music:true, sfx:true, toggleMusic:()=>set(s=>({music:!s.music})), toggleSfx:()=>set(s=>({sfx:!s.sfx})),
  checkpoint:null, setCheckpoint:(c)=>set({checkpoint:c}),
  doorOpen:false, setDoor:(v)=>set({doorOpen:v}),
  pos:[0,1,2], setPos:(p)=>set({pos:p})
}));
