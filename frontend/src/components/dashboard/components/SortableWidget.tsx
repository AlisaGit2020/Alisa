import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Paper,
  IconButton,
  Box,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip,
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { WidgetSize, WIDGET_SIZES } from "../config/widget-registry";

interface SortableWidgetProps {
  id: string;
  children: ReactNode;
  height: number;
  isEditMode: boolean;
  isHidden: boolean;
  currentSize: WidgetSize;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onSizeChange: (id: string, size: WidgetSize) => void;
}

export function SortableWidget({
  id,
  children,
  height,
  isEditMode,
  isHidden,
  currentSize,
  onToggleVisibility,
  onSizeChange,
}: SortableWidgetProps) {
  const { t } = useTranslation("dashboard");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSizeChange = (event: SelectChangeEvent<WidgetSize>) => {
    onSizeChange(id, event.target.value as WidgetSize);
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={isHidden ? 1 : 5}
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        height,
        position: "relative",
        cursor: isEditMode ? "grab" : "default",
        opacity: isHidden ? 0.5 : 1,
        border: isHidden ? "2px dashed" : "none",
        borderColor: "divider",
      }}
    >
      {isEditMode && (
        <Box
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            display: "flex",
            gap: 0.5,
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <Select
            size="small"
            value={currentSize}
            onChange={handleSizeChange}
            sx={{
              minWidth: 70,
              height: 28,
              fontSize: "0.75rem",
              "& .MuiSelect-select": {
                py: 0.5,
                px: 1,
              },
            }}
          >
            {WIDGET_SIZES.map((size) => (
              <MenuItem key={size.value} value={size.value} sx={{ fontSize: "0.75rem" }}>
                {size.label}
              </MenuItem>
            ))}
          </Select>
          <Tooltip title={t("dragToReorder")}>
            <IconButton
              size="small"
              {...attributes}
              {...listeners}
              sx={{ cursor: "grab" }}
            >
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isHidden ? t("showWidget") : t("hideWidget")}>
            <IconButton
              size="small"
              onClick={() => onToggleVisibility(id, isHidden)}
              color={isHidden ? "primary" : "default"}
            >
              {isHidden ? (
                <VisibilityIcon fontSize="small" />
              ) : (
                <VisibilityOffIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      )}
      {children}
    </Paper>
  );
}
