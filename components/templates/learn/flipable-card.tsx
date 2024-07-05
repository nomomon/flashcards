import { FC } from "react";

interface FlipableCardProps {
  front: string;
  back: string;
}

const FlipableCard: FC<FlipableCardProps> = ({ front, back }) => {
  const flipCard = () => {
    const card = document.querySelectorAll(".flipable-card");
    card.forEach((el) => {
      const flipped = el.getAttribute("data-flipped");
      el.setAttribute("data-flipped", flipped === "true" ? "false" : "true");
    });
  };
  return (
    <div
      className="max-w-sm bg-white rounded-xl shadow-md mx-auto my-10 p-5 aspect-square flex justify-center items-center text-6xl cursor-pointer"
      onClick={flipCard}
    >
      <div
        key={front}
        data-flipped="false"
        className={`w-full h-full text-center justify-center items-center flipable-card flex data-[flipped=true]:hidden`}
      >
        {front}
      </div>
      <div
        key={back}
        data-flipped="false"
        className={`w-full h-full text-center justify-center items-center flipable-card hidden data-[flipped=true]:flex`}
      >
        {back}
      </div>
    </div>
  );
};

export default FlipableCard;
