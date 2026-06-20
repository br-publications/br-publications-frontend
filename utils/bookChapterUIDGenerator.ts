import { getAllPublishedChapters } from '../services/bookChapterPublishing.service';

/**
 * Converts a 1-based sequential ID into a custom alphanumeric sequence:
 * - 1 to 99: "01" to "99"
 * - 100 to 198: "A01" to "A99"
 * - 199 to 297: "B01" to "B99"
 * - ... up to Z01 to Z99
 * - then AA01 to AA99, AB01 to AB99, and so on.
 */
export function generateUIDFromId(id: number): string {
    if (id <= 0) return '01';
    if (id <= 99) {
        return String(id).padStart(2, '0');
    }
    const val = id - 100;
    const letterIndex = Math.floor(val / 99);
    const numericPart = (val % 99) + 1;

    let prefix = '';
    let temp = letterIndex;
    while (temp >= 0) {
        const remainder = temp % 26;
        prefix = String.fromCharCode(65 + remainder) + prefix;
        temp = Math.floor(temp / 26) - 1;
    }

    return prefix + String(numericPart).padStart(2, '0');
}

/**
 * Fetches all published book chapters to find the largest ID,
 * increments it, and generates the next corresponding UID.
 */
export async function generateNextBookChapterUID(): Promise<string> {
    try {
        const response = await getAllPublishedChapters({ limit: 1000, includeHidden: true });
        const items = response.items || [];
        let maxId = 0;
        if (items && items.length > 0) {
            for (const item of items) {
                if (item.id && item.id > maxId) {
                    maxId = item.id;
                }
            }
        }
        const nextId = maxId + 1;
        return generateUIDFromId(nextId);
    } catch (error) {
        console.error('Error generating next book chapter UID:', error);
        return generateUIDFromId(1);
    }
}
