import { FC, useState } from "react";

interface FlipableCardProps {
    front: string;
    back: string;
}

const FlipableCard: FC<FlipableCardProps> = ({ front, back }) => {
    const [flipped, setFlipped] = useState(false);
    return (
        <div className="max-w-sm bg-white rounded-xl shadow-md mx-auto my-10 p-5 aspect-square flex justify-center items-center text-6xl cursor-pointer"
            onClick={() => setFlipped(!flipped)}
        >
            <div className={`w-full h-full flex justify-center items-center ${flipped ? "hidden" : ""}`}>
                {front}
            </div>
            <div className={`w-full h-full flex justify-center items-center ${flipped ? "" : "hidden"}`}>
                {back}
            </div>
        </div>
    )
}

export default FlipableCard;