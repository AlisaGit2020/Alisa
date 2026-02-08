import MainMenuItems from "./MainMenuItems";

interface LeftMenuItemsProps {
  open: boolean;
  isMobile?: boolean;
}

function LeftMenuItems({ open, isMobile = false }: LeftMenuItemsProps) {
  return <MainMenuItems open={open} isMobile={isMobile} />;
}

export default LeftMenuItems;
