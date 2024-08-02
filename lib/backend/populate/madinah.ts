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
      tags: ["l_1"],
    },
    {
      front: "وَلَدٌ",
      back: "boy",
      tags: ["l_1"],
    },
    {
      front: "طَالِبٌ",
      back: "student",
      tags: ["l_1"],
    },
    {
      front: "مَسْجِدٌ",
      back: "mosque",
      tags: ["l_1"],
    },
    {
      front: "رَجُلٌ",
      back: "man",
      tags: ["l_1"],
    },
    {
      front: "بَابٌ",
      back: "door",
      tags: ["l_1"],
    },
    {
      front: "تَاجِرٌ",
      back: "merchant",
      tags: ["l_1"],
    },
    {
      front: "كِتَابٌ",
      back: "book",
      tags: ["l_1"],
    },
    {
      front: "كَلْبٌ",
      back: "dog",
      tags: ["l_1"],
    },
    {
      front: "قَلَمٌ",
      back: "pen",
      tags: ["l_1"],
    },
    {
      front: "قِطٌّ",
      back: "cat",
      tags: ["l_1"],
    },
    {
      front: "مِفْتَاحٌ",
      back: "key",
      tags: ["l_1"],
    },
    {
      front: "حِمَارٌ",
      back: "donkey",
      tags: ["l_1"],
    },
    {
      front: "مَكْتَبٌ",
      back: "writing table",
      tags: ["l_1"],
    },
    {
      front: "حِصَانٌ",
      back: "horse",
      tags: ["l_1"],
    },
    {
      front: "سَرِيْرٌ",
      back: "bed",
      tags: ["l_1"],
    },
    {
      front: "جَمَلٌ",
      back: "camel",
      tags: ["l_1"],
    },
    {
      front: "كُرْسِيٌ",
      back: "chair",
      tags: ["l_1"],
    },
    {
      front: "دِيْكٌ",
      back: "rooster",
      tags: ["l_1"],
    },
    {
      front: "نَجْمٌ",
      back: "star",
      tags: ["l_1"],
    },
    {
      front: "مُدَرِّسٌ",
      back: "teacher",
      tags: ["l_1"],
    },
    {
      front: "قَمِيْصٌ",
      back: "shirt",
      tags: ["l_1"],
    },
    {
      front: "مِنْدِيْلٌ",
      back: "handkerchief",
      tags: ["l_1"],
    },
    {
      front: "طَبِيْبٌ",
      back: "doctor",
      tags: ["l_1"],
    },
    {
      front: "مَا هَذَا؟",
      back: "what is this?",
      tags: ["l_1"],
    },
    {
      front: "أَهَذَا بَيتٌ؟",
      back: "is this a house?",
      tags: ["l_1"],
    },
    {
      front: "نَعَمْ",
      back: "yes",
      tags: ["l_1"],
    },
    {
      front: "لَا",
      back: "no",
      tags: ["l_1"],
    },
    {
      front: "هَذَا كِتَابٌ",
      back: "this is a book",
      tags: ["l_1"],
    },
    {
      front: "هَذَا بَيْتٌ",
      back: "this is a house",
      tags: ["l_1"],
    },
    {
      front: "مَنْ هَذَا؟",
      back: "who is this?",
      tags: ["l_1"],
    },
    {
      front: "هَذَا",
      back: "this",
      tags: ["l_2"],
    },
    {
      front: "ذَلِكَ",
      back: "that",
      tags: ["l_2"],
    },
    {
      front: "إِمَامٌ",
      back: "imam",
      tags: ["l_2"],
    },
    {
      front: "سُكَّرٌ",
      back: "sugar",
      tags: ["l_2"],
    },
    {
      front: "لَبَنٌ",
      back: "milk",
      tags: ["l_2"],
    },
    {
      front: "حَجَرٌ",
      back: "stone",
      tags: ["l_2"],
    },
    {
      front: "وَ",
      back: "and",
      tags: ["l_2"],
    },
    {
      front: "البَيْتُ",
      back: "the house",
      tags: ["l_3"],
    },
    {
      front: "القَمَرُ",
      back: "the moon",
      tags: ["l_3"],
    },
    {
      front: "الشَّمْسُ",
      back: "the sun",
      tags: ["l_3"],
    },
    {
      front: "البَبُ مَفْتُوحٌ",
      back: "the door is open",
      tags: ["l_3"],
    },
    {
      front: "القَلَمُ مَكْسُوْرٌ",
      back: "the pen is broken",
      tags: ["l_3"],
    },
    {
      front: "فَقِيْرٌ",
      back: "poor",
      tags: ["l_3"],
    },
    {
      front: "غَنِيٌّ",
      back: "rich",
      tags: ["l_3"],
    },
    {
      front: "قَصِيْرٌ",
      back: "short",
      tags: ["l_3"],
    },
    {
      front: "طَوِيْلٌّ",
      back: "tall",
      tags: ["l_3"],
    },
    {
      front: "حَارٌّ",
      back: "hot",
      tags: ["l_3"],
    },
    {
      front: "بَارِدٌّ",
      back: "cold",
      tags: ["l_3"],
    },
    {
      front: "وَاقِفٌ",
      back: "standing",
      tags: ["l_3"],
    },
    {
      front: "جَالِسٌ",
      back: "sitting",
      tags: ["l_3"],
    },
    {
      front: "قَدِيْمٌ",
      back: "old",
      tags: ["l_3"],
    },
    {
      front: "جَدِيْدٌ",
      back: "new",
      tags: ["l_3"],
    },
    {
      front: "بَعِيْدٌ",
      back: "far away",
      tags: ["l_3"],
    },
    {
      front: "قَرِيْبٌ",
      back: "near",
      tags: ["l_3"],
    },
    {
      front: "وَسِخٌ",
      back: "dirty",
      tags: ["l_3"],
    },
    {
      front: "نَظِيْفٌ",
      back: "clean",
      tags: ["l_3"],
    },
    {
      front: "كَبِيْرٌ",
      back: "big",
      tags: ["l_3"],
    },
    {
      front: "صَغِيْرٌ",
      back: "small",
      tags: ["l_3"],
    },
    {
      front: "ثَقِيْلٌ",
      back: "heavy",
      tags: ["l_3"],
    },
    {
      front: "خَفِيْفٌ",
      back: "light",
      tags: ["l_3"],
    },
    {
      front: "المَاءُ",
      back: "the water",
      tags: ["l_3"],
    },
    {
      front: "الوَرَقُ",
      back: "the paper",
      tags: ["l_3"],
    },
    {
      front: "جَمِيْلٌ",
      back: "beautiful",
      tags: ["l_3"],
    },
    {
      front: "التُّفَّاحُ",
      back: "the apple",
      tags: ["l_3"],
    },
    {
      front: "حُلْوٌ",
      back: "sweet",
      tags: ["l_3"],
    },
    {
      front: "الدُّكَّانُ",
      back: "the shop",
      tags: ["l_3"],
    },
    {
      front: "مَرِيْضٌ",
      back: "sick",
      tags: ["l_3"],
    },
    {
      front: "لَذِيْذٌ",
      back: "delicious",
      tags: ["l_3"],
    },
    {
      front: "أَيْنَ",
      back: "where",
      tags: ["l_4"],
    },
    {
      front: "عَلَى",
      back: "on",
      tags: ["l_4"],
    },
    {
      front: "السَّمَءُ",
      back: "the sky",
      tags: ["l_4"],
    },
    {
      front: "الفَصْلُ",
      back: "the classroom",
      tags: ["l_4"],
    },
    {
      front: "غُرْفَةٌ",
      back: "room",
      tags: ["l_4"],
    },
    {
      front: "الحَمَّامُ",
      back: "the bathroom",
      tags: ["l_4"],
    },
    {
      front: "المِرْحَاضُ",
      back: "the toilet",
      tags: ["l_4"],
    },
    {
      front: "المَطْبَخُ",
      back: "kitchen",
      tags: ["l_4"],
    },
    {
      front: "فِي",
      back: "in",
      tags: ["l_4"],
    },
    {
      front: "هُوَ",
      back: "he/it",
      tags: ["l_4"],
    },
    {
      front: "هِيَ",
      back: "she/it",
      tags: ["l_4"],
    },
    {
      front: "أَيْنَ الوَلَدُ؟",
      back: "where is the boy?",
      tags: ["l_4"],
    },
    {
      front: "هُوَ فِي الْمَسْجِدِ",
      back: "he is in the mosque",
      tags: ["l_4"],
    },
    {
      front: "أَيْنَ السَّاعَةُ؟",
      back: "where is the watch?",
      tags: ["l_4"],
    },
    {
      front: "هِيَ عَلَى السَّرِيْرِ",
      back: "it is on the bed (♀)",
      tags: ["l_4"],
    },
    {
      front: "مِنْ",
      back: "from",
      tags: ["l_4a"],
    },
    {
      front: "إِلَى",
      back: "to",
      tags: ["l_4a"],
    },
    {
      front: "أَنَا",
      back: "I",
      tags: ["l_4a"],
    },
    {
      front: "أَنْتَ",
      back: "you (1 ♂)",
      tags: ["l_4a"],
    },
    {
      front: "ذَهَبَ",
      back: "he went",
      tags: ["l_4a"],
    },
    {
      front: "خَرَجَ",
      back: "he went out",
      tags: ["l_4a"],
    },
    {
      front: "أَيْنَ بِلالٌ؟",
      back: "where is Bilal?",
      tags: ["l_4"],
    },
    {
      front: "ذَهَبَ إِلَى الْمَسْجِدِ",
      back: "he went to the mosque",
      tags: ["l_4a"],
    },
    {
      front: "ذَهَبَ بِلالٌ إِلَى الْمَسْجِدِ",
      back: "Bilal went to the mosque",
      tags: ["l_4a"],
    },
    {
      front: "الفِلِبِّيْنُ",
      back: "the Philippines",
      tags: ["l_4a"],
    },
    {
      front: "اليَابَانُ",
      back: "Japan",
      tags: ["l_4a"],
    },
    {
      front: "الصِّيْنُ",
      back: "China",
      tags: ["l_4a"],
    },
    {
      front: "الهِنْدُ",
      back: "India",
      tags: ["l_4a"],
    },
    {
      front: "المَدْرَسَةُ",
      back: "the school",
      tags: ["l_4a"],
    },
    {
      front: "السُّوْقُ",
      back: "the market",
      tags: ["l_4a"],
    },
    {
      front: "الجَامِعَةُ",
      back: "the university",
      tags: ["l_4a"],
    },
    {
      front: "المُدِيْرُ",
      back: "the headmaster",
      tags: ["l_4a"],
    },
    {
      front: "هَذِهِ",
      back: "this (♀)",
      tags: ["l_6"],
    },
    {
      front: "تِلْكَ",
      back: "that (♀)",
      tags: ["l_7"],
    },
  ],
};

updateDeck(deck);
