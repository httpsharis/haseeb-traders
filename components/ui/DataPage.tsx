"use client";

import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export interface ColumnDef<T> {
    header: string;
    className?: string;
    cell: (item: T) => React.ReactNode; 
}

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    isLoading: boolean;
    searchPlaceholder?: string;
    filterFn?: (item: T, searchTerm: string) => boolean;
    sortOptions?: { label: string; value: string }[];
    defaultSort?: string;
    sortFn?: (a: T, b: T, sortOrder: string) => number;
    onRowClick?: (item: T) => void;
    emptyIcon?: React.ReactNode;
    emptyMessage?: string;
}

export function DataTable<T extends { _id: string }>({
    data,
    columns,
    isLoading,
    searchPlaceholder = "Search...",
    filterFn,
    sortOptions = [],
    defaultSort = "",
    sortFn,
    onRowClick,
    emptyIcon,
    emptyMessage = "No results found."
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState(defaultSort);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ✅ THE BAD USEMEMO HAS BEEN DELETED FROM HERE!

    const processedData = useMemo(() => {
        let result = [...data];
        if (searchTerm && filterFn) result = result.filter(item => filterFn(item, searchTerm));
        if (sortOrder && sortFn) result.sort((a, b) => sortFn(a, b, sortOrder));
        return result;
    }, [data, searchTerm, sortOrder, filterFn, sortFn]);

    const totalPages = Math.ceil(processedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = processedData.slice(startIndex, startIndex + itemsPerPage);

    return (
        <Card className="border border-stone-200 shadow-xl shadow-stone-200/40 overflow-hidden rounded-2xl bg-white flex flex-col">
            
            {/* Control Bar */}
            <div className="bg-stone-50/80 border-b border-stone-100 p-4 sm:px-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                {sortOptions.length > 0 && (
                    <div className="relative flex items-center group w-full md:w-48">
                        <ArrowDownUp className="absolute left-3 h-4 w-4 text-stone-400 group-hover:text-stone-900 pointer-events-none" />
                        <select
                            value={sortOrder}
                            // ✅ FIX 1: Reset page when sorting changes
                            onChange={(e) => {
                                setSortOrder(e.target.value);
                                setCurrentPage(1); 
                            }}
                            className="h-10 w-full pl-9 pr-8 bg-white border border-stone-200 rounded-lg text-sm font-bold text-stone-700 focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                        >
                            {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                )}

                {filterFn && (
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            // ✅ FIX 2: Reset page when searching
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); 
                            }}
                            className="pl-10 h-10 bg-white border-stone-200 focus-visible:ring-1 focus-visible:ring-primary rounded-lg font-medium shadow-sm transition-all"
                        />
                    </div>
                )}
            </div>

            {/* Table Area */}
            <CardContent className="p-0 overflow-x-auto flex-grow">
                <Table>
                    <TableHeader className="bg-stone-50/30">
                        <TableRow className="hover:bg-transparent border-stone-100">
                            {columns.map((col, i) => (
                                <TableHead key={i} className={`font-bold text-stone-400 uppercase tracking-widest text-[10px] py-4 ${col.className || ""}`}>
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-stone-100">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}><TableCell colSpan={columns.length} className="pl-6 py-4"><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                            ))
                        ) : currentData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-64 text-center text-stone-400 bg-stone-50/30">
                                    <div className="flex justify-center mb-3 opacity-20">{emptyIcon}</div>
                                    <p className="font-bold text-sm text-stone-600">{emptyMessage}</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentData.map((item) => (
                                <TableRow
                                    key={item._id}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    className={`group hover:bg-stone-50/80 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                                >
                                    {columns.map((col, i) => (
                                        <TableCell key={i} className={col.className}>
                                            {col.cell(item)} 
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            {/* Pagination */}
            {!isLoading && processedData.length > 0 && (
                <div className="bg-stone-50/80 border-t border-stone-100 p-4 sm:px-6 flex justify-between gap-4">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mt-2">
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, processedData.length)} of {processedData.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                        <span className="text-sm font-black text-stone-700">{currentPage} / {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                </div>
            )}
        </Card>
    );
}