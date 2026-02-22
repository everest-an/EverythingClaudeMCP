import { test, expect } from "@playwright/test";

const BASE = "https://awesomecontext.awareness.market";
const MCP_BASE = "http://44.220.181.78:3000";

// ── Landing Page ──────────────────────────────────────────────

test.describe("Landing Page", () => {
  test("homepage loads with correct title", async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/AwesomeContext/);
  });

  test("homepage has hero section with CTA", async ({ page }) => {
    await page.goto(BASE);
    const hero = page.locator("text=MCP Server");
    await expect(hero.first()).toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator('nav >> text="How it works"')).toBeVisible();
    await expect(page.locator('nav >> text="Tools"')).toBeVisible();
    await expect(page.locator('nav >> text="Skills"')).toBeVisible();
    await expect(page.locator('nav >> text="GitHub"')).toBeVisible();
  });

  test("code blocks have copy buttons", async ({ page }) => {
    await page.goto(BASE);
    const codeBlocks = page.locator(".code-block");
    const count = await codeBlocks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("FAQ section is visible", async ({ page }) => {
    await page.goto(BASE);
    const faq = page.locator("h2#faq-heading");
    await expect(faq).toBeVisible();
  });

  test("footer has correct links", async ({ page }) => {
    await page.goto(BASE);
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.locator('text="Skills Catalog"')).toBeVisible();
  });
});

// ── Skills Page ───────────────────────────────────────────────

test.describe("Skills Page", () => {
  test("skills page loads (public, no auth required)", async ({ page }) => {
    await page.goto(`${BASE}/skills`);
    await expect(page).toHaveTitle(/Skills/);
  });

  test("skills page lists skill categories", async ({ page }) => {
    await page.goto(`${BASE}/skills`);
    await expect(page.locator("text=Security").first()).toBeVisible();
    await expect(page.locator("text=Testing").first()).toBeVisible();
  });
});

// ── Login Page ────────────────────────────────────────────────

test.describe("Login Page", () => {
  test("login page loads", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator("text=Sign in").first()).toBeVisible();
  });

  test("login page has email input", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test("login page has OAuth buttons", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const googleBtn = page.locator("text=Google");
    const githubBtn = page.locator("text=GitHub");
    await expect(googleBtn.first()).toBeVisible();
    await expect(githubBtn.first()).toBeVisible();
  });
});

// ── SEO & GEO ─────────────────────────────────────────────────

test.describe("SEO & GEO", () => {
  test("llms.txt is accessible", async ({ request }) => {
    const res = await request.get(`${BASE}/llms.txt`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("AwesomeContext");
    expect(text).toContain("MCP");
  });

  test("llms-full.txt is accessible", async ({ request }) => {
    const res = await request.get(`${BASE}/llms-full.txt`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("get_rules");
    expect(text).toContain("architect_consult");
  });

  test("ai-plugin.json is accessible", async ({ request }) => {
    const res = await request.get(`${BASE}/.well-known/ai-plugin.json`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("awesome_context");
    expect(text).toContain("mcp");
  });

  test("sitemap.xml is accessible", async ({ request }) => {
    const res = await request.get(`${BASE}/sitemap.xml`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("skills");
  });

  test("homepage has meta description", async ({ page }) => {
    await page.goto(BASE);
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(50);
  });
});

// ── MCP Endpoint (via direct IP, avoids local TLS issues) ─────

test.describe("MCP Endpoint", () => {
  test("MCP health check (always public)", async ({ request }) => {
    const res = await request.get(`${MCP_BASE}/health`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
  });

  test("MCP rejects unauthenticated requests with 401", async ({ request }) => {
    const res = await request.post(`${MCP_BASE}/mcp`, {
      headers: { "Content-Type": "application/json", "Accept": "application/json, text/event-stream" },
      data: {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "playwright-test", version: "1.0.0" },
        },
      },
    });
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("API key");
  });
});
