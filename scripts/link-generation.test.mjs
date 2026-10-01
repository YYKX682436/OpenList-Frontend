import assert from "node:assert/strict"
import test from "node:test"
import {
  buildLinkUrl,
  resolveLinkObjectPath,
  resolveObjectPath,
} from "../src/hooks/linkPath.ts"

const management = "https://openlist.example"
const download = "https://dl.example"
const folder = "/中国移动云盘/安卓定制V"
const filename = "AnyText_1.0.2.apk"
const filePath = `${folder}/${filename}`
const encodedPath =
  "/%E4%B8%AD%E5%9B%BD%E7%A7%BB%E5%8A%A8%E4%BA%91%E7%9B%98/%E5%AE%89%E5%8D%93%E5%AE%9A%E5%88%B6V/AnyText_1.0.2.apk"

test("folder listing resolves a single filename segment", () => {
  assert.equal(resolveObjectPath(folder, "folder", filename), filePath)
  assert.equal(resolveLinkObjectPath(folder, "folder", filename, "/"), filePath)
})

test("File state trusts pathname regardless of obj.name", () => {
  assert.equal(resolveObjectPath(filePath, "file", "different.apk"), filePath)
  assert.equal(
    resolveLinkObjectPath(filePath, "file", "different.apk", "/"),
    filePath,
  )
})

test("metadata/name mismatch still uses Backend raw_path", () => {
  const pathname = `${folder}/8076多开_k_n.apk`
  const rawPath = `${folder}/8076多开_k_n.apk`
  assert.equal(
    resolveLinkObjectPath(
      pathname,
      "file",
      "wrong-metadata-name.apk",
      "/",
      rawPath,
    ),
    rawPath,
  )
})

test("exact 8076 URL uses Backend raw_path exactly once", () => {
  const rawPath = "/中国移动云盘/安卓定制V/8076多开_k_n.apk"
  const objectPath = resolveLinkObjectPath(
    "/中国移动云盘/安卓定制V/8076多开_k_n.apk",
    "file",
    "8076多开_k_n.apk",
    "/",
    rawPath,
  )
  const url = buildLinkUrl(
    management,
    "https://dl.mc520.top",
    "/d",
    objectPath,
    true,
  )
  assert.equal(
    url,
    "https://dl.mc520.top/d/%E4%B8%AD%E5%9B%BD%E7%A7%BB%E5%8A%A8%E4%BA%91%E7%9B%98/%E5%AE%89%E5%8D%93%E5%AE%9A%E5%88%B6V/8076%E5%A4%9A%E5%BC%80_k_n.apk",
  )
  assert.equal(
    url.split("%E4%B8%AD%E5%9B%BD%E7%A7%BB%E5%8A%A8%E4%BA%91%E7%9B%98").length -
      1,
    1,
  )
  assert.equal(url.split("8076").length - 1, 1)
})

test("legal same-name directory segments are retained", () => {
  assert.equal(
    resolveObjectPath("/foo.apk/foo.apk", "file", "ignored.apk"),
    "/foo.apk/foo.apk",
  )
  assert.equal(
    resolveObjectPath("/foo.apk", "folder", "foo.apk"),
    "/foo.apk/foo.apk",
  )
})

test("Backend raw_path containing base_path is never prefixed twice", () => {
  const basePath = "/中国移动云盘/安卓定制V"
  const rawPath = `${basePath}/8076多开_k_n.apk`
  assert.equal(
    resolveLinkObjectPath(
      "/8076多开_k_n.apk",
      "file",
      "8076多开_k_n.apk",
      basePath,
      rawPath,
    ),
    rawPath,
  )
})

test("legacy fallback applies base_path once to the complete path", () => {
  assert.equal(
    resolveLinkObjectPath(
      "/8076多开_k_n.apk",
      "file",
      "ignored-name.apk",
      "/中国移动云盘/安卓定制V",
    ),
    "/中国移动云盘/安卓定制V/8076多开_k_n.apk",
  )
})

test("sign query remains attached to the Backend raw_path URL", () => {
  const rawPath = `${folder}/${filename}`
  const objectPath = resolveLinkObjectPath(
    "/AnyText_1.0.2.apk",
    "file",
    filename,
    folder,
    rawPath,
  )
  const url = `${buildLinkUrl(management, download, "/d", objectPath, true)}?sign=signed-value`
  const parsed = new URL(url)
  assert.equal(decodeURIComponent(parsed.pathname), `/d${rawPath}`)
  assert.equal(parsed.searchParams.get("sign"), "signed-value")
})

test("encoded and unencoded direct copies retain the same path segments", () => {
  const rawPath = "/中国移动云盘/安卓定制V/8076多开_k_n.apk"
  assert.equal(
    buildLinkUrl(management, download, "/d", rawPath, true),
    `${download}/d/%E4%B8%AD%E5%9B%BD%E7%A7%BB%E5%8A%A8%E4%BA%91%E7%9B%98/%E5%AE%89%E5%8D%93%E5%AE%9A%E5%88%B6V/8076%E5%A4%9A%E5%BC%80_k_n.apk`,
  )
  assert.equal(
    buildLinkUrl(management, download, "/d", rawPath, false),
    `${download}/d${rawPath}`,
  )
})

test("preview page stays on management host", () => {
  assert.equal(
    buildLinkUrl(management, download, "", filePath, true),
    `${management}${encodedPath}`,
  )
})

test("proxy link stays on management host", () => {
  assert.equal(
    buildLinkUrl(management, download, "/p", filePath, true),
    `${management}/p${encodedPath}`,
  )
})

test("share link stays on management host", () => {
  assert.equal(
    buildLinkUrl(management, download, "/sd", filePath, true),
    `${management}/sd${encodedPath}`,
  )
})

test("archive link stays on management host", () => {
  assert.equal(
    buildLinkUrl(management, download, "/ae", filePath, true),
    `${management}/ae${encodedPath}`,
  )
})

test("unset download base keeps direct links on the management host", () => {
  assert.equal(
    buildLinkUrl(management, undefined, "/d", filePath, true),
    `${management}/d${encodedPath}`,
  )
})
