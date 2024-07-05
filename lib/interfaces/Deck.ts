interface Deck {
  id: string;
  name: string;
  languages: {
    front: string;
    back: string;
  };
  color: string;
  words: WordPair[];
}
