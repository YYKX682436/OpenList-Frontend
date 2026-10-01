import { objStore, selectedObjs, State, me } from "~/store"
import { Obj, ArchiveObj } from "~/types"
import { base_path, api, encodePath, standardizePath } from "~/utils"
import { useRouter, useUtil } from "."
import { cookieStorage } from "@solid-primitives/storage"
import {
  buildLinkUrl,
  resolveLinkObjectPath,
  resolveObjectPath,
} from "./linkPath"

type URLType = "preview" | "direct" | "proxy"

// get download url by dir and obj
const getLinkByObjectPath = (
  objectPath: string,
  obj: Obj,
  type: URLType = "direct",
  isShare: boolean,
  encodeAll?: boolean,
) => {
  let path = standardizePath(objectPath, true)
  let host = api
  let prefix = isShare ? "/sd" : type === "direct" ? "/d" : "/p"
  if (type === "preview") {
    prefix = ""
    if (!api.startsWith(location.origin + base_path))
      host = location.origin + base_path
  } else if (isShare) {
    path = path.replace(/^\/@s(?=\/|$)/, "")
  }
  const { inner_path, archive, pass: archive_pass } = obj as ArchiveObj
  if (archive) {
    prefix = "/ae"
    const parentPath = path.slice(0, path.lastIndexOf("/")) || "/"
    path = `${parentPath === "/" ? "" : parentPath}/${archive.name}`
  }
  let QP = () => {
    QP = () => "&"
    return "?"
  }
  let ans = buildLinkUrl(
    host,
    import.meta.env.VITE_DOWNLOAD_URL,
    prefix,
    path,
    encodeAll,
  )
  if (type !== "preview" && !isShare && obj.sign) {
    ans += `${QP()}sign=${obj.sign}`
  }
  if (type !== "preview" && isShare) {
    const pwd = cookieStorage.getItem("browser-password") || ""
    if (pwd) {
      ans += `${QP()}pwd=${pwd}`
    }
  }
  if (archive) {
    let inner = `${inner_path}/${obj.name}`
    ans += `${QP()}inner=${encodePath(inner, encodeAll)}${archive_pass ? `&pass=${encodeURIComponent(archive_pass)}` : ""}`
  }
  return ans
}

// Legacy callers provide a parent directory. Convert it to one full object
// path here, while preferring the Backend's already-canonical raw_path.
export const getLinkByDirAndObj = (
  dir: string,
  obj: Obj,
  type: URLType = "direct",
  isShare: boolean,
  encodeAll?: boolean,
) => {
  const objectPath =
    type === "preview" || isShare
      ? resolveObjectPath(dir, "folder", obj.name)
      : resolveLinkObjectPath(
          dir,
          "folder",
          obj.name,
          me().base_path,
          obj.raw_path,
        )
  return getLinkByObjectPath(objectPath, obj, type, isShare, encodeAll)
}

// get download link by current state and pathname
export const useLink = () => {
  const { pathname, isShare } = useRouter()
  const getLinkByObj = (obj: Obj, type?: URLType, encodeAll?: boolean) => {
    const currentPath = pathname()
    const linkType = type || "direct"
    const state = objStore.state === State.File ? "file" : "folder"
    const objectPath =
      linkType === "preview" || isShare()
        ? resolveObjectPath(currentPath, state, obj.name)
        : resolveLinkObjectPath(
            currentPath,
            state,
            obj.name,
            me().base_path,
            obj.raw_path,
          )
    return getLinkByObjectPath(objectPath, obj, linkType, isShare(), encodeAll)
  }
  const rawLink = (obj: Obj, encodeAll?: boolean) => {
    return getLinkByObj(obj, "direct", encodeAll)
  }
  return {
    getLinkByObj: getLinkByObj,
    rawLink: rawLink,
    proxyLink: (obj: Obj, encodeAll?: boolean) => {
      return getLinkByObj(obj, "proxy", encodeAll)
    },
    previewPage: (obj: Obj, encodeAll?: boolean) => {
      return getLinkByObj(obj, "preview", encodeAll)
    },
    currentObjLink: (encodeAll?: boolean) => {
      return rawLink(objStore.obj, encodeAll)
    },
  }
}

export const useSelectedLink = () => {
  const { previewPage, rawLink: rawUrl } = useLink()
  const rawLinks = (encodeAll?: boolean) => {
    return selectedObjs()
      .filter((obj) => !obj.is_dir)
      .map((obj) => rawUrl(obj, encodeAll))
  }
  return {
    rawLinks: rawLinks,
    previewPagesText: () => {
      return selectedObjs()
        .map((obj) => previewPage(obj, true))
        .join("\n")
    },
    rawLinksText: (encodeAll?: boolean) => {
      return rawLinks(encodeAll).join("\n")
    },
  }
}

export const useCopyLink = () => {
  const { copy } = useUtil()
  const { previewPagesText, rawLinksText } = useSelectedLink()
  const { currentObjLink } = useLink()
  return {
    copySelectedPreviewPage: () => {
      copy(previewPagesText())
    },
    copySelectedRawLink: (encodeAll?: boolean) => {
      copy(rawLinksText(encodeAll))
    },
    copyCurrentRawLink: (encodeAll?: boolean) => {
      copy(currentObjLink(encodeAll))
    },
  }
}
