import { expect, test } from '@playwright/test'

test('shows lock screen before unlock', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('dialog', { name: 'מסך כניסה' })).toBeVisible()
})
