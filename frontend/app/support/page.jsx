import Link from 'next/link';
import { ArrowLeft, MessageCircle, Book, Mail, ExternalLink } from 'lucide-react';

export const metadata = {
  title: "Support - EthMem",
};

const faqItems = [
  {
    question: "How does EthMem store my data?",
    answer: "EthMem stores your memories locally in your browser using IndexedDB. No data is sent to the cloud, ensuring maximum privacy."
  },
  {
    question: "Is my data private and secure?",
    answer: "Yes, because your memories never leave your device. They are kept within your own browser environment, ensuring complete privacy."
  },
  {
    question: "How do I connect my AI assistants?",
    answer: "Navigate to the Integrations page from your dashboard and follow the setup instructions for each AI service you want to connect. You'll need API keys for each service."
  },
  {
    question: "Can I export my data?",
    answer: "Absolutely! You can export all your memories as a JSON file from the Settings page. This ensures you always have a backup of your data."
  },
  {
    question: "What happens if I clear my browser data?",
    answer: "Since your memories are stored locally, clearing your browser data or uninstalling the extension will delete your memories. We highly recommend using the export feature regularly to create a backup."
  }
];

const supportChannels = [
  {
    name: "Documentation",
    description: "Comprehensive guides and tutorials",
    icon: Book,
    link: "#",
    color: "bg-blue-500"
  },
  {
    name: "Community Discord",
    description: "Join our community for help and discussions",
    icon: MessageCircle,
    link: "#",
    color: "bg-purple-500"
  },
  {
    name: "Email Support",
    description: "Direct support via email",
    icon: Mail,
    link: "mailto:support@ethmem.com",
    color: "bg-emerald-500"
  }
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-2 text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="text-2xl font-bold text-emerald-300">EthMem Support</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">How can we help you?</h1>
          <p className="text-xl text-gray-400">
            Find answers to common questions or get in touch with our support team
          </p>
        </div>

        {/* Support Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {supportChannels.map((channel) => {
            const Icon = channel.icon;
            return (
              <a
                key={channel.name}
                href={channel.link}
                className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors group"
              >
                <div className={`w-12 h-12 ${channel.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{channel.name}</h3>
                <p className="text-gray-400 text-sm">{channel.description}</p>
                <div className="flex items-center mt-4 text-emerald-400 text-sm">
                  <span>Learn more</span>
                  <ExternalLink className="w-4 h-4 ml-1" />
                </div>
              </a>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {faqItems.map((faq, index) => (
              <div key={index} className="border-b border-gray-700 last:border-b-0 pb-6 last:pb-0">
                <h3 className="text-lg font-semibold text-white mb-3">{faq.question}</h3>
                <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-emerald-900/20 to-blue-900/20 rounded-xl p-8 border border-emerald-500/20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Still need help?</h2>
            <p className="text-gray-300 mb-6">
              Can't find what you're looking for? Our support team is here to help you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@ethmem.com"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Contact Support
              </a>
              <a
                href="#"
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Join Community
              </a>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
