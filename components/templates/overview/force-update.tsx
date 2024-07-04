import { Button } from "@/components/ui/button";
import { forceUpdate } from "@/lib/localStorage";

const ForceUpdateButton = () => {
  return (
    <Button
      variant={"ghost"}
      onClick={() => {
        forceUpdate();
        window.location.reload();
      }}
    >
      Force Update
    </Button>
  );
};

export default ForceUpdateButton;
