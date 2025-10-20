export type CharConfig = { name:string; candidates:string[]; anims?:{idle?:string;walk?:string;run?:string} };
export const CHARACTERS: CharConfig[] = [
  {
    name: "Elif Melisa Sarı",
    candidates: [
      "/assets/play/characters/Elif.glb",
      "/assets/models/Elif.glb",
      "/assets/models/character.glb",
      "/assets/play/characters/character.glb"
    ],
    anims: { idle:"Idle", walk:"Walk", run:"Run" }
  },
  {
    name: "Melih Sarı",
    candidates: [
      "/assets/play/characters/Melih.glb",
      "/assets/models/Melih.glb"
    ],
    anims: { idle:"Idle", walk:"Walk", run:"Run" }
  }
];
