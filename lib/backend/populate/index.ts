// create Arabic deck

import { updateDeck } from "..";

const deck: Deck = {
  id: "arabic",
  name: "Arabic",
  color: "#228C22",
  words: [
    {
      front: "بَيْتٌ",
      back: "house",
    },
    {
      front: "وَلَدٌ",
      back: "boy",
    },
    {
      front: "طَالِبٌ",
      back: "student",
    },
    {
      front: "مَسْجِدٌ",
      back: "mosque",
    },
    {
      front: "رَجُلٌ",
      back: "man",
    },
    {
      front: "بَابٌ",
      back: "door",
    },
    {
      front: "تَاجِرٌ",
      back: "merchant",
    },
    {
      front: "كِتَابٌ",
      back: "book",
    },
    {
      front: "كَلْبٌ",
      back: "dog",
    },
    {
      front: "قَلَمٌ",
      back: "pen",
    },
    {
      front: "قِطٌّ",
      back: "cat",
    },
    {
      front: "مِفْتَاحٌ",
      back: "key",
    },
    {
      front: "حِمَارٌ",
      back: "donkey",
    },
    {
      front: "مَكْتَبٌ",
      back: "writing table",
    },
    {
      front: "حِصَانٌ",
      back: "horse",
    },
    {
      front: "سَرِيْرٌ",
      back: "bed",
    },
    {
      front: "جَمَلٌ",
      back: "camel",
    },
    {
      front: "كُرْسِيٌ",
      back: "chair",
    },
    {
      front: "دِيْكٌ",
      back: "rooster",
    },
    {
      front: "نَجْمٌ",
      back: "star",
    },
    {
      front: "مُدَرِّسٌ",
      back: "teacher",
    },
    {
      front: "قَمِيْصٌ",
      back: "shirt",
    },
    {
      front: "مِنْدِيْلٌ",
      back: "kercheif",
    },
    {
      front: "طَبِيْبٌ",
      back: "doctor",
    },
  ],
};

updateDeck(deck);
