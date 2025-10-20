'use client';
import React, { useEffect, useRef, useState } from 'react';
import { play } from '@/lib/playpro/audio';

export default function CombatController(){
  const [canHit,setCanHit] = useState(true);
  const combo = useRef(0);
  useEffect(()=>{
    const onClick = (e:KeyboardEvent|MouseEvent)=>{
      if ((e as KeyboardEvent).key && (e as KeyboardEvent).key.toLowerCase()!=='f') return; // F=attack
      if (!canHit) return;
      combo.current = (combo.current + 1) % 3;
      setCanHit(false);
      // hasar: 10 / 15 / 25
      const damage = [10,15,25][combo.current];
      document.dispatchEvent(new CustomEvent('hit',{detail:damage}));
      play('swing');
      setTimeout(()=> setCanHit(true), 350 + combo.current*120);
    };
    window.addEventListener('keydown', onClick as any);
    window.addEventListener('click', onClick as any);
    return ()=>{ window.removeEventListener('keydown', onClick as any); window.removeEventListener('click', onClick as any); };
  },[canHit]);
  return null;
}
