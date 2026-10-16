// Input and prompt share this rule. Camera angle is deliberately irrelevant.
export function interactionDistance(player,target){
 const p=target.interactionPosition??target.position;
 return Math.abs(player.y-p.y)>2.4?Infinity:Math.hypot(player.x-p.x,player.z-p.z);
}
export function nearestInteraction(player,targets){
 return targets.map(t=>({...t,distance:interactionDistance(player,t)})).sort((a,b)=>a.distance-b.distance)[0]??null;
}
export const interactionRange=2.6;
