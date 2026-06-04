import { styles } from "@/styles";
import React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type Column = {
  content: React.ReactNode;
  className: string;
  columnId: string;
};

type Cell = {
  content: React.ReactNode | (() => React.ReactNode);
  className: string;
  columnId?: string;
};

type Row = Cell[];

type TableSimpleProps = {
  tableTitle?: string;
  columns: Column[];
  rows: Row[];
};

const TableSimple = ({ tableTitle, columns, rows }: TableSimpleProps) => {
  return (
    <div className="mt-8">
      {tableTitle && <h1 className={styles.h4}>{tableTitle}</h1>}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.content}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {row.map((cell, index) => (
                <TableCell key={index} className={cell.className}>
                  {typeof cell.content === "function"
                    ? cell.content()
                    : cell.content}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableSimple;
