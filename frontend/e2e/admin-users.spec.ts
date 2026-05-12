import { test, expect } from '@playwright/test'

const ADMIN_USER = {
  token: 'e2e-token',
  user: { id: 1, name: 'Admin', email: 'admin@dev.local', role: 'admin', plan: 'pro' },
}

const MOCK_ROLES = [
  { id: 1, name: 'admin',     displayName: 'Administrateur',      description: '', permissions: [] },
  { id: 2, name: 'architect', displayName: 'Architecte logiciel', description: '', permissions: [] },
  { id: 3, name: 'developer', displayName: 'Développeur',         description: '', permissions: [] },
]

const MOCK_USERS = [
  {
    id: 2, name: 'Bob Dev', email: 'bob@dev.local',
    role: { id: 3, name: 'developer', displayName: 'Développeur', description: '', permissions: [] },
    plan: 'free', createdAt: '2025-01-01T00:00:00',
  },
]

test.beforeEach(async ({ page }) => {
  // Seed auth state in localStorage so ProtectedRoute/AdminRoute passes
  await page.goto('/login')
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
  }, ADMIN_USER)

  await page.route('**/auth/me', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ADMIN_USER.user) }),
  )
  await page.route('**/users', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USERS) }),
  )
  await page.route('**/roles', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ROLES) }),
  )
})

test('displays the user list', async ({ page }) => {
  await page.goto('/admin/users')
  await expect(page.getByText('bob@dev.local')).toBeVisible()
})

test('shows validation errors when create form is submitted empty', async ({ page }) => {
  await page.goto('/admin/users')
  await page.getByRole('button', { name: /Créer un utilisateur/i }).click()
  await page.getByRole('button', { name: /^Créer$/i }).click()
  await expect(page.getByText('Nom requis')).toBeVisible()
  await expect(page.getByText('Email requis')).toBeVisible()
  await expect(page.getByText(/Min\. 12 car\./)).toBeVisible()
})

test('shows email-invalid error for bad email format', async ({ page }) => {
  await page.goto('/admin/users')
  await page.getByRole('button', { name: /Créer un utilisateur/i }).click()
  await page.getByLabel('Nom complet').fill('Test User')
  await page.getByLabel('Email').fill('not-an-email')
  await page.getByRole('button', { name: /^Créer$/i }).click()
  await expect(page.getByText('Email invalide')).toBeVisible()
})

test('shows API error when email is already taken', async ({ page }) => {
  await page.route('**/users', route => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Email already in use' }),
      })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USERS) })
  })

  await page.goto('/admin/users')
  await page.getByRole('button', { name: /Créer un utilisateur/i }).click()
  await page.getByLabel('Nom complet').fill('Test User')
  await page.getByLabel('Email').fill('bob@dev.local')
  await page.getByLabel('Mot de passe').fill('Valid1234!@#$')
  await page.getByRole('button', { name: /^Créer$/i }).click()
  await expect(page.getByText('Email already in use')).toBeVisible()
})
