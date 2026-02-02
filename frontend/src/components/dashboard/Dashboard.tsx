import {
  Grid,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stack,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useDashboard, ViewMode } from "./context/DashboardContext";
import { getWidgetById, getGridSize, WidgetSize } from "./config/widget-registry";
import { SortableWidget } from "./components/SortableWidget";
import { DashboardToolbar } from "./components/DashboardToolbar";

function Dashboard() {
  const { t } = useTranslation("dashboard");
  const { t: tAppBar } = useTranslation("appBar");
  const {
    viewMode,
    setViewMode,
    selectedYear,
    setSelectedYear,
    availableYears,
    isEditMode,
    getVisibleWidgets,
    getAllWidgets,
    reorderWidgets,
    updateWidgetVisibility,
    updateWidgetSize,
  } = useDashboard();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: ViewMode | null
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setSelectedYear(event.target.value as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderWidgets(active.id as string, over.id as string);
    }
  };

  const handleToggleVisibility = (widgetId: string, currentlyHidden: boolean) => {
    updateWidgetVisibility(widgetId, currentlyHidden);
  };

  const handleSizeChange = (widgetId: string, size: WidgetSize) => {
    updateWidgetSize(widgetId, size);
  };

  // In edit mode, show all widgets (including hidden ones). Otherwise, show only visible.
  const displayWidgets = isEditMode ? getAllWidgets() : getVisibleWidgets();
  const widgetIds = displayWidgets.map((w) => w.id);

  return (
    <>
      <DashboardToolbar />
      <Grid container spacing={3}>
        {/* Welcome message and controls */}
        <Grid size={12}>
          <Paper elevation={5} sx={{ p: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Typography sx={{ fontSize: "medium" }}>{tAppBar("slogan")}</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <FormControl
                  size="small"
                  sx={{
                    minWidth: 100,
                    visibility: viewMode === "monthly" ? "visible" : "hidden",
                  }}
                >
                  <InputLabel id="dashboard-year-select">{t("year")}</InputLabel>
                  <Select
                    labelId="dashboard-year-select"
                    value={selectedYear}
                    label={t("year")}
                    onChange={handleYearChange}
                  >
                    {availableYears.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={handleViewModeChange}
                  size="small"
                >
                  <ToggleButton value="monthly">{t("monthly")}</ToggleButton>
                  <ToggleButton value="yearly">{t("yearly")}</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

      {/* Dynamic widgets */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
          {displayWidgets.map((widgetConfig) => {
            const widgetDef = getWidgetById(widgetConfig.id);
            if (!widgetDef) return null;

            const WidgetComponent = widgetDef.component;
            const currentSize = widgetConfig.size ?? widgetDef.defaultSize;
            const gridMd = getGridSize(currentSize);
            const isHidden = !widgetConfig.visible;

            return (
              <Grid
                key={widgetConfig.id}
                size={{ xs: 12, md: gridMd }}
                id={widgetConfig.id}
              >
                <SortableWidget
                  id={widgetConfig.id}
                  height={widgetDef.height}
                  isEditMode={isEditMode}
                  isHidden={isHidden}
                  currentSize={currentSize}
                  onToggleVisibility={handleToggleVisibility}
                  onSizeChange={handleSizeChange}
                >
                  <WidgetComponent />
                </SortableWidget>
              </Grid>
            );
          })}
        </SortableContext>
      </DndContext>

        {/* Show message when no widgets are visible (only in normal mode) */}
        {!isEditMode && getVisibleWidgets().length === 0 && (
          <Grid size={12}>
            <Paper elevation={5} sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">{t("noWidgetsVisible")}</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </>
  );
}

export default Dashboard;
