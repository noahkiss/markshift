/**
 * TypeScript declarations for @iarna/rtf-to-html
 *
 * @packageDocumentation
 */
declare module '@iarna/rtf-to-html' {
  type TemplateFunction = (
    doc: unknown,
    defaults: unknown,
    content: string
  ) => string;

  interface Options {
    template?: TemplateFunction;
    paraBreaks?: string;
    paraTag?: string;
  }

  interface RtfToHtml {
    fromString(
      rtfString: string,
      options: Options | undefined,
      callback: (err: Error | null, html: string) => void
    ): void;
    fromString(
      rtfString: string,
      callback: (err: Error | null, html: string) => void
    ): void;
  }

  const rtfToHtml: RtfToHtml;
  export = rtfToHtml;
}
