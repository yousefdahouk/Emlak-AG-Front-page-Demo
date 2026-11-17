import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { mergeDocuments, dedup, prune, unpartition } from '@gltf-transform/functions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const SRC = '../ck/models/';
const ROT = { 0:[0,0,0,1], 90:[0,Math.SQRT1_2,0,Math.SQRT1_2], 180:[0,1,0,0], 270:[0,-Math.SQRT1_2,0,Math.SQRT1_2] };

// 1) single buildings with embedded texture
for (const n of ['building-small-a','building-small-b','building-small-c','building-small-d']) {
  const d = await io.read(SRC + n + '.glb');
  await d.transform(unpartition());
  await io.write(`out/${n}.glb`, d);
}

// 2) a composed city block
const layout = [
  // [model, x, z, rot]
  ['building-small-c',0,0,0],['building-small-b',1,0,0],['grass-trees-tall',2,0,0],['building-small-a',3,0,0],
  ['grass-trees',0,1,0],['pavement-fountain',1,1,0],['pavement',2,1,0],['building-small-d',3,1,270],
  ['road-straight-lightposts',0,2,process.env.RR|0],['road-straight',1,2,process.env.RR|0],['road-straight-lightposts',2,2,process.env.RR|0],['road-straight',3,2,process.env.RR|0],
  ['building-small-d',0,3,180],['building-garage',1,3,180],['grass-trees',2,3,0],['building-small-b',3,3,180],
];
const doc = new Document();
doc.createBuffer();
const scene = doc.createScene('Quartier');
const root = doc.createNode('Quartier');
scene.addChild(root);
for (const [n,x,z,r] of layout) {
  const src = await io.read(SRC + n + '.glb');
  const map = mergeDocuments(doc, src);
  const srcScene = src.getRoot().listScenes()[0];
  const tile = doc.createNode(n).setTranslation([x-1.5,0,z-1.5]).setRotation(ROT[r]);
  root.addChild(tile);
  const mergedScene = map.get(srcScene);
  for (const c of mergedScene.listChildren()) tile.addChild(c);
  mergedScene.dispose();
}
await doc.transform(unpartition(), dedup(), prune());
await io.write('out/quartier.glb', doc);
console.log('ok');
