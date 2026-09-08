import { getWechatTheme, type WechatTheme, type WechatThemeId } from './wechat-themes';

export type VisualThemeFont = 'sans' | 'serif' | 'modern';
export type VisualThemeStructure = 'default' | 'grace' | 'simple';
export type VisualThemeAlignment = 'left' | 'justify';

export interface VisualThemeSettings {
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  font: VisualThemeFont;
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  letterSpacing: number;
  pagePadding: number;
  imageRadius: number;
  textAlign: VisualThemeAlignment;
  firstLineIndent: boolean;
  headingStyle: VisualThemeStructure;
  quoteStyle: VisualThemeStructure;
}

const fontFamilies: Record<VisualThemeFont, string> = {
  sans: "-apple-system-font,BlinkMacSystemFont,'Helvetica Neue','PingFang SC','Hiragino Sans GB','Microsoft YaHei UI','Microsoft YaHei',Arial,sans-serif",
  serif: "'Songti SC','Noto Serif SC',STSong,SimSun,serif",
  modern: "Inter,'HarmonyOS Sans SC','PingFang SC','Microsoft YaHei',Arial,sans-serif",
};

const defaultStructures: Record<WechatThemeId, VisualThemeStructure> = {
  default: 'default',
  grace: 'grace',
  simple: 'simple',
};

export function createDefaultVisualThemeSettings(baseThemeId: WechatThemeId): VisualThemeSettings {
  const theme = getWechatTheme(baseThemeId);
  return {
    accentColor: normalizeHexColor(theme.tokens.primaryColor, '#0f4c81'),
    textColor: '#0a0a0a',
    backgroundColor: normalizeHexColor(theme.preview.background, '#ffffff'),
    font: 'sans',
    fontSize: theme.tokens.fontSize,
    lineHeight: 1.75,
    paragraphSpacing: 1.5,
    letterSpacing: 0.1,
    pagePadding: 0,
    imageRadius: baseThemeId === 'default' ? 4 : 8,
    textAlign: 'left',
    firstLineIndent: false,
    headingStyle: defaultStructures[baseThemeId],
    quoteStyle: defaultStructures[baseThemeId],
  };
}

export function createVisualWechatTheme(
  baseThemeId: WechatThemeId,
  settings: VisualThemeSettings,
): WechatTheme {
  const base = getWechatTheme(baseThemeId);
  const defaults = createDefaultVisualThemeSettings(baseThemeId);
  const headingSource = getWechatTheme(settings.headingStyle);
  const quoteSource = getWechatTheme(settings.quoteStyle);
  const fontFamily = fontFamilies[settings.font];
  const accentTint = colorWithAlpha(settings.accentColor, 0.09);
  const accentBorder = colorWithAlpha(settings.accentColor, 0.2);
  const textChanged = settings.textColor !== defaults.textColor;
  const accentChanged = settings.accentColor !== defaults.accentColor;

  let title =
    settings.headingStyle === defaults.headingStyle
      ? base.styles.title
      : headingSource.styles.title;
  let heading1 =
    settings.headingStyle === defaults.headingStyle
      ? base.styles.heading1
      : headingSource.styles.heading1;
  let heading2 =
    settings.headingStyle === defaults.headingStyle
      ? base.styles.heading2
      : headingSource.styles.heading2;
  let heading3 =
    settings.headingStyle === defaults.headingStyle
      ? base.styles.heading3
      : headingSource.styles.heading3;
  let quote =
    settings.quoteStyle === defaults.quoteStyle ? base.styles.quote : quoteSource.styles.quote;
  const image = appendStyles(
    base.styles.image,
    settings.imageRadius !== defaults.imageRadius ? `border-radius:${settings.imageRadius}px` : '',
  );

  if (accentChanged || settings.headingStyle !== defaults.headingStyle) {
    title = appendStyles(title, `border-color:${settings.accentColor}`);
    heading1 = appendStyles(heading1, `border-color:${settings.accentColor}`);
    heading2 = appendStyles(
      heading2,
      `background:${settings.accentColor}`,
      'border-color:transparent',
      'color:#ffffff',
    );
    heading3 = appendStyles(
      heading3,
      `border-color:${accentBorder}`,
      `border-left-color:${settings.accentColor}`,
      settings.headingStyle === 'simple' ? `background:${accentTint}` : '',
    );
  }

  if (accentChanged || settings.quoteStyle !== defaults.quoteStyle) {
    quote = appendStyles(
      quote,
      `border-left-color:${settings.accentColor}`,
      settings.quoteStyle === 'simple'
        ? `background:${accentTint};border-color:${accentBorder}`
        : '',
    );
  }

  if (textChanged) {
    title = appendStyles(title, `color:${settings.textColor}`);
    heading1 = appendStyles(heading1, `color:${settings.textColor}`);
    heading3 = appendStyles(heading3, `color:${settings.textColor}`);
    quote = appendStyles(quote, `color:${settings.textColor}`);
  }

  const paragraphOverrides = appendStyles(
    `margin:${settings.paragraphSpacing}em 8px`,
    `color:${settings.textColor}`,
    `font-size:${settings.fontSize}px`,
    `line-height:${settings.lineHeight}`,
    `letter-spacing:${settings.letterSpacing}em`,
    `text-align:${settings.textAlign}`,
    settings.firstLineIndent ? 'text-indent:2em' : 'text-indent:0',
  );

  return {
    ...base,
    id: 'custom',
    label: '自定义',
    description: '可视化主题编辑器生成的主题',
    accent: settings.accentColor,
    swatch: settings.accentColor,
    preview: {
      ...base.preview,
      background: settings.backgroundColor,
      border: accentBorder,
    },
    tokens: {
      primaryColor: settings.accentColor,
      fontFamily,
      fontSize: settings.fontSize,
    },
    styles: {
      ...base.styles,
      container: appendStyles(
        base.styles.container,
        `padding:0 ${settings.pagePadding}px`,
        `background-color:${settings.backgroundColor}`,
        `color:${settings.textColor}`,
        `font-family:${fontFamily}`,
        `font-size:${settings.fontSize}px`,
        `line-height:${settings.lineHeight}`,
      ),
      title,
      paragraph: appendStyles(base.styles.paragraph, paragraphOverrides),
      heading1,
      heading2,
      heading3,
      quote,
      quoteParagraph: appendStyles(
        base.styles.quoteParagraph,
        `color:${settings.textColor}`,
        `line-height:${settings.lineHeight}`,
        `letter-spacing:${settings.letterSpacing}em`,
        `text-align:${settings.textAlign}`,
      ),
      list: appendStyles(
        base.styles.list,
        `color:${settings.textColor}`,
        `font-size:${settings.fontSize}px`,
        `line-height:${settings.lineHeight}`,
        `letter-spacing:${settings.letterSpacing}em`,
      ),
      listItem: appendStyles(base.styles.listItem, `color:${settings.textColor}`),
      listMarker: appendStyles(base.styles.listMarker, `color:${settings.accentColor}`),
      strong: appendStyles(base.styles.strong, `color:${settings.accentColor}`),
      link: appendStyles(base.styles.link, `color:${settings.accentColor}`),
      figure: appendStyles(base.styles.figure, `color:${settings.textColor}`),
      image,
      caption: appendStyles(
        base.styles.caption,
        `color:${colorWithAlpha(settings.textColor, 0.58)}`,
      ),
    },
  };
}

