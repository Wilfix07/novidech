import Image from 'next/image';

export default function About() {
  return (
    <section id="about" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-text mb-12">
            À propos de NOVIDECH MITUELLE LLC
          </h2>

          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <div>
              <h3 className="text-2xl font-semibold text-text mb-4">Notre Mission</h3>
              <p className="text-text mb-4">
                Aider les gens à grandir leur économie. Nous croyons en la puissance de la
                solidarité et de l&apos;entraide pour créer un avenir économique meilleur pour tous les
                citoyens haïtiens.
              </p>
            </div>
            <div className="relative h-64 md:h-80 rounded-lg overflow-hidden">
              <Image
                src="https://vhutqkvadxpjijsvoqgr.supabase.co/storage/v1/object/public/project-images/features/d2i9rsen00r-1764484118284.jpg"
                alt="Feature image"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-2xl font-semibold text-text mb-4">Nos Objectifs</h3>
            <p className="text-text">
              Recevoir tous les data d&apos;un mituelle de solidarite, pour les membres puisse voir en
              temps reel leurs transactions. Nous offrons une plateforme transparente et moderne
              qui permet à chaque membre de suivre ses contributions, prêts et transactions en
              temps réel.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

