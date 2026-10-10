// 思源「设置 → 外观 → 代码片段 → JS」中启用。
// 任务列表项右键直接显示原生状态选项，普通列表项保留原菜单。
(() => {
    const cleanupKey = "__taskStatusContextMenuCleanup";
    window[cleanupKey]?.();

    const statusIds = [
        "taskStatusTodo",
        "taskStatusInProgress",
        "taskStatusDone",
        "taskStatusCanceled",
        "customTaskStatus",
    ];
    let forwarding = false;

    function onContextMenu(event) {
        if (forwarding || event.shiftKey || !(event.target instanceof Element)) return;

        // 只取最近的列表项，避免普通嵌套列表误操作外层任务。
        const item = event.target.closest('[data-type="NodeListItem"]');
        if (item?.getAttribute("data-subtype") !== "t") return;
        if (!item.closest(".protyle-wysiwyg")) return;

        const action = item.querySelector(":scope > .protyle-action--task");
        const menu = window.siyuan?.menus?.menu;
        if (!action || !menu?.element) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        // 从任务复选框触发原生菜单，确保操作目标是列表项而非内部段落。
        forwarding = true;
        try {
            action.dispatchEvent(new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                button: 2,
                buttons: 2,
                clientX: event.clientX,
                clientY: event.clientY,
                view: window,
            }));
        } finally {
            forwarding = false;
        }

        // 移动真实节点，保留原生事件、状态写入、自定义状态对话框和撤销逻辑。
        const root = menu.element.querySelector(":scope > .b3-menu__items");
        const listMenu = root?.querySelector('[data-id="listBlock"]');
        const statuses = statusIds.map(id =>
            listMenu?.querySelector(`[data-id="${id}"]`));
        if (!root || statuses.some(node => !node)) return;

        root.replaceChildren(...statuses);
        // 菜单缩短后重新计算位置，避免靠近窗口边缘时仍沿用完整菜单的位置。
        menu.resetPosition();
    }

    document.addEventListener("contextmenu", onContextMenu, true);
    window[cleanupKey] = () => {
        document.removeEventListener("contextmenu", onContextMenu, true);
        delete window[cleanupKey];
    };
})();
