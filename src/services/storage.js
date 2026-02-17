import { BaseDirectory, readTextFile, writeTextFile, mkdir, exists, readDir, remove } from '@tauri-apps/plugin-fs';

const BASE_DIR = BaseDirectory.AppData;
const INVOICES_DIR = 'invoices';
const DATA_FILE = 'data.json'; // For clients, products, settings

// Ensure directories exist
async function initStorage() {
    try {
        const hasDir = await exists(INVOICES_DIR, { baseDir: BASE_DIR });
        if (!hasDir) {
            await mkdir(INVOICES_DIR, { baseDir: BASE_DIR, recursive: true });
        }
    } catch (err) {
        console.error("Failed to init storage", err);
    }
}

// Invoices
export async function saveInvoiceToDisk(invoice) {
    await initStorage();
    try {
        await writeTextFile(
            `${INVOICES_DIR}/${invoice.id}.json`,
            JSON.stringify(invoice, null, 2),
            { baseDir: BASE_DIR }
        );
        return { success: true };
    } catch (err) {
        console.error("Failed to save invoice", err);
        return { success: false, error: err.message || String(err) };
    }
}

export async function loadInvoiceFromDisk(id) {
    try {
        const content = await readTextFile(`${INVOICES_DIR}/${id}.json`, { baseDir: BASE_DIR });
        return JSON.parse(content);
    } catch (err) {
        console.error("Failed to load invoice", err);
        return null;
    }
}

// Global Data (Clients, Products)
export async function saveGlobalData(data) {
    await initStorage();
    try {
        await writeTextFile(DATA_FILE, JSON.stringify(data, null, 2), { baseDir: BASE_DIR });
    } catch (err) {
        console.error("Failed to save global data", err);
    }
}

export async function loadGlobalData() {
    try {
        if (await exists(DATA_FILE, { baseDir: BASE_DIR })) {
            const content = await readTextFile(DATA_FILE, { baseDir: BASE_DIR });
            if (!content || content.trim() === "") return null;
            return JSON.parse(content);
        }
    } catch (err) {
        console.error("Failed to load global data", err);
    }
    return null;
}

// List all saved invoices
export async function listInvoicesFromDisk() {
    await initStorage();
    try {
        const entries = await readDir(INVOICES_DIR, { baseDir: BASE_DIR });
        const invoices = [];
        for (const entry of entries) {
            if (entry.name && entry.name.endsWith('.json')) {
                try {
                    const content = await readTextFile(`${INVOICES_DIR}/${entry.name}`, { baseDir: BASE_DIR });
                    invoices.push(JSON.parse(content));
                } catch (e) {
                    console.error(`Failed to parse ${entry.name}`, e);
                }
            }
        }
        return invoices;
    } catch (err) {
        console.error("Failed to list invoices", err);
        return [];
    }
}

// Delete an invoice
export async function deleteInvoiceFromDisk(id) {
    try {
        await remove(`${INVOICES_DIR}/${id}.json`, { baseDir: BASE_DIR });
        return true;
    } catch (err) {
        console.error("Failed to delete invoice", err);
        return false;
    }
}
