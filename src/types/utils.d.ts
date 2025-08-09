export declare function cleanString(stringValue: string): string;
export declare function setSize(stringValue: string, size: number): string;
export declare function throttle<Params extends any[]>(func: (...args: Params) => any, delay: number): (...args: Params) => void;
export declare function digits(value: any): any;
export declare function addNumberOfDigs(number: any, currentPosOfDims: any, dimensionName: any, key: any): void;
export declare function isElementVisible(element: any): any;
export declare function getMouseCoords(event: any, targetContainer?: HTMLElement): any[];
