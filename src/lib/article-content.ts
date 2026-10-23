export const ARTICLE_MAX_BYTES = 48 * 1024;

/** Client-side feedback; the backend remains responsible for sanitizing HTML. */
export function articleContentError(html: string): string | null {
  if (new TextEncoder().encode(html).byteLength > ARTICLE_MAX_BYTES)
    return 'Bài viết tối đa 48 KiB. Vui lòng rút gọn nội dung trước khi lưu.';
  const document = new DOMParser().parseFromString(html, 'text/html');
  document
    .querySelectorAll('script,style,textarea,option,iframe,object,embed,svg,math')
    .forEach((node) => node.remove());
  const text = document.body.textContent?.replace(/[\s\u200b-\u200d\ufeff]/gu, '');
  const hasImage = [...document.querySelectorAll('img[data-file-id]')].some((image) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      image.getAttribute('data-file-id') ?? '',
    ),
  );
  return text || hasImage ? null : 'Vui lòng nhập nội dung bài viết.';
}
