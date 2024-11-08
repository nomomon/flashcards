import { join } from "path";
import { readdirSync, readFileSync } from "fs";
import { updateDeck } from "./lib/backend";

const decksDir = join(__dirname, "public/decks");

try {
    const files = readdirSync(decksDir);
    files.forEach((file) => {
        if (file.endsWith(".json")) {
            try {
                const filePath = join(decksDir, file);
                const fileContent = readFileSync(filePath, "utf8");
                const deck = JSON.parse(fileContent);
                updateDeck(deck);
            } catch (error) {
                console.error(`Error processing file ${file}:`, error);
            }
        }
    });
} catch (error) {
    console.error("Error reading decks directory:", error);
}

console.log("Decks populated");
process.exit();