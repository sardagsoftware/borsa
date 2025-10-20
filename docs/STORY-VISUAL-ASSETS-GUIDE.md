# Story Visual Assets Guide (Live)
Koymanız gereken örnek yollar:
- apps/console/public/assets/story/characters/Elif.png
- apps/console/public/assets/story/characters/Ferhat.png
- apps/console/public/assets/story/concepts/chordstone-compass.jpg
- apps/console/public/assets/story/env/ruins_01.jpg
- apps/console/public/assets/story/video/trailer.mp4    (opsiyonel)
- apps/console/public/assets/story/models/echo-sentinel.glb (opsiyonel)

`story/characters.json` → ilgili karakterlere:
{
  "id":"ELIF", "name":"Elif Aras", "role":"protagonist",
  "portrait":"/assets/story/characters/Elif.png",
  "images":["/assets/story/concepts/chordstone-compass.jpg","/assets/story/env/ruins_01.jpg"],
  "video":"/assets/story/video/trailer.mp4",
  "glb":"/assets/story/models/echo-sentinel.glb"
}
`story/aesthetic-palette.json` → 
{ "concepts":["/assets/story/concepts/chordstone-compass.jpg"], "environments":["/assets/story/env/ruins_01.jpg"] }

Dosya yoksa otomatik `placeholder.svg` gösterilir; UI kırılmaz.
