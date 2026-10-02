export interface DepreciationResult {
  cost: number;
  salvageValue: number;
  usefulLifeYears: number;
  purchaseDate: Date | null;
  annualDepreciation: number;
  monthlyDepreciation: number;
  yearsElapsed: number;
  monthsElapsed: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  isFullyDepreciated: boolean;
  yearlySchedule: {
    yearNumber: number;
    calendarYear: number;
    annualDepreciation: number;
    accumulatedDepreciation: number;
    bookValue: number;
  }[];
}

export function calculateStraightLineDepreciation(
  cost: number,
  salvageValue: number = 1,
  usefulLifeYears: number = 5,
  purchaseDateInput?: Date | string | null,
  targetDateInput: Date = new Date()
): DepreciationResult {
  const purchaseDate = purchaseDateInput ? new Date(purchaseDateInput) : null;
  const safeCost = Math.max(0, cost || 0);
  const safeSalvage = Math.max(0, salvageValue);
  const safeLifeYears = Math.max(1, usefulLifeYears || 5);

  const depreciableAmount = Math.max(0, safeCost - safeSalvage);
  const annualDepreciation = depreciableAmount / safeLifeYears;
  const monthlyDepreciation = annualDepreciation / 12;

  let yearsElapsed = 0;
  let monthsElapsed = 0;

  if (purchaseDate && !isNaN(purchaseDate.getTime())) {
    const diffMs = targetDateInput.getTime() - purchaseDate.getTime();
    const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
    yearsElapsed = diffDays / 365.25;
    monthsElapsed = diffDays / 30.4375;
  }

  const rawAccumulated = annualDepreciation * yearsElapsed;
  const accumulatedDepreciation = Math.min(depreciableAmount, Math.max(0, rawAccumulated));
  const netBookValue = Math.max(safeSalvage, safeCost - accumulatedDepreciation);
  const isFullyDepreciated = netBookValue <= safeSalvage || yearsElapsed >= safeLifeYears;

  const startYear = purchaseDate ? purchaseDate.getFullYear() : new Date().getFullYear();
  const yearlySchedule = [];
  let currentAccum = 0;

  for (let i = 1; i <= safeLifeYears; i++) {
    const isLastYear = i === safeLifeYears;
    const yearDep = isLastYear ? depreciableAmount - currentAccum : annualDepreciation;
    currentAccum += yearDep;
    const yearBookValue = Math.max(safeSalvage, safeCost - currentAccum);

    yearlySchedule.push({
      yearNumber: i,
      calendarYear: startYear + (i - 1),
      annualDepreciation: Math.round(yearDep * 100) / 100,
      accumulatedDepreciation: Math.round(currentAccum * 100) / 100,
      bookValue: Math.round(yearBookValue * 100) / 100,
    });
  }

  return {
    cost: safeCost,
    salvageValue: safeSalvage,
    usefulLifeYears: safeLifeYears,
    purchaseDate,
    annualDepreciation: Math.round(annualDepreciation * 100) / 100,
    monthlyDepreciation: Math.round(monthlyDepreciation * 100) / 100,
    yearsElapsed: Math.round(yearsElapsed * 10) / 10,
    monthsElapsed: Math.round(monthsElapsed * 10) / 10,
    accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
    netBookValue: Math.round(netBookValue * 100) / 100,
    isFullyDepreciated,
    yearlySchedule,
  };
}
