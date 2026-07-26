export type WechatThemeId = 'default' | 'grace' | 'simple';

export interface WechatThemeTokens {
  primaryColor: string;
  fontFamily: string;
  fontSize: number;
}

export interface WechatThemeStyles {
  container: string;
  title: string;
  meta: string;
  metaText: string;
  badge: string;
  paragraph: string;
  heading1: string;
  heading2: string;
  heading3: string;
  quote: string;
  quoteParagraph: string;
  codeShell: string;
  codeToolbar: string;
  codeDotRed: string;
  codeDotYellow: string;
  codeDotGreen: string;
  codePre: string;
  code: string;
  list: string;
  listItem: string;
  listMarker: string;
  inlineCode: string;
  strong: string;
  em: string;
  delete: string;
  link: string;
  divider: string;
  figure: string;
  image: string;
  caption: string;
  footer: string;
}

export interface WechatTheme {
  id: WechatThemeId;
  label: string;
  description: string;
  accent: string;
  swatch: string;
  preview: {
    background: string;
    border: string;
    shadow: string;
  };
  tokens: WechatThemeTokens;
  styles: WechatThemeStyles;
}

const primaryColor = '#0F4C81';
const foreground = '#0a0a0a';
const blockquoteBackground = '#f7f7f7';
const sansFont =
  "-apple-system-font,BlinkMacSystemFont,'Helvetica Neue','PingFang SC','Hiragino Sans GB','Microsoft YaHei UI','Microsoft YaHei',Arial,sans-serif";
const monoFont = "Menlo,Monaco,Consolas,'Courier New',monospace";
const enhancedMonoFont = "'Fira Code',Menlo,'Operator Mono',Consolas,Monaco,monospace";

interface CreateThemeOptions {
  id: WechatThemeId;
  label: string;
  description: string;
  primaryColor: string;
  swatch?: string;
  fontFamily?: string;
  fontSize?: number;
  preview?: Partial<WechatTheme['preview']>;
  styles?: Partial<WechatThemeStyles>;
}

interface HeadingOneOptions {
  padding?: string;
  fontSize?: string;
  textShadow?: string;
}

function styles(...declarations: string[]) {
  return declarations.filter(Boolean).join(';');
}

function createHeadingOneStyle(
  color: string,
  margin: string,
  { padding = '0 1em', fontSize = '19.2px', textShadow = '' }: HeadingOneOptions = {},
) {
  return styles(
    'display:table',
    `margin:${margin}`,
    `padding:${padding}`,
    `border-bottom:2px solid ${color}`,
    `color:${foreground}`,
    `font-size:${fontSize}`,
    'font-weight:bold',
    'text-align:center',
    textShadow ? `text-shadow:${textShadow}` : '',
  );
}

