const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  generateSlug,
  cleanHtml,
  calculateReadingTime,
  paginate,
} = require("../src/utils/helpers");
test("HTML sanitizer preserves educational markup and removes executable content", () => {
  const clean = cleanHtml(
    '<h2>Lesson</h2><p onclick="alert(1)">Hello<script>alert(1)</script></p><a href="javascript:alert(1)">link</a><img src="/uploads/test.png" onerror="alert(1)">',
  );
  assert.match(clean, /<h2>Lesson<\/h2>/);
  assert.doesNotMatch(clean, /onclick|script|onerror/);
});
test("pagination and reading time handle empty and out-of-range input", () => {
  assert.deepEqual(paginate({ page: -4, limit: 10000 }), {
    page: 1,
    limit: 100,
    offset: 0,
  });
  assert.equal(calculateReadingTime(""), 1);
  assert.equal(calculateReadingTime("<p>" + "word ".repeat(201) + "</p>"), 2);
  assert.equal(
    generateSlug("Introduction to React.js!"),
    "introduction-to-reactjs",
  );
});
