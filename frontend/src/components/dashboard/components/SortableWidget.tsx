import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Paper,
  IconButton,
  Box,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { ReactNode } from "react";
import { WidgetSize, WIDGET_SIZES } from "../config/widget-registry";

interface SortableWidgetProps {
  id: string;
  children: ReactNode;
  height: number;
  isEditMode: boolean;
  currentSize: WidgetSize;
  onHide: (id: string) => void;
  onSizeChange: (id: string, size: WidgetSize) => void;
}

export function SortableWidget({
  id,
  children,
  height,
  isEditMode,
  currentSize,
  onHide,
  onSizeChange,
}: SortableWidgetProps) {
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
      elevation={5}
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        height,
        position: "relative",
        cursor: isEditMode ? "grab" : "default",
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
          <IconButton
            size="small"
            {...attributes}
            {...listeners}
            sx={{ cursor: "grab" }}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onHide(id)}>
            <VisibilityOffIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      {children}
    </Paper>
  );
}
