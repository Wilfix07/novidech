import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative bg-banner text-white min-h-[600px] flex items-center">
      <div className="absolute inset-0 opacity-30">
        <Image
          src="https://vhutqkvadxpjijsvoqgr.supabase.co/storage/v1/object/public/project-images/wv4ujznhumk-1764483955751.jpg"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            NOVIDECH MITUELLE LLC
          </h1>
          <p className="text-xl md:text-2xl mb-8 font-light">
            Nouvelle vision pour le developpement economique des citoyens haitiens.
          </p>
          <p className="text-lg mb-8">
            Aider les gens à grandir leur économie
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/auth/signup"
              className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors text-center"
            >
              Rejoindre maintenant
            </Link>
            <Link
              href="/auth/login"
              className="bg-white text-banner px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors text-center"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}




