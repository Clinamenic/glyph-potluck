// Type definitions for imagetracer
declare module 'imagetracer' {
  interface ImageTracerOptions {
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    colorsampling?: number;
    numberofcolors?: number;
    mincolorratio?: number;
    colorquantcycles?: number;
    strokewidth?: number;
    blurradius?: number;
    blurdelta?: number;
  }

  function imagedataToSVG(
    imagedata: ImageData,
    options?: ImageTracerOptions
  ): string;

  function imageToSVG(
    image: HTMLImageElement,
    options?: ImageTracerOptions,
    callback?: (svgstring: string) => void
  ): string;

  function imageToTracedata(
    image: HTMLImageElement,
    options?: ImageTracerOptions,
    callback?: (tracedata: any) => void
  ): any;

  export {
    imagedataToSVG,
    imageToSVG,
    imageToTracedata,
    ImageTracerOptions
  };

  export default {
    imagedataToSVG,
    imageToSVG,
    imageToTracedata
  };
}
