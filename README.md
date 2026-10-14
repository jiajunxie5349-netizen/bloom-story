# FloraVerse Bloom Story 第一章鍵鼠體驗版

目前提供種子森林的可玩開發版本：主畫面、獨立章節選單、設定、生態圖鑑，以及觀測、截流、土壤修復選擇、種子喚醒、回顧與返回主畫面的流程。其他章節有視覺預覽與鎖定狀態，尚無可玩的場景。每章 10–15 分鐘是設計目標，需以玩家試玩調校。

## 開啟遊戲

在 Cursor 開啟本資料夾。第一次安裝使用 `npm ci`，之後使用 `npm run dev`，開啟終端機列出的 Local 網址。已有 node_modules 時可直接啟動。請透過伺服器開啟，不要直接雙擊 index.html。

`npm test` 執行進度與通行檢查；`npm run build` 產生 `dist/`；`npm run preview` 檢查建置後版本。正式網站需發布 dist 內容，不是直接把 src 上傳作為網頁。Vite 已設定相對路徑，支援 GitHub Pages 的 `/bloom-story/` 子路徑。

## 操作

- WASD：相機相對方向移動。左鍵拖曳：旋轉視角。滾輪：調整距離。
- 按住右鍵：生態透視鏡。接近觀測點後同時按住 E 完成觀測。
- E：互動。推石與喚醒種子需按住，放開會中止本次動作。
- H：操作說明。Esc：暫停、設定、安全起點、保存返回與重新開始。
- 這一版不含跳躍、攝影機辨識與手機觸控移動。

## 章節進度

三處觀測合計 20%；兩處截流合計 20%；三處土壤治理選擇合計 20%；種子儀式 20%；章末回顧 20%。完成種子儀式達 80% 後，第二章顯示已解鎖但仍開發中。全部完成後播放結尾銜接並回主畫面。

任務順序固定，錯誤選擇只提示再試，不扣分。進度保存在目前瀏覽器 localStorage，不會跨瀏覽器、網址或裝置同步。清除網站資料會清除進度；無法存檔時會提示。

## 影片匯入步驟

1. 準備兩支影片，建議 MP4（H.264 影像、AAC 聲音），1920×1080 或 1280×720。先測試目標瀏覽器是否能正常播放。大型影片會增加首次載入時間，依品質需求控制位元率。
2. 在 `public/` 建立 `videos/` 資料夾，把影片命名為 `chapter-01-intro.mp4` 與 `chapter-01-outro.mp4`。
3. 開啟 `src/content.js`，將 films 改為：

```js
export const films = {
  chapter1Intro: 'videos/chapter-01-intro.mp4',
  chapter1Outro: 'videos/chapter-01-outro.mp4',
};
```

4. 路徑不要加開頭斜線，也不要寫成 `public/videos/...`。檔名大小寫必須與實際檔案完全一致，避免 GitHub Pages 找不到。
5. 使用暫停選單的「重新開始本章」測試開場影片。完成回顧後測試結尾影片。影片結束或按「跳過影片」會接續流程；無法自動播放時，按影片播放鍵即可。
6. 影片遺失或格式不支援時會顯示文字銜接，不會卡住遊戲。films 保持空字串時，也使用文字銜接。
7. 確認本機播放正常後重新執行 `npm run build`，再發布更新的 dist。字幕請先製作於影片，獨立 WebVTT 字幕軌尚未加入。

## 效能與模型修改

第二輪已清理原植物的重複頂點與重疊面：由 273,584 頂點／321,966 面降至合併後 80,207 頂點／156,390 面，再作輪廓減面與網格有效性修復。補入八組摺面扇葉與五組鏽紅菇，合併材質批次以降低繪製負載。正式使用 `forest_refined.glb`：111,645 三角面、3,439,208 bytes；角色使用重新建構的 `sprite_guardian_refined.glb`：1,364 三角面、25,300 bytes。地形與高度場保持一致。舊版模型留作本地備援，不納入新發布包。

原森林實測 356,286 個三角面、15,893,400 bytes，未使用 Draco。植物占 321,966 面；水面重複兩次。優化副本保留原地形，植物以 Blender Decimate ratio 0.28 減面，移除重複水面並啟用 Draco 匯出：123,116 面、3,523,492 bytes。原始 .blend 與桌面原 GLB 未修改。

