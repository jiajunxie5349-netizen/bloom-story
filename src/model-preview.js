import {freshValley,tasks} from './valley-data.js';
// Ephemeral state; never save to player storage.
export function createModelPreview(restored=false){return {...freshValley(),preview:true,done:restored?tasks.map(t=>t.id):[]};}
