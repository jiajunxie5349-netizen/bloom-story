import assert from 'node:assert/strict';
import {fieldLessons,lessonStepReady,firstIssue} from '../src/lesson-path.js';
import {freshPuzzle} from '../src/puzzles.js';
// Navigation must depend on the answer on this page, never on a default selected tool.
for(const kind of ['evidence','soil','plants','cleanup']){
 const state=freshPuzzle(kind);assert(!lessonStepReady(kind,state,0));
 assert(fieldLessons[kind].takeaway&&fieldLessons[kind].limit);
}
const soil={zones:{A:'fertilizer',B:'plant',C:'buffer',D:'keep',E:'isolate'}};
assert.equal(firstIssue('soil',soil),0);soil.zones.A='cover';soil.zones.D='paving';assert.equal(firstIssue('soil',soil),3);
const evidence={source:'B',route:'branch',limit:''};assert(!lessonStepReady('evidence',evidence,2));evidence.limit='repeat';assert(lessonStepReady('evidence',evidence,2));
assert(!lessonStepReady('cleanup',{items:{bottle:'collect',bag:'collect'}},3));
console.log('PASS learning steps require a choice, identify the correction page, and provide explicit takeaways and limits');

assert.equal(firstIssue('plants',{zones:{shade:'shade',slope:'slope',shore:'shore'},habitat:false}),2);
assert.equal(firstIssue('cleanup',{items:{bottle:'collect',bag:'collect'}}),2);
