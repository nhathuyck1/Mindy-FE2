import { expect, test } from '@playwright/test';
import { fourLanguageAuthoring, fourLanguageStarters } from '../fixtures/code-language-data';
import { mockHomepageApi, testUser } from './api-fixtures';

test('mentor opens four-language authoring and previews Python and C# starter code', async ({
  page,
}, info) => {
  await mockHomepageApi(page);
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ json: { ...testUser, role: 'MENTOR' } }),
  );
  const id = fourLanguageAuthoring.assignment.id;
  await page.route(`**/api/v1/mentor/assignments/${id}`, (route) =>
    route.fulfill({ json: fourLanguageAuthoring.assignment }),
  );
  await page.route(`**/api/v1/mentor/assignments/${id}/code`, (route) =>
    route.fulfill({ json: fourLanguageAuthoring }),
  );
  await page.route('**/api/v1/mentor/code-signatures/preview', (route) =>
    route.fulfill({ json: fourLanguageStarters }),
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`/mentor/assignments/${id}`);
  await page.getByRole('tab', { name: 'Hàm cần viết', exact: true }).click();
  for (const [label, source] of [
    ['Python', fourLanguageStarters.python3],
    ['C#', fourLanguageStarters.csharp],
  ]) {
    await expect(page.getByRole('checkbox', { name: new RegExp(`^${label} `) })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(
      page.getByRole('textbox', { name: `Code khởi đầu ${label}`, exact: true }),
    ).toHaveValue(source);
  }
  await page.screenshot({
    path: `test-results/code-four-languages-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
  expect(errors).toEqual([]);
});
