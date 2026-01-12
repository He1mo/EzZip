/**
 * 1. 配置与状态管理 (State & Config)
 */
const i18n = {
    zh: {
        title: 'EzZip',
        subtitle: '轻松简单的压缩',
        pathPlaceholder: '点击右侧按钮选择包含图片的文件夹',
        scanBtn: '选择文件夹',
        scanning: '正在扫描...',
        selectFolders: '选择目标文件夹',
        selectAll: '全选 / 取消',
        deselectAll: '取消全选',
        sortByName: '名称',
        sortByTime: '修改日期',
        downloadZipTitle: '打包下载',
        downloadZipDesc: '压缩完成后将所有图片打包为 ZIP 下载',
        startBtn: '开始批量压缩',
        initializing: '准备处理...',
        optimizing: '正在优化图片...',
        processingComplete: '处理完成',
        pause: '暂停任务',
        resume: '继续任务',
        taskPaused: '任务已暂停',
        cancel: '取消任务',
        close: '关闭进度',
        logHeader: '处理日志',
        successTitle: '压缩任务已完成',
        processedCount: '成功处理了 {count} 个文件',
        tableFile: '文件名',
        tableOriginal: '原大小',
        tableOptimized: '压缩后',
        tableStatus: '状态',
        tableSuccess: '成功',
        tableError: '失败',
        checkLog: '更多结果请查看上方日志',
        initLog: '正在初始化 {count} 个文件的优化任务...',
        cancelConfirm: '确定要取消当前任务吗？',
        networkError: '处理错误',
        optimized: '已优化',
        failed: '失败',
        cancelled: '任务已手动取消',
        unsupportedBrowser: '您的浏览器不支持文件系统访问 API，请使用最新版的 Chrome、Edge 或 Opera。'
    },
    en: {
        title: 'EzZip',
        subtitle: 'Easy and simple compression',
        pathPlaceholder: 'Click button to select a folder with images',
        scanBtn: 'Select Folder',
        scanning: 'Scanning...',
        selectFolders: 'Select Target Folders',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        sortByName: 'Name',
        sortByTime: 'Modified',
        downloadZipTitle: 'Download ZIP',
        downloadZipDesc: 'Pack all optimized images into a ZIP file',
        startBtn: 'Start Compression',
        initializing: 'Initializing...',
        optimizing: 'Optimizing Images...',
        processingComplete: 'Processing Complete',
        pause: 'Pause',
        resume: 'Resume',
        taskPaused: 'Task Paused',
        cancel: 'Cancel',
        close: 'Close',
        logHeader: 'Activity Log',
        successTitle: 'Optimization Successful',
        processedCount: 'Processed {count} files successfully',
        tableFile: 'File',
        tableOriginal: 'Original',
        tableOptimized: 'Optimized',
        tableStatus: 'Result',
        tableSuccess: 'Success',
        tableError: 'Error',
        checkLog: 'Check activity log for full details',
        initLog: 'Initializing optimization for {count} files...',
        cancelConfirm: 'Cancel current task?',
        networkError: 'Processing error',
        optimized: 'Optimized',
        failed: 'Failed',
        cancelled: 'Task cancelled by user',
        unsupportedBrowser: 'Your browser does not support File System Access API. Please use the latest Chrome, Edge or Opera.'
    }
};

const AppState = {
    lang: localStorage.getItem('lang') || 'zh',
    theme: localStorage.getItem('theme') || 'dark',
    rootHandle: null,
    currentHandle: null,
    currentItems: [], // { name, type, handle, size, mtime, path }
    selectedItems: [], // items to be processed
    results: [],
    isProcessing: false,
    isCancelled: false,
    zipResult: null,
    sortConfig: { key: 'name', direction: 'asc' }
};

