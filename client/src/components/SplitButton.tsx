import { Button } from "@/components/ui/button";

interface SplitButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isProcessing: boolean;
}

const SplitButton = ({ onClick, isDisabled, isProcessing }: SplitButtonProps) => {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className="w-full"
      data-testid="split-button"
    >
      {isProcessing ? "Processing..." : "Split PDF"}
    </Button>
  );
};

export default SplitButton;
