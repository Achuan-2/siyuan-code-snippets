(() => {
    let isProcessing = false;

    // Add mouseover event listener for image elements
    document.addEventListener('mouseover', (e) => {
        const imgContainer = e.target.closest('[data-type="img"]');
        if (!imgContainer || isProcessing) return;

        isProcessing = true;
        setTimeout(() => isProcessing = false, 100);

        // Skip if copy button already exists
        if (imgContainer.querySelector('.cst-copy-png')) return;

        const action = imgContainer.querySelector('.protyle-action');
        if (!action) return;

        // Adjust existing icon styles
        const actionIcon = action.querySelector('.protyle-icon');
        if (actionIcon) {
            actionIcon.style.borderTopLeftRadius = '0';
            actionIcon.style.borderBottomLeftRadius = '0';
        }

        // Add copy button
        const copyPngHtml = `
            <span class="protyle-icon protyle-icon--only protyle-custom cst-copy-png" 
                  style="border-top-right-radius:0;border-bottom-right-radius:0">
                <svg class="svg"><use xlink:href="#iconCopy"></use></svg>
            </span>`;
        action.insertAdjacentHTML('afterbegin', copyPngHtml);

        // Attach click handler
        const copyPngBtn = imgContainer.querySelector('.cst-copy-png');
        copyPngBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const imgSrc = imgContainer.querySelector('img')?.getAttribute("src");
            if (imgSrc) {
                await copyPNGByLink(imgSrc);
            }
        });
    });

    // Copy image to clipboard and show notification
    async function copyPNGByLink(link) {
        if (!link) return;

        try {
            if (isInAndroid()) {
                window.JSAndroid.writeImageClipboard(link);
                await showNotification("图片已复制到剪贴板");
                return;
            }

            const canvas = document.createElement("canvas");
            const tempImg = document.createElement("img");

            await new Promise((resolve, reject) => {
                tempImg.onload = () => {
                    canvas.width = tempImg.width;
                    canvas.height = tempImg.height;
                    canvas.getContext("2d").drawImage(tempImg, 0, 0);
                    resolve();
                };
                tempImg.onerror = () => reject(new Error("Failed to load image"));
                tempImg.src = link;
            });

            const blob = await new Promise((resolve) => {
                canvas.toBlob((blob) => resolve(blob), "image/png", 1);
            });

            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob })
            ]);

            await showNotification("图片已复制到剪贴板");
        } catch (error) {
            console.error("Copy image failed:", error);
            await showNotification("图片复制失败", true);
        }
    }

    // Show notification using SiYuan API
    async function showNotification(message, isError = false) {
        try {
            const data = {
                msg: message,
                timeout: 7000
            };
            const endpoint = isError ? '/api/notification/pushErrMsg' : '/api/notification/pushMsg';
            await fetchSyncPost(endpoint, data);
        } catch (error) {
            console.error("Notification failed:", error);
        }
    }

    // Fetch utility function
    async function fetchSyncPost(url, data, returnType = 'json') {
        const init = {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        };
        if (data) {
            init.body = JSON.stringify(data);
        }
        try {
            const res = await fetch(url, init);
            const res2 = returnType === 'json' ? await res.json() : await res.text();
            return res2;
        } catch (e) {
            console.error(e);
            return returnType === 'json' ? { code: e.code || 1, msg: e.message || "", data: null } : "";
        }
    }

    // Check if running on Android
    function isInAndroid() {
        return window.siyuan?.config?.system?.container === "android" && window.JSAndroid;
    }
})();