function createBaseStyles(color: string, fontFamily = sansFont, fontSize = 16): WechatThemeStyles {
  return {
    // dolfly/wxmd 的 CSS 会在导出时展开；这里直接生成等价内联样式，确保粘贴到微信后不丢失。
    container: styles(
      'box-sizing:border-box',
      'width:100%',
      'margin:0 auto',
      `color:${foreground}`,
      `font-family:${fontFamily}`,
      `font-size:${fontSize}px`,
      'line-height:1.75',
      'text-align:left',
      'word-break:break-word',
      'overflow-wrap:break-word',
    ),
    // 上游会移除正文首元素的上边距，所以文章标题使用单独的首元素版本。
    title: createHeadingOneStyle(color, '0 auto 1em'),
    meta: 'display:none',
    metaText: 'color:#888888',
    badge: 'display:none',
    paragraph: styles(
      'margin:1.5em 8px',
      `color:${foreground}`,
      'font-size:1em',
      'font-weight:400',
      'line-height:1.75',
      'letter-spacing:0.1em',
      'text-align:left',
    ),
    heading1: createHeadingOneStyle(color, '2em auto 1em'),
    heading2: styles(
      'display:table',
      'margin:4em auto 2em',
      'padding:0 0.2em',
      `background:${color}`,
      'color:#ffffff',
      'font-size:19.2px',
      'font-weight:bold',
      'text-align:center',
    ),
    heading3: styles(
      'margin:2em 8px 0.75em 0',
      'padding-left:8px',
      `border-left:3px solid ${color}`,
      `color:${foreground}`,
      'font-size:17.6px',
      'font-weight:bold',
      'line-height:1.2',
      'text-align:left',
    ),
    quote: styles(
      'box-sizing:border-box',
      'margin:0 0 1em',
      'padding:1em',
      `border-left:4px solid ${color}`,
      'border-radius:6px',
      `background:${blockquoteBackground}`,
      `color:${foreground}`,
      'font-style:normal',
    ),
    quoteParagraph: styles(
      'display:block',
      'margin:0',
      `color:${foreground}`,
      'font-size:1em',
      'line-height:1.75',
      'letter-spacing:0.1em',
    ),
    codeShell: styles(
      'box-sizing:border-box',
      'margin:10px 8px',
      'padding:0',
      'border-radius:8px',
      'background:#0d1117',
      'color:#c9d1d9',
      'line-height:1.5',
      'overflow:hidden',
    ),
    codeToolbar: 'display:flex;align-items:center;gap:7px;margin:0;padding:11px 14px 0',
    codeDotRed: 'display:inline-block;width:10px;height:10px;border-radius:50%;background:#ff5f56',
    codeDotYellow:
      'display:inline-block;width:10px;height:10px;border-radius:50%;background:#ffbd2e',
    codeDotGreen:
      'display:inline-block;width:10px;height:10px;border-radius:50%;background:#27c93f',
    codePre: styles(
      'box-sizing:border-box',
      'margin:0',
      'padding:0',
      'border-radius:8px',
      'background:transparent',
      'color:#c9d1d9',
      'font-size:90%',
      'line-height:1.5',
      'overflow-x:auto',
    ),
    code: styles(
      'display:block',
      'margin:0',
      'padding:0.5em 1em 1em',
      'background:none',
      'color:inherit',
      `font-family:${monoFont}`,
      'text-indent:0',
      'white-space:pre',
      'overflow-x:auto',
    ),
    list: styles(
      'margin:0',
      'padding-left:1em',
      'list-style:none',
      `color:${foreground}`,
      'font-size:1em',
      'line-height:1.75',
    ),
    listItem: `display:block;margin:0.2em 8px;color:${foreground}`,
    listMarker: `display:inline-block;min-width:1.45em;color:${foreground};font-weight:400`,
    inlineCode: styles(
      'padding:3px 5px',
      'border-radius:4px',
      'background:rgba(27,31,35,0.05)',
      'color:#d14',
      `font-family:${monoFont}`,
      'font-size:90%',
      'line-height:inherit',
    ),
    strong: `color:${color};font-size:inherit;font-weight:bold`,
    em: 'font-size:inherit;font-style:italic',
    delete: 'color:inherit;text-decoration:line-through',
    link: 'color:#576b95;text-decoration:none',
    divider: styles(
      'box-sizing:border-box',
      'height:0.4em',
      'margin:1.5em 0',
      'border-style:solid',
      'border-width:2px 0 0',
      'border-color:rgba(0,0,0,0.1)',
      'background:transparent',
      '-webkit-transform-origin:0 0',
      '-webkit-transform:scale(1,0.5)',
      'transform-origin:0 0',
      'transform:scale(1,0.5)',
    ),
    figure: `margin:1.5em 8px;color:${foreground}`,
    image: styles(
      'display:block',
      'width:auto',
      'height:auto',
      'max-width:100%',
      'margin:0.1em auto 0.5em',
      'border-radius:4px',
    ),
    caption: 'text-align:center;color:#888888;font-size:0.8em;line-height:1.75',
    footer: 'display:none',
  };
}

