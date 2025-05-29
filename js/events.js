// events.js
export function setupPrintListener(generatePrintPreview) {
    const tryAttachListener = (attempt = 1, maxAttempts = 10) => {
        const printButton = document.getElementById("printButton");
        console.log(`Print listener - Attempt ${attempt} - Looking for printButton: ${printButton ? "Found" : "Not found"}`);

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
            console.warn(`Print button not found, retrying (${attempt}/${maxAttempts})`);
            setTimeout(() => tryAttachListener(attempt + 1, maxAttempts), 500);
        } else {
            console.error("Print button not found after max attempts");
        }
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
        tryAttachListener();
    } else {
        document.addEventListener("DOMContentLoaded", () => {
            console.log("Print listener - DOMContentLoaded fired");
            tryAttachListener();
        });
    }
}
