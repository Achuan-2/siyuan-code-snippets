// [js] 展开二层菜单 20250619
(() => {

    const CFG = {
        // ---------------------------配置项---------------------------------------//
        // 1: 是, 0: 否
        // 转换为
        turnInto: {
            enable: 1, // 是否将右键菜单的 转换为 的下层菜单 挪到第一级菜单
            dis_src: 0, // 是否显示右键菜单原有的 转换为
        },
        // 带子标题转换
        tWithSubtitle: {
            enable: 1, // 是否将右键菜单的 带子标题转换 的下层菜单 挪到第一级菜单
            dis_src: 0, // 是否显示右键菜单原有的 带子标题转换
        }
    }

    // ---------------------------业务代码---------------------------------------//
    // 生成唯一ID用于日志标识
    // const SESSION_ID = 'js_' + Date.now();
    const SESSION_ID = '展开菜单';
    function mlog(...args) {
        return;
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');       // 获取小时并补零
        const minutes = String(now.getMinutes()).padStart(2, '0');   // 获取分钟并补零
        const seconds = String(now.getSeconds()).padStart(2, '0');   // 获取秒数并补零
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0'); // 获取毫秒并补零
        const timeString = `${hours}:${minutes}:${seconds}.${milliseconds}`; // 形成 hh:mm:ss.SSS 格式
        console.log(`[${SESSION_ID}] [${timeString}]:`, ...args);
    }
    // 延迟执行
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // 功能: 监听直到元素存在
    // 找到 selector 时，执行 func_cb，监听超时时间默认为 4s
    // selector: string | #id | function
    function whenExist(selector, func_cb, time_out = 4000) {
        console.log("whenExist begin", selector);

        return new Promise((resolve) => {
            const startTime = Date.now(); // 记录开始时间

            const checkForElement = () => {
                let element = null;

                // 根据selector类型进行查找
                if (typeof selector === 'string') {
                    if (selector.startsWith('#')) {
                        element = document.getElementById(selector.slice(1));
                    } else {
                        element = document.querySelector(selector);
                    }
                } else if (typeof selector === 'function') {
                    element = selector();
                } else {
                    // 若 selector 不合法，直接退出
                    console.error("Invalid selector type");
                    resolve(false);
                    return;
                }

                if (element) {
                    // 元素存在时，执行回调并解析Promise
                    if (func_cb) func_cb(element);
                    resolve(true);
                } else if (Date.now() - startTime >= time_out) {
                    // 超时处理
                    console.log(selector, "whenExist timeout");
                    resolve(false);
                } else {
                    // 元素不存在且未超时，继续检查
                    requestAnimationFrame(checkForElement);
                }
            };

            // 开始检查元素是否存在
            checkForElement();
        });
    }
    // js插入css
    function js_insert_css(css) {
        // 创建一个新的 <style> 元素
        const style = document.createElement('style');
        style.type = 'text/css';

        // 添加 CSS 规则
        style.innerHTML = css;

        // 将 <style> 元素插入到 <body> 中
        document.body.appendChild(style);
        return style;
        // 删除
        // style.remove();
    }
    function handle_css_style() {
        js_insert_css(`
      .HZ-new-turnInto,
      .HZ-new-tWithSubtitle
      {
        display: flex;
        height: 30px;
        &>button.b3-menu__item
        {
          justify-content: center;
          &>svg {
            margin-right: 0;
          }
        }
      }
      `)
        if (!CFG.turnInto.dis_src) {
            js_insert_css(`
        [data-id="turnInto"] {
          display: none;
        }
        `)
        }
        if (!CFG.tWithSubtitle.dis_src) {
            js_insert_css(`
        [data-id="tWithSubtitle"] {
          display: none;
        }
        `)
        }
    }
    function copy_separator(turn_to_ele) {
        if (!turn_to_ele) return null;
        const old_separator = turn_to_ele.parentElement.querySelector('.b3-menu__separator')
        if (!old_separator) return null;
        // 1. 复制元素
        const new_separator = old_separator.cloneNode(true);

        // // 2. 获取当前 data-id 的值
        // const currentId = old_separator.getAttribute('data-id');

        // // 3. 使用正则表达式提取当前的数字部分并加 1
        // const newId = currentId.replace(/_(\d+)$/, (match, num) => `_${parseInt(num) + 1}`);

        // 4. 设置新的 data-id
        new_separator.setAttribute('data-id', 'HZ_new_separator');
        return new_separator;
    }

    function handle_turnInto(menu_ele) {
        if (!menu_ele) return;
        if (!CFG.turnInto.enable) return;
        const turn_to_ele = menu_ele.querySelector('button[data-id="turnInto"]');
        if (!turn_to_ele) return;
        mlog('开始处理 转换为')
        // 1. 在指定元素前插入一个新的 div
        const newDiv = document.createElement('div');
        newDiv.className = 'HZ-new-turnInto'; // 可为新 div 添加类名以便样式
        turn_to_ele.parentNode.insertBefore(newDiv, turn_to_ele);
        // 插入一个分割线
        const new_separator = copy_separator(turn_to_ele);
        if (new_separator) turn_to_ele.parentNode.insertBefore(new_separator, turn_to_ele);

        // 2. 获取所有选项 (button 元素)
        const buttons = turn_to_ele.querySelectorAll('.b3-menu__item');

        buttons.forEach(button => {
            // 创建一个新的 button 元素
            const newButton = document.createElement('button');
            newButton.className = 'b3-menu__item ariaLabel';

            // 复制按钮内的图标
            const icon = button.querySelector('.b3-menu__icon').cloneNode(true);
            newButton.appendChild(icon);

            // 获取并复制选项的文本内容，并设置到 aria-label 中
            const descElement = button.querySelector('.b3-menu__label');
            const keyElement = button.querySelector('.b3-menu__accelerator');
            let aria_text = descElement.textContent
            if (keyElement) {
                aria_text += `  ${keyElement.textContent}`;
            }
            newButton.setAttribute('aria-label', aria_text);
            // 单击事件监听
            newButton.addEventListener('click', () => button.click());

            // 将新的 button 添加到新 div 中
            newDiv.appendChild(newButton);
        });
    }
    // 带子标题转换
    function handle_tWithSubtitle(menu_ele) {
        if (!menu_ele) return;
        if (!CFG.tWithSubtitle.enable) return;
        const sub_turn_ele = menu_ele.querySelector('button[data-id="tWithSubtitle"]');
        if (!sub_turn_ele) return;
        mlog('开始处理 带子标题转换为')
        // 1. 在指定元素前插入一个新的 div
        const newDiv = document.createElement('div');
        newDiv.className = 'HZ-new-tWithSubtitle'; // 可为新 div 添加类名以便样式
        sub_turn_ele.parentNode.insertBefore(newDiv, sub_turn_ele);

        // 2. 遍历6级标记, 依次替换
        for (let i = 1; i <= 6; i++) {
            const button = sub_turn_ele.querySelector(`[data-id="heading${i}"]`);
            if (!button) continue;
            // 创建一个新的 button 元素
            const newButton = document.createElement('button');
            newButton.className = 'b3-menu__item ariaLabel';

            // 复制按钮内的图标
            newButton.innerHTML = `<svg class="b3-menu__icon" style=""><use xlink:href="#iconH${i}"></use></svg>`

            // 获取并复制选项的文本内容，并设置到 aria-label 中
            const descElement = button.querySelector('.b3-menu__label');
            const keyElement = button.querySelector('.b3-menu__accelerator');
            let aria_text = descElement.textContent
            if (keyElement) {
                aria_text += `  ${keyElement.textContent}`;
            }
            newButton.setAttribute('aria-label', aria_text);
            // 单击事件监听
            newButton.addEventListener('click', () => button.click());

            // 将新的 button 添加到新 div 中
            newDiv.appendChild(newButton);
        }
    }

    function handle_common_menu(menu_ele) {
        if (!menu_ele) return;
        handle_turnInto(menu_ele);
        handle_tWithSubtitle(menu_ele);
    }

    function main() {
        whenExist('#commonMenu', menu_ele => {
            // 创建一个 MutationObserver 的实例并定义回调函数
            const observer = new MutationObserver((mutationsList) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        mlog('元素的style属性发生了变化:', menu_ele.style.cssText);
                        handle_common_menu(menu_ele);
                        break;
                    }
                }
            });

            // 观察元素的attributes属性变化
            // 如果需要停止观察，调用 observer.disconnect()
            observer.observe(menu_ele, {
                attributes: true // 只观察属性变化
            });
            handle_css_style();
        })
    }
    main()
})()

