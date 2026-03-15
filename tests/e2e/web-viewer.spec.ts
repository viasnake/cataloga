import { expect, test, type Locator, type Page } from '@playwright/test';

const expectNoHorizontalOverflow = async (page: Page) => {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );
  expect(hasOverflow).toBeFalsy();
};

const expectVerticalFlow = async (locators: Locator[]) => {
  let previousBottom = 0;

  for (const locator of locators) {
    const box = await locator.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY
      };
    });
    expect(box).not.toBeNull();

    if (!box) {
      continue;
    }

    expect(box.top + 1).toBeGreaterThanOrEqual(previousBottom);
    previousBottom = box.bottom - 1;
  }
};

test('overview leads into a stable entity browsing flow', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /move from wall-of-panels to a focused path/i
    })
  ).toBeVisible();

  await expectVerticalFlow([
    page.locator('.site-header'),
    page.locator('.hero-panel'),
    page.locator('.stats-grid')
  ]);
  await expectNoHorizontalOverflow(page);

  await page
    .getByRole('link', { name: /browse entities/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/entities$/u);

  await page.getByLabel('Search').fill('web');
  await expect(page.locator('.entity-card').first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const firstCard = page.locator('.entity-card').first();
  const firstCardTitle = (await firstCard.locator('h3').textContent())?.trim() ?? '';
  await firstCard.click();

  await expect(page).toHaveURL(/\/entities\//u);
  await expect(page.getByRole('heading', { level: 1, name: firstCardTitle })).toBeVisible();
  await expectVerticalFlow([
    page.locator('.breadcrumbs'),
    page.locator('.detail-hero'),
    page.locator('.detail-page-grid')
  ]);
  await expectNoHorizontalOverflow(page);
});

test('entity detail deep link survives reload and preserves return context', async ({ page }) => {
  await page.goto('/entities/host-web-01?q=web');

  await expect(page.getByRole('heading', { level: 1, name: 'web-01' })).toBeVisible();
  await expect(page.getByRole('link', { name: /back to results/i })).toHaveAttribute(
    'href',
    /\/entities\?q=web/u
  );
  await expectNoHorizontalOverflow(page);

  await page.reload();

  await expect(page.getByRole('heading', { level: 1, name: 'web-01' })).toBeVisible();
  await expect(page.locator('.relation-card')).toHaveCount(3);
  await expectNoHorizontalOverflow(page);
});

test('unknown route renders the in-app not found page', async ({ page }) => {
  await page.goto('/totally-unknown-route');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /outside the published viewer routes/i
  );
  await expectNoHorizontalOverflow(page);
});
