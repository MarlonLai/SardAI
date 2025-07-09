import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="glass-effect border-t border-white/10 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
              <div className="w-8 h-8 sardinian-gradient rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SardAI</span>
            </div>
            <p className="text-gray-400 flex items-center justify-center md:justify-start">
              Fatto con ❤️ in Sardegna • SardAI {new Date().getFullYear()}
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 text-gray-300">
            <Link to="/terms" className="hover:text-white transition-colors">Condizioni di Utilizzo</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/gdpr" className="hover:text-white transition-colors">GDPR</Link>
            <a href="mailto:info@sardai.tech" className="hover:text-white transition-colors">Contatto</a>
          </div>
        </div>
      </div>
    </footer>
  );
}