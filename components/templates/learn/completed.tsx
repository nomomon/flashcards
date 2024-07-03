import { Button } from "@/components/ui/button";
import { FC, useState } from "react";

interface LearnDeckCompletedProps {
    deckId: Deck["id"];
    correctCount: number;
    totalCount: number;
}

const LearnDeckCompleted: FC<LearnDeckCompletedProps> = ({ deckId, correctCount, totalCount }) => {
    return (
        <div className="w-full h-full">
            <div className="max-w-sm mx-auto p-5 aspect-square flex justify-center items-center text-6xl">
                <span>{correctCount}/{totalCount}</span>
                <svg className="absolute" viewBox="0 0 36 36" width="200" height="200">
                    <circle cx="18" cy="18" r="16" fill="none" strokeWidth="2" style={{ stroke: "rgba(0, 0, 0, 0.1)" }} />
                    <circle cx="18" cy="18" r="16" fill="none" strokeWidth="2" style={{ stroke: "hsl(var(--warning))", strokeDasharray: `${(correctCount / totalCount) * 100} 100` }} />
                </svg>
            </div>
            <div className="max-w-sm mx-auto flex justify-between">
                <Button variant={"ghost"} onClick={() => clearProgress(deckId)}>
                    Reset progress
                </Button>
                <Button variant={"ghost"} onClick={returnHome}>
                    Home
                </Button>
                <Button variant={"ghost"} onClick={continueLearning}>
                    Continue learning
                </Button>
            </div>
        </div>
    )
}

const clearProgress = (deckId: string) => {
    localStorage.removeItem(`progress_${deckId}`);
    window.location.reload();
}

const returnHome = () => {
    window.location.href = "/";
}

const continueLearning = () => {
    window.location.reload();
}

export default LearnDeckCompleted;