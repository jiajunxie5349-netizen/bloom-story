import {defineConfig} from 'vite';
import {authoringPlugin} from './authoring/server-plugin.js';
export default defineConfig(({command})=>({base:'./',plugins:command==='serve'?[authoringPlugin()]:[],server:{host:'127.0.0.1',port:5173,strictPort:true}}));
