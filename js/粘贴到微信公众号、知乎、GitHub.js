// Author: Achuan-2
// link: https://github.com/Achuan-2/siyuan-code-snippets/blob/main/js/%E7%B2%98%E8%B4%B4%E5%88%B0%E5%BE%AE%E4%BF%A1%E5%85%AC%E4%BC%97%E5%8F%B7%E3%80%81%E7%9F%A5%E4%B9%8E%E3%80%81GitHub.js
// - v3.9/20250918
//   - 新增识别数据库关联列功能：获取当前文档数据库中的关联列内容，如果关联列不为空，在文档末尾自动添加h2标题"相关笔记"
// - v3.7/20250830
//   - 微信公众号多级列表如果列表项同时存在段落块和子列表会有问题，暂时参考复制到知乎的处理，把列表改为普通段落
//   - 思源笔记块链接转换优先级选项（可以选择优先使用微信公众号链接或知乎链接），保存在 localStorage 中
// - v3.6/20250807
//   - 优化获取当前文档ID和图床选择逻辑
//   - 导出markdown默认导出img标签，替换图床兼容 markdown 图片语法和 HTML img 标签
// - v3.5/20250806
//   - 优化微信公众号列表段落块与子列表混排的错乱问题
// - v3.4/20250728
//   - 优化复制markdown，支持获取聚焦块内容
// - v3.3/20250724
//   - 修复微信公众号代码块粘贴没有高亮的问题，直接对DOM进行处理
// - v3.2/20250723
//   - 标题编号改进：如果全文只有一个h1标题，则不对h1标题进行编号，只对h2及更低标题进行编号
//   - 修复知乎和Markdown按钮处理函数中缺少点击桌面按钮的问题

// - v3.1/20250714
//   - 粘贴到微信公众号新版编辑器的代码块优化：需要替换`\n`和空格为`<br>`和`&nbsps;`
//   - 去除代码块的零宽字符，避免影响用户使用
//   - 图片替换不替换代码块里的markdown图片格式，避免影响代码块内容
// - v2.0/20250630 
//   - 支持选择图床，选择默认/picgo图床，默认是默认图床，即使用思源笔记图床，使用默认图床，对于微信和知乎，不需要处理，对于Github添加 DEFAULT_IMAGE_PREFIX
//   - 改进获取微信文章链接方法，如果该笔记没有微信文章链接，但是有其他平台链接，则用其他平台链接
//   - 将Github/语雀相关的按钮和处理函数重命名为Markdown
// - v1.0/20250629 
//   - 完善知乎多级列表，对普通多级列表（没有图片和代码块）也处理为普通文本
//   - 添加标题编号功能，导出到微信公众号、知乎、Markdown都支持添加标题编号


