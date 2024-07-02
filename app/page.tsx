"use client";
import OverviewTemplate from "@/components/templates/overview";
import { getDecks } from "@/lib/backend";
import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<Deck[]>([]);
  useEffect(() => {
    getDecks().then((decks) => {
      setData(decks as Deck[]);
    });
  }, []);

  return <OverviewTemplate data={data} />;
}
