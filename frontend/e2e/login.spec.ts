import { test, expect } from '@playwright/test'

// These E2E tests mock the API with Playwright's route interception,
// so they run without a backend.

const VALID_USER = {
  token: 'e2e-token',
  user: { id: 1, name: 'Admin', email: 'admin@dev.local', role: 'admin', plan: 'pro' },
}

test.beforeEach(async ({ page }) => {
  // Default: successful login
  await page.route('**/auth/login', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(VALID_USER),
    }),
  )

  // Stub /auth/me so ProtectedRoute doesn't break after redirect
  await page.route('**/auth/me', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(VALID_USER.user),
    }),
  )
})

test('shows the login form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByPlaceholder('toi@exemple.com')).toBeVisible()
  await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible()
})

test('redirects to /dashboard on successful login', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('toi@exemple.com').fill('admin@dev.local')
  await page.getByPlaceholder('••••••••').fill('Admin1234!@#')
  await page.getByRole('button', { name: /Se connecter/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
})

test('shows wrong-credentials error on 401', async ({ page }) => {
  await page.route('**/auth/login', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Email ou mot de passe incorrect' }),
    }),
  )

  await page.goto('/login')
  await page.getByPlaceholder('toi@exemple.com').fill('bad@test.com')
  await page.getByPlaceholder('••••••••').fill('wrongpass')
  await page.getByRole('button', { name: /Se connecter/i }).click()
  await expect(page.getByText('Email ou mot de passe incorrect')).toBeVisible()
})

test('shows network error when server is unreachable', async ({ page }) => {
  await page.route('**/auth/login', route => route.abort('failed'))

  await page.goto('/login')
  await page.getByPlaceholder('toi@exemple.com').fill('test@test.com')
  await page.getByPlaceholder('••••••••').fill('Alice1234!@#')
  await page.getByRole('button', { name: /Se connecter/i }).click()
  await expect(page.getByText(/Impossible de joindre le serveur/)).toBeVisible()
})

test('submit button is disabled while login is in progress', async ({ page }) => {
  // Delay the response to observe the loading state
  await page.route('**/auth/login', async route => {
    await new Promise(r => setTimeout(r, 500))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(VALID_USER),
    })
  })

  await page.goto('/login')
  await page.getByPlaceholder('toi@exemple.com').fill('test@test.com')
  await page.getByPlaceholder('••••••••').fill('Alice1234!@#')
  const button = page.getByRole('button', { name: /Se connecter|Connexion/i })
  await button.click()
  await expect(button).toBeDisabled()
})

test('navigates to register page via link', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: /Créer un espace/i }).click()
  await expect(page).toHaveURL(/\/register/)
})
