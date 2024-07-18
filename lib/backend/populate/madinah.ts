// create Arabic deck

import { updateDeck } from "..";

const deck: Deck = {
  id: "arabic",
  name: "Madinah Arabic 1",
  color: "#228C22",
  languages: {
    front: "Arabic",
    back: "English",
  },
  words: [
    {
      front: "بَيْتٌ",
      back: "house",
      tags: ["lesson_1"],
    },
    {
      front: "وَلَدٌ",
      back: "boy",
      tags: ["lesson_1"],
    },
    {
      front: "طَالِبٌ",
      back: "student",
      tags: ["lesson_1"],
    },
    {
      front: "مَسْجِدٌ",
      back: "mosque",
      tags: ["lesson_1"],
    },
    {
      front: "رَجُلٌ",
      back: "man",
      tags: ["lesson_1"],
    },
    {
      front: "بَابٌ",
      back: "door",
      tags: ["lesson_1"],
    },
    {
      front: "تَاجِرٌ",
      back: "merchant",
      tags: ["lesson_1"],
    },
    {
      front: "كِتَابٌ",
      back: "book",
      tags: ["lesson_1"],
    },
    {
      front: "كَلْبٌ",
      back: "dog",
      tags: ["lesson_1"],
    },
    {
      front: "قَلَمٌ",
      back: "pen",
      tags: ["lesson_1"],
    },
    {
      front: "قِطٌّ",
      back: "cat",
      tags: ["lesson_1"],
    },
    {
      front: "مِفْتَاحٌ",
      back: "key",
      tags: ["lesson_1"],
    },
    {
      front: "حِمَارٌ",
      back: "donkey",
      tags: ["lesson_1"],
    },
    {
      front: "مَكْتَبٌ",
      back: "writing table",
      tags: ["lesson_1"],
    },
    {
      front: "حِصَانٌ",
      back: "horse",
      tags: ["lesson_1"],
    },
    {
      front: "سَرِيْرٌ",
      back: "bed",
      tags: ["lesson_1"],
    },
    {
      front: "جَمَلٌ",
      back: "camel",
      tags: ["lesson_1"],
    },
    {
      front: "كُرْسِيٌ",
      back: "chair",
      tags: ["lesson_1"],
    },
    {
      front: "دِيْكٌ",
      back: "rooster",
      tags: ["lesson_1"],
    },
    {
      front: "نَجْمٌ",
      back: "star",
      tags: ["lesson_1"],
    },
    {
      front: "مُدَرِّسٌ",
      back: "teacher",
      tags: ["lesson_1"],
    },
    {
      front: "قَمِيْصٌ",
      back: "shirt",
      tags: ["lesson_1"],
    },
    {
      front: "مِنْدِيْلٌ",
      back: "handkerchief",
      tags: ["lesson_1"],
    },
    {
      front: "طَبِيْبٌ",
      back: "doctor",
      tags: ["lesson_1"],
    },
    {
      front: "مَا هَذَا؟",
      back: "what is this?",
      tags: ["lesson_1"],
    },
    {
      front: "أَهَذَا بَيتٌ؟",
      back: "is this a house?",
      tags: ["lesson_1"],
    },
    {
      front: "نَعَمْ",
      back: "yes",
      tags: ["lesson_1"],
    },
    {
      front: "لَا",
      back: "no",
      tags: ["lesson_1"],
    },
    {
      front: "هَذَا كِتَابٌ",
      back: "this is a book",
      tags: ["lesson_1"],
    },
    {
      front: "هَذَا بَيْتٌ",
      back: "this is a house",
      tags: ["lesson_1"],
    },
    {
      front: "مَنْ هَذَا؟",
      back: "who is this?",
      tags: ["lesson_1"],
    },
    {
      front: "هَذَا",
      back: "this",
      tags: ["lesson_2"],
    },
    {
      front: "ذَلِكَ",
      back: "that",
      tags: ["lesson_2"],
    },
    {
      front: "إِمَامٌ",
      back: "imam",
      tags: ["lesson_2"],
    },
    {
      front: "سُكَّرٌ",
      back: "sugar",
      tags: ["lesson_2"],
    },
    {
      front: "لَبَنٌ",
      back: "milk",
      tags: ["lesson_2"],
    },
    {
      front: "حَجَرٌ",
      back: "stone",
      tags: ["lesson_2"],
    },
    {
      front: "وَ",
      back: "and",
      tags: ["lesson_2"],
    },
    {
      front: "البَيْتُ",
      back: "the house",
      tags: ["lesson_3"],
    },
    {
      front: "القَمَرُ",
      back: "the moon",
      tags: ["lesson_3"],
    },
    {
      front: "الشَّمْسُ",
      back: "the sun",
      tags: ["lesson_3"],
    },
    {
      front: "البَبُ مَفْتُوحٌ",
      back: "the door is open",
      tags: ["lesson_3"],
    },
    {
      front: "القَلَمُ مَكْسُوْرٌ",
      back: "the pen is broken",
      tags: ["lesson_3"],
    },
    {
      front: "فَقِيْرٌ",
      back: "poor",
      tags: ["lesson_3"],
    },
    {
      front: "غَنِيٌّ",
      back: "rich",
      tags: ["lesson_3"],
    },
    {
      front: "قَصِيْرٌ",
      back: "short",
      tags: ["lesson_3"],
    },
    {
      front: "طَوِيْلٌّ",
      back: "tall",
      tags: ["lesson_3"],
    },
    {
      front: "حَارٌّ",
      back: "hot",
      tags: ["lesson_3"],
    },
    {
      front: "بَارِدٌّ",
      back: "cold",
      tags: ["lesson_3"],
    },
    {
      front: "وَاقِفٌ",
      back: "standing",
      tags: ["lesson_3"],
    },
    {
      front: "جَالِسٌ",
      back: "sitting",
      tags: ["lesson_3"],
    },
    {
      front: "قَدِيْمٌ",
      back: "old",
      tags: ["lesson_3"],
    },
    {
      front: "جَدِيْدٌ",
      back: "new",
      tags: ["lesson_3"],
    },
    {
      front: "بَعِيْدٌ",
      back: "far away",
      tags: ["lesson_3"],
    },
    {
      front: "قَرِيْبٌ",
      back: "near",
      tags: ["lesson_3"],
    },
    {
      front: "وَسِخٌ",
      back: "dirty",
      tags: ["lesson_3"],
    },
    {
      front: "نَظِيْفٌ",
      back: "clean",
      tags: ["lesson_3"],
    },
    {
      front: "كَبِيْرٌ",
      back: "big",
      tags: ["lesson_3"],
    },
    {
      front: "صَغِيْرٌ",
      back: "small",
      tags: ["lesson_3"],
    },
    {
      front: "ثَقِيْلٌ",
      back: "heavy",
      tags: ["lesson_3"],
    },
    {
      front: "خَفِيْفٌ",
      back: "light",
      tags: ["lesson_3"],
    },
    {
      front: "المَاءُ",
      back: "the water",
      tags: ["lesson_3"],
    },
    {
      front: "الوَرَقُ",
      back: "the paper",
      tags: ["lesson_3"],
    },
    {
      front: "جَمِيْلٌ",
      back: "beautiful",
      tags: ["lesson_3"],
    },
    {
      front: "التُّفَّاحُ",
      back: "the apple",
      tags: ["lesson_3"],
    },
    {
      front: "حُلْوٌ",
      back: "sweet",
      tags: ["lesson_3"],
    },
    {
      front: "الدُّكَّانُ",
      back: "the shop",
      tags: ["lesson_3"],
    },
    {
      front: "مَرِيْضٌ",
      back: "sick",
      tags: ["lesson_3"],
    },
    {
      front: "لَذِيْذٌ",
      back: "delicious",
      tags: ["lesson_3"],
    },
    {
      front: "أَيْنَ",
      back: "where",
      tags: ["lesson_4"],
    },
    {
      front: "عَلَى",
      back: "on",
      tags: ["lesson_4"],
    },
    {
      front: "السَّمَءُ",
      back: "the sky",
      tags: ["lesson_4"],
    },
    {
      front: "الفَصْلُ",
      back: "the classroom",
      tags: ["lesson_4"],
    },
    {
      front: "غُرْفَةٌ",
      back: "room",
      tags: ["lesson_4"],
    },
    {
      front: "الحَمَّامُ",
      back: "the bathroom",
      tags: ["lesson_4"],
    },
    {
      front: "المِرْحَاضُ",
      back: "the toilet",
      tags: ["lesson_4"],
    },
    {
      front: "المَطْبَخُ",
      back: "kitchen",
      tags: ["lesson_4"],
    },
    {
      front: "فِي",
      back: "in",
      tags: ["lesson_4"],
    },
    {
      front: "هَذِهِ",
      back: "this (♀)",
      tags: ["lesson_6"],
    },
    {
      front: "تِلْكَ",
      back: "that (♀)",
      tags: ["lesson_7"],
    },
  ],
};

updateDeck(deck);
