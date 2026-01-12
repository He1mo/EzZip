/**
 * 1. 配置与状态管理 (State & Config)
 */
const i18n = {
    zh: {
        title: 'EzZip',
        subtitle: '轻松简单的压缩',
        dropTitle: '把图片拖到这里',
        dropSub: '支持批量拖入，单张图片自动下载',
        autoConvert: '自动开始压缩处理',
        pathPlaceholder: '点击右侧按钮选择文件夹，或直接在此处粘贴/拖入图片',
        pasteHint: '支持 Ctrl+V 粘贴剪贴板图片',
        scanBtn: '扫描文件夹',
        scanning: '正在扫描...',
        selectFolders: '选择目标文件夹',
        selectAll: '全选 / 取消',
        deselectAll: '取消全选',
        sortByName: '名称',
        sortByTime: '修改日期',
        downloadZipTitle: '打包下载',
        saveImage: '保存图片',
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
        dropTitle: 'Drop your images here!',
        dropSub: 'Up to 20 images, max 5 MB each.',
        autoConvert: 'Convert my images automatically',
        pathPlaceholder: 'Click button to select folder, or paste/drop images here',
        pasteHint: 'Support Ctrl+V to paste images from clipboard',
        scanBtn: 'Scan Folder',
        scanning: 'Scanning...',
        selectFolders: 'Select Target Folders',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        sortByName: 'Name',
        sortByTime: 'Modified',
        downloadZipTitle: 'Download ZIP',
        saveImage: 'Save Image',
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
        autoConvertCheckbox: document.getElementById('autoConvertCheckbox'),
        folderTree: document.getElementById('folderTree'),
        folderList: document.getElementById('folderList'),
        selectAllCheckbox: document.getElementById('selectAllCheckbox'),
        compressBtn: document.getElementById('compressBtn'),
        dropZone: document.getElementById('dropZone'),
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
        if (UI.selectedPathDisplay) UI.selectedPathDisplay.textContent = path || handle.name;
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
            
            // 改进进度显示：确保 100% 时任务真的结束了
            const progress = ((i + 0.9) / total) * 100; 
            UI.progressStats.textContent = `${i + 1} / ${total} (${Math.round(progress)}%)`;
            UI.progressBarFill.style.width = `${progress}%`;

            try {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true
                };
                
                let compressedFile = await imageCompression(file, options);
                
                // 修复反向压缩逻辑：如果压缩后变大，则使用原文件
                let finalFile = compressedFile;
                let isOptimized = true;
                if (compressedFile.size >= file.size) {
                    finalFile = file;
                    isOptimized = false;
                }
                
                AppState.results.push({
                    name: item.name,
                    originalSize: file.size,
                    compressedSize: finalFile.size,
                    status: 'success',
                    blob: finalFile
                });

                if (jszip) {
                    jszip.file(item.path, finalFile);
                }

                const ratio = ((1 - finalFile.size / file.size) * 100).toFixed(0);
                const logMsg = isOptimized 
                    ? `${i18n[AppState.lang].tableSuccess}: ${item.name} (${formatSize(file.size)} -> ${formatSize(finalFile.size)}, -${ratio}%)`
                    : `${i18n[AppState.lang].tableSuccess}: ${item.name} (${i18n[AppState.lang].optimized})`;
                addLog(logMsg, 'success');
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

    if (jszip && !AppState.isCancelled && total > 1) {
        UI.statusText.textContent = AppState.lang === 'zh' ? '正在打包 ZIP...' : 'Generating ZIP...';
        // ZIP 生成期间进度条保持在 99%
        UI.progressBarFill.style.width = '99%';
        AppState.zipResult = await jszip.generateAsync({ type: 'blob' });
    }

    // 只有在所有工作（包括 ZIP）完成后才设置 100%
    UI.progressBarFill.style.width = '100%';
    UI.progressStats.textContent = `${total} / ${total} (100%)`;

    finishCompression();
}

    function finishCompression() {
        AppState.isProcessing = false;
        switchPhase('phase-result');
        
        const successResults = AppState.results.filter(r => r.status === 'success');
        const successCount = successResults.length;
        UI.resultSummary.textContent = i18n[AppState.lang].processedCount.replace('{count}', successCount);
        
        renderResultTable();
        
        if (successCount > 0) {
            UI.downloadZipBtn.classList.remove('hidden-element');
            
            if (successCount === 1) {
                // 单个文件直接下载图片
                const result = successResults[0];
                UI.downloadZipBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 8px;"><path d="M12 2L12 15M12 15L8 11M12 15L16 11M5 20L19 20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    ${i18n[AppState.lang].saveImage}
                `;
                
                const downloadFn = () => {
                    const url = URL.createObjectURL(result.blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = result.name;
                    a.click();
                    URL.revokeObjectURL(url);
                };
                
                UI.downloadZipBtn.onclick = downloadFn;
                
                // 自动触发下载
                downloadFn();
            } else if (AppState.zipResult) {
                // 多个文件下载 ZIP
                UI.downloadZipBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 8px;"><path d="M12 2L12 15M12 15L8 11M12 15L16 11M5 20L19 20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    ${i18n[AppState.lang].downloadZipTitle}
                `;
                UI.downloadZipBtn.onclick = () => {
                    const url = URL.createObjectURL(AppState.zipResult);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `EzZip_${new Date().getTime()}.zip`;
                    a.click();
                    URL.revokeObjectURL(url);
                };
            }
        } else {
            UI.downloadZipBtn.classList.add('hidden-element');
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

    UI.compressBtn.onclick = startCompression;

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

    // 粘贴图片处理
    window.addEventListener('paste', async (e) => {
        const items = e.clipboardData.items;
        const imageFiles = [];
        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    // 为粘贴的文件生成一个名称
                    const extension = file.type.split('/')[1] || 'png';
                    const fileName = `pasted-image-${new Date().getTime()}.${extension}`;
                    imageFiles.push({
                        handle: { getFile: async () => file },
                        name: fileName,
                        path: fileName
                    });
                }
            }
        }
        if (imageFiles.length > 0) {
            processImmediateFiles(imageFiles);
        }
    });

    // 拖拽图片处理
    UI.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        UI.dropZone.classList.add('drag-over');
    });

    UI.dropZone.addEventListener('dragleave', (e) => {
        // 只有当离开容器本身而不是子元素时才移除类
        if (e.relatedTarget === null || !UI.dropZone.contains(e.relatedTarget)) {
            UI.dropZone.classList.remove('drag-over');
        }
    });

    UI.dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        UI.dropZone.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files
            .filter(file => file.type.startsWith('image/'))
            .map(file => ({
                handle: { getFile: async () => file },
                name: file.name,
                path: file.name
            }));

        if (imageFiles.length > 0) {
            processImmediateFiles(imageFiles);
        }
    });

    /**
     * 立即处理传入的文件列表（用于粘贴和拖放）
     */
    async function processImmediateFiles(imageFiles) {
        AppState.selectedItems = imageFiles;
        if (UI.autoConvertCheckbox.checked) {
            await startCompression();
        } else {
            // 如果没开启自动压缩，则展示列表供确认（这里暂时简单处理，直接展示开始按钮）
            UI.folderTree.classList.remove('hidden-element');
            if (UI.selectedPathDisplay) UI.selectedPathDisplay.textContent = AppState.lang === 'zh' ? '已就绪，点击下方按钮开始' : 'Ready, click button below';
            renderFolderList();
        }
    }

    // 初始化
    if (AppState.theme === 'light') document.body.parentElement.classList.add('light-mode');
    updateI18n();
});