地面使用原地形離線採樣為 0.25 單位的高度場。執行時採樣貼地，並以玩家占用範圍、坡度與水面高度過濾；任務點選在同一可通行區域。這是高度場控制器，不是完整 NavMesh 導航或通用物理引擎；植物美術不作為實體碰撞。換地形後必須重新產生高度場並驗證通行。

移動按秒計算，加入加減速、相機相對方向與失焦按鍵清理。相機遮擋射線以每秒 8 次檢查，並縮短鏡頭距離。原高成本透光水改為不透明的動態表面；地面沒有 UV，使用世界座標程序材質補足土壤變化。

均衡模式限制像素比為 1，流暢模式為 0.8，精緻模式最高 1.5 並開啟 Bloom。主畫面不載入 3D 引擎，進入章節才載入；解碼器隨專案打包，不依賴外部 CDN。減少動態設定會停用粒子與植物浮動等動效。環境音為本機合成風聲，預設關閉。

完成減面不等於完成精緻建模。原植物部分破洞、薄片與造型仍需 Blender 手動修補、重新拓樸或 UV／法線烘焙；這版先改善效能與材質，沒有宣稱完成全部美術精修。

## 測試狀態與驗收

第二輪以正式 build 產物在 `/bloom-story/` 子路徑檢查，已確認主畫面、模型解碼、森林與角色顯示正常。入口增加不依賴遊戲程式的載入失敗說明；繪製中斷時會保存進度並顯示恢復提示。開發伺服器固定使用 5173，若埠被占用會明確報錯，不再悄悄換成 5174。

開發過程已通過正式建置、進度序列與 80% 解鎖邏輯、存檔損壞／不可用處理，以及九個任務點依角色占用範圍的通行路徑檢查。瀏覽器已檢查主畫面、開場文字、教學、場景載入、WASD 接近與右鍵＋E 的第一處觀測。完整真人通關、不同顯示卡效能、正式 MP4 播放與 10–15 分鐘節奏仍需驗收；不保證所有電腦 60 FPS。

建議試玩記錄：作業系統、瀏覽器、CPU／GPU、解析度、畫質、完成時間、是否迷路、是否理解「隔離不等於污染消失」。在暫停面板可看目前 FPS 與繪製負載。請特別測試放開按鍵、切換視窗、返回主畫面、重新整理恢復、錯誤選擇重試，以及無網路時的 dist 本機運行。

## 教學依據

紫色水與即時開花是藝術化符號，不能作為現實污染檢測或治理效果的證據。關卡強調「觀察檢測、控制污染源、依情況治理、持續監測」，沒有宣稱推石或種花即可消除重金屬。

- [US EPA 土壤與地下水治理方法](https://www.epa.gov/remedytech/remediation-technology-descriptions-cleaning-contaminated-sites)
- [US EPA 植物修復介紹](https://www.epa.gov/remedytech/phytoremediation-contaminated-soil-and-ground-water-hazardous-waste-sites)
- [FAO 農業塑膠與土壤污染](https://www.fao.org/climate-change/cross-cutting-areas/plastics-in-agriculture)

## 檔案責任

- `src/main.js`：流程、輸入、UI 事件、影片與互動。
- `src/world.js`：Three.js 場景、材質、玩家、相機與模型載入。
- `src/navigation.js`：高度場與通行區域。
- `src/progress.js`：進度驗證、儲存、章節解鎖。
- `src/content.js`：章節文案、影片路徑與教學題目。
- `src/ui.js`、`src/style.css`：主畫面、章節卡片與遊戲介面。
- `public/models/forest_optimized.glb`、`terrain.json`：優化模型與對應高度場。
- `public/models/forest_refined.glb`、`sprite_guardian_refined.glb`：第二輪清理、補建並嵌入的正式模型。
- `public/draco/`：本地 Draco 解碼器。

## GitHub Pages 自動發布

儲存庫 Settings → Pages → Build and deployment → Source 使用 GitHub Actions。`.github/workflows/deploy.yml` 會在 main 更新時安裝依賴、執行任務進度與通行測試、建置 Vite，再發布 dist。不要使用 main 根目錄直接發布開發用 index.html；其中的未建置套件匯入與 `/src/main.js` 會造成空白畫面。

每次更新後在 Actions 檢查 Publish Bloom Story 成功，再開啟線上網站驗證。若失敗，線上通常維持上次成功發布的版本。原始 .blend 不需要上傳到網站，只需提交匯出的 GLB、地形資料與程式。
