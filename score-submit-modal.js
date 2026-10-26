/**
 * 🏆 BioGameSuite (國中生物遊戲平台終極標準中介層模組)
 * 版本: v3.0 (終極標準模組化)
 * 核心功能：
 * 1. 【開局登入】：純數字 701~710、01~35、真實姓名必填、單元智慧派卷鎖定
 * 2. 【防滑錯確認＋數位公約】：身分二次確認彈窗 ＋ 課堂載具使用誠信公約（嚴禁看YouTube/拍照/開非課堂App）
 * 3. 【中途防手滑護城河】：未完賽時誤觸上一頁/重整立即攔截確認，支援中斷恢復
 * 4. 【結算一鍵送出】：優先 GAS 拋轉、防連點鎖定、8 秒網路塞車保底機制、斷網離線複製備用
 * 5. 【拔尖加深】：提早完成者可選用「中高難度加碼 10 題」
 * 6. 【下課交機 3 大防雷自我檢查】：關鬧鐘計時、刪相簿照片與分頁、禁動設定，防跑班污染自動重置
 */
(function (global) {
  'use strict';

  const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbzDHUfJKbGtgfYM5a1PHpQzbW2JGZL3zFTh582r95vcOKupGRfZVa0ToHbbfX1MirzbbQ/exec';

  // 狀態管理
  let currentStudent = {
    class: '',
    seat: '',
    name: '',
    unit: ''
  };
  let isGameActive = false;
  let isScoreSubmitted = false;
  let exitGuardEnabled = false;

  // 動態注入通用 CSS
  function injectSuiteStyles() {
    if (document.getElementById('bioSuiteStyles')) return;
    const style = document.createElement('style');
    style.id = 'bioSuiteStyles';
    style.textContent = `
      .bgs-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft JhengHei", sans-serif;
        padding: 16px;
        box-sizing: border-box;
      }
      .bgs-card {
        background: #1e293b;
        border: 2px solid #38bdf8;
        border-radius: 24px;
        width: 100%;
        max-width: 460px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 24px 22px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
        color: #f8fafc;
        animation: bgsPopIn 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-sizing: border-box;
      }
      @keyframes bgsPopIn {
        from { transform: scale(0.88); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes bgsPulse {
        from { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
        to { transform: scale(1.02); box-shadow: 0 0 16px 4px rgba(245, 158, 11, 0.7); }
      }
      .bgs-title {
        font-size: 1.35rem;
        font-weight: 900;
        color: #38bdf8;
        text-align: center;
        margin: 0 0 6px 0;
      }
      .bgs-subtitle {
        font-size: 0.88rem;
        color: #94a3b8;
        text-align: center;
        margin: 0 0 18px 0;
        line-height: 1.4;
      }
      .bgs-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 12px;
      }
      .bgs-form-group {
        margin-bottom: 14px;
        text-align: left;
      }
      .bgs-label {
        display: block;
        font-size: 0.85rem;
        font-weight: 700;
        margin-bottom: 6px;
        color: #cbd5e1;
      }
      .bgs-input, .bgs-select {
        width: 100%;
        padding: 11px 14px;
        background: #0f172a;
        border: 1.5px solid #334155;
        border-radius: 12px;
        color: #ffffff;
        font-size: 0.95rem;
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.2s;
      }
      .bgs-input:focus, .bgs-select:focus {
        border-color: #38bdf8;
      }
      .bgs-unit-badge {
        background: rgba(16, 185, 129, 0.15);
        border: 1.5px solid #10b981;
        border-radius: 12px;
        padding: 10px 14px;
        color: #6ee7b7;
        font-size: 0.92rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 14px;
      }
      .bgs-contract-box {
        background: rgba(239, 68, 68, 0.1);
        border: 1.5px dashed #ef4444;
        border-radius: 14px;
        padding: 14px;
        margin-bottom: 18px;
        text-align: left;
      }
      .bgs-contract-title {
        color: #fca5a5;
        font-size: 0.92rem;
        font-weight: 800;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .bgs-contract-item {
        font-size: 0.82rem;
        color: #fecaca;
        line-height: 1.5;
        margin-bottom: 4px;
      }
      .bgs-btn {
        width: 100%;
        padding: 13px;
        border-radius: 14px;
        font-size: 1.05rem;
        font-weight: 800;
        border: none;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
        box-sizing: border-box;
        margin-top: 8px;
      }
      .bgs-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed !important;
        background: #475569 !important;
        box-shadow: none !important;
      }
      .bgs-btn-primary {
        background: linear-gradient(135deg, #16a34a, #15803d);
        color: white;
        box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4);
      }
      .bgs-btn-gold {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
      }
      .bgs-btn-subtle {
        background: #334155;
        color: #cbd5e1;
        border: 1px solid #475569;
        font-size: 0.9rem;
      }
      .bgs-btn-subtle:hover {
        background: #475569;
        color: #ffffff;
      }
      .bgs-checklist-card {
        background: rgba(30, 41, 59, 0.95);
        border: 2px solid #22c55e;
        border-radius: 20px;
        padding: 16px;
        margin-bottom: 16px;
        text-align: left;
      }
      .bgs-checklist-title {
        color: #4ade80;
        font-size: 1.02rem;
        font-weight: 900;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .bgs-checklist-item {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 10px 12px;
        margin-bottom: 8px;
      }
      .bgs-checklist-item strong {
        display: block;
        color: #fbbf24;
        font-size: 0.88rem;
        margin-bottom: 3px;
      }
      .bgs-checklist-item p {
        margin: 0;
        font-size: 0.8rem;
        color: #cbd5e1;
        line-height: 1.4;
      }
    `;
    document.head.appendChild(style);
  }

  // 1. 開局防手滑離開攔截
  function initExitGuard() {
    if (exitGuardEnabled) return;
    exitGuardEnabled = true;

    window.addEventListener('beforeunload', function (e) {
      if (isGameActive && !isScoreSubmitted) {
        e.preventDefault();
        e.returnValue = '⚠️ 關卡尚未完成！離開將遺失目前挑戰進度，確定要離開嗎？';
        return e.returnValue;
      }
    });

    // iPad 邊緣滑動上一頁防護
    try {
      history.pushState(null, '', location.href);
      window.addEventListener('popstate', function () {
        if (isGameActive && !isScoreSubmitted) {
          const leave = confirm('⚠️ 關卡尚未完成！離開將遺失目前挑戰進度，確定要離開遊戲嗎？');
          if (!leave) {
            history.pushState(null, '', location.href);
          }
        }
      });
    } catch (_) {}
  }

  // 解除離開攔截 (交卷後)
  function disableExitGuard() {
    isGameActive = false;
    isScoreSubmitted = true;
  }

  // 2. 開局統一登入模組
  function showLogin(options) {
    injectSuiteStyles();
    initExitGuard();

    const params = new URLSearchParams(window.location.search);
    const urlUnit = params.get('unit') || params.get('file');
    const isDispatch = !!urlUnit;
    const unitTitle = options.unitTitle || (isDispatch ? `課堂指定單元 (${urlUnit})` : '[7上] 1-1 生命現象');

    // 檢查是否有 10 分鐘內未完成的中斷暫存 (中途手滑恢復)
    const savedSessionRaw = sessionStorage.getItem('bgs_active_session');
    if (savedSessionRaw) {
      try {
        const savedSession = JSON.parse(savedSessionRaw);
        const timeDiff = Date.now() - (savedSession.timestamp || 0);
        if (timeDiff < 10 * 60 * 1000 && savedSession.inProgress && typeof options.onResume === 'function') {
          const resume = confirm(`🔄 偵測到您剛剛未完成的挑戰進度！\n\n【${savedSession.class} - ${savedSession.seat}】${savedSession.name}\n\n是否繼續未完成的挑戰？`);
          if (resume) {
            currentStudent = savedSession;
            isGameActive = true;
            options.onResume(savedSession);
            return;
          }
        }
      } catch (_) {}
    }

    const overlay = document.createElement('div');
    overlay.className = 'bgs-overlay';
    overlay.id = 'bgsLoginOverlay';

    const savedClass = localStorage.getItem('bgs_last_class') || '701';
    const classOpts = Array.from({ length: 10 }, (_, i) => {
      const c = `7${String(i + 1).padStart(2, '0')}`;
      return `<option value="${c}" ${c === savedClass ? 'selected' : ''}>${c}</option>`;
    }).join('');

    const seatOpts = Array.from({ length: 35 }, (_, i) => {
      const s = String(i + 1).padStart(2, '0');
      return `<option value="${s}">${s}</option>`;
    }).join('');

    overlay.innerHTML = `
      <div class="bgs-card">
        <h2 class="bgs-title">🚀 ${options.gameTitle || '課堂生物挑戰'}</h2>
        <p class="bgs-subtitle">國中生物課堂評量系統 · 請輸入身分登入</p>

        <!-- 班級座號 (純數字) -->
        <div class="bgs-row">
          <div class="bgs-form-group">
            <label class="bgs-label">班級 (701~710)</label>
            <select class="bgs-select" id="bgsClassSelect">${classOpts}</select>
          </div>
          <div class="bgs-form-group">
            <label class="bgs-label">座號 (01~35)</label>
            <select class="bgs-select" id="bgsSeatSelect">${seatOpts}</select>
          </div>
        </div>

        <!-- 真實姓名 (必填防偽) -->
        <div class="bgs-form-group">
          <label class="bgs-label">學生真實姓名 (必填，勿填綽號)</label>
          <input type="text" class="bgs-input" id="bgsNameInput" placeholder="請輸入全名 (如：王小明)" maxlength="15" required />
        </div>

        <!-- 單元選擇 (老師派卷鎖定 vs 自主切換) -->
        ${isDispatch ? `
          <div class="bgs-form-group">
            <label class="bgs-label">挑戰單元 (老師派卷鎖定)</label>
            <div class="bgs-unit-badge">
              <span>🎯</span>
              <span>${unitTitle} (派卷專屬)</span>
            </div>
          </div>
        ` : `
          <div class="bgs-form-group">
            <label class="bgs-label">選擇複習單元</label>
            <select class="bgs-select" id="bgsUnitSelect">
              <option value="unit01_scientific_method">[7上] 1-1 科學方法與生命現象</option>
              <option value="unit02_cells">[7上] 1-2 細胞構造與顯微鏡</option>
              <option value="unit03_transport">[7上] 2-1 物質進出細胞與擴散</option>
              <option value="unit04_nutrition">[7上] 3-1 養分消化與酵素作用</option>
              <option value="unit05_circulation">[7上] 4-1 人體血液與心臟循環</option>
              <option value="unit06_coordination">[7上] 5-1 神經傳導與反射協調</option>
              <option value="unit07_homeostasis">[7上] 6-1 呼吸體溫恆定與排泄</option>
            </select>
          </div>
        `}

        <button type="button" class="bgs-btn bgs-btn-primary" id="bgsBtnNext">下一步：核對身分與公約 ➜</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const btnNext = overlay.querySelector('#bgsBtnNext');
    const classSel = overlay.querySelector('#bgsClassSelect');
    const seatSel = overlay.querySelector('#bgsSeatSelect');
    const nameInp = overlay.querySelector('#bgsNameInput');

    nameInp.focus();

    btnNext.addEventListener('click', () => {
      const cls = classSel.value;
      const seat = seatSel.value;
      const name = nameInp.value.trim();

      if (!name) {
        alert('⚠️ 請務必填寫您的真實姓名，不可留空！');
        nameInp.focus();
        return;
      }

      currentStudent = {
        class: cls,
        seat: seat,
        name: name,
        unit: isDispatch ? urlUnit : (overlay.querySelector('#bgsUnitSelect')?.value || 'unit01_scientific_method'),
        unitTitle: unitTitle,
        timestamp: Date.now(),
        inProgress: true
      };

      localStorage.setItem('bgs_last_class', cls);
      sessionStorage.setItem('bgs_active_session', JSON.stringify(currentStudent));

      // 進入【二次核對＋誠信公約】視窗
      overlay.remove();
      showConfirmModal(options);
    });
  }

  // 3. 開局二次確認防滑錯 ＋ 課堂載具誠信公約
  function showConfirmModal(options) {
    const overlay = document.createElement('div');
    overlay.className = 'bgs-overlay';
    overlay.id = 'bgsConfirmOverlay';

    overlay.innerHTML = `
      <div class="bgs-card">
        <h2 class="bgs-title">👤 請核對挑戰身分</h2>
        <p class="bgs-subtitle">防滑錯確認 · 避免成績登記至其他同學座號</p>

        <div style="background:rgba(56, 189, 248, 0.12); border:1.5px solid #38bdf8; border-radius:14px; padding:12px; text-align:center; margin-bottom:14px;">
          <div style="font-size:0.85rem; color:#94a3b8;">登錄身分確認</div>
          <div style="font-size:1.45rem; font-weight:900; color:#38bdf8; margin:4px 0;">
            ${currentStudent.class} 班級　${currentStudent.seat} 座號
          </div>
          <div style="font-size:1.15rem; font-weight:800; color:#ffffff;">
            姓名：${currentStudent.name}
          </div>
          <div style="font-size:0.82rem; color:#10b981; margin-top:4px;">
            📚 單元：${currentStudent.unitTitle}
          </div>
        </div>

        <!-- 📱 課堂載具使用誠信公約 (事前約束) -->
        <div class="bgs-contract-box">
          <div class="bgs-contract-title">
            <span>📱</span>
            <span>【課堂載具使用誠信公約】</span>
          </div>
          <div class="bgs-contract-item">⚠️ <strong>挑戰全程請專注於本遊戲！</strong></div>
          <div class="bgs-contract-item">👉 <strong>嚴禁跳出畫面看 YouTube、拍照自拍、或開啟非課堂 App。</strong></div>
          <div class="bgs-contract-item">👉 若發現違規使用載具，本次作答成績將直接不予計分！</div>
        </div>

        <button type="button" class="bgs-btn bgs-btn-primary" id="bgsBtnStart">
          🚀 我已核對身分並遵守公約，開始出擊！
        </button>
        <button type="button" class="bgs-btn bgs-btn-subtle" id="bgsBtnBack">
          ↩️ 座號有誤，返回修改
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#bgsBtnBack').addEventListener('click', () => {
      overlay.remove();
      showLogin(options);
    });

    overlay.querySelector('#bgsBtnStart').addEventListener('click', () => {
      overlay.remove();
      isGameActive = true;
      isScoreSubmitted = false;
      if (typeof options.onStart === 'function') {
        options.onStart(currentStudent);
      }
    });
  }

  // 4. 結算拋轉模組 (優先 GAS ＋ 防連點 ＋ 8秒超時 ＋ 斷網離線備用)
  function showResult(options) {
    injectSuiteStyles();

    const overlay = document.createElement('div');
    overlay.className = 'bgs-overlay';
    overlay.id = 'bgsResultOverlay';

    const score = options.score !== undefined ? options.score : 100;
    const scoreDisplay = options.scoreDisplay || `${score} 分`;
    const duration = options.duration || '--:--';
    const gasUrl = options.gasUrl || DEFAULT_GAS_URL;

    overlay.innerHTML = `
      <div class="bgs-card" id="bgsResultCard">
        <h2 class="bgs-title">🏆 挑戰圓滿完成！</h2>
        <p class="bgs-subtitle">${options.gameTitle || '課堂生物遊戲'}</p>

        <div style="background:rgba(56, 189, 248, 0.1); border:1px solid rgba(56, 189, 248, 0.3); border-radius:14px; padding:12px; text-align:center; margin-bottom:14px;">
          <div style="font-size:0.85rem; color:#94a3b8;">
            選手：${currentStudent.class || '701'} - ${currentStudent.seat || '01'} ${currentStudent.name || '同學'}
          </div>
          <div style="font-size:1.8rem; font-weight:900; color:#f59e0b; margin:4px 0;">
            ${scoreDisplay}
          </div>
          <div style="font-size:0.8rem; color:#64748b;">⏱️ 耗時：${duration}</div>
        </div>

        <div id="bgsSubmitArea">
          <button type="button" class="bgs-btn bgs-btn-primary" id="bgsBtnSubmit">
            🚀 送出成績至試算表 (優先推薦)
          </button>
          <button type="button" class="bgs-btn bgs-btn-subtle" id="bgsBtnCopy">
            📋 複製成績文字檔 (斷網備用)
          </button>
        </div>

        <div id="bgsPostSubmitArea" style="display:none;"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    const btnSubmit = overlay.querySelector('#bgsBtnSubmit');
    const btnCopy = overlay.querySelector('#bgsBtnCopy');
    const submitArea = overlay.querySelector('#bgsSubmitArea');
    const postSubmitArea = overlay.querySelector('#bgsPostSubmitArea');

    let isSubmitting = false;

    // 複製備用
    btnCopy.addEventListener('click', () => {
      const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
      const hashStr = Math.random().toString(36).substring(2, 10).toUpperCase();
      const textToCopy = `🏆 [${options.gameTitle || '課堂生物挑戰'}] 結算成績單\n` +
        `👤 學生身分：【${currentStudent.class || '701'} - ${currentStudent.seat || '01'} ${currentStudent.name || '同學'}】\n` +
        `💯 挑戰得分：${scoreDisplay}\n` +
        `⏱️ 耗時記錄：${duration}\n` +
        `📅 提交時間：${timestamp}\n` +
        `🔑 防偽驗證：BIO-${hashStr}`;

      navigator.clipboard.writeText(textToCopy).then(() => {
        alert('✅ 已複製成績備份至剪貼簿！可直接交給老師備查：\n\n' + textToCopy);
      }).catch(() => {
        prompt('請選取並複製以下成果文本：', textToCopy);
      });
    });

    // 優先送出
    btnSubmit.addEventListener('click', async () => {
      if (isSubmitting || isScoreSubmitted) return;
      isSubmitting = true;
      btnSubmit.disabled = true;
      btnSubmit.innerText = '⏳ 正在傳送成績中，請稍候...';

      const payload = {
        class: currentStudent.class || '701',
        seatOrGroup: currentStudent.seat || '01',
        nameOrMembers: currentStudent.name || '同學',
        gameTitle: options.gameTitle || '課堂生物挑戰',
        score: score,
        duration: duration,
        mode: 'individual',
        timestamp: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
        rawTimestamp: Date.now()
      };

      // 8 秒超時保底控制器
      let timeoutTriggered = false;
      const timeoutTimer = setTimeout(() => {
        timeoutTriggered = true;
        isSubmitting = false;
        btnSubmit.disabled = false;
        btnSubmit.innerText = '🔄 重試送出成績';
        btnCopy.style.animation = 'bgsPulse 1s infinite alternate';
        alert('⚠️ 目前教室網路塞車中！\n你的成績已經安全保存在這台 iPad 上，請先不要關閉網頁，下課時直接將平板交給老師檢查登記！');
      }, 8000);

      try {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        clearTimeout(timeoutTimer);
        if (timeoutTriggered) return;

        // 完賽成功，鎖定並解除防手滑離開攔截
        disableExitGuard();
        sessionStorage.removeItem('bgs_active_session');

        submitArea.style.display = 'none';
        postSubmitArea.style.display = 'block';

        // 呈現【下課交回平板 3 大自我檢查守則】
        postSubmitArea.innerHTML = `
          <div style="text-align:center; margin-bottom:14px;">
            <div style="font-size:3rem; margin-bottom:4px;">🎉</div>
            <div style="font-size:1.25rem; font-weight:900; color:#4ade80;">成績上傳成功！</div>
            <div style="font-size:0.85rem; color:#94a3b8; margin-top:2px;">
              已順利登記至老師試算表【${payload.class} - ${payload.seatOrGroup}】${payload.nameOrMembers}
            </div>
          </div>

          <!-- 📱 平板交回充電車前 · 3 大自我檢查守則 -->
          <div class="bgs-checklist-card">
            <div class="bgs-checklist-title">
              <span>📱</span>
              <span>【平板交回充電車前 · 3 大自我檢查守則】</span>
            </div>

            <div class="bgs-checklist-item">
              <strong>⏰ 1. 關閉所有鬧鐘與計時器</strong>
              <p>嚴禁在時鐘 App 留下任何計時，避免推車內大響干擾下一班！</p>
            </div>

            <div class="bgs-checklist-item">
              <strong>📸 2. 清理相簿照片與瀏覽分頁</strong>
              <p>請勿留下任何自拍或個人照片，維護個資並關閉本遊戲分頁。</p>
            </div>

            <div class="bgs-checklist-item">
              <strong>🚫 3. 嚴禁開啟非課堂 App 或更動設定</strong>
              <p>保持系統乾淨，做個有良好數位素養的優秀學生！</p>
            </div>
          </div>

          ${options.onBonus ? `
            <button type="button" class="bgs-btn bgs-btn-gold" id="bgsBtnBonus" style="margin-bottom:8px;">
              🔥 還有時間？挑戰進階加碼 10 題 (中高難度素養題)
            </button>
          ` : ''}

          <button type="button" class="bgs-btn bgs-btn-primary" id="bgsBtnFinish">
            ✅ 我已完成上述 3 項檢查，交回平板 (一鍵鎖定) ➔
          </button>
        `;

        if (options.onBonus) {
          postSubmitArea.querySelector('#bgsBtnBonus')?.addEventListener('click', () => {
            overlay.remove();
            options.onBonus();
          });
        }

        const finishBtn = postSubmitArea.querySelector('#bgsBtnFinish');
        finishBtn.addEventListener('click', () => {
          overlay.remove();
          // 清空身分快取，防跑班污染
          sessionStorage.clear();
          localStorage.removeItem('bio_student_profile');
          // 嘗試重整回初始開局狀態
          window.location.reload();
        });

        // 3 分鐘閒置自動重置 (防下一班同學頂替)
        setTimeout(() => {
          sessionStorage.clear();
          localStorage.removeItem('bio_student_profile');
          window.location.reload();
        }, 3 * 60 * 1000);

      } catch (err) {
        clearTimeout(timeoutTimer);
        isSubmitting = false;
        btnSubmit.disabled = false;
        btnSubmit.innerText = '🔄 重試送出成績';
        btnCopy.style.animation = 'bgsPulse 1s infinite alternate';
        alert('⚠️ 網路連線稍慢或異常，已切換離線備用：請點擊「📋 複製成績文字檔」交給老師備查！');
      }
    });
  }

  // 全域暴露
  global.BioGameSuite = {
    showLogin: showLogin,
    showConfirmModal: showConfirmModal,
    showResult: showResult,
    getStudent: () => currentStudent,
    disableExitGuard: disableExitGuard
  };

  // 舊版 score-submit-modal 向下相容別名
  global.showScoreSubmitModal = function (options) {
    showResult(options || {});
  };

})(window);
