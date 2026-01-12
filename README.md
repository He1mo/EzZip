# EzZip

基于浏览器原生 API 构建的高性能、纯客户端图片压缩工具。

## 🛠️ 技术实现

- **核心架构**: 100% Client-side Rendering (CSR)，无后端依赖，适配 GitHub Pages 静态部署。
- **文件系统**: 集成 **File System Access API** (`window.showDirectoryPicker`)，实现 Web 端对本地文件系统的直接递归读写。
- **图像处理**: 基于 `browser-image-compression`，利用 `Canvas API` 与 `Web Workers` 异步执行有损压缩，规避 UI 线程阻塞。
- **数据封装**: 集成 `JSZip` 实现多线程处理后的内存 Blob 流实时打包。
- **视觉层**: 采用 CSS3 `backdrop-filter` 实现 iOS Glassmorphism 样式，支持动态 Theme Engine 与 i18n 状态机切换。

## 📦 核心特性

- **Zero-Latency**: 本地 I/O 操作，无需网络上传，处理速度受限于本地硬件算力。
- **Privacy-First**: 物理级隐私安全，原始数据与处理流均驻留在浏览器内存。
- **Batch Processing**: 支持文件夹深度遍历与批量任务调度。

## 🚀 快速开始

### 本地环境
项目依赖安全上下文（Secure Context）：
```bash
# 使用任何静态服务器启动，例如：
npx serve .
```

### 部署
直接将根目录推送到 GitHub Pages，选择 `Deploy from a branch` -> `/(root)`。

## 🏗️ 开发堆栈
- **Language**: Vanilla JavaScript (ES6+)
- **Libraries**: [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression), [JSZip](https://stuk.github.io/jszip/)
- **Styling**: CSS Variables, Flexbox/Grid
