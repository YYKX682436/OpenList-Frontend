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
  const currentName = currentPath.split("/").pop()

  if (state === "file" && currentName === objName) {
    return currentPath
  }

  return `${currentPath === "/" ? "" : currentPath}/${objName}` || "/"
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
