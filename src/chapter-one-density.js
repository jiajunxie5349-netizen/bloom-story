// Keep one out of three existing herbs without moving any retained plant.
export const excludedChapterOneHerbs=Array.from({length:95},(_,i)=>i).filter(i=>i%3!==0).map(i=>'herb-'+String(i).padStart(3,'0'));
const excluded=new Set(excludedChapterOneHerbs);
export const keepChapterOnePlant=id=>!excluded.has(id);
