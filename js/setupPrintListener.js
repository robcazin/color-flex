import { generatePrintPreview } from './printPreview.js';

export function setupPrintListener() {
    const tryAttachListener = (attempt = 1, maxAttempts = 10) => {
        const printButton = document.getElementById("printButton");

        if (printButton) {
            const newButton = printButton.cloneNode(true);
            printButton.parentNode.replaceChild(newButton, printButton);

            newButton.addEventListener("click", async () => {
                console.log("Print preview triggered");
                const result = await generatePrintPreview();
                if (!result) {
                    console.error("Print preview - Failed to generate output");
                }
            });

            console.log("Print listener attached");
        } else if (attempt < maxAttempts) {
            setTimeout(() => tryAttachListener(attempt + 1, maxAttempts), 500);
        } else {
            console.error("Print button not found after max attempts");
        }
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
        tryAttachListener();
    } else {
        document.addEventListener("DOMContentLoaded", tryAttachListener);
    }
}
