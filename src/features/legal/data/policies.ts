/**
 * MyWeb3.me's Privacy and Cookies policies, in MyWeb3.me's own words — copied
 * from myweb3.me/privacy-policy and myweb3.me/cookies-policy on 2026-10-12,
 * at the client's ask (C14), with the date moved to October 25, 2026.
 *
 * English only: a policy is a statement the company stands behind, and a
 * translation of one is a second statement nobody has reviewed. The page
 * around it is translated; the policy says so in other languages.
 *
 * Kept as data rather than prose in a component, so the wording can be
 * replaced from the source without touching the layout.
 */

export type PolicyId = 'privacy' | 'cookies'

/** `2026-10-25`, read in UTC so no time zone moves it a day. */
export const LAST_UPDATED = '2026-10-25'

/** The address both policies give for questions — shown as a mail link. */
export const CONTACT_EMAIL = 'contact@myweb3.me'

export interface PolicyItem {
  /** The bold lead-in — "Personal Information" — when the item has one. */
  term?: string
  text: string
}

export interface PolicySection {
  heading: string
  /** Paragraphs, before any list. */
  body?: string[]
  items?: PolicyItem[]
}

export interface Policy {
  intro: string
  sections: PolicySection[]
}

export const POLICIES: Record<PolicyId, Policy> = {
  privacy: {
    intro:
      'Welcome to MyWeb3.me! We respect your privacy and are committed to protecting your personal information. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit our website.',
    sections: [
      {
        heading: 'I. Information We Collect',
        body: [
          'We may collect personal information from you when you visit our website, interact with our services, or voluntarily provide it to us. This information may include:',
        ],
        items: [
          { term: 'Personal Information', text: 'such as your name, email address, and contact details.' },
          {
            term: 'Usage Data',
            text: 'including information about your browsing activity on our website, such as pages visited, time spent on each page, and referring website addresses.',
          },
          {
            term: 'Cookies and Tracking Technologies',
            text: 'We may use cookies, web beacons, and similar tracking technologies to enhance your experience on our website and collect information about your browsing behavior.',
          },
        ],
      },
      {
        heading: 'II. Use of Information',
        body: ['We may use the information we collect for various purposes, including:'],
        items: [
          {
            term: 'To Provide and Improve Our Services',
            text: 'We use your information to deliver the services you request and to enhance your experience on our website.',
          },
          {
            term: 'To Communicate with You',
            text: 'We may use your contact information to respond to your inquiries, provide customer support, and send you important updates and notifications.',
          },
          {
            term: 'For Marketing and Advertising',
            text: 'With your consent, we may use your information to send you promotional materials, offers, and other communications that may be of interest to you.',
          },
          {
            term: 'For Analytics and Research',
            text: 'We analyze usage data to understand how visitors interact with our website, identify trends, and improve our services.',
          },
        ],
      },
      {
        heading: 'III. Sharing of Information',
        body: ['We may share your information with third parties in the following circumstances:'],
        items: [
          {
            term: 'Service Providers',
            text: 'We may engage third-party service providers to assist us in operating our website, conducting our business, or servicing you. These service providers are contractually obligated to protect your information and may only use it for the purposes specified by us.',
          },
          {
            term: 'Legal Compliance',
            text: 'We may disclose your information when required by law, court order, or other legal process, or if we believe that such action is necessary to comply with applicable laws or protect our rights, property, or safety.',
          },
          {
            term: 'Business Transfers',
            text: 'In the event of a merger, acquisition, reorganization, or sale of assets, your information may be transferred as part of the transaction. We will notify you via email and/or prominent notice on our website of any change in ownership or uses of your personal information.',
          },
        ],
      },
      {
        heading: 'IV. Your Choices and Rights',
        body: ['You have certain rights and choices regarding the collection, use, and disclosure of your information. You may:'],
        items: [
          {
            term: 'Access and Update Your Information',
            text: 'You may access and update your personal information by contacting us directly.',
          },
          {
            term: 'Opt-Out of Marketing Communications',
            text: 'You may opt-out of receiving promotional emails from us by following the instructions provided in the email or contacting us directly.',
          },
          {
            term: 'Cookies and Tracking',
            text: 'You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. However, if you disable or refuse cookies, please note that some parts of our website may become inaccessible or not function properly.',
          },
        ],
      },
      {
        heading: 'V. Data Security',
        body: [
          'We take reasonable measures to protect your information from unauthorized access, use, or disclosure. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security of your information.',
        ],
      },
      {
        heading: 'VI. Children’s Privacy',
        body: [
          'Our website is not intended for children under the age of 13, and we do not knowingly collect personal information from children under 13. If you are under 13, please do not provide any personal information on our website.',
        ],
      },
      {
        heading: 'VII. Changes to This Privacy Policy',
        body: [
          'We reserve the right to update or modify this Privacy Policy at any time. Any changes will be effective immediately upon posting the revised Privacy Policy on this page. We encourage you to review this page periodically for the latest information on our privacy practices.',
        ],
      },
      {
        heading: 'VIII. Contact Us',
        body: [
          `If you have any questions or concerns about this Privacy Policy or our privacy practices, please contact us at ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },
  cookies: {
    intro:
      'Welcome to MyWeb3.me! This Cookies Policy explains how we use cookies and similar tracking technologies on our website. By using our website, you consent to the use of cookies as described in this policy.',
    sections: [
      {
        heading: 'I. What are Cookies?',
        body: [
          'Cookies are small text files that are placed on your device (computer, smartphone, tablet) when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners.',
        ],
      },
      {
        heading: 'II. Types of Cookies We Use',
        items: [
          {
            term: 'Essential Cookies',
            text: 'These cookies are necessary for the proper functioning of our website and enable you to navigate our site and use its features. Without these cookies, certain functionalities may not be available.',
          },
          {
            term: 'Analytics Cookies',
            text: 'We use analytics cookies to collect information about how visitors interact with our website, such as the pages visited, the time spent on each page, and any error messages encountered. This helps us improve the performance and usability of our website.',
          },
          {
            term: 'Advertising Cookies',
            text: 'We may use advertising cookies to deliver relevant advertisements to you based on your interests and browsing behavior. These cookies may track your visits to other websites as well.',
          },
        ],
      },
      {
        heading: 'III. How We Use Cookies',
        body: ['We use cookies for the following purposes:'],
        items: [
          { text: 'To remember your preferences and settings.' },
          { text: 'To analyze how visitors use our website and measure the effectiveness of our marketing campaigns.' },
          { text: 'To deliver personalized content and advertisements tailored to your interests.' },
        ],
      },
      {
        heading: 'IV. Third-Party Cookies',
        body: [
          'We may also allow third-party service providers, such as advertising networks and social media platforms, to place cookies on your device through our website. These third-party cookies may collect information about your online activities across websites and over time.',
        ],
      },
      {
        heading: 'V. Your Cookie Choices',
        body: ['You can control and manage cookies in various ways, including:'],
        items: [
          {
            term: 'Browser Settings',
            text: 'You can adjust your browser settings to refuse all or some cookies, or to alert you when cookies are being sent. However, please note that blocking cookies may affect the functionality of our website.',
          },
          {
            term: 'Opt-Out Tools',
            text: 'You can opt-out of certain cookies by using the opt-out tools provided by third-party advertisers and analytics providers.',
          },
          {
            term: 'Cookie Consent',
            text: 'By continuing to use our website, you consent to the use of cookies as described in this policy. You can withdraw your consent at any time by deleting the cookies stored on your device and adjusting your browser settings.',
          },
        ],
      },
      {
        heading: 'VI. Updates to This Policy',
        body: [
          'We may update this Cookies Policy from time to time to reflect changes in our practices or applicable laws. Any updates will be posted on this page with a revised effective date. We encourage you to review this policy periodically for the latest information.',
        ],
      },
      {
        heading: 'VII. Contact Us',
        body: [
          `If you have any questions or concerns about this Cookies Policy or our use of cookies, please contact us at ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },
}
