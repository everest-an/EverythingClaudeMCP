export const metadata = {
  title: "Privacy Policy",
  description:
    "AwesomeContext privacy policy. Learn how we handle your data when using our MCP server and Claude Code integration.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-20">
      <div className="max-w-3xl mx-auto glass-card rounded-2xl p-8 md:p-10">
        <h1 className="text-2xl font-semibold mb-2">Privacy Notice</h1>
        <p className="text-[12px] text-[var(--text-tertiary)] mb-8">
          Effective date: February 21, 2026
        </p>

        <div className="space-y-6 text-[14px] text-[var(--text-secondary)] leading-7">
          <section>
            <h2 className="text-[15px] font-medium text-[var(--foreground)] mb-2">1. Data We Collect</h2>
            <p>
              We collect only the data required to operate the service, such as account profile data,
              authentication identifiers, API key metadata, and usage logs needed for security,
              billing, and reliability.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-[var(--foreground)] mb-2">2. How We Use Data</h2>
            <p>
              We use data to provide and secure the platform, validate API access, prevent abuse,
              improve performance, and support product operations.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-[var(--foreground)] mb-2">3. Data Sharing</h2>
            <p>
              We do not sell personal data. We may share limited data with service providers that help
              us run infrastructure, security, and analytics, under appropriate contractual safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-[var(--foreground)] mb-2">4. Data Retention</h2>
            <p>
              We retain data only as long as needed for legitimate business, legal, and security
              purposes, then delete or anonymize it where practical.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-[var(--foreground)] mb-2">5. Security</h2>
            <p>
              We apply reasonable technical and organizational measures to protect stored and transmitted
              data. No system can be guaranteed 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-[var(--foreground)] mb-2">6. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have rights to access, correct, or delete your
              personal data, and to object to certain processing activities.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-[var(--foreground)] mb-2">7. Changes to this Notice</h2>
            <p>
              We may update this Privacy Notice from time to time. Continued use of the service after
              updates means you accept the revised notice.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
