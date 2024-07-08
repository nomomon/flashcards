// create Arabic deck

import { updateDeck } from "..";

const deck: Deck = {
  id: "arabic_ru",
  name: "Арабский язык 1",
  color: "#22228C",
  languages: {
    front: "Арабский",
    back: "Русский",
  },
  words: [
    {
      front: "بَيْتٌ",
      back: "дом",
      tags: ["lesson_1"],
    },
    {
      front: "وَلَدٌ",
      back: "мальчик",
      tags: ["lesson_1"],
    },
    {
      front: "طَالِبٌ",
      back: "студент",
      tags: ["lesson_1"],
    },
    {
      front: "مَسْجِدٌ",
      back: "мечеть",
      tags: ["lesson_1"],
    },
    {
      front: "رَجُلٌ",
      back: "мужчина",
      tags: ["lesson_1"],
    },
    {
      front: "بَابٌ",
      back: "дверь",
      tags: ["lesson_1"],
    },
    {
      front: "تَاجِرٌ",
      back: "торговец",
      tags: ["lesson_1"],
    },
    {
      front: "كِتَابٌ",
      back: "книга",
      tags: ["lesson_1"],
    },
    {
      front: "كَلْبٌ",
      back: "собака",
      tags: ["lesson_1"],
    },
    {
      front: "قَلَمٌ",
      back: "ручка",
      tags: ["lesson_1"],
    },
    {
      front: "قِطٌّ",
      back: "кошка",
      tags: ["lesson_1"],
    },
    {
      front: "مِفْتَاحٌ",
      back: "ключ",
      tags: ["lesson_1"],
    },
    {
      front: "حِمَارٌ",
      back: "осёл",
      tags: ["lesson_1"],
    },
    {
      front: "مَكْتَبٌ",
      back: "письменный стол",
      tags: ["lesson_1"],
    },
    {
      front: "حِصَانٌ",
      back: "лошадь",
      tags: ["lesson_1"],
    },
    {
      front: "سَرِيْرٌ",
      back: "кровать",
      tags: ["lesson_1"],
    },
    {
      front: "جَمَلٌ",
      back: "верблюд",
      tags: ["lesson_1"],
    },
    {
      front: "كُرْسِيٌ",
      back: "стул",
      tags: ["lesson_1"],
    },
    {
      front: "دِيْكٌ",
      back: "петух",
      tags: ["lesson_1"],
    },
    {
      front: "نَجْمٌ",
      back: "звезда",
      tags: ["lesson_1"],
    },
    {
      front: "مُدَرِّسٌ",
      back: "учитель",
      tags: ["lesson_1"],
    },
    {
      front: "قَمِيْصٌ",
      back: "рубашка",
      tags: ["lesson_1"],
    },
    {
      front: "مِنْدِيْلٌ",
      back: "платочек",
      tags: ["lesson_1"],
    },
    {
      front: "طَبِيْبٌ",
      back: "доктор",
      tags: ["lesson_1"],
    },
    {
      front: "مَا هَذَا؟",
      back: "что это?",
      tags: ["lesson_1"],
    },
    {
      front: "أَهَذَا بَيتٌ؟",
      back: "это дом?",
      tags: ["lesson_1"],
    },
    {
      front: "نَعَمْ",
      back: "да",
      tags: ["lesson_1"],
    },
    {
      front: "لَا",
      back: "нет",
      tags: ["lesson_1"],
    },
    {
      front: "هَذَا كِتَابٌ",
      back: "это книга",
      tags: ["lesson_1"],
    },
    {
      front: "هَذَا بَيْتٌ",
      back: "это дом",
      tags: ["lesson_1"],
    },
    {
      front: "مَنْ هَذَا؟",
      back: "кто это?",
      tags: ["lesson_1"],
    },
    {
      front: "هَذَا",
      back: "это",
      tags: ["lesson_2"],
    },
    {
      front: "ذَلِكَ",
      back: "тот",
      tags: ["lesson_2"],
    },
    {
      front: "إِمَامٌ",
      back: "имам",
      tags: ["lesson_2"],
    },
    {
      front: "سُكَّرٌ",
      back: "сахар",
      tags: ["lesson_2"],
    },
    {
      front: "لَبَنٌ",
      back: "молоко",
      tags: ["lesson_2"],
    },
    {
      front: "حَجَرٌ",
      back: "камень",
      tags: ["lesson_2"],
    },
    {
      front: "وَ",
      back: "и",
      tags: ["lesson_2"],
    },
    {
      front: "البَيْتُ",
      back: "(the) дом",
      tags: ["lesson_3"],
    },
    {
      front: "القَمَرُ",
      back: "(the) луна",
      tags: ["lesson_3"],
    },
    {
      front: "الشَّمْسُ",
      back: "(the) солнце",
      tags: ["lesson_3"],
    },
    {
      front: "البَبُ مَفْتُوحٌ",
      back: "дверь открыта",
      tags: ["lesson_3"],
    },
    {
      front: "القَلَمُ مَكْسُوْرٌ",
      back: "ручка сломана",
      tags: ["lesson_3"],
    },
    {
      front: "فَقِيْرٌ",
      back: "бедный",
      tags: ["lesson_3"],
    },
    {
      front: "غَنِيٌّ",
      back: "богатый",
      tags: ["lesson_3"],
    },
    {
      front: "قَصِيْرٌ",
      back: "короткий",
      tags: ["lesson_3"],
    },
    {
      front: "طَوِيْلٌّ",
      back: "высокий",
      tags: ["lesson_3"],
    },
    {
      front: "حَارٌّ",
      back: "горячий",
      tags: ["lesson_3"],
    },
    {
      front: "وَاقِفٌ",
      back: "стоящий",
      tags: ["lesson_3"],
    },
    {
      front: "جَالِسٌ",
      back: "сидящий",
      tags: ["lesson_3"],
    },
    {
      front: "قَدِيْمٌ",
      back: "старый",
      tags: ["lesson_3"],
    },
    {
      front: "جَدِيْدٌ",
      back: "новый",
      tags: ["lesson_3"],
    },
    {
      front: "بَعِيْدٌ",
      back: "далекий",
      tags: ["lesson_3"],
    },
    {
      front: "قَرِيْبٌ",
      back: "близкий",
      tags: ["lesson_3"],
    },
    {
      front: "وَسِخٌ",
      back: "грязный",
      tags: ["lesson_3"],
    },
    {
      front: "نَظِيْفٌ",
      back: "чистый",
      tags: ["lesson_3"],
    },
    {
      front: "كَبِيْرٌ",
      back: "большой",
      tags: ["lesson_3"],
    },
    {
      front: "صَغِيْرٌ",
      back: "маленький",
      tags: ["lesson_3"],
    },
    {
      front: "ثَقِيْلٌ",
      back: "тяжелый",
      tags: ["lesson_3"],
    },
    {
      front: "خَفِيْفٌ",
      back: "легкий",
      tags: ["lesson_3"],
    },
    {
      front: "جَمِيْلٌ",
      back: "красивый",
      tags: ["lesson_3"],
    },
    {
      front: "حُلْوٌ",
      back: "сладкий",
      tags: ["lesson_3"],
    },
    {
      front: "المَاءُ",
      back: "вода",
      tags: ["lesson_3"],
    },
    {
      front: "الوَرَقُ",
      back: "бумага",
      tags: ["lesson_3"],
    },
    {
      front: "التُّفَّاحُ",
      back: "яблоко",
      tags: ["lesson_3"],
    },
    {
      front: "الدُّكَّانُ",
      back: "магазин",
      tags: ["lesson_3"],
    },
    {
      front: "مَرِيْضٌ",
      back: "больной",
      tags: ["lesson_3"],
    },
    {
      front: "أَيْنَ",
      back: "где",
      tags: ["lesson_4"],
    },
    {
      front: "عَلَى",
      back: "на",
      tags: ["lesson_4"],
    },
    {
      front: "السَّمَءُ",
      back: "небо",
      tags: ["lesson_4"],
    },
    {
      front: "الفَصْلُ",
      back: "класс",
      tags: ["lesson_4"],
    },
    {
      front: "غُرْفَةٌ",
      back: "комната",
      tags: ["lesson_4"],
    },
    {
      front: "الحَمَّامُ",
      back: "ванная",
      tags: ["lesson_4"],
    },
    {
      front: "المِرْحَاضُ",
      back: "туалет",
      tags: ["lesson_4"],
    },
    {
      front: "المَطْبَخُ",
      back: "кухня",
      tags: ["lesson_4"],
    },
    {
      front: "فِي",
      back: "в",
      tags: ["lesson_4"],
    },
    {
      front: "هَذِهِ",
      back: "это (♀)",
      tags: ["lesson_6"],
    },
    {
      front: "تِلْكَ",
      back: "тот (♀)",
      tags: ["lesson_7"],
    },
  ],
};

updateDeck(deck);