function createWechatTheme(options: CreateThemeOptions): WechatTheme {
  const fontFamily = options.fontFamily ?? sansFont;
  const fontSize = options.fontSize ?? 16;
  const baseStyles = createBaseStyles(options.primaryColor, fontFamily, fontSize);

  return {
    id: options.id,
    label: options.label,
    description: options.description,
    accent: options.primaryColor,
    swatch: options.swatch ?? options.primaryColor,
    preview: {
      background: '#ffffff',
      border: '#e5e7eb',
      shadow: '0 1px 2px rgba(0,0,0,0.05)',
      ...options.preview,
    },
    tokens: {
      primaryColor: options.primaryColor,
      fontFamily,
      fontSize,
    },
    styles: {
      ...baseStyles,
      ...options.styles,
    },
  };
}

const defaultTheme = createWechatTheme({
  id: 'default',
  label: '经典',
  description: 'dolfly/wxmd 经典主题',
  primaryColor,
});

const graceTheme = createWechatTheme({
  id: 'grace',
  label: '优雅',
  description: 'dolfly/wxmd · @brzhang',
  primaryColor,
  preview: {
    shadow: '0 8px 24px rgba(15,76,129,0.10)',
  },
  styles: {
    title: createHeadingOneStyle(primaryColor, '0 auto 1em', {
      padding: '0.5em 1em',
      fontSize: '22.4px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    }),
    heading1: createHeadingOneStyle(primaryColor, '2em auto 1em', {
      padding: '0.5em 1em',
      fontSize: '22.4px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    }),
    heading2: styles(
      'display:table',
      'margin:4em auto 2em',
      'padding:0.3em 1em',
      'border-radius:8px',
      `background:${primaryColor}`,
      'color:#ffffff',
      'font-size:20.8px',
      'font-weight:bold',
      'text-align:center',
      'box-shadow:0 4px 6px rgba(0,0,0,0.1)',
    ),
    heading3: styles(
      'margin:2em 8px 0.75em 0',
      'padding-left:12px',
      `border-left:4px solid ${primaryColor}`,
      `border-bottom:1px dashed ${primaryColor}`,
      `color:${foreground}`,
      'font-size:19.2px',
      'font-weight:bold',
      'line-height:1.2',
      'text-align:left',
    ),
    quote: styles(
      'box-sizing:border-box',
      'margin:0 0 1em',
      'padding:1em 1em 1em 2em',
      `border-left:4px solid ${primaryColor}`,
      'border-radius:6px',
      `background:${blockquoteBackground}`,
      'color:rgba(0,0,0,0.6)',
      'font-style:italic',
      'box-shadow:0 4px 6px rgba(0,0,0,0.05)',
    ),
    codeShell: styles(
      'box-sizing:border-box',
      'margin:10px 8px',
      'padding:0',
      'border-radius:8px',
      'background:#0d1117',
      'color:#c9d1d9',
      'line-height:1.5',
      'overflow:hidden',
      'box-shadow:inset 0 0 10px rgba(0,0,0,0.05)',
    ),
    code: styles(
      'display:block',
      'margin:0',
      'padding:0.5em 1em 1em',
      'background:none',
      'color:inherit',
      `font-family:${enhancedMonoFont}`,
      'text-indent:0',
      'white-space:pre',
      'overflow-x:auto',
    ),
    list: styles(
      'margin:0',
      'padding-left:1.5em',
      'list-style:none',
      `color:${foreground}`,
      'font-size:1em',
      'line-height:1.75',
    ),
    listItem: `display:block;margin:0.5em 8px;color:${foreground}`,
    divider: styles(
      'height:1px',
      'margin:2em 0',
      'border:0',
      'background:linear-gradient(to right,rgba(0,0,0,0),rgba(0,0,0,0.1),rgba(0,0,0,0))',
    ),
    image: styles(
      'display:block',
      'width:auto',
      'height:auto',
      'max-width:100%',
      'margin:0.1em auto 0.5em',
      'border-radius:8px',
      'box-shadow:0 4px 8px rgba(0,0,0,0.1)',
    ),
  },
});

const simpleTheme = createWechatTheme({
  id: 'simple',
  label: '简洁',
  description: 'dolfly/wxmd · @okooo5km',
  primaryColor,
  styles: {
    title: createHeadingOneStyle(primaryColor, '0 auto 1em', {
      padding: '0.5em 1em',
      fontSize: '22.4px',
      textShadow: '1px 1px 3px rgba(0,0,0,0.05)',
    }),
    heading1: createHeadingOneStyle(primaryColor, '2em auto 1em', {
      padding: '0.5em 1em',
      fontSize: '22.4px',
      textShadow: '1px 1px 3px rgba(0,0,0,0.05)',
    }),
    heading2: styles(
      'display:table',
      'margin:4em auto 2em',
      'padding:0.3em 1.2em',
      'border-radius:8px 24px 8px 24px',
      `background:${primaryColor}`,
      'color:#ffffff',
      'font-size:20.8px',
      'font-weight:bold',
      'text-align:center',
      'box-shadow:0 2px 6px rgba(0,0,0,0.06)',
    ),
    heading3: styles(
      'margin:2em 8px 0.75em 0',
      'padding-left:12px',
      `border-left:4px solid ${primaryColor}`,
      'border-top:1px solid rgba(15,76,129,0.1)',
      'border-right:1px solid rgba(15,76,129,0.1)',
      'border-bottom:1px solid rgba(15,76,129,0.1)',
      'border-radius:6px',
      'background:rgba(15,76,129,0.08)',
      `color:${foreground}`,
      'font-size:19.2px',
      'font-weight:bold',
      'line-height:2.4em',
      'text-align:left',
    ),
    quote: styles(
      'box-sizing:border-box',
      'margin:0 0 1em',
      'padding:1em 1em 1em 2em',
      `border-left:4px solid ${primaryColor}`,
      'border-top:1px solid rgba(0,0,0,0.04)',
      'border-right:1px solid rgba(0,0,0,0.04)',
      'border-bottom:1px solid rgba(0,0,0,0.04)',
      'border-radius:6px',
      `background:${blockquoteBackground}`,
      'color:rgba(0,0,0,0.6)',
      'font-style:italic',
    ),
    codeShell: styles(
      'box-sizing:border-box',
      'margin:10px 8px',
      'padding:0',
      'border:1px solid rgba(0,0,0,0.04)',
      'border-radius:8px',
      'background:#0d1117',
      'color:#c9d1d9',
      'line-height:1.5',
      'overflow:hidden',
    ),
    code: styles(
      'display:block',
      'margin:0',
      'padding:0.5em 1em 1em',
      'background:none',
      'color:inherit',
      `font-family:${enhancedMonoFont}`,
      'text-indent:0',
      'white-space:pre',
      'overflow-x:auto',
    ),
    list: styles(
      'margin:0',
      'padding-left:1.5em',
      'list-style:none',
      `color:${foreground}`,
      'font-size:1em',
      'line-height:1.75',
    ),
    listItem: `display:block;margin:0.5em 8px;color:${foreground}`,
    divider: styles(
      'height:1px',
      'margin:2em 0',
      'border:0',
      'background:linear-gradient(to right,rgba(0,0,0,0),rgba(0,0,0,0.1),rgba(0,0,0,0))',
    ),
    image: styles(
      'display:block',
      'width:auto',
      'height:auto',
      'max-width:100%',
      'margin:0.1em auto 0.5em',
      'border:1px solid rgba(0,0,0,0.04)',
      'border-radius:8px',
    ),
  },
});

export const wechatThemes = [defaultTheme, graceTheme, simpleTheme] as const satisfies readonly WechatTheme[];

export const defaultWechatThemeId: WechatThemeId = 'default';

export function isWechatThemeId(value: string | null | undefined): value is WechatThemeId {
  return wechatThemes.some((theme) => theme.id === value);
}

export function getWechatTheme(themeId?: string | null): WechatTheme {
  return wechatThemes.find((theme) => theme.id === themeId) ?? wechatThemes[0];
}
