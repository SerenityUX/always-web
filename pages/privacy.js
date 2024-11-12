import React from 'react';

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy & Terms and Conditions</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Privacy Policy</h2>
        <p className="mb-4">By using always, you acknowledge and agree that:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>We collect, store, and actively monitor all data related to your events and account</li>
          <li>Our team has complete access to all data, including but not limited to:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Personal information</li>
              <li>Event details and communications</li>
              <li>User interactions and behavior</li>
              <li>All uploaded content and materials</li>
            </ul>
          </li>
          <li>We actively review and analyze this data for various purposes, including but not limited to:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Platform improvement</li>
              <li>Understanding user behavior</li>
              <li>Quality assurance</li>
              <li>Research and development</li>
            </ul>
          </li>
          <li>While we will not knowingly share your data with third parties, we maintain full internal access and usage rights</li>
          <li>We are not responsible for any unauthorized external access to or use of our servers or any data stored therein</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Terms and Conditions</h2>
        <p className="mb-4">By using always, you agree to the following terms:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>always provides this service "as is" without any warranties of any kind</li>
          <li>We are not liable for any damages or losses resulting from your use of our service</li>
          <li>We are not responsible for service interruptions, data loss, or any other issues that may arise</li>
          <li>We reserve the right to modify or terminate the service at any time</li>
          <li>You agree to use the service in compliance with all applicable laws</li>
          <li>You waive any right to bring legal action against always for any issues arising from your use of the service</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
        <p className="mb-4">Under no circumstances shall always be liable for any direct, indirect, special, incidental, consequential, or punitive damages arising from your use of the service. This includes, but is not limited to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Data loss or theft</li>
          <li>Service interruptions</li>
          <li>Technical failures</li>
          <li>Any other issues related to the use of our service</li>
        </ul>
      </section>
    </div>
  );
} 