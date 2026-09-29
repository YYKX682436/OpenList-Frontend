import assert from "node:assert/strict"
import test from "node:test"
import { getLinkHost } from "../src/hooks/linkHost.ts"

const api = "https://openlist.example"
const downloadBase = "https://dl.example/"

test("ordinary direct /d links use the configured download base", () => {
  assert.equal(getLinkHost(api, "/d", downloadBase), "https://dl.example")
})

test("preview links stay on the management origin", () => {
  assert.equal(getLinkHost(api, "", downloadBase), api)
})

test("proxy links stay on the management origin", () => {
  assert.equal(getLinkHost(api, "/p", downloadBase), api)
})

test("share links stay on the management origin", () => {
  assert.equal(getLinkHost(api, "/sd", downloadBase), api)
})

test("archive links stay on the management origin", () => {
  assert.equal(getLinkHost(api, "/ae", downloadBase), api)
})

test("unset download base keeps direct links on the API origin", () => {
  assert.equal(getLinkHost(api, "/d", undefined), api)
  assert.equal(getLinkHost(api, "/d", ""), api)
})
