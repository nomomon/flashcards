import { Badge } from "@/components/ui/badge";
import { FC } from "react";

interface TagsProps {
  tags: string[];
  selectedTags: string[];
  onClick: (tag: string) => void;
}

const Tags: FC<TagsProps> = ({ tags, selectedTags, onClick }) => {
  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {selectedTags.map((tag, idx) => (
          <Badge key={idx} onClick={() => onClick(tag)}>
            #{tag}
          </Badge>
        ))}
        {tags
          .filter((tag) => !selectedTags.includes(tag))
          .map((tag, idx) => (
            <Badge
              key={idx}
              onClick={() => onClick(tag)}
              className="opacity-60"
            >
              #{tag}
            </Badge>
          ))}
      </div>
    </div>
  );
};

export default Tags;
