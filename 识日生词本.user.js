// ==UserScript==
// @name         识日生词本
// @namespace    shiri-wordbook
// @version      1.2.0
// @description  日语划词翻译+收藏，支持DeepSeek AI翻译，一键同步到识日App
// @author       Shiri
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      *
// ==/UserScript==

(function() {
    "use strict";

    // ==================== 默认配置 ====================
    var DEFAULT_CONFIG = {
        iconX: -1,
        iconY: -1,
        apiType: "mymemory",
        deepseekKey: "",
        customApiUrl: "",
        syncUrl: "http://192.168.2.191:8080/upload",
        clearAfterSync: false
    };
    var STORAGE_KEY = "shiri_words";
    var CONFIG_KEY = "shiri_config";

    function loadConfig() {
        try {
            var raw = GM_getValue(CONFIG_KEY, null);
            if (raw) return Object.assign({}, DEFAULT_CONFIG, JSON.parse(raw));
        } catch (_) {}
        return Object.assign({}, DEFAULT_CONFIG);
    }
    function saveConfig(cfg) { GM_setValue(CONFIG_KEY, JSON.stringify(cfg)); }
    var config = loadConfig();
var iconX = config.iconX;
var iconY = config.iconY;
function saveIconPos(x, y) {
    iconX = x; iconY = y;
    config.iconX = x; config.iconY = y;
    saveConfig(config);
}

    // ==================== 全局样式 ====================
    GM_addStyle("\
#shiri-icon-btn{position:fixed;cursor:grab;user-select:none;z-index:2147483646;width:36px;height:36px;\
border-radius:50%;background:#22c55e;color:#fff;border:none;cursor:pointer;font-size:16px;\
font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.18);\
transition:background .15s;line-height:1;font-family:'Microsoft YaHei','PingFang SC',sans-serif}\
#shiri-icon-btn:hover{background:#16a34a}#shiri-icon-btn.dragging{cursor:grabbing;background:#16a34a}\
#shiri-popup{position:fixed;z-index:2147483647;background:#fff;border:1px solid #e5e7eb;\
border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.15);padding:10px 14px;min-width:140px;\
max-width:320px;font-size:14px;color:#1f2937;line-height:1.5;display:none;\
font-family:'Microsoft YaHei','PingFang SC',sans-serif;box-sizing:border-box}\
#shiri-popup .sp-word{font-size:16px;font-weight:600;color:#111827;margin:0 0 6px 0;\
padding-right:18px;word-break:break-all}\
#shiri-popup .sp-close{position:absolute;top:4px;right:6px;width:22px;height:22px;\
border:none;background:none;cursor:pointer;font-size:18px;color:#9ca3af;line-height:1;\
padding:0;display:flex;align-items:center;justify-content:center}\
#shiri-popup .sp-close:hover{color:#374151}\
#shiri-popup .sp-divider{height:1px;background:#e5e7eb;margin:6px 0}\
#shiri-popup .sp-trans{font-size:14px;color:#374151;margin:0 0 8px 0;word-break:break-all}\
#shiri-popup .sp-trans.loading{color:#9ca3af;font-style:italic}\
#shiri-popup .sp-trans.error{color:#ef4444}\
#shiri-popup .sp-save{display:block;width:100%;padding:6px 0;background:#22c55e;color:#fff;\
border:none;border-radius:5px;cursor:pointer;font-size:13px;font-weight:600;text-align:center;\
transition:background .15s}\
#shiri-popup .sp-save:hover{background:#16a34a}\
#shiri-popup .sp-save.saved{background:#86efac;cursor:default}\
#shiri-panel-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.25);\
display:none;align-items:center;justify-content:center;\
font-family:'Microsoft YaHei','PingFang SC',sans-serif}\
#shiri-panel-overlay.show{display:flex}\
#shiri-panel{background:#fff;border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.18);\
width:400px;max-width:94vw;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;\
font-size:14px;color:#1f2937;box-sizing:border-box}\
#shiri-panel *{box-sizing:border-box}\
#shiri-panel .sh-header{padding:12px 16px;border-bottom:1px solid #e5e7eb;display:flex;\
align-items:center;justify-content:space-between;gap:8px}\
#shiri-panel .sh-header-left{display:flex;align-items:center;gap:6px;min-width:0}\
#shiri-panel .sh-title{font-size:16px;font-weight:700;color:#111827;white-space:nowrap}\
#shiri-panel .sh-count{font-size:12px;color:#9ca3af;font-weight:400;white-space:nowrap}\
#shiri-panel .sh-header-actions{display:flex;align-items:center;gap:4px;flex-shrink:0}\
#shiri-panel .sh-icon-btn{width:28px;height:28px;border:none;background:none;cursor:pointer;\
font-size:18px;color:#9ca3af;border-radius:50%;display:flex;align-items:center;\
justify-content:center;transition:background .15s,color .15s;padding:0;line-height:1}\
#shiri-panel .sh-icon-btn:hover{background:#f3f4f6;color:#374151}\
#shiri-panel .sh-icon-btn.active{color:#22c55e}\
#shiri-panel .sh-view{padding:8px 16px;overflow-y:auto;flex:1;min-height:0}\
#shiri-panel .sh-list{list-style:none;margin:0;padding:0}\
#shiri-panel .sh-list li{padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:15px;\
color:#1f2937;word-break:break-all}\
#shiri-panel .sh-list li{display:flex;align-items:center;justify-content:space-between;gap:8px}#shiri-panel .sh-list li:last-child{border-bottom:none}#shiri-panel .sh-list .sh-del-btn{flex-shrink:0;width:22px;height:22px;border:none;background:none;cursor:pointer;font-size:16px;color:#d1d5db;border-radius:50%;display:flex;align-items:center;justify-content:center;padding:0;line-height:1;transition:color .15s,background .15s}#shiri-panel .sh-list .sh-del-btn:hover{color:#ef4444;background:#fef2f2}\
#shiri-panel .sh-empty{padding:32px 16px;text-align:center;color:#9ca3af;font-size:14px}\
#shiri-panel .sh-actions{padding:12px 16px;border-top:1px solid #e5e7eb;display:flex;gap:8px;\
flex-shrink:0}\
#shiri-panel .sh-btn{flex:1;padding:8px 0;border:none;border-radius:6px;cursor:pointer;\
font-size:13px;font-weight:600;color:#fff;transition:background .15s,opacity .15s}\
#shiri-panel .sh-btn:disabled{opacity:.5;cursor:not-allowed}\
#shiri-panel .sh-btn-export{background:#ef4444}\
#shiri-panel .sh-btn-export:hover:not(:disabled){background:#dc2626}\
#shiri-panel .sh-btn-sync{background:#3b82f6}\
#shiri-panel .sh-btn-sync:hover:not(:disabled){background:#2563eb}\
#shiri-panel .sh-btn-save{background:#22c55e}\
#shiri-panel .sh-btn-save:hover:not(:disabled){background:#16a34a}\
.sh-setting-group{margin-bottom:14px}\
.sh-setting-group:last-child{margin-bottom:0}\
.sh-setting-label{display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:4px}\
.sh-setting-desc{font-size:11px;color:#9ca3af;margin-bottom:6px;line-height:1.4}\
.sh-radio-group{display:flex;flex-direction:column;gap:4px}\
.sh-radio-row{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;\
cursor:pointer;transition:background .12s;font-size:13px;color:#374151}\
.sh-radio-row:hover{background:#f9fafb}\
.sh-radio-row input[type=radio]{accent-color:#22c55e;margin:0}\
.sh-setting-input{width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;\
font-size:13px;color:#1f2937;outline:none;box-sizing:border-box;transition:border-color .15s}\
.sh-setting-input:focus{border-color:#22c55e;box-shadow:0 0 0 2px rgba(34,197,94,.15)}\
.sh-setting-input::placeholder{color:#9ca3af}\
");

    // ==================== DOM: 浮动翻译弹窗 ====================
    var popup = document.createElement("div");
    popup.id = "shiri-popup";
    popup.innerHTML = '\
        <button class="sp-close" title="关闭">&times;</button>\
        <div class="sp-word"></div>\
        <div class="sp-divider"></div>\
        <div class="sp-trans loading">翻译中...</div>\
        <div class="sp-divider"></div>\
        <button class="sp-save">收藏</button>';
    document.body.appendChild(popup);
    var elPw = popup.querySelector(".sp-word");
    var elPt = popup.querySelector(".sp-trans");
    var elPs = popup.querySelector(".sp-save");
    var elPc = popup.querySelector(".sp-close");
    var currentWord = "";
    var abortCtrl = null;

    // ==================== DOM: 右上角图标 ====================
    var iconBtn = document.createElement("button");
    iconBtn.id = "shiri-icon-btn";
    iconBtn.textContent = "识";
    iconBtn.title = "识日生词本";
    document.body.appendChild(iconBtn);
if (iconX < 0 || iconY < 0) {
    iconX = window.innerWidth - 48;
    iconY = 12;
}
iconBtn.style.left = iconX + "px";
iconBtn.style.top = iconY + "px";

    // ==================== DOM: 单词列表面板 ====================
    var overlay = document.createElement("div");
    overlay.id = "shiri-panel-overlay";
    overlay.innerHTML = '\
        <div id="shiri-panel">\
            <div class="sh-header">\
                <div class="sh-header-left">\
                    <span class="sh-title">识日生词本</span>\
                    <span class="sh-count"></span>\
                </div>\
                <div class="sh-header-actions">\
                    <button class="sh-icon-btn sh-settings-btn" title="设置">&#9881;</button>\
                    <button class="sh-icon-btn sh-close-btn" title="关闭">&times;</button>\
                </div>\
            </div>\
            <div class="sh-view sh-view-list">\
                <ul class="sh-list"></ul>\
                <div class="sh-empty">暂无收藏单词</div>\
            </div>\
            <div class="sh-view sh-view-settings" style="display:none">\
                <div class="sh-setting-group">\
                    <span class="sh-setting-label">翻译API</span>\
                    <div class="sh-radio-group" id="sh-radio-api">\
                        <label class="sh-radio-row"><input type="radio" name="apiType" value="mymemory"> MyMemory（免费，无需密钥）</label>\
                        <label class="sh-radio-row"><input type="radio" name="apiType" value="deepseek"> DeepSeek AI 翻译</label>\
                        <label class="sh-radio-row"><input type="radio" name="apiType" value="custom"> 自定义API</label>\
                    </div>\
                </div>\
                <div class="sh-setting-group sh-deepseek-group" style="display:none">\
                    <span class="sh-setting-label">DeepSeek API Key</span>\
                    <span class="sh-setting-desc">在 <a href="https://platform.deepseek.com/api_keys" target="_blank">platform.deepseek.com</a> 创建</span>\
                    <input class="sh-setting-input" id="sh-input-deepseek-key" type="password" placeholder="sk-...">\
                </div>\
                <div class="sh-setting-group sh-custom-group" style="display:none">\
                    <span class="sh-setting-label">自定义API地址</span>\
                    <span class="sh-setting-desc">GET请求，用 {text} 作为查询文本占位符</span>\
                    <input class="sh-setting-input" id="sh-input-custom-url" type="text" placeholder="https://api.example.com/translate?q={text}">\
                </div>\
                <div class="sh-setting-group">\
                    <span class="sh-setting-label">WiFi同步地址</span>\
                    <span class="sh-setting-desc">识日App WiFi导入的upload接口地址</span>\
                    <input class="sh-setting-input" id="sh-input-sync-url" type="text" placeholder="http://192.168.2.191:8080/upload">\
                </div>\
                <div class="sh-setting-group">\
                    <label class="sh-radio-row" style="padding:0">\
                        <input type="checkbox" id="sh-input-clear-sync"> 同步成功后清空本地单词\
                    </label>\
                </div>\
                <div class="sh-actions" style="border-top:none;padding:0">\
                    <button class="sh-btn sh-btn-save" id="sh-btn-save-config">保存设置</button>\
                    <button class="sh-btn" style="background:#6b7280;flex:.6" id="sh-btn-cancel-config">返回</button>\
                </div>\
            </div>\
            <div class="sh-view sh-view-actions">\
                <div class="sh-actions">\
                    <button class="sh-btn sh-btn-export">导出TXT</button>\
                    <button class="sh-btn sh-btn-sync">一键同步到识日</button>\
                </div>\
            </div>\
        </div>';
    document.body.appendChild(overlay);

    var panelEl = overlay.querySelector("#shiri-panel");
    var viewList = panelEl.querySelector(".sh-view-list");
    var viewSet = panelEl.querySelector(".sh-view-settings");
    var viewActs = panelEl.querySelector(".sh-view-actions");
    var panelList = viewList.querySelector(".sh-list");
    var panelEmpty = viewList.querySelector(".sh-empty");
    var panelCount = panelEl.querySelector(".sh-count");
    var btnSettings = panelEl.querySelector(".sh-settings-btn");
    var btnClose = panelEl.querySelector(".sh-close-btn");
    var btnExport = viewActs.querySelector(".sh-btn-export");
    var btnSync = viewActs.querySelector(".sh-btn-sync");
    var btnSaveCfg = viewSet.querySelector("#sh-btn-save-config");
    var btnCancelCfg = viewSet.querySelector("#sh-btn-cancel-config");
    var inputDkKey = viewSet.querySelector("#sh-input-deepseek-key");
    var inputCusUrl = viewSet.querySelector("#sh-input-custom-url");
    var inputSyncUrl = viewSet.querySelector("#sh-input-sync-url");
    var radioGroup = viewSet.querySelector("#sh-radio-api");
    var grpDk = viewSet.querySelector(".sh-deepseek-group");
    var inputClearSync = viewSet.querySelector("#sh-input-clear-sync");
    var grpCus = viewSet.querySelector(".sh-custom-group");

    // ==================== 数据操作 ====================
    function getWords() {
        try { return JSON.parse(GM_getValue(STORAGE_KEY, "[]")); } catch (_) { return []; }
    }
    function saveWord(word) {
        var words = getWords();
        if (words.includes(word)) return false;
        words.unshift(word);
        GM_setValue(STORAGE_KEY, JSON.stringify(words));
        return true;
    }
    function hasWord(word) { return getWords().includes(word); }

    // ==================== 日语检测 ====================
    function hasJapanese(text) {
        return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
    }

    // ==================== 翻译: MyMemory ====================
    function translateMyMemory(text, cb) {
        var url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=ja|zh-CN";
        GM_xmlhttpRequest({
            method: "GET", url: url, timeout: 8000,
            onload: function(r) {
                try {
                    var d = JSON.parse(r.responseText);
                    if (d.responseStatus === 200 && d.responseData) cb(d.responseData.translatedText, null);
                    else cb(null, "翻译失败");
                } catch (_) { cb(null, "翻译失败"); }
            },
            onerror: function() { cb(null, "翻译失败，请检查网络"); },
            ontimeout: function() { cb(null, "翻译超时"); }
        });
    }

    // ==================== 翻译: DeepSeek AI ====================
    function translateDeepSeek(text, cb) {
        var key = config.deepseekKey;
        if (!key) { cb(null, "请先在设置中配置 DeepSeek API Key"); return; }
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://api.deepseek.com/v1/chat/completions",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + key
            },
            data: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "你是一个日语翻译助手。将用户输入的日语翻译成中文，只输出中文翻译结果，不要任何解释、注释或额外内容。" },
                    { role: "user", content: text }
                ],
                temperature: 0.1,
                max_tokens: 512
            }),
            timeout: 15000,
            onload: function(r) {
                try {
                    var d = JSON.parse(r.responseText);
                    if (d.choices && d.choices[0] && d.choices[0].message) {
                        cb(d.choices[0].message.content.trim(), null);
                    } else if (d.error) {
                        cb(null, "DeepSeek: " + (d.error.message || "未知错误"));
                    } else {
                        cb(null, "翻译失败");
                    }
                } catch (_) { cb(null, "翻译失败"); }
            },
            onerror: function() { cb(null, "翻译失败，请检查网络"); },
            ontimeout: function() { cb(null, "翻译超时"); }
        });
    }

    // ==================== 翻译: 自定义API ====================
    function translateCustom(text, cb) {
        var tpl = config.customApiUrl;
        if (!tpl) { cb(null, "请先在设置中配置自定义API地址"); return; }
        var url = tpl.replace("{text}", encodeURIComponent(text));
        GM_xmlhttpRequest({
            method: "GET", url: url, timeout: 10000,
            onload: function(r) {
                try {
                    var d = JSON.parse(r.responseText);
                    if (d.responseData && d.responseData.translatedText) {
                        cb(d.responseData.translatedText, null);
                    } else if (typeof d.translatedText === "string") {
                        cb(d.translatedText, null);
                    } else if (typeof d === "string") {
                        cb(d, null);
                    } else {
                        cb(null, "翻译失败：无法解析API响应");
                    }
                } catch (_) { cb(null, "翻译失败"); }
            },
            onerror: function() { cb(null, "翻译失败，请检查网络"); },
            ontimeout: function() { cb(null, "翻译超时"); }
        });
    }

    // ==================== 统一翻译入口 ====================
    function translate(text, cb) {
        switch (config.apiType) {
            case "deepseek": translateDeepSeek(text, cb); break;
            case "custom": translateCustom(text, cb); break;
            default: translateMyMemory(text, cb); break;
        }
    }

    // ==================== 弹窗控制 ====================
    function showPopup(text, x, y) {
        currentWord = text.trim();
        elPw.textContent = currentWord;
        elPt.textContent = "翻译中...";
        elPt.className = "sp-trans loading";

        if (hasWord(currentWord)) {
            elPs.textContent = "已收藏";
            elPs.className = "sp-save saved";
            elPs.disabled = true;
        } else {
            elPs.textContent = "收藏";
            elPs.className = "sp-save";
            elPs.disabled = false;
        }

        // 先显示才能测量尺寸
        popup.style.display = "block";
        popup.style.visibility = "hidden";
        var pw = popup.offsetWidth;
        var ph = popup.offsetHeight;
        popup.style.visibility = "visible";

        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var left = x + 8;
        var top = y - ph - 6;

        if (left + pw > vw - 8) left = vw - pw - 8;
        if (left < 8) left = 8;
        if (top < 8) top = y + 16;
        if (top + ph > vh - 8) top = vh - ph - 8;

        popup.style.left = left + "px";
        popup.style.top = top + "px";

        if (abortCtrl) abortCtrl.abort();
        abortCtrl = new AbortController();

        translate(currentWord, function(result, err) {
            abortCtrl = null;
            if (err) {
                elPt.textContent = err;
                elPt.className = "sp-trans error";
            } else {
                elPt.textContent = result;
                elPt.className = "sp-trans";
            }
        });
    }

    function hidePopup() {
        popup.style.display = "none";
        if (abortCtrl) { abortCtrl.abort(); abortCtrl = null; }
    }

    // ==================== 面板控制 ====================
    function showListView() {
        viewList.style.display = "block";
        viewActs.style.display = "block";
        viewSet.style.display = "none";
        btnSettings.classList.remove("active");
    }

    function showSettingsView() {
        viewList.style.display = "none";
        viewActs.style.display = "none";
        viewSet.style.display = "block";
        btnSettings.classList.add("active");
        populateSettingsForm();
    }

    function populateSettingsForm() {
        var radios = radioGroup.querySelectorAll("input[name=apiType]");
        radios.forEach(function(r) { r.checked = (r.value === config.apiType); });
        inputDkKey.value = config.deepseekKey;
        inputCusUrl.value = config.customApiUrl;
        inputSyncUrl.value = config.syncUrl;
        inputClearSync.checked = config.clearAfterSync;
        updateSettingsVisibility();
    }

    function updateSettingsVisibility() {
        var sel = radioGroup.querySelector("input[name=apiType]:checked");
        var val = sel ? sel.value : "mymemory";
        grpDk.style.display = (val === "deepseek") ? "block" : "none";
        grpCus.style.display = (val === "custom") ? "block" : "none";
    }

    radioGroup.addEventListener("change", updateSettingsVisibility);

    btnSaveCfg.addEventListener("click", function() {
        var sel = radioGroup.querySelector("input[name=apiType]:checked");
        config.apiType = sel ? sel.value : "mymemory";
        config.deepseekKey = inputDkKey.value.trim();
        config.customApiUrl = inputCusUrl.value.trim();
        config.syncUrl = inputSyncUrl.value.trim() || DEFAULT_CONFIG.syncUrl;
        config.clearAfterSync = inputClearSync.checked;
        saveConfig(config);
        showListView();
    });

    btnCancelCfg.addEventListener("click", function() {
        config = loadConfig();
        showListView();
    });

    function renderPanel() {
        var words = getWords();
        panelCount.textContent = words.length ? "(" + words.length + "个单词)" : "";
        panelList.innerHTML = "";
        if (words.length === 0) {
            panelList.style.display = "none";
            panelEmpty.style.display = "block";
            btnExport.disabled = true;
            btnSync.disabled = true;
        } else {
            panelList.style.display = "block";
            panelEmpty.style.display = "none";
            btnExport.disabled = false;
            btnSync.disabled = false;
            words.forEach(function(w) {
                var li = document.createElement("li");
                var span = document.createElement("span");
                span.textContent = w;
                span.style.wordBreak = "break-all";
                span.style.flex = "1";
                var delBtn = document.createElement("button");
                delBtn.className = "sh-del-btn";
                delBtn.innerHTML = "&times;";
                delBtn.title = "删除";
                delBtn.addEventListener("click", function(ev) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    var all = getWords();
                    var idx = all.indexOf(w);
                    if (idx !== -1) { all.splice(idx, 1); GM_setValue(STORAGE_KEY, JSON.stringify(all)); }
                    renderPanel();
                    return false;
                });
                li.appendChild(span);
                li.appendChild(delBtn);
                panelList.appendChild(li);
            });
        }
    }

    function openPanel() {
        showListView();
        renderPanel();
        overlay.classList.add("show");
    }

    function closePanel() {
        overlay.classList.remove("show");
        showListView();
    }

    // ==================== 导出TXT ====================
    function exportTxt() {
        var words = getWords();
        if (!words.length) return;
        var blob = new Blob([words.join("\r\n")], { type: "text/plain;charset=UTF-8" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "识日生词本.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    // ==================== 同步到识日 ====================
    function syncToShiri() {
        var words = getWords();
        if (!words.length) return;
        btnSync.disabled = true;
        btnSync.textContent = "同步中...";
        var content = words.join("\n");
        var boundary = "----ShiriFormBoundary" + Math.random().toString(36).slice(2);
        var body = "--" + boundary + "\r\n" +
            "Content-Disposition: form-data; name=\"file\"; filename=\"words.txt\"\r\n" +
            "Content-Type: text/plain; charset=UTF-8\r\n\r\n" +
            content + "\r\n" +
            "--" + boundary + "--\r\n";
        GM_xmlhttpRequest({
            method: "POST",
            url: config.syncUrl,
            headers: { "Content-Type": "multipart/form-data; boundary=" + boundary },
            data: body,
            timeout: 15000,
            onload: function(r) {
                btnSync.disabled = false;
                btnSync.textContent = "一键同步到识日";
                if (r.status === 200) {
                    if (config.clearAfterSync) { GM_setValue(STORAGE_KEY, "[]"); if (overlay.classList.contains("show")) renderPanel(); }
                    alert("同步成功！");
                } else {
                    alert("同步失败，请检查手机是否已开启识日WiFi导入");
                }
            },
            onerror: function() {
                btnSync.disabled = false;
                btnSync.textContent = "一键同步到识日";
                alert("同步失败，请检查手机是否已开启识日WiFi导入");
            },
            ontimeout: function() {
                btnSync.disabled = false;
                btnSync.textContent = "一键同步到识日";
                alert("同步超时，请检查手机是否已开启识日WiFi导入");
            }
        });
    }

    // ==================== 划词检测 ====================
    document.addEventListener("mouseup", function(e) {
        if (popup.contains(e.target) || overlay.contains(e.target) || iconBtn.contains(e.target)) return;

        setTimeout(function() {
            var sel = window.getSelection();
            if (!sel || sel.isCollapsed) { hidePopup(); return; }
            var text = sel.toString().trim();
            if (!text || text.length > 200 || !hasJapanese(text)) { hidePopup(); return; }

            var range = sel.getRangeAt(0);
            var rect = range.getBoundingClientRect();
            if (!rect || rect.width === 0) { hidePopup(); return; }

            showPopup(text, rect.right, rect.top);
        }, 80);
    });

    // ==================== 事件绑定 ====================
    elPs.addEventListener("click", function() {
        if (elPs.disabled || !currentWord) return;
        if (saveWord(currentWord)) {
            elPs.textContent = "已收藏";
        } else {
            elPs.textContent = "已存在";
        }
        elPs.className = "sp-save saved";
        elPs.disabled = true;
    });

    elPc.addEventListener("click", hidePopup);

    document.addEventListener("mousedown", function(e) {
        if (popup.style.display === "block" && !popup.contains(e.target)) hidePopup();
    });

    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            if (overlay.classList.contains("show")) closePanel();
            else if (popup.style.display === "block") hidePopup();
        }
    });

    // 图标拖动
