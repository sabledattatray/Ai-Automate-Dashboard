export const chartConfigs = {
  BAR_CHART: {
    type: "BAR_CHART" as const,
    title: "Revenue by Category",
    w: 6,
    h: 4,
  },
  LINE_CHART: {
    type: "LINE_CHART" as const,
    title: "Monthly Active Users",
    w: 6,
    h: 4,
  },
  KPI_CARD: {
    type: "KPI_CARD" as const,
    title: "Total Sales",
    w: 3,
    h: 2,
  },
  PIE_CHART: {
    type: "PIE_CHART" as const,
    title: "User Demographics",
    w: 4,
    h: 4,
  },
};
