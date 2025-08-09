export declare function brushDown(cleanDimensionName: any, event: any, d: any, parcoords: {
    xScales: any;
    yScales: {};
    dragging: {};
    dragPosStart: {};
    currentPosOfDims: any[];
    newFeatures: any;
    features: any[];
    newDataset: any[];
}, active: any, tooltipValues: any, window: any): void;
export declare function brushUp(cleanDimensionName: any, event: any, d: any, parcoords: {
    xScales: any;
    yScales: {};
    dragging: {};
    dragPosStart: {};
    currentPosOfDims: any[];
    newFeatures: any;
    features: any[];
    newDataset: any[];
}, active: any, tooltipValues: any, window: any): void;
export declare function dragAndBrush(cleanDimensionName: any, d: any, svg: any, event: any, parcoords: {
    xScales: any;
    yScales: {};
    dragging: {};
    dragPosStart: {};
    currentPosOfDims: any[];
    newFeatures: any;
    features: any[];
    newDataset: any[];
}, active: any, delta: any, tooltipValuesTop: any, tooltipValuesDown: any, window: any): void;
export declare function filter(dimensionName: any, topValue: any, bottomValue: any, parcoords: any): void;
export declare function filterWithCoords(topPosition: any, bottomPosition: any, currentPosOfDims: any, dimension: any): void;
export declare function addPosition(yPosTop: any, currentPosOfDims: any, dimensionName: any, key: any): void;
export declare function addSettingsForBrushing(dimensionName: string, parcoords: any): void;
export declare function addInvertStatus(status: any, currentPosOfDims: any, dimensionName: any, key: any): void;
export declare const throttleBrushDown: (cleanDimensionName: any, event: any, d: any, parcoords: {
    xScales: any;
    yScales: {};
    dragging: {};
    dragPosStart: {};
    currentPosOfDims: any[];
    newFeatures: any;
    features: any[];
    newDataset: any[];
}, active: any, tooltipValues: any, window: any) => void;
export declare const throttleBrushUp: (cleanDimensionName: any, event: any, d: any, parcoords: {
    xScales: any;
    yScales: {};
    dragging: {};
    dragPosStart: {};
    currentPosOfDims: any[];
    newFeatures: any;
    features: any[];
    newDataset: any[];
}, active: any, tooltipValues: any, window: any) => void;
export declare const throttleDragAndBrush: (cleanDimensionName: any, d: any, svg: any, event: any, parcoords: {
    xScales: any;
    yScales: {};
    dragging: {};
    dragPosStart: {};
    currentPosOfDims: any[];
    newFeatures: any;
    features: any[];
    newDataset: any[];
}, active: any, delta: any, tooltipValuesTop: any, tooltipValuesDown: any, window: any) => void;