var isDragging = false;
var dragStartX = 0;
var dragStartY = 0;
var dragOrigX = 0;
var dragOrigY = 0;
var dragMoved = false;

iconBtn.addEventListener("mousedown", function(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    isDragging = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragOrigX = iconX;
    dragOrigY = iconY;
    iconBtn.classList.add("dragging");
});

document.addEventListener("mousemove", function(e) {
    if (!isDragging) return;
    var dx = e.clientX - dragStartX;
    var dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
    var nx = dragOrigX + dx;
    var ny = dragOrigY + dy;
    nx = Math.max(0, Math.min(nx, window.innerWidth - 36));
    ny = Math.max(0, Math.min(ny, window.innerHeight - 36));
    iconBtn.style.left = nx + "px";
    iconBtn.style.top = ny + "px";
});

document.addEventListener("mouseup", function(e) {
    if (!isDragging) return;
    isDragging = false;
    iconBtn.classList.remove("dragging");
    var nx = parseInt(iconBtn.style.left);
    var ny = parseInt(iconBtn.style.top);
    saveIconPos(nx, ny);
    if (!dragMoved) {
        overlay.classList.contains("show") ? closePanel() : openPanel();
    }
});

    btnClose.addEventListener("click", closePanel);

    btnSettings.addEventListener("click", function(e) {
        e.stopPropagation();
        viewSet.style.display === "block" ? showListView() : showSettingsView();
    });

    overlay.addEventListener("click", function(e) {
        if (e.target === overlay) closePanel();
    });

    btnExport.addEventListener("click", exportTxt);
    btnSync.addEventListener("click", syncToShiri);

})();