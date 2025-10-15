import React from "react";
import dynamic from "next/dynamic";
export const metadata = { title:"Echo of Sardis — Play-Pro", description:"PS5-tarzı web vertical slice." };
const Scene = dynamic(()=>import('@/components/playpro/Scene'), { ssr:false });
const Puzzle = dynamic(()=>import('@/components/playpro/Puzzle'), { ssr:false });
const TopHUD = dynamic(()=>import('@/components/playpro/UI').then(m=>m.TopHUD), { ssr:false });
const Settings = dynamic(()=>import('@/components/playpro/UI').then(m=>m.Settings), { ssr:false });
const PhotoMode = dynamic(()=>import('@/components/playpro/UI').then(m=>m.PhotoMode), { ssr:false });
export default function PlayPro(){
  return (
    <main className="w-full h-[calc(100vh-80px)]">
      <div className="h-full relative">
        <Scene/>
        <TopHUD/>
        <Settings/>
        <PhotoMode/>
        <Puzzle/>
      </div>
      <div className="container max-w-6xl py-3 text-sm opacity-80">
        <b>Kontroller:</b> W/A/S/D (hareket) • Fare (kamera) • ESC (Puzzle/menü) • P (Photo Mode) • Gamepad (LS + A)
      </div>
    </main>
  );
}
