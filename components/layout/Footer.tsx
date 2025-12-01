import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-footer text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Image
              src="https://vhutqkvadxpjijsvoqgr.supabase.co/storage/v1/object/public/project-images/e7k02q6sni-1764484151525.png"
              alt="NOVIDECH Logo"
              width={120}
              height={120}
              className="mb-4"
            />
            <p className="text-sm text-gray-300">
              Nouvelle vision pour le developpement economique des citoyens haitiens.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-gray-300 hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/#team" className="text-gray-300 hover:text-white transition-colors">
                  Équipe
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-gray-300 text-sm">
              NOVIDECH MITUELLE LLC
              <br />
              Aider les gens à grandir leur économie
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} NOVIDECH MITUELLE LLC. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}



