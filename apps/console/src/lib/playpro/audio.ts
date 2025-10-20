'use client';
let Howl: any;
try {
  const howler = require('howler');
  Howl = howler.Howl;
} catch {
  // Howler not available, use silent fallback
  Howl = class { play(){} stop(){} };
}

type S = { id:string; howl: any };
const bank: Record<string,S> = {};

export function addSound(id:string, src:string, vol=0.8){
  try {
    bank[id] = { id, howl:new Howl({ src:[src], volume:vol }) };
  } catch {}
}

export function play(id:string){
  try {
    if (bank[id]?.howl?.play) {
      bank[id].howl.play();
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  } catch {}
}

export function stop(id:string){
  try {
    if (bank[id]?.howl?.stop) {
      bank[id].howl.stop();
    }
  } catch {}
}

export function music(id:string, src:string, loop=true, vol=0.5){
  try {
    if(!bank[id]) {
      bank[id] = { id, howl:new Howl({ src:[src], html5:true, loop, volume:vol }) };
    }
    if (bank[id]?.howl?.play) {
      bank[id].howl.play();
    }
  } catch {}
}
