export const metadata = {
  title: "Terms of Service",
  description:
    "AwesomeContext terms of service. Usage terms for our MCP server, API keys, and Claude Code integration.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-20">
      <div className="max-w-3xl mx-auto glass-card rounded-2xl p-8 md:p-10">
        <h1 className="text-2xl font-semibold mb-2">Terms of Service</h1>
        <p className="text-[12px] text-[var(--text-tertiary)] mb-8">
          Effective date: February 21, 2026
        </p>

        <div className="space-y-6 text-[14px] text-[var(--text-secondary)] leading-7">
          <section>
            <h2 className="text-[15px] font-medium text-[var(--foreground)] mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using AwesomeContext, you agree to be bound by these Terms of Service.
              If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-[var(--foreground)] mb-2">2. Account and API Keys</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and
              API keys. You are responsible for all activity performed using your account or keys.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-[var(--foreground)] mb-2">3. Acceptable Use</h2>
            <p>
              You agree not to misuse the service, attempt unauthorized access, disrupt infrastructure,
              or use the platform for unlawful activities. We may suspend or terminate access for abuse,
              fraud, or security risks.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-[var(--foreground)] mb-2">4. Service Availability</h2>
            <p>
              The service is provided on an "as is" and "as available" basis. We do not guarantee
              uninterrupted availability, error-free operation, or fitness for a particular purpose.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-[var(--foreground)] mb-2">5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Awareness and AwesomeContext are not liable for
              indirect, incidental, special, consequential, or punitive damages arising from use of the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-[var(--foreground)] mb-2">6. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use after updates means you accept
              the revised Terms.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
