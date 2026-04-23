export type DashboardNumbersResponse = {
  clothesNumber: number;
  looksNumber: number;
  wornLast30Days: number;
  notWornMoreThan30Days: number;
  neverWornClothes: number;
  clothesTrend: {
    value: number;
    label: string;
  };
  looksTrend: {
    value: number;
    label: string;
  };
  wornTrend: {
    value: number;
    label: string;
  };
  notWornTrend: {
    value: number;
    label: string;
  };
};

export type DashboardSectionsResponse = {
  name: string;
  emoji: string;
  count: number;
  percentage: number;
}[];
