import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          to="/register" 
          className="inline-flex items-center gap-2 text-mut-primary hover:text-mut-secondary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Registration
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-gray-600 mt-1">Last updated: January 2026</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-md p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              MUT Study Hub ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, 
              and safeguard your information when you use our platform. Please read this policy carefully. If you do not agree with the terms of this 
              privacy policy, please do not access the site.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Information</h3>
                <p className="text-gray-700 mb-2">When you register, we collect:</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Full name</li>
                  <li>Email address (institutional)</li>
                  <li>Student/Staff ID number</li>
                  <li>Program of study</li>
                  <li>Current year of study</li>
                  <li>Profile picture (optional)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Information</h3>
                <p className="text-gray-700 mb-2">We automatically collect:</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>IP address and browser type</li>
                  <li>Device information and operating system</li>
                  <li>Pages visited and time spent on platform</li>
                  <li>Resources uploaded and downloaded</li>
                  <li>Forum posts and comments</li>
                  <li>Search queries</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookies and Tracking Technologies</h3>
                <p className="text-gray-700">
                  We use cookies and similar technologies to enhance user experience, maintain sessions, and analyze platform usage. 
                  You can control cookies through your browser settings.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-3">We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Create and manage your account</li>
              <li>Provide access to academic resources</li>
              <li>Facilitate communication between students</li>
              <li>Verify your eligibility as a MUT student/staff member</li>
              <li>Send important notifications and updates</li>
              <li>Improve platform features and user experience</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
              <li>Generate analytics and usage reports</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Within the Platform</h3>
                <p className="text-gray-700">
                  Your name, profile picture, and program information may be visible to other registered users when you post in forums or upload resources.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">With the University</h3>
                <p className="text-gray-700">
                  We may share anonymized usage statistics with Muranga University of Technology for educational planning and improvement purposes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Third-Party Service Providers</h3>
                <p className="text-gray-700 mb-2">We may share information with:</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Cloud storage providers (for file hosting)</li>
                  <li>Email service providers (for notifications)</li>
                  <li>Analytics providers (for usage insights)</li>
                </ul>
                <p className="text-gray-700 mt-2">These providers are contractually obligated to protect your data.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Requirements</h3>
                <p className="text-gray-700">
                  We may disclose information if required by law, court order, or government regulation, or to protect our rights, property, or safety.
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-gray-700">
                  <strong>We will NEVER sell your personal information to third parties for marketing purposes.</strong>
                </p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <div className="space-y-3 text-gray-700">
              <p>We implement industry-standard security measures to protect your information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encrypted data transmission (HTTPS/SSL)</li>
                <li>Secure password hashing (bcrypt)</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Secure cloud storage infrastructure</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your data, 
                we cannot guarantee absolute security.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>Active Accounts:</strong> We retain your information for as long as your account remains active.</p>
              <p><strong>Closed Accounts:</strong> After account deletion, we may retain some information for legal compliance, dispute resolution, and fraud prevention (typically 1-2 years).</p>
              <p><strong>Uploaded Content:</strong> Resources you upload may remain available to other users even after account closure, as they become part of the shared academic repository.</p>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Privacy Rights</h2>
            <p className="text-gray-700 mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data (subject to legal obligations)</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain data processing activities</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for optional data collection</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, contact us at <a href="mailto:privacy@mutstudy.ac.za" className="text-mut-primary hover:underline">privacy@mutstudy.ac.za</a>
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our platform is intended for users aged 16 and older. We do not knowingly collect information from children under 16. 
              If you believe a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          {/* International Users */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be stored and processed in Kenya or other countries where our service providers operate. 
              By using MUT Study Hub, you consent to the transfer of your information to these locations.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. 
              We will notify you of significant changes via email or platform notification. The "Last Updated" date at the top indicates when the policy was last revised.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 mb-4">If you have questions or concerns about this Privacy Policy or our data practices:</p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> privacy@mutstudy.ac.za</p>
                <p><strong>Support:</strong> support@mutstudy.ac.za</p>
                <p><strong>Address:</strong> Muranga University of Technology, Muranga County, Kenya</p>
              </div>
            </div>
          </section>

          {/* Consent */}
          <section className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
            <p className="text-gray-700">
              <strong>By using MUT Study Hub, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, 
              use, and disclosure of your information as described herein.</strong>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Developed by MCOKOTH TECHNOLOGIES. All rights reserved, 2026.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
