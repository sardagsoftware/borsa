'use client';
import React from "react";
import Lightbox from "./Lightbox";
export default function ImageGrid({ images, title, columns=3 }:{ images:string[], title:string, columns?:number }){
  if(!images || images.length===0) return null;
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <Lightbox images={images} />
    </section>
  );
}
