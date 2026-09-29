export const getLinkHost = (
  api: string,
  prefix: string,
  downloadBase: string | undefined,
) => {
  const normalizedDownloadBase = downloadBase?.replace(/\/+$/, "")

  return prefix === "/d" && normalizedDownloadBase
    ? normalizedDownloadBase
    : api
}
