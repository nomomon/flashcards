import { FC } from "react";

interface FeedbackButtonProps {
  onClick: () => void;
  text: string;
  children: React.ReactNode;
}

const FeedbackButton: FC<FeedbackButtonProps> = ({
  onClick,
  text,
  children,
}) => {
  return (
    <div
      onClick={onClick}
      aria-label={text}
      className="flex items-center justify-center flex-col cursor-pointer text-muted-foreground select-none"
    >
      {children}
      <span className="text-sm">{text}</span>
    </div>
  );
};

export default FeedbackButton;
