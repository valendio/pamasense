import { expect, test } from '@playwright/test';

test.describe('PAMASense operational workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('guidance-page')).toBeVisible();
  });

  test('1. application loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/PAMASense/);
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
    await expect(page.getByTestId('three-view')).toBeVisible();
  });

  test('2. demo telemetry starts', async ({ page }) => {
    await expect(page.getByText('FIX', { exact: true }).first()).toBeVisible();
    await expect(page.getByTestId('telemetry-rate')).toHaveText('20 Hz');
  });

  test('3. bucket moves in the 3D scene', async ({ page }) => {
    const position = page.getByTestId('bucket-position');
    const before = await position.textContent();
    await page.waitForTimeout(700);
    await expect(position).not.toHaveText(before ?? '');
  });

  test('4. vertical offset updates', async ({ page }) => {
    const offset = page.getByTestId('vertical-offset');
    const before = await offset.textContent();
    await page.waitForTimeout(900);
    await expect(offset).not.toHaveText(before ?? '');
  });

  test('5. status changes through underdig, on grade, and overdig', async ({ page }) => {
    await page.getByRole('button', { name: 'DEMO TELEMETRY' }).click();
    await page.getByRole('button', { name: 'UNDERDIG', exact: true }).click();
    await expect(page.getByTestId('guidance-status')).toContainText('UNDERDIG');
    await page.getByRole('button', { name: 'ON GRADE', exact: true }).click();
    await expect(page.getByTestId('guidance-status')).toContainText('ON GRADE');
    await page.getByRole('button', { name: 'OVERDIG', exact: true }).click();
    await expect(page.getByTestId('guidance-status')).toContainText('OVERDIG');
  });

  test('6. RTK loss disables guidance', async ({ page }) => {
    await page.getByRole('button', { name: 'DEMO TELEMETRY' }).click();
    await page.getByRole('button', { name: 'SIM rtk OK' }).click();
    await expect(page.getByText('GUIDANCE UNAVAILABLE', { exact: false }).first()).toBeVisible();
    await expect(page.getByTestId('guidance-status')).toContainText('INVALID');
  });

  test('7. plan, 3D, and section views switch correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Plan View' }).click();
    await expect(page.getByTestId('plan-view')).toBeVisible();
    await page.getByRole('button', { name: 'Section View' }).click();
    await expect(page.getByTestId('section-view')).toBeVisible();
    await page.getByRole('button', { name: '3D View' }).click();
    await expect(page.getByTestId('three-view')).toBeVisible();
  });

  test('8. settings persist after reload', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click();
    const tolerance = page.getByLabel('Grade tolerance');
    await tolerance.fill('0.08');
    await page.getByRole('button', { name: 'Save settings' }).click();
    await page.reload();
    await expect(page.getByLabel('Grade tolerance')).toHaveValue('0.08');
  });

  test('9. mine-plan JSON sample can be imported', async ({ page }) => {
    await page.getByRole('link', { name: 'Design' }).click();
    await page.getByRole('button', { name: 'Import Design' }).click();
    await page.getByRole('button', { name: 'Load valid sample' }).click();
    await expect(page.getByText('VALID', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Import & activate' }).click();
    await expect(page.getByText('Design stored offline and activated.')).toBeVisible();
  });

  test('10. CSV operational logs can be exported', async ({ page }) => {
    await page.waitForTimeout(1100);
    await page.goto('/topography');
    await expect(page.getByTestId('surface-elevation-profile')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Plan elevation', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Actual elevation', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Plan Design (Yellow)', { exact: true })).toBeVisible();
    await expect(page.getByText('Actual Terrain (Blue)', { exact: true })).toBeVisible();
    await expect(page.getByText('Difference / Deviation', { exact: true })).toBeVisible();
    await expect(page.getByText('Bucket Position', { exact: true })).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-csv').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('pamasense-operational-log.csv');
  });

  test('11. WASD controls drive and steer the excavator', async ({ page }) => {
    const machinePosition = page.getByTestId('machine-position');
    const machineHeading = page.getByTestId('machine-heading');
    const beforePosition = (await machinePosition.textContent()) ?? '';
    const beforeHeading = Number(await machineHeading.textContent());
    await expect(page.getByTestId('drive-controls')).toHaveCount(0);

    await page.keyboard.down('w');
    await page.waitForTimeout(650);
    await page.keyboard.up('w');
    await expect(machinePosition).not.toHaveText(beforePosition);

    await page.keyboard.down('a');
    await page.waitForTimeout(350);
    await page.keyboard.up('a');
    await expect
      .poll(async () => Number(await machineHeading.textContent()))
      .toBeGreaterThan(beforeHeading);

    const afterAHeading = Number(await machineHeading.textContent());
    await page.keyboard.down('d');
    await page.waitForTimeout(350);
    await page.keyboard.up('d');
    await expect
      .poll(async () => Number(await machineHeading.textContent()))
      .toBeLessThan(afterAHeading);
  });

  test('12. a digging pass lowers only the actual surface near the bucket', async ({ page }) => {
    await page.getByRole('button', { name: 'DEMO TELEMETRY' }).click();
    await page.getByRole('button', { name: 'UNDERDIG', exact: true }).click();
    await page.waitForTimeout(100);
    await page.getByRole('button', { name: 'OVERDIG', exact: true }).click();
    await page.waitForTimeout(500);
    await page.getByRole('link', { name: 'Topography' }).click();
    await expect(page.getByTestId('last-excavation')).toContainText('ACTUAL UPDATED');
    await expect(page.getByTestId('affected-points')).not.toHaveText('0');
    await expect(page.getByTestId('topography-surface-status')).toBeVisible();
    await expect(page.getByTestId('mining-activity-chart')).toBeVisible();
    await expect(page.getByTestId('shoveling-unit-count')).toHaveText('1');
    await expect(page.getByTestId('digging-pass-count')).not.toHaveText('0');
  });
});
