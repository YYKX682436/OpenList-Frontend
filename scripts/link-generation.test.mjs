import assert from "node:assert/strict"
import test from "node:test"
import { buildLinkUrl, resolveObjectPath } from "../src/hooks/linkPath.ts"

const management = "https://openlist.example"
const download = "https://dl.example"
const folder = "/中国移动云盘/安卓定制V"
const filename = "AnyText_1.0.2.apk"
const filePath = `${folder}/${filename}`
const encodedPath =
  "/%E4%B8%AD%E5%9B%BD%E7%A7%BB%E5%8A%A8%E4%BA%91%E7%9B%98/%E5%AE%89%E5%8D%93%E5%AE%9A%E5%88%B6V/AnyText_1.0.2.apk"

test("folder listing resolves one final filename segment", () => {
  assert.equal(resolveObjectPath(folder, "folder", filename), filePath)
})

test("file state keeps the current file path without appending its name again", () => {
  assert.equal(resolveObjectPath(filePath, "file", filename), filePath)
})

test("file state preserves a same-name parent directory", () => {
  assert.equal(
    resolveObjectPath("/foo.apk/foo.apk", "file", "foo.apk"),
    "/foo.apk/foo.apk",
  )
  assert.equal(
    resolveObjectPath("/foo.apk", "folder", "foo.apk"),
    "/foo.apk/foo.apk",
  )
})

test("encoded direct URL contains the canonical path exactly once", () => {
  const path = resolveObjectPath(folder, "folder", filename)
  const url = buildLinkUrl(management, download, "/d", path, true)

  assert.equal(url, `${download}/d${encodedPath}`)
  assert.equal(url.split(filename).length - 1, 1)
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
