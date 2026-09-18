import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

const TermsPage = () => {
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
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
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
              Welcome to MUT Study Hub ("we," "our," or "us"). By accessing or using our platform, you agree to be bound by these Terms of Service. 
              Please read these terms carefully before using our services. If you do not agree with any part of these terms, you may not access the service.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility</h2>
            <div className="space-y-3 text-gray-700">
              <p>To use MUT Study Hub, you must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Be a current student, faculty member, or authorized affiliate of Muranga University of Technology</li>
                <li>Provide accurate and complete registration information</li>
                <li>Use a valid institutional email address</li>
                <li>Be at least 16 years of age</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </div>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
              <p><strong>Account Termination:</strong> We reserve the right to suspend or terminate accounts that violate these terms or engage in prohibited activities.</p>
              <p><strong>One Account Per User:</strong> Each user may only create one account. Multiple accounts by the same user are prohibited.</p>
            </div>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
            <div className="space-y-3 text-gray-700">
              <p>When using MUT Study Hub, you agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Upload or share copyrighted materials without proper authorization</li>
                <li>Post offensive, discriminatory, or harassing content</li>
                <li>Share exam questions or answers that violate academic integrity policies</li>
                <li>Impersonate others or provide false information</li>
                <li>Attempt to hack, disrupt, or gain unauthorized access to the platform</li>
                <li>Use automated tools (bots, scrapers) without permission</li>
                <li>Share your account credentials with others</li>
                <li>Use the platform for commercial purposes without authorization</li>
              </ul>
            </div>
          </section>

          {/* Content Guidelines */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Content Guidelines</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>User-Generated Content:</strong> You retain ownership of content you upload but grant us a license to host, store, and share it with other authorized users.</p>
              <p><strong>Content Review:</strong> Class representatives and administrators review uploaded content before publication to ensure quality and compliance.</p>
              <p><strong>Prohibited Content:</strong> Content that is illegal, offensive, misleading, or violates intellectual property rights is strictly prohibited.</p>
              <p><strong>Content Removal:</strong> We reserve the right to remove any content that violates these terms without prior notice.</p>
            </div>
          </section>

          {/* Academic Integrity */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Academic Integrity</h2>
            <p className="text-gray-700 leading-relaxed">
              MUT Study Hub is designed to support legitimate academic collaboration and resource sharing. Users must comply with MUT's academic integrity policies. 
              Using shared materials to cheat, plagiarize, or violate examination rules is strictly prohibited and may result in disciplinary action by the university.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>Platform Content:</strong> The MUT Study Hub platform, including its design, features, and branding, is owned by MCOKOTH TECHNOLOGIES and protected by copyright laws.</p>
              <p><strong>User Content:</strong> Users retain copyright to their original content but must ensure they have the right to share any uploaded materials.</p>
              <p><strong>Reporting Violations:</strong> If you believe content violates your intellectual property rights, contact us at support@mutstudy.com.</p>
            </div>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimers</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>Service Availability:</strong> We strive to maintain platform availability but do not guarantee uninterrupted or error-free service.</p>
              <p><strong>Content Accuracy:</strong> We do not verify the accuracy, completeness, or reliability of user-generated content. Use materials at your own discretion.</p>
              <p><strong>Third-Party Links:</strong> Our platform may contain links to third-party websites. We are not responsible for their content or practices.</p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              To the fullest extent permitted by law, MUT Study Hub and MCOKOTH TECHNOLOGIES shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages arising from your use of the platform. Our total liability shall not exceed the amount you paid to access the service (if any).
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms of Service from time to time. We will notify users of significant changes via email or platform announcement. 
              Continued use of the platform after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms of Service are governed by the laws of Kenya. Any disputes shall be resolved in the courts of Muranga County, Kenya.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 mb-4">If you have questions about these Terms of Service, please contact us:</p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> support@mutstudy.com</p>
                <p><strong>Address:</strong> Muranga University of Technology, Muranga County, Kenya</p>
              </div>
            </div>
          </section>

          {/* Acceptance */}
          <section className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
            <p className="text-gray-700">
              <strong>By creating an account and using MUT Study Hub, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong>
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

export default TermsPage;
