/**
 * Mirror an fs/list or fs/get logical request path in an ASCII-safe header.
 * Some EdgeOne requests have arrived without their JSON body, so the backend
 * can use this value only when body.path is absent.
 */
export const fsRequestPathHeaders = (path: string) => ({
  "X-OpenList-Path": encodeURIComponent(path),
})
