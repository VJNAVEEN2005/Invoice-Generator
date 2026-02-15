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
