// 仅电脑端恢复思源内弹窗的关闭按钮
(() => {
    if (!/^\/stage\/build\/(app|desktop)(\/|$)/.test(location.pathname)) return;

    // 重复执行时，清理上一份代码片段。
    window.__desktopDialogCloseCleanup?.();

    const className = "user-desktop-dialog-close";
    const style = document.createElement("style");
    style.textContent = `
        .b3-dialog__container.${className} > .b3-dialog__close {
            display: block !important;
        }
        .b3-dialog__container.${className} > .b3-dialog__header:not(.fn__none) {
            padding-right: 46px;
        }
        /* 无标题弹窗放在右侧外缘，避免挡住设置、搜索等内容。 */
        .b3-dialog__container.${className}:has(> .b3-dialog__header.fn__none) > .b3-dialog__close {
            top: 0;
            right: -40px;
            border-radius: 50%;
            background-color: var(--b3-theme-surface);
        }
    `;
    document.head.appendChild(style);

    function restoreCloseButtons(root) {
        root.querySelectorAll(".b3-dialog__container").forEach(container => {
            const closeButton = container.querySelector(":scope > .b3-dialog__close.fn__none");
            if (!closeButton) return;

            const dialog = window.siyuan?.dialogs?.find(item => item.element?.contains(container));
            // 保留导入、处理任务等弹窗禁止关闭的限制。
            if (!dialog || dialog.disableClose) return;

            // 只显示原生按钮，沿用思源的点击事件和销毁回调。
            container.classList.add(className);
        });
    }

    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node instanceof Element) restoreCloseButtons(node);
            }
        }
    });
    observer.observe(document.body, { childList: true });
    restoreCloseButtons(document.body);

    window.__desktopDialogCloseCleanup = () => {
        observer.disconnect();
        style.remove();
        document.querySelectorAll("." + className).forEach(container => {
            container.classList.remove(className);
        });
        delete window.__desktopDialogCloseCleanup;
    };
})();