export function parseVisualThemeSettings(value: unknown): VisualThemeSettings | null {
  if (!isRecord(value)) return null;

  const fonts: VisualThemeFont[] = ['sans', 'serif', 'modern'];
  const structures: VisualThemeStructure[] = ['default', 'grace', 'simple'];
  const alignments: VisualThemeAlignment[] = ['left', 'justify'];
  if (
    !isHexColor(value.accentColor) ||
    !isHexColor(value.textColor) ||
    !isHexColor(value.backgroundColor) ||
    !fonts.includes(value.font as VisualThemeFont) ||
    !structures.includes(value.headingStyle as VisualThemeStructure) ||
    !structures.includes(value.quoteStyle as VisualThemeStructure) ||
    !alignments.includes(value.textAlign as VisualThemeAlignment) ||
    typeof value.firstLineIndent !== 'boolean' ||
    !isNumberInRange(value.fontSize, 13, 22) ||
    !isNumberInRange(value.lineHeight, 1.35, 2.4) ||
    !isNumberInRange(value.paragraphSpacing, 0.5, 3) ||
    !isNumberInRange(value.letterSpacing, 0, 0.2) ||
    !isNumberInRange(value.pagePadding, 0, 24) ||
    !isNumberInRange(value.imageRadius, 0, 20)
  ) {
    return null;
  }

  return {
    accentColor: value.accentColor.toLowerCase(),
    textColor: value.textColor.toLowerCase(),
    backgroundColor: value.backgroundColor.toLowerCase(),
    font: value.font as VisualThemeFont,
    fontSize: value.fontSize,
    lineHeight: value.lineHeight,
    paragraphSpacing: value.paragraphSpacing,
    letterSpacing: value.letterSpacing,
    pagePadding: value.pagePadding,
    imageRadius: value.imageRadius,
    textAlign: value.textAlign as VisualThemeAlignment,
    firstLineIndent: value.firstLineIndent,
    headingStyle: value.headingStyle as VisualThemeStructure,
    quoteStyle: value.quoteStyle as VisualThemeStructure,
  };
}

function appendStyles(...declarations: string[]) {
  return declarations.filter(Boolean).join(';');
}

function normalizeHexColor(value: string, fallback: string) {
  return isHexColor(value) ? value.toLowerCase() : fallback;
}

function colorWithAlpha(hex: string, alpha: number) {
  const normalized = hex.slice(1);
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

function isNumberInRange(value: unknown, minimum: number, maximum: number): value is number {
  return (
    typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
