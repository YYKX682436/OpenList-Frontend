export type LinkPathState = "file" | "folder"

const withoutTrailingSlash = (path: string) =>
  path.length > 1 ? path.replace(/\/+$/, "") : path

/**
 * Resolve the virtual path for an object using the router's current path
 * semantics. In File state pathname already identifies the current object;
 * in Folder state it identifies the parent directory.
 */
export const resolveObjectPath = (
  pathname: string,
  state: LinkPathState,
  objName: string,
) => {
  const currentPath = withoutTrailingSlash(pathname || "/")
  if (state === "file") return currentPath
  return `${currentPath === "/" ? "" : currentPath}/${objName}` || "/"
}

const withoutLeadingSlash = (path: string) => path.replace(/^\/+/, "")

/**
 * Resolve the complete path used to build a normal link. Backend raw_path is
 * already canonical and must never receive base_path again. The fallback is
 * for older backends and applies base_path once to the complete object path.
 */
export const resolveLinkObjectPath = (
  pathname: string,
  state: LinkPathState,
  objName: string,
  basePath: string,
  rawPath?: string,
) => {
  if (rawPath) return rawPath.startsWith("/") ? rawPath : `/${rawPath}`

  const objectPath = resolveObjectPath(pathname, state, objName)
  const normalizedBase = withoutTrailingSlash(basePath || "")
  if (!normalizedBase || normalizedBase === "/") return objectPath
  return `${normalizedBase}/${withoutLeadingSlash(objectPath)}`
}

export const encodeLinkPath = (path: string, encodeAll?: boolean) =>
  path
    .split("/")
    .map((part) =>
      encodeAll
        ? encodeURIComponent(part)
        : part
            .replace(/%/g, "%25")
            .replace(/\?/g, "%3F")
            .replace(/#/g, "%23")
            .replace(/ /g, "%20"),
    )
    .join("/")

export const buildLinkUrl = (
  host: string,
  downloadBase: string | undefined,
  prefix: string,
  path: string,
  encodeAll?: boolean,
) => {
  const normalizedDownloadBase = downloadBase?.replace(/\/+$/, "")
  const linkHost =
    prefix === "/d" && normalizedDownloadBase ? normalizedDownloadBase : host
  return `${linkHost}${prefix}${encodeLinkPath(path, encodeAll)}`
}
