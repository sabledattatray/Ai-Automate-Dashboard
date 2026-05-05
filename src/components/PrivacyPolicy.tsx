import React from 'react';
import { ChevronLeft, Shield, Lock, Eye, FileText, Globe, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { useCanvasStore } from '../store/canvasStore';

export const PrivacyPolicy: React.FC = () => {
  const { setCurrentView } = useCanvasStore();

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0A0A0B] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentView('workspace')}
          className="mb-8 gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Workspace
        </Button>

        <div className="bg-white dark:bg-[#111113] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
                <p className="text-slate-500 dark:text-slate-400">Last updated: May 5, 2024</p>
              </div>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
              <section>
                <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  <Eye className="w-5 h-5 text-indigo-500" />
                  <h2>Information We Collect</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  We collect information that you provide directly to us when you create an account, connect third-party services (like GitHub or LinkedIn), or upload data for analysis. This includes:
                </p>
                <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-600 dark:text-slate-400">
                  <li>Account information (name, email, profile picture)</li>
                  <li>Authentication credentials via OAuth providers</li>
                  <li>Dataset content and metadata you upload or connect</li>
                  <li>Usage information and system logs</li>
                </ul>
              </section>

              <section>
                <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  <Lock className="w-5 h-5 text-indigo-500" />
                  <h2>How We Use Your Data</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your data is used exclusively to provide and improve our services, including:
                </p>
                <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-600 dark:text-slate-400">
                  <li>Authenticating your identity and providing access to your workspace</li>
                  <li>Processing and visualizing your datasets</li>
                  <li>Generating AI-driven insights (when requested)</li>
                  <li>Ensuring technical stability and security of the platform</li>
                </ul>
              </section>

              <section>
                <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  <Globe className="w-5 h-5 text-indigo-500" />
                  <h2>Data Storage and Security</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  We employ industry-standard security measures to protect your information. Data is stored securely in encrypted cloud environments. We do not sell your personal information or data to third parties.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <h2>Third-Party Services</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Our application integrates with Firebase for authentication and database services. When you use third-party login providers, their privacy policies also apply to the data they share with us.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  <Mail className="w-5 h-5 text-indigo-500" />
                  <h2>Contact Us</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact our support team.
                </p>
              </section>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-[#161618] border-t border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center text-xs text-slate-500 dark:text-slate-500 font-medium">
            <span>© 2024 Insight Platform</span>
            <div className="flex gap-4">
              <span className="cursor-pointer hover:text-indigo-500">Terms of Service</span>
              <span className="cursor-pointer hover:text-indigo-500">Cookie Policy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
