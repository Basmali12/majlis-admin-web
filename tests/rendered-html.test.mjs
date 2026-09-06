import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Alaqa Souq admin shell contains no legacy chat surface", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  const source = await readFile(new URL("../src/main.tsx", import.meta.url), "utf8");
  assert.match(html, /إدارة علاكة سوق/);
  assert.match(html, /assets\/index-/);
  assert.doesNotMatch(html, /لودو|المايكات|الرومات|إدارة البوت/);
  assert.doesNotMatch(html, /رابط المتجر HTTPS|storeUrl/);
  assert.match(source, /حذف نهائي/);
  assert.match(source, /رمز التأكيد/);
  assert.match(source, /marketAdmin:deleteStorePermanently/);
  assert.doesNotMatch(source, /حذف آمن/);
  assert.match(source, /merchantAuth:resetPasswordByAdmin/);
  assert.match(source, /إعدادات التاجر/);
  assert.match(source, /محمية ولا يمكن عرضها/);
  assert.match(source, /name="password" type="password" minLength=\{8\}/);
  assert.doesNotMatch(source, /name="merchantUsername"/);
  assert.doesNotMatch(source, /كلمة المرور المؤقتة/);
});
