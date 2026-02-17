import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile, BaseDirectory } from "@tauri-apps/plugin-fs";

export async function generatePDF(elementId, defaultFilename = "invoice.pdf") {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error("Element not found:", elementId);
        return false;
    }

    try {
        // Create a clone to render the full content (ignoring scroll)
        const clone = element.cloneNode(true);
        clone.style.width = "794px"; // A4 width at 96 DPI approx
        clone.style.height = "auto";
        clone.style.position = "absolute";
        clone.style.top = "-9999px";
        clone.style.left = "-9999px";
        clone.style.overflow = "visible";
        document.body.appendChild(clone);

        const canvas = await html2canvas(clone, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            windowWidth: 794,
        });

        document.body.removeChild(clone);

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

        // Get native save dialog
        const filePath = await save({
            defaultPath: defaultFilename,
            filters: [{
                name: 'PDF',
                extensions: ['pdf']
            }]
        });

        if (filePath) {
            const pdfOutput = pdf.output("arraybuffer");
            await writeFile(filePath, new Uint8Array(pdfOutput));
            return true;
        }

        return false; // User cancelled

    } catch (err) {
        console.error("PDF Generation failed:", err);
        return false;
    }
}

export async function printPDF(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error("Element not found:", elementId);
        return false;
    }

    try {
        // Create a clone to render the full content (ignoring scroll)
        const clone = element.cloneNode(true);
        clone.style.width = "794px"; // A4 width at 96 DPI approx
        clone.style.height = "auto";
        clone.style.position = "absolute";
        clone.style.top = "-9999px";
        clone.style.left = "-9999px";
        clone.style.overflow = "visible";
        document.body.appendChild(clone);

        const canvas = await html2canvas(clone, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            windowWidth: 794,
        });

        document.body.removeChild(clone);

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

        // Use iframe specific printing logic
        const blobUrl = pdf.output("bloburl");
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);

        iframe.onload = () => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();

            // Cleanup logic - remove iframe after print
            setTimeout(() => {
                document.body.removeChild(iframe);
                if (window.URL) {
                    window.URL.revokeObjectURL(blobUrl);
                }
            }, 60000);
        };

        return true;

    } catch (err) {
        console.error("PDF Print failed:", err);
        return false;
    }
}
// Copy invoice image to clipboard
export async function copyInvoiceToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error("Element not found:", elementId);
        return false;
    }

    try {
        // Create a clone to render the full content
        const clone = element.cloneNode(true);
        clone.style.width = "794px"; // A4 width
        clone.style.height = "auto";
        clone.style.position = "absolute";
        clone.style.top = "-9999px";
        clone.style.left = "-9999px";
        clone.style.overflow = "visible";
        document.body.appendChild(clone);

        const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            windowWidth: 794,
        });

        document.body.removeChild(clone);

        return new Promise((resolve) => {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    resolve(false);
                    return;
                }
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            [blob.type]: blob
                        })
                    ]);
                    resolve(true);
                } catch (err) {
                    console.error("Clipboard write failed:", err);
                    resolve(false);
                }
            }, 'image/png');
        });

    } catch (err) {
        console.error("Copy to clipboard failed:", err);
        return false;
    }
}

// Share invoice image using native share or return false
export async function shareInvoice(elementId, invoiceId) {
    const element = document.getElementById(elementId);
    if (!element) return false;

    try {
        // Clone and render (Reuse logic or extract to helper if possible, but for now copying is safer)
        const clone = element.cloneNode(true);
        clone.style.width = "794px";
        clone.style.height = "auto";
        clone.style.position = "absolute";
        clone.style.top = "-9999px";
        clone.style.left = "-9999px";
        clone.style.overflow = "visible";
        document.body.appendChild(clone);

        const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            windowWidth: 794,
        });

        document.body.removeChild(clone);

        return new Promise((resolve) => {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    resolve(false);
                    return;
                }

                const file = new File([blob], `Invoice-${invoiceId}.png`, { type: 'image/png' });

                // Try Native Share
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: `Invoice ${invoiceId}`,
                            text: `Please find attached Invoice ${invoiceId}`
                        });
                        resolve('shared'); // Explicitly return 'shared' to indicate native share success
                    } catch (err) {
                        if (err.name === 'AbortError') {
                            resolve('cancelled'); // User cancelled share dialog
                        } else {
                            console.error("Native share failed:", err);
                            resolve(false); // Fallback
                        }
                    }
                } else {
                    resolve(false); // Native share not supported
                }
            }, 'image/png');
        });

    } catch (err) {
        console.error("Share failed:", err);
        return false;
    }
}
