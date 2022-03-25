"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDays = exports.diffDays = exports.currencyExchange = void 0;
function currencyExchange(baseRate, symbolRate) {
    return Math.round((symbolRate / baseRate) * 1000000) / 1000000;
}
exports.currencyExchange = currencyExchange;
function diffDays(startDate, endDate) {
    const date1 = new Date(startDate);
    const date2 = new Date(endDate);
    const diffTime = Math.abs(date2.valueOf() - date1.valueOf());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}
exports.diffDays = diffDays;
function addDays(date, days) {
    const result = new Date(date.valueOf());
    result.setDate(result.getDate() + days);
    return formatDate(result, "yyyy-MM-dd");
}
exports.addDays = addDays;
function formatDate(date, format) {
    format = format.replace(/yyyy/g, date.getFullYear().toString());
    format = format.replace(/MM/g, (date.getMonth() + 1).toString().padStart(2, "0"));
    format = format.replace(/dd/g, date.getDate().toString().padStart(2, "0"));
    format = format.replace(/HH/g, date.getHours().toString().padStart(2, "0"));
    format = format.replace(/mm/g, date.getMinutes().toString().padStart(2, "0"));
    format = format.replace(/ss/g, date.getSeconds().toString().padStart(2, "0"));
    format = format.replace(/SSS/g, date.getMilliseconds().toString().padStart(3, "0"));
    return format;
}
