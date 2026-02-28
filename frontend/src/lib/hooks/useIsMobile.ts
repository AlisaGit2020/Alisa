import { useMediaQuery, useTheme } from "@mui/material";

// Custom hook for mobile detection - can be mocked in tests
export const useIsMobile = () => {
    const theme = useTheme();
    return useMediaQuery(theme.breakpoints.down('sm'));
};