(() => {

    // 常量定义
    const CONSTANTS = {
        // 笔记引用转微信链接的数据库ID
        DATABASE_AV_ID: "20230804021554-h0l44hz",
        WEIXIN_KEY_ID: "20250310104930-o0812vp",
        // 关联列ID
        RELATION_KEY_ID: "20250826084857-8jwhs3e",
        // 分割线转图片
        SEPARATOR_IMAGE_URL: "https://i0.hdslb.com/bfs/article/4aa545dccf7de8d4a93c2b2b8e3265ac0a26d216.png",
        // 默认思源笔记图床前缀（当没有picgo图床映射时使用，需要开思源笔记会员）
        DEFAULT_IMAGE_PREFIX: "https://assets.b3logfile.com/siyuan/1610205759005/",
        // 图床类型
        IMAGE_HOST_TYPE: {
            DEFAULT: "default",
            PICGO: "picgo"
        },
        // 是否添加微信公众号名片
        ADD_WECHAT_CARD: false,
        // 块链接优先级：'wechat' 或 'zhihu'，可由 UI 控件修改并持久化到 localStorage
        LINK_PRIORITY: localStorage.getItem('siyuan_link_priority') || 'wechat',
        // 微信公众号卡片（获取方法：在微信公众号的草稿页面手动插入公众号卡片后，开发者工具查看源码，修改下面的参数）
        WECHAT_PROFILE: {
            nickname: "Achuan同学",
            alias: "achuan-2-0713",
            headimg: "http://mmbiz.qpic.cn/mmbiz_png/Xh9XDwqibetTAnPRk6Z89m8u4nibAvLwuIm7icHFHtOklSNqoibTaurdMzWJojPoJzcbcJcySOJaEziavibfibOfY7DiaQ/0?wx_fmt=png",
            signature: "研究生在读，记录自己的学习笔记和日常感悟",
            id: "MzU3ODg2NTc3MA==",
            introduction: "这里是Achuan同学，分享自己的学习笔记和生活随笔，欢迎点赞评论转发我的文章"
        },
        // 知乎自定义多级列表符号
        LIST_SYMBOLS: {
            UNORDERED: ['✦', '○', '✧', '⟐', '⬧', '⬦'],
            ROMAN_NUMERALS: [
                { value: 1000, symbol: 'm' },
                { value: 900, symbol: 'cm' },
                { value: 500, symbol: 'd' },
                { value: 400, symbol: 'cd' },
                { value: 100, symbol: 'c' },
                { value: 90, symbol: 'xc' },
                { value: 50, symbol: 'l' },
                { value: 40, symbol: 'xl' },
                { value: 10, symbol: 'x' },
                { value: 9, symbol: 'ix' },
                { value: 5, symbol: 'v' },
                { value: 4, symbol: 'iv' },
                { value: 1, symbol: 'i' }
            ]
        },
        // 标题编号配置
        HEADING_NUMBER: {
            ENABLED: true,
            START_LEVEL: 1, // 从H1开始编号
            END_LEVEL: 6,   // 到H6结束编号
            SEPARATOR: '.'  // 编号分隔符
        }

    };

    // 工具函数类
    class Utils {
        /**
         * 转义正则表达式特殊字符
         */
        static escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        /**
         * 执行POST请求
         */
        static async fetchSyncPost(url, data, returnType = 'json') {
            const init = {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            };

            try {
                const res = await fetch(url, init);
                return returnType === 'json' ? await res.json() : await res.text();
            } catch (error) {
                console.error(`请求失败 ${url}:`, error);
                return returnType === 'json'
                    ? { code: error.code || 1, msg: error.message || "", data: null }
                    : "";
            }
        }

        /**
         * 复制到剪贴板
         */
        static async copyToClipboard(text) {
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    Object.assign(textArea.style, {
                        position: 'fixed',
                        left: '-999999px',
                        top: '-999999px'
                    });
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    document.execCommand('copy');
                    textArea.remove();
                }
            } catch (error) {
                console.error('复制到剪贴板失败:', error);
                throw new Error('复制到剪贴板失败');
            }
        }

        /**
         * 显示通知消息
         */
        static async showNotification(message, timeout = 5000) {
            return Utils.fetchSyncPost('/api/notification/pushMsg', { msg: message, timeout });
        }

        /**
         * 获取当前文档ID
         */
        static getCurrentDocumentId() {
            const activeDocElement = document.querySelector('.layout__wnd--active .protyle:not(.fn__none) .protyle-content .protyle-background[data-node-id]');
            return activeDocElement?.getAttribute('data-node-id') || null;
        }
        static getProtyle() {
            // Author: wilsons
            try {
                if (document.getElementById("sidebar")) return window.siyuan.mobile.editor.protyle;
                const currDoc = window.siyuan?.layout?.centerLayout?.children.map(item => item.children.find(item => item.headElement?.classList.contains('item--focus') && (item.panelElement.closest('.layout__wnd--active')))).find(item => item);
                return currDoc?.model.editor.protyle;
            } catch (e) {
                console.error(e);
                return null;
            }

        }


        /**
         * 获取文档属性
         */
        static async getDocumentAttribute(docId, attributeName) {
            const data = { id: docId };
            const res = await Utils.fetchSyncPost('/api/attr/getBlockAttrs', data);
            return res?.data?.[attributeName] || null;
        }
    }

    // 数字转换工具类
    class NumberConverter {
        /**
         * 数字转字母（A-Z 或 a-z）
         */
        static numberToLetter(number, uppercase = true) {
            let result = '';
            let num = number - 1;

            do {
                result = String.fromCharCode((uppercase ? 65 : 97) + (num % 26)) + result;
                num = Math.floor(num / 26) - 1;
            } while (num >= 0);

            return result;
        }

        /**
         * 数字转罗马数字
         */
        static numberToRoman(number) {
            let result = '';
            for (const numeral of CONSTANTS.LIST_SYMBOLS.ROMAN_NUMERALS) {
                while (number >= numeral.value) {
                    result += numeral.symbol;
                    number -= numeral.value;
                }
            }
            return result;
        }
    }

    // 图片处理类
    class ImageProcessor {
        /**
         * 替换DOM中的图片URL
         */
        static async replaceImageUrlsInDOM(fileMap) {
            try {
                const typographyAreas = document.querySelectorAll('.b3-typography');

                typographyAreas.forEach(area => {
                    const images = area.querySelectorAll('img');
                    images.forEach(img => {
                        const currentSrc = img.getAttribute('src');
                        if (!currentSrc) return;

                        const fileInfo = Object.values(fileMap).find(info =>
                            info.originUrl && info.url && currentSrc === info.originUrl
                        );

                        if (fileInfo) {
                            img.setAttribute('src', fileInfo.url);
                            console.log('替换图片URL:', fileInfo.originUrl, '->', fileInfo.url);
                        }
                    });
                });
            } catch (error) {
                console.error('替换DOM中图片URL时出错:', error);
            }
        }

        /**
         * 替换markdown中的图片URL
         */
        static async replaceImageUrls(content, picgoFileMapKey) {
            try {
                const fileMap = JSON.parse(picgoFileMapKey);
                const lines = content.split('\n');
                let inCodeBlock = false;
                let codeBlockFence = '';

                const processedLines = lines.map(line => {
                    // 检测代码块边界
                    const codeBlockMatch = line.match(/^(\s*)(‍```|~~~)(.*)$/);
                    if (codeBlockMatch) {
                        const [, indent, fence, language] = codeBlockMatch;
                        if (!inCodeBlock) {
                            // 开始代码块
                            inCodeBlock = true;
                            codeBlockFence = fence;
                        } else if (fence === codeBlockFence && indent.length === 0) {
                            // 结束代码块（需要相同的围栏符号且在行首）
                            inCodeBlock = false;
                            codeBlockFence = '';
                        }
                        return line;
                    }

                    // 如果在代码块内，直接返回原行
                    if (inCodeBlock) {
                        return line;
                    }

                    // 检测行内代码块（单行）
                    const inlineCodeCount = (line.match(/`/g) || []).length;
                    const hasInlineCode = inlineCodeCount >= 2 && inlineCodeCount % 2 === 0;

                    // 如果有行内代码，跳过图片替换
                    if (hasInlineCode) {
                        return line;
                    }

                    // 处理图片URL替换
                    let processedLine = line;
                    Object.values(fileMap).forEach(fileInfo => {
                        if (fileInfo.originUrl && fileInfo.url) {
                            const originUrl = fileInfo.originUrl;
                            const newUrl = fileInfo.url;

                            processedLine = processedLine.replace(
                                new RegExp(Utils.escapeRegExp(originUrl), 'g'),
                                newUrl
                            );

                            const imageRegex = new RegExp(
                                `!\
$$([^\$$
]*)\\]\$${Utils.escapeRegExp(originUrl)}\$`,
                                'g'
                            );
                            processedLine = processedLine.replace(imageRegex, `![$1](${newUrl})`);
                        }
                    });

                    return processedLine;
                });

                return processedLines.join('\n');
            } catch (error) {
                console.error('替换图片URL时出错:', error);
                return content;
            }
        }

        /**
         * 为导出内容中的相对路径图片添加默认前缀
         * 兼容：
         * - markdown 图片语法：![](...)
         * - HTML img 标签：<img src="..."> 或 data-src="..."
         */
        static addDefaultPrefixToImages(content) {
            try {
                const lines = content.split('\n');
                let inCodeBlock = false;
                let codeBlockFence = '';

                const processedLines = lines.map(line => {
                    // 检测代码块边界
                    const codeBlockMatch = line.match(/^(\s*)(```|~~~)(.*)$/);
                    if (codeBlockMatch) {
                        const [, indent, fence] = codeBlockMatch;
                        if (!inCodeBlock) {
                            // 开始代码块
                            inCodeBlock = true;
                            codeBlockFence = fence;
                        } else if (fence === codeBlockFence && indent.length === 0) {
                            // 结束代码块（需要相同的围栏符号且在行首）
                            inCodeBlock = false;
                            codeBlockFence = '';
                        }
                        return line;
                    }

                    // 如果在代码块内，直接返回原行
                    if (inCodeBlock) {
                        return line;
                    }

                    // 检测行内代码块（单行）
                    const inlineCodeCount = (line.match(/`/g) || []).length;
                    const hasInlineCode = inlineCodeCount >= 2 && inlineCodeCount % 2 === 0;

                    // 如果有行内代码，跳过图片替换
                    if (hasInlineCode) {
                        return line;
                    }

                    let processedLine = line;

                    // 1) 处理 markdown 图片语法中的相对路径（不以http/https开头）
                    const mdImgRelativeRegex = /!\[([^\]]*)\]\(((?!https?:\/\/)[^)]+)\)/g;
                    processedLine = processedLine.replace(mdImgRelativeRegex, (match, altText, imagePath) => {
                        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
                        const fullUrl = CONSTANTS.DEFAULT_IMAGE_PREFIX + cleanPath;
                        return `![${altText}](${fullUrl})`;
                    });

                    // 2) 处理 HTML img 标签中的相对路径 src 或 data-src
                    // 匹配 src="..." 或 src='...' 且不是 http(s)
                    const imgAttrRelativeDouble = /\s(src|data-src)\s*=\s*"((?!https?:\/\/)[^"]+)"/g;
                    const imgAttrRelativeSingle = /\s(src|data-src)\s*=\s*'((?!https?:\/\/)[^']+)'/g;

                    processedLine = processedLine.replace(imgAttrRelativeDouble, (m, attr, val) => {
                        const cleanPath = val.startsWith('/') ? val.slice(1) : val;
                        const fullUrl = CONSTANTS.DEFAULT_IMAGE_PREFIX + cleanPath;
                        return ` ${attr}="${fullUrl}"`;
                    });

                    processedLine = processedLine.replace(imgAttrRelativeSingle, (m, attr, val) => {
                        const cleanPath = val.startsWith('/') ? val.slice(1) : val;
                        const fullUrl = CONSTANTS.DEFAULT_IMAGE_PREFIX + cleanPath;
                        return ` ${attr}='${fullUrl}'`;
                    });

                    return processedLine;
                });

                return processedLines.join('\n');
            } catch (error) {
                console.error('添加默认图片前缀时出错:', error);
                return content;
            }
        }
    }

    // 链接处理类
    class LinkProcessor {
        /**
         * 获取绑定块的数据库项ID
         */
        static async getBoundItemId(blockId) {
            try {
                const res = await Utils.fetchSyncPost("/api/av/getAttributeViewItemIDsByBoundIDs", {
                    avID: CONSTANTS.DATABASE_AV_ID,
                    blockIDs: [blockId]
                });

                if (!res?.data) return null;

                // 返回绑定的数据库项ID
                return res.data[blockId] || null;
            } catch (error) {
                console.error('获取绑定块ID时出错:', blockId, error);
                return null;
            }
        }

        /**
         * 从数据库获取关联列内容
         */
        static async getRelationFromDatabase(blockId) {
            try {

                // 使用绑定的数据库项ID获取属性视图数据
                const res = await Utils.fetchSyncPost("/api/av/getAttributeViewKeys", { id: blockId });

                if (!res?.data) {
                    return [];
                }
                console.log('Database attribute view data for block', blockId, ':', res.data);
                const foundItem = res.data.find(item => item.avID === CONSTANTS.DATABASE_AV_ID);
                console.log('Found database item for block', blockId, ':', foundItem);
                if (!foundItem?.keyValues) {
                    return [];
                }

                const relationKey = foundItem.keyValues.find(kv => kv.key.id === CONSTANTS.RELATION_KEY_ID);
                console.log('关联列内容:', relationKey);
                if (!relationKey?.values?.length) {
                    return [];
                }

                // 提取关联的块ID和内容
                const relationBlocks = [];
                relationKey.values.forEach(value => {
                    if (value.relation && Array.isArray(value.relation.blockIDs) && Array.isArray(value.relation.contents)) {
                        // 将blockIDs和contents配对
                        value.relation.blockIDs.forEach((blockId, index) => {
                            const contentItem = value.relation.contents.find(content => content.blockID === blockId);
                            if (contentItem && contentItem.block) {
                                relationBlocks.push({
                                    blockId: blockId,
                                    title: contentItem.block.content
                                });
                            }
                        });
                    }
                });

                console.log('关联文档列表:', relationBlocks);
                return relationBlocks;
            } catch (error) {
                console.error('获取关联列内容时出错:', blockId, error);
                return [];
            }
        }

        /**
         * 从数据库获取微信链接，如果没有则获取其他平台链接
         */
        static async getWeixinLinkFromDatabase(blockId) {
            try {


                // 使用绑定的数据库项ID获取属性视图数据
                const res = await Utils.fetchSyncPost("/api/av/getAttributeViewKeys", { id: blockId });

                if (!res?.data) return null;

                const foundItem = res.data.find(item => item.avID === CONSTANTS.DATABASE_AV_ID);
                if (!foundItem?.keyValues) return null;

                const specificKey = foundItem.keyValues.find(kv => kv.key.id === CONSTANTS.WEIXIN_KEY_ID);
                if (!specificKey?.values?.length) return null;

                if (Array.isArray(specificKey.values[0].mAsset)) {
                    const assets = specificKey.values[0].mAsset;

                    // 根据用户配置的优先级决定返回哪个平台的链接
                    const priority = CONSTANTS.LINK_PRIORITY || 'wechat';

                    // 如果优先级为 zhihu，优先查找知乎链接
                    if (priority === 'zhihu') {
                        const zhihuCandidate = LinkProcessor.findOtherPlatformLinks(assets).find(l => l.platform === '知乎');
                        if (zhihuCandidate) {
                            console.log('Found Zhihu link for block', blockId, ':', zhihuCandidate.content);
                            return zhihuCandidate.content;
                        }

                        // 如果没有知乎链接，再尝试查找微信链接
                        const weixinLink = assets.find(asset => asset.content?.startsWith('https://mp.weixin.qq.com'));
                        if (weixinLink) {
                            console.log('Found WeChat link for block', blockId, ':', weixinLink.content);
                            return weixinLink.content;
                        }

                        // 最后尝试其他任意平台链接
                        const otherPlatformLinks = LinkProcessor.findOtherPlatformLinks(assets);
                        if (otherPlatformLinks.length > 0) {
                            console.log('Found alternative platform link for block', blockId, ':', otherPlatformLinks[0].content);
                            return otherPlatformLinks[0].content;
                        }
                    } else {
                        // 默认或 'wechat' 优先逻辑（向后兼容）
                        const weixinLink = assets.find(asset => asset.content?.startsWith('https://mp.weixin.qq.com'));
                        if (weixinLink) {
                            console.log('Found WeChat link for block', blockId, ':', weixinLink.content);
                            return weixinLink.content;
                        }

                        const otherPlatformLinks = LinkProcessor.findOtherPlatformLinks(assets);
                        if (otherPlatformLinks.length > 0) {
                            console.log('Found alternative platform link for block', blockId, ':', otherPlatformLinks[0].content);
                            return otherPlatformLinks[0].content;
                        }
                    }
                }

                return null;
            } catch (error) {
                console.error('Error fetching WeChat link for block:', blockId, error);
                return null;
            }
        }

        /**
         * 处理关联文档，生成相关笔记部分的内容
         */
        static async processRelatedDocuments(docId, outputFormat = 'html') {
            try {
                const relationBlocks = await LinkProcessor.getRelationFromDatabase(docId);
                if (!relationBlocks || relationBlocks.length === 0) {
                    return '';
                }

                let relatedContent = '';
                const relatedItems = [];

                // 处理每个关联的文档
                for (const relationItem of relationBlocks) {
                    try {
                        // 直接使用从关联列获取的标题，无需再调用API
                        const title = relationItem.title;
                        const blockId = relationItem.blockId;

                        // 获取该文档的外部链接
                        const externalLink = await LinkProcessor.getWeixinLinkFromDatabase(blockId);

                        if (externalLink) {
                            relatedItems.push({ title, link: externalLink, blockId });
                        } else {
                            // 如果没有外部链接，使用思源内部链接
                            relatedItems.push({ title, link: `siyuan://blocks/${blockId}`, blockId });
                        }
                    } catch (error) {
                        console.error('处理关联文档时出错:', relationItem.blockId, error);
                    }
                }

                if (relatedItems.length === 0) {
                    return '';
                }

                // 根据输出格式生成内容
                if (outputFormat === 'html') {
                    relatedContent = '<h2>相关笔记</h2>\n<ul>\n';
                    relatedItems.forEach(item => {
                        if (item.link.startsWith('siyuan://')) {
                            relatedContent += `<li><span style="color: #338dd6;">${item.title}</span></li>\n`;
                        } else {
                            relatedContent += `<li><p><a href="${item.link}" target="_blank">${item.title}</a></p></li>\n`;
                        }
                    });
                    relatedContent += '</ul>\n';
                } else if (outputFormat === 'markdown') {
                    relatedContent = '\n## 相关笔记\n\n';
                    relatedItems.forEach(item => {
                        if (item.link.startsWith('siyuan://')) {
                            relatedContent += `- ${item.title}\n`;
                        } else {
                            relatedContent += `- [${item.title}](${item.link})\n`;
                        }
                    });
                }

                return relatedContent;
            } catch (error) {
                console.error('处理关联文档时出错:', error);
                return '';
            }
        }

        /**
         * 在DOM中添加相关笔记部分
         */
        static async addRelatedDocumentsToDOM(docId) {
            try {
                const relatedContent = await LinkProcessor.processRelatedDocuments(docId, 'html');
                if (!relatedContent) {
                    return;
                }

                // 找到当前活动的编辑器区域
                const typographyAreas = document.querySelectorAll('.layout__wnd--active .protyle:not(.fn__none) .b3-typography');

                typographyAreas.forEach(area => {
                    // 检查是否已经添加了相关笔记部分，避免重复添加
                    if (area.querySelector('h2') &&
                        Array.from(area.querySelectorAll('h2')).some(h2 => h2.textContent.includes('相关笔记'))) {
                        return;
                    }

                    // 创建临时容器来解析HTML
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = relatedContent;

                    // 将解析后的元素添加到文档末尾
                    while (tempDiv.firstChild) {
                        area.appendChild(tempDiv.firstChild);
                    }
                });
            } catch (error) {
                console.error('在DOM中添加相关笔记时出错:', error);
            }
        }

        /**
         * 查找其他平台链接
         */
        static findOtherPlatformLinks(assets) {
            // 定义平台优先级（按重要性排序）
            const platformPriorities = [
                { domain: 'zhihu.com', name: '知乎' },
                { domain: 'ld246.com', name: '链滴' },
                { domain: 'juejin.cn', name: '掘金' },
                { domain: 'csdn.net', name: 'CSDN' },
                { domain: 'cnblogs.com', name: '博客园' },
                { domain: 'segmentfault.com', name: 'SegmentFault' },
                { domain: 'jianshu.com', name: '简书' },
                { domain: 'medium.com', name: 'Medium' },
                { domain: 'dev.to', name: 'Dev.to' },
                { domain: 'github.com', name: 'GitHub' },
                { domain: 'gitlab.com', name: 'GitLab' },
                { domain: 'gitee.com', name: 'Gitee' }
            ];

            const foundLinks = [];

            // 查找所有有效的链接
            assets.forEach(asset => {
                if (asset.content && asset.content.startsWith('http')) {
                    // 检查是否匹配已知平台
                    const matchedPlatform = platformPriorities.find(platform =>
                        asset.content.includes(platform.domain)
                    );

                    if (matchedPlatform) {
                        foundLinks.push({
                            content: asset.content,
                            platform: matchedPlatform.name,
                            priority: platformPriorities.indexOf(matchedPlatform)
                        });
                    } else {
                        // 对于未知平台，给较低优先级
                        foundLinks.push({
                            content: asset.content,
                            platform: '其他平台',
                            priority: 999
                        });
                    }
                }
            });

            // 按优先级排序
            foundLinks.sort((a, b) => a.priority - b.priority);

            return foundLinks;
        }

        /**
         * 转换markdown中的块链接到微信链接
         */
        static async convertBlockLinksToWeChat(content) {
            const blockLinkRegex = /\[([^\]]+)\]\(siyuan:\/\/blocks\/([^)]+)\)/g;
            let processedContent = content;
            const matches = [...content.matchAll(blockLinkRegex)];

            for (const match of matches) {
                const [fullMatch, linkText, blockId] = match;

                try {
                    const weixinLink = await LinkProcessor.getWeixinLinkFromDatabase(blockId);
                    const replacement = weixinLink
                        ? `[${linkText}](${weixinLink})`
                        : linkText;

                    processedContent = processedContent.replace(fullMatch, replacement);
                } catch (error) {
                    console.error('转换块链接时出错:', blockId, error);
                    processedContent = processedContent.replace(fullMatch, linkText);
                }
            }

            return processedContent;
        }

        /**
         * 转换所有链接到微信格式
         */
        static async convertLinksToWechat() {
            const links = document.querySelectorAll('.b3-typography a');

            for (const link of links) {
                const href = link.getAttribute('href');
                const text = link.textContent;

                if (href?.startsWith('siyuan://blocks/')) {
                    await LinkProcessor.processBlockLink(link, href, text);
                } else if (href?.startsWith('#')) {
                    LinkProcessor.replaceWithSpan(link, text, '#338dd6');
                } else if (!href?.startsWith('https://mp.weixin.qq.com/')) {
                    // 统一转换为 Markdown 形式 [文本](链接)，并保证锚文本保持默认颜色，其他部分为蓝色
                    LinkProcessor.replaceWithStyledMarkdown(link, text, href, '#338dd6');
                }
            }
        }

        /**
         * 转换块引用到微信格式
         */
        static async convertBlockReferencesToWechat() {
            const links = document.querySelectorAll('.b3-typography a');

            for (const link of links) {
                const href = link.getAttribute('href');
                const text = link.textContent;

                if (href?.startsWith('siyuan://blocks/')) {
                    await LinkProcessor.processBlockLink(link, href, text);
                }
            }
        }

        /**
         * 处理块链接
         */
        static async processBlockLink(link, href, text) {
            const blockId = href.replace('siyuan://blocks/', '');

            try {
                const weixinLink = await LinkProcessor.getWeixinLinkFromDatabase(blockId);

                if (weixinLink) {
                    link.setAttribute('href', weixinLink);
                } else {
                    LinkProcessor.replaceWithStyledMarkdown(link, text, href, '#338dd6');
                }
            } catch (error) {
                console.error('Error fetching WeChat link for block:', blockId, error);
                LinkProcessor.replaceWithStyledMarkdown(link, text, href, '#338dd6');
            }
        }

        /**
         * 用span替换链接
         */
        static replaceWithSpan(link, text, color) {
            const newSpan = document.createElement('span');
            newSpan.textContent = text;
            newSpan.style.color = color;
            link.parentNode.replaceChild(newSpan, link);
        }

        /**
         * 用带样式的 Markdown 语法替换链接（例如：[锚文本](链接)）
         * 锚文本保持默认颜色，其他符号和 URL 使用指定颜色
         */
        static replaceWithStyledMarkdown(link, text, href, color) {
            const wrapper = document.createElement('span');

            const openBracket = document.createElement('span');
            openBracket.textContent = '[';
            openBracket.style.color = color;

            const anchor = document.createElement('span');
            anchor.textContent = text; // 锚文本不设置颜色，保持默认

            const mid = document.createElement('span');
            mid.textContent = '](';
            mid.style.color = color;

            const url = document.createElement('span');
            url.textContent = href;
            url.style.color = color;

            const close = document.createElement('span');
            close.textContent = ')';
            close.style.color = color;

            wrapper.appendChild(openBracket);
            wrapper.appendChild(anchor);
            wrapper.appendChild(mid);
            wrapper.appendChild(url);
            wrapper.appendChild(close);

            link.parentNode.replaceChild(wrapper, link);
        }
    }

    // 列表处理类
    class ListProcessor {
        // 已移除：微信公众号专用的混排列表处理逻辑
        /**
         * 预处理有序列表以适配知乎
         */
        static processOrderedListsForZhihu() {
            const typographyAreas = document.querySelectorAll('.b3-typography');
            typographyAreas.forEach(area => {
                ListProcessor.processNestedLists(area);
            });
        }

        /**
         * 处理嵌套列表
         */
        static processNestedLists(area) {
            const orderedLists = Array.from(area.querySelectorAll('ol'));
            const unorderedLists = Array.from(area.querySelectorAll('ul'));

            // 按嵌套深度排序（深度越深越先处理）
            const allLists = [...orderedLists, ...unorderedLists]
                .sort((a, b) => ListProcessor.getListDepth(b) - ListProcessor.getListDepth(a));

            allLists.forEach(list => {
                const listDepth = ListProcessor.getListDepth(list);

                // 处理所有列表，不再限制只有包含图片和代码块的列表
                if (list.tagName === 'OL') {
                    ListProcessor.processOrderedList(list, listDepth);
                } else {
                    ListProcessor.processUnorderedList(list, listDepth);
                }
            });
        }

        /**
         * 将列表转换为：列表符号 + 纯文本段落 + 缩进（用于微信公众号）
         * 逻辑与知乎处理相同，但作用于微信公众号场景，避免混排错乱
         */
        static processListsForWechat(rootArea) {
            try {
                // 只处理传入的区域，避免跨文档影响
                const area = rootArea;
                if (!area) return;

                // 对嵌套的列表按深度从深到浅处理（与 processNestedLists 相同策略）
                const orderedLists = Array.from(area.querySelectorAll('ol'));
                const unorderedLists = Array.from(area.querySelectorAll('ul'));

                const allLists = [...orderedLists, ...unorderedLists]
                    .sort((a, b) => ListProcessor.getListDepth(b) - ListProcessor.getListDepth(a));

                allLists.forEach(list => {
                    const listDepth = ListProcessor.getListDepth(list);
                    if (list.tagName === 'OL') {
                        ListProcessor.processOrderedList(list, listDepth);
                    } else {
                        ListProcessor.processUnorderedList(list, listDepth);
                    }
                });
            } catch (e) {
                console.error('微信公众号列表处理出错:', e);
            }
        }

        /**
         * 获取列表的嵌套深度
         */
        static getListDepth(list) {
            let depth = 0;
            let parent = list.parentElement;

            while (parent) {
                if (['LI', 'OL', 'UL'].includes(parent.tagName)) {
                    if (['OL', 'UL'].includes(parent.tagName)) {
                        depth++;
                    }
                }
                parent = parent.parentElement;
            }

            return depth;
        }

        /**
         * 处理单个有序列表
         */
        static processOrderedList(ol, depth = 0) {
            const listItems = Array.from(ol.children).filter(child => child.tagName === 'LI');
            const parentElement = ol.parentNode;
            const startNumber = parseInt(ol.getAttribute('start')) || 1;

            const fragment = document.createDocumentFragment();

            listItems.forEach((li, index) => {
                const currentNumber = startNumber + index;
                const bulletPrefix = ListProcessor.getOrderedListPrefix(currentNumber, depth);
                ListProcessor.processListItem(li, bulletPrefix, fragment, index < listItems.length - 1, depth);
            });

            parentElement.insertBefore(fragment, ol);
            parentElement.removeChild(ol);
        }

        /**
         * 处理单个无序列表
         */
        static processUnorderedList(ul, depth = 0) {
            const listItems = Array.from(ul.children).filter(child => child.tagName === 'LI');
            const parentElement = ul.parentNode;

            const fragment = document.createDocumentFragment();

            listItems.forEach((li, index) => {
                const bulletPrefix = ListProcessor.getUnorderedListPrefix(depth, li);
                ListProcessor.processListItem(li, bulletPrefix, fragment, index < listItems.length - 1, depth);
            });

            parentElement.insertBefore(fragment, ul);
            parentElement.removeChild(ul);
        }

        /**
         * 获取有序列表的前缀
         */
        static getOrderedListPrefix(number, depth) {
            const level = depth % 6;

            switch (level) {
                case 0: return `${number}. `;
                case 1: return `${number}) `;
                case 2: return `${NumberConverter.numberToLetter(number, true)}. `;
                case 3: return `${NumberConverter.numberToLetter(number, false)}. `;
                case 4: return `${NumberConverter.numberToRoman(number)}. `;
                case 5: return `${number}. `;
                default: return `${number}. `;
            }
        }

        /**
         * 获取无序列表的前缀
         */
        static getUnorderedListPrefix(depth, li = null) {
            // 检查是否是 checkbox 类型的列表项
            if (li && li.classList.contains('protyle-task')) {
                const checkbox = li.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    // 根据 checkbox 的 checked 状态返回不同符号
                    return checkbox.checked ? '✅ ' : '▢ ';
                }
            }
            
            // 普通无序列表，使用原有符号
            const level = depth % CONSTANTS.LIST_SYMBOLS.UNORDERED.length;
            return `${CONSTANTS.LIST_SYMBOLS.UNORDERED[level]} `;
        }

        /**
         * 处理单个列表项
         */
        static processListItem(li, bulletPrefix, fragment, addSpacer, depth = 0) {
            // 计算缩进（每个层级2个空格）
            // 使用HTML non-breaking spaces (nbsp) 作为缩进
            // 这些会在HTML中占位，但视觉上几乎不可见
            const indentSpaces = '\u200d' + '&nbsp;'.repeat(depth * 2);

            // 处理列表项中的直接子元素
            const children = Array.from(li.children);
            let firstTextProcessed = false;

            children.forEach((child, childIndex) => {
                const clonedChild = child.cloneNode(true);

                if (child.tagName === 'P') {
                    // 处理段落 - 只为段落添加缩进
                    if (!firstTextProcessed) {
                        // 第一个段落添加项目符号和缩进
                        clonedChild.innerHTML = `${indentSpaces}<strong>${bulletPrefix}</strong>${clonedChild.innerHTML}`;
                        firstTextProcessed = true;
                    } else {
                        // 后续段落只添加下一个层级的缩进
                        const nextIndentSpaces = '\u200d' + '&nbsp;'.repeat((depth + 1) * 2);
                        clonedChild.innerHTML = `${nextIndentSpaces}${clonedChild.innerHTML}`;
                    }
                    fragment.appendChild(clonedChild);
                } else if (child.tagName === 'OL' || child.tagName === 'UL') {
                    // 嵌套列表已经在之前处理过了，这里跳过
                    return;
                } else {
                    // 其他元素直接添加，不做缩进处理
                    if (!firstTextProcessed && child.textContent.trim()) {
                        // 如果没有段落但有文本内容，创建一个段落
                        const contentP = document.createElement('p');
                        contentP.innerHTML = `${indentSpaces}<strong>${bulletPrefix}</strong>${clonedChild.innerHTML}`;
                        fragment.appendChild(contentP);
                        firstTextProcessed = true;
                    } else {
                        // 需要添加margin-Left处理：2em*深度
                        clonedChild.style.marginLeft = `${2 * (depth + 1)}em`;
                        fragment.appendChild(clonedChild);
                    }
                }
            });

            // 如果没有处理任何文本内容，但列表项有内容，创建一个基本段落
            if (!firstTextProcessed && li.textContent.trim()) {
                const contentP = document.createElement('p');
                contentP.innerHTML = `${indentSpaces}<strong>${bulletPrefix}</strong>${li.innerHTML.replace(/<(ol|ul)[^>]*>[\s\S]*?<\/(ol|ul)>/gi, '')}`;
                fragment.appendChild(contentP);
            }
        }
    }

    // 内容处理类
    class ContentProcessor {
        /**
         * 处理引述块
         */
        static processBlockquote() {
            document.querySelectorAll("blockquote").forEach((item) => {
                const section = document.createElement("section");

                // 复制属性
                Array.from(item.attributes).forEach(attr => {
                    section.setAttribute(attr.name, attr.value);
                });

                // 复制样式
                const computedStyle = window.getComputedStyle(item);
                const styleProps = [
                    'margin', 'padding', 'border', 'border-left',
                    'background', 'background-color', 'color',
                    'font-size', 'font-weight', 'border-radius', 'line-height'
                ];

                styleProps.forEach(prop => {
                    const value = computedStyle.getPropertyValue(prop);
                    if (value) {
                        section.style.setProperty(prop, value);
                    }
                });

                section.innerHTML = item.innerHTML;
                item.parentNode.replaceChild(section, item);
            });
        }

        /**
         * 添加微信公众号名片
         */
        static addWeChatCard() {
            const typographyAreas = document.querySelectorAll('.b3-typography');

            typographyAreas.forEach(area => {
                if (area.querySelector('.mp_profile_iframe_wrp')) return;

                const elements = ContentProcessor.createWeChatCardElements();
                elements.forEach(element => area.appendChild(element));
            });
        }

        /**
         * 创建微信名片元素
         */
        static createWeChatCardElements() {
            const separatorP = document.createElement('p');
            separatorP.style.textAlign = 'center';
            separatorP.innerHTML = `<img src="${CONSTANTS.SEPARATOR_IMAGE_URL}" style="margin: 0px 1px;">`;

            const introSection = document.createElement('section');
            introSection.innerHTML = `<span leaf="">${CONSTANTS.WECHAT_PROFILE.introduction}</span>`;

            const cardSection = document.createElement('section');
            const profile = CONSTANTS.WECHAT_PROFILE;
            cardSection.innerHTML = `
                <section class="mp_profile_iframe_wrp custom_select_card_wrp" nodeleaf="">
                    <mp-common-profile class="mpprofile js_uneditable custom_select_card mp_profile_iframe" 
                        data-pluginname="mpprofile" 
                        data-nickname="${profile.nickname}" 
                        data-alias="${profile.alias}" 
                        data-headimg="${profile.headimg}" 
                        data-signature="${profile.signature}" 
                        data-id="${profile.id}" 
                        data-service_type="1" 
                        data-verify_status="1">
                    </mp-common-profile>
                    <br class="ProseMirror-trailingBreak">
                </section>`;

            return [separatorP, introSection, cardSection];
        }

        /**
         * 替换hr标签为图片
         */
        static replaceHrWithImage() {
            const typographyAreas = document.querySelectorAll('.b3-typography');

            typographyAreas.forEach(area => {
                const hrElements = area.querySelectorAll('hr');
                hrElements.forEach(hr => {
                    const pElement = document.createElement('p');
                    pElement.style.textAlign = 'center';

                    const imgElement = document.createElement('img');
                    imgElement.src = CONSTANTS.SEPARATOR_IMAGE_URL;
                    imgElement.style.margin = '0 1px';

                    pElement.appendChild(imgElement);
                    hr.parentNode.replaceChild(pElement, hr);
                });
            });
        }

        /**
         * 处理数学公式末尾空格问题
         */
        static processMathFormulas() {
            const typographyDivs = document.querySelectorAll('div.b3-typography');

            typographyDivs.forEach(typographyDiv => {
                const lastChild = typographyDiv.lastElementChild;
                if (lastChild?.matches('div[data-subtype="math"]')) {
                    const newParagraph = document.createElement('p');
                    newParagraph.innerHTML = '&#8203;';
                    typographyDiv.appendChild(newParagraph);
                }
            });
        }

        /**
         * 将span[data-type="code"]转换为code元素（适用于知乎）
         */
        static convertSpanCodeToCodeElement() {
            const typographyAreas = document.querySelectorAll('.b3-typography');

            typographyAreas.forEach(area => {
                const codeSpans = area.querySelectorAll('span[data-type="code"]');

                codeSpans.forEach(span => {
                    const codeElement = document.createElement('code');

                    // 复制文本内容
                    codeElement.textContent = span.textContent;

                    // 复制样式（如果需要）
                    const computedStyle = window.getComputedStyle(span);
                    const styleProps = [
                        'background-color', 'color', 'font-family',
                        'font-size', 'padding', 'border-radius'
                    ];

                    styleProps.forEach(prop => {
                        const value = computedStyle.getPropertyValue(prop);
                        if (value && value !== 'none' && value !== 'auto') {
                            codeElement.style.setProperty(prop, value);
                        }
                    });

                    // 替换原始span元素
                    span.parentNode.replaceChild(codeElement, span);
                });
            });
        }

        /**
         * 将思源笔记图片格式转换为知乎格式（带标题支持）
         */
        static convertSiyuanImagesToZhihuFormat() {
            const typographyAreas = document.querySelectorAll('.b3-typography');

            typographyAreas.forEach(area => {
                const imageSpans = area.querySelectorAll('span[data-type="img"]');

                imageSpans.forEach(span => {
                    const imgElement = span.querySelector('img');
                    if (!imgElement) return;

                    // 获取图片信息
                    const src = imgElement.getAttribute('src') || imgElement.getAttribute('data-src');
                    const alt = imgElement.getAttribute('alt') || '';
                    const title = imgElement.getAttribute('title') || '';

                    // 获取标题文本（从 protyle-action__title 中获取）
                    const titleSpan = span.querySelector('.protyle-action__title span');
                    const captionText = titleSpan ? titleSpan.textContent.trim() : (title || alt);

                    // 创建知乎格式的figure元素
                    const figure = document.createElement('figure');

                    // 创建img元素
                    const newImg = document.createElement('img');
                    newImg.setAttribute('src', src);

                    figure.appendChild(newImg);

                    // 如果有标题，添加figcaption
                    if (captionText) {
                        const figcaption = document.createElement('figcaption');
                        figcaption.textContent = captionText;
                        figure.appendChild(figcaption);
                    }

                    // 检查父级p标签是否只包含图片和零宽空格
                    const parentP = span.closest('p');
                    if (parentP) {
                        // 获取p标签的文本内容并清理零宽空格
                        const pTextContent = parentP.textContent || '';
                        const cleanedText = pTextContent.replace(/[\u200B\u200C\u200D\uFEFF]/g, '').trim();

                        // 如果p标签只包含图片（清理后无其他文本内容）
                        if (cleanedText === '' || cleanedText === alt || cleanedText === title) {
                            // 直接替换整个p标签
                            parentP.parentNode.replaceChild(figure, parentP);
                        } else {
                            // 如果p标签还有其他内容，只替换span元素
                            span.parentNode.replaceChild(figure, span);
                        }
                    } else {
                        // 替换原始的span元素
                        span.parentNode.replaceChild(figure, span);
                    }
                });

                // 清理包含图片的p标签中的零宽空格
                const paragraphs = area.querySelectorAll('p');
                paragraphs.forEach(p => {
                    if (p.querySelector('img') || p.querySelector('figure')) {
                        // 清理文本节点中的零宽空格
                        const walker = document.createTreeWalker(
                            p,
                            NodeFilter.SHOW_TEXT,
                            null,
                            false
                        );

                        const textNodes = [];
                        let node;
                        while (node = walker.nextNode()) {
                            textNodes.push(node);
                        }

                        textNodes.forEach(textNode => {
                            const cleanedText = textNode.textContent.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
                            if (cleanedText !== textNode.textContent) {
                                textNode.textContent = cleanedText;
                            }
                        });

                        // 如果p标签清理后只剩空白内容和图片/figure，移除p标签保留内容
                        const remainingText = p.textContent.replace(/[\u200B\u200C\u200D\uFEFF\s]/g, '');
                        if (remainingText === '' && (p.querySelector('img') || p.querySelector('figure'))) {
                            const children = Array.from(p.children);
                            const parent = p.parentNode;
                            children.forEach(child => {
                                parent.insertBefore(child, p);
                            });
                            parent.removeChild(p);
                        }
                    }
                });
            });
        }

        /**
         * 将思源笔记代码块转换为知乎格式（带语言高亮）
         */
        static convertCodeBlocksForZhihu() {
            const typographyAreas = document.querySelectorAll('.b3-typography');

            typographyAreas.forEach(area => {
                const codeBlocks = area.querySelectorAll('pre.code-block[data-language]');

                codeBlocks.forEach(preElement => {
                    const language = preElement.getAttribute('data-language') || '';
                    const codeElement = preElement.querySelector('code');

                    if (!codeElement) return;

                    // 提取纯文本内容（去除HTML标签）
                    const codeText = ContentProcessor.extractPlainTextFromCode(codeElement);

                    // 创建新的知乎格式代码块
                    const newPre = document.createElement('pre');
                    if (language) {
                        newPre.setAttribute('lang', language);
                    }
                    newPre.textContent = codeText;

                    // 替换原始代码块
                    preElement.parentNode.replaceChild(newPre, preElement);
                });
            });
        }

        /**
         * 将思源笔记代码块转换为微信公众号格式
         */
        static convertCodeBlocksForWechat() {
            const typographyAreas = document.querySelectorAll('.b3-typography');

            typographyAreas.forEach(area => {
                const codeBlocks = area.querySelectorAll('pre.code-block');

                codeBlocks.forEach(preElement => {
                    const codeElement = preElement.querySelector('code');
                    if (!codeElement) return;

                    // 直接遍历DOM并处理内容
                    ContentProcessor.processCodeElementForWechat(codeElement);
                });
            });
        }

        /**
         * 从代码元素中提取纯文本内容
         */
        static extractPlainTextFromCode(codeElement) {
            // 创建一个临时div来处理HTML内容
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = codeElement.innerHTML;

            // 递归提取文本内容，保持换行符
            const extractText = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    return node.textContent;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'BR') {
                        return '\n';
                    }
                    let text = '';
                    for (const child of node.childNodes) {
                        text += extractText(child);
                    }
                    return text;
                }
                return '';
            };

            return extractText(tempDiv).trim();
        }
        /**
         * 直接处理代码元素的DOM内容
         */
        static processCodeElementForWechat(codeElement) {
            // 创建TreeWalker来遍历所有文本节点
            const walker = document.createTreeWalker(
                codeElement,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            const textNodes = [];
            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }

            // 处理每个文本节点
            textNodes.forEach(textNode => {
                const originalText = textNode.textContent;

                // 检查是否需要处理（包含换行符、空格或制表符）
                if (!/[\n \t]/.test(originalText)) {
                    return;
                }

                // 手动构建文档片段，避免使用innerHTML解析导致的问题
                const fragment = document.createDocumentFragment();

                // 按换行符分割文本
                const lines = originalText.split('\n');

                lines.forEach((line, lineIndex) => {
                    // 处理行内的空格和制表符
                    let processedLine = line
                        .replace(/ /g, '\u00A0')  // 使用Unicode不间断空格字符，避免HTML实体解析问题
                        .replace(/\t/g, '\u00A0\u00A0\u00A0\u00A0');  // 制表符转为4个不间断空格

                    // 如果处理后的行不为空，添加文本节点
                    if (processedLine) {
                        fragment.appendChild(document.createTextNode(processedLine));
                    }

                    // 在行之间添加<br>标签（除了最后一行）
                    if (lineIndex < lines.length - 1) {
                        fragment.appendChild(document.createElement('br'));
                    }
                });

                // 替换原始文本节点
                textNode.parentNode.insertBefore(fragment, textNode);
                textNode.parentNode.removeChild(textNode);
            });

            // 处理<br>标签，确保它们被正确处理
            const brElements = codeElement.querySelectorAll('br');
            brElements.forEach(br => {
                // 如果<br>标签后面紧跟着文本节点，确保格式正确
                const nextSibling = br.nextSibling;
                if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
                    const text = nextSibling.textContent;
                    if (text.startsWith('\n')) {
                        // 移除文本节点开头的换行符，因为已经用<br>替代了
                        nextSibling.textContent = text.substring(1);
                    }
                }
            });
        }

        /**
         * 删除带有title属性的h1标题
         */
        static removeTitleH1() {
            const typographyAreas = document.querySelectorAll('.b3-typography');

            typographyAreas.forEach(area => {
                const h1Elements = area.querySelectorAll('h1[title]');

                h1Elements.forEach(h1 => {
                    // 检查父元素是否只包含这个h1元素（忽略空白文本节点）
                    const parent = h1.parentElement;
                    if (parent && parent.tagName === 'P') {
                        // 检查p标签是否只包含h1和空白内容
                        const childNodes = Array.from(parent.childNodes);
                        const hasOnlyH1 = childNodes.every(node => {
                            return node === h1 ||
                                (node.nodeType === Node.TEXT_NODE && !node.textContent.trim());
                        });

                        if (hasOnlyH1) {
                            // 删除整个p标签
                            parent.remove();
                        } else {
                            // 只删除h1元素
                            h1.remove();
                        }
                    } else {
                        // 直接删除h1元素
                        h1.remove();
                    }
                });
            });
        }
    }

    // 标题编号处理类
    class HeadingNumberProcessor {
        /**
         * 为HTML中的标题添加编号
         */
        static addNumbersToHTMLHeadings() {
            const typographyAreas = document.querySelectorAll('.b3-typography');

            typographyAreas.forEach(area => {
                HeadingNumberProcessor.processHeadingsInArea(area);
            });
        }

        /**
         * 处理指定区域内的标题
         */
        static processHeadingsInArea(area) {
            const headings = area.querySelectorAll('h1, h2, h3, h4, h5, h6');
            const numbers = Array(6).fill(0); // 用于存储各级标题的编号

            // 检查是否只有一个h1标题
            const h1Headings = area.querySelectorAll('h1');
            const skipH1Numbering = h1Headings.length === 1;

            headings.forEach(heading => {
                const level = parseInt(heading.tagName.substring(1)); // 获取标题级别

                // 如果只有一个h1标题，则跳过h1编号
                if (skipH1Numbering && level === 1) {
                    return;
                }

                if (level >= CONSTANTS.HEADING_NUMBER.START_LEVEL &&
                    level <= CONSTANTS.HEADING_NUMBER.END_LEVEL) {

                    // 更新当前级别的编号
                    numbers[level - 1]++;

                    // 重置更深层级的编号
                    for (let i = level; i < 6; i++) {
                        numbers[i] = 0;
                    }

                    // 生成编号字符串
                    const numberStr = HeadingNumberProcessor.generateNumberString(numbers, level);

                    // 检查是否已经有编号
                    if (!HeadingNumberProcessor.hasExistingNumber(heading)) {
                        HeadingNumberProcessor.addNumberToHeading(heading, numberStr);
                    }
                }
            });
        }

        /**
         * 生成编号字符串
         */
        static generateNumberString(numbers, level) {
            const relevantNumbers = numbers.slice(0, level).filter(num => num > 0);
            return relevantNumbers.join(CONSTANTS.HEADING_NUMBER.SEPARATOR) + ' ';
        }

        /**
         * 检查标题是否已有编号
         */
        static hasExistingNumber(heading) {
            const text = heading.textContent.trim();
            return /^\d+(\.\d+)*\s/.test(text);
        }

        /**
         * 为标题添加编号
         */
        static addNumberToHeading(heading, numberStr) {
            const existingContent = heading.innerHTML;
            heading.innerHTML = `<strong>${numberStr}</strong>${existingContent}`;
        }

        /**
         * 为markdown内容中的标题添加编号
         */
        static addNumbersToMarkdownHeadings(content) {
            const lines = content.split('\n');
            const numbers = Array(6).fill(0);
            let inCodeBlock = false;
            let codeBlockFence = '';

            // 统计h1标题数量，判断是否只有一个h1标题
            let h1Count = 0;
            for (const line of lines) {
                const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
                if (headingMatch && !inCodeBlock) {
                    const level = headingMatch[1].length;
                    if (level === 1) {
                        h1Count++;
                    }
                }

                // 检测代码块边界
                const codeBlockMatch = line.match(/^(\s*)(‍```|~~~)(.*)$/);
                if (codeBlockMatch) {
                    const [, indent, fence, language] = codeBlockMatch;
                    if (!inCodeBlock) {
                        // 开始代码块
                        inCodeBlock = true;
                        codeBlockFence = fence;
                    } else if (fence === codeBlockFence && indent.length === 0) {
                        // 结束代码块（需要相同的围栏符号且在行首）
                        inCodeBlock = false;
                        codeBlockFence = '';
                    }
                }
            }

            // 重置状态
            inCodeBlock = false;
            codeBlockFence = '';

            const processedLines = lines.map(line => {
                // 检测代码块边界
                const codeBlockMatch = line.match(/^(\s*)(```|~~~)(.*)$/);
                if (codeBlockMatch) {
                    const [, indent, fence, language] = codeBlockMatch;
                    if (!inCodeBlock) {
                        // 开始代码块
                        inCodeBlock = true;
                        codeBlockFence = fence;
                    } else if (fence === codeBlockFence && indent.length === 0) {
                        // 结束代码块（需要相同的围栏符号且在行首）
                        inCodeBlock = false;
                        codeBlockFence = '';
                    }
                    return line;
                }

                // 如果在代码块内，直接返回原行
                if (inCodeBlock) {
                    return line;
                }

                // 检测行内代码块（单行）
                const inlineCodeCount = (line.match(/`/g) || []).length;
                const hasInlineCode = inlineCodeCount >= 2 && inlineCodeCount % 2 === 0;

                // 处理标题（只在非代码块内）
                const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

                if (headingMatch && !hasInlineCode) {
                    const level = headingMatch[1].length;
                    const headingText = headingMatch[2];

                    // 如果只有一个h1标题，则跳过h1编号
                    if (h1Count === 1 && level === 1) {
                        return line;
                    }

                    if (level >= CONSTANTS.HEADING_NUMBER.START_LEVEL &&
                        level <= CONSTANTS.HEADING_NUMBER.END_LEVEL) {

                        // 更新当前级别的编号
                        numbers[level - 1]++;

                        // 重置更深层级的编号
                        for (let i = level; i < 6; i++) {
                            numbers[i] = 0;
                        }

                        // 检查是否已有编号
                        if (!/^\d+(\.\d+)*\s/.test(headingText)) {
                            const numberStr = HeadingNumberProcessor.generateNumberString(numbers, level);
                            return `${'#'.repeat(level)} ${numberStr}${headingText}`;
                        }
                    }
                }

                return line;
            });

            return processedLines.join('\n');
        }
    }

    // 按钮处理类
    class ButtonHandler {
        /**
         * 微信公众号按钮点击处理
         */
        static async handleWechatButtonClick(event) {
            // 在当前激活窗口 + 活动编辑器中查找当前文档的动作容器，避免跨文档串扰
            const activeContainer = document.querySelector('.layout__wnd--active .protyle:not(.fn__none) .protyle-preview .protyle-preview__action');
            const select = activeContainer?.querySelector('.link-conversion-select');
            const headingNumberSelect = activeContainer?.querySelector('.heading-number-select');
            const imageHostSelect = activeContainer?.querySelector('.image-host-select');
            const linkConversionOption = select ? select.value : 'convert';
            const addHeadingNumbers = headingNumberSelect ? headingNumberSelect.value === 'yes' : false;
            const imageHostType = imageHostSelect ? imageHostSelect.value : CONSTANTS.IMAGE_HOST_TYPE.DEFAULT;

            await Utils.showNotification("发布到微信公众号：样式转换ing");

            try {
                // 获取当前文档ID用于处理关联文档
                const docId = Utils.getCurrentDocumentId();

                // 将优先级持久化为 'wechat' 并同步更新 UI
                try { localStorage.setItem('siyuan_link_priority', 'wechat'); } catch (e) { }
                CONSTANTS.LINK_PRIORITY = 'wechat';
                const prioritySelect = activeContainer?.querySelector('.link-priority-select');
                if (prioritySelect) prioritySelect.value = 'wechat';
                // 删除带有title属性的h1标题
                ContentProcessor.removeTitleH1();

                // 根据图床类型处理图片URL
                if (imageHostType === CONSTANTS.IMAGE_HOST_TYPE.PICGO) {
                    const docId = Utils.getCurrentDocumentId();
                    if (docId) {
                        const picgoFileMapKey = await Utils.getDocumentAttribute(docId, 'custom-picgo-file-map-key');
                        if (picgoFileMapKey) {
                            const picgoFileMap = JSON.parse(picgoFileMapKey);
                            await ImageProcessor.replaceImageUrlsInDOM(picgoFileMap);
                        }
                    }
                }
                // 使用默认图床时，微信不需要特殊处理

                // 添加标题编号
                if (addHeadingNumbers) {
                    HeadingNumberProcessor.addNumbersToHTMLHeadings();
                }

                // 处理代码块格式
                ContentProcessor.convertCodeBlocksForWechat();

                // 处理列表：将列表转换为“列表符号 + 纯文本段落 + 缩进”以适配微信公众号
                try {
                    const activeTypography = document.querySelector('.protyle:not(.fn__none) .b3-typography');
                    if (activeTypography) {
                        ListProcessor.processListsForWechat(activeTypography);
                    }
                } catch (e) {
                    console.error('处理微信公众号列表时出错:', e);
                }


                // 处理内容
                ContentProcessor.replaceHrWithImage();
                if (CONSTANTS.ADD_WECHAT_CARD) {
                    ContentProcessor.addWeChatCard();
                }
                ContentProcessor.processBlockquote();

                // 添加相关笔记部分
                if (docId) {
                    await LinkProcessor.addRelatedDocumentsToDOM(docId);
                }

                // 处理链接转换
                if (linkConversionOption === 'convert') {
                    await LinkProcessor.convertLinksToWechat();
                } else if (linkConversionOption === 'no-convert') {
                    await LinkProcessor.convertBlockReferencesToWechat();
                }
                if (linkConversionOption === 'convert') {
                    await LinkProcessor.convertLinksToWechat();
                } else if (linkConversionOption === 'no-convert') {
                    await LinkProcessor.convertBlockReferencesToWechat();
                }
                // 点击桌面按钮
                const desktopButton = document.querySelector('.layout__wnd--active .protyle:not(.fn__none) .protyle-preview .protyle-preview__action > button[data-type="desktop"]');
                desktopButton?.click();

                await Utils.showNotification("发布到微信公众号：样式转换完成");

                // 点击微信复制按钮
                const wechatCopyButton = document.querySelector('.layout__wnd--active .protyle:not(.fn__none) .protyle-preview .protyle-preview__action > button[data-type="mp-wechat"]');
                wechatCopyButton?.click();

            } catch (error) {
                console.error('微信处理过程中出错:', error);
                await Utils.showNotification(`处理失败: ${error.message}`);
            }
        }

        /**
         * 新知乎按钮点击处理
         */
        static async handleNewZhihuButtonClick(event) {
            await Utils.showNotification("发布到知乎：样式转换ing");
            // 在点击知乎按钮时，将优先级持久化为 'zhihu' 并更新 UI
            try {
                // 获取当前激活窗口 + 活动编辑器中的动作容器，避免跨文档串扰
                const activeContainer = document.querySelector('.layout__wnd--active .protyle:not(.fn__none) .protyle-preview .protyle-preview__action');

                // 获取当前文档ID用于处理关联文档
                const docId = Utils.getCurrentDocumentId();

                try { localStorage.setItem('siyuan_link_priority', 'zhihu'); } catch (e) { }
                CONSTANTS.LINK_PRIORITY = 'zhihu';
                const prioritySelect = activeContainer?.querySelector('.link-priority-select');
                if (prioritySelect) prioritySelect.value = 'zhihu';

                // 删除带有title属性的h1标题
                ContentProcessor.removeTitleH1();

                // 获取图床选择（限定当前激活窗口与活动编辑器）
                const imageHostSelect = activeContainer?.querySelector('.image-host-select');
                const imageHostType = imageHostSelect ? imageHostSelect.value : CONSTANTS.IMAGE_HOST_TYPE.DEFAULT;

                // 根据图床类型处理图片URL
                if (imageHostType === CONSTANTS.IMAGE_HOST_TYPE.PICGO) {
                    const docId = Utils.getCurrentDocumentId();
                    if (docId) {
                        const picgoFileMapKey = await Utils.getDocumentAttribute(docId, 'custom-picgo-file-map-key');
                        if (picgoFileMapKey) {
                            const picgoFileMap = JSON.parse(picgoFileMapKey);
                            await ImageProcessor.replaceImageUrlsInDOM(picgoFileMap);
                        }
                    }
                }
                // 使用默认图床时，知乎不需要特殊处理

                // 添加标题编号
                const headingNumberSelect = activeContainer?.querySelector('.heading-number-select');
                const addHeadingNumbers = headingNumberSelect ? headingNumberSelect.value === 'yes' : false;
                if (addHeadingNumbers) {
                    HeadingNumberProcessor.addNumbersToHTMLHeadings();
                }

                // 转换思源笔记图片格式为知乎格式
                ContentProcessor.convertSiyuanImagesToZhihuFormat();

                // 转换代码块为知乎格式
                ContentProcessor.convertCodeBlocksForZhihu();

                // 转换行内代码元素
                ContentProcessor.convertSpanCodeToCodeElement();

                await LinkProcessor.convertBlockReferencesToWechat();

                // 添加相关笔记部分
                if (docId) {
                    await LinkProcessor.addRelatedDocumentsToDOM(docId);
                }

                // 预处理有序列表
                ListProcessor.processOrderedListsForZhihu();

                await Utils.showNotification("发布到知乎：样式转换完成");

                // 点击桌面按钮
                const desktopButton = document.querySelector('.layout__wnd--active .protyle:not(.fn__none) .protyle-preview .protyle-preview__action > button[data-type="desktop"]');
                desktopButton?.click();

                // 点击原始知乎按钮
                const originalZhihuButton = document.querySelector('.layout__wnd--active .protyle:not(.fn__none) .protyle-preview .protyle-preview__action > button[data-type="zhihu"]');
                originalZhihuButton?.click();

            } catch (error) {
                console.error('知乎处理过程中出错:', error);
                await Utils.showNotification(`处理失败: ${error.message}`);
            }
        }

        /**
         * Markdown按钮点击处理
         */
        static async handleMarkdownButtonClick(event) {
            await Utils.showNotification("正在处理文档导出到Markdown...", 3000);

            try {
                const protyle = Utils.getProtyle();
                const docId = Utils.getCurrentDocumentId();
                const id = protyle.block.id || protyle.options.blockId || protyle.block.parentID;
                if (!docId) {
                    throw new Error('无法获取当前文档ID');
                }

                // 获取图床选择（限定当前激活窗口与活动编辑器）
                const activeContainer = document.querySelector('.layout__wnd--active .protyle:not(.fn__none) .protyle-preview .protyle-preview__action');
                const imageHostSelect = activeContainer?.querySelector('.image-host-select');
                const imageHostType = imageHostSelect ? imageHostSelect.value : CONSTANTS.IMAGE_HOST_TYPE.DEFAULT;

                // 检测h1标题情况
                const h1Info = await ButtonHandler.detectH1Heading(docId);
                let markdownContent = await ButtonHandler.exportMarkdownContent(id);
                let processedContent = markdownContent;

                // 清理零宽字符
                processedContent = ButtonHandler.removeZeroWidthCharacters(processedContent);


                // 获取标题编号选项（限定当前激活窗口与活动编辑器）
                const headingNumberSelect = activeContainer?.querySelector('.heading-number-select');
                const addHeadingNumbers = headingNumberSelect ? headingNumberSelect.value === 'yes' : false;

                // 添加标题编号
                if (addHeadingNumbers) {
                    processedContent = HeadingNumberProcessor.addNumbersToMarkdownHeadings(processedContent);
                }

                // 根据图床类型处理图片URL
                if (imageHostType === CONSTANTS.IMAGE_HOST_TYPE.PICGO) {
                    // 如果选择PicGo图床，使用图床映射替换
                    const picgoFileMapKey = await Utils.getDocumentAttribute(docId, 'custom-picgo-file-map-key');
                    if (picgoFileMapKey) {
                        processedContent = await ImageProcessor.replaceImageUrls(processedContent, picgoFileMapKey);
                    } else {
                        // 没有图床映射时为相对路径图片添加默认前缀
                        processedContent = ImageProcessor.addDefaultPrefixToImages(processedContent);
                    }
                } else {
                    // 如果选择默认图床，为相对路径图片添加默认前缀
                    processedContent = ImageProcessor.addDefaultPrefixToImages(processedContent);
                }

                // 处理块链接
                processedContent = await LinkProcessor.convertBlockLinksToWeChat(processedContent);

                // 添加相关笔记部分
                const relatedContent = await LinkProcessor.processRelatedDocuments(docId, 'markdown');
                if (relatedContent) {
                    processedContent += relatedContent;
                }

                // 复制到剪贴板
                await Utils.copyToClipboard(processedContent);

                // 点击桌面按钮
                const desktopButton = document.querySelector('.layout__wnd--active .protyle:not(.fn__none) .protyle-preview .protyle-preview__action > button[data-type="desktop"]');
                desktopButton?.click();

                await Utils.showNotification("文档已处理完成并复制到剪贴板！", 3000);

            } catch (error) {
                console.error('处理文档时出错:', error);
                await Utils.showNotification(`处理失败: ${error.message}`, 5000);
            }
        }

        /**
         * 检测文档中的h1标题情况
         */
        static async detectH1Heading(docId) {
            try {
                // 直接从DOM查找当前文档的标题元素
                const activeProtyle = document.querySelector('.protyle:not(.fn__none) .b3-typography');
                if (!activeProtyle) {
                    return { hasOnlyOneH1: false, h1Id: null, firstH1Id: null };
                }

                // 查找所有标题元素
                const h1Elements = activeProtyle.querySelectorAll('h1');


                // 检查是否只有一个h1标题
                const hasOnlyOneH1 = h1Elements.length === 1;
                let firstH1Id = null;
                let isFirstHeading = false;

                if (hasOnlyOneH1 && h1Elements.length > 0) {
                    const h1Element = h1Elements[0];
                    firstH1Id = h1Element.getAttribute('id');

                    // 检查h1是否是第一个标题（在它之前没有其他标题）
                    const h1Index = Array.from(h1Elements).indexOf(h1Element);
                    isFirstHeading = h1Index === 0;
                }

                return {
                    hasOnlyOneH1: hasOnlyOneH1 && isFirstHeading,
                    h1Id: hasOnlyOneH1 && isFirstHeading ? firstH1Id : null,
                    firstH1Id: firstH1Id
                };
            } catch (error) {
                console.error('检测h1标题时出错:', error);
                return { hasOnlyOneH1: false, h1Id: null, firstH1Id: null };
            }
        }

        /**
         * 调整标题层级（将最高级别的标题调整为h1）
         */
        static adjustHeadingLevels(content) {
            const lines = content.split('\n');
            let inCodeBlock = false;
            let codeBlockFence = '';
            let minHeadingLevel = 7; // 初始化为一个大于6的值

            // 第一遍扫描：找到最小的标题层级
            for (const line of lines) {
                // 检测代码块边界
                const codeBlockMatch = line.match(/^(\s*)(```|~~~)(.*)$/);
                if (codeBlockMatch) {
                    const [, indent, fence, language] = codeBlockMatch;
                    if (!inCodeBlock) {
                        inCodeBlock = true;
                        codeBlockFence = fence;
                    } else if (fence === codeBlockFence && indent.length === 0) {
                        inCodeBlock = false;
                        codeBlockFence = '';
                    }
                    continue;
                }

                // 如果在代码块内，跳过
                if (inCodeBlock) {
                    continue;
                }

                // 检测行内代码块
                const inlineCodeCount = (line.match(/`/g) || []).length;
                const hasInlineCode = inlineCodeCount >= 2 && inlineCodeCount % 2 === 0;

                // 检测标题
                const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
                if (headingMatch && !hasInlineCode) {
                    const level = headingMatch[1].length;
                    minHeadingLevel = Math.min(minHeadingLevel, level);
                }
            }

            // 如果没有找到标题或最小层级已经是1，直接返回原内容
            if (minHeadingLevel >= 7 || minHeadingLevel === 1) {
                return content;
            }

            // 计算需要调整的层级差
            const levelAdjustment = minHeadingLevel - 1;

            // 重置状态进行第二遍处理
            inCodeBlock = false;
            codeBlockFence = '';

            // 第二遍处理：调整标题层级
            const processedLines = lines.map(line => {
                // 检测代码块边界
                const codeBlockMatch = line.match(/^(\s*)(```|~~~)(.*)$/);
                if (codeBlockMatch) {
                    const [, indent, fence, language] = codeBlockMatch;
                    if (!inCodeBlock) {
                        inCodeBlock = true;
                        codeBlockFence = fence;
                    } else if (fence === codeBlockFence && indent.length === 0) {
                        inCodeBlock = false;
                        codeBlockFence = '';
                    }
                    return line;
                }

                // 如果在代码块内，直接返回原行
                if (inCodeBlock) {
                    return line;
                }

                // 检测行内代码块
                const inlineCodeCount = (line.match(/`/g) || []).length;
                const hasInlineCode = inlineCodeCount >= 2 && inlineCodeCount % 2 === 0;

                // 处理标题
                const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
                if (headingMatch && !hasInlineCode) {
                    const currentLevel = headingMatch[1].length;
                    const newLevel = Math.max(1, currentLevel - levelAdjustment);
                    const headingText = headingMatch[2];

                    // 确保新层级不超过6
                    const finalLevel = Math.min(6, newLevel);
                    return `${'#'.repeat(finalLevel)} ${headingText}`;
                }

                return line;
            });

            return processedLines.join('\n');
        }

        /**
         * 清理零宽字符
         */
        static removeZeroWidthCharacters(content) {
            // 清理常见的零宽字符
            return content.replace(/[\u200D]/g, '');
        }

        /**
         * 导出markdown内容
         * imgTag 设为 true 表示思源将使用 <img> 标签导出图片
         */
        static async exportMarkdownContent(docId) {
            const data = { id: docId, yfm: false, fillCSSVar: true, adjustHeadingLevel: true, imgTag: true };
            const res = await Utils.fetchSyncPost('/api/export/exportMdContent', data);

            if (!res?.data?.content) {
                throw new Error('导出markdown内容失败');
            }
            return res.data.content;
        }
    }

    // UI管理类
    class UIManager {
        /**
         * 添加自定义按钮
         */
        static addCustomButton() {
            const actionContainers = document.querySelectorAll('.layout__wnd--active .protyle:not(.fn__none) .protyle-preview .protyle-preview__action');

            actionContainers.forEach(container => {
                // 检查是否已添加按钮以避免重复
                if (container.querySelector('.mp-wechat-enhanced-controls') ||
                    container.querySelector('.markdown-enhanced-button')) {
                    return;
                }

                UIManager.addWeChatEnhancedControls(container);
                UIManager.addNewZhihuButton(container);
                UIManager.addMarkdownButton(container);
            });

            ContentProcessor.processMathFormulas();
        }

        /**
         * 添加微信公众号增强控件
         */
        static addWeChatEnhancedControls(container) {
            const controlsWrapper = document.createElement('div');
            controlsWrapper.className = 'mp-wechat-enhanced-controls';
            Object.assign(controlsWrapper.style, {
                display: 'inline-flex',
                alignItems: 'center',
                marginLeft: '8px',
                gap: '4px'
            });

            // 创建微信按钮
            const wechatButton = UIManager.createButton({
                type: 'mp-wechat-enchaced',
                label: '粘贴到公众号样式适配',
                icon: '#iconMp',
                handler: ButtonHandler.handleWechatButtonClick
            });

            // 创建链接转换选择下拉框
            const linkSelect = UIManager.createLinkConversionSelect();

            // 创建链接优先级选择下拉框（微信公众号 vs 知乎）
            const linkPrioritySelect = UIManager.createLinkPrioritySelect();

            // 创建标题编号选择下拉框
            const headingSelect = UIManager.createHeadingNumberSelect();

            // 创建图床选择下拉框
            const imageHostSelect = UIManager.createImageHostSelect();

            // 创建是否添加公众号名片选择下拉框
            const wechatCardSelect = UIManager.createWeChatCardSelect();

            controlsWrapper.appendChild(wechatButton);
            controlsWrapper.appendChild(linkSelect);
            controlsWrapper.appendChild(linkPrioritySelect);
            controlsWrapper.appendChild(headingSelect);
            controlsWrapper.appendChild(imageHostSelect);
            controlsWrapper.appendChild(wechatCardSelect);

            // 插入到容器中
            const originalWechatButton = container.querySelector('button[data-type="mp-wechat"]');
            if (originalWechatButton) {
                container.insertBefore(controlsWrapper, originalWechatButton);
            } else {
                container.appendChild(controlsWrapper);
            }
        }

        /**
         * 创建链接优先级选择下拉框
         */
        static createLinkPrioritySelect() {
            const select = document.createElement('select');
            select.className = 'link-priority-select b3-select';
            Object.assign(select.style, {
                height: '24px',
                fontSize: '12px',
                minWidth: '120px'
            });

            const current = localStorage.getItem('siyuan_link_priority') || CONSTANTS.LINK_PRIORITY || 'wechat';

            const options = [
                { value: 'wechat', text: '优先使用微信公众号链接', selected: current === 'wechat' },
                { value: 'zhihu', text: '优先使用知乎链接', selected: current === 'zhihu' }
            ];

            options.forEach(({ value, text, selected }) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                option.selected = selected || false;
                select.appendChild(option);
            });

            select.addEventListener('change', (event) => {
                const val = event.target.value;
                localStorage.setItem('siyuan_link_priority', val);
                CONSTANTS.LINK_PRIORITY = val;
            });

            return select;
        }

        /**
         * 添加新知乎按钮
         */
        static addNewZhihuButton(container) {
            const zhihuButton = container.querySelector('button[data-type="zhihu"]');
            if (!zhihuButton || container.querySelector('button[data-type="new_zhihu"]')) {
                return;
            }

            const newZhihuButton = UIManager.createButton({
                type: 'new_zhihu',
                label: '知乎样式转换（仅处理思源块链接）',
                icon: '#iconZhihu',
                handler: ButtonHandler.handleNewZhihuButtonClick
            });

            zhihuButton.parentNode.insertBefore(newZhihuButton, zhihuButton.nextSibling);
        }

        /**
         * 添加Markdown按钮
         */
        static addMarkdownButton(container) {
            const markdownButton = UIManager.createButton({
                type: 'markdown-enhanced',
                className: 'markdown-enhanced-button',
                label: '复制Markdown（图床链接转换）',
                icon: '#iconMarkdown',
                handler: ButtonHandler.handleMarkdownButtonClick
            });

            container.appendChild(markdownButton);
        }

        /**
         * 创建按钮
         */
        static createButton({ type, className = '', label, icon, handler }) {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.type = type;
            button.dataset.custom = 'true';
            button.className = `b3-tooltips b3-tooltips__w ${className}`;
            button.setAttribute('aria-label', label);
            button.innerHTML = `<svg><use xlink:href="${icon}"></use></svg>`;

            Object.assign(button.style, {
                color: "var(--b3-theme-primary)",
                backgroundColor: "#e6f7ff",
                border: "1px solid #91d5ff",
                borderRadius: "4px",
                padding: "4px 8px",
                marginLeft: "8px"
            });

            button.addEventListener('click', handler);
            return button;
        }

        /**
         * 创建链接转换选择下拉框
         */
        static createLinkConversionSelect() {
            const select = document.createElement('select');
            select.className = 'link-conversion-select b3-select';
            Object.assign(select.style, {
                height: '24px',
                fontSize: '12px',
                minWidth: '120px'
            });

            const options = [
                { value: 'convert', text: '微信公众号外链暴露', selected: true },
                { value: 'no-convert', text: '仅处理思源块链接' }
            ];

            options.forEach(({ value, text, selected }) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                option.selected = selected || false;
                select.appendChild(option);
            });

            return select;
        }

        /**
         * 创建标题编号选择下拉框
         */
        static createHeadingNumberSelect() {
            const select = document.createElement('select');
            select.className = 'heading-number-select b3-select';
            Object.assign(select.style, {
                height: '24px',
                fontSize: '12px',
                minWidth: '100px'
            });

            const options = [
                { value: 'no', text: '不添加编号', selected: false },
                { value: 'yes', text: '添加标题编号', selected: true }
            ];

            options.forEach(({ value, text, selected }) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                option.selected = selected || false;
                select.appendChild(option);
            });

            return select;
        }

        /**
         * 创建图床选择下拉框
         */
        static createImageHostSelect() {
            const select = document.createElement('select');
            select.className = 'image-host-select b3-select';
            Object.assign(select.style, {
                height: '24px',
                fontSize: '12px',
                minWidth: '100px'
            });

            const options = [
                { value: CONSTANTS.IMAGE_HOST_TYPE.DEFAULT, text: '默认图床', selected: true },
                { value: CONSTANTS.IMAGE_HOST_TYPE.PICGO, text: 'PicGo图床', selected: false }
            ];

            options.forEach(({ value, text, selected }) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                option.selected = selected || false;
                select.appendChild(option);
            });

            return select;
        }

        /**
         * 创建是否添加公众号名片选择下拉框
         */
        static createWeChatCardSelect() {
            const select = document.createElement('select');
            select.className = 'wechat-card-select b3-select';
            Object.assign(select.style, {
                height: '24px',
                fontSize: '12px',
                minWidth: '100px'
            });

            const options = [
                { value: 'yes', text: '添加微信名片', selected: false },
                { value: 'no', text: '不添加名片', selected: true }
            ];

            options.forEach(({ value, text, selected }) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                option.selected = selected;
                select.appendChild(option);
            });

            select.addEventListener('change', (event) => {
                CONSTANTS.ADD_WECHAT_CARD = event.target.value === 'yes';
            });

            return select;
        }

        /**
         * 创建选择下拉框（保持兼容性）
         */
        static createSelect() {
            return UIManager.createLinkConversionSelect();
        }

    }

    // DOM观察器
    class DOMObserver {
        /**
         * 观察DOM变化
         */
        static observeDomChange(targetNode, callback) {
            const config = { childList: true, subtree: true };
            const observer = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        callback(mutation);
                    }
                }
            });
            observer.observe(targetNode, config);
            return observer;
        }
    }

    // 初始化
    function init() {
        const targetNode = document.body;
        DOMObserver.observeDomChange(targetNode, (mutation) => {
            if (mutation.target.querySelector('.b3-typography')) {
                UIManager.addCustomButton();
            }
        });
    }

    // 启动应用
    init();
})();