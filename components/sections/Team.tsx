export default function Team() {
  return (
    <section id="team" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-text mb-12">
          Notre Équipe
        </h2>
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-text text-lg mb-8">
            L&apos;équipe de NOVIDECH MITUELLE LLC est dédiée à servir nos membres avec intégrité et
            transparence.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Placeholder for team members - can be populated with actual data later */}
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="w-24 h-24 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl">
                👤
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">Équipe</h3>
              <p className="text-gray-600">Membre de l&apos;équipe</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="w-24 h-24 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl">
                👤
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">Équipe</h3>
              <p className="text-gray-600">Membre de l&apos;équipe</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="w-24 h-24 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl">
                👤
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">Équipe</h3>
              <p className="text-gray-600">Membre de l&apos;équipe</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

