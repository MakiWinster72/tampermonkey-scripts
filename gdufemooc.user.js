// ==UserScript==
// @name         广财慕课完美禁止自动暂停
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  手动暂停优先，禁止自动暂停循环播放
// @author       Maki Winster
// @match        https://www.gdufemooc.cn/*
// @icon         https://qn-st0.yuketang.cn/15832266638727.png
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let manualPause = false; // 用户手动暂停标志
  let lastUserAction = 0; // 记录用户操作时间

  // 🎯 用户点击播放器时触发
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (e.target.closest("#video-box")) {
        lastUserAction = Date.now();
      }
    },
    true,
  );

  function isUserAction() {
    return Date.now() - lastUserAction < 500;
  }

  // ===== hook pause 方法 =====
  const rawPause = HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.pause = function () {
    // 用户手动触发 → 生效
    if (isUserAction()) {
      manualPause = true;
      return rawPause.apply(this, arguments);
    }

    // 自动暂停 → 忽略，直接返回，不触发 play
    return;
  };

  // ===== hook play 方法 =====
  const rawPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    // 用户手动触发播放 → 解除暂停锁
    if (isUserAction()) {
      manualPause = false;
      return rawPlay.apply(this, arguments);
    }

    // 用户手动暂停 → 阻止自动播放
    if (manualPause) {
      return Promise.resolve();
    }

    // 正常自动播放（视频加载或初始化） → 执行
    return rawPlay.apply(this, arguments);
  };

  // ===== 阻止由焦点丢失导致的 pause 事件 =====
  document.addEventListener("visibilitychange", () => {
    const v = document.querySelector("video.xt_video_player");
    if (!v) return;

    // 浏览器失焦 → 如果视频暂停，不处理
    if (document.hidden && v.paused && !manualPause) {
      // 什么都不做，禁止自动暂停触发 play
      console.log("自动暂停被拦截");
    }
  });
})();
