import assert from 'node:assert/strict';
import {rememberStory,readStory,storyJournal,filmScenes,conversation} from '../src/story.js';
import {films} from '../src/content.js';
const cache=new Map(),storage={getItem:k=>cache.get(k),setItem:(k,v)=>cache.set(k,v)};
assert(rememberStory(storage,1,'老樹','前往 A 站'));assert(rememberStory(storage,1,'老樹','前往 A 站'));assert.equal(readStory(storage,1).length,1);
rememberStory(storage,2,'老藤','調查空氣');assert.equal(readStory(storage,2).length,1);assert.equal(readStory(storage,1)[0].text,'前往 A 站');
rememberStory(storage,1,'<script>','<img src=x onerror=alert(1)>');assert(!storyJournal(storage,1).includes('<script>'));assert(!storyJournal(storage,1).includes('<img'));
assert.deepEqual(readStory({getItem(){return '{bad';}},1),[]);assert.equal(rememberStory({getItem(){throw Error();}},1,'a','b'),false);
for(const c of [1,2])for(const part of ['Intro','TurningPoint','Outro']){const key=`chapter${c}${part}`;assert(filmScenes[key]?.title&&filmScenes[key]?.text);assert.equal(typeof films[key],'string');}
console.log('PASS dialogue notes persistence, chapter separation, safe rendering and six story-film fallbacks');

assert(conversation('老樹',['精靈：我要怎麼做？'],0).includes('葉衣精靈'));
