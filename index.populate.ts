import { join } from "path";
import { readdirSync, readFileSync } from "fs";
import { updateDeck } from "./lib/backend";

const decksDir = join(__dirname, "public/decks");

async function uploadFiles(files: string[]) {
  for (const file of files) {
    if (file.endsWith(".json")) {
      try {
        const filePath = join(decksDir, file);
        const fileContent = readFileSync(filePath, "utf8");
        const deck = JSON.parse(fileContent);
        await updateDeck(deck);
        console.log(`✅ Deck ${deck.id} updated, ${deck.words.length} cards`);
      } catch (error) {
        console.error(`🛑 Deck failed to update,`, error);
      }
    }
  }
}

async function populateDecks() {
  try {
    const files = readdirSync(decksDir);
    await uploadFiles(files);
  } catch (error) {
    console.error("Error reading decks directory:", error);
  }

  console.log("Decks populated");
  process.exit();
}

populateDecks();
