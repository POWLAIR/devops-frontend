import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-blue-600">404</h1>
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Page non trouvée
          </h2>
          <p className="text-gray-600 mb-8">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Retour à l'accueil
          </Link>
          <Link
            href="/products"
            className="block w-full bg-white text-blue-600 py-3 px-6 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors font-medium"
          >
            Voir le catalogue
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Besoin d'aide ?</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Contactez le support
          </Link>
        </div>
      </div>
    </div>
  );
}

