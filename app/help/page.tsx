'use client';

import { Mail, Phone, HelpCircle } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-bold mb-4 text-slate-900">Centre d'Aide</h1>
      <p className="text-lg text-slate-600 mb-12">
        Nous sommes là pour vous aider. Consultez les réponses aux questions fréquentes ou contactez-nous.
      </p>

      {/* Contact Options */}
      <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
          <Mail className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h3 className="font-semibold text-lg mb-2">Email</h3>
          <p className="text-slate-600 text-sm mb-4">Réponse sous 24h</p>
          <a href="mailto:support@techstore.com" className="text-blue-600 hover:underline">
            support@techstore.com
          </a>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
          <Phone className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h3 className="font-semibold text-lg mb-2">Téléphone</h3>
          <p className="text-slate-600 text-sm mb-4">Lun-Ven 9h-18h</p>
          <a href="tel:+33123456789" className="text-blue-600 hover:underline">
            +33 1 23 45 67 89
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white border border-slate-200 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-900">Questions Fréquentes</h2>

        <div className="space-y-6">
          {[
            {
              q: 'Comment suivre ma commande ?',
              a: 'Connectez-vous à votre compte et accédez à la section "Mes Commandes". Vous y trouverez le statut et le numéro de suivi de chaque commande.',
            },
            {
              q: 'Quels sont les modes de paiement acceptés ?',
              a: 'Nous acceptons les cartes bancaires (Visa, Mastercard, Amex), PayPal, et les virements bancaires.',
            },
            {
              q: 'Quelle est la politique de retour ?',
              a: 'Vous disposez de 30 jours pour retourner un produit non utilisé dans son emballage d\'origine. Les frais de retour sont gratuits.',
            },
            {
              q: 'La livraison est-elle gratuite ?',
              a: 'Oui, la livraison est gratuite pour toute commande supérieure à 50€. Sinon, les frais de livraison sont de 5,90€.',
            },
            {
              q: 'Comment modifier ou annuler une commande ?',
              a: 'Vous pouvez annuler une commande tant qu\'elle n\'a pas été expédiée. Contactez-nous rapidement via chat ou email.',
            },
          ].map((faq, index) => (
            <div key={index} className="border-b border-slate-200 last:border-0 pb-6 last:pb-0">
              <div className="flex items-start">
                <HelpCircle className="w-6 h-6 text-blue-600 mr-3 mt-1 shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-slate-900">{faq.q}</h3>
                  <p className="text-slate-600">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Help Text */}
      <div className="mt-12 text-center bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-slate-700">
          Vous ne trouvez pas ce que vous cherchez ? Envoyez-nous un email à{' '}
          <a href="mailto:support@techstore.com" className="text-blue-600 font-semibold hover:underline">
            support@techstore.com
          </a>
        </p>
      </div>
    </div>
  );
}

