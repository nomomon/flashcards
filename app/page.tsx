"use client";
import OverviewTemplate from "@/components/templates/overview";
import { getDecks } from "@/lib/backend";
import { wasLastUpdateToday } from "@/lib/localStorage";
import { useEffect, useState } from "react";
import { Deck } from "@/lib/interfaces/Deck";

export default function Home() {
  const [data, setData] = useState<Deck[]>([]);

  useEffect(() => {
    getDecks(wasLastUpdateToday()).then((decks) => {
      setData(decks as Deck[]);
    });
  }, []);

  return <OverviewTemplate data={data} />;
}
