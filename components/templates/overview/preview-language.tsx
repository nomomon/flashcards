import {
  ArrowLeftIcon,
  ArrowLeftRightIcon,
  ArrowRightIcon,
} from "lucide-react";
import { FC } from "react";

interface LanguageDirectionProps {
  front: string;
  back: string;
  languageDirection: number;
  changeLanguageDirection: () => void;
}

const LanguageDirection: FC<LanguageDirectionProps> = ({
  front,
  back,
  languageDirection,
  changeLanguageDirection,
}) => {
  return (
    <div
      onClick={changeLanguageDirection}
      className="flex gap-1 items-center text-muted-foreground cursor-pointer max-sm:justify-center"
    >
      {front.slice(0, 2).toUpperCase()}
      <ArrowIcon languageDirection={languageDirection} />
      {back.slice(0, 2).toUpperCase()}
    </div>
  );
};

const ArrowIcon = ({ languageDirection }: { languageDirection: number }) => {
  switch (languageDirection % 3) {
    case 0:
      return <ArrowRightIcon className="w-4 h-4" />;
    case 1:
      return <ArrowLeftIcon className="w-4 h-4" />;
    case 2:
      return <ArrowLeftRightIcon className="w-4 h-4" />;
  }
};

export default LanguageDirection;
