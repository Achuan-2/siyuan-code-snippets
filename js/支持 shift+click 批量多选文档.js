(() => {
    let lastClickedItem = null;

    function handleFileClick(event) {
        if (!event.shiftKey) {
            // 普通点击，记录最后点击的项目
            lastClickedItem = event.target.closest('li[data-type="navigation-file"]');
            return;
        }

        const currentItem = event.target.closest('li[data-type="navigation-file"]');
        if (!currentItem || !lastClickedItem) return;

        // 获取所有文档项
        const allFiles = Array.from(document.querySelectorAll('li[data-type="navigation-file"]'));

        // 获取起始和结束索引
        const startIndex = allFiles.indexOf(lastClickedItem);
        const endIndex = allFiles.indexOf(currentItem);

        if (startIndex === -1 || endIndex === -1) return;

        // 确定选择范围
        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);

        // 清除现有选择
        allFiles.forEach(file => {
            file.classList.remove('b3-list-item--focus');
        });

        // 添加新选择
        for (let i = start; i <= end; i++) {
            allFiles[i].classList.add('b3-list-item--focus');
        }

        // 阻止默认行为
        event.preventDefault();
        event.stopPropagation();
    }

    function initShiftSelect() {
        // 移除可能存在的旧事件监听器
        document.removeEventListener('click', handleFileClick, true);

        // 添加新的事件监听器
        document.addEventListener('click', handleFileClick, true);
    }

    // 初始化
    initShiftSelect();

    // 导出初始化函数，以便需要时重新初始化
    window.initShiftSelect = initShiftSelect;
})();
