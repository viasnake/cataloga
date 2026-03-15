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

test('workspace leads into explore and node detail flow', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /ネットワーク全体を、関係性から読む。/u
    })
  ).toBeVisible();

  await expectVerticalFlow([
    page.locator('header').first(),
    page.locator('section').nth(0),
    page.locator('section').nth(1)
  ]);
  await expectNoHorizontalOverflow(page);

  await page.getByRole('link', { name: /探索を始める/u }).click();
  await expect(page).toHaveURL(/\/explore$/u);

  await page.getByLabel('検索').fill('web');
  await expect(
    page
      .locator('a')
      .filter({ has: page.locator('h3') })
      .first()
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const firstCard = page
    .locator('a')
    .filter({ has: page.locator('h3') })
    .first();
  const firstCardTitle = (await firstCard.locator('h3').textContent())?.trim() ?? '';
  await firstCard.click();

  await expect(page).toHaveURL(/\/nodes\//u);
  await expect(page.getByRole('heading', { level: 1, name: firstCardTitle })).toBeVisible();
  await expectVerticalFlow([
    page.locator('nav[aria-label="Breadcrumb"]'),
    page.locator('section').nth(0),
    page.locator('section').nth(1)
  ]);
  await expectNoHorizontalOverflow(page);
});

test('node deep link survives reload and preserves return context', async ({ page }) => {
  await page.goto('/nodes/host-web-01?q=web');

  await expect(page.getByRole('heading', { level: 1, name: 'web-01' })).toBeVisible();
  await expect(page.getByRole('link', { name: /結果に戻る/u })).toHaveAttribute(
    'href',
    /\/explore\?q=web/u
  );
  await expect(page.locator('svg[aria-label$="関係グラフ"]')).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.reload();

  await expect(page.getByRole('heading', { level: 1, name: 'web-01' })).toBeVisible();
  await expect(page.locator('svg[aria-label$="関係グラフ"]')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('unknown route renders the in-app not found page', async ({ page }) => {
  await page.goto('/totally-unknown-route');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /このページは公開中の viewer に存在しません/u
  );
  await expectNoHorizontalOverflow(page);
});