document.addEventListener('DOMContentLoaded', () => {
    /**
     * 2. DOM 元素缓存
     */
    const UI = {
        selectDirBtn: document.getElementById('selectDirBtn'),
        selectedPathDisplay: document.getElementById('selectedPathDisplay'),
        zipCheckbox: document.getElementById('zipCheckbox'),
        folderTree: document.getElementById('folderTree'),
        folderList: document.getElementById('folderList'),
        selectAllCheckbox: document.getElementById('selectAllCheckbox'),
        compressBtn: document.getElementById('compressBtn'),
        phaseScan: document.getElementById('phase-scan'),
        phaseWork: document.getElementById('phase-work'),
        phaseResult: document.getElementById('phase-result'),
        progressBarFill: document.getElementById('progressBarFill'),
        progressStats: document.getElementById('progressStats'),
        logContainer: document.getElementById('logContainer'),
        breadcrumbNav: document.getElementById('breadcrumbNav'),
        statusText: document.getElementById('statusText'),
        cancelBtn: document.getElementById('cancelBtn'),
        selectionStats: document.getElementById('selectionStats'),
        resultTableContainer: document.getElementById('resultTableContainer'),
        resultSummary: document.getElementById('resultSummary'),
        themeToggle: document.getElementById('themeToggle'),
        sortName: document.getElementById('sortName'),
        sortTime: document.getElementById('sortTime'),
        backBtn: document.getElementById('backBtn'),
        downloadZipBtn: document.getElementById('downloadZipBtn')
    };

    /**
     * 3. 工具函数
     */
    function formatSize(bytes) {
        if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        if (i < 0) return '0 B';
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function isImage(filename) {
        return /\.(jpe?g|png|webp|avif)$/i.test(filename);
    }

    /**
     * 4. UI 更新逻辑
     */
    function updateI18n() {
        const data = i18n[AppState.lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (data[key]) el.textContent = data[key];
        });
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === AppState.lang);
        });
    }

    function switchPhase(phaseId) {
        [UI.phaseScan, UI.phaseWork, UI.phaseResult].forEach(p => p.classList.remove('phase-active'));
        document.getElementById(phaseId).classList.add('phase-active');
    }

    function addLog(message, type = 'info') {
        const div = document.createElement('div');
        div.className = 'log-entry';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        div.innerHTML = `<span class="log-time">${time}</span> <span class="log-msg-${type}">${message}</span>`;
        UI.logContainer.appendChild(div);
        UI.logContainer.scrollTop = UI.logContainer.scrollHeight;
    }

    /**
     * 5. 文件系统逻辑
     */
    async function scanDirectory(handle, path = '') {
        const items = [];
        for await (const entry of handle.values()) {
            const entryPath = path ? `${path}/${entry.name}` : entry.name;
            if (entry.kind === 'file') {
                if (isImage(entry.name)) {
                    const file = await entry.getFile();
                    items.push({
                        name: entry.name,
                        type: 'file',
                        handle: entry,
                        size: file.size,
                        mtime: file.lastModified,
                        path: entryPath
                    });
                }
            } else if (entry.kind === 'directory') {
                items.push({
                    name: entry.name,
                    type: 'folder',
                    handle: entry,
                    path: entryPath,
                    size: 0,
                    mtime: null
                });
            }
        }
        return items;
    }

    async function updateFolderView(handle, path = '') {
        AppState.currentHandle = handle;
        UI.selectedPathDisplay.textContent = path || handle.name;
        UI.folderTree.classList.remove('hidden-element');
        
        addLog(AppState.lang === 'zh' ? `正在扫描: ${handle.name}` : `Scanning: ${handle.name}`);
        AppState.currentItems = await scanDirectory(handle, path);
        renderFolderList();
        renderBreadcrumbs(path);
    }

    function renderFolderList() {
        UI.folderList.innerHTML = '';
        const items = [...AppState.currentItems];

        // 排序
        if (AppState.sortConfig.key) {
            items.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                let valA = a[AppState.sortConfig.key];
                let valB = b[AppState.sortConfig.key];
                if (typeof valA === 'string') {
                    return AppState.sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
                return AppState.sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            });
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'folder-item';
            const isSelected = AppState.selectedItems.some(i => i.path === item.path);
            if (isSelected) div.classList.add('selected');

            div.innerHTML = `
                <div class="col-check">
                    <label class="checkbox-wrapper">
                        <input type="checkbox" ${isSelected ? 'checked' : ''}>
                        <span class="checkmark"></span>
                    </label>
                </div>
                <div class="col-main">
                    <span class="item-icon">${item.type === 'folder' ? '📂' : '🖼️'}</span>
                    <span class="folder-name">${item.name}</span>
                </div>
                <div class="col-size">${item.type === 'file' ? formatSize(item.size) : '-'}</div>
                <div class="col-date">${item.mtime ? new Date(item.mtime).toLocaleString() : '-'}</div>
            `;

            div.onclick = async (e) => {
                if (e.target.tagName === 'INPUT' || e.target.closest('.checkbox-wrapper')) {
                    toggleItemSelection(item);
                    return;
                }
                if (item.type === 'folder') {
                    await updateFolderView(item.handle, item.path);
                } else {
                    toggleItemSelection(item);
                }
            };

            UI.folderList.appendChild(div);
        });

        updateSelectionStats();
        updateSortIcons();
    }

    function toggleItemSelection(item) {
        if (item.type === 'folder') return;
        const index = AppState.selectedItems.findIndex(i => i.path === item.path);
        if (index > -1) {
            AppState.selectedItems.splice(index, 1);
        } else {
            AppState.selectedItems.push(item);
        }
        renderFolderList();
    }

    function updateSelectionStats() {
        const count = AppState.selectedItems.length;
        UI.selectionStats.textContent = AppState.lang === 'zh' ? `已选择 ${count} 项` : `Selected ${count} items`;
        UI.selectionStats.classList.toggle('hidden-element', count === 0);
        UI.compressBtn.disabled = count === 0;
    }

    function renderBreadcrumbs(path) {
        UI.breadcrumbNav.innerHTML = '';
        const parts = path ? path.split('/') : [];
        
        const rootItem = document.createElement('div');
        rootItem.className = 'breadcrumb-item';
        rootItem.textContent = AppState.rootHandle.name;
        rootItem.onclick = () => updateFolderView(AppState.rootHandle, '');
        UI.breadcrumbNav.appendChild(rootItem);

        let currentPath = '';
        parts.forEach((part, index) => {
            const sep = document.createElement('span');
            sep.className = 'breadcrumb-separator';
            sep.textContent = '›';
            UI.breadcrumbNav.appendChild(sep);

            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const item = document.createElement('div');
            item.className = 'breadcrumb-item';
            if (index === parts.length - 1) item.classList.add('active');
            item.textContent = part;
            
            const targetPath = currentPath;
            item.onclick = async () => {
                if (index < parts.length - 1) {
                    // 找到对应的 handle
                    let handle = AppState.rootHandle;
                    for (const p of targetPath.split('/')) {
                        handle = await handle.getDirectoryHandle(p);
                    }
                    updateFolderView(handle, targetPath);
                }
            };
            UI.breadcrumbNav.appendChild(item);
        });
    }

    function updateSortIcons() {
        [UI.sortName, UI.sortTime].forEach(el => {
            const icon = el.querySelector('.sort-icon');
            const key = el.id === 'sortName' ? 'name' : 'mtime';
            icon.className = 'sort-icon';
            if (AppState.sortConfig.key === key) {
                icon.classList.add(AppState.sortConfig.direction === 'asc' ? 'asc' : 'desc');
            }
        });
    }

    /**
     * 6. 压缩核心逻辑
     */
    async function startCompression() {
        AppState.isProcessing = true;
        AppState.isCancelled = false;
        AppState.results = [];
        AppState.zipResult = null;
        
        switchPhase('phase-work');
        addLog(i18n[AppState.lang].initLog.replace('{count}', AppState.selectedItems.length));

        const total = AppState.selectedItems.length;
        const jszip = UI.zipCheckbox.checked ? new JSZip() : null;

        for (let i = 0; i < total; i++) {
            if (AppState.isCancelled) break;

            const item = AppState.selectedItems[i];
            const file = await item.handle.getFile();
            
            UI.statusText.textContent = `${i18n[AppState.lang].optimizing} (${item.name})`;
            UI.progressStats.textContent = `${i + 1} / ${total} (${Math.round(((i + 1) / total) * 100)}%)`;
            UI.progressBarFill.style.width = `${((i + 1) / total) * 100}%`;

            try {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true
                };
                
                const compressedFile = await imageCompression(file, options);
                
                AppState.results.push({
                    name: item.name,
                    originalSize: file.size,
                    compressedSize: compressedFile.size,
                    status: 'success',
                    blob: compressedFile
                });

                if (jszip) {
                    jszip.file(item.path, compressedFile);
                }

                addLog(`${i18n[AppState.lang].tableSuccess}: ${item.name} (${formatSize(file.size)} -> ${formatSize(compressedFile.size)})`, 'success');
            } catch (err) {
                console.error(err);
                AppState.results.push({
                    name: item.name,
                    originalSize: file.size,
                    compressedSize: 0,
                    status: 'error'
                });
                addLog(`${i18n[AppState.lang].tableError}: ${item.name}`, 'error');
            }
        }

        if (jszip && !AppState.isCancelled) {
            UI.statusText.textContent = AppState.lang === 'zh' ? '正在生成 ZIP...' : 'Generating ZIP...';
            AppState.zipResult = await jszip.generateAsync({ type: 'blob' });
        }

        finishCompression();
    }

    function finishCompression() {
        AppState.isProcessing = false;
        switchPhase('phase-result');
        
        const successCount = AppState.results.filter(r => r.status === 'success').length;
        UI.resultSummary.textContent = i18n[AppState.lang].processedCount.replace('{count}', successCount);
        
        renderResultTable();
        
        if (AppState.zipResult) {
            UI.downloadZipBtn.classList.remove('hidden-element');
            UI.downloadZipBtn.onclick = () => {
                const url = URL.createObjectURL(AppState.zipResult);
                const a = document.createElement('a');
                a.href = url;
                a.download = `EzZip_${new Date().getTime()}.zip`;
                a.click();
                URL.revokeObjectURL(url);
            };
        }
    }

    function renderResultTable() {
        let html = `
            <table class="result-table">
                <thead>
                    <tr>
                        <th>${i18n[AppState.lang].tableFile}</th>
                        <th>${i18n[AppState.lang].tableOriginal}</th>
                        <th>${i18n[AppState.lang].tableOptimized}</th>
                        <th>${i18n[AppState.lang].tableStatus}</th>
                    </tr>
                </thead>
                <tbody>
        `;

        AppState.results.forEach(res => {
            const ratio = res.compressedSize ? Math.round((1 - res.compressedSize / res.originalSize) * 100) : 0;
            html += `
                <tr>
                    <td>${res.name}</td>
                    <td>${formatSize(res.originalSize)}</td>
                    <td>${res.status === 'success' ? `${formatSize(res.compressedSize)} (-${ratio}%)` : '-'}</td>
                    <td class="status-${res.status}">${i18n[AppState.lang][res.status === 'success' ? 'tableSuccess' : 'tableError']}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        UI.resultTableContainer.innerHTML = html;
    }

    /**
     * 7. 事件监听
     */
    UI.selectDirBtn.onclick = async () => {
        if (!window.showDirectoryPicker) {
            alert(i18n[AppState.lang].unsupportedBrowser);
            return;
        }
        try {
            AppState.rootHandle = await window.showDirectoryPicker();
            AppState.selectedItems = [];
            await updateFolderView(AppState.rootHandle, '');
        } catch (err) {
            console.error(err);
        }
    };

    UI.compressBtn.onclick = () => {
        if (AppState.selectedItems.length > 0) {
            startCompression();
        }
    };

    UI.cancelBtn.onclick = () => {
        if (confirm(i18n[AppState.lang].cancelConfirm)) {
            AppState.isCancelled = true;
            addLog(i18n[AppState.lang].cancelled, 'error');
        }
    };

    UI.selectAllCheckbox.onchange = (e) => {
        const checked = e.target.checked;
        if (checked) {
            AppState.currentItems.forEach(item => {
                if (item.type === 'file' && !AppState.selectedItems.some(i => i.path === item.path)) {
                    AppState.selectedItems.push(item);
                }
            });
        } else {
            AppState.currentItems.forEach(item => {
                const index = AppState.selectedItems.findIndex(i => i.path === item.path);
                if (index > -1) AppState.selectedItems.splice(index, 1);
            });
        }
        renderFolderList();
    };

    UI.themeToggle.onclick = () => {
        AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
        document.body.parentElement.classList.toggle('light-mode', AppState.theme === 'light');
        localStorage.setItem('theme', AppState.theme);
    };

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.onclick = () => {
            AppState.lang = btn.getAttribute('data-lang');
            localStorage.setItem('lang', AppState.lang);
            updateI18n();
            if (AppState.currentHandle) renderFolderList();
        };
    });

    UI.sortName.onclick = () => {
        if (AppState.sortConfig.key === 'name') {
            AppState.sortConfig.direction = AppState.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            AppState.sortConfig.key = 'name';
            AppState.sortConfig.direction = 'asc';
        }
        renderFolderList();
    };

    UI.sortTime.onclick = () => {
        if (AppState.sortConfig.key === 'mtime') {
            AppState.sortConfig.direction = AppState.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            AppState.sortConfig.key = 'mtime';
            AppState.sortConfig.direction = 'asc';
        }
        renderFolderList();
    };

    // 初始化
    if (AppState.theme === 'light') document.body.parentElement.classList.add('light-mode');
    updateI18n();
});
