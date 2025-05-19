import React, { useMemo } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import sourceData from "./source-data.json";
import type { SourceDataType, TableDataType } from "./types";

// Format a Date to 'YYYY-MM'
const formatYearMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
};

// Gett previous month in 'YYYY-MM'
const getPreviousMonthKey = (): string => {
  const today = new Date();
  const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return formatYearMonth(prev);
};

// Format a utilisation rate into a percentage
const formatPercentage = (value: string | undefined | null): string => {
  // validate input
  if (value == null || value === "-" || value === "") return "-";

  // Convert to float
  const num = parseFloat(value.toString());

  if (isNaN(num)) return "-";

  // If it's a decimal like 0.89, convert to 89%
  const percentage = num <= 1 ? num * 100 : num;
  return `${Math.round(percentage)}%`;
};

// Prepare table data
const tableData: TableDataType[] = (
  sourceData as unknown as SourceDataType[]
).flatMap((entry) => {
  const personObj = entry.employees ?? entry.externals;
  if (!personObj) return [];

  // Full name
  const personName = `${personObj.firstname}${
    personObj.lastname ? ` ${personObj.lastname}` : ""
  }`;

  // Utilisation
  const utilisation = personObj.workforceUtilisation;
  const past12 = formatPercentage(utilisation?.utilisationRateLastTwelveMonths);
  const y2d = formatPercentage(utilisation?.utilisationRateYearToDate);

  // Last three months individually
  const lastThree = utilisation?.lastThreeMonthsIndividually ?? [];
  const getMonthRate = (month: string) => {
    const m = lastThree.find((r) => r.month === month);
    return formatPercentage(m?.utilisationRate ?? null);
  };

  const may = getMonthRate("May");
  const june = getMonthRate("June");
  const july = getMonthRate("July");

  // Net earnings for previous month from costsByMonth
  const costsData = personObj.costsByMonth?.potentialEarningsByMonth ?? [];
  const prevKey = getPreviousMonthKey();
  const prevEntry = costsData.find((c) => c.month === prevKey);
  const rawCosts = prevEntry?.costs;
  const netEarningsPrevMonth =
    rawCosts == null || rawCosts === "" || parseFloat(rawCosts) === 0
      ? "-"
      : `${rawCosts} EUR`;

  return [
    {
      person: personName,
      past12Months: past12,
      y2d: y2d,
      may: may,
      june: june,
      july: july,
      netEarningsPrevMonth: netEarningsPrevMonth,
    },
  ];
});

const Table: React.FC = () => {
  const columns = useMemo<MRT_ColumnDef<TableDataType>[]>(
    () => [
      { accessorKey: "person", header: "Person" },
      { accessorKey: "past12Months", header: "Past 12 Months" },
      { accessorKey: "y2d", header: "Y2D" },
      { accessorKey: "may", header: "May" },
      { accessorKey: "june", header: "June" },
      { accessorKey: "july", header: "July" },
      {
        accessorKey: "netEarningsPrevMonth",
        header: "Net Earnings Prev Month",
      },
    ],
    []
  );

  const table = useMaterialReactTable({ columns, data: tableData });

  return <MaterialReactTable table={table} />;
};

export default Table;
