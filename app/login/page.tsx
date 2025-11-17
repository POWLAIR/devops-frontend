import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Connexion</h1>
      <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
        <LoginForm />
      </div>
    </div>
  );
}

