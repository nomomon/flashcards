"use client";
import OverviewTemplate from "@/components/templates/overview";
import { getDecks } from "@/lib/backend";
import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<Deck[]>([]);

  useEffect(() => {
    getDecks(wasLastUpdateToday()).then((decks) => {
      setData(decks as Deck[]);
    });
  }, []);

  return <OverviewTemplate data={data} />;
}

const wasLastUpdateToday = () => {
  const lastUpdateStr = localStorage.getItem("lastUpdate");
  if (!lastUpdateStr) {
    localStorage.setItem("lastUpdate", new Date().toISOString());
    return false;
  }
  const lastUpdate = new Date(lastUpdateStr);
  const today = new Date();
  localStorage.setItem("lastUpdate", today.toISOString());
  return lastUpdate.toDateString() === today.toDateString();
};
