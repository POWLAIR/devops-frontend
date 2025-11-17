import RegisterForm from '@/components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Inscription</h1>
      <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
        <RegisterForm />
      </div>
    </div>
  );
}

