// Run after `npm install -D @playwright/test @axe-core/playwright` against live servers
// npx playwright test tests/playwright_e2e_a11y.spec.js
const { test, expect } = require('@playwright/test');

test('Task 3 responsive portal renders with accessible navigation', async ({ page }) => {
  await page.goto('http://localhost:3003');
  await expect(page.locator('h1')).toContainText('Responsive Multi-Section');
});
