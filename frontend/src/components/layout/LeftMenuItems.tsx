import MainMenuItems from "./MainMenuItems";

interface LeftMenuItemsProps {
  open: boolean;
}

function LeftMenuItems({ open }: LeftMenuItemsProps) {
  return <MainMenuItems open={open} />;
}

export default LeftMenuItems;
