import { join } from 'path';
import { readFileSync } from 'fs';
import { updateDeck } from './lib/backend';

const file = readFileSync(join(__dirname, 'public/decks', "dutch.json"), 'utf8');
const deck = JSON.parse(file);

updateDeck(deck);